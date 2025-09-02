/**
 * ===============================================
 * CONFIGURACIÓN AVANZADA DE ESTILOS CARTOGRÁFICOS
 * ===============================================
 * 
 * Sistema inspirado en herramientas profesionales de SIG
 * con esquemas de colores optimizados y estilos modernos
 */

// Configuración de estilos por defecto mejorados
export const IMPROVED_DEFAULT_STYLES = {
  // Estilos para geometrías GeoJSON
  geojson: {
    weight: 0.8, // Líneas más finas
    opacity: 0.8,
    fillOpacity: 0.6,
    color: '#2563EB', // Azul moderno
    fillColor: '#3B82F6',
    lineCap: 'round' as const,
    lineJoin: 'round' as const
  },
  
  // Estilos para puntos CircleMarker
  points: {
    radius: 4, // Puntos más pequeños
    fillColor: '#3B82F6',
    color: '#FFFFFF',
    weight: 0.8, // Borde más fino
    opacity: 1,
    fillOpacity: 0.8
  },
  
  // Estilos específicos por tipo de geometría
  geometrySpecific: {
    Point: {
      radius: 4, // Puntos más pequeños
      weight: 0.8, // Bordes más finos
      opacity: 1,
      fillOpacity: 0.8
    },
    LineString: {
      weight: 1.0, // Líneas más finas
      opacity: 0.9,
      fillOpacity: 0, // Sin relleno en líneas
      lineCap: 'round' as const,
      lineJoin: 'round' as const
    },
    Polygon: {
      weight: 0.8, // Bordes más finos
      opacity: 0.8,
      fillOpacity: 0.6
    },
    MultiPolygon: {
      weight: 0.8, // Bordes más finos
      opacity: 0.8,
      fillOpacity: 0.6
    }
  }
}

// Configuración de colores mejorada por tipo de capa
export const ENHANCED_LAYER_COLORS = {
  // Equipamientos - Paleta verde profesional
  equipamientos: {
    primary: '#059669', // Verde esmeralda
    secondary: '#10B981', // Verde moderno
    accent: '#34D399', // Verde claro
    stroke: '#047857', // Verde oscuro para bordes
    gradients: ['#ECFDF5', '#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669']
  },
  
  // Infraestructura vial - Paleta ámbar/naranja
  infraestructura_vial: {
    primary: '#D97706', // Ámbar
    secondary: '#F59E0B', // Amarillo dorado
    accent: '#FBBF24', // Amarillo claro
    stroke: '#B45309', // Ámbar oscuro
    gradients: ['#FFFBEB', '#FEF3C7', '#FDE68A', '#FBBF24', '#F59E0B', '#D97706']
  },
  
  // Unidades de proyecto - Paleta azul
  unidades_proyecto: {
    primary: '#1D4ED8', // Azul real
    secondary: '#3B82F6', // Azul moderno
    accent: '#60A5FA', // Azul claro
    stroke: '#1E40AF', // Azul oscuro
    gradients: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6']
  },
  
  // Comunas - Paleta púrpura
  comunas: {
    primary: '#7C3AED', // Púrpura vibrante
    secondary: '#8B5CF6', // Púrpura moderno
    accent: '#A78BFA', // Púrpura claro
    stroke: '#6D28D9', // Púrpura oscuro
    gradients: ['#FAF5FF', '#E9D5FF', '#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6']
  },
  
  // Barrios - Paleta rosa
  barrios: {
    primary: '#DC2626', // Rojo vibrante
    secondary: '#EF4444', // Rojo moderno
    accent: '#F87171', // Rojo claro
    stroke: '#B91C1C', // Rojo oscuro
    gradients: ['#FEF2F2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626']
  }
}

// Configuración de iconos mejorada por categoría
export const ENHANCED_CATEGORY_ICONS = {
  // Educación
  educacion: {
    main: '🎓',
    variants: {
      'Colegio': '🏫',
      'Universidad': '🎓',
      'Instituto': '📚',
      'Biblioteca': '📖',
      'Preescolar': '🧸',
      'Escuela': '✏️'
    }
  },
  
  // Salud
  salud: {
    main: '🏥',
    variants: {
      'Hospital': '🏥',
      'Clínica': '⚕️',
      'Centro de Salud': '🩺',
      'Farmacia': '💊',
      'Laboratorio': '🔬',
      'Urgencias': '🚑'
    }
  },
  
  // Deporte y Recreación
  deporte: {
    main: '⚽',
    variants: {
      'Cancha': '🏟️',
      'Gimnasio': '🏋️',
      'Piscina': '🏊',
      'Parque': '🌳',
      'Polideportivo': '🏀',
      'Estadio': '🏟️'
    }
  },
  
  // Cultura
  cultura: {
    main: '🎭',
    variants: {
      'Teatro': '🎭',
      'Museo': '🏛️',
      'Galería': '🖼️',
      'Centro Cultural': '🎨',
      'Auditorio': '🎵',
      'Cine': '🎬'
    }
  },
  
  // Servicios Públicos
  servicios: {
    main: '🏛️',
    variants: {
      'Alcaldía': '🏛️',
      'Policía': '👮',
      'Bomberos': '🚒',
      'CAI': '🚓',
      'Notaría': '📋',
      'Registro': '📄'
    }
  },
  
  // Transporte
  transporte: {
    main: '🚌',
    variants: {
      'Terminal': '🚌',
      'Parada': '🚏',
      'Estación': '🚉',
      'Metro': '🚇',
      'Aeropuerto': '✈️',
      'Puerto': '⚓'
    }
  }
}

