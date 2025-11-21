/**
 * Bike Details Page
 * Displays detailed information about a specific bike (VIN-123456)
 * Shows bike info, battery status, trip history, and live location on map
 */

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

/**
 * BikeDetails component
 * Main page showing comprehensive bike information and live tracking
 */
function BikeDetails({ onNavigate }: BikeDetailsProps) {
  // Track which trip is selected in the table
  const [selectedTrip, setSelectedTrip] = useState<number | null>(null);
  
  // Reference to map container DOM element
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize map with bike animation (only bike, no scooters)
  const vehiclesRef = useMapAnimation(mapContainerRef, BIKE_LOCATION, 14, BIKE_LOCATION, true);

  return (
    <div className="bike-details-container">
      <Header title="Bike Details" />
      <div className="main-content">
        <Sidebar onNavigate={onNavigate} activePage="bike-detail" />

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
        </div>
      </div>
    </div>
  );
}

export default BikeDetails;
