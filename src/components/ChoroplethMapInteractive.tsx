'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'
import { loadMultipleGeoJSON } from '@/utils/geoJSONLoader'
import { MapLayer } from './UniversalMapCore'
import 'leaflet/dist/leaflet.css'

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

export interface ChoroplethMapProps {
  className?: string
  height?: string
  showControls?: boolean
  defaultLayer?: 'comunas' | 'barrios'
}

const ChoroplethMapInteractive: React.FC<ChoroplethMapProps> = ({
  className = '',
  height = '500px',
  showControls = true,
  defaultLayer = 'comunas'
}) => {
  const { theme } = useTheme()
  const [geoData, setGeoData] = useState<{ comunas: any; barrios: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState<'comunas' | 'barrios'>(defaultLayer)
  
  // Obtener datos de proyectos
  const unidadesState = useUnidadesProyecto()
  const projectsData = unidadesState.unidadesProyecto || []
  const projectsLoading = unidadesState.loading

  // URLs de tiles base según el tema
  const baseMapUrl = useMemo(() => {
    return theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
  }, [theme])

  const baseMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

  // Cargar datos GeoJSON
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        setLoading(true)
        // Usar nombres de archivos en lugar de rutas completas
        const fileNames = ['comunas', 'barrios']
        
        const loadedData = await loadMultipleGeoJSON(fileNames)
        setGeoData({
          comunas: loadedData.comunas,
          barrios: loadedData.barrios
        })
        console.log('✅ Datos GeoJSON cargados exitosamente en ChoroplethMap')
        console.log('📊 Comunas features:', loadedData.comunas?.features?.length || 0)
        console.log('📊 Barrios features:', loadedData.barrios?.features?.length || 0)
      } catch (error) {
        console.error('❌ Error cargando datos GeoJSON:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGeoData()
  }, [])

  // Convertir datos a capas unificadas
  const layers: MapLayer[] = useMemo(() => {
    if (!geoData) return []
    
    const mapLayers: MapLayer[] = []
    
    // Capa de comunas
    if (geoData.comunas && activeLayer === 'comunas') {
      mapLayers.push({
        id: 'comunas',
        name: 'Comunas',
        data: geoData.comunas,
        visible: true,
        type: 'geojson',
        style: {
          fillColor: theme === 'dark' ? '#3B82F6' : '#2563EB',
          weight: 2,
          opacity: 1,
          color: theme === 'dark' ? '#60A5FA' : '#1D4ED8',
          fillOpacity: 0.6
        }
      })
    }
    
    // Capa de barrios
    if (geoData.barrios && activeLayer === 'barrios') {
      mapLayers.push({
        id: 'barrios',
        name: 'Barrios',
        data: geoData.barrios,
        visible: true,
        type: 'geojson',
        style: {
          fillColor: theme === 'dark' ? '#10B981' : '#059669',
          weight: 2,
          opacity: 1,
          color: theme === 'dark' ? '#34D399' : '#047857',
          fillOpacity: 0.6
        }
      })
    }
    
    return mapLayers
  }, [geoData, activeLayer, theme])

  if (loading || projectsLoading) {
    return (
      <div className={`${className} relative overflow-hidden rounded-lg border bg-card`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando mapa coroplético...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-lg border bg-card`} style={{ height }}>
      {showControls && (
        <div className="absolute top-4 left-4 z-[1000] flex gap-2">
          <motion.button
            onClick={() => setActiveLayer('comunas')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeLayer === 'comunas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/80 hover:bg-background border'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Comunas
          </motion.button>
          <motion.button
            onClick={() => setActiveLayer('barrios')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeLayer === 'barrios'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/80 hover:bg-background border'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Barrios
          </motion.button>
        </div>
      )}
      
      <UniversalMapCore
        layers={layers}
        height={height}
        enableFullscreen={true}
        enableCenterView={true}
        baseMapUrl={baseMapUrl}
        baseMapAttribution={baseMapAttribution}
        theme={theme}
      />
    </div>
  )
}

export default ChoroplethMapInteractive
