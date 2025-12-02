
import { useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { BikeUpdate } from '@trungthao/admin_dashboard_dto';

export function useBikeMarkers(onBikeClick: (bike: BikeUpdate) => void) {
  // Ref: Store all active markers (bikeId -> Marker instance)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  // Ref: Store all bike data (bikeId -> BikeUpdate data)
  const bikeDataRef = useRef<Map<string, BikeUpdate>>(new Map());

  /**
   * Creates a custom marker element for a bike
   * Returns a DOM element with:
   * - Colored dot (green if battery > 20%, red otherwise)
   * - Bike ID label below the dot
   * - Hover effects
   * - Click handler
   */
  const createMarkerElement = (bike: BikeUpdate) => {
    // Container: Holds both dot and label, stacked vertically
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.cursor = 'pointer';

    // Dot: Circular marker representing the bike
    const dot = document.createElement('div');
    dot.className = 'bike-dot-marker';
    dot.style.width = '12px';
    dot.style.height = '12px';
    dot.style.borderRadius = '50%'; // Make it circular
    // Color: Green if battery > 20%, Red if low battery
    dot.style.backgroundColor = bike.battery_status > 20 ? '#4CAF50' : '#F44336';
    dot.style.border = '2px solid white'; // White border for visibility
    dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'; // Shadow for depth
    dot.style.transition = 'all 0.3s ease'; // Smooth hover animation

    // Label: Shows bike ID below the dot
    const label = document.createElement('div');
    label.className = 'bike-id-label';
    label.textContent = bike.id; // Display bike ID
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.style.color = '#333';
    label.style.backgroundColor = 'white';
    label.style.padding = '2px 6px';
    label.style.borderRadius = '4px';
    label.style.marginTop = '4px'; // Space between dot and label
    label.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
    label.style.whiteSpace = 'nowrap'; // Keep label on one line
    label.style.pointerEvents = 'none'; // Don't block clicks on container

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
   * - Stores all bike data
   * - Only renders markers for bikes in current viewport (performance optimization)
   * - Removes markers that moved out of viewport
   * - Updates existing markers with new data
   * - Adds new markers for bikes that entered viewport
   * 
   * @param bikes - Array of bike updates from WebSocket
   * @param map - Mapbox map instance
   * @returns Object with totalCount (all bikes) and visibleCount (bikes in viewport)
   */
  const updateMarkers = useCallback((bikes: BikeUpdate[], map: mapboxgl.Map) => {
    // Step 1: Store all bike data in memory
    bikes.forEach(bike => {
      bikeDataRef.current.set(bike.id, bike);
    });

    // Step 2: Get current map viewport bounds
    const bounds = map.getBounds();
    
    // Step 3: Filter bikes that are within current viewport
    const bikesInViewport: BikeUpdate[] = [];
    bikeDataRef.current.forEach(bike => {
      // Check if bike coordinates are within viewport bounds
      const inViewport = 
        bike.longitude >= bounds.getWest() &&
        bike.longitude <= bounds.getEast() &&
        bike.latitude >= bounds.getSouth() &&
        bike.latitude <= bounds.getNorth();
      
      if (inViewport) {
        bikesInViewport.push(bike);
      }
    });

    // Step 4: Remove markers for bikes that moved out of viewport
    markersRef.current.forEach((marker, bikeId) => {
      const bike = bikeDataRef.current.get(bikeId);
      if (!bike) return;
      
      // Check if this bike is still in viewport
      const inViewport = 
        bike.longitude >= bounds.getWest() &&
        bike.longitude <= bounds.getEast() &&
        bike.latitude >= bounds.getSouth() &&
        bike.latitude <= bounds.getNorth();
      
      // Remove marker if bike is outside viewport
      if (!inViewport) {
        marker.remove();
        markersRef.current.delete(bikeId);
      }
    });

    // Step 5: Add or update markers for bikes in viewport
    bikesInViewport.forEach((bike) => {
      const existingMarker = markersRef.current.get(bike.id);

      if (existingMarker) {
        // Update existing marker: Remove old one and create new one with updated data
        existingMarker.remove();
        
        // Create fresh marker with updated bike data
        const el = createMarkerElement(bike);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([bike.longitude, bike.latitude]) // Set position
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(
              `<strong>Bike ${bike.id}</strong><br/>Battery: ${bike.battery_status}%`
            )
          )
          .addTo(map); // Add to map

        markersRef.current.set(bike.id, marker);
      } else {
        // Create new marker for bike that just entered viewport
        const el = createMarkerElement(bike);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([bike.longitude, bike.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(
              `<strong>Bike ${bike.id}</strong><br/>Battery: ${bike.battery_status}%`
            )
          )
          .addTo(map);

        markersRef.current.set(bike.id, marker);
      }
    });

    // Return counts for status display
    return {
      totalCount: bikeDataRef.current.size, // Total bikes tracked
      visibleCount: markersRef.current.size // Bikes currently visible on map
    };
  }, [onBikeClick]);

  /**
   * Removes all markers from the map
   * Called when component unmounts or map is reset
   */
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
  }, []);

  // Return functions to manage markers
  return { updateMarkers, clearMarkers };
}
