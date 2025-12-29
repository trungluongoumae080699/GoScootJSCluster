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
import { hubApi, Hub } from '../services/apiClient';
import mapboxgl from 'mapbox-gl';

// /**
//  * Hook to manage WebSocket connection for real-time bike updates
//  * 
//  * @param onBikeUpdate - Callback when bike updates are received from server
//  * @param map - Mapbox map instance (optional, for automatic viewport tracking)
//  * @param onHubUpdate - Callback when hub updates are received from server
//  * @param onError - Callback when error messages are received
//  * @returns Object with sendViewport function for manual viewport updates
//  */
// export function useWebSocket(
//   onBikeUpdate: (bikes: BikeUpdate[]) => void,
//   map?: mapboxgl.Map | null,
//   onHubUpdate?: (hubs: Hub[]) => void,
//   onError?: (error: string) => void
// ) {
//   // Ref: Track if we've already connected (prevent double connection)
//   const isConnectedRef = useRef(false);

//   // Ref: Store latest callback without triggering reconnection
//   const callbackRef = useRef(onBikeUpdate);

//   /**
//    * Effect: Update callback ref when it changes
//    * This allows the callback to change without reconnecting WebSocket
//    */
//   useEffect(() => {
//     callbackRef.current = onBikeUpdate;
//   }, [onBikeUpdate]);

//   /**
//    * Effect: Connect to WebSocket on mount (only once!)
//    * 
//    * Uses a ref to ensure connection happens only once, even if
//    * component re-renders or callback changes.
//    * 
//    * Cleanup: Disconnects when component unmounts
//    */
//   useEffect(() => {
//     // Guard: Prevent double connection
//     if (isConnectedRef.current) return;

//     console.log('🔌 Initializing WebSocket connection...');

//     // Connect with a wrapper that always calls the latest callback
//     websocketManager.connect(
//       (bikes) => callbackRef.current(bikes),
//       onError
//     );
//     isConnectedRef.current = true;

//     // Cleanup: Disconnect when component unmounts
//     return () => {
//       console.log('🔌 Cleaning up WebSocket connection...');
//       websocketManager.disconnect();
//       isConnectedRef.current = false;
//     };
//   }, []); // Empty deps - only connect once!

//   /**
//    * Effect: Send initial viewport when map is ready
//    * 
//    * Tells the server which area to send bike data for.
//    * Waits for map to finish loading before sending.
//    */
//   useEffect(() => {
//     if (!map) return;

//     const sendInitialViewport = async () => {
//       const bounds = getMapBounds(map);
//       if (bounds) {
//         websocketManager.sendViewport(bounds);

//         // Also fetch hubs in the area
//         if (onHubUpdate) {
//           try {
//             const hubs = await hubApi.getHubsInArea(bounds);
//             onHubUpdate(hubs);
//           } catch (error) {
//             console.error('Failed to fetch hubs:', error);
//           }
//         }
//       }
//     };

//     // Check if map is already loaded
//     if (map.loaded()) {
//       sendInitialViewport();
//     } else {
//       // Wait for map to load
//       map.on('load', sendInitialViewport);
//     }

//     // Cleanup: Remove event listener
//     return () => {
//       map.off('load', sendInitialViewport);
//     };
//   }, [map]);

//   /**
//    * Effect: Track map movements and send viewport updates
//    * 
//    * Listens for map pan and zoom events, then sends updated viewport
//    * to server so it knows which bikes to send data for.
//    * 
//    * Uses debouncing to avoid sending too many updates:
//    * - Waits 500ms after user stops moving
//    * - Only then sends the viewport update
//    * 
//    * This prevents spamming the server during continuous pan/zoom.
//    */
//   useEffect(() => {
//     if (!map) return;

//     let debounceTimer: NodeJS.Timeout;

//     const handleMapMove = () => {
//       // Clear previous timer
//       clearTimeout(debounceTimer);

