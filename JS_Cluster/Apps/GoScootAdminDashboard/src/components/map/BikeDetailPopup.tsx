/**
 * BikeDetailPopup Component
 * Shows bike details when clicking on a marker
 */

import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { MdBatteryFull, MdClose, MdDirectionsBike, MdInfo } from 'react-icons/md';
import './BikeDetailPopup.css';

interface BikeDetailPopupProps {
  bike: BikeUpdate;
  onClose: () => void;
}

function BikeDetailPopup({ bike, onClose }: BikeDetailPopupProps) {
  const batteryColor = bike.battery_status > 20 ? '#4CAF50' : '#F44336';
  const batteryIcon = bike.battery_status > 20 ? '🔋' : '⚠️';

  return (
    <div className="bike-detail-popup">
      <div className="popup-header">
        <div className="popup-title">
          <MdDirectionsBike size={24} color="#2196F3" />
          <h3>Bike {bike.id}</h3>
        </div>
        <button className="close-btn" onClick={onClose} title="Close">
          <MdClose size={20} />
        </button>
      </div>

      <div className="popup-content">
        {/* Bike ID */}
        <div className="detail-row">
          <div className="detail-icon">
            <MdInfo size={20} color="#2196F3" />
          </div>
          <div className="detail-info">
            <span className="detail-label">Bike ID</span>
            <span className="detail-value">{bike.id}</span>
          </div>
        </div>

        {/* Battery Status */}
        <div className="detail-row">
          <div className="detail-icon">
            <MdBatteryFull size={20} style={{ color: batteryColor }} />
          </div>
          <div className="detail-info">
            <span className="detail-label">Battery</span>
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
