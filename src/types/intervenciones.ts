/**
 * Tipos e interfaces para Intervenciones
 * Corresponde a los datos del endpoint GET /intervenciones
 */

/**
 * Interfaz para una intervención individual
 */
export interface Intervencion {
  intervencion_id: string
  upid: string
  ano?: string | number
  estado?: string
  tipo_intervencion?: string
  presupuesto_base?: number
  avance_obra?: number
  frente_activo?: string
  fecha_inicio?: string
  fecha_fin?: string
  nombre_centro_gestor?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  descripcion?: string
  [key: string]: any // Para campos adicionales
}

/**
 * Propiedades de una Unidad de Proyecto con sus intervenciones
 */
export interface UnidadProyectoIntervencionesProperties {
  upid: string
  nombre_up?: string
  direccion?: string
  tipo_equipamiento?: string
  clase_up?: string
  nombre_centro_gestor?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  intervenciones: Intervencion[]
  n_intervenciones: number
}

/**
 * Feature GeoJSON de una Unidad con sus intervenciones
 */
export interface UnidadConIntervencionesFeature {
  type: 'Feature'
  geometry?: {
    type: string
    coordinates?: any
  }
  properties: UnidadProyectoIntervencionesProperties
}

/**
 * Respuesta completa del endpoint GET /intervenciones
 */
export interface IntervencionesGeoJSONResponse {
  type: 'FeatureCollection'
  features: UnidadConIntervencionesFeature[]
  properties?: {
    total_unidades: number
    total_intervenciones: number
    filtros_aplicados?: Record<string, any>
  }
}

/**
 * Parámetros de filtrado para el endpoint /intervenciones
 */
export interface IntervencionesFilterParams {
  estado?: string
  ano?: string | number
  frente_activo?: string
  tipo_intervencion?: string
  nombre_centro_gestor?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  presupuesto_min?: number
  presupuesto_max?: number
  avance_min?: number
  avance_max?: number
}

/**
 * Métricas calculadas de intervenciones
 */
export interface IntervencionesMetrics {
  total_intervenciones: number
  total_unidades: number
  por_estado: Record<string, number>
  por_ano: Record<string, number>
  por_tipo: Record<string, number>
  por_frente_activo: Record<string, number>
  presupuesto_total: number
  avance_promedio: number
}

/**
 * Tipos de campos disponibles para coloración en el mapa
 */
export type ColorByField = 
  | 'estado'
  | 'tipo_intervencion'
  | 'frente_activo'
  | 'nombre_centro_gestor'
  | 'comuna_corregimiento'
  | 'barrio_vereda'
  | 'ano'
  | 'avance_obra'
  | 'presupuesto_base';

/**
 * Configuración de coloración
 */
export interface ColorConfig {
  field: ColorByField
  label: string
  type: 'categorical' | 'numeric' // Categórico o numérico
  colors?: string[] // Para categóricos
  colorScale?: {
    min: string
    mid?: string
    max: string
  } // Para numéricos
}

/**
 * Opciones de coloración disponibles
 */
export const COLOR_OPTIONS: ColorConfig[] = [
  {
    field: 'estado',
    label: 'Estado de Intervención',
    type: 'categorical',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
  },
  {
    field: 'tipo_intervencion',
    label: 'Tipo de Intervención',
    type: 'categorical',
    colors: ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899']
  },
  {
    field: 'frente_activo',
    label: 'Frente Activo',
    type: 'categorical',
    colors: ['#10B981', '#EF4444', '#6B7280']
  },
  {
    field: 'nombre_centro_gestor',
    label: 'Centro Gestor',
    type: 'categorical'
  },
  {
    field: 'comuna_corregimiento',
    label: 'Comuna/Corregimiento',
    type: 'categorical'
  },
  {
    field: 'barrio_vereda',
    label: 'Barrio/Vereda',
    type: 'categorical'
  },
  {
    field: 'ano',
    label: 'Año',
    type: 'categorical',
    colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  },
  {
    field: 'avance_obra',
    label: 'Avance de Obra (%)',
    type: 'numeric',
    colorScale: {
      min: '#EF4444',  // Rojo para 0%
      mid: '#F59E0B',  // Amber para 50%
      max: '#10B981'   // Verde para 100%
    }
  },
  {
    field: 'presupuesto_base',
    label: 'Presupuesto Base',
    type: 'numeric',
    colorScale: {
      min: '#DBEAFE',  // Azul claro
      mid: '#3B82F6',  // Azul medio
      max: '#1E40AF'   // Azul oscuro
    }
  }
];

/**
 * Estados de intervención conocidos
 */
export const ESTADOS_INTERVENCION = [
  'En ejecución',
  'Terminado',
  'En planificación',
  'Suspendido',
  'No iniciado'
] as const;

export type EstadoIntervencion = typeof ESTADOS_INTERVENCION[number];

/**
 * Valores de frente activo conocidos
 */
export const FRENTES_ACTIVOS = [
  'Frente activo',
  'Inactivo',
  'No aplica'
] as const;

export type FrenteActivo = typeof FRENTES_ACTIVOS[number];
