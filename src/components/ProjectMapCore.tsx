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
  layerVisibility: {
    equipamientos: boolean
    infraestructura: boolean
  }
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
    if (layerVisibility.equipamientos && data.unidadesProyecto && data.unidadesProyecto.length > 0) {
      mapLayers.push({
        id: 'equipamientos',
        name: 'Equipamientos',
        data: data.unidadesProyecto.filter(p => p.lat && p.lng),
        visible: true,
        type: 'points'
      })
    }

    // Capa de infraestructura/vías
    if (data.infraestructura && layerVisibility.infraestructura) {
      mapLayers.push({
        id: 'infraestructura',
        name: 'Vías',
        data: data.infraestructura,
        visible: true,
        type: 'geojson'
      })
    }

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
