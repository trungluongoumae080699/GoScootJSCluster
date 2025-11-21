/**
 * Main Map Page
 * Displays full map view with all vehicles (50 scooters + 1 featured bike)
 * Shows live tracking and allows navigation to bike details
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getVehicleById } from './vehicleAnimation';
import { useMapAnimation } from './hooks/useMapAnimation';

/** Mapbox API access token from environment variables */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';

/** Featured bike location (Saigon center) */
const BIKE_LOCATION: [number, number] = [106.6297, 10.8231];

/** Default map center (Saigon center) */
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231];

/** Props for Map component */
export interface MapProps {
  /** Callback to navigate to other pages */
  onNavigate: (page: string, bikeLocation?: [number, number]) => void;
  /** Optional location to center map on (e.g., when navigating from bike details) */
  centerOnLocation: [number, number] | null;
}

/**
 * Map component
 * Full-screen map showing all vehicles with live tracking
 */
function Map({ onNavigate, centerOnLocation }: MapProps) {
  // References for map container and instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map with all vehicles (bike + scooters)
  const vehiclesRef = useMapAnimation(
    mapContainerRef,
    centerOnLocation || SAIGON_CENTER,
    centerOnLocation ? 15 : 12, // Zoom in if centering on specific location
    BIKE_LOCATION,
    false // Show all vehicles, not just bike
  );

  useEffect(() => {
    // Check for required dependencies
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Initialize map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: centerOnLocation || SAIGON_CENTER,
      zoom: centerOnLocation ? 15 : 12,
    });

    // Handle map load event
    map.on('load', () => setIsLoading(false));
    
    // Handle map errors
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    mapRef.current = map;

    // If centering on bike, fly to its current position after short delay
    if (centerOnLocation) {
      setTimeout(() => {
        const bike = getVehicleById(vehiclesRef.current, 'bike-vin-123456');
        if (bike && map) {
          map.flyTo({ center: bike.position, zoom: 15, duration: 1500 });
        }
      }, 500);
    }

    // Cleanup: remove map on unmount
    return () => map.remove();
  }, [centerOnLocation]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="error-container">
        <h2>Missing Mapbox Token</h2>
        <p>Please add your Mapbox token to the .env file</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading map...</p>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <p>{error}</p>
        </div>
      )}

      <button 
        onClick={() => onNavigate('bike-detail')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          background: '#C85A28',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        View Bike Details
      </button>

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default Map;
