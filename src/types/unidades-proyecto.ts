/**
 * Tipos y interfaces para Unidades de Proyecto
 * Corresponde a los datos del endpoint GET /unidades-proyecto/attributes
 */

/**
 * Interfaz completa para una Unidad de Proyecto
 * Basada en la respuesta del endpoint /unidades-proyecto/attributes
 */
export interface UnidadProyecto {
  // Identificadores
  upid: string
  bpin?: number
  identificador?: string | null

  // Información básica
  nombre_up?: string | null
  nombre_up_detalle?: string | null
  descripcion_intervencion?: string | null

  // Clasificación
  clase_up?: string | null  // ⬅️ Campo solicitado
  clase_obra?: string | null
  tipo_equipamiento?: string | null
  tipo_intervencion?: string | null

  // Ubicación
  direccion?: string | null
  comuna_corregimiento?: string | null
  barrio_vereda?: string | null
  microtio?: string | null

  // Fechas - ⬅️ Campos solicitados
  fecha_inicio?: string | null
  fecha_fin?: string | null
  fecha_inauguracion?: string | null  // ⬅️ NUEVO CAMPO A AGREGAR EN BACKEND

  // Estado y avance
  estado?: string | null
  avance_obra?: number

  // Presupuesto
  presupuesto_base?: number
  fuente_financiacion?: string | null

  // Referencias administrativas
  nombre_centro_gestor?: string | null
  referencia_contrato?: string | null
  referencia_proceso?: string | null
  plataforma?: string | null

  // Geometría (solo metadata, no coordenadas)
  geometry_type?: string | null
  geometry_bounds?: any
  has_geometry?: boolean
  centros_gravedad?: boolean

  // Metadatos
  ano?: string
  cantidad?: string
  created_at?: string
  updated_at?: string
  processed_timestamp?: string | null
}

/**
 * Respuesta del endpoint /unidades-proyecto/attributes
 */
export interface UnidadProyectoAttributesResponse {
  success: boolean
  data: UnidadProyecto[]
  count: number
  total_before_limit: number
  type: 'attributes'
  collection: 'unidades-proyecto'
  filters_applied: Record<string, any>
  pagination: {
    limit: number | null
    offset: number | null
    has_more: boolean
  }
  timestamp: string
  last_updated: string
  message: string
}

/**
 * Unidad de Proyecto con geometría completa
 * Para el endpoint /unidades-proyecto/geometry
 */
export interface UnidadProyectoGeo extends UnidadProyecto {
  geometry?: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * Filtros disponibles para el endpoint de Unidades de Proyecto
 */
export interface UnidadesProyectoFilters {
  // Filtros de búsqueda
  search?: string
  upid?: string
  bpin?: number | string

  // Filtros de clasificación
  clase_up?: string | string[]
  clase_obra?: string | string[]
  tipo_equipamiento?: string | string[]
  tipo_intervencion?: string | string[]
  estado?: string | string[]

  // Filtros de ubicación
  comuna_corregimiento?: string | string[]
  barrio_vereda?: string | string[]
  nombre_centro_gestor?: string | string[]

  // Filtros de fechas
  fecha_inicio_desde?: string
  fecha_inicio_hasta?: string
  fecha_fin_desde?: string
  fecha_fin_hasta?: string
  fecha_inauguracion_desde?: string  // ⬅️ NUEVO FILTRO
  fecha_inauguracion_hasta?: string  // ⬅️ NUEVO FILTRO

  // Filtros de estado
  avance_obra_min?: number
  avance_obra_max?: number
  presupuesto_min?: number
  presupuesto_max?: number

  // Filtros booleanos
  has_geometry?: boolean
  centros_gravedad?: boolean

