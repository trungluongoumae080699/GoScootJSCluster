import { MdAccountCircle } from "react-icons/md";
import { IoNotificationsOutline } from "react-icons/io5";
import styles from "./Header.module.css";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { Images } from "../../utlities/images";

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
    <header className={styles["header"]}>
      <div className={styles["header-left"]}>
        <img
          src={Images.appLogo}
          alt="GoScoot Logo"
          className={styles["logo"]}
        />
        <h1 className={styles["page-title"]}>{title}</h1>
      </div>

      <div className={styles["header-right"]}>
        <div className={styles["notification-wrapper"]}>
          <IoNotificationsOutline
            className={styles["bell-icon"]}
            size={28}
          />

          {notifications.length > 0 && (
            <span className={styles["notif-badge"]}>
              {notifications.length}
            </span>
          )}

          <div className={styles["notif-dropdown"]}>
            {notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.slice(0, 5).map((n: any) => (
                <div
                  key={n.id}
                  className={styles["notif-item"]}
                  onClick={() => navigate("/alert")}
                >
                  <strong>{n.time}</strong>
                  <p>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles["user-profile"]}>
          <MdAccountCircle
            className={styles["user-icon"]}
            size={32}
          />
          <span>User&apos;s Name</span>
        </div>
      </div>
    </header>
  );
}