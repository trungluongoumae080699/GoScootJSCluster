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
import { BikeUpdate, Hub } from '@trungthao/admin_dashboard_dto';
import { websocketManager, ViewportBounds } from '../services/websocketService';
import { hubApi} from '../services/ApiClient/apiClient';
import mapboxgl from 'mapbox-gl';
import { bikeApi } from '../services/ApiClient/BikeApis';



export function useMapRealtime(
    onBikeUpdate: (bikes: BikeUpdate[]) => void,
    onHubUpdate: (hubs: Hub[]) => void,
    onError: (error: string) => void,
    map?: mapboxgl.Map | null,
    onMapLoad?: () => void,
) {
    // Register callbacks
    useEffect(() => {
        websocketManager.setOnBikeUpdate(onBikeUpdate);
        websocketManager.setOnError(onError);
    }, [onBikeUpdate, onError]);

    // Initial viewport

    useEffect(() => {
        if (!map) return;
        const sendInitialViewport = async () => {
            const bounds = getMapBounds(map);
            if (!bounds) return;

            websocketManager.sendViewport(bounds);

            if (onHubUpdate) {
                const hubs = await bikeApi.getHubsInArea(bounds);
                onHubUpdate(hubs);
            }
        };

        const handleMapLoad = () => {
            onMapLoad?.();          // báo cho UI map đã load
            sendInitialViewport(); // gửi viewport + fetch hubs
        };

        if (map.loaded()) {
            handleMapLoad();
        } else {
            map.on("load", handleMapLoad);
        }

        return () => {
            map.off("load", sendInitialViewport); // ✅
        };

    }, [map]);


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
                    const hubs = await bikeApi.getHubsInArea(bounds);
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