// Configuración de opacidades por contexto
export const OPACITY_PRESETS = {
  // Para visualización general
  default: {
    fill: 0.6,
    stroke: 0.8,
    selected: 0.9,
    hover: 0.7
  },
  
  // Para análisis detallado
  analysis: {
    fill: 0.8,
    stroke: 1.0,
    selected: 1.0,
    hover: 0.9
  },
  
  // Para presentaciones
  presentation: {
    fill: 0.7,
    stroke: 0.9,
    selected: 0.95,
    hover: 0.8
  },
  
  // Para overlay con otras capas
  overlay: {
    fill: 0.4,
    stroke: 0.6,
    selected: 0.8,
    hover: 0.5
  }
}

// Configuración de grosores por escala del mapa
export const SCALE_DEPENDENT_WEIGHTS = {
  // Zoom levels y sus pesos correspondientes
  zoomWeights: [
    { minZoom: 0, maxZoom: 8, weight: 0.4 },    // Vista muy alejada - más fino
    { minZoom: 9, maxZoom: 12, weight: 0.8 },   // Vista media - más fino
    { minZoom: 13, maxZoom: 16, weight: 1.2 },  // Vista cercana - un poco más fino
    { minZoom: 17, maxZoom: 20, weight: 1.6 }   // Vista muy cercana - más fino
  ],
  
  // Multiplicadores por tipo de geometría
  geometryMultipliers: {
    Point: 1.0,
    LineString: 1.0, // Reducido para líneas más finas
    Polygon: 0.7,    // Más fino para polígonos
    MultiPolygon: 0.7 // Más fino para multipolígonos
  }
}

// Configuración de animaciones y transiciones
export const ANIMATION_CONFIG = {
  // Duración de transiciones en milisegundos
  transitions: {
    colorChange: 300,
    opacityChange: 200,
    weightChange: 250,
    hover: 150
  },
  
  // Configuración de easing
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }
}

// Función para obtener estilo mejorado basado en contexto
export const getEnhancedStyle = (
  layerId: string,
  geometryType: string,
  context: 'default' | 'analysis' | 'presentation' | 'overlay' = 'default',
  zoomLevel: number = 10
): any => {
  const baseStyle = IMPROVED_DEFAULT_STYLES.geometrySpecific[geometryType as keyof typeof IMPROVED_DEFAULT_STYLES.geometrySpecific] || IMPROVED_DEFAULT_STYLES.geojson
  const layerColors = ENHANCED_LAYER_COLORS[layerId as keyof typeof ENHANCED_LAYER_COLORS]
  const opacities = OPACITY_PRESETS[context]
  
  // Calcular peso basado en zoom
  const zoomWeight = SCALE_DEPENDENT_WEIGHTS.zoomWeights.find(
    zw => zoomLevel >= zw.minZoom && zoomLevel <= zw.maxZoom
  )?.weight || 1
  
  const geometryMultiplier = SCALE_DEPENDENT_WEIGHTS.geometryMultipliers[geometryType as keyof typeof SCALE_DEPENDENT_WEIGHTS.geometryMultipliers] || 1
  
  // Crear estilo consolidado
  const enhancedStyle: any = {
    ...baseStyle,
    opacity: opacities.stroke,
    fillOpacity: opacities.fill,
    weight: (baseStyle.weight || 1) * zoomWeight * geometryMultiplier
  }
  
  // Agregar colores si están disponibles en el estilo base
  if ('color' in baseStyle) {
    enhancedStyle.color = layerColors?.stroke || baseStyle.color
  }
  
  if ('fillColor' in baseStyle) {
    enhancedStyle.fillColor = layerColors?.secondary || baseStyle.fillColor
  }
  
  return enhancedStyle
}

// Función para generar gradiente automático
export const generateAutoGradient = (
  layerId: string,
  steps: number = 5
): string[] => {
  const layerColors = ENHANCED_LAYER_COLORS[layerId as keyof typeof ENHANCED_LAYER_COLORS]
  
  if (layerColors?.gradients) {
    return layerColors.gradients.slice(0, steps)
  }
  
  // Fallback a gradiente por defecto
  return ENHANCED_LAYER_COLORS.unidades_proyecto.gradients.slice(0, steps)
}

export default {
  IMPROVED_DEFAULT_STYLES,
  ENHANCED_LAYER_COLORS,
  ENHANCED_CATEGORY_ICONS,
  OPACITY_PRESETS,
  SCALE_DEPENDENT_WEIGHTS,
  ANIMATION_CONFIG,
  getEnhancedStyle,
  generateAutoGradient
}
