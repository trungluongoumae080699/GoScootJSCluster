/**
 * useWebSocket Hook
 * 
 * React hook for managing WebSocket connection and real-time bike updates.
 * 
 * Features:
 * - Connects to WebSocket on mount, disconnects on unmount
 * - Automatically sends viewport updates when map moves
 * - Debounces viewport updates to avoid spamming server
 * - Handles callback updates without reconnecting
 * 
 * Usage:
 * ```tsx
 * useWebSocket(handleBikeUpdate, mapRef.current);
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';
import { websocketManager, ViewportBounds } from '../services/websocketService';
import mapboxgl from 'mapbox-gl';

/**
 * Hook to manage WebSocket connection for real-time bike updates
 * 
 * @param onBikeUpdate - Callback when bike updates are received from server
 * @param map - Mapbox map instance (optional, for automatic viewport tracking)
 * @returns Object with sendViewport function for manual viewport updates
 */
export function useWebSocket(
  onBikeUpdate: (bikes: BikeUpdate[]) => void,
  map?: mapboxgl.Map | null
) {
  // Ref: Track if we've already connected (prevent double connection)
  const isConnectedRef = useRef(false);
  
  // Ref: Store latest callback without triggering reconnection
  const callbackRef = useRef(onBikeUpdate);

  /**
   * Effect: Update callback ref when it changes
   * This allows the callback to change without reconnecting WebSocket
   */
  useEffect(() => {
    callbackRef.current = onBikeUpdate;
  }, [onBikeUpdate]);

  /**
   * Effect: Connect to WebSocket on mount (only once!)
   * 
   * Uses a ref to ensure connection happens only once, even if
   * component re-renders or callback changes.
   * 
   * Cleanup: Disconnects when component unmounts
   */
  useEffect(() => {
    // Guard: Prevent double connection
    if (isConnectedRef.current) return;

    console.log('🔌 Initializing WebSocket connection...');
    
    // Connect with a wrapper that always calls the latest callback
    websocketManager.connect((bikes) => callbackRef.current(bikes));
    isConnectedRef.current = true;

    // Cleanup: Disconnect when component unmounts
    return () => {
      console.log('🔌 Cleaning up WebSocket connection...');
      websocketManager.disconnect();
      isConnectedRef.current = false;
    };
  }, []); // Empty deps - only connect once!

  /**
   * Effect: Send initial viewport when map is ready
   * 
   * Tells the server which area to send bike data for.
   * Waits for map to finish loading before sending.
   */
  useEffect(() => {
    if (!map) return;

    const sendInitialViewport = () => {
      const bounds = getMapBounds(map);
      if (bounds) {
        websocketManager.sendViewport(bounds);
      }
    };

    // Check if map is already loaded
    if (map.loaded()) {
      sendInitialViewport();
    } else {
      // Wait for map to load
      map.on('load', sendInitialViewport);
    }

    // Cleanup: Remove event listener
    return () => {
      map.off('load', sendInitialViewport);
    };
  }, [map]);

  /**
   * Effect: Track map movements and send viewport updates
   * 
   * Listens for map pan and zoom events, then sends updated viewport
   * to server so it knows which bikes to send data for.
   * 
   * Uses debouncing to avoid sending too many updates:
   * - Waits 500ms after user stops moving
   * - Only then sends the viewport update
   * 
   * This prevents spamming the server during continuous pan/zoom.
   */
  useEffect(() => {
    if (!map) return;

    let debounceTimer: NodeJS.Timeout;

    const handleMapMove = () => {
      // Clear previous timer
      clearTimeout(debounceTimer);
      
      // Wait 500ms after user stops moving before sending update
      debounceTimer = setTimeout(() => {
        const bounds = getMapBounds(map);
        if (bounds) {
          websocketManager.sendViewport(bounds);
        }
      }, 500); // Debounce delay: 500ms
    };

    // Listen to map movement events
    map.on('moveend', handleMapMove); // Fired when pan ends
    map.on('zoomend', handleMapMove); // Fired when zoom ends

    // Cleanup: Remove event listeners and clear timer
    return () => {
      clearTimeout(debounceTimer);
      map.off('moveend', handleMapMove);
      map.off('zoomend', handleMapMove);
    };
  }, [map]);

  /**
   * Function: Manually send viewport update
   * Useful for forcing an update outside of map movement events
   */
  const sendViewport = useCallback((bounds: ViewportBounds) => {
    websocketManager.sendViewport(bounds);
  }, []);

  return { sendViewport };
}

/**
 * Helper: Get current map bounds as ViewportBounds
 * 
 * Extracts the visible area boundaries from Mapbox map.
 * Returns null if map bounds cannot be retrieved.
 * 
 * @param map - Mapbox map instance
 * @returns Viewport bounds or null on error
 */
function getMapBounds(map: mapboxgl.Map): ViewportBounds | null {
  try {
    const bounds = map.getBounds();
    
    return {
      maxLong: bounds.getEast(),  // Eastern edge (right)
      minLong: bounds.getWest(),  // Western edge (left)
      maxLat: bounds.getNorth(),  // Northern edge (top)
      minLat: bounds.getSouth(),  // Southern edge (bottom)
    };
  } catch (error) {
    console.error('Failed to get map bounds:', error);
    return null;
  }
}
