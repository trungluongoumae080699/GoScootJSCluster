/**
 * useMapAnimation Hook
 * Custom React hook for initializing and animating vehicles on a Mapbox map
 * Handles map setup, vehicle initialization, animation, and cleanup
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { initializeVehicles, animateVehicles, cleanupVehicles, type Vehicle } from '../vehicleAnimation';

/** Mapbox API access token from environment variables */
const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || '';

/**
 * Hook to manage map initialization and vehicle animation
 * @param mapContainerRef - React ref to the map container DOM element
 * @param center - Initial map center coordinates [longitude, latitude]
 * @param zoom - Initial map zoom level
 * @param bikePosition - Optional position for featured bike
 * @param onlyBike - If true, only animate the bike (no scooters)
 * @returns Ref containing array of vehicle objects
 */
export function useMapAnimation(
  mapContainerRef: React.RefObject<HTMLDivElement | null>,
  center: [number, number],
  zoom: number,
  bikePosition?: [number, number],
  onlyBike: boolean = false
) {
  // Store vehicles and animation frame ID
  const vehiclesRef = useRef<Vehicle[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Exit if container or token is missing
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center,
      zoom,
    });

    // Wait for map to load before adding vehicles
    map.on('load', async () => {
      // Initialize vehicles (bike + scooters or just bike)
      vehiclesRef.current = await initializeVehicles(map, MAPBOX_TOKEN, bikePosition);
      
      // Filter to only bike if requested (for detail page)
      const vehicles = onlyBike ? vehiclesRef.current.filter(v => v.type === 'bike') : vehiclesRef.current;
      
      // Start animation loop
      animateVehicles(vehicles, MAPBOX_TOKEN, animationRef);
    });

    // Add map controls (only for full map view, not detail page)
    if (!onlyBike) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'top-right'
      );
    }

    // Cleanup function: stop animation and remove map
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      cleanupVehicles(vehiclesRef.current);
      map.remove();
    };
  }, [center, zoom, bikePosition, onlyBike]);

  return vehiclesRef;
}
