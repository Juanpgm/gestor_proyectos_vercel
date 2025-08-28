'use client'

/**
 * =====================================
 * UTILIDADES DE ESTILO Y CATEGORIZACIÓN
 * =====================================
 * 
 * Sistema avanzado para la categorización y colorización de datos GeoJSON
 * basado en propiedades específicas de las features
 */

// Paletas de colores predefinidas
export const COLOR_PALETTES = {
  // Paleta categórica para estados/tipos
  categorical: [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Ámbar
    '#EF4444', // Rojo
    '#8B5CF6', // Púrpura
    '#06B6D4', // Cian
    '#84CC16', // Verde lima
    '#F97316', // Naranja
    '#EC4899', // Rosa
    '#6B7280'  // Gris
  ],
  
  // Paleta para estados de proyecto
  projectStatus: {
    'En ejecución': '#10B981',      // Verde
    'Planificado': '#3B82F6',       // Azul
    'Completado': '#059669',        // Verde oscuro
    'En espera': '#F59E0B',         // Ámbar
    'Cancelado': '#EF4444',         // Rojo
    'Suspendido': '#6B7280'         // Gris
  },

  // Paleta para tipos de intervención
  interventionType: {
    'Adecuación': '#3B82F6',        // Azul
    'Construcción': '#10B981',      // Verde
    'Mantenimiento': '#F59E0B',     // Ámbar
    'Reparación': '#EF4444',        // Rojo
    'Mejoramiento': '#8B5CF6',      // Púrpura
    'Rehabilitación': '#06B6D4'     // Cian
  },

  // Paleta para fuentes de financiamiento
  fundingSource: {
    'Empréstito': '#3B82F6',        // Azul
    'Recursos propios': '#10B981',   // Verde
    'SGP': '#F59E0B',               // Ámbar
    'Sistema General de Regalías': '#8B5CF6', // Púrpura
    'Cooperación internacional': '#06B6D4'    // Cian
  },

  // Paleta térmica para valores numéricos
  thermal: [
    '#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
    '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'
  ],

  // Paleta secuencial para rangos
  sequential: [
    '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6',
    '#4292c6', '#2171b5', '#08519c', '#08306b'
  ]
}

// Interfaces para configuración de estilos
export interface CategoryConfig {
  property: string
  type: 'categorical' | 'numerical' | 'status'
  palette?: string[]
  customMapping?: Record<string, string>
  ranges?: Array<{min: number, max: number, color: string, label: string}>
}

export interface StyleConfig {
  defaultColor?: string
  defaultOpacity?: number
  strokeWidth?: number
  categorization?: CategoryConfig
}

/**
 * Genera un color para una feature basado en su categoría
 */
export function getCategoryColor(
  feature: any, 
  config: CategoryConfig,
  fallbackColor: string = '#3B82F6'
): string {
  if (!feature?.properties) return fallbackColor

  const value = feature.properties[config.property]
  if (value === undefined || value === null) return fallbackColor

  switch (config.type) {
    case 'categorical':
      return getCategoricalColor(value, config, fallbackColor)
    
    case 'numerical':
      return getNumericalColor(value, config, fallbackColor)
      
    case 'status':
      return getStatusColor(value, config, fallbackColor)
      
    default:
      return fallbackColor
  }
}

/**
 * Color para valores categóricos
 */
function getCategoricalColor(
  value: any, 
  config: CategoryConfig, 
  fallbackColor: string
): string {
  // Usar mapeo personalizado si existe
  if (config.customMapping && config.customMapping[value]) {
    return config.customMapping[value]
  }

  // Usar paleta si existe
  if (config.palette && config.palette.length > 0) {
    const index = Math.abs(hashString(String(value))) % config.palette.length
    return config.palette[index]
  }

  // Usar paleta categórica por defecto
  const index = Math.abs(hashString(String(value))) % COLOR_PALETTES.categorical.length
  return COLOR_PALETTES.categorical[index]
}

/**
 * Color para valores numéricos
 */
function getNumericalColor(
  value: number, 
  config: CategoryConfig, 
  fallbackColor: string
): string {
  if (typeof value !== 'number' || isNaN(value)) return fallbackColor

  // Usar rangos personalizados si existen
  if (config.ranges) {
    for (const range of config.ranges) {
      if (value >= range.min && value <= range.max) {
        return range.color
      }
    }
    return fallbackColor
  }

  // Usar paleta térmica por defecto
  const palette = config.palette || COLOR_PALETTES.thermal
  const normalized = Math.min(Math.max(value / 100, 0), 1) // Normalizar 0-100
  const index = Math.floor(normalized * (palette.length - 1))
  return palette[index]
}

/**
 * Color para estados específicos
 */
function getStatusColor(
  value: string, 
  config: CategoryConfig, 
  fallbackColor: string
): string {
  // Usar mapeo personalizado si existe
  if (config.customMapping && config.customMapping[value]) {
    return config.customMapping[value]
  }

  // Mapeo por defecto para estados de proyecto
  const statusColors = COLOR_PALETTES.projectStatus as Record<string, string>
  return statusColors[value] || fallbackColor
}

