'use client'

import { useState, useEffect } from 'react'
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
  tipoIntervencion?: 'Construcción' | 'Mejoramiento' | 'Rehabilitación' | 'Mantenimiento' | 'Adecuación'
  claseObra?: string
  descripcion?: string
  direccion?: string
  lat?: number
  lng?: number
  geometry?: {
    type: string
    coordinates: number[] | number[][]
  }
  source: 'equipamientos' | 'infraestructura'
}

// Estado del hook
interface UnidadesProyectoState {
  equipamientos: GeoJSONData | null
  infraestructura: GeoJSONData | null
  unidadesProyecto: UnidadProyecto[]
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

// Mapea tipo de intervención del GeoJSON
function mapTipoIntervencion(tipo?: string): UnidadProyecto['tipoIntervencion'] {
  if (!tipo) return 'Construcción'
  
  const tipoLower = tipo.toLowerCase().trim()
  if (tipoLower.includes('construcción') || tipoLower.includes('construccion')) return 'Construcción'
  if (tipoLower.includes('mejoramiento')) return 'Mejoramiento'
  if (tipoLower.includes('rehabilitación') || tipoLower.includes('rehabilitacion')) return 'Rehabilitación'
  if (tipoLower.includes('mantenimiento')) return 'Mantenimiento'
  if (tipoLower.includes('adecuación') || tipoLower.includes('adecuacion')) return 'Adecuación'
  
  return 'Construcción' // default
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
  
  return {
    id,
    bpin: props.bpin?.toString() || '0',
    name: props.nickname || props.nombre_unidad_proyecto || props.seccion_via || `Unidad ${id}`,
    status: mapEstadoUnidadProyecto(props.estado_unidad_proyecto),
    comuna: props.comuna_corregimiento,
    barrio: props.barrio_vereda,
    budget: props.ppto_base || 0,
    executed: props.pagos_realizados || 0,
    pagado: props.pagos_realizados || 0,
    beneficiaries: props.usuarios_beneficiarios || 0,
    startDate,
    endDate,
    responsible: props.nombre_centro_gestor || 'No especificado',
    progress: (props.avance_físico_obra || 0) * 100, // Convertir de decimal a porcentaje
    tipoIntervencion: mapTipoIntervencion(props.tipo_intervencion),
    claseObra: props.clase_obra,
    descripcion: props.descripcion_intervencion,
    direccion: props.direccion,
    lat,
    lng,
    geometry: feature.geometry,
    source
  }
}

export function useUnidadesProyecto(): UnidadesProyectoState {
  const [state, setState] = useState<UnidadesProyectoState>({
    equipamientos: null,
    infraestructura: null,
    unidadesProyecto: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        console.log('🔄 Cargando datos de unidades de proyecto...')

        // Cargar ambos archivos GeoJSON en paralelo
        const [equipamientosRes, infraestructuraRes] = await Promise.all([
          fetch('/data/unidades_proyecto/equipamientos.geojson'),
          fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
        ])

        if (!equipamientosRes.ok) {
          throw new Error(`Error cargando equipamientos: HTTP ${equipamientosRes.status}`)
        }
        if (!infraestructuraRes.ok) {
          throw new Error(`Error cargando infraestructura: HTTP ${infraestructuraRes.status}`)
        }

        const equipamientosData = await equipamientosRes.json() as GeoJSONData
        const infraestructuraData = await infraestructuraRes.json() as GeoJSONData

        if (cancelled) return

        // Procesar coordenadas con la utilidad centralizada
        const equipamientosProcesados = processGeoJSONCoordinates(equipamientosData)
        const infraestructuraProcesada = processGeoJSONCoordinates(infraestructuraData)

        console.log(`✅ Equipamientos cargados: ${equipamientosProcesados.features?.length || 0} features`)
        console.log(`✅ Infraestructura cargada: ${infraestructuraProcesada.features?.length || 0} features`)

        // Convertir features a UnidadProyecto
        const equipamientosUnidades = (equipamientosProcesados.features || []).map((f: GeoJSONFeature) => 
          featureToUnidadProyecto(f, 'equipamientos')
        )
        const infraestructuraUnidades = (infraestructuraProcesada.features || []).map((f: GeoJSONFeature) => 
          featureToUnidadProyecto(f, 'infraestructura')
        )

        const todasLasUnidades = [...equipamientosUnidades, ...infraestructuraUnidades]

        console.log(`🎯 Total unidades de proyecto procesadas: ${todasLasUnidades.length}`)

        setState({
          equipamientos: equipamientosProcesados,
          infraestructura: infraestructuraProcesada,
          unidadesProyecto: todasLasUnidades,
          loading: false,
          error: null
        })

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
