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
import "./Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

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
  { id: "alert", icon: MdWarning, label: "Alert", route: "/alert" },
];

/**
 * Sidebar navigation component
 * Renders a vertical navigation menu with icons and labels
 */
export default function Sidebar() {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null); // tracks which parent is open

  return (
    <aside className="sidebar">
      <nav className="nav-menu">
        {menuItems.map(({ id, icon: Icon, label, subItems, route }) => (
          <div
            key={id}
            onMouseEnter={() => subItems && setOpenMenu(id)}
            onMouseLeave={() => subItems && setOpenMenu(null)}
          >
            <Link
              key={id}
              to={route}
              className={`nav-item ${
                location.pathname === route ? "active" : ""
              }`}
              onClick={() => {
                if (!subItems) setOpenMenu(null);
              }}
            >
              <Icon className="nav-icon" size={24} />
              <span>{label}</span>
            </Link>
            {subItems && openMenu === id && (
              <ul className="submenu">
                {subItems.map(
                  ({
                    id: subId,
                    icon: Icon,
                    label: subLabel,
                    route: subRoute,
                  }) => (
                    <li key={subId}>
                      <Link
                        to={subRoute}
                        className={`nav-item sub-item ${
                          location.pathname === subRoute ? "active" : ""
                        }`}
                      >
                        <Icon className="nav-icon" size={24} />
                        <span>{subLabel}</span>
                      </Link>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        ))}
      </nav>
      <Link to="/login" className="nav-item logout">
        <MdLogout className="nav-icon" size={24} />
        <span>Logout</span>
      </Link>
    </aside>
  );
}
