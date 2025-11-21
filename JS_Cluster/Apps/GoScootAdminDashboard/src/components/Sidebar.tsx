/**
 * Sidebar Component
 * Reusable navigation sidebar for the admin dashboard
 * Displays menu items with icons and handles page navigation
 */

import { MdDashboard, MdDirectionsBike, MdBuild, MdDirectionsCar, MdDescription, MdWarning, MdLogout } from 'react-icons/md';

/** Props for the Sidebar component */
interface SidebarProps {
  /** Callback function to handle navigation to different pages */
  onNavigate: (page: string) => void;
  /** Currently active page identifier */
  activePage: string;
}

/** Configuration for navigation menu items */
const menuItems = [
  { id: 'map', icon: MdDashboard, label: 'Dashboard' },
  { id: 'bikes', icon: MdDirectionsBike, label: 'Bikes' },
  { id: 'bike-detail', icon: MdBuild, label: 'Bike Detail', subItem: true },
  { id: 'trips', icon: MdDirectionsCar, label: 'Trips' },
  { id: 'trip-detail', icon: MdDescription, label: 'Trip Detail', subItem: true },
  { id: 'alert', icon: MdWarning, label: 'Alert' },
];

/**
 * Sidebar navigation component
 * Renders a vertical navigation menu with icons and labels
 */
export default function Sidebar({ onNavigate, activePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="nav-menu">
        {menuItems.map(({ id, icon: Icon, label, subItem }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`nav-item ${subItem ? 'sub-item' : ''} ${activePage === id ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={24} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button onClick={() => onNavigate('logout')} className="nav-item logout">
        <MdLogout className="nav-icon" size={24} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
