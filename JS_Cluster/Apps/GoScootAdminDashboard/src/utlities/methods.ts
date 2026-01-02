import { BikeStatus } from "@trungthao/admin_dashboard_dto";

  const getStatusStyle =(status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return { background: "#d4edda", color: "#155724" };
      case "Inused":
        return { background: "#ffe4c4", color: "#856404" };
      case "Reserved":
        return { background: "#fff3cd", color: "#856404" };
      default:
        return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return "Available";
      case "Inused":
        return "Inused";
      case "Reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  function timestampToDateInput(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10); // yyyy-mm-dd
}

export function dateToStartOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dateToEndOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number, lon1: number, 
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate and return coordinates if valid for Mapbox, otherwise null
 * Longitude: -180 to 180, Latitude: -90 to 90
 */
export function getValidLocation(location: { longitude: number; latitude: number } | null | undefined): { longitude: number; latitude: number } | null {
  if (!location) return null;
  const { longitude, latitude } = location;
  if (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    !isNaN(longitude) &&
    !isNaN(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  ) {
    return location;
  }
  return null;
}