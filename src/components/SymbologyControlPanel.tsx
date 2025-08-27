'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  ChevronDown, 
  Settings, 
  Layers,
  RotateCcw,
  Hash,
  Tag,
  Target,
  Sparkles,
  Check,
  X,
  Minus,
  Circle,
  Square,
  Triangle,
  Star
} from 'lucide-react'
import { 
  SymbologyMode, 
  SymbologyConfig, 
  RangeColorConfig,
  useLayerSymbology 
} from '@/hooks/useLayerSymbology'

interface SymbologyControlPanelProps {
  layers: Array<{
    id: string
    name: string
    data: any
    visible: boolean
  }>
  onApplyChanges?: (layerId: string) => void
  className?: string
}

const SymbologyControlPanel: React.FC<SymbologyControlPanelProps> = ({
  layers,
  onApplyChanges,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLayerId, setSelectedLayerId] = useState<string>('')
  const [selectedAttribute, setSelectedAttribute] = useState<string>('')
  const [numRanges, setNumRanges] = useState(5)
  
  const {
    updatePendingChanges,
    applyPendingChanges,
    discardPendingChanges,
    hasPendingChanges,
    getLayerSymbology,
    getUniqueAttributeValues,
    getNumericAttributeValues,
    generateCategoryColors,
    generateRanges,
    resetLayerSymbology,
    DEFAULT_CATEGORY_COLORS
  } = useLayerSymbology()

  // Seleccionar automáticamente la primera capa visible
  useEffect(() => {
    if (!selectedLayerId && layers.length > 0) {
      const firstVisibleLayer = layers.find(layer => layer.visible)
      if (firstVisibleLayer) {
        setSelectedLayerId(firstVisibleLayer.id)
      }
    }
  }, [layers, selectedLayerId])

  // Obtener atributos disponibles para la capa seleccionada
  const availableAttributes = useMemo(() => {
    const layer = layers.find(l => l.id === selectedLayerId)
    if (!layer || !layer.data) return []

    let attributes: string[] = []
    
    // Para datos GeoJSON
    if (layer.data.features && Array.isArray(layer.data.features)) {
      const firstFeature = layer.data.features[0]
      if (firstFeature && firstFeature.properties) {
        attributes = Object.keys(firstFeature.properties)
      }
    }
    // Para arrays de puntos
    else if (Array.isArray(layer.data) && layer.data.length > 0) {
      attributes = Object.keys(layer.data[0]).filter(key => 
        !['lat', 'lng', 'geometry', '_id'].includes(key)
      )
    }

    return attributes.filter(attr => attr && typeof attr === 'string')
  }, [layers, selectedLayerId])

  // Obtener configuración actual de la capa
  const currentConfig = useMemo(() => {
    if (!selectedLayerId) return null
    const selectedLayer = layers.find(l => l.id === selectedLayerId)
    return getLayerSymbology(selectedLayerId, true, (selectedLayer as any)?.color)
  }, [selectedLayerId, getLayerSymbology, layers])

  // Actualizar modo de simbología
  const handleModeChange = (mode: SymbologyMode) => {
    if (!selectedLayerId) return
    
    updatePendingChanges(selectedLayerId, { mode })
    
    // Resetear configuraciones específicas del modo anterior
    if (mode !== 'categories') {
      updatePendingChanges(selectedLayerId, { categoryColors: undefined })
    }
    if (mode !== 'ranges') {
      updatePendingChanges(selectedLayerId, { rangeColors: undefined })
    }
    if (mode !== 'icons') {
      updatePendingChanges(selectedLayerId, { iconMappings: undefined })
    }
  }

  // Actualizar atributo seleccionado
  const handleAttributeChange = (attribute: string) => {
    if (!selectedLayerId) return
    
    setSelectedAttribute(attribute)
    updatePendingChanges(selectedLayerId, { attribute })
    
    const layer = layers.find(l => l.id === selectedLayerId)
    if (!layer) return

    const config = getLayerSymbology(selectedLayerId, true, (layer as any)?.color)
    
    // Generar configuraciones automáticas según el modo
    if (config.mode === 'categories') {
      const uniqueValues = getUniqueAttributeValues(layer.data, attribute)
      const categoryColors = generateCategoryColors(uniqueValues)
      updatePendingChanges(selectedLayerId, { categoryColors })
    } else if (config.mode === 'ranges') {
      const numericValues = getNumericAttributeValues(layer.data, attribute)
      const rangeColors = generateRanges(numericValues, numRanges)
      updatePendingChanges(selectedLayerId, { rangeColors })
    }
  }

  // Actualizar color fijo
  const handleFixedColorChange = (color: string) => {
    if (!selectedLayerId) return
    updatePendingChanges(selectedLayerId, { fixedColor: color })
  }

  // Actualizar color de categoría
  const handleCategoryColorChange = (category: string, color: string) => {
    if (!selectedLayerId) return
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId)
    const currentConfig = getLayerSymbology(selectedLayerId, true, (selectedLayer as any)?.color)
    if (!currentConfig?.categoryColors) return
    
    const newCategoryColors = {
      ...currentConfig.categoryColors,
      [category]: color
    }
    updatePendingChanges(selectedLayerId, { categoryColors: newCategoryColors })
  }

  // Actualizar color de rango
  const handleRangeColorChange = (rangeIndex: number, color: string) => {
    if (!selectedLayerId) return
    
    const selectedLayer = layers.find(l => l.id === selectedLayerId)
    const currentConfig = getLayerSymbology(selectedLayerId, true, (selectedLayer as any)?.color)
    if (!currentConfig?.rangeColors) return
    
    const newRangeColors = currentConfig.rangeColors.map((range, index) => 
      index === rangeIndex ? { ...range, color } : range
    )
    updatePendingChanges(selectedLayerId, { rangeColors: newRangeColors })
  }

  // Regenerar rangos
  const handleRegenerateRanges = () => {
    if (!selectedLayerId || !selectedAttribute) return
    
    const layer = layers.find(l => l.id === selectedLayerId)
    if (!layer) return
    
    const numericValues = getNumericAttributeValues(layer.data, selectedAttribute)
    const rangeColors = generateRanges(numericValues, numRanges)
    updatePendingChanges(selectedLayerId, { rangeColors })
  }

  // Aplicar cambios
  const handleApplyChanges = () => {
    if (!selectedLayerId) return
    
    applyPendingChanges(selectedLayerId)
    onApplyChanges?.(selectedLayerId)
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    if (!selectedLayerId) return
    
    discardPendingChanges(selectedLayerId)
  }

  // Detectar tipo de geometría principal de la capa
  const getLayerGeometryType = (layer: any) => {
    if (!layer.data?.features) return 'unknown'
    
    const geometryTypes = layer.data.features.map((f: any) => f.geometry?.type).filter(Boolean)
    const mostCommon = geometryTypes.reduce((a: any, b: any) => 
      geometryTypes.filter((v: any) => v === a).length >= geometryTypes.filter((v: any) => v === b).length ? a : b
    )
    
    return mostCommon || 'unknown'
  }

  // Obtener valores únicos para el atributo seleccionado
  const getAttributeValues = () => {
    if (!selectedLayerId || !selectedAttribute) return []
    
    const layer = layers.find(l => l.id === selectedLayerId)
    if (!layer) return []
    
    return getUniqueAttributeValues(layer.data, selectedAttribute)
  }

  // Obtener información de la capa seleccionada
  const selectedLayer = useMemo(() => {
    return layers.find(l => l.id === selectedLayerId)
  }, [layers, selectedLayerId])

  const geometryType = useMemo(() => {
    return selectedLayer ? getLayerGeometryType(selectedLayer) : 'unknown'
  }, [selectedLayer])

  if (layers.length === 0) {
    return null
  }

  return (
    <div className={`bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      {/* Header */}
      <div className="p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-yellow-500" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Simbología QGIS
            </span>
          </div>
          
          <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Panel expandible */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              
              {/* Selector de capa */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  <Layers className="w-3 h-3 inline mr-1" />
                  Capa
                </label>
                <select
                  value={selectedLayerId}
                  onChange={(e) => setSelectedLayerId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar capa...</option>
                  {layers.filter(layer => layer.visible).map(layer => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLayerId && currentConfig && (
                <>
                  {/* Selector de modo */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                      <Settings className="w-3 h-3 inline mr-1" />
                      Modo de Simbología
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { mode: 'fixed' as SymbologyMode, label: 'Color Fijo', icon: '🎨' },
                        { mode: 'categories' as SymbologyMode, label: 'Categorías', icon: '📊' },
                        { mode: 'ranges' as SymbologyMode, label: 'Rangos', icon: '📈' },
                        { mode: 'icons' as SymbologyMode, label: 'Iconos', icon: '📍' }
                      ].map(({ mode, label, icon }) => (
                        <button
                          key={mode}
                          onClick={() => handleModeChange(mode)}
                          className={`p-2 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                            currentConfig.mode === mode
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de atributo (para categorías, rangos e iconos) */}
                  {(currentConfig.mode === 'categories' || currentConfig.mode === 'ranges' || currentConfig.mode === 'icons') && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        <Tag className="w-3 h-3 inline mr-1" />
                        Atributo
                      </label>
                      <select
                        value={selectedAttribute}
                        onChange={(e) => handleAttributeChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar atributo...</option>
                        {availableAttributes.map(attr => (
                          <option key={attr} value={attr}>
                            {attr}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Configuraciones específicas por modo */}
                  
                  {/* Color fijo */}
                  {currentConfig.mode === 'fixed' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Color Principal
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={currentConfig.fixedColor || '#3B82F6'}
                          onChange={(e) => handleFixedColorChange(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {currentConfig.fixedColor || '#3B82F6'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Categorías */}
                  {currentConfig.mode === 'categories' && selectedAttribute && currentConfig.categoryColors && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Colores por Categoría
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {Object.entries(currentConfig.categoryColors).map(([category, color]) => (
                          <div key={category} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handleCategoryColorChange(category, e.target.value)}
                              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                              {category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rangos */}
                  {currentConfig.mode === 'ranges' && selectedAttribute && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Rangos Numéricos
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="2"
                            max="10"
                            value={numRanges}
                            onChange={(e) => setNumRanges(parseInt(e.target.value) || 5)}
                            className="w-12 px-1 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <button
                            onClick={handleRegenerateRanges}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Regenerar rangos"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {currentConfig.rangeColors && currentConfig.rangeColors.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {currentConfig.rangeColors.map((range, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                              <input
                                type="color"
                                value={range.color}
                                onChange={(e) => handleRangeColorChange(index, e.target.value)}
                                className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                                {range.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          Selecciona un atributo numérico para generar rangos
                        </div>
                      )}
                    </div>
                  )}

                  {/* Controles adicionales */}
                  <div className="space-y-3">
                    {/* Opacidad */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        Opacidad: {Math.round((currentConfig.opacity || 0.7) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={currentConfig.opacity || 0.7}
                        onChange={(e) => updatePendingChanges(selectedLayerId, { opacity: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Grosor del borde */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                        Grosor: {currentConfig.strokeWidth || 2}px
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={currentConfig.strokeWidth || 2}
                        onChange={(e) => updatePendingChanges(selectedLayerId, { strokeWidth: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* Controles específicos para líneas */}
                    {geometryType === 'LineString' && (
                      <>
                        {/* Estilo de línea */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Estilo de Línea
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'solid', label: 'Sólida', icon: <Minus className="w-3 h-3" /> },
                              { value: 'dashed', label: 'Guiones', icon: <span className="text-xs">- - -</span> },
                              { value: 'dotted', label: 'Puntos', icon: <span className="text-xs">• • •</span> },
                              { value: 'dashdot', label: 'Mixta', icon: <span className="text-xs">-•-</span> }
                            ].map(({ value, label, icon }) => (
                              <button
                                key={value}
                                onClick={() => updatePendingChanges(selectedLayerId, { lineStyle: value as any })}
                                className={`p-2 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                                  currentConfig.lineStyle === value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {icon}
                                <span>{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Terminaciones de línea */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Terminaciones
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { value: 'butt', label: 'Plana' },
                              { value: 'round', label: 'Redonda' },
                              { value: 'square', label: 'Cuadrada' }
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                onClick={() => updatePendingChanges(selectedLayerId, { lineCap: value as any })}
                                className={`p-1.5 text-xs rounded border transition-all ${
                                  currentConfig.lineCap === value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Controles específicos para puntos */}
                    {geometryType === 'Point' && (
                      <>
                        {/* Tamaño del punto */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Tamaño: {currentConfig.pointSize || 8}px
                          </label>
                          <input
                            type="range"
                            min="4"
                            max="20"
                            step="1"
                            value={currentConfig.pointSize || 8}
                            onChange={(e) => updatePendingChanges(selectedLayerId, { pointSize: parseInt(e.target.value) })}
                            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        {/* Forma del punto */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Forma del Punto
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'circle', label: 'Círculo', icon: <Circle className="w-3 h-3" /> },
                              { value: 'square', label: 'Cuadrado', icon: <Square className="w-3 h-3" /> },
                              { value: 'triangle', label: 'Triángulo', icon: <Triangle className="w-3 h-3" /> },
                              { value: 'star', label: 'Estrella', icon: <Star className="w-3 h-3" /> }
                            ].map(({ value, label, icon }) => (
                              <button
                                key={value}
                                onClick={() => updatePendingChanges(selectedLayerId, { pointShape: value as any })}
                                className={`p-2 text-xs rounded-lg border transition-all flex items-center gap-1 ${
                                  currentConfig.pointShape === value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {icon}
                                <span>{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
                    {/* Botones Aplicar y Descartar */}
                    {hasPendingChanges(selectedLayerId) && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyChanges}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Aplicar
                        </button>
                        <button
                          onClick={handleDiscardChanges}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Descartar
                        </button>
                      </div>
                    )}

                    {/* Indicador de cambios pendientes */}
                    {hasPendingChanges(selectedLayerId) && (
                      <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                        ⚠️ Hay cambios pendientes sin aplicar
                      </div>
                    )}

                    {/* Botón de reset */}
                    <button
                      onClick={() => resetLayerSymbology(selectedLayerId)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurar simbología por defecto
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS para el slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

export default SymbologyControlPanel
