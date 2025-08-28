'use client'

import { useState, useEffect, useMemo } from 'react'
import { processGeoJSONCoordinates, fixCoordinatesForGeoJSON } from '@/utils/coordinateUtils'
import { loadMapDataWithFallback, validateMapData } from '@/utils/geoJSONLoader'

// Tipos para los datos GeoJSON
export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon'
    coordinates: number[] | number[][]
  }
  properties: {
    bpin?: number | string
    identificador?: string | number
    nickname?: string
    nickname_detalle?: string
    comuna_corregimiento?: string
    barrio_vereda?: string
    direccion?: string
    clase_obra?: string
    subclase_obra?: string
    tipo_intervencion?: string
    descripcion_intervencion?: string
    estado_unidad_proyecto?: string
    fecha_inicio_planeado?: string
    fecha_fin_planeado?: string
    fecha_inicio_real?: string
    fecha_fin_real?: string
    ppto_base?: number
    pagos_realizados?: number
    avance_físico_obra?: number
    ejecucion_financiera_obra?: number
    nombre_centro_gestor?: string
    usuarios_beneficiarios?: number
    cod_fuente_financiamiento?: string
    fuente_financiamiento?: string
    // Para infraestructura vial
    id_via?: string
    seccion_via?: string
    [key: string]: any
  }
}

