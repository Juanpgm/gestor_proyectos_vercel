'use client'

import { useState } from 'react'
import type { UnidadProyecto } from './useUnidadesProyecto'

// Direct data loading without useEffect
export function useDirectDataLoader() {
  const [hasStarted, setHasStarted] = useState(false)
  const [mapData, setMapData] = useState({
    loading: true,
    error: null,
    unidadesProyecto: [] as UnidadProyecto[],
    allGeoJSONData: {}
  })

  // Check if we're on client and can start loading
  const isClient = typeof window !== 'undefined'
  
  console.log('🔥 DIRECT: Hook called, isClient:', isClient, 'hasStarted:', hasStarted)
  
  // Only start loading once we're on client and haven't started yet
  if (isClient && !hasStarted) {
    console.log('🔥 DIRECT: Starting load immediately...')
    setHasStarted(true)
    
    // Load data immediately using Promise
    const loadData = async () => {
      try {
        console.log('🔥 DIRECT: Fetching data...')
        
        const equipamientosResponse = await fetch('/data/geodata/unidades_proyecto/equipamientos.geojson')
        const equipamientosData = await equipamientosResponse.json()
        
        const infraResponse = await fetch('/data/geodata/unidades_proyecto/infraestructura_vial.geojson')
        const infraData = await infraResponse.json()

        console.log('🔥 DIRECT: Data loaded successfully!')
        console.log('🔥 DIRECT: Equipamientos features:', equipamientosData.features?.length || 0)
        console.log('🔥 DIRECT: Infraestructura features:', infraData.features?.length || 0)

        // Convert GeoJSON features to UnidadProyecto objects
        const equipamientosUnidades: UnidadProyecto[] = equipamientosData.features?.map((feature: any) => ({
          id: feature.properties?.id || feature.properties?.ID || `equip_${Math.random()}`,
          name: feature.properties?.name || feature.properties?.NOMBRE || 'Equipamiento',
          bpin: feature.properties?.bpin || feature.properties?.BPIN || '',
          description: feature.properties?.description || feature.properties?.DESCRIPCION || '',
          status: feature.properties?.status || feature.properties?.ESTADO || 'activo',
          responsible: feature.properties?.responsible || feature.properties?.RESPONSABLE || '',
          comuna: feature.properties?.comuna || feature.properties?.COMUNA || '',
          barrio: feature.properties?.barrio || feature.properties?.BARRIO || '',
          corregimiento: feature.properties?.corregimiento || feature.properties?.CORREGIMIENTO || '',
          vereda: feature.properties?.vereda || feature.properties?.VEREDA || '',
          tipoIntervencion: feature.properties?.tipo_intervencion || feature.properties?.TIPO_INTERVENCION || 'Equipamiento',
          claseObra: feature.properties?.clase_obra || feature.properties?.CLASE_OBRA || '',
          descripcion: feature.properties?.descripcion || feature.properties?.DESCRIPCION || '',
          presupuesto: feature.properties?.presupuesto || feature.properties?.PRESUPUESTO || 0,
          avance: feature.properties?.avance || feature.properties?.AVANCE || 0,
          fechaInicio: feature.properties?.fecha_inicio || feature.properties?.FECHA_INICIO || '',
          fechaFin: feature.properties?.fecha_fin || feature.properties?.FECHA_FIN || '',
          geometry: feature.geometry,
          properties: feature.properties
        })) || []

        const infraUnidades: UnidadProyecto[] = infraData.features?.map((feature: any) => ({
          id: feature.properties?.id || feature.properties?.ID || `infra_${Math.random()}`,
          name: feature.properties?.name || feature.properties?.NOMBRE || 'Infraestructura Vial',
          bpin: feature.properties?.bpin || feature.properties?.BPIN || '',
          description: feature.properties?.description || feature.properties?.DESCRIPCION || '',
          status: feature.properties?.status || feature.properties?.ESTADO || 'activo',
          responsible: feature.properties?.responsible || feature.properties?.RESPONSABLE || '',
          comuna: feature.properties?.comuna || feature.properties?.COMUNA || '',
          barrio: feature.properties?.barrio || feature.properties?.BARRIO || '',
          corregimiento: feature.properties?.corregimiento || feature.properties?.CORREGIMIENTO || '',
          vereda: feature.properties?.vereda || feature.properties?.VEREDA || '',
          tipoIntervencion: feature.properties?.tipo_intervencion || feature.properties?.TIPO_INTERVENCION || 'Infraestructura Vial',
          claseObra: feature.properties?.clase_obra || feature.properties?.CLASE_OBRA || '',
          descripcion: feature.properties?.descripcion || feature.properties?.DESCRIPCION || '',
          presupuesto: feature.properties?.presupuesto || feature.properties?.PRESUPUESTO || 0,
          avance: feature.properties?.avance || feature.properties?.AVANCE || 0,
          fechaInicio: feature.properties?.fecha_inicio || feature.properties?.FECHA_INICIO || '',
          fechaFin: feature.properties?.fecha_fin || feature.properties?.FECHA_FIN || '',
          geometry: feature.geometry,
          properties: feature.properties
        })) || []

        const allUnidades = [...equipamientosUnidades, ...infraUnidades]

        console.log('🔥 DIRECT: Converted to UnidadProyecto objects:', allUnidades.length)

        setMapData({
          loading: false,
          error: null,
          unidadesProyecto: allUnidades,
          allGeoJSONData: {
            equipamientos: equipamientosData,
            infraestructura_vial: infraData
          }
        })
      } catch (error: any) {
        console.error('🔥 DIRECT: Error loading data:', error)
        setMapData({
          loading: false,
          error: error.message,
          unidadesProyecto: [],
          allGeoJSONData: {}
        })
      }
    }
    
    // Execute the load function
    loadData()
  }

  return mapData
}
