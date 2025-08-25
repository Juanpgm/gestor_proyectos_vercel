'use client'

import { useState, useEffect, useMemo } from 'react'
import { processGeoJSONCoordinates, fixCoordinatesForGeoJSON } from '@/utils/coordinateUtils'

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
  console.log('🚀 useUnidadesProyecto: Hook START')
  
  const [state, setState] = useState<UnidadesProyectoState>({
    equipamientos: null,
    infraestructura: null,
    unidadesProyecto: [],
    allGeoJSONData: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    console.log('📍 EFFECT EJECUTADO! Iniciando carga directa...')
    
    const loadData = async () => {
      try {
        console.log('🔄 Iniciando carga directa de archivos...')
        
        // Cargar archivos directamente
        const results: Record<string, any> = {}
        const filesToLoad = ['equipamientos', 'infraestructura_vial']
        
        for (const fileName of filesToLoad) {
          const fullPath = `/data/unidades_proyecto/${fileName}.geojson`
          
          console.log(`🔍 Cargando: ${fullPath}`)
          
          try {
            const response = await fetch(fullPath)
            if (response.ok) {
              const data = await response.json()
              if (data && data.features && Array.isArray(data.features)) {
                results[fileName] = data
                console.log(`✅ ${fileName}: ${data.features.length} features`)
              } else {
                console.warn(`⚠️ ${fileName}: Sin features válidas`)
                results[fileName] = { type: 'FeatureCollection', features: [] }
              }
            } else {
              console.warn(`⚠️ ${fileName}: HTTP ${response.status}`)
              results[fileName] = { type: 'FeatureCollection', features: [] }
            }
          } catch (fileError) {
            console.warn(`⚠️ Error cargando ${fileName}:`, fileError)
            results[fileName] = { type: 'FeatureCollection', features: [] }
          }
        }
        
        // Convertir a UnidadProyecto
        const todasLasUnidades: UnidadProyecto[] = []
        
        for (const [fileName, geoJSONData] of Object.entries(results)) {
          if (geoJSONData && geoJSONData.features && Array.isArray(geoJSONData.features)) {
            const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
            
            const unidadesArchivo = geoJSONData.features.map((feature: GeoJSONFeature) => 
              featureToUnidadProyecto(feature, source)
            )
            todasLasUnidades.push(...unidadesArchivo)
          }
        }
        
        console.log(`🎯 Total unidades cargadas: ${todasLasUnidades.length}`)
        
        setState({
          equipamientos: results.equipamientos || null,
          infraestructura: results.infraestructura_vial || null,
          unidadesProyecto: todasLasUnidades,
          allGeoJSONData: results,
          loading: false,
          error: null
        })
        
      } catch (error: any) {
        console.error('❌ Error en carga:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Error cargando datos'
        }))
      }
    }
    
    loadData()
  }, [])

  console.log('🎯 Returning state - loading:', state.loading, 'unidades:', state.unidadesProyecto.length)
  return state
}