export interface GeoJSONData {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// Tipo unificado para unidades de proyecto
export interface UnidadProyecto {
  id: string
  bpin: string
  name: string
  status: 'En Ejecución' | 'Planificación' | 'Completado' | 'Suspendido' | 'En Evaluación'
  comuna?: string
  barrio?: string
  corregimiento?: string
  vereda?: string
  budget: number
  executed: number
  pagado: number
  beneficiaries: number
  startDate: string
  endDate: string
  responsible: string
  progress: number
  tipoIntervencion?: string
  claseObra?: string
  descripcion?: string
  direccion?: string
  lat?: number
  lng?: number
  geometry?: {
    type: string
    coordinates: number[] | number[][]
  }
  source?: 'equipamientos' | 'infraestructura'
}

// Estado del hook
interface UnidadesProyectoState {
  equipamientos: GeoJSONData | null
  infraestructura: GeoJSONData | null
  unidadesProyecto: UnidadProyecto[]
  allGeoJSONData: Record<string, GeoJSONData>
  loading: boolean
  error: string | null
}

// Normaliza coordenadas usando la utilidad centralizada
function normalizePointCoords(coords: any): [number, number] | null {
  if (!coords || !Array.isArray(coords)) return null
  
  // Filtrar coordenadas vacías
  if (coords.length === 0) return null
  
  if (coords.length === 2) {
    // Usar la función centralizada de corrección
    const corrected = fixCoordinatesForGeoJSON(coords)
    return corrected
  }
  
  if (coords.length === 4) {
    // Formato especial [3, 424204, -76, 491289] -> [3.424204, -76.491289]
    const lat = parseFloat(`${coords[0]}.${coords[1]}`)
    const lng = parseFloat(`${coords[2]}.${coords[3]}`)
    
    if (isNaN(lat) || isNaN(lng)) return null
    return fixCoordinatesForGeoJSON([lat, lng]) // Procesar con utilidad
  }
  
  return null
}

// Mapea estado del GeoJSON a estado de la aplicación
function mapEstadoUnidadProyecto(estado?: string): UnidadProyecto['status'] {
  if (!estado) return 'Planificación'
  
  const estadoLower = estado.toLowerCase().trim()
  if (estadoLower.includes('ejecución') || estadoLower.includes('ejecucion')) return 'En Ejecución'
  if (estadoLower.includes('completado') || estadoLower.includes('terminado') || estadoLower.includes('finalizado')) return 'Completado'
  if (estadoLower.includes('suspendido') || estadoLower.includes('pausado')) return 'Suspendido'
  if (estadoLower.includes('evaluación') || estadoLower.includes('evaluacion') || estadoLower.includes('revisión')) return 'En Evaluación'
  if (estadoLower.includes('planificación') || estadoLower.includes('planificacion') || estadoLower.includes('planeación')) return 'Planificación'
  
  return 'En Ejecución' // default
}

// Mapea tipo de intervención del GeoJSON - conservar valores originales
function mapTipoIntervencion(tipo?: string): string {
  if (!tipo) return 'Sin especificar'
  
  // Retornar el valor original limpio
  return typeof tipo === 'string' ? tipo.trim() : 'Sin especificar'
}

// Función para separar comunas y corregimientos del campo comuna_corregimiento
function procesarComunaCorregimiento(comunaCorregimiento?: string): { comuna?: string, corregimiento?: string } {
  if (!comunaCorregimiento || typeof comunaCorregimiento !== 'string') return {}
  
  const valor = comunaCorregimiento.trim()
  
  // Si empieza con "Comuna" (case insensitive), es una comuna
  if (valor.toLowerCase().startsWith('comuna')) {
    return { comuna: valor }
  }
  
  // Si empieza con "Corregimiento" (case insensitive), es un corregimiento  
  if (valor.toLowerCase().startsWith('corregimiento')) {
    return { corregimiento: valor }
  }
  
  // Para valores como "La Elvira", "La Buitrera", etc. (nombres propios)
  // Estos parecen ser corregimientos/veredas según el contexto de los datos
  return { corregimiento: valor }
}

// Convierte feature de equipamientos a UnidadProyecto
function featureToUnidadProyecto(feature: GeoJSONFeature, source: 'equipamientos' | 'infraestructura'): UnidadProyecto {
  const props = feature.properties
  
  // Obtener coordenadas normalizadas para puntos
  let lat: number | undefined
  let lng: number | undefined
  
  if (feature.geometry.type === 'Point') {
    const normalizedCoords = normalizePointCoords(feature.geometry.coordinates)
    if (normalizedCoords) {
      [lng, lat] = normalizedCoords
    }
  }
  
  // Generar ID único
  const id = props.identificador?.toString() || props.id_via?.toString() || `${source}-${Math.random().toString(36).substr(2, 9)}`
  
  // Generar fechas por defecto si no existen
  const startDate = props.fecha_inicio_real || props.fecha_inicio_planeado || '2024-01-01'
  const endDate = props.fecha_fin_real || props.fecha_fin_planeado || '2024-12-31'
  
  // Procesar campo comuna_corregimiento para separar comunas y corregimientos
  const { comuna, corregimiento } = procesarComunaCorregimiento(props.comuna_corregimiento)
  
  // Procesar campo barrio_vereda para separar barrios y veredas
  const barrioVereda = typeof props.barrio_vereda === 'string' ? props.barrio_vereda.trim() : undefined
  let barrio: string | undefined
  let vereda: string | undefined
  
  if (barrioVereda) {
    // Si el valor del barrio/vereda es "Vereda", es una vereda genérica
    if (barrioVereda.toLowerCase() === 'vereda') {
      vereda = barrioVereda
    } else {
      // Asumir que es un barrio en caso contrario
      barrio = barrioVereda
    }
  }
  
  return {
    id,
    bpin: props.bpin?.toString() || '0',
    name: props.nickname || props.nombre_unidad_proyecto || props.seccion_via || `Unidad ${id}`,
    status: mapEstadoUnidadProyecto(props.estado_unidad_proyecto),
    comuna,
    barrio,
    corregimiento,
    vereda,
    budget: props.ppto_base || 0,
    executed: props.pagos_realizados || 0,
    pagado: props.pagos_realizados || 0,
    beneficiaries: props.usuarios_beneficiarios || 0,
    startDate,
    endDate,
    responsible: props.nombre_centro_gestor || 'No especificado',
    progress: (props.avance_físico_obra || 0) * 100, // Convertir de decimal a porcentaje
    tipoIntervencion: mapTipoIntervencion(props.tipo_intervencion),
    claseObra: typeof props.clase_obra === 'string' ? props.clase_obra.trim() : 'Sin especificar',
    descripcion: props.descripcion_intervencion,
    direccion: props.direccion,
    lat,
    lng,
    geometry: feature.geometry,
    source
  }
}

// Estado global para evitar cargas múltiples - MEJORADO con lógica del sistema dinámico
let globalUnidadesState: UnidadesProyectoState | null = null
let globalUnidadesPromise: Promise<UnidadesProyectoState> | null = null
let globalListeners: Set<(state: UnidadesProyectoState) => void> = new Set()

// Cache para prevenir cargas duplicadas de archivos específicos - NUEVO
const fileCache = new Map<string, any>()
const loadingPromises = new Map<string, Promise<any>>()

/**
 * Cargar un archivo GeoJSON específico con cache inteligente
 * Inspirado en el sistema dinámico pero adaptado para el sistema existente
 */
async function loadGeoJSONFileWithCache(filePath: string): Promise<any> {
  console.log(`📡 Cargando archivo: ${filePath}`)

  // Si ya está en cache, retornar inmediatamente
  if (fileCache.has(filePath)) {
    console.log(`📦 Usando cache para: ${filePath}`)
    return fileCache.get(filePath)
  }

  // Si ya está en proceso de carga, esperar la promesa existente
  if (loadingPromises.has(filePath)) {
    console.log(`⏳ Esperando carga en proceso para: ${filePath}`)
    return await loadingPromises.get(filePath)!
  }

  // Crear nueva promesa de carga
  const loadPromise = (async () => {
    try {
      console.log(`🔄 Iniciando carga de: ${filePath}`)

      // Crear AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

      const response = await fetch(filePath, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} para ${filePath}`)
      }

      const data = await response.json()

      // Validar estructura GeoJSON
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error(`Archivo GeoJSON inválido: ${filePath}`)
      }

      console.log(`✅ ${filePath} cargado: ${data.features.length} features`)

      // Procesar coordenadas usando la función existente
      const processedData = processGeoJSONCoordinates(data)
      
      // Guardar en cache
      fileCache.set(filePath, processedData)

      return processedData

    } catch (error) {
      console.error(`❌ Error cargando ${filePath}:`, error)
      throw error
    } finally {
      // Limpiar promesa del mapa
      loadingPromises.delete(filePath)
    }
  })()

  // Guardar promesa para evitar cargas duplicadas
  loadingPromises.set(filePath, loadPromise)

  return loadPromise
}

/**
 * Cargar múltiples archivos GeoJSON secuencialmente para evitar sobrecarga
 * Mejora del sistema dinámico aplicada al sistema existente
 */
async function loadMultipleGeoJSONFiles(filePaths: string[]): Promise<Record<string, any>> {
  console.log(`🗺️ Cargando múltiples archivos GeoJSON:`, filePaths)

  const results: Record<string, any> = {}
  const errors: string[] = []

  // Cargar archivos secuencialmente para evitar saturar el servidor
  for (const filePath of filePaths) {
    try {
      const data = await loadGeoJSONFileWithCache(filePath)
      const fileName = filePath.split('/').pop()?.replace('.geojson', '') || filePath
      results[fileName] = data
    } catch (error: any) {
      console.warn(`⚠️ Error cargando ${filePath}:`, error)
      errors.push(`${filePath}: ${error.message}`)
      // Continuar con los demás archivos
    }
  }

  console.log(`✅ ${Object.keys(results).length}/${filePaths.length} archivos cargados exitosamente`)
  
  if (errors.length > 0) {
    console.warn(`⚠️ Errores en carga:`, errors)
  }

  return results
}

// Función para cargar datos de manera singleton - MEJORADA
async function loadUnidadesProyectoGlobal(): Promise<UnidadesProyectoState> {
  if (globalUnidadesPromise) {
    console.log('🔄 Esperando carga global existente...')
    return globalUnidadesPromise
  }

  globalUnidadesPromise = (async () => {
    try {
      console.log('🔄 === INICIANDO CARGA GLOBAL UNIDADES DE PROYECTO (MEJORADA) ===')

      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('Componente ejecutándose en servidor')
      }

      // Definir archivos a cargar (mejora: lista explícita y ordenada por prioridad)
      const filesToLoad = [
        '/data/geodata/unidades_proyecto/equipamientos.geojson',
        '/data/geodata/unidades_proyecto/infraestructura_vial.geojson',
        '/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson',
        '/data/geodata/comunas.geojson',
        '/data/geodata/barrios.geojson',
        '/data/geodata/corregimientos.geojson',
        '/data/geodata/veredas.geojson'
      ]

      console.log('� Iniciando carga secuencial de archivos GeoJSON...')
      
      // Usar el nuevo sistema de carga mejorado
      const allGeoJSONData = await loadMultipleGeoJSONFiles(filesToLoad)

      console.log('🔍 Resultado de carga mejorada:', Object.keys(allGeoJSONData))

      // Verificar que se cargaron datos válidos
      const validFiles = Object.entries(allGeoJSONData).filter(([fileName, data]: [string, any]) => 
        data && data.features && Array.isArray(data.features) && data.features.length > 0
      )

      console.log(`📊 Archivos válidos encontrados: ${validFiles.length}`)
      validFiles.forEach(([fileName, data]: [string, any]) => {
        console.log(`✅ ${fileName}: ${data.features.length} features`)
        
        // Log específico para infraestructura vial
        if (fileName === 'infraestructura_vial') {
          console.log(`🛣️ Infraestructura vial - muestra de features:`, {
            totalFeatures: data.features.length,
            firstFeature: data.features[0]?.properties,
            geometryTypes: data.features.map((f: any) => f.geometry.type).slice(0, 5)
          })
        }
      })

      // Convertir todos los datos a UnidadProyecto
      const todasLasUnidades: UnidadProyecto[] = []

      for (const [fileName, geoJSONData] of validFiles) {
        const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
        
        const unidadesArchivo = (geoJSONData as any).features.map((feature: GeoJSONFeature) => 
          featureToUnidadProyecto(feature, source)
        )
        todasLasUnidades.push(...unidadesArchivo)
      }

      console.log(`🎯 Total unidades globales: ${todasLasUnidades.length}`)

      const finalState: UnidadesProyectoState = {
        equipamientos: null,
        infraestructura: null,
        unidadesProyecto: todasLasUnidades,
        allGeoJSONData: allGeoJSONData,
        loading: false,
        error: null
      }

      globalUnidadesState = finalState
      console.log('✅ === CARGA GLOBAL COMPLETA (MEJORADA) ===')
      
      // Notificar a todos los listeners
      globalListeners.forEach(listener => listener(finalState))
      
      return finalState

    } catch (error: any) {
      console.error('❌ Error en carga global:', error)
      
      const errorState: UnidadesProyectoState = {
        equipamientos: null,
        infraestructura: null,
        unidadesProyecto: [],
        allGeoJSONData: {},
        loading: false,
        error: error.message || 'Error cargando datos'
      }

      globalUnidadesState = errorState
      globalUnidadesPromise = null // Reset para permitir reintento
      
      // Notificar error a todos los listeners
      globalListeners.forEach(listener => listener(errorState))
      
      throw error
    }
  })()

  return globalUnidadesPromise
}

/**
 * Obtener estadísticas del sistema de cache - NUEVA función inspirada en el sistema dinámico
 */
export function getUnidadesProyectoStats() {
  const cacheSize = fileCache.size
  const loadingCount = loadingPromises.size
  const globalState = globalUnidadesState

  return {
    cacheSize,
    loadingCount,
    hasGlobalData: !!globalState,
    isLoading: !!globalUnidadesPromise && !globalState,
    totalUnidades: globalState?.unidadesProyecto.length || 0,
    totalGeoJSONFiles: Object.keys(globalState?.allGeoJSONData || {}).length,
    error: globalState?.error || null
  }
}

/**
 * Limpiar cache de archivos - NUEVA función para management de memoria
 */
export function clearUnidadesProyectoCache() {
  fileCache.clear()
  loadingPromises.clear()
  globalUnidadesState = null
  globalUnidadesPromise = null
  console.log('🧹 Cache de unidades de proyecto limpiado')
}

/**
 * Suscribirse a cambios en el estado global - NUEVA función para reactivity
 */
export function subscribeToUnidadesProyectoChanges(listener: (state: UnidadesProyectoState) => void): () => void {
  globalListeners.add(listener)
  
  // Si ya hay datos, notificar inmediatamente
  if (globalUnidadesState) {
    listener(globalUnidadesState)
  }
  
  // Retornar función de limpieza
  return () => {
    globalListeners.delete(listener)
  }
}

export function useUnidadesProyecto(): UnidadesProyectoState {
  console.log('🚀 useUnidadesProyecto: Hook START (HYDRATION FIX)')
  
  // Track if we're on client side
  const [isClient, setIsClient] = useState(false)
  
  const [state, setState] = useState<UnidadesProyectoState>(() => {
    console.log('🏗️ useState inicializado - verificando si hay datos globales')
    console.log('🏗️ globalUnidadesState existe:', !!globalUnidadesState)
    console.log('🏗️ window disponible:', typeof window !== 'undefined')
    
    // Si ya tenemos datos globales cargados, úsalos inmediatamente
    if (globalUnidadesState && !globalUnidadesState.loading) {
      console.log('🎯 Datos globales encontrados, usando estado existente')
      console.log('🎯 Estado global:', {
        unidades: globalUnidadesState.unidadesProyecto.length,
        geoJSONKeys: Object.keys(globalUnidadesState.allGeoJSONData),
        loading: globalUnidadesState.loading,
        error: globalUnidadesState.error
      })
      return globalUnidadesState
    }
    
    // Estado inicial de carga
    console.log('🎯 Retornando estado inicial de carga')
    return {
      equipamientos: null,
      infraestructura: null,
      unidadesProyecto: [],
      allGeoJSONData: {},
      loading: true,
      error: null
    }
  })

  // Effect to detect client-side hydration
  useEffect(() => {
    console.log('� HYDRATION EFFECT: Setting isClient to true')
    setIsClient(true)
  }, [])

  console.log('�🎯 BEFORE main useEffect, isClient:', isClient)
  console.log('🎯 BEFORE main useEffect, state loading:', state.loading)
  console.log('🎯 BEFORE main useEffect, state unidades:', state.unidadesProyecto.length)

  // Main data loading effect - now depends on isClient
  useEffect(() => {
    if (!isClient) {
      console.log('🔥 EFFECT SKIPPED: Not on client side yet')
      return
    }

    console.log('🔥 EFFECT EJECUTADO (CLIENT-SIDE)!')
    console.log('🔥 isClient:', isClient)
    console.log('🔥 Window available:', typeof window !== 'undefined')
    console.log('🔥 Global state exists:', !!globalUnidadesState)
    console.log('🔥 Global state loading:', globalUnidadesState?.loading)
    console.log('🔥 Global promise exists:', !!globalUnidadesPromise)
    
    // Suscribirse a cambios globales para reactivity automática
    const unsubscribe = subscribeToUnidadesProyectoChanges((newState) => {
      console.log('📢 Cambio global detectado, actualizando estado local')
      console.log('📢 Nuevo estado tiene datos:', {
        unidades: newState.unidadesProyecto.length,
        geoJSONKeys: Object.keys(newState.allGeoJSONData),
        loading: newState.loading,
        error: newState.error
      })
      setState(newState)
    })
    
    // Cargar datos ahora que estamos en client-side
    console.log('🔥 INICIANDO CARGA CLIENT-SIDE...')
    
    loadUnidadesProyectoGlobal()
      .then(result => {
        console.log('✅ Carga exitosa desde useEffect:', {
          unidades: result.unidadesProyecto.length,
          geoJSONKeys: Object.keys(result.allGeoJSONData),
          error: result.error
        })
      })
      .catch(error => {
        console.error('❌ Error en carga desde useEffect:', error)
      })
    
    // Cleanup function mejorada
    return () => {
      console.log('🔥 EFFECT CLEANUP (CLIENT-SIDE)')
      unsubscribe()
    }
  }, [isClient]) // Depende de isClient para ejecutarse solo en cliente

  console.log('🎯 AFTER useEffect setup, isClient:', isClient)
  console.log('🎯 AFTER useEffect setup, returning state loading:', state.loading)
  console.log('🎯 AFTER useEffect setup, returning state unidades:', state.unidadesProyecto.length)

  return state
}
