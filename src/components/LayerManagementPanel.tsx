'use client'

import React, { useState } from 'react'
import { Settings, Palette, Eye, EyeOff, Circle, ChevronDown, ChevronUp } from 'lucide-react'

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
  className?: string
}

const LayerManagementPanel: React.FC<LayerManagementPanelProps> = ({
  layers,
  onLayerUpdate,
  className = ''
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set())
  const [globalSettings, setGlobalSettings] = useState({
    showLabels: true,
    showBoundaries: true,
    globalOpacity: 0.8
  })

  // Colores predefinidos para fácil selección
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

  const handleColorChange = (layerId: string, color: string) => {
    onLayerUpdate(layerId, { color })
  }

  const handleVisibilityToggle = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (layer) {
      onLayerUpdate(layerId, { visible: !layer.visible })
    }
  }

  const handleOpacityChange = (layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity })
  }

  const handleRepresentationChange = (layerId: string, mode: string) => {
    onLayerUpdate(layerId, { representationMode: mode as LayerConfig['representationMode'] })
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Control de Capas</h3>
        </div>
      </div>

      {/* Global Settings */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Configuración Global</h4>
        
        <div className="space-y-3">
          {/* Global Opacity */}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Opacidad General</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={globalSettings.globalOpacity}
              onChange={(e) => setGlobalSettings(prev => ({ 
                ...prev, 
                globalOpacity: parseFloat(e.target.value) 
              }))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(globalSettings.globalOpacity * 100)}%</span>
          </div>

          {/* Show Labels */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">Mostrar Etiquetas</span>
            <button
              onClick={() => setGlobalSettings(prev => ({ ...prev, showLabels: !prev.showLabels }))}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                globalSettings.showLabels ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                globalSettings.showLabels ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Show Boundaries */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">Mostrar Límites</span>
            <button
              onClick={() => setGlobalSettings(prev => ({ ...prev, showBoundaries: !prev.showBoundaries }))}
              className={`w-10 h-5 rounded-full relative transition-colors ${
                globalSettings.showBoundaries ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                globalSettings.showBoundaries ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Layers List */}
      <div className="max-h-96 overflow-y-auto">
        {layers.map((layer) => (
          <div key={layer.id} className="border-b border-gray-100 last:border-b-0">
            {/* Layer Header */}
            <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => handleVisibilityToggle(layer.id)}
                  className={`transition-colors ${layer.visible ? 'text-blue-500' : 'text-gray-400'}`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                <Circle 
                  className="w-3 h-3" 
                  style={{ color: layer.color, fill: layer.color }}
                />
                
                <span className="text-sm font-medium text-gray-700 truncate">
                  {layer.name}
                </span>
              </div>

              <button
                onClick={() => toggleLayerExpansion(layer.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {expandedLayers.has(layer.id) ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Expanded Layer Controls */}
            {expandedLayers.has(layer.id) && (
              <div className="px-4 pb-4 bg-gray-50 space-y-4">
                {/* Color Selection */}
                <div>
                  <label className="text-xs text-gray-600 block mb-2">
                    <Palette className="w-3 h-3 inline mr-1" />
                    Color de Capa
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(layer.id, color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          layer.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
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
                      className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Opacity Control */}
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Opacidad ({Math.round(layer.opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layer.opacity}
                    onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Representation Mode */}
                <div>
                  <label className="text-xs text-gray-600 block mb-2">
                    Modo de Representación
                  </label>
                  <select
                    value={layer.representationMode}
                    onChange={(e) => handleRepresentationChange(layer.id, e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{layers.filter(l => l.visible).length} de {layers.length} capas visibles</span>
          <button 
            onClick={() => {
              layers.forEach(layer => {
                onLayerUpdate(layer.id, { visible: true, opacity: 0.8 })
              })
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Restaurar todo
          </button>
        </div>
      </div>
    </div>
  )
}

export default LayerManagementPanel
