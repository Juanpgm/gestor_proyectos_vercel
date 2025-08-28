'use client'

import React, { useState, useCallback } from 'react'
import { 
  Eye, 
  EyeOff, 
  Settings, 
  Circle,
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Tipos simplificados para control de capas
interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  type: 'geojson' | 'points'
}

interface OptimizedLayerControlProps {
  layers: LayerConfig[]
  onLayerToggle: (layerId: string) => void
  onLayerUpdate: (layerId: string, updates: Partial<LayerConfig>) => void
  className?: string
}

const OptimizedLayerControl: React.FC<OptimizedLayerControlProps> = ({
  layers,
  onLayerToggle,
  onLayerUpdate,
  className = ''
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
    }
    setExpandedLayers(newExpanded)
  }

  const handleVisibilityToggle = useCallback((layerId: string) => {
    console.log(`🔄 Toggle capa: ${layerId}`)
    onLayerToggle(layerId)
  }, [onLayerToggle])

  const handleColorChange = useCallback((layerId: string, color: string) => {
    console.log(`🎨 Cambio color capa ${layerId}:`, color)
    onLayerUpdate(layerId, { color })
  }, [onLayerUpdate])

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    console.log(`🌫️ Cambio opacidad capa ${layerId}:`, opacity)
    onLayerUpdate(layerId, { opacity })
  }, [onLayerUpdate])

  const resetAllLayers = useCallback(() => {
    console.log('🔄 Restaurando todas las capas')
    layers.forEach(layer => {
      onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
    })
  }, [layers, onLayerUpdate])

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header compacto */}
      <div className="flex-shrink-0 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Capas</h3>
          </div>
          <button
            onClick={resetAllLayers}
            className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Restaurar todas las capas"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Layers List - área expansible */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 overflow-y-auto">
        {layers.map((layer) => {
          const isExpanded = expandedLayers.has(layer.id)
          
          return (
            <div key={layer.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* Layer Header */}
              <div className="p-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => handleVisibilityToggle(layer.id)}
                    className={`transition-colors ${
                      layer.visible 
                        ? 'text-blue-500 dark:text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <Circle 
                    className="w-3 h-3 flex-shrink-0" 
                    style={{ color: layer.color, fill: layer.color }}
                  />
                  
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {layer.name}
                  </span>
                </div>

                <button
                  onClick={() => toggleLayerExpansion(layer.id)}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  {isExpanded ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
                </button>
              </div>

              {/* Expanded Layer Controls */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-2 bg-gray-50 dark:bg-gray-800/50 space-y-2">
                      
                      {/* Color Control */}
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={layer.color}
                            onChange={(e) => handleColorChange(layer.id, e.target.value)}
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {layer.color.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Opacity Control */}
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                          Opacidad ({Math.round(layer.opacity * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={layer.opacity}
                          onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Footer con estadísticas - altura fija */}
      <div className="flex-shrink-0 p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{layers.filter(l => l.visible).length} de {layers.length} visibles</span>
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 text-green-500" fill="currentColor" />
            <span>Activo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizedLayerControl
