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

// Función para cargar datos directamente
async function loadDataDirectly(): Promise<UnidadesProyectoState> {
  try {
    console.log('🔄 === CARGA DIRECTA INICIADA ===')

    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      throw new Error('Componente ejecutándose en servidor')
    }

    // Usar sistema de carga con fallback
    console.log('📡 Iniciando carga de archivos GeoJSON...')
    const allGeoJSONData = await loadMapDataWithFallback()

    console.log('🔍 Resultado de carga:', allGeoJSONData)

    // Validar datos
    if (!validateMapData(allGeoJSONData)) {
      console.warn('⚠️ Datos no válidos, usando estructura vacía')
    }

    // Verificar que se cargaron datos válidos
    const validFiles = Object.entries(allGeoJSONData).filter(([fileName, data]: [string, any]) => 
      data && data.features && Array.isArray(data.features) && data.features.length > 0
    )

    console.log(`📊 Archivos válidos encontrados: ${validFiles.length}`)
    validFiles.forEach(([fileName, data]: [string, any]) => {
      console.log(`✅ ${fileName}: ${data.features.length} features`)
    })

    const finalState: UnidadesProyectoState = {
      equipamientos: null,
      infraestructura: null,
      unidadesProyecto: [],
      allGeoJSONData: allGeoJSONData,
      loading: false,
      error: null
    }

    console.log('✅ === CARGA DIRECTA COMPLETA ===')
    
    return finalState

  } catch (error: any) {
    console.error('❌ Error en carga directa:', error)
    
    const errorState: UnidadesProyectoState = {
      equipamientos: null,
      infraestructura: null,
      unidadesProyecto: [],
      allGeoJSONData: {},
      loading: false,
      error: error.message || 'Error cargando datos'
    }
    
    return errorState
  }
}

export function useUnidadesProyectoForced(): UnidadesProyectoState {
  console.log('🚀 FORCED HOOK: Iniciando')
  
  const [state, setState] = useState<UnidadesProyectoState>({
    equipamientos: null,
    infraestructura: null,
    unidadesProyecto: [],
    allGeoJSONData: {},
    loading: true,
    error: null
  })

  console.log('🚀 FORCED HOOK: useState configurado')

  // Cargar datos inmediatamente al inicializar el hook
  if (typeof window !== 'undefined' && state.loading) {
    console.log('🔥 FORCED HOOK: Iniciando carga inmediata...')
    
    loadDataDirectly()
      .then(result => {
        console.log('🔥 FORCED HOOK: Carga exitosa con', Object.keys(result.allGeoJSONData).length, 'archivos')
        setState(result)
      })
      .catch(error => {
        console.error('🔥 FORCED HOOK: Error en carga:', error)
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error.message || 'Error cargando datos'
        }))
      })
  }

  console.log('🚀 FORCED HOOK: Retornando estado, loading:', state.loading)
  
  return state
}