  // Paginación
  limit?: number
  offset?: number
}

/**
 * Opciones de valor único para filtros (Select)
 */
export interface FilterOption {
  value: string
  label: string
  count?: number
}

/**
 * Estado de los filtros aplicados
 */
export interface FiltersState {
  claseUp: string[]
  claseObra: string[]
  tipoEquipamiento: string[]
  tipoIntervencion: string[]
  estado: string[]
  comunaCorregimiento: string[]
  barrioVereda: string[]
  nombreCentroGestor: string[]
  fechaInicioDesde?: string
  fechaInicioHasta?: string
  fechaFinDesde?: string
  fechaFinHasta?: string
  fechaInauguracionDesde?: string  // ⬅️ NUEVO FILTRO
  fechaInauguracionHasta?: string  // ⬅️ NUEVO FILTRO
}

/**
 * Resumen estadístico de Unidades de Proyecto
 */
export interface UnidadesProyectoSummary {
  total: number
  por_estado: Record<string, number>
  por_clase_up: Record<string, number>
  por_clase_obra: Record<string, number>
  por_tipo_equipamiento: Record<string, number>
  por_centro_gestor: Record<string, number>
  avance_promedio: number
  presupuesto_total: number
  con_geometria: number
  sin_geometria: number
}

/**
 * Validaciones de campos de fecha
 */
export interface DateValidation {
  isValid: boolean
  errors: string[]
}

/**
 * Valida que las fechas de un proyecto sean consistentes
 */
export function validateProjectDates(proyecto: UnidadProyecto): DateValidation {
  const errors: string[] = []

  const fechaInicio = proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio) : null
  const fechaFin = proyecto.fecha_fin ? new Date(proyecto.fecha_fin) : null
  const fechaInauguracion = proyecto.fecha_inauguracion ? new Date(proyecto.fecha_inauguracion) : null

  // Validación: fecha_inicio debe ser anterior a fecha_fin
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    errors.push('La fecha de inicio debe ser anterior a la fecha de finalización')
  }

  // Validación: fecha_inauguracion debe ser posterior o igual a fecha_fin
  if (fechaFin && fechaInauguracion && fechaInauguracion < fechaFin) {
    errors.push('La fecha de inauguración debe ser posterior o igual a la fecha de finalización')
  }

  // Validación: fecha_inauguracion debe ser posterior a fecha_inicio
  if (fechaInicio && fechaInauguracion && fechaInauguracion < fechaInicio) {
    errors.push('La fecha de inauguración debe ser posterior a la fecha de inicio')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Formatea una fecha para mostrar en la UI
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'No disponible'
  
  try {
    const d = new Date(date)
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Fecha inválida'
  }
}

/**
 * Formatea un rango de fechas
 */
export function formatDateRange(
  fechaInicio: string | null | undefined,
  fechaFin: string | null | undefined
): string {
  if (!fechaInicio && !fechaFin) return 'Fechas no disponibles'
  if (!fechaInicio) return `Hasta ${formatDate(fechaFin)}`
  if (!fechaFin) return `Desde ${formatDate(fechaInicio)}`
  
  return `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`
}

/**
 * Calcula el estado de un proyecto basado en sus fechas
 */
export function getProjectStatusFromDates(proyecto: UnidadProyecto): string {
  const now = new Date()
  const fechaInicio = proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio) : null
  const fechaFin = proyecto.fecha_fin ? new Date(proyecto.fecha_fin) : null
  const fechaInauguracion = proyecto.fecha_inauguracion ? new Date(proyecto.fecha_inauguracion) : null

  if (fechaInauguracion && fechaInauguracion < now) {
    return 'Inaugurado'
  }

  if (fechaFin && fechaFin < now) {
    return 'Finalizado'
  }

  if (fechaInicio && fechaInicio > now) {
    return 'Programado'
  }

  if (fechaInicio && fechaInicio <= now && (!fechaFin || fechaFin >= now)) {
    return 'En ejecución'
  }

  return proyecto.estado || 'Estado desconocido'
}

/**
 * Obtiene el color del estado basado en las fechas
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Inaugurado': '#10b981', // green-500
    'Finalizado': '#3b82f6', // blue-500
    'En ejecución': '#f59e0b', // amber-500
    'Programado': '#8b5cf6', // violet-500
    'En alistamiento': '#6366f1', // indigo-500
    'Estado desconocido': '#6b7280' // gray-500
  }

  return colors[status] || colors['Estado desconocido']
}
