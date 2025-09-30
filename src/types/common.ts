// Tipos comunes para toda la aplicación

// Tipos para GeoJSON
export interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, any>
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'
    coordinates: number[] | number[][] | number[][][]
  }
}

export interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// Tipos para componentes de gráficos
export interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number | string
    name: string
    color: string
    dataKey: string
  }>
  label?: string
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

// Tipos para filtros
export interface FilterOption {
  value: string
  label: string
  count?: number
}

// Tipos para eventos de mapa
export interface MapFeatureClickHandler {
  (feature: GeoJSONFeature, layer?: any): void
}

// Tipos para configuración de visualización
export interface VisualizationConfig {
  variable: string
  label: string
  type: 'categorical' | 'numeric'
  title: string
  description: string
  getColor: (value: any) => string
  getValue: (item: any) => any
  formatValue: (value: any) => string
}

// Tipos para datos de contratos
export interface ContratoData {
  id: string | number
  numero_contrato?: string
  objeto_contrato?: string
  valor_contrato?: number
  valor_del_contrato?: number
  estado_contrato?: string
  tipo_contrato?: string
  tipo_de_contrato?: string
  fecha_inicio?: string
  fecha_fin?: string
  valor_pagado?: number
  valor_pendiente_pago?: number
  valor_pendiente_de_pago?: number
  banco?: string
  bpin?: number
}

// Tipos para datos de proyectos
export interface ProyectoData {
  bpin: number
  nombre_proyecto?: string
  centro_gestor?: string
  valor_proyecto?: number
  estado?: string
  tipo_intervencion?: string
  avance_obra?: number
  contratos?: ContratoData[]
}

// Tipos para métricas y estadísticas
export interface MetricData {
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  color?: string
}

// Tipos para componentes de tabla
export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

// Tipos para manejo de errores
export interface AppError {
  message: string
  code?: string
  details?: any
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  error?: string
}

// Tipos para configuración de capas de mapa
export interface LayerConfig {
  id: string
  name: string
  visible: boolean
  data?: GeoJSONData
  style?: any
  symbology?: any
}

// Tipos para filtros de datos
export interface DataFilters {
  search?: string
  dateRange?: {
    start: string
    end: string
  }
  categories?: string[]
  status?: string[]
  [key: string]: any
}

// Función helper para validar GeoJSON
export function isValidGeoJSONFeature(obj: any): obj is GeoJSONFeature {
  return obj && 
         obj.type === 'Feature' &&
         obj.geometry &&
         obj.properties &&
         typeof obj.properties === 'object'
}

// Función adaptadora para convertir UnidadProyectoGeo a GeoJSONFeature
export function adaptUnidadProyectoGeoToGeoJSON(unidad: any): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: unidad.geometry || {
      type: 'Point',
      coordinates: unidad.coordinates ? [unidad.coordinates.lng, unidad.coordinates.lat] : [0, 0]
    },
    properties: {
      id: unidad.id,
      upid: unidad.upid,
      bpin: unidad.bpin,
      nombre: unidad.nombre,
      descripcion: unidad.descripcion,
      direccion: unidad.direccion,
      comuna: unidad.comuna,
      barrio: unidad.barrio,
      corregimiento: unidad.corregimiento,
      vereda: unidad.vereda,
      tipo_intervencion: unidad.tipo_intervencion,
      clase_obra: unidad.clase_obra,
      estado: unidad.estado,
      avance_obra: unidad.avance_obra,
      presupuesto_base: unidad.presupuesto_base,
      fecha_inicio: unidad.fecha_inicio,
      fecha_fin: unidad.fecha_fin,
      ano: unidad.ano,
      nombre_centro_gestor: unidad.nombre_centro_gestor,
      referencia_contrato: unidad.referencia_contrato,
      referencia_proceso: unidad.referencia_proceso,
      url_proceso: unidad.url_proceso,
      fuente_financiacion: unidad.fuente_financiacion,
      plataforma: unidad.plataforma,
      dataframe: unidad.dataframe,
      updated_at: unidad.updated_at
    }
  }
}