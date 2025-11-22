

import { useState } from 'react';
import Map from './Map';
import BikeDetails from './BikeDetails';
import VehicleTelemetryPage from './MqttTestPage';

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

      <VehicleTelemetryPage/>
      
    </>
  );
}

export default App;

