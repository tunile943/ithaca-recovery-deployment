"use client";  // Mark this component as a Client Component

import React, { useContext } from "react";
import Link from "next/link";
import Logo from "./logo"
import type { AccountInfo } from "@azure/msal-node";
import styles from "../../../../styles/Navbar.module.scss"

interface NavbarProps {
  account: AccountInfo | null;
  setShowSignIn?: (val: boolean) => void;
}


const Navbar: React.FC<NavbarProps> = ({ account, setShowSignIn }) => {
  return (
    <>
      <div className={styles.navbar}>
        <div className={styles.navcontainer}>
          <Logo />
          <ul className={styles.navigationlist}>
            <li className="btn btn-ghost">
              <Link href="/meetings">
                <p>Meetings</p>
              </Link>
            </li>
            <li className="btn btn-ghost">
              <Link href="/createmeeting">
                <p>Create a Meeting</p>
              </Link>
            </li>
            <li className="btn btn-ghost">
              <Link href="/test">
                <p>Testing Endpoints</p>
              </Link>
            </li>
            {!account && (
              <li className="btn btn-ghost">
                <a onClick={() => setShowSignIn && setShowSignIn(true)}>
                  <p>Sign In</p>
                </a>
              </li>
            )}
          </ul>
          {account && (
            <div className={styles.welcome}>
              <p>Welcome, {account.name}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;