// Configuración para Leaflet para evitar problemas de iconos y renderizado
import L from 'leaflet';

// Fix para iconos de marcadores en Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

// Función helper para normalizar texto UTF-8 en Leaflet
export const normalizeText = (text: string): string => {
  return text.normalize('NFC');
};

// Función para crear popups con soporte UTF-8
export const createUTF8Popup = (content: string, options?: L.PopupOptions) => {
  const normalizedContent = normalizeText(content);
  return L.popup(options).setContent(normalizedContent);
};

export default L;
