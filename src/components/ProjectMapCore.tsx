'use client'

import React, { useMemo } from 'react'
import UniversalMapCore, { MapLayer } from './UniversalMapCore'
import { ProjectMapData } from './ProjectMapUnified'

export interface ProjectMapCoreProps {
  data: ProjectMapData
  baseMapConfig: {
    name: string
    url: string
    attribution: string
  }
  layerVisibility: Record<string, boolean>
  height: string
  theme: string
}

const ProjectMapCore: React.FC<ProjectMapCoreProps> = ({
  data,
  baseMapConfig,
  layerVisibility,
  height,
  theme
}) => {
  // Convertir datos a formato de capas unificado
  const layers: MapLayer[] = useMemo(() => {
    const mapLayers: MapLayer[] = []

    // Capa de equipamientos como puntos (unidades de proyecto)
    if (data.unidadesProyecto && data.unidadesProyecto.length > 0) {
      mapLayers.push({
        id: 'unidades_proyecto',
        name: 'Unidades de Proyecto',
        data: data.unidadesProyecto.filter(p => p.lat && p.lng),
        visible: true,
        type: 'points'
      })
    }

    // Agregar capas dinámicamente para cada archivo GeoJSON cargado
    Object.entries(data.allGeoJSONData).forEach(([fileName, geoJSONData]) => {
      if (geoJSONData) {
        const displayName = fileName === 'infraestructura_vial' ? 'Infraestructura Vial' : 
                          fileName === 'equipamientos' ? 'Equipamientos GeoJSON' : 
                          fileName.charAt(0).toUpperCase() + fileName.slice(1)
        
        mapLayers.push({
          id: fileName,
          name: displayName,
          data: geoJSONData,
          visible: layerVisibility[fileName] !== false, // Visible por defecto
          type: 'geojson'
        })
      }
    })

    console.log(`🗺️ Capas construidas para el mapa:`, mapLayers.map(l => ({ id: l.id, name: l.name, features: l.data?.features?.length || l.data?.length || 0 })))
    return mapLayers
  }, [data, layerVisibility])

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
    />
  )
}

export default ProjectMapCore
