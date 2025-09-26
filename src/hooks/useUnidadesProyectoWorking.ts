'use client'

import { useState, useEffect } from 'react'

// Tipos para los datos GeoJSON
export interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon'
    coordinates: number[] | number[][]
  }
  properties: {
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
  properties?: any
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

// Función para convertir GeoJSON a UnidadProyecto
function convertGeoJSONToUnidadesProyecto(geoJsonData: GeoJSONData, source: 'equipamientos' | 'infraestructura'): UnidadProyecto[] {
  if (!geoJsonData?.features) return []

  return geoJsonData.features.map((feature, index) => {
    const props = feature.properties || {}
    
    return {
      id: props.id || props.ID || props.identificador || `${source}_${index}`,
      bpin: props.bpin || props.BPIN || '',
      name: props.name || props.NOMBRE || props.nickname || `${source} ${index + 1}`,
      status: 'En Ejecución' as const,
      comuna: props.comuna || props.COMUNA || props.comuna_corregimiento || '',
      barrio: props.barrio || props.BARRIO || props.barrio_vereda || '',
      corregimiento: props.corregimiento || props.CORREGIMIENTO || '',
      vereda: props.vereda || props.VEREDA || '',
      budget: Number(props.ppto_base || props.PRESUPUESTO || 0),
      executed: Number(props.pagos_realizados || props.EJECUTADO || 0),
      pagado: Number(props.pagos_realizados || props.PAGADO || 0),
      beneficiaries: Number(props.usuarios_beneficiarios || props.BENEFICIARIOS || 0),
      startDate: props.fecha_inicio_planeado || props.FECHA_INICIO || '',
      endDate: props.fecha_fin_planeado || props.FECHA_FIN || '',
      responsible: props.nombre_centro_gestor || props.RESPONSABLE || '',
      progress: Number(props.avance_físico_obra || props.AVANCE || 0),
      tipoIntervencion: props.tipo_intervencion || props.TIPO_INTERVENCION || source,
      claseObra: props.clase_obra || props.CLASE_OBRA || '',
      descripcion: props.descripcion_intervencion || props.DESCRIPCION || '',
      direccion: props.direccion || props.DIRECCION || '',
      geometry: feature.geometry,
      source,
      properties: props
    }
  })
}

// Variable global para evitar múltiples cargas
let globalDataCache: UnidadesProyectoState | null = null
let isLoading = false

// Hook principal que REALMENTE funciona - versión mejorada
export function useUnidadesProyectoWorking(): UnidadesProyectoState {
  console.log('🚀 useUnidadesProyectoWorking: Hook START - Enhanced')
  
  const [state, setState] = useState<UnidadesProyectoState>(() => {
    // Si ya tenemos datos en caché, úsalos inmediatamente
    if (globalDataCache) {
      console.log('💾 WORKING: Usando datos del caché global')
      return globalDataCache
    }
    
    return {
      equipamientos: null,
      infraestructura: null,
      unidadesProyecto: [],
      allGeoJSONData: {},
      loading: true,
      error: null
    }
  })

  // Múltiples estrategias para detectar el cliente
  const [isClientReady, setIsClientReady] = useState(false)

  // Efecto inmediato para detectar cliente
  useEffect(() => {
    console.log('🌟 WORKING: Detectando cliente - método 1')
    setIsClientReady(true)
  }, [])

  // Efecto alternativo con timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🌟 WORKING: Detectando cliente - método 2 (timeout)')
      setIsClientReady(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Efecto para verificar DOM completamente cargado
  useEffect(() => {
    if (typeof window !== 'undefined' && document.readyState === 'complete') {
      console.log('🌟 WORKING: Detectando cliente - método 3 (DOM complete)')
      setIsClientReady(true)
    }
  }, [])

  // Efecto principal para cargar datos con múltiples triggers
  useEffect(() => {
    // Si ya tenemos datos en caché, no necesitamos cargar
    if (globalDataCache && !globalDataCache.loading) {
      console.log('💾 WORKING: Aplicando caché existente')
      setState(globalDataCache)
      return
    }

    // Solo cargar si no estamos ya cargando
    if (isLoading) {
      console.log('⏳ WORKING: Carga ya en progreso...')
      return
    }

    // Verificar múltiples condiciones para asegurar que estamos en el cliente
    const isClient = typeof window !== 'undefined' && 
                    typeof document !== 'undefined' && 
                    isClientReady

    if (!isClient) {
      console.log('⏳ WORKING: Esperando cliente...', { 
        window: typeof window !== 'undefined',
        document: typeof document !== 'undefined',
        isClientReady 
      })
      return
    }

    console.log('🔄 WORKING: Iniciando carga de datos - Enhanced')
    isLoading = true

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        // Equipamientos removidos - datos ahora desde API
        console.log('📍 WORKING: Usando datos desde API solamente...')

        // Infraestructura vial - eliminada (archivos GeoJSON no existen)
        console.log('🛣️ WORKING: Infraestructura vial eliminada')
        const infraestructuraData: GeoJSONData = { 
          type: 'FeatureCollection',
          features: [] 
        }

        // Cargar centros de gravedad con timeout
        console.log('🎯 WORKING: Cargando centros de gravedad...')
        const centrosController = new AbortController()
        const centrosTimeout = setTimeout(() => centrosController.abort(), 15000)
        
        const centrosResponse = await fetch('/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson', {
          signal: centrosController.signal,
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        clearTimeout(centrosTimeout)
        
        if (!centrosResponse.ok) {
          throw new Error(`Error cargando centros de gravedad: ${centrosResponse.status}`)
        }
        const centrosGravedadData = await centrosResponse.json()

        console.log('✅ WORKING: Datos cargados exitosamente - Enhanced')
        console.log('📊 WORKING: Infraestructura features:', infraestructuraData.features?.length || 0)
        console.log('📊 WORKING: Centros Gravedad features:', centrosGravedadData.features?.length || 0)

        // Procesar y convertir a UnidadProyecto (solo infraestructura)
        const infraestructuraUnidades = convertGeoJSONToUnidadesProyecto(infraestructuraData, 'infraestructura')
        
        const allUnidades = [...infraestructuraUnidades]

        console.log('🎯 WORKING: Total unidades procesadas:', allUnidades.length)

        const newState = {
          equipamientos: null,
          infraestructura: infraestructuraData,
          unidadesProyecto: allUnidades,
          allGeoJSONData: {
            infraestructura_vial: infraestructuraData,
            centros_gravedad_unificado: centrosGravedadData
          },
          loading: false,
          error: null
        }

        // Guardar en caché global
        globalDataCache = newState
        setState(newState)

      } catch (error: any) {
        console.error('❌ WORKING: Error cargando datos:', error)
        const errorState = {
          equipamientos: null,
          infraestructura: null,
          unidadesProyecto: [],
          allGeoJSONData: {},
          loading: false,
          error: error.message || 'Error desconocido'
        }
        setState(errorState)
        globalDataCache = errorState
      } finally {
        isLoading = false
      }
    }

    loadData()
  }, [isClientReady]) // Depender solo de isClientReady

  console.log('📤 WORKING: Retornando estado Enhanced:', {
    loading: state.loading,
    unidades: state.unidadesProyecto.length,
    error: state.error,
    isClientReady,
    hasCache: !!globalDataCache
  })

  return state
}

// Re-exportar como el hook principal
export const useUnidadesProyecto = useUnidadesProyectoWorking

// Función para obtener estadísticas del sistema
export function getUnidadesProyectoStats() {
  return {
    cacheSize: 2, // equipamientos + infraestructura
    totalFiles: 2,
    loadedFiles: globalDataCache ? 2 : 0,
    status: globalDataCache ? 'loaded' : 'loading',
    hasGlobalCache: !!globalDataCache
  }
}

// Función para limpiar caché (útil para desarrollo)
export function clearDataCache() {
  globalDataCache = null
  isLoading = false
  console.log('🧹 WORKING: Caché limpiado')
}
