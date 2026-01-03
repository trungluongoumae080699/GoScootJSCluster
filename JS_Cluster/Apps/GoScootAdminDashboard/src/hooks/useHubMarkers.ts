
import { useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl'; // Mapbox GL JS for interactive map markers
import { Hub } from '@trungthao/admin_dashboard_dto';


/**
 * HUB MARKERS HOOK
 * 
 * @param onHubClick - Callback function triggered when user clicks on a hub marker
 * @returns Object with methods to manage hub markers on the map
 */
export function useHubMarkers(onHubClick: (hub: Hub) => void) {
  // === DATA STORAGE REFERENCES ===
  // Maps hub IDs to their corresponding Mapbox marker instances for efficient updates
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  
  // Maps hub IDs to their current data (GPS coordinates, address, bike count, etc.)
  const hubDataRef = useRef<Map<string, Hub>>(new Map());
  
  // Current visibility state of all hub markers (true = visible, false = hidden)
  const isVisibleRef = useRef<boolean>(true);

  /**
   * HUB MARKER ELEMENT CREATOR
   * 
   * Creates a custom DOM element for each hub marker consisting of:
   * - Hub icon image (moto_hub.png) as the main marker
   * - Address label positioned below the icon
   * - Interactive hover effects for better UX
   * - Click handler to trigger hub detail display
   * 
   * Visual Design:
   * - 32x32px hub icon with rounded corners
   * - White background with subtle shadow
   * - Address text in small, readable font
   * - Hover effects: scale up and add glow
   * - Cursor pointer to indicate clickability
   * 
   * @param hub - Hub object containing ID, coordinates, and address
   * @returns DOM element ready to be used as a Mapbox marker
   */
  const createHubMarkerElement = (hub: Hub) => {
    // === CONTAINER SETUP ===
    // Main container that holds both the icon and address label vertically
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer';

    // === HUB ICON MARKER ===
    // The main visual marker representing the hub location
    const marker = document.createElement('div');
    marker.className = 'hub-marker';
    marker.style.cssText = 'width:32px;height:32px;background:white;border:2px solid #4CAF50;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;padding:4px';
    
    // Create image element for hub icon
    const img = document.createElement('img');
    img.src = '/moto_hub.png';
    img.alt = 'Hub';
    img.style.cssText = 'width:100%;height:100%;object-fit:contain';
    
    marker.appendChild(img);

    // Label: Shows hub address below the marker
    const label = document.createElement('div');
    label.className = 'hub-label';
    label.textContent = hub.id || hub.address || hub.id;
    label.style.cssText = 'font-size:9px;font-weight:bold;color:#333;background-color:white;padding:2px 4px;border-radius:3px;margin-top:4px;box-shadow:0 1px 3px rgba(0,0,0,0.3);white-space:nowrap;pointer-events:none;max-width:80px;overflow:hidden;text-overflow:ellipsis';

    // Add marker and label to container
    container.appendChild(marker);
    container.appendChild(label);

    // Event: Mouse hover - enhance shadow and border
    container.addEventListener('mouseenter', () => {
      marker.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
      marker.style.borderWidth = '3px';
      marker.style.transform = 'scale(1.1)';
    });
    
    // Event: Mouse leave - restore normal appearance
    container.addEventListener('mouseleave', () => {
      marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      marker.style.borderWidth = '2px';
      marker.style.transform = 'scale(1)';
    });
    
    // Event: Click - trigger hub detail popup
    container.addEventListener('click', () => {
      onHubClick(hub);
    });

    return container;
  };

  /**
   * Updates hub markers on the map
   * 
   * @param hubs - Array of hubs from API
   * @param map - Mapbox map instance
   */
  const updateHubMarkers = useCallback((hubs: Hub[], map: mapboxgl.Map) => {
    // Get viewport bounds once
    const bounds = map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    
    // Helper: Check if coordinates are in viewport
    const isInViewport = (lng: number, lat: number) =>
      lng >= west && lng <= east && lat >= south && lat <= north;
    
    // Step 1: Store ALL hubs
    hubs.forEach(hub => {
      hubDataRef.current.set(hub.id, hub);
    });
    
    // Step 2: Remove markers for hubs outside viewport or deleted
    markersRef.current.forEach((marker, hubId) => {
      const hub = hubDataRef.current.get(hubId);
      if (!hub || hub.deleted || !isInViewport(hub.longitude, hub.latitude)) {
        marker.remove();
        markersRef.current.delete(hubId);
      }
    });

    // Step 3: Add or update markers for hubs in viewport
    hubDataRef.current.forEach((hub) => {
      if (hub.deleted || !isInViewport(hub.longitude, hub.latitude)) return;
      
      const existingMarker = markersRef.current.get(hub.id);

      if (existingMarker) {
        // Just update position (faster than recreating)
        existingMarker.setLngLat([hub.longitude, hub.latitude]);
      } else {
        // Create new marker
        const el = createHubMarkerElement(hub);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([hub.longitude, hub.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 15 }).setHTML(
              `<strong>${hub.id || 'Hub'}</strong><br/>${hub.address}}`
            )
          )
          .addTo(map);

        // Apply current visibility state to new marker
        el.style.display = isVisibleRef.current ? 'flex' : 'none';

        markersRef.current.set(hub.id, marker);
      }
    });

    return {
      totalCount: hubDataRef.current.size,
      visibleCount: markersRef.current.size
    };
  }, [onHubClick]);

  /**
   * Removes all hub markers from the map
   */
  const clearHubMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    hubDataRef.current.clear();
  }, []);

  /**
   * Get hub data by ID
   */
  const getHubById = useCallback((hubId: string): Hub | undefined => {
    return hubDataRef.current.get(hubId);
  }, []);

  /**
   * Show/hide hub markers
   */
  const setHubMarkersVisible = useCallback((visible: boolean) => {
    isVisibleRef.current = visible;
    markersRef.current.forEach(marker => {
      const element = marker.getElement();
      element.style.display = visible ? 'flex' : 'none';
    });
  }, []);

  return { 
    updateHubMarkers, 
    clearHubMarkers, 
    getHubById, 
    setHubMarkersVisible 
  };
}
