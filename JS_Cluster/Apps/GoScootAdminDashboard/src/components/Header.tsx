/**
 * Header Component
 * Reusable header bar for the admin dashboard
 * Displays logo, page title, and user profile information
 */

import { MdAccountCircle } from 'react-icons/md';
import './Header.css';

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
  return (
    <header className="header">
      <div className="header-left">
        <img src="/Mobile App Logo.png" alt="GoScoot Logo" className="logo" />
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="header-right">
        <div className="user-profile">
          <MdAccountCircle className="user-icon" size={32} />
          <span>User's Name</span>
        </div>
      </div>
    </header>
  );
}