/**
 * Función hash simple para generar índices consistentes
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a 32-bit integer
  }
  return hash
}

/**
 * Genera configuraciones predefinidas para diferentes tipos de datos
 */
export const PREDEFINED_CATEGORIZATIONS = {
  // Para equipamientos
  equipamientos: {
    byStatus: {
      property: 'estado_unidad_proyecto',
      type: 'status' as const,
      customMapping: COLOR_PALETTES.projectStatus
    },
    byIntervention: {
      property: 'tipo_intervencion',
      type: 'categorical' as const,
      customMapping: COLOR_PALETTES.interventionType
    },
    byFunding: {
      property: 'cod_fuente_financiamiento',
      type: 'categorical' as const,
      customMapping: COLOR_PALETTES.fundingSource
    },
    byCommune: {
      property: 'comuna_corregimiento',
      type: 'categorical' as const,
      palette: COLOR_PALETTES.categorical
    }
  },

  // Para infraestructura vial
  infraestructura: {
    byType: {
      property: 'tipo_via',
      type: 'categorical' as const,
      palette: COLOR_PALETTES.categorical
    },
    byStatus: {
      property: 'estado',
      type: 'status' as const,
      customMapping: COLOR_PALETTES.projectStatus
    }
  },

  // Para cartografía base
  cartografia: {
    byArea: {
      property: 'shape_area',
      type: 'numerical' as const,
      palette: COLOR_PALETTES.sequential
    },
    byName: {
      property: 'nombre',
      type: 'categorical' as const,
      palette: COLOR_PALETTES.categorical
    }
  }
}

/**
 * Extrae categorías únicas de un dataset
 */
export function extractCategories(
  geoJSONData: any, 
  property: string
): Array<{value: any, count: number, color?: string}> {
  if (!geoJSONData?.features) return []

  const categoryMap = new Map<any, number>()
  
  geoJSONData.features.forEach((feature: any) => {
    const value = feature.properties?.[property]
    if (value !== undefined && value !== null) {
      categoryMap.set(value, (categoryMap.get(value) || 0) + 1)
    }
  })

  return Array.from(categoryMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Genera una leyenda para categorías
 */
export function generateLegend(
  categories: Array<{value: any, count: number}>,
  config: CategoryConfig
): Array<{label: string, color: string, count: number}> {
  return categories.map(({value, count}) => ({
    label: String(value),
    color: getCategoryColor({ properties: { [config.property]: value } }, config),
    count
  }))
}

/**
 * Optimiza el estilo de una capa completa
 */
export function generateLayerStyle(
  layerId: string,
  config?: StyleConfig
): any {
  const baseStyle = {
    weight: layerId.includes('infraestructura') ? 4 : 2,
    opacity: config?.defaultOpacity || 0.8,
    fillOpacity: (config?.defaultOpacity || 0.8) * 0.6,
    color: config?.defaultColor || '#3B82F6',
    fillColor: config?.defaultColor || '#3B82F6',
    lineCap: 'round' as const,
    lineJoin: 'round' as const
  }

  // Si hay categorización, crear función de estilo dinámica
  if (config?.categorization) {
    return (feature: any) => ({
      ...baseStyle,
      fillColor: getCategoryColor(feature, config.categorization!, baseStyle.fillColor),
      color: getCategoryColor(feature, config.categorization!, baseStyle.color)
    })
  }

  return baseStyle
}

/**
 * Configuraciones rápidas para diferentes tipos de datos
 */
export function getQuickStyleConfig(
  layerId: string, 
  categorizationType?: string
): StyleConfig {
  const baseConfig: StyleConfig = {
    defaultColor: '#3B82F6',
    defaultOpacity: 0.8,
    strokeWidth: layerId.includes('infraestructura') ? 4 : 2
  }

  // Configuraciones específicas por tipo de capa
  if (layerId === 'equipamientos' && categorizationType) {
    const equipConfig = PREDEFINED_CATEGORIZATIONS.equipamientos as any
    if (equipConfig[categorizationType]) {
      baseConfig.categorization = equipConfig[categorizationType]
    }
  }

  if (layerId === 'infraestructura_vial' && categorizationType) {
    const infraConfig = PREDEFINED_CATEGORIZATIONS.infraestructura as any
    if (infraConfig[categorizationType]) {
      baseConfig.categorization = infraConfig[categorizationType]
    }
  }

  if (['comunas', 'barrios', 'corregimientos', 'veredas'].includes(layerId) && categorizationType) {
    const cartoConfig = PREDEFINED_CATEGORIZATIONS.cartografia as any
    if (cartoConfig[categorizationType]) {
      baseConfig.categorization = cartoConfig[categorizationType]
    }
  }

  return baseConfig
}

export default {
  COLOR_PALETTES,
  getCategoryColor,
  extractCategories,
  generateLegend,
  generateLayerStyle,
  getQuickStyleConfig,
  PREDEFINED_CATEGORIZATIONS
}
