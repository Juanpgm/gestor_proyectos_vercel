'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, ChevronDown } from 'lucide-react'

interface ColorCustomizationControlProps {
  onColorChange: (layerId: string, colors: LayerColors) => void
  layers: string[]
  className?: string
}

export interface LayerColors {
  fill: string
  stroke: string
}

// Paletas de colores predefinidas
const COLOR_PALETTES = {
  default: {
    equipamientos: { fill: '#10B981', stroke: '#059669' },
    infraestructura_vial: { fill: '#F59E0B', stroke: '#D97706' },
    unidades_proyecto: { fill: '#3B82F6', stroke: '#1D4ED8' },
  },
  ocean: {
    equipamientos: { fill: '#06B6D4', stroke: '#0891B2' },
    infraestructura_vial: { fill: '#0EA5E9', stroke: '#0284C7' },
    unidades_proyecto: { fill: '#3B82F6', stroke: '#1E40AF' },
  },
  forest: {
    equipamientos: { fill: '#10B981', stroke: '#047857' },
    infraestructura_vial: { fill: '#84CC16', stroke: '#65A30D' },
    unidades_proyecto: { fill: '#22C55E', stroke: '#16A34A' },
  },
  sunset: {
    equipamientos: { fill: '#F59E0B', stroke: '#D97706' },
    infraestructura_vial: { fill: '#EF4444', stroke: '#DC2626' },
    unidades_proyecto: { fill: '#F97316', stroke: '#EA580C' },
  },
  purple: {
    equipamientos: { fill: '#8B5CF6', stroke: '#7C3AED' },
    infraestructura_vial: { fill: '#A855F7', stroke: '#9333EA' },
    unidades_proyecto: { fill: '#6366F1', stroke: '#4F46E5' },
  },
  pastel: {
    equipamientos: { fill: '#FB7185', stroke: '#F43F5E' },
    infraestructura_vial: { fill: '#FBBF24', stroke: '#F59E0B' },
    unidades_proyecto: { fill: '#60A5FA', stroke: '#3B82F6' },
  }
}

const PALETTE_NAMES: Record<string, string> = {
  default: 'Por Defecto',
  ocean: 'Océano',
  forest: 'Bosque',
  sunset: 'Atardecer',
  purple: 'Púrpura',
  pastel: 'Pastel'
}

const ColorCustomizationControl: React.FC<ColorCustomizationControlProps> = ({
  onColorChange,
  layers,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPalette, setSelectedPalette] = useState('default')

  // Aplicar paleta completa
  const applyPalette = (paletteKey: string) => {
    const palette = COLOR_PALETTES[paletteKey as keyof typeof COLOR_PALETTES]
    setSelectedPalette(paletteKey)
    
    // Aplicar colores a todas las capas disponibles
    Object.entries(palette).forEach(([layerId, colors]) => {
      if (layers.includes(layerId)) {
        onColorChange(layerId, colors)
      }
    })
  }

  // Renderizar selector de color individual
  const renderColorPicker = (layerId: string, colorType: 'fill' | 'stroke', currentColor: string) => {
    const handleColorChange = (color: string) => {
      const currentColors = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES][layerId as keyof typeof COLOR_PALETTES.default]
      const newColors = {
        ...currentColors,
        [colorType]: color
      }
      onColorChange(layerId, newColors)
    }

    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={currentColor}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          title={`Color ${colorType === 'fill' ? 'de relleno' : 'de borde'}`}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
          {colorType === 'fill' ? 'Relleno' : 'Borde'}
        </span>
      </div>
    )
  }

  return (
    <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      {/* Header minimalista */}
      <div className="p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gradient-to-br from-red-500 to-blue-500 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Colores
            </span>
          </div>
          
          <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform group-hover:text-purple-600 dark:group-hover:text-purple-400 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Panel expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="p-3 space-y-4">
              {/* Paletas predefinidas */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Paletas Rápidas
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                    <button
                      key={key}
                      onClick={() => applyPalette(key)}
                      className={`relative p-2 rounded-lg border transition-all hover:scale-105 ${
                        selectedPalette === key
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                      }`}
                      title={PALETTE_NAMES[key]}
                    >
                      {/* Preview de la paleta */}
                      <div className="flex gap-1 mb-1">
                        {Object.values(palette).map((colors, index) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full border border-white dark:border-gray-800 shadow-sm"
                            style={{ backgroundColor: colors.fill }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 block truncate">
                        {PALETTE_NAMES[key]}
                      </span>
                      
                      {/* Indicador de selección */}
                      {selectedPalette === key && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controles individuales por capa */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Personalización Individual
                </h4>
                <div className="space-y-3">
                  {layers.map(layerId => {
                    const layerName = layerId === 'equipamientos' ? 'Equipamientos' : 
                                    layerId === 'infraestructura_vial' ? 'Vías' : 
                                    layerId === 'unidades_proyecto' ? 'Proyectos' : layerId
                    
                    const currentColors = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES][layerId as keyof typeof COLOR_PALETTES.default]
                    
                    if (!currentColors) return null

                    return (
                      <div key={layerId} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {layerName}
                          </span>
                          <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600" style={{ backgroundColor: currentColors.fill }} />
                        </div>
                        <div className="flex gap-3">
                          {renderColorPicker(layerId, 'fill', currentColors.fill)}
                          {renderColorPicker(layerId, 'stroke', currentColors.stroke)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Botón de reset */}
              <div className="pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                <button
                  onClick={() => applyPalette('default')}
                  className="w-full text-xs text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                >
                  Restaurar colores por defecto
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ColorCustomizationControl
