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
import { useGlobalContext, WebScreen } from "../../context/GlobalContext";
import { Images } from "../../utlities/images";

/** Configuration for navigation menu items */
const menuItems = [
  { id: "map", type: WebScreen.DASHBOARD, icon: MdDashboard, label: "Dashboard", route: "/" },
  {
    id: "bikes",
    type: WebScreen.BIKES,
    icon: MdElectricBike,
    label: "Quản Lý Xe",
    route: "/bikes",
    subItems: [
      {
        id: "bike-detail",
        type: WebScreen.BIKE_DETAIL,
        icon: MdElectricBike,
        label: "Bike Detail",
        route: "/bike",
      },
    ],
  },
  {
    id: "trips",
    type: WebScreen.TRIPS,
    icon: MdBikeScooter,
    label: "Quản Lý Hành Tình",
    route: "/trips",
    subItems: [
      {
        id: "trip-detail",
        type: WebScreen.TRIP_DETAIL,
        icon: MdBikeScooter,
        label: "Trip Detail",
        route: "/trip",
      },
    ],
  },
  { id: "alert", icon: MdWarning, label: "Cảnh Báo", route: "/alerts" },
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
      <div className={styles["header"]}>
        <img
          src={Images.appLogo}
          alt="GoScoot Logo"
          className={styles["logo"]}
        />
      </div>
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

              {subItems && (
                <ul className={styles["submenu"]}>
                  {subItems.map(
                    ({
                      id: subId,
                      type,
                      icon: SubIcon,
                      label: subLabel,
                      route: subRoute,
                    }) => {
                      if (globalContext.currentPage === type){
                      return (
                        <li key={subId}>
                          <div
                            className={[
                              styles["nav-item"],
                              styles["sub-item"],
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <SubIcon className={styles["nav-icon"]} size={24} />
                            <span>{subLabel}</span>
                          </div>
                        </li>
                      );
                      }
                      


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