'use client'

import { useState, useEffect } from 'react'
import { processGeoJSONCoordinates, fixCoordinatesForGeoJSON } from '@/utils/coordinateUtils'
import { loadAllUnidadesProyecto } from '@/utils/geoJSONLoader'

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

export function useUnidadesProyecto(): UnidadesProyectoState {
  console.log('🚀 useUnidadesProyecto: Hook inicializado')
  
  const [state, setState] = useState<UnidadesProyectoState>({
    equipamientos: null,
    infraestructura: null,
    unidadesProyecto: [],
    allGeoJSONData: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        console.log('🔄 === INICIANDO CARGA UNIDADES DE PROYECTO (MEJORADO) ===')

        // Verificar que estamos en el cliente
        if (typeof window === 'undefined') {
          console.log('⚠️ Componente ejecutándose en servidor, saltando carga')
          return
        }

        // Usar nuestro nuevo sistema de carga automática
        console.log('📡 Cargando con sistema automático...')
        const allGeoJSONData = await loadAllUnidadesProyecto(
          { processCoordinates: true, cache: true },
          false // No usar detección automática para evitar 404s
        )

        if (cancelled) return

        console.log(`� Datos cargados automáticamente:`, allGeoJSONData)

        // Convertir todos los datos a UnidadProyecto de manera más eficiente
        const todasLasUnidades: UnidadProyecto[] = []

        // Procesar cada archivo cargado con procesamiento por lotes
        for (const [fileName, geoJSONData] of Object.entries(allGeoJSONData)) {
          if (geoJSONData?.features && geoJSONData.features.length > 0) {
            console.log(`📊 Procesando ${fileName}: ${geoJSONData.features.length} features`)
            
            const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
            
            // Procesar en lotes más pequeños para mejor rendimiento
            const batchSize = 100
            for (let i = 0; i < geoJSONData.features.length; i += batchSize) {
              const batch = geoJSONData.features.slice(i, i + batchSize)
              const unidadesBatch = batch.map((feature: GeoJSONFeature) => 
                featureToUnidadProyecto(feature, source)
              )
              todasLasUnidades.push(...unidadesBatch)
              
              // Permitir que el hilo principal respire cada 4 lotes
              if (i % (batchSize * 4) === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1))
              }
            }
          }
        }

        console.log(`🎯 === RESULTADO FINAL ===`)
        console.log(`📊 Total unidades de proyecto: ${todasLasUnidades.length}`)

        // Mostrar estadísticas por tipo
        const stats = todasLasUnidades.reduce((acc, unidad) => {
          acc[unidad.source || 'desconocido'] = (acc[unidad.source || 'desconocido'] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('📈 Estadísticas por tipo:', stats)

        setState({
          equipamientos: null,
          infraestructura: null,
          unidadesProyecto: todasLasUnidades,
          allGeoJSONData: allGeoJSONData,
          loading: false,
          error: null
        })

        console.log('✅ === CARGA COMPLETA ===')

      } catch (error: any) {
        if (!cancelled) {
          console.error('❌ Error cargando unidades de proyecto:', error)
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Error cargando datos'
          }))
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
