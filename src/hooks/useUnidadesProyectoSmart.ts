'use client'

import { useUnidadesProyecto } from './useUnidadesProyecto'
import { useUnidadesProyectoOffline } from './useUnidadesProyectoOffline'
import type { UnidadProyectoFilters } from './useUnidadesProyectoOffline'

/**
 * Hook inteligente que detecta automáticamente qué fuente de datos usar:
 * - Si hay API_URL configurada Y el modo no es 'offline': usa datos reales
 * - Si modo es 'offline' o no hay API_URL: usa datos mock
 * - Permite override manual del modo
 */
export function useUnidadesProyectoSmart(filters?: UnidadProyectoFilters, forceMode?: 'api' | 'offline') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'offline'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Determinar qué modo usar
  const shouldUseAPI = forceMode === 'api' || (
    forceMode !== 'offline' && 
    apiUrl && 
    dataMode === 'api' && 
    typeof window !== 'undefined'
  )
  
  console.log('🧠 Smart Hook - Configuración:', {
    apiUrl: !!apiUrl,
    dataMode,
    isProduction,
    forceMode,
    shouldUseAPI,
    windowAvailable: typeof window !== 'undefined'
  })
  
  // Usar el hook apropiado basado en la configuración
  const apiData = useUnidadesProyecto()
  const offlineData = useUnidadesProyectoOffline(filters)
  
  if (shouldUseAPI) {
    console.log('🌐 Usando datos de API:', {
      loading: apiData.loading,
      unidades: apiData.unidadesProyecto.length,
      error: apiData.error
    })
    
    return {
      ...apiData,
      data: apiData.unidadesProyecto,
      dataSource: 'api' as const,
      isOffline: false,
      totalCount: apiData.unidadesProyecto.length,
      // Mapear para compatibilidad con el hook offline
      processedData: apiData.unidadesProyecto.map(unidad => ({
        type: 'Feature' as const,
        geometry: unidad.geometry ? {
          type: unidad.geometry.type as any,
          coordinates: unidad.geometry.coordinates
        } : (unidad.lat && unidad.lng ? {
          type: 'Point' as const,
          coordinates: [unidad.lng, unidad.lat]
        } : null),
        has_geometry: !!(unidad.geometry || (unidad.lat && unidad.lng)),
        geometry_type: unidad.geometry?.type || 'Point',
        properties: {
          // Mapear campos para compatibilidad
          upid: unidad.bpin, // usar bpin como upid si no hay upid
          nombre_up: unidad.name,
          descripcion_intervencion: unidad.descripcion,
          direccion: unidad.direccion,
          comuna_corregimiento: unidad.comuna || unidad.corregimiento,
          barrio_vereda: unidad.barrio || unidad.vereda,
          tipo_intervencion: unidad.tipoIntervencion,
          clase_obra: unidad.claseObra,
          estado: unidad.status,
          avance_obra: unidad.progress / 100, // convertir porcentaje a decimal
          presupuesto_base: unidad.budget,
          fecha_inicio: unidad.startDate,
          fecha_fin: unidad.endDate,
          nombre_centro_gestor: unidad.responsible,
          fuente_financiacion: 'No especificado',
          ano: new Date(unidad.startDate).getFullYear().toString(),
          coordinates: unidad.lat && unidad.lng ? { lat: unidad.lat, lng: unidad.lng } : undefined,
          // Incluir datos originales de la unidad
          ...unidad
        },
        updated_at: new Date().toISOString(),
        id: unidad.id,
        _metadata: {
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString()
        }
      })),
      // Funciones adicionales para compatibilidad
      refresh: () => {
        // La API se actualiza automáticamente, pero podríamos forzar una recarga
        console.log('🔄 Refresh solicitado para API data')
      },
      applyFilters: (newFilters: UnidadProyectoFilters) => {
        console.log('🔍 Filtros aplicados (API mode):', newFilters)
        // En modo API, los filtros se pueden manejar localmente o enviarse al servidor
      }
    }
  } else {
    console.log('💾 Usando datos offline:', {
      loading: offlineData.loading,
      unidades: offlineData.data.length,
      error: offlineData.error
    })
    
    return {
      ...offlineData,
      dataSource: 'offline' as const,
      // El hook offline ya tiene la estructura correcta
    }
  }
}

// Hook para métricas que también es inteligente
export function useUnidadesProyectoMetricsSmart(filters?: UnidadProyectoFilters, forceMode?: 'api' | 'offline') {
  const smartData = useUnidadesProyectoSmart(filters, forceMode)
  
  return {
    metrics: 'metrics' in smartData ? smartData.metrics : null,
    loading: smartData.loading,
    error: smartData.error,
    dataSource: smartData.dataSource,
    isOffline: 'isOffline' in smartData ? smartData.isOffline : false
  }
}

export default useUnidadesProyectoSmart