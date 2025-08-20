'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Map, Layers, ChevronDown, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'

// Importación dinámica del nuevo componente simplificado
const SimpleMap = dynamic(
  () => import('./SimpleMap'),
  { ssr: false }
)

interface MapComponentProps {
  className?: string
}

// Mapas base disponibles
const baseMaps = {
  openstreet: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  light: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  voyager: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  }
}

const MapComponent: React.FC<MapComponentProps> = ({ className = '' }) => {
  const [isClient, setIsClient] = useState(false)
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('light')
  const [isBaseMapDropdownOpen, setIsBaseMapDropdownOpen] = useState(false)
  
  const baseMapDropdownRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  
  // Hook para cargar datos
  const { equipamientos, infraestructura, unidadesProyecto, loading, error } = useUnidadesProyecto()
  
  // Configurar tema
  const isDarkMode = theme === 'dark' || (theme === 'system' && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setSelectedBaseMap(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (baseMapDropdownRef.current && !baseMapDropdownRef.current.contains(event.target as Node)) {
        setIsBaseMapDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debug logs
  useEffect(() => {
    console.log('📊 MapComponent - Estado:', {
      loading,
      error,
      equipamientos: equipamientos ? `${equipamientos.features?.length || 0} features` : 'null',
      infraestructura: infraestructura ? `${infraestructura.features?.length || 0} features` : 'null',
      unidadesProyecto: unidadesProyecto.length
    })
  }, [equipamientos, infraestructura, unidadesProyecto, loading, error])

  if (!isClient) {
    return (
      <div className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Map className="w-5 h-5 mr-2 text-blue-600" />
            Mapa de Unidades de Proyecto
          </h2>
        </div>
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Inicializando...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-6 pb-0">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            Mapa de Unidades de Proyecto
          </h3>
          <Map className="text-cali-green w-5 h-5" />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? (
            <span className="flex items-center">
              <div className="w-4 h-4 mr-2 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Cargando datos...
            </span>
          ) : error ? (
            <span className="text-red-500">Error: {error}</span>
          ) : (
            `${unidadesProyecto.length} unidades de proyecto disponibles`
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4 mx-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Mapa Base Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapa Base:</span>
          <div className="relative" ref={baseMapDropdownRef}>
            <button
              onClick={() => setIsBaseMapDropdownOpen(!isBaseMapDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 min-w-[140px]"
            >
              <span className="text-sm">
                {baseMaps[selectedBaseMap as keyof typeof baseMaps]?.name || 'Seleccionar'}
              </span>
              <ChevronDown 
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isBaseMapDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isBaseMapDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
              >
                <div className="p-2 space-y-1">
                  {Object.entries(baseMaps).map(([key, baseMap]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedBaseMap(key)
                        setIsBaseMapDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {baseMap.name}
                      </span>
                      {selectedBaseMap === key && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            📍 Equipamientos: {equipamientos?.features?.length || 0}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            🛣️ Infraestructura: {infraestructura?.features?.length || 0}
          </span>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="px-6 pb-6">
        <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
          {equipamientos || infraestructura ? (
            <SimpleMap
              center={[3.4516, -76.5320]}
              zoom={11}
              tileLayerUrl={baseMaps[selectedBaseMap as keyof typeof baseMaps]?.url || baseMaps.light.url}
              tileLayerAttribution={baseMaps[selectedBaseMap as keyof typeof baseMaps]?.attribution || baseMaps.light.attribution}
              equipamientos={equipamientos}
              infraestructura={infraestructura}
            />
          ) : loading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500">Cargando datos GeoJSON...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-red-500">⚠️</div>
                <p className="text-sm text-red-500">Error: {error}</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">No hay datos disponibles</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Leyenda */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Leyenda
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de Intervención:
              </h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Construcción</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Mejoramiento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Rehabilitación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Mantenimiento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Adecuación</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clases de Obra:
              </h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Infraestructura Educativa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Infraestructura Deportiva</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Infraestructura Vial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Infraestructura Social</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MapComponent