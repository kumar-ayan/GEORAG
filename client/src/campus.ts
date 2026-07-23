import type { LatLng } from "./hooks/useGeolocation";

export const PUNJABI_UNIVERSITY_CENTER: LatLng = {
  lat: 30.35869,
  lng: 76.44979,
};

export const PUNJABI_UNIVERSITY_BOUNDS = {
  south: 30.35,
  west: 76.439,
  north: 30.365,
  east: 76.462,
} as const;

export const PUNJABI_UNIVERSITY_LEAFLET_BOUNDS: [[number, number], [number, number]] = [
  [PUNJABI_UNIVERSITY_BOUNDS.south, PUNJABI_UNIVERSITY_BOUNDS.west],
  [PUNJABI_UNIVERSITY_BOUNDS.north, PUNJABI_UNIVERSITY_BOUNDS.east],
];

export function isInsidePunjabiUniversity(point: LatLng): boolean {
  return (
    point.lat >= PUNJABI_UNIVERSITY_BOUNDS.south &&
    point.lat <= PUNJABI_UNIVERSITY_BOUNDS.north &&
    point.lng >= PUNJABI_UNIVERSITY_BOUNDS.west &&
    point.lng <= PUNJABI_UNIVERSITY_BOUNDS.east
  );
}

export function clampToPunjabiUniversity(point: LatLng): LatLng {
  return {
    lat: Math.min(
      PUNJABI_UNIVERSITY_BOUNDS.north,
      Math.max(PUNJABI_UNIVERSITY_BOUNDS.south, point.lat),
    ),
    lng: Math.min(
      PUNJABI_UNIVERSITY_BOUNDS.east,
      Math.max(PUNJABI_UNIVERSITY_BOUNDS.west, point.lng),
    ),
  };
}
