/**
 * Vehicle Animation Module
 * Handles the animation and movement of bikes and scooters on the map
 * Uses Mapbox Directions API to generate realistic routes along roads
 */

import mapboxgl from 'mapbox-gl';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Number of scooters to display on the map */
const NUM_SCOOTERS = 50;

/** Speed of vehicle movement (degrees per frame) */
const VEHICLE_SPEED = 0.000002;

/** Geographic bounds for Ho Chi Minh City */
const HCM_BOUNDS = {
  minLng: 106.55, // Western boundary
  maxLng: 106.85, // Eastern boundary
  minLat: 10.65,  // Southern boundary
  maxLat: 10.95,  // Northern boundary
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * Vehicle data structure (unified for bikes and scooters)
 * @property id - Unique identifier for the vehicle
 * @property type - Type of vehicle ('bike' or 'scooter')
 * @property position - Current [longitude, latitude] position
 * @property route - Array of waypoints forming the vehicle's route
 * @property routeIndex - Current position in the route array
 * @property marker - Mapbox marker instance for rendering
 * @property isWaitingForRoute - Flag indicating if vehicle is fetching a new route
 */
export interface Vehicle {
  id: string;
  type: 'bike' | 'scooter';
  position: [number, number];
  route: [number, number][];
  routeIndex: number;
  marker: mapboxgl.Marker | null;
  isWaitingForRoute: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a random position within Ho Chi Minh City bounds
 * @returns [longitude, latitude] coordinates
 */
export const randomPosition = (): [number, number] => {
  const lng = HCM_BOUNDS.minLng + Math.random() * (HCM_BOUNDS.maxLng - HCM_BOUNDS.minLng);
  const lat = HCM_BOUNDS.minLat + Math.random() * (HCM_BOUNDS.maxLat - HCM_BOUNDS.minLat);
  return [lng, lat];
};

/**
 * Fetch a driving route between two points using Mapbox Directions API
 * @param start - Starting [longitude, latitude] coordinates
 * @param end - Ending [longitude, latitude] coordinates
 * @param token - Mapbox API access token
 * @returns Array of waypoints forming the route, or direct line if API fails
 */
export const getRoute = async (
  start: [number, number],
  end: [number, number],
  token: string
): Promise<[number, number][]> => {
  try {
    // Call Mapbox Directions API for driving route
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${token}`
    );
    const data = await response.json();

    // Extract route coordinates if available
    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates;
    }
  } catch (error) {
    console.error('Error fetching route:', error);
  }
  
  // Fallback: return direct line between points
  return [start, end];
};

// ============================================================================
// MARKER CREATION
// ============================================================================

/**
 * Create a visual marker for a vehicle on the map
 * @param type - Type of vehicle ('bike' or 'scooter')
 * @param position - Initial [longitude, latitude] position
 * @param map - Mapbox map instance to add marker to
 * @param isHighlighted - Whether to apply special highlighting (for featured bike)
 * @returns Configured Mapbox marker instance
 */
const createVehicleMarker = (
  type: 'bike' | 'scooter',
  position: [number, number],
  map: mapboxgl.Map,
  isHighlighted: boolean = false
): mapboxgl.Marker => {
  // Create image element for the marker
  const el = document.createElement('img');
  el.className = `${type}-marker`;
  el.src = '/bike_type.png';
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.cursor = 'pointer';
  el.style.userSelect = 'none';
  el.alt = type === 'bike' ? 'Bike' : 'Scooter';

  // Apply special styling for the featured bike
  if (isHighlighted) {
    el.style.filter = 'drop-shadow(0 0 8px rgba(200, 90, 40, 0.8))';
    el.style.border = '2px solid #C85A28';
    el.style.borderRadius = '50%';
  }

  // Create and configure the marker
  const marker = new mapboxgl.Marker(el).setLngLat(position).addTo(map);

  // Add popup for bikes showing VIN information
  if (type === 'bike') {
    marker.setPopup(new mapboxgl.Popup().setHTML('<h3>VIN-123456</h3><p>Current Location</p>'));
  }

  return marker;
};

// ============================================================================
// VEHICLE INITIALIZATION
// ============================================================================

/**
 * Initialize all vehicles on the map (scooters + optional special bike)
 * Creates markers and generates initial routes for each vehicle
 * @param map - Mapbox map instance
 * @param token - Mapbox API access token
 * @param specialBikePosition - Optional position for featured bike (VIN-123456)
 * @returns Array of initialized vehicle objects
 */
export const initializeVehicles = async (
  map: mapboxgl.Map,
  token: string,
  specialBikePosition?: [number, number]
): Promise<Vehicle[]> => {
  const vehicles: Vehicle[] = [];

  // Add special featured bike if position is provided
  if (specialBikePosition) {
    const end = randomPosition();
    const route = await getRoute(specialBikePosition, end, token);

    const marker = createVehicleMarker('bike', specialBikePosition, map, true);

    vehicles.push({
      id: 'bike-vin-123456',
      type: 'bike',
      position: specialBikePosition,
      route,
      routeIndex: 0,
      marker,
      isWaitingForRoute: false,
    });
  }

  // Add fleet of scooters at random positions
  for (let i = 0; i < NUM_SCOOTERS; i++) {
    const start = randomPosition();
    const end = randomPosition();
    const route = await getRoute(start, end, token);

    const marker = createVehicleMarker('scooter', start, map, false);

    vehicles.push({
      id: `scooter-${i}`,
      type: 'scooter',
      position: start,
      route,
      routeIndex: 0,
      marker,
      isWaitingForRoute: false,
    });
  }

  return vehicles;
};

// ============================================================================
// ANIMATION
// ============================================================================

/**
 * Animate vehicles along their routes using requestAnimationFrame
 * Handles smooth movement, route completion, and automatic route regeneration
 * @param vehicles - Array of vehicles to animate
 * @param token - Mapbox API access token for fetching new routes
 * @param animationRef - Reference to store animation frame ID for cleanup
 */
export const animateVehicles = (
  vehicles: Vehicle[],
  token: string,
  animationRef: { current: number | undefined }
) => {
  const animate = () => {
    vehicles.forEach((vehicle) => {
      // Skip vehicles that are currently fetching a new route
      if (vehicle.isWaitingForRoute) return;

      // Check if vehicle has reached the end of its route
      if (vehicle.routeIndex >= vehicle.route.length - 1) {
        // Request a new route to a random destination
        if (!vehicle.isWaitingForRoute) {
          vehicle.isWaitingForRoute = true;
          const newEnd = randomPosition();
          
          getRoute(vehicle.position, newEnd, token)
            .then((newRoute) => {
              vehicle.route = newRoute;
              vehicle.routeIndex = 0;
              vehicle.isWaitingForRoute = false;
            })
            .catch(() => {
              // Fallback: create direct route if API fails
              vehicle.route = [vehicle.position, newEnd];
              vehicle.routeIndex = 0;
              vehicle.isWaitingForRoute = false;
            });
        }
        return;
      }

      // Get the next waypoint in the route
      const nextPoint = vehicle.route[vehicle.routeIndex + 1];
      if (!nextPoint) {
        vehicle.routeIndex = vehicle.route.length - 1;
        return;
      }

      const [lng, lat] = vehicle.position;
      const [nextLng, nextLat] = nextPoint;

      // Calculate distance and direction to next waypoint
      const dx = nextLng - lng;
      const dy = nextLat - lat;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < VEHICLE_SPEED) {
        // Close enough - snap to next waypoint
        vehicle.position = nextPoint;
        vehicle.routeIndex++;
      } else {
        // Move towards next waypoint at constant speed
        vehicle.position = [
          lng + (dx / distance) * VEHICLE_SPEED,
          lat + (dy / distance) * VEHICLE_SPEED,
        ];
      }

      // Update marker position on the map
      vehicle.marker?.setLngLat(vehicle.position);
    });

    // Schedule next animation frame
    animationRef.current = requestAnimationFrame(animate);
  };

  // Start the animation loop
  animate();
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find a vehicle by its unique ID
 * @param vehicles - Array of vehicles to search
 * @param id - Unique vehicle identifier
 * @returns Vehicle object if found, undefined otherwise
 */
export const getVehicleById = (vehicles: Vehicle[], id: string): Vehicle | undefined => {
  return vehicles.find((v) => v.id === id);
};

/**
 * Remove all vehicle markers from the map and clean up resources
 * Should be called when component unmounts or map is destroyed
 * @param vehicles - Array of vehicles to clean up
 */
export const cleanupVehicles = (vehicles: Vehicle[]) => {
  vehicles.forEach((vehicle) => vehicle.marker?.remove());
};
