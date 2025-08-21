// Configuración para Leaflet optimizada para CircleMarkers
import L from 'leaflet';

// Función helper para normalizar texto UTF-8 en Leaflet
export const normalizeText = (text: string): string => {
  return text.normalize('NFC');
};

// Función para crear popups con soporte UTF-8
export const createUTF8Popup = (content: string, options?: L.PopupOptions) => {
  const normalizedContent = normalizeText(content);
  return L.popup(options).setContent(normalizedContent);
};

// Configuración optimizada para CircleMarkers
export const circleMarkerDefaults = {
  radius: 8,
  weight: 2,
  opacity: 1,
  fillOpacity: 0.8,
  pane: 'markerPane'
};

// Eliminar iconos por defecto de Leaflet para evitar conflictos
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

export default L;
