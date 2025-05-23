import React, { useEffect, useState } from "react";
import styles from '../../../../styles/organisms/WeeklyView.module.scss';
import WeeklyViewColumn from "../../molecules/WeeklyViewColumn";

type Meeting = {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    date: string; // Added date field to track which day the meeting belongs to
    tags: string[];
    room: string; // Added room property to fix the error
};

type Room = {
    name: string;
    primaryColor: string;
    meetings: Meeting[];
};

const meetingCache = new Map<string, Meeting[]>();

const fetchMeetingsByWeek = async (startDate: Date, endDate: Date): Promise<Meeting[]> => {
    const formattedStart = startDate.toISOString().split('T')[0];
    const formattedEnd = endDate.toISOString().split('T')[0];
    const cacheKey = `${formattedStart}-${formattedEnd}`;

    if (meetingCache.has(cacheKey)) {
        console.log("Using cached data for week:", cacheKey);
        return meetingCache.get(cacheKey) || [];
    }

    console.log("Fetching meetings for week:", cacheKey);

    try {
        const response = await fetch(`/api/retrieve/meeting/week?startDate=${formattedStart}&endDate=${formattedEnd}`);
        const data = await response.json();
        console.log("Raw API response:", data);

        const meetings: Meeting[] = data.map((meeting: any) => {
            const start = new Date(meeting.startDateTime.replace("Z", ""));
            const end = new Date(meeting.endDateTime.replace("Z", ""));

            return {
                id: meeting.mid,
                title: meeting.title,
                startTime: start.toLocaleTimeString("en-GB", { hour12: false }),
                endTime: end.toLocaleTimeString("en-GB", { hour12: false }),
                date: start.toISOString().split('T')[0], // Store the date of the meeting
                tags: [meeting.type, meeting.group],
                room: meeting.room,
            };
        });

        meetingCache.set(cacheKey, meetings);
        return meetings;
    } catch (error) {
        console.error("Error fetching weekly meetings:", error);
        return [];
    }
};

// Get the first day (Sunday) of the week containing the provided date
const getFirstDayOfWeek = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
};

// Generate an array of dates for the entire week
const getDaysOfWeek = (startDate: Date): Date[] => {
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date;
    });
};

// Format date to display in column header - just return the day number
const formatDateNumber = (date: Date): string => {
    return date.getDate().toString();
};

// Format day name - just 3 letter abbreviation
const formatDayName = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
};

// Default room colors
const roomColors: { [key: string]: string } = {
    'Serenity Room': '#b3ea75',
    'Seeds of Hope': '#f7e57b',
    'Unity Room': '#96dbfe',
    'Room for Improvement': '#ffae73',
    'Small but Powerful - Right': '#d2afff',
    'Small but Powerful - Left': '#ffa3c2',
    'Zoom Account 1': '#cecece',
    'Zoom Account 2': '#cecece',
    'Zoom Account 3': '#cecece',
    'Zoom Account 4': '#cecece',
};

