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
import { hubApi } from '../services/ApiClient/apiClient';
import mapboxgl from 'mapbox-gl';
import { bikeApi } from '../services/ApiClient/BikeApis';
import { ensureServicePolygonUtil } from '../utlities/MapUtility';




export function useMapRealtime(
    onBikeUpdate: (bikes: BikeUpdate[]) => void,
    onSingleBikeUpdate: (bike: BikeUpdate) => void,
    onHubUpdate: (hubs: Hub[]) => void,
    onError: (error: string) => void,
    map?: mapboxgl.Map | null,
    onMapLoad?: () => void,
) {
    // Register callbacks
    useEffect(() => {
        websocketManager.setOnBikeUpdate(onBikeUpdate);
        websocketManager.setOnError(onError);
        websocketManager.setSingleBikeRequest(onSingleBikeUpdate)
    }, [onBikeUpdate, onError]);

    // Initial viewport

    const addGeofenceSafely = () => {
        if (!map) return

        if (!map.isStyleLoaded()) {
            // Đợi style load xong rồi mới add layer/source
            map.once("style.load", () => {
                ensureServicePolygonUtil(map, "dashboard-screen", "dashboard-screen-fill", "dashboard-screen-outline");
            });
            return;
        }

        ensureServicePolygonUtil(map, "dashboard-screen", "dashboard-screen-fill", "dashboard-screen-outline");
    };


    useEffect(() => {
        if (!map) return;
        const m = map

        let intervalId: number | null = null;

        const sendInitialViewport = async () => {
            const bounds = getMapBounds(m);
            if (!bounds) return;

            websocketManager.sendViewport(bounds);

            if (onHubUpdate) {
                const hubs = await bikeApi.getHubsInArea(bounds);
                onHubUpdate(hubs);
            }
        };

        const handleMapLoad = () => {
            onMapLoad?.();        // báo UI map đã load
            sendInitialViewport();
            addGeofenceSafely()

            // 🔁 gửi viewport mỗi 3 giây
            intervalId = window.setInterval(() => {
                sendInitialViewport();
            }, 3000);
        };

        if (m.loaded()) {
            handleMapLoad();
        } else {
            m.on("load", handleMapLoad);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            try {
                m.off("load", handleMapLoad);

                if (m.getLayer("hcm-geofence-fill")) m.removeLayer("hcm-geofence-fill");
                if (m.getLayer("hcm-geofence-outline")) m.removeLayer("hcm-geofence-outline");
                if (m.getSource("hcm-geofence")) m.removeSource("hcm-geofence");
            } catch {
                // map might already be destroyed during route change
            }
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

const HCM_BOUNDS = {
    latMin: 10.50,
    latMax: 11.10,
    lngMin: 106.30,
    lngMax: 107.10,
};

const HCM_CENTER: [number, number] = [
    (HCM_BOUNDS.lngMin + HCM_BOUNDS.lngMax) / 2,
    (HCM_BOUNDS.latMin + HCM_BOUNDS.latMax) / 2,
];

function haversineMeters(a: [number, number], b: [number, number]) {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371008.8;

    const [lng1, lat1] = a;
    const [lng2, lat2] = b;

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const sLat1 = toRad(lat1);
    const sLat2 = toRad(lat2);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

function makeCirclePolygon(
    center: [number, number],
    radiusMeters: number,
    steps = 128
): GeoJSON.Feature<GeoJSON.Polygon> {
    const [centerLng, centerLat] = center;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const toDeg = (x: number) => (x * 180) / Math.PI;

    const R = 6371008.8;
    const latRad = toRad(centerLat);
    const lngRad = toRad(centerLng);

    const coords: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
        const bearing = (2 * Math.PI * i) / steps;

        const lat2 = Math.asin(
            Math.sin(latRad) * Math.cos(radiusMeters / R) +
            Math.cos(latRad) * Math.sin(radiusMeters / R) * Math.cos(bearing)
        );

        const lng2 =
            lngRad +
            Math.atan2(
                Math.sin(bearing) * Math.sin(radiusMeters / R) * Math.cos(latRad),
                Math.cos(radiusMeters / R) - Math.sin(latRad) * Math.sin(lat2)
            );

        coords.push([toDeg(lng2), toDeg(lat2)]);
    }

    return {
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [coords] },
    };
}



const SERVICE_POLYGON: GeoJSON.Feature<GeoJSON.Polygon> = {
    type: "Feature",
    properties: { name: "core-service-area" },
    geometry: {
        type: "Polygon",
        coordinates: [[
            [106.63, 10.88], // Tan Binh (north-west, airport edge)
            [106.66, 10.90], // Go Vap / Tan Binh north
            [106.70, 10.91], // Go Vap / Phu Nhuan north
            [106.74, 10.90], // Phu Nhuan / Thu Duc edge
            [106.79, 10.90], // Thu Duc / District 9 north
            [106.86, 10.83], // District 9 east
            [106.86, 10.75], // ⬇️ District 9 south-east
            [106.84, 10.72], // ⬇️ Q7 east (Phu My Hung)
            [106.80, 10.70], // ⬅️ Q7 south
            [106.77, 10.69], // ⬅️ Nha Be edge (limit)
            [106.75, 10.70], // Q7 west
            [106.73, 10.71], // Q4 south
            [106.72, 10.72], // Q4 central
            [106.71, 10.73], // Q4 north
            [106.72, 10.75], // Q1 / Q4 bridge area
            [106.69, 10.75], // Q5
            [106.66, 10.78], // Binh Thanh
            [106.64, 10.82], // Phu Nhuan south
            [106.63, 10.85], // Tan Binh inner
            [106.63, 10.88], // close
        ]]
    }
};

function ensureServicePolygon(map: mapboxgl.Map) {
    const SOURCE_ID = "service-area";
    const FILL_ID = "service-area-fill";
    const OUTLINE_ID = "service-area-outline";

    // Source exists → just update data
    const existingSource = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existingSource) {
        existingSource.setData(SERVICE_POLYGON);
        return;
    }

    map.addSource(SOURCE_ID, {
        type: "geojson",
        data: SERVICE_POLYGON,
    });

    map.addLayer({
        id: FILL_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
            "fill-color": "#DF6C20",
            "fill-opacity": 0.18,
        },
    });

    map.addLayer({
        id: OUTLINE_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
            "line-color": "#DF6C20",
            "line-width": 2,
            "line-opacity": 0.9,
        },
    });
}


