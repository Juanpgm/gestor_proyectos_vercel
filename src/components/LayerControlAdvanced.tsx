'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Settings, 
  Palette,
  Filter,
  Search,
  X,
  BarChart3,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { LayerConfig, LayerFilters } from '@/hooks/useUnifiedLayerManagement'

interface LayerControlAdvancedProps {
  layers: LayerConfig[]
  onLayerUpdate: (layerId: string, updates: Partial<LayerConfig>) => void
  onToggleVisibility: (layerId: string) => void
  onOpenSymbology: (layerId: string) => void
  
  // Filtros
  filters: LayerFilters
  onFiltersChange: (filters: Partial<LayerFilters>) => void
  onClearFilters: () => void
  
  // Configuración
  stats: {
    total: number
    visible: number
    hidden: number
    dataLoaded: number
    dataNotLoaded: number
  }
  
  // Acciones
  onResetLayers: () => void
  onExportConfig?: () => void
  onImportConfig?: () => void
  
  className?: string
}

const LayerControlAdvanced: React.FC<LayerControlAdvancedProps> = ({
  layers,
  onLayerUpdate,
  onToggleVisibility,
  onOpenSymbology,
  filters,
  onFiltersChange,
  onClearFilters,
  stats,
  onResetLayers,
  onExportConfig,
  onImportConfig,
  className = ''
}) => {
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false)
  const [searchText, setSearchText] = useState(filters.search || '')

  // Manejar búsqueda con debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value)
    // Simple debounce
    setTimeout(() => {
      onFiltersChange({ search: value || undefined })
    }, 300)
  }, [onFiltersChange])

  // Obtener categorías únicas de todos los layers
  const availableCategories = React.useMemo(() => {
    const categories = new Set<string>()
    layers.forEach(layer => {
      if (layer.data?.features) {
        layer.data.features.forEach((feature: any) => {
          const categoria = feature.properties?.clase_obra || feature.properties?.tipo_intervencion
          if (categoria) categories.add(categoria)
        })
      }
    })
    return Array.from(categories).sort()
  }, [layers])

  // Obtener estados únicos
  const availableStates = React.useMemo(() => {
    const states = new Set<string>()
    layers.forEach(layer => {
      if (layer.data?.features) {
        layer.data.features.forEach((feature: any) => {
          const estado = feature.properties?.estado_unidad_proyecto
          if (estado) states.add(estado)
        })
      }
    })
    return Array.from(states).sort()
  }, [layers])

  const activeFiltersCount = (filters.categoria?.length || 0) + 
                           (filters.estado?.length || 0) + 
                           (filters.search ? 1 : 0)

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Gestión de Capas
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Botón de filtros */}
            <button
              onClick={() => setFiltersPanelOpen(!filtersPanelOpen)}
              className={`p-2 rounded-lg transition-colors relative ${
                filtersPanelOpen || activeFiltersCount > 0
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Filtros"
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Botón de reset */}
            <button
              onClick={onResetLayers}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
              title="Restaurar configuración por defecto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {stats.visible}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Visibles</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {stats.dataLoaded}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Cargadas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
              {stats.total}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Total</div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <AnimatePresence>
        {filtersPanelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="p-4 space-y-4">
              {/* Búsqueda */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Buscar en capas
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Buscar en propiedades..."
                    className="w-full p-2 pl-8 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  {searchText && (
                    <button
                      onClick={() => handleSearchChange('')}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por categorías */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Categorías
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableCategories.map(categoria => (
                    <label key={categoria} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categoria?.includes(categoria) || false}
                        onChange={(e) => {
                          const current = filters.categoria || []
                          if (e.target.checked) {
                            onFiltersChange({ categoria: [...current, categoria] })
                          } else {
                            onFiltersChange({ categoria: current.filter(c => c !== categoria) })
                          }
                        }}
                        className="mr-2 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {categoria}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro por estados */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Estados
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {availableStates.map(estado => (
                    <label key={estado} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.estado?.includes(estado) || false}
                        onChange={(e) => {
                          const current = filters.estado || []
                          if (e.target.checked) {
                            onFiltersChange({ estado: [...current, estado] })
                          } else {
                            onFiltersChange({ estado: current.filter(s => s !== estado) })
                          }
                        }}
                        className="mr-2 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {estado}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botón para limpiar filtros */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="w-full p-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Limpiar filtros ({activeFiltersCount})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Capas */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-3">
          {layers.map((layer) => (
            <div key={layer.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Botón de visibilidad */}
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className={`transition-colors ${
                      layer.visible 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                  >
                    {layer.visible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  
                  {/* Indicador de color */}
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0" 
                    style={{ backgroundColor: layer.color }}
                  />
                  
                  {/* Información de la capa */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <span>{layer.icon}</span>
                      <span className="truncate">{layer.name}</span>
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{layer.data?.features?.length || 0} elementos</span>
                      {layer.data && (
                        <span className="px-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                          Cargado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de configuración */}
                <button
                  onClick={() => onOpenSymbology(layer.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all group flex-shrink-0"
                  title="Configurar simbología"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform duration-200" />
                </button>
              </div>

              {/* Controles de opacidad cuando la capa está visible */}
              {layer.visible && (
                <div className="mt-3">
                  {/* La barra de opacidad ha sido eliminada para simplificar la interfaz */}
                  {/* Los controles avanzados de opacidad están disponibles en el modal de simbología */}
                </div>
              )}
            </div>
          ))}

          {layers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay capas configuradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>
            {stats.visible} de {stats.total} capas visibles
          </span>
          <div className="flex items-center gap-2">
            {onExportConfig && (
              <button 
                onClick={onExportConfig}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                title="Exportar configuración"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onImportConfig && (
              <button 
                onClick={onImportConfig}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                title="Importar configuración"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerControlAdvanced
