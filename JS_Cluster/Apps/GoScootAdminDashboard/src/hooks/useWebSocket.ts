/**
 * useWebSocket Hook
 * React hook for managing WebSocket connection and bike updates
 */

import { useEffect, useCallback, useRef } from 'react';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { websocketManager, ViewportBounds } from '../services/websocketService';
import mapboxgl from 'mapbox-gl';

/**
 * Hook to manage WebSocket connection for real-time bike updates
 * @param onBikeUpdate - Callback when bike updates are received
 * @param map - Mapbox map instance (optional, for automatic viewport tracking)
 * @returns Function to manually send viewport updates
 */
export function useWebSocket(
  onBikeUpdate: (bikes: BikeUpdate[]) => void,
  map?: mapboxgl.Map | null
) {
  const isConnectedRef = useRef(false);
  const callbackRef = useRef(onBikeUpdate);

  // Update callback ref when it changes (without reconnecting)
  useEffect(() => {
    callbackRef.current = onBikeUpdate;
  }, [onBikeUpdate]);

  // Connect to WebSocket on mount (only once!)
  useEffect(() => {
    if (isConnectedRef.current) return;

    console.log('🔌 Initializing WebSocket connection...');
    // Use a wrapper that always calls the latest callback
    websocketManager.connect((bikes) => callbackRef.current(bikes));
    isConnectedRef.current = true;

    // Cleanup: disconnect on unmount
    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      websocketManager.disconnect();
      isConnectedRef.current = false;
    };
  }, []); // Empty deps - only connect once!

  // Send initial viewport when map is ready
  useEffect(() => {
    if (!map) return;

    const sendInitialViewport = () => {
      const bounds = getMapBounds(map);
      if (bounds) {
        websocketManager.sendViewport(bounds);
      }
    };

    // Wait for map to be fully loaded
    if (map.loaded()) {
      sendInitialViewport();
    } else {
      map.on('load', sendInitialViewport);
    }

    return () => {
      map.off('load', sendInitialViewport);
    };
  }, [map]);

  // Track map movements (pan, zoom) and send viewport updates
  useEffect(() => {
    if (!map) return;

    let debounceTimer: NodeJS.Timeout;

    const handleMapMove = () => {
      // Debounce viewport updates to avoid spamming the server
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const bounds = getMapBounds(map);
        if (bounds) {
          websocketManager.sendViewport(bounds);
        }
      }, 500); // Wait 500ms after user stops moving
    };

    // Listen to map move events
    map.on('moveend', handleMapMove);
    map.on('zoomend', handleMapMove);

    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleMapMove);
    };
  }, [map]);

  // Return function to manually send viewport
  const sendViewport = useCallback((bounds: ViewportBounds) => {
    websocketManager.sendViewport(bounds);
  }, []);

  return { sendViewport };
}

/**
 * Get current map bounds as ViewportBounds
 */
function getMapBounds(map: mapboxgl.Map): ViewportBounds | null {
  try {
    const bounds = map.getBounds();
    
    return {
      maxLong: bounds.getEast(),
      minLong: bounds.getWest(),
      maxLat: bounds.getNorth(),
      minLat: bounds.getSouth(),
    };
  } catch (error) {
    console.error('Failed to get map bounds:', error);
    return null;
  }
}
