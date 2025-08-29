'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronDown, Filter, X, Globe } from 'lucide-react'
import { loadGeoJSON } from '@/utils/geoJSONLoader'

interface MapLayerFiltersProps {
  onFilterChange: (filters: GeographicFilters) => void
  className?: string
}

export interface GeographicFilters {
  comunas: string[]
  barrios: string[]
  corregimientos: string[]
}

interface ComunaBarrioData {
  comunas: Array<{
    nombre: string
    barrios: string[]
  }>
  barrios: string[]
}

const MapLayerFilters: React.FC<MapLayerFiltersProps> = ({
  onFilterChange,
  className = ''
}) => {
  // Estados
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<GeographicFilters>({
    comunas: [],
    barrios: [],
    corregimientos: []
  })
  const [comunasBarriosData, setComunasBarriosData] = useState<ComunaBarrioData>({
    comunas: [],
    barrios: []
  })
  const [corregimientosData, setCorregimientosData] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Cargar datos geográficos
  useEffect(() => {
    const loadGeographicData = async () => {
      try {
        setLoading(true)
        
        const [comunasGeoJSON, barriosGeoJSON, corregimientosGeoJSON] = await Promise.all([
          loadGeoJSON('cartografia_base/comunas'),
          loadGeoJSON('cartografia_base/barrios'),
          // Manejo de corregimientos con fallback
          loadGeoJSON('cartografia_base/corregimientos').catch(() => {
            console.warn('⚠️ Archivo corregimientos.geojson no encontrado, usando datos mock')
            return null
          })
        ])

        // Procesar datos de comunas y barrios
        const comunasMap = new Map<string, Set<string>>()
        const todasLasComunas = new Set<string>()
        const todosLosBarrios = new Set<string>()

        // Procesar comunas desde cartografia_base/comunas.geojson
        if (comunasGeoJSON?.features) {
          comunasGeoJSON.features.forEach((feature: any) => {
            const nombre = feature.properties?.nombre || `Comuna ${feature.properties?.comuna || 'Sin nombre'}`
            todasLasComunas.add(nombre)
            if (!comunasMap.has(nombre)) {
              comunasMap.set(nombre, new Set())
            }
          })
        }

        // Procesar barrios desde cartografia_base/barrios.geojson
        if (barriosGeoJSON?.features) {
          barriosGeoJSON.features.forEach((feature: any) => {
            const barrio = feature.properties?.nombre || feature.properties?.barrio || feature.properties?.NOMBRE
            
            if (barrio) {
              todosLosBarrios.add(barrio)
              
              // Para asociar barrios con comunas, necesitamos un método más sofisticado
              // Ya que los datos no tienen relación directa en las propiedades
              // Por ahora, agregamos todos los barrios como disponibles para todas las comunas
              todasLasComunas.forEach(comuna => {
                comunasMap.get(comuna)?.add(barrio)
              })
            }
          })
        }

        // Convertir a estructura final
        const comunasData = Array.from(todasLasComunas).map(comuna => ({
          nombre: comuna,
          barrios: Array.from(comunasMap.get(comuna) || []).sort()
        })).sort((a, b) => a.nombre.localeCompare(b.nombre))

        setComunasBarriosData({
          comunas: comunasData,
          barrios: Array.from(todosLosBarrios).sort()
        })

        // Procesar corregimientos desde cartografia_base/corregimientos.geojson
        const corregimientos = new Set<string>()
        if (corregimientosGeoJSON?.features) {
          corregimientosGeoJSON.features.forEach((feature: any) => {
            const nombre = feature.properties?.corregimie || 
                          feature.properties?.nombre || 
                          feature.properties?.NOMBRE ||
                          feature.properties?.corregimiento
            if (nombre) {
              corregimientos.add(nombre)
            }
          })
        } else {
          // Datos mock para corregimientos si el archivo no está disponible
          const mockCorregimientos = [
            'La Buitrera', 'El Hormiguero', 'Golondrinas',
            'La Castilla', 'Los Andes', 'Villa Carmelo',
            'Montebello', 'La Elvira', 'El Saladito'
          ]
          mockCorregimientos.forEach(corr => corregimientos.add(corr))
          console.log('📍 Usando datos mock para corregimientos')
        }

        setCorregimientosData(Array.from(corregimientos).sort())
        
      } catch (error) {
        console.error('Error cargando datos geográficos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGeographicData()
  }, [])

  // Obtener barrios disponibles según comunas seleccionadas
  const availableBarrios = useMemo(() => {
    if (filters.comunas.length === 0) {
      return comunasBarriosData.barrios
    }
    
    const barriosSet = new Set<string>()
    filters.comunas.forEach(comuna => {
      const comunaData = comunasBarriosData.comunas.find(c => c.nombre === comuna)
      if (comunaData) {
        comunaData.barrios.forEach(barrio => barriosSet.add(barrio))
      }
    })
    
    return Array.from(barriosSet).sort()
  }, [filters.comunas, comunasBarriosData])

  // Actualizar filtros
  const updateFilters = (newFilters: Partial<GeographicFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  // Manejar cambios en comunas
  const handleComunaChange = (comuna: string, checked: boolean) => {
    let newComunas: string[]
    let newBarrios = filters.barrios

    if (checked) {
      newComunas = [...filters.comunas, comuna]
    } else {
      newComunas = filters.comunas.filter(c => c !== comuna)
      
      // Filtrar barrios que ya no son válidos
      const comunaData = comunasBarriosData.comunas.find(c => c.nombre === comuna)
      if (comunaData) {
        newBarrios = filters.barrios.filter(b => !comunaData.barrios.includes(b))
      }
    }

    updateFilters({ comunas: newComunas, barrios: newBarrios })
  }

  // Manejar cambios en barrios
  const handleBarrioChange = (barrio: string, checked: boolean) => {
    const newBarrios = checked
      ? [...filters.barrios, barrio]
      : filters.barrios.filter(b => b !== barrio)
    
    updateFilters({ barrios: newBarrios })
  }

  // Manejar cambios en corregimientos
  const handleCorregimientoChange = (corregimiento: string, checked: boolean) => {
    const newCorregimientos = checked
      ? [...filters.corregimientos, corregimiento]
      : filters.corregimientos.filter(c => c !== corregimiento)
    
    updateFilters({ corregimientos: newCorregimientos })
  }

  // Limpiar filtros
  const clearFilters = () => {
    const emptyFilters = { comunas: [], barrios: [], corregimientos: [] }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
    setOpenDropdown(null)
  }

  // Contar filtros activos
  const activeFiltersCount = filters.comunas.length + filters.barrios.length + filters.corregimientos.length

  if (loading) {
    return (
      <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Cargando filtros...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Filtros Geográficos
            </span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearFilters()
                }}
                className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Limpiar
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* Comunas */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'comunas' ? null : 'comunas')}
                  className="flex items-center justify-between w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                >
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Comunas {filters.comunas.length > 0 && `(${filters.comunas.length})`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${openDropdown === 'comunas' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'comunas' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {comunasBarriosData.comunas.map(comuna => (
                        <label key={comuna.nombre} className="flex items-center space-x-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.comunas.includes(comuna.nombre)}
                            onChange={(e) => handleComunaChange(comuna.nombre, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{comuna.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Barrios */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'barrios' ? null : 'barrios')}
                  className="flex items-center justify-between w-full px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                >
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Barrios {filters.barrios.length > 0 && `(${filters.barrios.length})`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${openDropdown === 'barrios' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'barrios' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {availableBarrios.map(barrio => (
                        <label key={barrio} className="flex items-center space-x-2 p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.barrios.includes(barrio)}
                            onChange={(e) => handleBarrioChange(barrio, e.target.checked)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{barrio}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Corregimientos */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'corregimientos' ? null : 'corregimientos')}
                  className="flex items-center justify-between w-full px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors"
                >
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Corregimientos {filters.corregimientos.length > 0 && `(${filters.corregimientos.length})`}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform ${openDropdown === 'corregimientos' ? 'rotate-180' : ''}`} />
                </button>

                {openDropdown === 'corregimientos' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-48 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {corregimientosData.map(corregimiento => (
                        <label key={corregimiento} className="flex items-center space-x-2 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.corregimientos.includes(corregimiento)}
                            onChange={(e) => handleCorregimientoChange(corregimiento, e.target.checked)}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{corregimiento}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filtros activos */}
            {activeFiltersCount > 0 && (
              <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-wrap gap-1">
                  {filters.comunas.map(comuna => (
                    <span key={comuna} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      {comuna}
                      <button
                        onClick={() => handleComunaChange(comuna, false)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {filters.barrios.map(barrio => (
                    <span key={barrio} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                      {barrio}
                      <button
                        onClick={() => handleBarrioChange(barrio, false)}
                        className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {filters.corregimientos.map(corregimiento => (
                    <span key={corregimiento} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                      {corregimiento}
                      <button
                        onClick={() => handleCorregimientoChange(corregimiento, false)}
                        className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MapLayerFilters
