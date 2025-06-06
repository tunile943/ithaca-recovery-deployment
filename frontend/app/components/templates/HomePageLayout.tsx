"use client";
import React, { useState, useEffect } from "react";
import styles from "../../../styles/HomePageLayout.module.scss";
import CalendarNavbar from "../organisms/CalendarNavbar";
import CalendarSidebar from "../organisms/CalendarSidebar";
import ViewMeetingDetails from "../organisms/ViewMeeting";
import EditMeetingSidebar from "../organisms/EditMeeting";
import DailyView from "../organisms/DailyView";

import WeeklyView from "../organisms/WeeklyView";
import { convertUTCToET } from "../../../util/timeUtils";
import { IMeeting } from "../../../util/models";

const HomePage = () => {
  // Add state for login status - default to logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated);
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<IMeeting | null>(null);
  const [selectedMeetingID, setSelectedMeetingID] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string>("Day");
  const [selectedNewMeeting, setSelectedNewMeeting] = useState<boolean | null>(false);
  const [showEditMeeting, setShowEditMeeting] = useState(false);
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null);

  const fetchMeetingDetails = async (meetingId: string) => {
    try {
      const response = await fetch(`/api/retrieve/meeting/${meetingId}`, { method: 'GET' });
      if (response.ok) {
        const data: IMeeting = await response.json();
        setSelectedMeeting(data);
        // Store the date that was clicked when the meeting was selected
        setLastClickedDate(new Date(selectedDate));
      } else {
        console.error("Failed to fetch meeting details");
      }
    } catch (error) {
      console.error('Error fetching meeting details:', error);
    }
  };

  useEffect(() => {
    if (selectedMeetingID) {
      fetchMeetingDetails(selectedMeetingID);
    } else {
      setSelectedMeeting(null);
      setLastClickedDate(null);
    }
  }, [selectedMeetingID]);

  const handleBack = () => {
    setSelectedMeeting(null);
    setSelectedMeetingID(null);
    setSelectedNewMeeting(false);
    setLastClickedDate(null);
  };

  const handleOpenEdit = () => {
    setShowEditMeeting(true);
  };

  const handleCloseEdit = () => {
    setShowEditMeeting(false);
  };

  const handleCloseNewMeeting = () => {
    setSelectedNewMeeting(false);
  };

  const handleDelete = async (mid: string, deleteOption?: 'this' | 'thisAndFollowing' | 'all') => {
    try {
      const response = await fetch('/api/delete/meeting', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mid
        }),
      });
  
      if (!response.ok) {
        alert("Error : Unsuccessful delete")
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSelectedMeeting(null);
      setSelectedMeetingID(null);
      setLastClickedDate(null);
      // const tempDate = new Date(selectedDate);
      // setSelectedDate(new Date(tempDate.getTime() + 1));
      // setTimeout(() => {
      //   setSelectedDate(tempDate);
      // }, 100);
      alert("Meeting deleted successfully! Please check the Meeting collection on MongoDB.")
    } catch (error) {
      console.error('There was an error fetching the data:', error);
    }
  };

  const [filters, setFilters] = useState({
    SerenityRoom: true,
    SeedsofHope: true,
    UnityRoom: true,
    RoomforImprovement: true,
    SmallbutPowerfulRight: true,
    SmallbutPowerfulLeft: true,
    ZoomAccount1: true,
    ZoomAccount2: true,
    ZoomAccount3: true,
    ZoomAccount4: true,
    AA: true,
    AlAnon: true,
    Other: true,
    InPerson: true,
    Hybrid: true,
    Remote: true,
  });
  const handleMeetingSelect = (meetingId: string) => {
    setSelectedMeetingID(meetingId);
    setLastClickedDate(new Date(selectedDate));
  };

  const convertESTStringToDate = (estDateString: string): Date => {
    // Extract date and time parts from the EST string (e.g., "04/09/2025, 06:00:00 AM")
    const [datePart, timePart] = estDateString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    const [seconds, period] = second.split(' '); // Extract AM/PM

    // Convert hour from 12-hour format to 24-hour format
    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Build a formatted ISO date string and create a Date object
    const isoDateString = `${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minute}:${seconds}`;
    return new Date(isoDateString);
  };

  return (
    <div className={styles.container}>
      {isLoggedIn && (
        <div className={styles.sidebar}>
          {showEditMeeting && selectedMeeting ? (
            <EditMeetingSidebar
              meeting={selectedMeeting}
              onClose={handleCloseEdit}
              onUpdateSuccess={() => {
                console.log("Meeting updated!");
                // Refresh the meeting data after successful update
                if (selectedMeeting.mid) {
                  fetchMeetingDetails(selectedMeeting.mid);
                }
              }}
            />) :
            selectedMeeting ? (
              //           <ViewMeetingDetails
          //   id={selectedMeeting.id}
          //   mid={selectedMeeting.mid}
          //   title={selectedMeeting.title}
          //   description={selectedMeeting.description}
          //   creator={selectedMeeting.creator}
          //   group={selectedMeeting.group}
          //   startDateTime={new Date(selectedMeeting.startDateTime)}
          //   endDateTime={new Date(selectedMeeting.endDateTime)}
          //   zoomAccount={selectedMeeting.zoomAccount}
          //   zoomLink={selectedMeeting.zoomLink}
          //   zid={selectedMeeting.zid}
          //   type={selectedMeeting.type}
          //   room={selectedMeeting.room}
          //   recurrence={selectedMeeting.recurrence}
          //   isRecurring={selectedMeeting.isRecurring ?? false}
          //   recurrencePattern={selectedMeeting.recurrencePattern}
          //   currentOccurrenceDate={lastClickedDate || undefined} // Pass the date when the meeting was clicked
          //   onBack={handleBack}
          //   onEdit={handleEdit}
          //   onDelete={handleDelete} 
          // />    
              <ViewMeetingDetails
                mid={selectedMeeting.mid}
                title={selectedMeeting.title}
                description={selectedMeeting.description}
                creator={selectedMeeting.creator}
                group={selectedMeeting.group}

                startDateTime={convertESTStringToDate(
                  convertUTCToET(
                    selectedMeeting.startDateTime instanceof Date
                      ? selectedMeeting.startDateTime.toISOString()
                      : selectedMeeting.startDateTime
                  )
                )}

                endDateTime={convertESTStringToDate(
                  convertUTCToET(
                    selectedMeeting.endDateTime instanceof Date
                      ? selectedMeeting.endDateTime.toISOString()
                      : selectedMeeting.endDateTime
                  )
                )}

                email={selectedMeeting.email}

                zoomAccount={selectedMeeting.zoomAccount}
                zoomLink={selectedMeeting.zoomLink}
                zid={selectedMeeting.zid}
                modeType={selectedMeeting.modeType}
                calType={selectedMeeting.calType}
                room={selectedMeeting.room}
                isRecurring={selectedMeeting.isRecurring ?? false}
                recurrencePattern={selectedMeeting.recurrencePattern || undefined}
                currentOccurrenceDate={lastClickedDate || undefined} // Pass the date when the meeting was clicked
                onBack={handleBack}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ) : (
              <CalendarSidebar
                filters={filters}
                setFilters={setFilters}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate} />
            )}
        </div>
      )}
      <div className={styles.primaryCalendar}>
        <CalendarNavbar
          selectedDate={selectedDate}
          onPreviousDay={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
          onNextDay={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
          onToday={() => (setSelectedDate(new Date()))}
          onDateChange={setSelectedDate}
          onViewChange={setSelectedView}
        />
        {selectedView === "Day" ? (
          <DailyView
            filters={filters}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setSelectedMeetingID={setSelectedMeetingID}
            setSelectedNewMeeting={setSelectedNewMeeting}
          />
        ) : (
          <WeeklyView
            filters={filters}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setSelectedMeetingID={setSelectedMeetingID}
            setSelectedNewMeeting={setSelectedNewMeeting}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
