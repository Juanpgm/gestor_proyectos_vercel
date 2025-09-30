// Leaflet Configuration with Theme-Aware Tile Providers
import L from 'leaflet';

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Tile layer configurations
export const TILE_LAYERS = {
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  },
  terrain: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
    subdomains: 'abcd'
  }
};

// Default map configuration for Cali, Colombia
export const DEFAULT_MAP_CONFIG = {
  center: [3.4516, -76.5320] as [number, number], // Cali coordinates
  zoom: 11,
  minZoom: 8,
  maxZoom: 19,
  zoomControl: true,
  attributionControl: true
};

// Map bounds for Cali region
export const CALI_BOUNDS = {
  north: 3.6,
  south: 3.3,
  east: -76.3,
  west: -76.7
};

// Get tile layer based on theme
export const getTileLayer = (theme: 'light' | 'dark' | 'system' = 'light') => {
  let tileConfig = TILE_LAYERS.light;
  
  if (theme === 'dark') {
    tileConfig = TILE_LAYERS.dark;
  } else if (theme === 'system') {
    // Check if dark mode is applied
    const isDark = typeof window !== 'undefined' && 
                   document.documentElement.classList.contains('dark');
    tileConfig = isDark ? TILE_LAYERS.dark : TILE_LAYERS.light;
  }
  
  return L.tileLayer(tileConfig.url, {
    attribution: tileConfig.attribution,
    maxZoom: tileConfig.maxZoom,
    subdomains: tileConfig.subdomains
  });
};

// Create map instance with default configuration
export const createMap = (containerId: string, theme: 'light' | 'dark' | 'system' = 'light') => {
  const map = L.map(containerId, {
    ...DEFAULT_MAP_CONFIG,
    layers: [getTileLayer(theme)]
  });
  
  return map;
};

// Custom marker styles
export const MARKER_STYLES = {
  default: {
    radius: 8,
    fillColor: '#3b82f6',
    color: '#1e40af',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  },
  selected: {
    radius: 12,
    fillColor: '#ef4444',
    color: '#dc2626',
    weight: 3,
    opacity: 1,
    fillOpacity: 0.9
  },
  cluster: {
    radius: 15,
    fillColor: '#10b981',
    color: '#059669',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8
  }
};

// Popup configuration
export const POPUP_CONFIG = {
  maxWidth: 300,
  minWidth: 200,
  closeButton: true,
  autoClose: false,
  closeOnClick: false,
  className: 'custom-popup'
};