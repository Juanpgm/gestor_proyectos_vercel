'use client'

/**
 * Servicio para interactuar con la API de Unidades de Proyecto
 * Proporciona funciones para consumir datos geográficos desde el backend FastAPI
 */

// Configuración de la API
const API_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app'
const DEFAULT_TIMEOUT = 30000 // 30 segundos

// Interface para los datos raw de la API
export interface UnidadProyectoApiResponse {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: number[]
  }
  has_geometry: boolean
  geometry_type: string
  properties: {
    processed_timestamp: string
    descripcion_intervencion?: string
    microtio?: string
    bpin: string
    centros_gravedad: boolean
    url_proceso?: string
    clase_obra: string
    tipo_intervencion: string
    upid: string
    referencia_contrato?: string
    identificador?: string
    unidad: string
    fecha_inicio?: string
    fecha_fin?: string
    estado?: string
    plataforma?: string
    nombre_up_detalle?: string
    nombre_centro_gestor: string
    avance_obra: number
    geometry_bounds?: any
    direccion?: string
    ano: string
    geometry_type?: string
    dataframe: string
    comuna_corregimiento: string
    nombre_up: string
    referencia_proceso?: string
    fuente_financiacion?: string
    barrio_vereda?: string
    cantidad: string
    presupuesto_base: number
  }
  updated_at: string
  id: string
  _metadata: {
    create_time: string
    update_time: string
  }
}

// Interface para las métricas del dashboard
export interface DashboardSummary {
  success: boolean
  metrics: {
    total_unidades: number
    bpins_unicos: number
    procesos_unicos: number
    contratos_unicos: number
  }
  distribuciones: {
    por_estado: Record<string, number>
    por_ano: Record<string, number>
    por_fuente_financiacion: Record<string, number>
    por_comuna_corregimiento: Record<string, number>
    por_barrio_vereda: Record<string, number>
  }
  timestamp: string
  collection: string
}

// Interface para la respuesta de la API
export interface UnidadesProyectoApiData {
  data: UnidadProyectoApiResponse[]
  count: number
  timestamp: string
  collection: string
}

// Interface normalizada para el uso en la aplicación
export interface UnidadProyectoGeo {
  id: string
  upid: string
  bpin: string
  nombre: string
  descripcion?: string
  direccion?: string
  
  // Ubicación
  comuna?: string
  barrio?: string
  corregimiento?: string
  vereda?: string
  coordinates?: {
    lat: number
    lng: number
  }
  
  // Información del proyecto
  tipo_intervencion: string
  clase_obra: string
  estado?: string
  avance_obra: number
  presupuesto_base: number
  
  // Fechas
  fecha_inicio?: string
  fecha_fin?: string
  ano: string
  
  // Responsables
  nombre_centro_gestor: string
  
  // Contratos y procesos
  referencia_contrato?: string
  referencia_proceso?: string
  url_proceso?: string
  
  // Fuente de financiación
  fuente_financiacion?: string
  
  // Metadatos
  plataforma?: string
  dataframe?: string
  updated_at: string
  
  // Propiedades geográficas originales
  originalProperties?: any
  geometry?: any
}

// Interface para filtros de búsqueda
export interface UnidadProyectoFilters {
  comuna?: string
  barrio?: string
  tipo_intervencion?: string
  clase_obra?: string
  estado?: string
  ano?: string
  centro_gestor?: string
  fuente_financiacion?: string
  search?: string
  bpin?: string
  upid?: string
}

/**
 * Transforma los datos de la API al formato normalizado
 */
function transformApiData(apiData: UnidadProyectoApiResponse): UnidadProyectoGeo {
  const props = apiData.properties
  
  return {
    id: apiData.id,
    upid: props.upid,
    bpin: props.bpin,
    nombre: props.nombre_up || props.nombre_up_detalle || `Proyecto ${props.bpin}`,
    descripcion: props.descripcion_intervencion,
    direccion: props.direccion,
    
    // Ubicación
    comuna: props.comuna_corregimiento,
    barrio: props.barrio_vereda,
    coordinates: apiData.has_geometry && apiData.geometry?.coordinates?.length === 2 ? {
      lng: apiData.geometry.coordinates[0],
      lat: apiData.geometry.coordinates[1]
    } : undefined,
    
    // Información del proyecto
    tipo_intervencion: props.tipo_intervencion,
    clase_obra: props.clase_obra,
    estado: props.estado,
    avance_obra: props.avance_obra || 0,
    presupuesto_base: props.presupuesto_base || 0,
    
    // Fechas
    fecha_inicio: props.fecha_inicio,
    fecha_fin: props.fecha_fin,
    ano: props.ano,
    
    // Responsables
    nombre_centro_gestor: props.nombre_centro_gestor,
    
    // Contratos y procesos
    referencia_contrato: props.referencia_contrato,
    referencia_proceso: props.referencia_proceso,
    url_proceso: props.url_proceso,
    
    // Fuente de financiación
    fuente_financiacion: props.fuente_financiacion,
    
    // Metadatos
    plataforma: props.plataforma,
    dataframe: props.dataframe,
    updated_at: apiData.updated_at,
    
    // Propiedades originales para referencia
    originalProperties: props,
    geometry: apiData.geometry
  }
}

/**
 * Realizar una petición HTTP con timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Obtener todas las unidades de proyecto
 */
export async function getAllUnidadesProyecto(): Promise<UnidadProyectoGeo[]> {
  try {
    console.log('🌍 Cargando todas las unidades de proyecto...')
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/unidades-proyecto`)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
    }
    
    const data: UnidadesProyectoApiData = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Formato de datos inválido recibido de la API')
    }
    
    const transformedData = data.data.map(transformApiData)
    
    console.log(`✅ Cargadas ${transformedData.length} unidades de proyecto`)
    return transformedData
    
  } catch (error) {
    console.error('❌ Error cargando unidades de proyecto:', error)
    throw error
  }
}

/**
 * Obtener unidades de proyecto filtradas
 */
export async function getFilteredUnidadesProyecto(filters: UnidadProyectoFilters): Promise<UnidadProyectoGeo[]> {
  try {
    console.log('🔍 Cargando unidades de proyecto filtradas:', filters)
    
    // Construir parámetros de query
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.toString().trim() !== '') {
        queryParams.append(key, value.toString())
      }
    })
    
    const url = `${API_BASE_URL}/unidades-proyecto/search?${queryParams.toString()}`
    const response = await fetchWithTimeout(url)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
    }
    
    const data: UnidadesProyectoApiData = await response.json()
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Formato de datos inválido recibido de la API')
    }
    
    const transformedData = data.data.map(transformApiData)
    
    console.log(`✅ Cargadas ${transformedData.length} unidades filtradas`)
    return transformedData
    
  } catch (error) {
    console.error('❌ Error cargando unidades filtradas:', error)
    throw error
  }
}

/**
 * Obtener métricas del dashboard
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    console.log('📊 Cargando métricas del dashboard...')
    
    const response = await fetchWithTimeout(`${API_BASE_URL}/dashboard/summary`)
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`)
    }
    
    const data: DashboardSummary = await response.json()
    
    console.log('✅ Métricas del dashboard cargadas')
    return data
    
  } catch (error) {
    console.error('❌ Error cargando métricas del dashboard:', error)
    throw error
  }
}