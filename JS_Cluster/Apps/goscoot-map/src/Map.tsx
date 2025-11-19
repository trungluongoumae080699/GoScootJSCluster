import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { initializeScooters, animateScooters, cleanupScooters, type Scooter } from './scooterAnimation';

// Configuration
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';
const SAIGON_CENTER: [number, number] = [106.6297, 10.8231];
const DEFAULT_ZOOM = 12;

function Map() {
  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const scootersRef = useRef<Scooter[]>([]);
  const animationRef = useRef<number | undefined>(undefined);
  
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

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: SAIGON_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.on('load', () => setIsLoading(false));
    map.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setIsLoading(false);
    });

    // Add controls
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      cleanupScooters(scootersRef.current);
      map.remove();
    };
  }, []);

  // Initialize and animate scooters
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const setupScooters = async () => {
      scootersRef.current = await initializeScooters(mapRef.current!, MAPBOX_TOKEN);
      animateScooters(scootersRef.current, MAPBOX_TOKEN, animationRef);
    };

    setupScooters();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      cleanupScooters(scootersRef.current);
      scootersRef.current = [];
    };
  }, [isLoading]);

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

      <div ref={mapContainerRef} className="map" />
    </div>
  );
}

export default Map;
