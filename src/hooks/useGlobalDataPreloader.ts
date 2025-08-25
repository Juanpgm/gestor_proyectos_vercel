'use client'

import { useEffect } from 'react'
import { useUnidadesProyectoOptimized } from './useUnidadesProyectoOptimized'

// Hook para pre-cargar datos globalmente al iniciar la aplicación
export function useGlobalDataPreloader() {
  // Ejecutar hook optimizado para pre-cargar datos
  const optimizedData = useUnidadesProyectoOptimized()
  
  useEffect(() => {
    console.log('🌍 GLOBAL PRELOADER: Iniciando pre-carga de datos...')
    console.log('🌍 Estado:', {
      loading: optimizedData.loading,
      unidades: optimizedData.unidadesProyecto.length,
      geoJSONKeys: Object.keys(optimizedData.allGeoJSONData),
      error: optimizedData.error
    })
    
    if (!optimizedData.loading && optimizedData.unidadesProyecto.length > 0) {
      console.log('🌍 GLOBAL PRELOADER: ✅ Datos pre-cargados exitosamente!')
      console.log('🌍 Unidades disponibles:', optimizedData.unidadesProyecto.length)
      console.log('🌍 Archivos GeoJSON cargados:', Object.keys(optimizedData.allGeoJSONData))
    }
    
    if (optimizedData.error) {
      console.error('🌍 GLOBAL PRELOADER: ❌ Error en pre-carga:', optimizedData.error)
    }
  }, [optimizedData.loading, optimizedData.unidadesProyecto.length, optimizedData.allGeoJSONData, optimizedData.error])
  
  return optimizedData
}
