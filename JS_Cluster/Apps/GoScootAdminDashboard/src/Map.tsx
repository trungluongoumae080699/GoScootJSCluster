
import { useRef, useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { useWebSocket } from './hooks/useWebSocket';
import { useBikeMarkers } from './hooks/useBikeMarkers';
import MapStatusIndicator from './components/map/MapStatusIndicator';

/** Mapbox API access token from environment variables */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';

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
 * Dashboard map showing real-time bike locations via WebSocket
 */
function DashboardMap({ onNavigate, centerOnLocation }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  const [visibleBikeCount, setVisibleBikeCount] = useState(0);
  const [totalBikeCount, setTotalBikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const { updateMarkers, clearMarkers } = useBikeMarkers(onNavigate);
  




  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

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

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    mapRef.current = map;

    return () => {
      clearMarkers();
      map.remove();
    };
  }, [centerOnLocation, clearMarkers]);

  const handleBikeUpdate = useCallback((bikes: BikeUpdate[]) => {
    if (!mapRef.current) {
      console.warn('⚠️ Map not ready yet');
      return;
    }

    setWsConnected(true);
    console.log(`📍 Received ${bikes.length} bikes from WebSocket`);

    const counts = updateMarkers(bikes, mapRef.current);
    setTotalBikeCount(counts.totalCount);
    setVisibleBikeCount(counts.visibleCount);
    
    console.log(`🗺️ Total bikes: ${counts.totalCount}, Visible: ${counts.visibleCount}`);
  }, [updateMarkers]);

  // Connect to WebSocket for real-time GPS updates
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

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default DashboardMap;
