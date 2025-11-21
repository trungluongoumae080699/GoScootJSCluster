/**
 * App Component
 * Root component managing page navigation and state
 * Handles routing between Map and BikeDetails pages
 */

import { useState } from 'react';
import Map from './Map';
import BikeDetails from './BikeDetails';

/**
 * Main App component
 * Manages application state and page routing
 */
function App() {
  // Track current page (simple client-side routing)
  const [currentPage, setCurrentPage] = useState<string>('bike-detail');
  
  // Store bike location when navigating from BikeDetails to Map
  const [selectedBikeLocation, setSelectedBikeLocation] = useState<[number, number] | null>(null);

  /**
   * Handle navigation between pages
   * @param page - Page identifier to navigate to
   * @param bikeLocation - Optional bike location to center map on
   */
  const handleNavigate = (page: string, bikeLocation?: [number, number]) => {
    setCurrentPage(page);
    if (bikeLocation) {
      setSelectedBikeLocation(bikeLocation);
    }
  };

  return (
    <>
      {/* Render Map page */}
      {currentPage === 'map' && <Map onNavigate={handleNavigate} centerOnLocation={selectedBikeLocation} />}
      
      {/* Render Bike Details page */}
      {currentPage === 'bike-detail' && <BikeDetails onNavigate={handleNavigate} />}
      
      {/* Add other pages here as needed (Trips, Alerts, etc.) */}
    </>
  );
}

export default App;
