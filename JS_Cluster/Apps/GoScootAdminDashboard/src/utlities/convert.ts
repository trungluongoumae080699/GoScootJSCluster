const MAPBOX_TOKEN = (import.meta as any).env.VITE_MAPBOX_TOKEN

export const convertLocationName = async (
  longitude: number,
  latitude: number
): Promise<string> => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    return "Unknown location";
  }

  const placeName: string = data.features[0].place_name;

  if (placeName.toLowerCase().includes("null")) {
    return "Unknown location";
  }

  return placeName;
};

export const formatDate = (milis?: number) => {
  if (!milis) return "N/A";
  const date = new Date(milis);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const calculateDistance = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in KM

  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c || 0;
};

export const formatDistance = (km?: number): string => {
  if (km === undefined || isNaN(km)) return "N/A";

  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km.toFixed(1)} km`;
};

export const calculateDuration = (start?: number, end?: number): string => {
  if (!start || !end || end < start) return "N/A";

  const diffMs = end - start;

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};
