'use client'

import { useState, useEffect } from 'react'
import { UnidadProyecto } from './useUnidadesProyecto'
import { loadMapDataWithFallback, validateMapData } from '@/utils/geoJSONLoader'

// Estado del hook optimizado
interface UnidadesProyectoOptimizedState {
  unidadesProyecto: UnidadProyecto[]
  allGeoJSONData: Record<string, any>
  loading: boolean
  error: string | null
}

// Estado global para evitar cargas múltiples
let globalOptimizedState: UnidadesProyectoOptimizedState | null = null
let globalOptimizedPromise: Promise<UnidadesProyectoOptimizedState> | null = null
let globalOptimizedListeners: Set<(state: UnidadesProyectoOptimizedState) => void> = new Set()

// Función para cargar datos de manera singleton optimizada
async function loadUnidadesOptimized(): Promise<UnidadesProyectoOptimizedState> {
  // Si ya hay una carga en progreso, esperar
  if (globalOptimizedPromise) {
    console.log('🔄 Esperando carga optimizada existente...')
    return globalOptimizedPromise
  }

  globalOptimizedPromise = (async () => {
    try {
      console.log('🚀 === INICIANDO CARGA OPTIMIZADA UNIDADES ===')

      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('Hook ejecutándose en servidor')
      }

      // Cargar datos GeoJSON
      console.log('📡 Cargando archivos GeoJSON...')
      const allGeoJSONData = await loadMapDataWithFallback()

      console.log('🔍 Datos cargados:', Object.keys(allGeoJSONData))

      // Validar datos
      if (!validateMapData(allGeoJSONData)) {
        console.warn('⚠️ Datos no válidos, usando estructura vacía')
      }

      // Verificar archivos válidos
      const validFiles = Object.entries(allGeoJSONData).filter(([fileName, data]: [string, any]) => 
        data && data.features && Array.isArray(data.features) && data.features.length > 0
      )

      console.log(`📊 Archivos válidos: ${validFiles.length}`)
      validFiles.forEach(([fileName, data]: [string, any]) => {
        console.log(`✅ ${fileName}: ${data.features.length} features`)
      })

      // Procesar datos mínimamente para obtener unidades básicas
      const unidadesSimples: UnidadProyecto[] = []

      for (const [fileName, geoJSONData] of validFiles) {
        const source = fileName.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
        
        const unidadesArchivo = (geoJSONData as any).features.map((feature: any, index: number) => {
          const props = feature.properties || {}
          
          // Crear unidad básica
          const unidad: UnidadProyecto = {
            id: props.identificador?.toString() || props.id_via?.toString() || `${source}-${index}`,
            bpin: props.bpin?.toString() || '0',
            name: props.nickname || props.nombre_unidad_proyecto || props.seccion_via || `Unidad ${index + 1}`,
            status: 'En Ejecución', // Por defecto
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
            geometry: feature.geometry,
            source: source as 'equipamientos' | 'infraestructura'
          }
          
          // Agregar coordenadas si es un punto
          if (feature.geometry?.type === 'Point' && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates
            if (Array.isArray(coords) && coords.length >= 2) {
              unidad.lng = coords[0]
              unidad.lat = coords[1]
            }
          }
          
          return unidad
        })
        
        unidadesSimples.push(...unidadesArchivo)
      }

      console.log(`🎯 Total unidades optimizadas: ${unidadesSimples.length}`)

      const finalState: UnidadesProyectoOptimizedState = {
        unidadesProyecto: unidadesSimples,
        allGeoJSONData: allGeoJSONData,
        loading: false,
        error: null
      }

      globalOptimizedState = finalState
      console.log('✅ === CARGA OPTIMIZADA COMPLETA ===')
      
      // Notificar a todos los listeners
      globalOptimizedListeners.forEach(listener => listener(finalState))
      
      return finalState

    } catch (error: any) {
      console.error('❌ Error en carga optimizada:', error)
      
      const errorState: UnidadesProyectoOptimizedState = {
        unidadesProyecto: [],
        allGeoJSONData: {},
        loading: false,
        error: error.message || 'Error cargando datos'
      }

      globalOptimizedState = errorState
      globalOptimizedPromise = null // Reset para permitir reintento
      
      // Notificar error a todos los listeners
      globalOptimizedListeners.forEach(listener => listener(errorState))
      
      throw error
    }
  })()

  return globalOptimizedPromise
}

export function useUnidadesProyectoOptimized(): UnidadesProyectoOptimizedState {
  console.log('🚀 useUnidadesProyectoOptimized: Hook START')
  
  const [state, setState] = useState<UnidadesProyectoOptimizedState>(() => {
    console.log('🏗️ useState optimizado inicializado')
    
    // Si ya tenemos datos globales, usarlos inmediatamente
    if (globalOptimizedState && !globalOptimizedState.loading) {
      console.log('🎯 Usando datos optimizados existentes:', globalOptimizedState.unidadesProyecto.length, 'unidades')
      return globalOptimizedState
    }
    
    return {
      unidadesProyecto: [],
      allGeoJSONData: {},
      loading: true,
      error: null
    }
  })

  console.log('🎯 Estado optimizado - loading:', state.loading, 'unidades:', state.unidadesProyecto.length)

  // Effect principal para cargar datos
  useEffect(() => {
    console.log('🔥 EFFECT OPTIMIZADO EJECUTADO!')
    console.log('🔥 Window available:', typeof window !== 'undefined')
    console.log('🔥 Estado global existe:', !!globalOptimizedState)
    
    // Si ya tenemos estado global completo, no necesitamos recargar
    if (globalOptimizedState && !globalOptimizedState.loading && globalOptimizedState.unidadesProyecto.length > 0) {
      console.log('✅ Estado optimizado ya existe, usando datos:', globalOptimizedState.unidadesProyecto.length, 'unidades')
      setState(globalOptimizedState)
      return
    }

    // Cargar datos solo en el cliente
    if (typeof window !== 'undefined') {
      console.log('🔥 Iniciando carga optimizada...')
      
      // Agregar listener para actualizaciones
      const listener = (newState: UnidadesProyectoOptimizedState) => {
        console.log('🔔 Actualización optimizada recibida:', newState.unidadesProyecto.length, 'unidades')
        setState(newState)
      }
      
      globalOptimizedListeners.add(listener)
      
      // Iniciar carga
      loadUnidadesOptimized()
        .then(result => {
          console.log('✅ Carga optimizada exitosa:', result.unidadesProyecto.length, 'unidades')
          // setState ya se llamará por el listener
        })
        .catch(error => {
          console.error('❌ Error en carga optimizada:', error)
          setState(prev => ({ 
            ...prev, 
            loading: false, 
            error: error.message 
          }))
        })
      
      // Cleanup
      return () => {
        console.log('🧹 Cleanup: removiendo listener optimizado')
        globalOptimizedListeners.delete(listener)
      }
    }
  }, []) // Sin dependencias

  console.log('🎯 Retornando estado optimizado - loading:', state.loading, 'unidades:', state.unidadesProyecto.length)

  return state
}
