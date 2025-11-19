import mapboxgl from 'mapbox-gl';

// Configuration
const NUM_SCOOTERS = 50; // Optimized number for performance and visual density
const SCOOTER_SPEED = 0.00001; // Much slower, more realistic
const COLLISION_DISTANCE = 0.002; // Minimum distance between scooters

// HCM City bounds
const HCM_BOUNDS = {
  minLng: 106.55,
  maxLng: 106.85,
  minLat: 10.65,
  maxLat: 10.95,
};

// Scooter data type
export interface Scooter {
  id: number;
  position: [number, number];
  route: [number, number][];
  routeIndex: number;
  marker: mapboxgl.Marker | null;
}

// Generate random position within HCM bounds
const randomPosition = (): [number, number] => [
  HCM_BOUNDS.minLng + Math.random() * (HCM_BOUNDS.maxLng - HCM_BOUNDS.minLng),
  HCM_BOUNDS.minLat + Math.random() * (HCM_BOUNDS.maxLat - HCM_BOUNDS.minLat),
];

// Get route between two points using Mapbox Directions API
const getRoute = async (
  start: [number, number],
  end: [number, number],
  token: string
): Promise<[number, number][]> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${token}`
    );
    const data = await response.json();

    if (data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates;
    }
  } catch (error) {
    console.error('Error fetching route:', error);
  }

  // Fallback: direct line
  return [start, end];
};

// Check if two scooters are too close (collision detection)
const isTooClose = (pos1: [number, number], pos2: [number, number]): boolean => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < COLLISION_DISTANCE;
};

// Check if position would collide with any other scooter
const wouldCollide = (
  position: [number, number],
  scooters: Scooter[],
  currentId: number
): boolean => {
  return scooters.some(
    (scooter) => scooter.id !== currentId && scooter.marker && isTooClose(position, scooter.position)
  );
};

// Initialize scooters on the map
export const initializeScooters = async (
  map: mapboxgl.Map,
  token: string
): Promise<Scooter[]> => {
  const scooters: Scooter[] = [];

  for (let i = 0; i < NUM_SCOOTERS; i++) {
    const start = randomPosition();
    const end = randomPosition();
    const route = await getRoute(start, end, token);

    // Create marker element with image
    const el = document.createElement('img');
    el.className = 'scooter-marker';
    el.src = '/scooter_type.png';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.cursor = 'pointer';
    el.style.userSelect = 'none';
    el.alt = 'Scooter';

    // Create marker
    const marker = new mapboxgl.Marker(el).setLngLat(start).addTo(map);

    scooters.push({
      id: i,
      position: start,
      route,
      routeIndex: 0,
      marker,
    });
  }

  return scooters;
};

// Animate scooters along their routes with collision avoidance
export const animateScooters = (
  scooters: Scooter[],
  token: string,
  animationRef: { current: number | undefined }
) => {
  const animate = () => {
    scooters.forEach(async (scooter) => {
      if (scooter.routeIndex >= scooter.route.length - 1) {
        // Reached end of route, get new route
        const newEnd = randomPosition();
        const newRoute = await getRoute(scooter.position, newEnd, token);
        scooter.route = newRoute;
        scooter.routeIndex = 0;
        return;
      }

      // Get next point on route
      const nextPoint = scooter.route[scooter.routeIndex + 1];
      const [lng, lat] = scooter.position;
      const [nextLng, nextLat] = nextPoint;

      // Calculate movement
      const dx = nextLng - lng;
      const dy = nextLat - lat;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < SCOOTER_SPEED) {
        // Move to next waypoint
        scooter.position = nextPoint;
        scooter.routeIndex++;
      } else {
        // Calculate new position
        const newPosition: [number, number] = [
          lng + (dx / distance) * SCOOTER_SPEED,
          lat + (dy / distance) * SCOOTER_SPEED,
        ];

        // Check for collision before moving
        if (!wouldCollide(newPosition, scooters, scooter.id)) {
          scooter.position = newPosition;
        }
        // If collision detected, scooter stays in place (waits)
      }

      scooter.marker?.setLngLat(scooter.position);
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  animate();
};

// Cleanup scooters
export const cleanupScooters = (scooters: Scooter[]) => {
  scooters.forEach((scooter) => scooter.marker?.remove());
};
