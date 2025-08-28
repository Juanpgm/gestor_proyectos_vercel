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

// Hook simplificado sin useEffect problemático
export function useUnidadesProyecto(): UnidadesProyectoState {
  console.log('🚀 useUnidadesProyecto: Hook START (SIMPLIFIED NO-USEEFFECT)')
  
  const [state, setState] = useState<UnidadesProyectoState>(() => {
    console.log('🏗️ useState inicializado')
    console.log('🏗️ window disponible:', typeof window !== 'undefined')
    
    const initialState = {
      equipamientos: null,
      infraestructura: null,
      unidadesProyecto: [],
      allGeoJSONData: {},
      loading: true,
      error: null
    }
    
    // Si estamos en el cliente, iniciar carga inmediatamente con setTimeout
    if (typeof window !== 'undefined') {
      console.log('🔥 CLIENT-SIDE: Iniciando carga con setTimeout...')
      
      setTimeout(async () => {
        console.log('🔥 TIMEOUT: Ejecutando carga de datos...')
        
        try {
          // Lista de archivos a cargar
          const filesToLoad = [
            '/data/geodata/unidades_proyecto/equipamientos.geojson',
            '/data/geodata/unidades_proyecto/infraestructura_vial.geojson',
            '/data/geodata/comunas.geojson',
            '/data/geodata/barrios.geojson',
            '/data/geodata/corregimientos.geojson',
            '/data/geodata/veredas.geojson'
          ]
          
          console.log('📡 Cargando archivos:', filesToLoad)
          
          const allGeoJSONData: Record<string, any> = {}
          let successCount = 0
          
          // Cargar archivos secuencialmente
          for (const filePath of filesToLoad) {
            try {
              console.log(`📡 Cargando: ${filePath}`)
              
              const response = await fetch(filePath)
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
              }
              
              const data = await response.json()
              if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
                throw new Error(`Archivo GeoJSON inválido: ${filePath}`)
              }
              
              const fileName = filePath.split('/').pop()?.replace('.geojson', '') || filePath
              const processedData = processGeoJSONCoordinates(data)
              allGeoJSONData[fileName] = processedData
              
              successCount++
              console.log(`✅ ${fileName}: ${data.features.length} features cargadas`)
              
            } catch (error: any) {
              console.warn(`⚠️ Error cargando ${filePath}:`, error.message)
            }
          }
          
          console.log(`✅ Carga completa: ${successCount}/${filesToLoad.length} archivos`)
          
          // Convertir datos a unidades de proyecto
          const todasLasUnidades: UnidadProyecto[] = []
          
          Object.entries(allGeoJSONData).forEach(([fileName, geoJSONData]) => {
            const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
            
            geoJSONData.features.forEach((feature: GeoJSONFeature) => {
              // Conversión simplificada
              const props = feature.properties
              const id = props.identificador?.toString() || props.id_via?.toString() || `${source}-${Math.random().toString(36).substr(2, 9)}`
              
              // Obtener coordenadas
              let lat: number | undefined
              let lng: number | undefined
              
              if (feature.geometry.type === 'Point') {
                const coords = fixCoordinatesForGeoJSON(feature.geometry.coordinates as number[])
                if (coords) {
                  [lng, lat] = coords
                }
              }
              
              const unidad: UnidadProyecto = {
                id,
                bpin: props.bpin?.toString() || '0',
                name: props.nickname || props.nombre_unidad_proyecto || props.seccion_via || `Unidad ${id}`,
                status: 'En Ejecución', // Simplificado
                comuna: props.comuna_corregimiento?.includes('Comuna') ? props.comuna_corregimiento : undefined,
                barrio: props.barrio_vereda,
                budget: props.ppto_base || 0,
                executed: props.pagos_realizados || 0,
                pagado: props.pagos_realizados || 0,
                beneficiaries: props.usuarios_beneficiarios || 0,
                startDate: props.fecha_inicio_real || props.fecha_inicio_planeado || '2024-01-01',
                endDate: props.fecha_fin_real || props.fecha_fin_planeado || '2024-12-31',
                responsible: props.nombre_centro_gestor || 'No especificado',
                progress: (props.avance_físico_obra || 0) * 100,
                tipoIntervencion: props.tipo_intervencion || 'Sin especificar',
                claseObra: props.clase_obra || 'Sin especificar',
                descripcion: props.descripcion_intervencion,
                direccion: props.direccion,
                lat,
                lng,
                geometry: feature.geometry,
                source
              }
              
              todasLasUnidades.push(unidad)
            })
          })
          
          console.log(`🎯 Total unidades procesadas: ${todasLasUnidades.length}`)
          
          // Actualizar estado
          setState({
            equipamientos: allGeoJSONData.equipamientos || null,
            infraestructura: allGeoJSONData.infraestructura_vial || null,
            unidadesProyecto: todasLasUnidades,
            allGeoJSONData,
            loading: false,
            error: null
          })
          
          console.log('✅ Estado actualizado exitosamente')
          
        } catch (error: any) {
          console.error('❌ Error en carga de datos:', error)
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.message || 'Error cargando datos'
          }))
        }
      }, 100) // Delay mínimo para asegurar que el componente esté montado
    }
    
    console.log('🎯 Retornando estado inicial')
    return initialState
  })
  
  console.log('🎯 RETURNING state:', {
    loading: state.loading,
    unidades: state.unidadesProyecto.length,
    error: state.error,
    geoJSONKeys: Object.keys(state.allGeoJSONData)
  })
  
  return state
}

// Función de estadísticas simplificada
export function getUnidadesProyectoStats() {
  return {
    cacheSize: 0,
    loadingCount: 0,
    hasGlobalData: false,
    isLoading: false,
    totalUnidades: 0,
    totalGeoJSONFiles: 0,
    error: null
  }
}
