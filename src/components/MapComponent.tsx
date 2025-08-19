'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Map, Layers, Navigation, ZoomIn, ZoomOut, RotateCcw, ChevronDown, Check } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'

// Componente de mapa dinámico sin SSR
const DynamicMap = dynamic(
  () => import('./DynamicMapContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Cargando mapa...</p>
        </div>
      </div>
    )
  }
)

interface MapComponentProps {
  className?: string
}

interface ProjectMarker {
  id: string
  name: string
  lat: number
  lng: number
  status: string
  budget: number
  progress: number
  community: string
  neighborhood: string
}

// Definición de categorías específicas para unidades de proyecto
type ProjectCategoryType = 'tipoIntervencion' | 'claseObra'

const projectCategories: Record<ProjectCategoryType, { label: string; color: string }> = {
  tipoIntervencion: { label: 'Tipo de Intervención', color: '#3B82F6' },
  claseObra: { label: 'Clase Obra', color: '#10B981' }
}

// Mapas base disponibles
const baseMaps = {
  openstreet: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 18
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  },
  light: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  },
  positron: {
    name: 'Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  },
  voyager: {
    name: 'Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 18
  },
  outdoors: {
    name: 'Exterior',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17
  }
}

const MapComponent: React.FC<MapComponentProps> = ({ className = '' }) => {
  const [isClient, setIsClient] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState('satelite')
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.4516, -76.5320])
  const [zoom, setZoom] = useState(12)
  
  // Estados para los nuevos controles
  const [selectedCategories, setSelectedCategories] = useState<ProjectCategoryType[]>(['tipoIntervencion'])
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('light')
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false)
  const [isBaseMapDropdownOpen, setIsBaseMapDropdownOpen] = useState(false)
  
  // Referencias para los dropdowns
  const categoriesDropdownRef = useRef<HTMLDivElement>(null)
  const baseMapDropdownRef = useRef<HTMLDivElement>(null)
  
  // Hook del tema
  const { theme } = useTheme()
  
  // Calculate if dark mode is active
  const isDarkMode = theme === 'dark' || (theme === 'system' && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Efecto para cambiar el mapa base según el tema
  useEffect(() => {
    if (isDarkMode) {
      setSelectedBaseMap('dark')
    } else {
      setSelectedBaseMap('light') // Mapa claro específico
    }
  }, [isDarkMode])

  // Datos de proyectos para el mapa
  const projectMarkers: ProjectMarker[] = [
    {
      id: '1',
      name: 'Mejoramiento de Vías Comuna 15',
      lat: 3.4516,
      lng: -76.5320,
      status: 'active',
      budget: 2500000000,
      progress: 65,
      community: 'Comuna 15',
      neighborhood: 'Aguablanca'
    },
    {
      id: '2',
      name: 'Construcción Parque Infantil',
      lat: 3.4580,
      lng: -76.5180,
      status: 'completed',
      budget: 850000000,
      progress: 100,
      community: 'Comuna 8',
      neighborhood: 'Villa del Lago'
    },
    {
      id: '3',
      name: 'Centro de Salud Comunitario',
      lat: 3.4420,
      lng: -76.5420,
      status: 'planned',
      budget: 4200000000,
      progress: 15,
      community: 'Comuna 12',
      neighborhood: 'Llano Verde'
    },
    {
      id: '4',
      name: 'Biblioteca Pública Digital',
      lat: 3.4650,
      lng: -76.5250,
      status: 'active',
      budget: 1800000000,
      progress: 40,
      community: 'Comuna 5',
      neighborhood: 'Centro'
    },
    {
      id: '5',
      name: 'Polideportivo Municipal',
      lat: 3.4380,
      lng: -76.5480,
      status: 'suspended',
      budget: 3200000000,
      progress: 25,
      community: 'Comuna 18',
      neighborhood: 'Cañaveralejo'
    }
  ]

  // Funciones para manejar los dropdowns
  const toggleCategory = (category: ProjectCategoryType) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  // Efecto para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesDropdownRef.current && !categoriesDropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesDropdownOpen(false)
      }
      if (baseMapDropdownRef.current && !baseMapDropdownRef.current.contains(event.target as Node)) {
        setIsBaseMapDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(markerId)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1))
  }

  const handleResetView = () => {
    setMapCenter([3.4516, -76.5320])
    setZoom(12)
    setSelectedMarker(null)
  }

  if (!isClient) {
    return (
      <div className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Map className="w-5 h-5 mr-2 text-blue-600" />
              Mapa de Unidades de Proyecto
            </h2>
          </div>
        </div>
        <div className="p-6">
          <div className="h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <Map className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Cargando mapa...</p>
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
          <h3 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
            Mapa de Unidades de Proyecto
          </h3>
          <Map className="text-cali-green w-5 h-5" />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {projectMarkers.length} proyectos disponibles
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4 mx-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* Category Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categorías:</span>
          <div className="relative categories-dropdown-container" ref={categoriesDropdownRef}>
            <button
              onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 min-w-[140px]"
            >
              <span className="text-sm">
                {selectedCategories.length === 0 
                  ? 'Seleccionar'
                  : projectCategories[selectedCategories[0]].label
                }
              </span>
              <ChevronDown 
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isCategoriesDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isCategoriesDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[9999]"
              >
                <div className="p-2 space-y-1">
                  {(Object.keys(projectCategories) as ProjectCategoryType[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: projectCategories[category].color }}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {projectCategories[category].label}
                        </span>
                      </div>
                      {selectedCategories.includes(category) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Base Map Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapa Base:</span>
          <div className="relative basemap-dropdown-container" ref={baseMapDropdownRef}>
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
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[9999]"
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
      </div>
      
      {/* Map */}
      <div className="px-6 pb-6">
        <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 transition-colors duration-300 shadow-inner">
          <DynamicMap
            markers={projectMarkers}
            center={mapCenter}
            zoom={zoom}
            selectedMarker={selectedMarker}
            onMarkerClick={handleMarkerClick}
            tileLayerUrl={baseMaps[selectedBaseMap as keyof typeof baseMaps]?.url}
            tileLayerAttribution={baseMaps[selectedBaseMap as keyof typeof baseMaps]?.attribution}
          />
        </div>
        
        {/* Leyenda actualizada con las nuevas categorías */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Leyenda - {selectedCategories.length > 0 ? projectCategories[selectedCategories[0]].label : 'Estado de Proyectos'}
          </h3>
          
          {selectedCategories.includes('tipoIntervencion') && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Tipos de Intervención (valores de prueba):</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Construcción</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Mejoramiento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Rehabilitación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Mantenimiento</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedCategories.includes('claseObra') && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Clase Obra (valores de prueba):</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Infraestructura Vial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Equipamiento Social</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Servicios Públicos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Espacio Público</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Vivienda</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Medio Ambiente</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedCategories.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">En Ejecución</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Completado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Planificado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-300">Suspendido</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MapComponent