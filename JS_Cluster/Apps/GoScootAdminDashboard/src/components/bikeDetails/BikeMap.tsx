/**
 * BikeMap Component
 * Displays bike location on a small map with real-time updates
 * Shows two markers when current GPS and last known GPS differ significantly
 */

import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Bike } from '@trungthao/admin_dashboard_dto';
import { calculateDistance, getValidLocation } from '../../utlities/methods';
import styles from "./BikeMap.module.css"

const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoidHJ1bmdsdW9uZ291bWFlMDgwNjk5IiwiYSI6ImNtaG9rbDJ5dDBjMWQya3NlcGxjaHNmMTcifQ.YIh29cJOIa6Ut2NEeoOHQg';

// Default center location (Ho Chi Minh City, Vietnam) when no telemetry data
const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231];

// Distance threshold in meters to consider coordinates as "significantly different"
const DISTANCE_THRESHOLD_METERS = 50;


export type Coordinate = {
  longitude: number,
  latitude: number
}
interface BikeMapProps {
  bike: Bike;
  liveLocation: { longitude: number; latitude: number } | null;
  lastKnownLocation: { longitude: number; latitude: number } | null;
  pastTelemetryLocation?: { longitude: number; latitude: number } | null;

}

function BikeMap(
  { bike,
    liveLocation,
    lastKnownLocation,
    pastTelemetryLocation,
  }: BikeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const lastGpsMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Get valid telemetry location (first valid one)

  // Check if the two locations differ significantly
  const locationsAreDifferent = lastKnownLocation && liveLocation
    ? calculateDistance(
      liveLocation.latitude, liveLocation.longitude,
      lastKnownLocation.latitude, lastKnownLocation.longitude
    ) > DISTANCE_THRESHOLD_METERS
    : false;

  // Get the current location (prioritize: selectedTripLocation > liveLocation > telemetry > lastKnownLocation)
  // Only use locations that have valid coordinates
  const validPastTelemetryLocation = getValidLocation(pastTelemetryLocation);
  const validLiveLocation = getValidLocation(liveLocation);
  const validLastKnownLocation = getValidLocation(lastKnownLocation);

  const currentLocation = validPastTelemetryLocation || validLiveLocation || validLastKnownLocation;

  // Determine which type of location is being displayed
  const locationSource = pastTelemetryLocation ? "past" : "present"

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN || !bike) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Use current location if valid, otherwise use default center
    const bikeLocation: [number, number] = currentLocation
      ? [currentLocation.longitude, currentLocation.latitude]
      : DEFAULT_CENTER;

    // Only create map if it doesn't exist
    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: bikeLocation,
        zoom: 14,
      });

      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = (bike.battery_status || 0) > 20 ? '#4CAF50' : '#F44336';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(bikeLocation)
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<strong>${bike.name}</strong><br/>Battery: ${bike.battery_status || 0}%`
          )
        )
        .addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (lastGpsMarkerRef.current) {
        lastGpsMarkerRef.current.remove();
        lastGpsMarkerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [bike, MAPBOX_TOKEN]);

  // Effect to handle the "last GPS" marker when locations differ significantly
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing last GPS marker if it exists
    if (lastGpsMarkerRef.current) {
      lastGpsMarkerRef.current.remove();
      lastGpsMarkerRef.current = null;
    }

    // If locations differ significantly, add a second marker for last GPS position
    if (locationsAreDifferent && validLastKnownLocation && !validPastTelemetryLocation) {
      const lastGpsEl = document.createElement('div');
      lastGpsEl.style.width = '14px';
      lastGpsEl.style.height = '14px';
      lastGpsEl.style.borderRadius = '50%';
      lastGpsEl.style.backgroundColor = '#FF9800'; // Orange for last GPS
      lastGpsEl.style.border = '3px solid white';
      lastGpsEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

      const lastGpsMarker = new mapboxgl.Marker({ element: lastGpsEl })
        .setLngLat([validLastKnownLocation.longitude, validLastKnownLocation.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(
            `<strong>Last GPS Location</strong><br/>` +
            `<span style="color: #FF9800;">📍 Previous Position</span><br/>` +
            `Lat: ${validLastKnownLocation.latitude.toFixed(6)}<br/>` +
            `Lng: ${validLastKnownLocation.longitude.toFixed(6)}`
          )
        )
        .addTo(mapRef.current);

      lastGpsMarkerRef.current = lastGpsMarker;

      // Also draw a line between the two points
      const lineId = 'gps-difference-line';

      // Remove existing line if any
      if (mapRef.current.getSource(lineId)) {
        mapRef.current.removeLayer(lineId);
        mapRef.current.removeSource(lineId);
      }

      // Add line between current and last GPS
      if (validLiveLocation) {
        mapRef.current.addSource(lineId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [validLiveLocation.longitude, validLiveLocation.latitude],
                [validLastKnownLocation.longitude, validLastKnownLocation.latitude]
              ]
            }
          }
        });

        mapRef.current.addLayer({
          id: lineId,
          type: 'line',
          source: lineId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF9800',
            'line-width': 2,
            'line-dasharray': [2, 2]
          }
        });
      }
    } else {
      // Remove line if locations are not different
      const lineId = 'gps-difference-line';
      if (mapRef.current.getSource(lineId)) {
        mapRef.current.removeLayer(lineId);
        mapRef.current.removeSource(lineId);
      }
    }
  }, [locationsAreDifferent, validLiveLocation, validLastKnownLocation, validPastTelemetryLocation]);

  // Pan to selected trip location when it changes, or back to current location when deselected
  useEffect(() => {
    if (!mapRef.current) return;

    // If selectedTripLocation is set and valid, fly to trip location
    if (validPastTelemetryLocation) {
      const tripPosition: [number, number] = [validPastTelemetryLocation.longitude, validPastTelemetryLocation.latitude];

      mapRef.current.flyTo({
        center: tripPosition,
        zoom: 15,
        duration: 1500,
      });

      if (markerRef.current) {
        markerRef.current.setLngLat(tripPosition);
      }
    } else {
      // selectedTripLocation is null or invalid - fly back to bike's current location
      const bikeLocation = validLiveLocation || validLastKnownLocation;;

      if (bikeLocation) {
        const bikePosition: [number, number] = [bikeLocation.longitude, bikeLocation.latitude];

        mapRef.current.flyTo({
          center: bikePosition,
          zoom: 14,
          duration: 1500,
        });

        if (markerRef.current) {
          markerRef.current.setLngLat(bikePosition);
        }
      }
    }
  }, [validPastTelemetryLocation, validLiveLocation, validLastKnownLocation]);

  // Update marker position when live location changes
  useEffect(() => {
    if (!markerRef.current || !mapRef.current || !currentLocation) return;

    const newPosition: [number, number] = [currentLocation.longitude, currentLocation.latitude];
    markerRef.current.setLngLat(newPosition);

    // Smoothly pan to new location (only if not showing a selected trip)
    if (!validPastTelemetryLocation) {
      mapRef.current.panTo(newPosition, { duration: 1000 });
    }

    // Update marker color based on battery
    const markerElement = markerRef.current.getElement();
    if (markerElement) {
      markerElement.style.backgroundColor = (bike.battery_status || 0) > 20 ? '#4CAF50' : '#F44336';
    }

    // Update popup content
    const popup = markerRef.current.getPopup();
    if (popup) {
      popup.setHTML(
        `<strong>${bike.name}</strong><br/>Battery: ${bike.battery_status || 0}%${validLiveLocation ? '<br/><span style="color: #4CAF50;">● Live</span>' : ''}`
      );
    }
  }, [currentLocation, bike, validLiveLocation, validPastTelemetryLocation]);

  return (
    <div
      className={styles['map-container']}

      style={{ cursor: 'pointer' }}
      title="Click to view full map"
    >
      {!MAPBOX_TOKEN && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}>
          <p style={{ margin: 0, color: '#C85A28', fontWeight: 'bold' }}>
            Map unavailable
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#666' }}>
            MAPBOX_TOKEN is not configured
          </p>
        </div>
      )}
      {!currentLocation && MAPBOX_TOKEN && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10,
        }}>
          ⚠ No location data yet
        </div>
      )}
      {/* Show "End Trip Location" badge when a trip is selected */}
      {validPastTelemetryLocation && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(200, 90, 40, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
        }}>
          📍 End Trip Location
        </div>
      )}
      {/* Show appropriate badge based on location source when no trip is selected */}
      {!validPastTelemetryLocation && currentLocation && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: locationSource === 'present' ? 'rgba(76, 175, 80, 0.9)'
            : 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 10,
        }}>
          {locationSource === 'present' ? '● Live Tracking'
            : '📍 Past Location'}
        </div>
      )}
      {/* Show GPS discrepancy warning when current and last GPS differ significantly */}
      {locationsAreDifferent && !validPastTelemetryLocation && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(255, 152, 0, 0.95)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          <span>⚠ GPS Discrepancy Detected</span>
          <span style={{ fontWeight: 'normal', fontSize: '10px' }}>
            🟢 Current GPS &nbsp;&nbsp; 🟠 Last GPS
          </span>
        </div>
      )}
      <div ref={mapContainerRef} className={styles['trip-map']} />
    </div>
  );
}

export default BikeMap;

