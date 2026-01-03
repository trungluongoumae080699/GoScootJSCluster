/**
 * Sidebar Component
 * Reusable navigation sidebar for the admin dashboard
 * Displays menu items with icons and handles page navigation
 */

import {
  MdDashboard,
  MdElectricBike,
  MdBikeScooter,
  MdWarning,
  MdLogout,
} from "react-icons/md";
import styles from "./Sidebar.module.css";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useGlobalContext } from "../../context/GlobalContext";

/** Configuration for navigation menu items */
const menuItems = [
  { id: "map", icon: MdDashboard, label: "Dashboard", route: "/" },
  {
    id: "bikes",
    icon: MdElectricBike,
    label: "Bikes",
    route: "/bikes",
    subItems: [
      {
        id: "bike-detail",
        icon: MdElectricBike,
        label: "Bike Detail",
        route: "/bike-detail",
      },
    ],
  },
  {
    id: "trips",
    icon: MdBikeScooter,
    label: "Trips",
    route: "/trips",
    subItems: [
      {
        id: "trip-detail",
        icon: MdBikeScooter,
        label: "Trip Detail",
        route: "/trip-detail",
      },
    ],
  },
  { id: "alert", icon: MdWarning, label: "Alert", route: "/alerts" },
];

/**
 * Sidebar navigation component
 * Renders a vertical navigation menu with icons and labels
 */
export default function Sidebar() {
  const location = useLocation();
  const globalContext = useGlobalContext();
  const [openMenu, setOpenMenu] = useState<string | null>(null); // tracks which parent is open

  return (
    <aside className={styles["sidebar"]}>
      <nav className={styles["nav-menu"]}>
        {menuItems.map(({ id, icon: Icon, label, subItems, route }) => {
          const isActive = location.pathname === route;

          return (
            <div
              key={id}
              onMouseEnter={() => subItems && setOpenMenu(id)}
              onMouseLeave={() => subItems && setOpenMenu(null)}
            >
              <Link
                to={route}
                className={[
                  styles["nav-item"],
                  isActive ? styles["active"] : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  if (!subItems) setOpenMenu(null);
                }}
              >
                <Icon className={styles["nav-icon"]} size={24} />
                <span>{label}</span>
              </Link>

              {subItems && openMenu === id && (
                <ul className={styles["submenu"]}>
                  {subItems.map(
                    ({
                      id: subId,
                      icon: SubIcon,
                      label: subLabel,
                      route: subRoute,
                    }) => {
                      const isSubActive = location.pathname === subRoute;

                      return (
                        <li key={subId}>
                          <Link
                            to={subRoute}
                            className={[
                              styles["nav-item"],
                              styles["sub-item"],
                              isSubActive ? styles["active"] : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <SubIcon className={styles["nav-icon"]} size={24} />
                            <span>{subLabel}</span>
                          </Link>
                        </li>
                      );
                    }
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <Link
        to="/login"
        className={[styles["nav-item"], styles["logout"]].join(" ")}
      >
        <MdLogout className={styles["nav-icon"]} size={24} />
        <span>Logout</span>
      </Link>
    </aside>
  );
}