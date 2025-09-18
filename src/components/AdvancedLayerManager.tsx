'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Palette,
  MapPin,
  Layers,
  Settings,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

// Tipos locales para el manejo de capas
interface LayerConfig {
  id: string
  name: string
  visible: boolean
  type: 'geojson' | 'marker' | 'tile'
  category: string
  color?: string
  opacity?: number
  data?: any
  customStyles?: any
}

interface LayerFilters {
  search?: string
  category?: string
  visible?: boolean
}

interface FilterState {
  search: string
  commune: string
  neighborhood: string
  category: string
  status: string
}

interface ColorScheme {
  id: string
  name: string
  colors: string[]
}

interface AdvancedLayerManagerProps {
  layers: LayerConfig[]
  onLayerUpdate: (layerId: string, updates: Partial<LayerConfig>) => void
  onToggleVisibility: (layerId: string) => void
  filters: LayerFilters
  onFiltersChange: (filters: Partial<LayerFilters>) => void
  onClearFilters: () => void
  className?: string
}

// Esquemas de colores predefinidos
const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'categorical',
    name: 'Categórico',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
  },
  {
    id: 'sequential_blue',
    name: 'Azul Secuencial',
    colors: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8']
  },
  {
    id: 'sequential_green',
    name: 'Verde Secuencial',
    colors: ['#F0FDF4', '#DCFCE7', '#BBF7D0', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D']
  },
  {
    id: 'diverging',
    name: 'Divergente',
    colors: ['#B91C1C', '#DC2626', '#EF4444', '#FCA5A5', '#E5E7EB', '#A3A3A3', '#525252', '#262626']
  }
]

// Función para extraer valores únicos de una propiedad
const extractUniqueValues = (data: any[], property: string): string[] => {
  if (!data || !Array.isArray(data)) return []
  
  const values = new Set<string>()
  data.forEach(item => {
    const value = item.properties?.[property]
    if (value && typeof value === 'string') {
      values.add(value)
    }
  })
  
  return Array.from(values).sort()
}

// Función para filtrar datos basado en filtros activos
const filterData = (data: any[], filters: FilterState): any[] => {
  if (!data || !Array.isArray(data)) return []
  
  return data.filter(item => {
    const props = item.properties || {}
    
    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const searchableFields = ['nombre', 'name', 'descripcion', 'description', 'tipo', 'type']
      const matches = searchableFields.some(field => 
        props[field]?.toString().toLowerCase().includes(searchLower)
      )
      if (!matches) return false
    }
    
    // Filtro por comuna
    if (filters.commune) {
      const commune = props.comuna || props.commune || props.COMUNA
      if (commune !== filters.commune) return false
    }
    
    // Filtro por barrio
    if (filters.neighborhood) {
      const neighborhood = props.barrio || props.neighborhood || props.BARRIO
      if (neighborhood !== filters.neighborhood) return false
    }
    
    // Filtro por categoría
    if (filters.category) {
      const category = props.categoria || props.category || props.tipo || props.type
      if (category !== filters.category) return false
    }
    
    // Filtro por estado
    if (filters.status) {
      const status = props.estado || props.status || props.Estado
      if (status !== filters.status) return false
    }
    
    return true
  })
}

// Función para aplicar colores basado en categorización
const applyColorMapping = (
  data: any[], 
  property: string, 
  colorScheme: string[]
): Map<string, string> => {
  const uniqueValues = extractUniqueValues(data, property)
  const colorMap = new Map<string, string>()
  
  uniqueValues.forEach((value, index) => {
    const colorIndex = index % colorScheme.length
    colorMap.set(value, colorScheme[colorIndex])
  })
  
  return colorMap
}