//       // Wait 500ms after user stops moving before sending update
//       debounceTimer = setTimeout(async () => {
//         const bounds = getMapBounds(map);
//         if (bounds) {
//           websocketManager.sendViewport(bounds);

//           // Also fetch hubs in the new area
//           if (onHubUpdate) {
//             try {
//               const hubs = await hubApi.getHubsInArea(bounds);
//               onHubUpdate(hubs);
//             } catch (error) {
//               console.error('Failed to fetch hubs:', error);
//             }
//           }
//         }
//       }, 500); // Debounce delay: 500ms
//     };

//     // Listen to map movement events
//     map.on('moveend', handleMapMove); // Fired when pan ends
//     map.on('zoomend', handleMapMove); // Fired when zoom ends

//     // Cleanup: Remove event listeners and clear timer
//     return () => {
//       clearTimeout(debounceTimer);
//       map.off('moveend', handleMapMove);
//       map.off('zoomend', handleMapMove);
//     };
//   }, [map]);

//   /**
//    * Function: Manually send viewport update
//    * Useful for forcing an update outside of map movement events
//    */
//   const sendViewport = useCallback((bounds: ViewportBounds) => {
//     websocketManager.sendViewport(bounds);
//   }, []);

//   return { sendViewport };
// }

export function useMapRealtime(
    onBikeUpdate: (bikes: BikeUpdate[]) => void,
    onHubUpdate: (hubs: Hub[]) => void,
    onError: (error: string) => void,
    map?: mapboxgl.Map | null,

) {
    // Register callbacks
    useEffect(() => {
        websocketManager.setOnBikeUpdate(onBikeUpdate);
        websocketManager.setOnError(onError);
    }, [onBikeUpdate, onError]);

    // Initial viewport
    /*
    useEffect(() => {
        if (!map) return;
        const sendInitialViewport = async () => {
            const bounds = getMapBounds(map);
            if (!bounds) return;

            websocketManager.sendViewport(bounds);

            if (onHubUpdate) {
                const hubs = await hubApi.getHubsInArea(bounds);
                onHubUpdate(hubs);
            }
        };

        if (map.loaded()) sendInitialViewport();
        else map.on('load', sendInitialViewport);

        map.on('load', sendInitialViewport);


        return () => {
            map.off("load", sendInitialViewport); // ✅
        };

    }, [map]);
    */

    useEffect(() => {
        if (!map) return;

        let cancelled = false;

        const sendInitialViewport = async () => {
            if (cancelled) return;

            const bounds = getMapBounds(map);
            if (!bounds) return;

            websocketManager.sendViewport(bounds);

            try {
                const hubs = await hubApi.getHubsInArea(bounds);
                if (!cancelled) onHubUpdate(hubs);
            } catch (e) {
                if (!cancelled) onError(`Failed to fetch hubs: ${e instanceof Error ? e.message : String(e)}`);
            }
        };

        // 1) attach listener
        map.on("load", sendInitialViewport);

        // 2) run ASAP (covers "already loaded" / "load fired before listener")
        //    - if map not loaded yet, sendInitialViewport will just use current bounds anyway (usually ok)
        queueMicrotask(sendInitialViewport);

        // 3) if already loaded, call immediately too (optional redundancy)
        if (map.loaded()) sendInitialViewport();

        return () => {
            cancelled = true;
            map.off("load", sendInitialViewport);
        };
    }, [map, onHubUpdate, onError]);

    // Track map movement
    useEffect(() => {
        if (!map) return;

        let timer: NodeJS.Timeout;

        const handleMove = () => {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                const bounds = getMapBounds(map);
                if (!bounds) return;

                websocketManager.sendViewport(bounds);

                if (onHubUpdate) {
                    const hubs = await hubApi.getHubsInArea(bounds);
                    onHubUpdate(hubs);
                }
            }, 500);
        };

        map.on('moveend', handleMove);
        map.on('zoomend', handleMove);

        return () => {
            clearTimeout(timer);
            map.off('moveend', handleMove);
            map.off('zoomend', handleMove);
        };
    }, [map]);
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
