'use client'

import React, { useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MapLayer } from './UniversalMapCore'
import { ProjectMapData } from './ProjectMapUnified'
import type { GeographicFilters } from './MapLayerFilters'

// Importación dinámica del componente del mapa para evitar problemas de SSR
const UniversalMapCore = dynamic(() => import('./UniversalMapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
      </div>
    </div>
  )
})

export interface ProjectMapCoreProps {
  data: ProjectMapData
  baseMapConfig: {
    name: string
    url: string
    attribution: string
  }
  layerVisibility: Record<string, boolean>
  layerConfigs?: Array<{
    id: string
    name: string
    visible: boolean
    color: string
    opacity: number
    representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
  }>
  onFeatureClick?: (feature: any, layerType: string) => void
  height: string
  theme: string
  geographicFilters?: GeographicFilters
  onMapReady?: (centerFunction: () => void) => void // Nueva prop para centrado automático
}

const ProjectMapCore: React.FC<ProjectMapCoreProps> = ({
  data,
  baseMapConfig,
  layerVisibility,
  layerConfigs,
  onFeatureClick,
  height,
  theme,
  geographicFilters,
  onMapReady
}) => {
  // Función para filtrar features GeoJSON por ubicación geográfica (memoizada)
  const filterGeoJSONByGeography = useCallback((geoJSONData: any, layerId: string) => {
    // Si no se proporcionan filtros geográficos, devolver datos sin filtrar
    if (!geographicFilters || !geoJSONData?.features) {
      return geoJSONData
    }

    const { comunas, barrios, corregimientos } = geographicFilters
    
    // Si no hay filtros activos, devolver todos los datos
    if (comunas.length === 0 && barrios.length === 0 && corregimientos.length === 0) {
      return geoJSONData
    }

    const filteredFeatures = geoJSONData.features.filter((feature: any) => {
      const properties = feature.properties || {}
      
      // Para equipamientos y vías, filtrar por comuna/barrio si tiene esas propiedades
      if (layerId === 'equipamientos' || layerId === 'infraestructura_vial') {
        // Buscar propiedades de comuna
        const featureComunaId = properties.comuna_id || properties.comuna || properties.COMUNA
        const featureComunaNombre = properties.comuna_nombre || properties.nombre_comuna || properties.NOMCOMUNA
        
        // Buscar propiedades de barrio
        const featureBarrio = properties.barrio || properties.nombre_barrio || properties.NOMBARRIO || properties.BARRIO
        
        // Filtrar por comunas si están especificadas
        if (comunas.length > 0) {
          const matchesComunaId = featureComunaId && comunas.some(c => c.includes(featureComunaId.toString()))
          const matchesComunaNombre = featureComunaNombre && comunas.includes(featureComunaNombre)
          
          if (!matchesComunaId && !matchesComunaNombre) {
            return false
          }
        }
        
        // Filtrar por barrios si están especificados
        if (barrios.length > 0 && featureBarrio) {
          if (!barrios.includes(featureBarrio)) {
            return false
          }
        }
      }
      
      // Para corregimientos (si el layer tiene esa información)
      if (corregimientos.length > 0) {
        const featureCorregimiento = properties.corregimiento || properties.nombre_corregimiento || properties.CORREGIMIENTO
        if (featureCorregimiento && !corregimientos.includes(featureCorregimiento)) {
          return false
        }
      }
      
      return true
    })

    return {
      ...geoJSONData,
      features: filteredFeatures
    }
  }, [geographicFilters])

  // Función para filtrar unidades de proyecto por ubicación geográfica (memoizada)
  const filterUnidadesByGeography = useCallback((unidades: any[] | undefined) => {
    // Si no se proporcionan filtros geográficos o no hay unidades, devolver datos sin filtrar
    if (!geographicFilters || !Array.isArray(unidades)) {
      return unidades || []
    }

    const { comunas, barrios, corregimientos } = geographicFilters
    
    // Si no hay filtros activos, devolver todas las unidades
    if (comunas.length === 0 && barrios.length === 0 && corregimientos.length === 0) {
      return unidades
    }

    return unidades.filter((unidad: any) => {
      // Buscar propiedades de comuna
      const unidadComuna = unidad.comuna || unidad.nombre_comuna || unidad.comuna_nombre
      
      // Buscar propiedades de barrio
      const unidadBarrio = unidad.barrio || unidad.nombre_barrio || unidad.barrio_nombre
      
      // Buscar propiedades de corregimiento
      const unidadCorregimiento = unidad.corregimiento || unidad.nombre_corregimiento
      
      // Filtrar por comunas
      if (comunas.length > 0 && unidadComuna) {
        if (!comunas.includes(unidadComuna)) {
          return false
        }
      }
      
      // Filtrar por barrios
      if (barrios.length > 0 && unidadBarrio) {
        if (!barrios.includes(unidadBarrio)) {
          return false
        }
      }
      
      // Filtrar por corregimientos
      if (corregimientos.length > 0 && unidadCorregimiento) {
        if (!corregimientos.includes(unidadCorregimiento)) {
          return false
        }
      }
      
      return true
    })
  }, [geographicFilters])

  // Convertir datos a formato de capas unificado con filtros aplicados
  const layers: MapLayer[] = useMemo(() => {
    const mapLayers: MapLayer[] = []

    // ❌ COMENTADO: Eliminar duplicación de unidades de proyecto como puntos
    // Los datos ahora vienen únicamente desde allGeoJSONData como GeoJSON
    // if (data.unidadesProyecto && data.unidadesProyecto.length > 0) {
    //   const filteredUnidades = filterUnidadesByGeography(
    //     data.unidadesProyecto.filter(p => p.lat && p.lng)
    //   )
    //   
    //   const colors = getLayerColors('unidades_proyecto')
    //   
    //   mapLayers.push({
    //     id: 'unidades_proyecto',
    //     name: 'Unidades de Proyecto',
    //     data: filteredUnidades,
    //     visible: true,
    //     type: 'points',
    //     pointStyle: {
    //       radius: 6,
    //       fillColor: colors.fill,
    //       color: colors.stroke,
    //       weight: 2,
    //       opacity: 1,
    //       fillOpacity: 0.8
    //     }
    //   })
    // }

    // Agregar capas dinámicamente para cada archivo GeoJSON cargado (filtradas)
    Object.entries(data.allGeoJSONData).forEach(([fileName, geoJSONData]) => {
      if (geoJSONData) {
        const displayName = fileName === 'infraestructura_vial' ? 'Infraestructura Vial' : 
                          fileName === 'equipamientos' ? 'Equipamientos' : 
                          fileName.charAt(0).toUpperCase() + fileName.slice(1)
        
        // Aplicar filtros geográficos
        const filteredGeoJSON = filterGeoJSONByGeography(geoJSONData, fileName)
        
        // Colores por defecto según el tipo de capa
        const getDefaultColors = (layerId: string) => {
          const defaultColors: Record<string, { fill: string, stroke: string }> = {
            unidades_proyecto: { fill: '#3B82F6', stroke: '#1D4ED8' },
            equipamientos: { fill: '#10B981', stroke: '#059669' },
            infraestructura_vial: { fill: '#F59E0B', stroke: '#D97706' }
          }
          return defaultColors[layerId] || { fill: '#6B7280', stroke: '#374151' }
        }
        
        const colors = getDefaultColors(fileName)
        
        mapLayers.push({
          id: fileName,
          name: displayName,
          data: filteredGeoJSON,
          visible: layerVisibility[fileName] === true, // Más explícito
          type: 'geojson',
          style: {
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
            color: colors.stroke,
            fillColor: colors.fill
          }
        })
      }
    })

    console.log(`🗺️ Capas construidas para el mapa (con filtros):`, mapLayers.map(l => ({ 
      id: l.id, 
      name: l.name, 
      features: l.data?.features?.length || l.data?.length || 0,
      visible: l.visible,
      layerVisibilityState: layerVisibility[l.id],
      rawLayerVisibility: layerVisibility
    })))
    
    console.log('🔍 Estado completo de layerVisibility:', layerVisibility)
    
    return mapLayers
  }, [data, layerVisibility, filterGeoJSONByGeography, filterUnidadesByGeography])

  // Función adaptadora para onFeatureClick
  const handleFeatureClick = useCallback((feature: any, layer: any) => {
    if (onFeatureClick) {
      onFeatureClick(feature, layer.options?.layerId || layer.id || 'unknown')
    }
  }, [onFeatureClick])

  return (
    <UniversalMapCore
      layers={layers}
      baseMapUrl={baseMapConfig.url}
      baseMapAttribution={baseMapConfig.attribution}
      height={height}
      theme={theme}
      enableFullscreen={true}
      enableCenterView={true}
      enableLayerControls={false} // Las usa el componente padre
      onFeatureClick={handleFeatureClick}
      onMapReady={onMapReady}
    />
  )
}

export default ProjectMapCore
