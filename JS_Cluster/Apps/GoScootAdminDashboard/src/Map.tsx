

import { useRef, useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { useWebSocket } from './hooks/useWebSocket';
import { useBikeMarkers } from './hooks/useBikeMarkers';
import MapStatusIndicator from './components/map/MapStatusIndicator';
import BikeDetailPopup from './components/map/BikeDetailPopup';

/** Mapbox API access token from environment variables */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';

/** Default map center (Saigon center) */
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231];

/** Props for Map component */
export interface MapProps {
  /** Callback to navigate to other pages */
  onNavigate: (page: string, bikeLocation?: [number, number], bikeId?: string) => void;
  /** Optional location to center map on (e.g., when navigating from bike details) */
  centerOnLocation: [number, number] | null;
}

/**
 * Map component
 * Dashboard map showing real-time bike locations via WebSocket
 */
function DashboardMap({ onNavigate, centerOnLocation }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // State: Number of bikes visible in current map viewport
  const [visibleBikeCount, setVisibleBikeCount] = useState(0);
  
  // State: Total number of bikes tracked by the system
  const [totalBikeCount, setTotalBikeCount] = useState(0);
  
  // State: Loading state while map initializes
  const [isLoading, setIsLoading] = useState(true);
  
  // State: Error message if map fails to load
  const [error, setError] = useState<string | null>(null);
  
  // State: WebSocket connection status
  const [wsConnected, setWsConnected] = useState(false);
  
  // State: Currently selected bike for detail popup
  const [selectedBike, setSelectedBike] = useState<BikeUpdate | null>(null);

  /**
   * Handler: When user clicks on a bike marker
   * Opens the detail popup for that bike
   */
  const handleBikeClick = useCallback((bike: BikeUpdate) => {
    setSelectedBike(bike);
  }, []);

  /**
   * Handler: Close the bike detail popup
   */
  const handleClosePopup = useCallback(() => {
    setSelectedBike(null);
  }, []);

  // Custom hook: Manages bike markers on the map (add, update, remove)
  const { updateMarkers, clearMarkers } = useBikeMarkers(handleBikeClick);
  




  /**
   * Effect: Initialize Mapbox map on component mount
   * - Sets up map container with Mapbox GL
   * - Configures map center (either provided location or default Saigon center)
   * - Adds navigation controls (zoom, rotate)
   * - Adds geolocation control (find user's location)
   * - Cleans up map on unmount
   */
  useEffect(() => {
    // Validate map container and token exist
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create new map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11', // Street map style
      center: centerOnLocation || SAIGON_CENTER, // Center on provided location or default
      zoom: centerOnLocation ? 15 : 12, // Zoom closer if centering on specific location
    });

    // Event: Map finished loading
    map.on('load', () => setIsLoading(false));
    
    // Event: Map encountered an error
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    // Add zoom/rotate controls to top-right corner
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocation control (find my location button)
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true }, // Use GPS for accuracy
        trackUserLocation: true, // Keep tracking as user moves
        showUserHeading: true, // Show direction user is facing
      }),
      'top-right'
    );

    // Store map reference for use in other functions
    mapRef.current = map;

    // Cleanup: Remove markers and destroy map when component unmounts
    return () => {
      clearMarkers();
      map.remove();
    };
  }, [centerOnLocation, clearMarkers]);

  /**
   * Handler: Process bike updates from WebSocket
   * Called whenever new bike location data arrives
   * Updates markers on map and bike counts
   */
  const handleBikeUpdate = useCallback((bikes: BikeUpdate[]) => {
    // Guard: Don't process if map isn't ready yet
    if (!mapRef.current) {
      console.warn('⚠️ Map not ready yet');
      return;
    }

    // Mark WebSocket as connected
    setWsConnected(true);
    console.log(`📍 Received ${bikes.length} bikes from WebSocket`);

    // Update markers on map and get counts
    const counts = updateMarkers(bikes, mapRef.current);
    setTotalBikeCount(counts.totalCount); // Total bikes in system
    setVisibleBikeCount(counts.visibleCount); // Bikes visible in current viewport
    
    console.log(`🗺️ Total bikes: ${counts.totalCount}, Visible: ${counts.visibleCount}`);
  }, [updateMarkers]);

  // Custom hook: Connect to WebSocket for real-time GPS updates
  useWebSocket(handleBikeUpdate, mapRef.current);

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
          <p>Loading dashboard...</p>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <p>{error}</p>
        </div>
      )}

      <MapStatusIndicator 
        wsConnected={wsConnected}
        totalBikeCount={totalBikeCount}
        visibleBikeCount={visibleBikeCount}
      />

      {selectedBike && (
        <BikeDetailPopup
          bike={selectedBike}
          onClose={handleClosePopup}
        />
      )}

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default DashboardMap;
