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
        
        // Archivos GeoJSON eliminados - no cargar datos
        console.log('🔥 DIRECT: GeoJSON files removed - returning empty data')

        // Return empty arrays since GeoJSON files don't exist
        const equipamientosUnidades: UnidadProyecto[] = []
        const infraestructuraUnidades: UnidadProyecto[] = []
        const allUnidades = [...equipamientosUnidades, ...infraestructuraUnidades]

        console.log('🔥 DIRECT: GeoJSON files eliminated, returning empty data')

        setMapData({
          loading: false,
          error: null,
          unidadesProyecto: allUnidades,
          allGeoJSONData: {}
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
