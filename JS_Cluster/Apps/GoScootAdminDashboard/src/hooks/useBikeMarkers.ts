

import { useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl'; // Mapbox GL JS for interactive map markers
import { BikeUpdate } from '@trungthao/admin_dashboard_dto'; // Type definition for bike data

/**
 * BIKE MARKERS HOOK
 * 
 * @param onBikeClick - Callback function triggered when user clicks on a bike marker
 * @returns Object with methods to manage bike markers on the map
 */
export function useBikeMarkers(onBikeClick: (bike: BikeUpdate) => void) {
  // === DATA STORAGE REFERENCES ===
  // Maps bike IDs to their corresponding Mapbox marker instances for efficient updates
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  // Maps bike IDs to their current data (GPS coordinates, battery, status, etc.)
  const bikeDataRef = useRef<Map<string, BikeUpdate>>(new Map());
  
  // Set of all unique bike IDs ever encountered (used for cumulative total count)
  const allBikesSeenRef = useRef<Set<string>>(new Set());
  
  // Current visibility state of all bike markers (true = visible, false = hidden)
  const isVisibleRef = useRef<boolean>(true);

  /**
   * BIKE STATUS COLOR MAPPING
   * 
   * Determines the marker color based on bike operational status.
   * Colors match the bike detail popup for visual consistency.
   * 
   * Color Scheme:
   * - Normal: Green (#4CAF50) - Bike is operational and available
   * - Out of bound: Orange (#FF9800) - Bike is outside allowed area
   * - Low battery: Red (#F44336) - Bike needs charging
   * - Default: Gray (#757575) - Unknown or other status
   * 
   * @param operationStatus - Current operational status of the bike
   * @returns Hex color code for the marker
   */
  const getOperationStatusColor = (bike: BikeUpdate) => {
    if (bike.isCrashed || bike.batteryIsLow || bike.isOutOfBound || bike.isToppled){
      return '#F44336'; 
    } else {
      return '#4CAF50';
    }
    
  };

  /**
   * Get color for usage status (matches popup colors)
   */
  const getUsageStatusColor = (usageStatus: string) => {
    switch (usageStatus) {
      case 'Idle': return '#4CAF50';
      case 'Reserved': return '#FF9800';
      case 'Inused': return '#2196F3';
      default: return '#757575';
    }
  };

  /**
   * Creates a custom marker element for a bike
   * Returns a DOM element with:
   * - Dual-colored dot (operationStatus and usageStatus)
   * - Bike ID label below the dot
   * - Hover effects
   * - Click handler
   */
  const createMarkerElement = (bike: BikeUpdate) => {
    // Container: Holds both dot and label, stacked vertically
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer';

    // Dot: Circular marker with dual colors representing the bike states
    const dot = document.createElement('div');
    dot.className = 'bike-dot-marker';
    
    // Get colors for both states
    const operationColor = getOperationStatusColor(bike);

    const usageColor = getUsageStatusColor(bike.usageStatus || 'Idle');
    
    // Create gradient background with both colors (split vertically)
    const gradient = `linear-gradient(90deg, ${operationColor} 50%, ${usageColor} 50%)`;
    
    dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${gradient};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);transition:all 0.3s ease`;

    // Label: Shows bike ID below the dot
    const label = document.createElement('div');
    label.className = 'bike-id-label';
    label.textContent = bike.id;
    label.style.cssText = 'font-size:10px;font-weight:bold;color:#333;background-color:white;padding:2px 6px;border-radius:4px;margin-top:4px;box-shadow:0 1px 3px rgba(0,0,0,0.3);white-space:nowrap;pointer-events:none';

    // Add dot and label to container
    container.appendChild(dot);
    container.appendChild(label);

    // Event: Mouse hover - enhance shadow and border
    container.addEventListener('mouseenter', () => {
      dot.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
      dot.style.borderWidth = '3px';
    });
    
    // Event: Mouse leave - restore normal appearance
    container.addEventListener('mouseleave', () => {
      dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      dot.style.borderWidth = '2px';
    });
    
    // Event: Click - trigger bike detail popup
    container.addEventListener('click', () => {
      onBikeClick(bike);
    });

    return container;
  };

  /**
   * Updates bike markers on the map
   * Optimized for performance:
   * - Only stores bikes in viewport
   * - Updates marker position instead of recreating
   * - Minimal DOM operations
   * 
   * @param bikes - Array of bike updates from WebSocket
   * @param map - Mapbox map instance
   * @returns Object with totalCount and visibleCount
   */
  const updateMarkers = useCallback((bikes: BikeUpdate[], map: mapboxgl.Map) => {
    // Get viewport bounds once
    const bounds = map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    
    // Helper: Check if coordinates are in viewport
    const isInViewport = (lng: number, lat: number) =>
      lng >= west && lng <= east && lat >= south && lat <= north;
    
    // Step 1: Store ALL bikes and track them for total count
    bikes.forEach(bike => {
      bikeDataRef.current.set(bike.id, bike);
      allBikesSeenRef.current.add(bike.id); // Track for cumulative total
    });
    
    // Step 2: Remove markers for bikes outside viewport
    markersRef.current.forEach((marker, bikeId) => {
      const bike = bikeDataRef.current.get(bikeId);
      if (!bike || !isInViewport(bike.longitude, bike.latitude)) {
        marker.remove();
        markersRef.current.delete(bikeId);
      }
    });

    // Step 3: Add or update markers for bikes in viewport
    bikeDataRef.current.forEach((bike) => {
      if (!isInViewport(bike.longitude, bike.latitude)) return;
      
      const existingMarker = markersRef.current.get(bike.id);

      if (existingMarker) {
        // Just update position (faster than recreating)
        existingMarker.setLngLat([bike.longitude, bike.latitude]);
      } else {
        // Create new marker
        const el = createMarkerElement(bike);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([bike.longitude, bike.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(
              `<strong>Bike ${bike.id}</strong><br/>Battery: ${bike.battery_status}%`
            )
          )
          .addTo(map);

        // Apply current visibility state to new marker
        el.style.display = isVisibleRef.current ? 'flex' : 'none';

        markersRef.current.set(bike.id, marker);
      }
    });

    // Return counts
    return {
      totalCount: allBikesSeenRef.current.size, // Cumulative total of all bikes ever seen
      visibleCount: markersRef.current.size // Bikes currently visible in viewport
    };
  }, [onBikeClick]);

  /**
   * Removes all markers from the map
   * Called when component unmounts or map is reset
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    bikeDataRef.current.clear();
    allBikesSeenRef.current.clear();
  }, []);

  /**
   * Get bike data by ID
   * Returns the bike data if it exists in memory
   */
  const getBikeById = useCallback((bikeId: string): BikeUpdate | undefined => {
    return bikeDataRef.current.get(bikeId);
  }, []);

  /**
   * Get all bikes currently stored in memory from WebSocket
   * Returns array of all bike data received via WebSocket
   */
  const getAllBikes = useCallback((): BikeUpdate[] => {
    return Array.from(bikeDataRef.current.values());
  }, []);

  /**
   * Show/hide bike markers
   */
  const setBikeMarkersVisible = useCallback((visible: boolean) => {
    isVisibleRef.current = visible;
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.display = visible ? 'flex' : 'none';
    });
  }, []);

  // Return functions to manage markers
  return { updateMarkers, clearMarkers, getBikeById, getAllBikes, setBikeMarkersVisible };
}
