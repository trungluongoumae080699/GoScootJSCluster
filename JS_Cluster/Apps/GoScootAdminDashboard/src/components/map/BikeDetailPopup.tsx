/**
 * BikeDetailPopup Component
 * 
 * Displays detailed information about a bike when user clicks on a marker
 * Shows:
 * - Bike ID
 * - Battery status with color coding (green > 20%, red ≤ 20%)
 * 
 * Appears as a floating card on the map
 * User can close it by clicking the X button
 */

import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { MdBatteryFull, MdClose, MdDirectionsBike, MdInfo } from 'react-icons/md';
import './BikeDetailPopup.css';

interface BikeDetailPopupProps {
  /** Bike data to display */
  bike: BikeUpdate;
  /** Callback to close the popup */
  onClose: () => void;
}

function BikeDetailPopup({ bike, onClose }: BikeDetailPopupProps) {
  // Determine battery color: Green if > 20%, Red if low
  const batteryColor = bike.battery_status > 20 ? '#4CAF50' : '#F44336';
  
  // Choose icon based on battery level
  const batteryIcon = bike.battery_status > 20 ? '🔋' : '⚠️';

  return (
    <div className="bike-detail-popup">
      {/* Header: Title and Close Button */}
      <div className="popup-header">
        <div className="popup-title">
          <MdDirectionsBike size={24} color="#2196F3" />
          <h3>Bike {bike.id}</h3>
        </div>
        <button className="close-btn" onClick={onClose} title="Close">
          <MdClose size={20} />
        </button>
      </div>

      {/* Content: Bike Details */}
      <div className="popup-content">
        {/* Row 1: Bike ID */}
        <div className="detail-row">
          <div className="detail-icon">
            <MdInfo size={20} color="#2196F3" />
          </div>
          <div className="detail-info">
            <span className="detail-label">Bike ID</span>
            <span className="detail-value">{bike.id}</span>
          </div>
        </div>

        {/* Row 2: Battery Status */}
        <div className="detail-row">
          <div className="detail-icon">
            {/* Battery icon color matches battery level */}
            <MdBatteryFull size={20} style={{ color: batteryColor }} />
          </div>
          <div className="detail-info">
            <span className="detail-label">Battery</span>
            {/* Battery percentage with color and icon */}
            <span className="detail-value" style={{ color: batteryColor, fontWeight: 'bold' }}>
              {batteryIcon} {bike.battery_status}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BikeDetailPopup;