interface WeeklyViewProps {
    filters: any;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    setSelectedMeetingID: (meetingId: string) => void;
    setSelectedNewMeeting: (newMeetingExists: boolean) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
    filters,
    selectedDate,
    setSelectedDate,
    setSelectedMeetingID,
    setSelectedNewMeeting
}) => {
    const [currentTimePosition, setCurrentTimePosition] = useState(0);
    const [weekStartDate, setWeekStartDate] = useState<Date>(getFirstDayOfWeek(selectedDate));
    const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
    const [daysOfWeek, setDaysOfWeek] = useState<Date[]>(getDaysOfWeek(weekStartDate));

    // Format time slots for hour markers
    const formatTime = (hour: number): string => {
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 || 12;
        return `${formattedHour} ${period}`;
    };

    const timeSlots = Array.from({ length: 24 }, (_, i) => formatTime(i));

    // Update the week when selected date changes
    useEffect(() => {
        const newWeekStartDate = getFirstDayOfWeek(selectedDate);
        setWeekStartDate(newWeekStartDate);
        setDaysOfWeek(getDaysOfWeek(newWeekStartDate));
    }, [selectedDate]);

    // Fetch meetings for the entire week
    useEffect(() => {
        const fetchWeekMeetings = async () => {
            const endDate = new Date(weekStartDate);
            endDate.setDate(weekStartDate.getDate() + 6);

            const meetings = await fetchMeetingsByWeek(weekStartDate, endDate);
            setAllMeetings(meetings);
        };

        fetchWeekMeetings();
        updateTimePosition();

        const intervalId = setInterval(updateTimePosition, 60000);
        return () => clearInterval(intervalId);
    }, [weekStartDate]);

    // Update current time indicator position
    const updateTimePosition = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const basePosition = currentHour * 100 + currentMinutes * (100 / 60);
        const offset = 40; // height of .dayHeader
        setCurrentTimePosition(basePosition + offset);
    };

    // Get meetings for a specific day, filtered by room if applicable
    const getMeetingsForDay = (date: Date) => {
        const formattedDate = date.toISOString().split('T')[0];

        // Filter meetings by date and apply room filters
        const filteredMeetings = allMeetings.filter(meeting => {
            const matchesDate = meeting.date === formattedDate;
            const room = meeting.room;

            // Check if room is in filters
            const roomKey = room.replace(/[-\s]+/g, '').replace(/\s+/g, '');
            const isRoomIncluded = filters[roomKey] !== false;

            return matchesDate && isRoomIncluded;
        });

        // Group meetings by time to handle overlapping events
        const meetingsByTime: { [key: string]: Meeting[] } = {};
        filteredMeetings.forEach(meeting => {
            const timeKey = `${meeting.startTime}-${meeting.endTime}`;
            if (!meetingsByTime[timeKey]) {
                meetingsByTime[timeKey] = [];
            }
            meetingsByTime[timeKey].push(meeting);
        });

        // Process overlapping meetings to position them side-by-side
        const processedMeetings: Meeting[] = [];
        Object.values(meetingsByTime).forEach(overlappingMeetings => {
            if (overlappingMeetings.length > 1) {
                // Calculate width adjustment for overlapping meetings
                const totalMeetings = overlappingMeetings.length;
                overlappingMeetings.forEach((meeting, index) => {
                    // Clone the meeting to avoid modifying the original
                    const processedMeeting = { ...meeting };
                    // Add metadata for rendering position
                    (processedMeeting as any).positionIndex = index;
                    (processedMeeting as any).totalOverlapping = totalMeetings;
                    processedMeetings.push(processedMeeting);
                });
            } else if (overlappingMeetings.length === 1) {
                // If it's a single meeting, no adjustments needed
                processedMeetings.push(overlappingMeetings[0]);
            }
        });

        return processedMeetings;
    };

    // Get room color for a meeting
    const getRoomColor = (meeting: Meeting) => {
        return roomColors[meeting.room] || "#cecece"; // Default to gray if room not found
    };

    // Check if a date is the current date
    const isCurrentDate = (date: Date): boolean => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <div className={styles.outerContainer}>
            <div className={styles.viewContainer}>
                {/* Time column */}
                <div className={styles.timeColumn}>
                    <div className={styles.timeHeader}>
                        {/* Empty cell for alignment */}
                    </div>
                    <div className={styles.timeSlots}>
                        {timeSlots.map((time, index) => (
                            <div key={index} className={styles.timeSlot}>
                                {time}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day columns */}
                <div className={styles.daysContainer}>
                    {daysOfWeek.map((day, index) => {
                        const dayMeetings = getMeetingsForDay(day);
                        const isToday = isCurrentDate(day);

                        // Create a custom header that only contains the day info directly
                        const customHeader = (
                            <div className={styles.dayHeader}>
                                <span className={styles.dayName}>{formatDayName(day)}</span>
                                {" "}
                                <span className={isToday ? styles.currentDate : styles.dateNumber}>
                                    {formatDateNumber(day)}
                                </span>
                            </div>
                        );

                        return (
                            <div
                                key={index}
                                className={styles.dayColumn}
                                onClick={() => {
                                    // When clicking on a day column, update the selected date
                                    setSelectedDate(day);
                                }}
                            >
                                {/* Only render our custom header */}
                                {customHeader}

                                {/* Preserve original meeting layout but pass customHeader to avoid double headers */}
                                <WeeklyViewColumn
                                    dayName=""  // Empty string to prevent WeeklyViewColumn from rendering its own header
                                    date=""     // Empty string for the same reason
                                    roomColor="#cecece" // Default color
                                    meetings={dayMeetings.map(meeting => ({
                                        ...meeting,
                                        primaryColor: getRoomColor(meeting)
                                    }))}
                                    setSelectedMeetingID={setSelectedMeetingID}
                                    setSelectedNewMeeting={setSelectedNewMeeting}
                                />

                                {/* Current time indicator - only show for current day */}
                                {isToday && (
                                    <div
                                        className={styles.currentTimeIndicator}
                                        style={{ top: `${currentTimePosition}px` }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;