import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css';

// Configuration
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231]; // Saigon coordinates
const DEFAULT_ZOOM = 12;

function App() {
  // Refs for map container and instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) {
      setError('Mapbox token is missing');
      setIsLoading(false);
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Create map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: SAIGON_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    // Event handlers
    map.on('load', () => setIsLoading(false));
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    // Add navigation and geolocation controls
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

    // Cleanup on unmount
    return () => map.remove();
  }, []);

  // Show error if token is missing
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
      {/* Header with logo */}
      <header className="app-header">
        <h1 className="logo-text">GOSCOOT</h1>
      </header>

      {/* Map container */}
      <div className="map-container">
        {/* Loading state */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Loading map...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="error-overlay">
            <p>{error}</p>
          </div>
        )}

        {/* Map element */}
        <div ref={mapContainerRef} className="map" />
      </div>
    </div>
  );
}

export default App;
