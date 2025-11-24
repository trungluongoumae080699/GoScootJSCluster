

import { useState, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MdBatteryFull } from 'react-icons/md';
import { getVehicleById } from './vehicleAnimation';
import { useMapAnimation } from './hooks/useMapAnimation';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './BikeDetails.css';

/** Default bike location (Saigon center) */
const BIKE_LOCATION: [number, number] = [106.6297, 10.8231];

/** Props for BikeDetails component */
interface BikeDetailsProps {
  /** Callback to navigate to other pages, optionally with bike location */
  onNavigate: (page: string, bikeLocation?: [number, number]) => void;
}

/** Mock trip data - will be replaced with API data in production */
const trips = Array(6).fill(null).map((_, i) => ({
  id: i + 1,
  customerId: '123456789',
  dateRange: '1/11/2025 - 2/11/2025',
}));

/** Mock movement history data - will be replaced with API data in production */
const movementHistory = Array(8).fill(null).map((_, i) => {
  const date = new Date(2025, 0, 21 + i, 10 + i, 30 + i * 5);
  return {
    id: i + 1,
    batteryStatus: `${100 - i * 5}%`,
    location: `106.${6297 + i * 10}, 10.${8231 + i * 5}`,
    timestamp: date.toISOString().replace('T', ' ').substring(0, 19),
  };
});

/**
 * BikeDetails component
 * Main page showing comprehensive bike information and live tracking
 */
function BikeDetails({ onNavigate }: BikeDetailsProps) {
  // Track which trip is selected in the table
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  
  // Date filter state for movement history
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Reference to map container DOM element
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize map with all vehicles (bike + scooters)
  const vehiclesRef = useMapAnimation(mapContainerRef, BIKE_LOCATION, 14, BIKE_LOCATION, false);

  // Filter movement history by date range
  const filteredMovementHistory = movementHistory.filter((movement) => {
    if (!startDate && !endDate) return true;
    
    const movementDate = new Date(movement.timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      return movementDate >= start && movementDate <= end;
    } else if (start) {
      return movementDate >= start;
    } else if (end) {
      return movementDate <= end;
    }
    return true;
  });

  // Export movement history to CSV
  const exportToCSV = () => {
    const headers = ['Battery Status', 'Long - Lat', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredMovementHistory.map(m => 
        `${m.batteryStatus},"${m.location}",${m.timestamp}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `movement-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bike-details-container">
      {/* <Header title="Bike Details" /> */}
      <div className="main-content">
        {/* <Sidebar onNavigate={onNavigate} activePage="bike-detail" /> */}

        {/* Content Area */}
        <div className="content-area">
          {/* Bike Info Section */}
          <div className="bike-info-section">
            <div className="bike-image">
              <img src="/bike_type.png" alt="Scooter" />
            </div>
            <div className="bike-details">
              <h2 className="vin-number">VIN-123456</h2>
              <p className="bike-model">VINFAST EVO200</p>
              <div className="battery-status">
                <MdBatteryFull className="battery-icon" size={24} />
                <span>100%</span>
              </div>
              <div className="status-badge">Being Rent</div>
            </div>
          </div>

          {/* Last Trips and Map Section */}
          <div className="trips-map-section">
            {/* Trips Table */}
            <div className="trips-table-container">
              <h3>Last Trips</h3>
              <table className="trips-table">
                <thead>
                  <tr>
                    <th>Customer's ID</th>
                    <th>Date Range</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => (
                    <tr
                      key={trip.id}
                      className={selectedTrip === trip.id ? 'selected' : ''}
                      onClick={() => setSelectedTrip(trip.id)}
                    >
                      <td>{trip.customerId}</td>
                      <td>{trip.dateRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Map */}
            <div 
              className="map-container" 
              onClick={() => onNavigate('map', getVehicleById(vehiclesRef.current, 'bike-vin-123456')?.position || BIKE_LOCATION)}
              style={{ cursor: 'pointer' }}
              title="Click to view full map"
            >
              <div ref={mapContainerRef} className="trip-map" />
            </div>
          </div>

          {/* Movement History Section */}
          <div className="movement-history-section">
            <div className="movement-history-header">
              <h3>Movement History</h3>
              <div className="movement-history-controls">
                <div className="date-filters">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="date-input"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="date-input"
                  />
                </div>
                <button onClick={exportToCSV} className="export-btn">
                  Export CSV
                </button>
              </div>
            </div>
            <table className="trips-table">
              <thead>
                <tr>
                  <th>Battery Status</th>
                  <th>Long - Lat</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovementHistory.length > 0 ? (
                  filteredMovementHistory.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.batteryStatus}</td>
                      <td>{movement.location}</td>
                      <td>{movement.timestamp}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                      No movement history found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BikeDetails;
