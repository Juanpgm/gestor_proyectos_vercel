'use client'

import { useState, useEffect } from 'react'
import type { UnidadProyecto } from './useUnidadesProyecto'

// Simple data loading that works around hydration issues
export function useMapDataFix() {
  const [mapData, setMapData] = useState({
    loading: true,
    error: null,
    unidadesProyecto: [] as UnidadProyecto[],
    allGeoJSONData: {}
  })

  // Force client-side execution
  useEffect(() => {
    // Use a different approach - check if DOM is ready
    if (typeof document === 'undefined') return

    console.log('🔧 FIX: GeoJSON files eliminated - returning empty data')
    
    const loadData = async () => {
      try {
        // GeoJSON files eliminados - retornando datos vacíos
        console.log('🔧 FIX: Returning empty data arrays')

        setMapData({
          loading: false,
          error: null,
          unidadesProyecto: [],
          allGeoJSONData: {}
        })
      } catch (error: any) {
        console.error('🔧 FIX: Error loading data:', error)
        setMapData({
          loading: false,
          error: error.message,
          unidadesProyecto: [],
          allGeoJSONData: {}
        })
      }
    }

    // Try different timing strategies
    if (document.readyState === 'complete') {
      loadData()
    } else {
      const timer = setTimeout(loadData, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  return mapData
}
