import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || "";

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];

const ROUTE_SOURCE_ID = "route-source";
const ROUTE_LAYER_ID = "route-layer";

interface Location {
  longitude: number;
  latitude: number;
}

interface TripMapProps {
  routeStart?: Location | null;
  routeEnd?: Location | null;
}

function isValidLocation(loc?: Location | null): loc is Location {
  return (
    !!loc &&
    Number.isFinite(loc.longitude) &&
    Number.isFinite(loc.latitude) &&
    loc.longitude >= -180 &&
    loc.longitude <= 180 &&
    loc.latitude >= -90 &&
    loc.latitude <= 90
  );
}

export default function TripMap({ routeStart, routeEnd }: TripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);

  /* ---------------- Map init ---------------- */
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: DEFAULT_CENTER,
      zoom: 13,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---------------- Draw route ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isValidLocation(routeStart) || !isValidLocation(routeEnd)) {
      removeRoute(map);
      removeStartMarker();
      removeEndMarker();
      return;
    }

    if (map.isStyleLoaded()) {
      drawRoute(map, routeStart, routeEnd);
      showStartMarker(map, routeStart);
      showEndMarker(map, routeEnd);
    } else {
      map.once("load", () => {
        drawRoute(map, routeStart, routeEnd);
        showStartMarker(map, routeStart);
        showEndMarker(map, routeEnd);
      });
    }
  }, [routeStart, routeEnd]);

  /* ---------------- Helpers ---------------- */

  async function drawRoute(map: mapboxgl.Map, start: Location, end: Location) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) return;

    const geometry = data.routes[0].geometry;

    const geojson = {
      type: "Feature",
      properties: {},
      geometry,
    };

    // Fit map to route
    const bounds = geometry.coordinates.reduce(
      (b: mapboxgl.LngLatBounds, c: [number, number]) => b.extend(c),
      new mapboxgl.LngLatBounds(
        geometry.coordinates[0],
        geometry.coordinates[0]
      )
    );

    map.fitBounds(bounds, { padding: 60, duration: 800 });

    // Update existing route
    if (map.getSource(ROUTE_SOURCE_ID)) {
      (map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(
        geojson as any
      );
      return;
    }

    map.addSource(ROUTE_SOURCE_ID, {
      type: "geojson",
      data: geojson as any,
    });

    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: "line",
      source: ROUTE_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#1E88E5",
        "line-width": 4,
        "line-opacity": 0.9,
      },
    });
  }

  function removeRoute(map: mapboxgl.Map) {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
  }

  function showStartMarker(map: mapboxgl.Map, loc: Location) {
    if (startMarkerRef.current) {
      startMarkerRef.current.setLngLat([loc.longitude, loc.latitude]);
      return;
    }

    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.borderRadius = "50%";
    el.style.background = "#2E7D32";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";

    startMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([loc.longitude, loc.latitude])
      .setPopup(new mapboxgl.Popup().setText("Start Location"))
      .addTo(map);
  }

  function showEndMarker(map: mapboxgl.Map, loc: Location) {
    if (endMarkerRef.current) {
      endMarkerRef.current.setLngLat([loc.longitude, loc.latitude]);
      return;
    }

    const el = document.createElement("div");
    el.style.width = "14px";
    el.style.height = "14px";
    el.style.borderRadius = "50%";
    el.style.background = "#C62828"; // red
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";

    endMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([loc.longitude, loc.latitude])
      .setPopup(new mapboxgl.Popup().setText("End Location"))
      .addTo(map);
  }

  function removeStartMarker() {
    startMarkerRef.current?.remove();
    startMarkerRef.current = null;
  }

  function removeEndMarker() {
    endMarkerRef.current?.remove();
    endMarkerRef.current = null;
  }

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
}
