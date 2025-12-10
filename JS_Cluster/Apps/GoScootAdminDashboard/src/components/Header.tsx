/**
 * Header Component
 * Reusable header bar for the admin dashboard
 * Displays logo, page title, and user profile information
 */

import { MdAccountCircle } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import { useNotifications } from "../context/NotificationContext";
import "./Header.css";
import { useNavigate } from "react-router-dom";

/** Props for the Header component */
interface HeaderProps {
  /** Page title to display in the header */
  title: string;
}

/**
 * Header component with logo, title, and user profile
 * Used across all pages for consistent branding
 */
export default function Header({ title }: HeaderProps) {
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-left">
        <img src="/Mobile App Logo.png" alt="GoScoot Logo" className="logo" />
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="notification-wrapper">
          <IoNotificationsOutline className="bell-icon" size={28} />

          {notifications.length > 0 && (
            <span className="notif-badge">{notifications.length}</span>
          )}

          <div className="notif-dropdown">
            {notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.slice(0, 5).map((n: any) => (
                <div key={n.id} className="notif-item" onClick={() => navigate("/alert")}>
                  <strong>{n.time}</strong>
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="user-profile">
          <MdAccountCircle className="user-icon" size={32} />
          <span>User's Name</span>
        </div>
      </div>
    </header>
  );
}
