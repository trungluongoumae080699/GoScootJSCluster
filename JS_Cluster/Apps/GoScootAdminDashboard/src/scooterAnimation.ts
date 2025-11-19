import mapboxgl from 'mapbox-gl';

// Configuration
const NUM_SCOOTERS = 50; 
const SCOOTER_SPEED = 0.000002; 
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
  isWaitingForRoute: boolean;
}

// Areas to avoid (water/rivers in HCM City - approximate)
const AVOID_ZONES = [
  // Saigon River area
  { minLng: 106.68, maxLng: 106.72, minLat: 10.76, maxLat: 10.80 },
];

// Check if position is in water/avoid zone
const isInAvoidZone = (lng: number, lat: number): boolean => {
  return AVOID_ZONES.some(zone => 
    lng >= zone.minLng && lng <= zone.maxLng && 
    lat >= zone.minLat && lat <= zone.maxLat
  );
};

// Generate random position within HCM bounds, avoiding water
const randomPosition = (): [number, number] => {
  let lng, lat;
  let attempts = 0;
  const maxAttempts = 20;
  
  do {
    lng = HCM_BOUNDS.minLng + Math.random() * (HCM_BOUNDS.maxLng - HCM_BOUNDS.minLng);
    lat = HCM_BOUNDS.minLat + Math.random() * (HCM_BOUNDS.maxLat - HCM_BOUNDS.minLat);
    attempts++;
  } while (isInAvoidZone(lng, lat) && attempts < maxAttempts);
  
  return [lng, lat];
};

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
      isWaitingForRoute: false,
    });
  }

  return scooters;
};

// Animate scooters along their routes
export const animateScooters = (
  scooters: Scooter[],
  token: string,
  animationRef: { current: number | undefined }
) => {
  const animate = () => {
    scooters.forEach((scooter) => {
      // Skip if waiting for new route
      if (scooter.isWaitingForRoute) return;

      // Check if route needs updating
      if (scooter.routeIndex >= scooter.route.length - 1) {
        // Reached end of route, get new route asynchronously
        if (!scooter.isWaitingForRoute) {
          scooter.isWaitingForRoute = true;
          const newEnd = randomPosition();
          getRoute(scooter.position, newEnd, token).then((newRoute) => {
            scooter.route = newRoute;
            scooter.routeIndex = 0;
            scooter.isWaitingForRoute = false;
          }).catch(() => {
            // On error, create simple fallback route
            scooter.route = [scooter.position, newEnd];
            scooter.routeIndex = 0;
            scooter.isWaitingForRoute = false;
          });
        }
        return;
      }

      // Get next point on route
      const nextPoint = scooter.route[scooter.routeIndex + 1];
      if (!nextPoint) {
        // Force route update if no next point
        scooter.routeIndex = scooter.route.length - 1;
        return;
      }
      
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
        // Calculate new position and move (no collision detection)
        scooter.position = [
          lng + (dx / distance) * SCOOTER_SPEED,
          lat + (dy / distance) * SCOOTER_SPEED,
        ];
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

