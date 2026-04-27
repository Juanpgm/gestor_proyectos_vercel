/**
 * Shared map design tokens and helpers for Leaflet-based components.
 */

export const MAP_TILE_URLS = {
  streets: {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  },
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
} as const;

export const MAP_TILE_ATTRIBUTION = {
  default:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
} as const;

export const MAP_PROGRESS_COLORS = {
  excellent: "#059669",
  good: "#2563eb",
  medium: "#d97706",
  low: "#dc2626",
  neutral: "#6b7280",
} as const;

export function getProgressColor(avance: number): string {
  if (avance >= 80) return MAP_PROGRESS_COLORS.excellent;
  if (avance >= 60) return MAP_PROGRESS_COLORS.good;
  if (avance >= 40) return MAP_PROGRESS_COLORS.medium;
  if (avance >= 20) return MAP_PROGRESS_COLORS.low;
  return MAP_PROGRESS_COLORS.neutral;
}

export function getTileUrl(
  mapType: "streets" | "satellite",
  isDark: boolean,
): string {
  if (mapType === "satellite") return MAP_TILE_URLS.satellite;
  return isDark ? MAP_TILE_URLS.streets.dark : MAP_TILE_URLS.streets.light;
}

export function getTileAttribution(mapType: "streets" | "satellite"): string {
  return mapType === "satellite"
    ? MAP_TILE_ATTRIBUTION.satellite
    : MAP_TILE_ATTRIBUTION.default;
}
