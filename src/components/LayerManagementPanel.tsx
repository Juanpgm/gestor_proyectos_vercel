'use client'

import React, { useState, useCallback } from 'react'
import { Settings, Palette, Eye, EyeOff, Circle, ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react'

interface LayerConfig {
  id: string
  name: string
  visible: boolean
  color: string
  opacity: number
  representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado'
}

interface LayerManagementPanelProps {
  layers: LayerConfig[]
  onLayerUpdate: (layerId: string, updates: Partial<LayerConfig>) => void
  onApplyChanges?: () => void
  className?: string
}

const LayerManagementPanel: React.FC<LayerManagementPanelProps> = ({
  layers,
  onLayerUpdate,
  onApplyChanges,
  className = ''
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<LayerConfig>>>({})

  // Colores predefinidos para fácil selección - adaptados para tema oscuro
  const presetColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#3742FA', '#2F3542', '#F8B500', '#EB4D4B', '#6C5CE7'
  ]

  // Modos de representación disponibles
  const representationModes = [
    { key: 'clase_obra', label: 'Clase de Obra' },
    { key: 'tipo_intervencion', label: 'Tipo Intervención' },
    { key: 'estado', label: 'Estado Proyecto' }
  ]

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers)
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId)
    } else {
      newExpanded.add(layerId)
    }
    setExpandedLayers(newExpanded)
  }

  // Funciones para manejar cambios inmediatos (sin sistema de pendientes)
  const handleColorChange = useCallback((layerId: string, color: string) => {
    onLayerUpdate(layerId, { color })
  }, [onLayerUpdate])

  const handleVisibilityToggle = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer) {
      onLayerUpdate(layerId, { visible: !layer.visible })
    }
  }, [layers, onLayerUpdate])

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity })
  }, [onLayerUpdate])

  const handleRepresentationChange = useCallback((layerId: string, mode: string) => {
    onLayerUpdate(layerId, { representationMode: mode as LayerConfig['representationMode'] })
  }, [onLayerUpdate])

  const resetAllLayers = useCallback(() => {
    console.log('🔄 Restaurando todas las capas')
    layers.forEach(layer => {
      onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
    })
  }, [layers, onLayerUpdate])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Control de Capas</h3>
        </div>
      </div>

      {/* Layers List */}
      <div className="max-h-96 overflow-y-auto">
        {layers.map((layer) => {
          return (
            <div key={layer.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* Layer Header */}
              <div className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
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
                    className="w-3 h-3" 
                    style={{ color: layer.color, fill: layer.color }}
                  />
                  
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {layer.name}
                  </span>
                </div>

                <button
                  onClick={() => toggleLayerExpansion(layer.id)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  {expandedLayers.has(layer.id) ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
                </button>
              </div>

              {/* Expanded Layer Controls */}
              {expandedLayers.has(layer.id) && (
                <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  {/* Color Selection */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
                      <Palette className="w-3 h-3 inline mr-1" />
                      Color de Capa
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(layer.id, color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-105 ${
                            layer.color === color 
                              ? 'border-gray-800 dark:border-gray-200 scale-110 shadow-lg' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    
                    {/* Custom Color Input */}
                    <div className="mt-2">
                      <input
                        type="color"
                        value={layer.color}
                        onChange={(e) => handleColorChange(layer.id, e.target.value)}
                        className="w-full h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer bg-white dark:bg-gray-700"
                      />
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
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                  </div>

                  {/* Representation Mode */}
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">
                      Modo de Representación
                    </label>
                    <select
                      value={layer.representationMode}
                      onChange={(e) => handleRepresentationChange(layer.id, e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {representationModes.map((mode) => (
                        <option key={mode.key} value={mode.key}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{layers.filter(l => l.visible).length} de {layers.length} capas visibles</span>
          <button 
            onClick={() => {
              layers.forEach(layer => {
                onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
              })
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Restaurar todo
          </button>
        </div>
      </div>
    </div>
  )
}

export default LayerManagementPanel