const AdvancedLayerManager: React.FC<AdvancedLayerManagerProps> = ({
  layers,
  onLayerUpdate,
  onToggleVisibility,
  filters,
  onFiltersChange,
  onClearFilters,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeLayer, setActiveLayer] = useState<string | null>(null)
  const [localFilters, setLocalFilters] = useState<FilterState>({
    search: '',
    commune: '',
    neighborhood: '',
    category: '',
    status: ''
  })
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('categorical')

  // Obtener opciones de filtros basadas en los datos de todas las capas
  const filterOptions = useMemo(() => {
    const allData = layers.flatMap(layer => layer.data?.features || [])
    
    return {
      communes: extractUniqueValues(allData, 'comuna').concat(
        extractUniqueValues(allData, 'commune'),
        extractUniqueValues(allData, 'COMUNA')
      ).filter((v, i, arr) => arr.indexOf(v) === i),
      neighborhoods: extractUniqueValues(allData, 'barrio').concat(
        extractUniqueValues(allData, 'neighborhood'),
        extractUniqueValues(allData, 'BARRIO')
      ).filter((v, i, arr) => arr.indexOf(v) === i),
      categories: extractUniqueValues(allData, 'categoria').concat(
        extractUniqueValues(allData, 'category'),
        extractUniqueValues(allData, 'tipo'),
        extractUniqueValues(allData, 'type')
      ).filter((v, i, arr) => arr.indexOf(v) === i),
      statuses: extractUniqueValues(allData, 'estado').concat(
        extractUniqueValues(allData, 'status'),
        extractUniqueValues(allData, 'Estado')
      ).filter((v, i, arr) => arr.indexOf(v) === i)
    }
  }, [layers])

  // Aplicar filtros a una capa específica
  const applyLayerFilters = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer?.data?.features) return

    const filteredFeatures = filterData(layer.data.features, localFilters)
    
    onLayerUpdate(layerId, {
      data: {
        ...layer.data,
        features: filteredFeatures
      }
    })
  }, [layers, localFilters, onLayerUpdate])

  // Aplicar esquema de colores a una capa
  const applyColorScheme = useCallback((layerId: string, property: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer?.data?.features) return

    const scheme = COLOR_SCHEMES.find(s => s.id === selectedColorScheme)
    if (!scheme) return

    const colorMap = applyColorMapping(layer.data.features, property, scheme.colors)
    
    onLayerUpdate(layerId, {
      customStyles: {
        colorMapping: Object.fromEntries(colorMap),
        categorizedBy: property
      }
    })
  }, [layers, selectedColorScheme, onLayerUpdate])

  // Limpiar filtros
  const clearAllFilters = useCallback(() => {
    setLocalFilters({
      search: '',
      commune: '',
      neighborhood: '',
      category: '',
      status: ''
    })
    onClearFilters()
  }, [onClearFilters])

  // Estadísticas de capas
  const stats = useMemo(() => {
    const visible = layers.filter(l => l.visible).length
    const withData = layers.filter(l => l.data?.features?.length > 0).length
    const totalFeatures = layers.reduce((sum, l) => sum + (l.data?.features?.length || 0), 0)
    
    return {
      total: layers.length,
      visible,
      withData,
      totalFeatures
    }
  }, [layers])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header compacto */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Gestión de Capas
            </h3>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {stats.visible}/{stats.total}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Controles de filtrado */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="space-y-2">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={localFilters.search}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>

                {/* Filtros en grid */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={localFilters.commune}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, commune: e.target.value }))}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas las comunas</option>
                    {filterOptions.communes.map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>

                  <select
                    value={localFilters.neighborhood}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los barrios</option>
                    {filterOptions.neighborhoods.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>

                  <select
                    value={localFilters.category}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todas las categorías</option>
                    {filterOptions.categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  <select
                    value={localFilters.status}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los estados</option>
                    {filterOptions.statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpiar
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.totalFeatures} elementos
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de capas */}
            <div className="max-h-64 overflow-y-auto">
              <div className="p-2 space-y-2">
                {layers.map((layer) => (
                  <div key={layer.id} className="group">
                    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors">
                      {/* Visibilidad */}
                      <button
                        onClick={() => onToggleVisibility(layer.id)}
                        className={`transition-colors ${
                          layer.visible 
                            ? 'text-blue-500 dark:text-blue-400' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Color indicator */}
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" 
                        style={{ backgroundColor: layer.color }}
                      />

                      {/* Información de la capa */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {layer.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {layer.data?.features?.length || 0} elementos
                        </div>
                      </div>

                      {/* Controles avanzados */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                          title="Personalizar"
                        >
                          <Palette className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => applyLayerFilters(layer.id)}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded"
                          title="Aplicar filtros"
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Panel de personalización expandido */}
                    <AnimatePresence>
                      {activeLayer === layer.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mr-2 mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                        >
                          <div className="space-y-2">
                            {/* Control de opacidad */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Opacidad: {Math.round((layer.opacity || 1) * 100)}%
                              </label>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={layer.opacity}
                                onChange={(e) => onLayerUpdate(layer.id, { opacity: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>

                            {/* Esquema de colores */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Esquema de colores
                              </label>
                              <select
                                value={selectedColorScheme}
                                onChange={(e) => setSelectedColorScheme(e.target.value)}
                                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                {COLOR_SCHEMES.map(scheme => (
                                  <option key={scheme.id} value={scheme.id}>
                                    {scheme.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Propiedades para categorización */}
                            {layer.data?.features?.length > 0 && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Categorizar por
                                </label>
                                <div className="grid grid-cols-2 gap-1">
                                  {['categoria', 'tipo', 'estado', 'comuna'].map(prop => (
                                    <button
                                      key={prop}
                                      onClick={() => applyColorScheme(layer.id, prop)}
                                      className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    >
                                      {prop}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {layers.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No hay capas disponibles</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con estadísticas */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{stats.visible} visibles de {stats.total}</span>
                <span>{stats.totalFeatures} elementos totales</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdvancedLayerManager