/**
 * BikeDetailPopup Component
 * 
 * Displays detailed information about a bike when user clicks on a marker
 * Shows:
 * - Bike ID
 * - Battery status with color coding (green > 20%, red ≤ 20%)
 * - Operation status (Normal, Out of bound, Low battery)
 * - Usage status (Idle, Reserved, Inused)
 * 
 * Appears as a floating card on the map
 * User can close it by clicking the X button
 */

import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { MdBatteryFull, MdClose, MdDirectionsBike, MdInfo, MdSettings, MdPerson, MdWarning } from 'react-icons/md';
import './BikeDetailPopup.css';
import WarningBang from '../ui/WarningBang';
import { getStatusText } from '../../utlities/methods';
import { useGlobalContext } from '../../context/GlobalContext';
import { useBikeManagementContext } from '../../context/BikeManagementContext';
import { useNavigate } from 'react-router-dom';

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

  const globalContext = useGlobalContext()
  const bikeManagementContext = useBikeManagementContext()
  const navigate = useNavigate()

  // Get operation status color (original preferred colors)
  const getOperationStatusColor = () => {
    if (bike.isCrashed || bike.batteryIsLow || bike.isOutOfBound || bike.isToppled) {
      return '#4CAF50';
    } else {
      return '#F44336'
    }

  };

  // Get usage status color (original preferred colors)
  const getUsageStatusColor = (status: string) => {
    switch (status) {
      case 'Idle': return '#4CAF50';
      case 'Reserved': return '#FF9800';
      case 'Inused': return '#2196F3';
      default: return '#757575';
    }
  };

  return (
    <div className="bike-detail-popup">
      {/* Header: Title and Close Button */}
      <div className="popup-header">
        <div className="popup-title">
          {/* Dual-colored bike icon matching map marker */}
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: `linear-gradient(90deg, ${getOperationStatusColor()} 50%, ${getUsageStatusColor(bike.usageStatus)} 50%)`,
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            marginRight: '4px'
          }} />
          <MdDirectionsBike size={24} color="white" />
          <a
            className='bikeLink'
            onClick={() => {
              bikeManagementContext.setCurrentBike(null);
              bikeManagementContext.setCurrentBikeId(bike.id);
              navigate("/bike");
            }}
          >
            <h3>Bike {bike.id}</h3>
          </a>

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

        {/* Row 3: Operation Status */}

        <div className="detail-row">
          <div className="detail-icon">
            <MdWarning size={20} />
          </div>

          <div className="detail-info">
            <span className="detail-label">Cảnh Báo Pin</span>
            <WarningBang on={bike.batteryIsLow}></WarningBang>
          </div>
        </div>


        <div className="detail-row">
          <div className="detail-icon">
            <MdWarning size={20} />
          </div>
          <div className="detail-info">
            <span className="detail-label">Cảnh Báo Va Chạm</span>
            <WarningBang on={bike.isCrashed}></WarningBang>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-icon">
            <MdWarning size={20} />
          </div>

          <div className="detail-info">
            <span className="detail-label">Cảnh Báo Ngoài Phạm Vi</span>
            <WarningBang on={bike.isOutOfBound}></WarningBang>
          </div>
        </div>


        <div className="detail-row">
          <div className="detail-icon">
            <MdWarning size={20} />
          </div>

          <div className="detail-info">
            <span className="detail-label">Cảnh Báo Đổ Ngã</span>
            <WarningBang on={bike.isToppled}></WarningBang>
          </div>
        </div>




        {/* Row 4: Usage Status */}
        <div className="detail-row">
          <div className="detail-icon">
            <MdPerson size={20} style={{ color: getUsageStatusColor(bike.usageStatus) }} />
          </div>
          <div className="detail-info">
            <span className="detail-label">Usage</span>
            <span className="detail-value" style={{ color: getUsageStatusColor(bike.usageStatus), fontWeight: 'bold' }}>
              {getStatusText(bike.usageStatus)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BikeDetailPopup;
