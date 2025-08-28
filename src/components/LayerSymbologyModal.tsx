'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X,
  Settings,
  Tag,
  Check,
  RotateCcw,
  Minus,
  Circle,
  Square,
  Triangle,
  Star,
  Palette,
  Layers,
  BarChart3,
  Zap,
  Eye,
  ChevronDown,
  ChevronRight,
  Copy,
  Shuffle
} from 'lucide-react'
import { 
  SymbologyMode, 
  SymbologyConfig, 
  RangeColorConfig,
  useLayerSymbology 
} from '@/hooks/useLayerSymbology'

interface LayerSymbologyModalProps {
  isOpen: boolean
  onClose: () => void
  layerId: string
  layerName: string
  layerData: any
  layerConfig?: any
  onApplyChanges?: (layerId: string) => void
}

// Paletas de colores predefinidas para diferentes tipos de representación
const COLOR_PALETTES = {
  sequential: {
    'Blues': ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    'Greens': ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    'Oranges': ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    'Reds': ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    'Purples': ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    'Greys': ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000']
  },
  diverging: {
    'RdYlBu': ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    'RdBu': ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    'PiYG': ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    'BrBG': ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30']
  },
  qualitative: {
    'Set1': ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
    'Set2': ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
    'Set3': ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    'Paired': ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928']
  }
}

// Patrones de clasificación de datos
const CLASSIFICATION_METHODS = {
  'equal-interval': 'Intervalos Iguales',
  'quantile': 'Cuantiles',
  'natural-breaks': 'Jenks (Natural Breaks)',
  'standard-deviation': 'Desviación Estándar',
  'manual': 'Manual'
}

const LayerSymbologyModal: React.FC<LayerSymbologyModalProps> = ({
  isOpen,
  onClose,
  layerId,
  layerName,
  layerData,
  layerConfig,
  onApplyChanges
}) => {
  // Estados principales
  const [selectedAttribute, setSelectedAttribute] = useState<string>('')
  const [numRanges, setNumRanges] = useState(5)
  const [classificationMethod, setClassificationMethod] = useState<string>('equal-interval')
  
  // Estados para interfaz avanzada
  const [selectedPalette, setSelectedPalette] = useState<string>('Blues')
  const [paletteType, setPaletteType] = useState<'sequential' | 'diverging' | 'qualitative'>('sequential')
  const [reversePalette, setReversePalette] = useState(false)
  const [previewMode, setPreviewMode] = useState(true)
  
  // Estados para secciones colapsibles
  const [collapsedSections, setCollapsedSections] = useState({
    appearance: false,
    classification: false,
    advanced: true,
    preview: false
  })
  
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
    symbologyState,
    pendingChanges,
    lastUpdateTimestamp
  } = useLayerSymbology()

  // Estado local para forzar re-renders
  const [modalKey, setModalKey] = useState(0)

  // Efecto para reinicializar cuando se abre el modal
  useEffect(() => {
    if (isOpen && layerId) {
      setModalKey(prev => prev + 1)
      discardPendingChanges(layerId)
    }
  }, [isOpen, layerId, discardPendingChanges])

  // Obtener atributos disponibles para la capa
  const availableAttributes = useMemo(() => {
    if (!layerData) return []

    let attributes: string[] = []
    
    try {
      if (layerData.features && Array.isArray(layerData.features)) {
        const firstFeature = layerData.features[0]
        if (firstFeature && firstFeature.properties) {
          attributes = Object.keys(firstFeature.properties)
        }
      } else if (Array.isArray(layerData) && layerData.length > 0) {
        attributes = Object.keys(layerData[0]).filter(key => 
          !['lat', 'lng', 'geometry', '_id'].includes(key)
        )
      }

      return attributes.filter(attr => attr && typeof attr === 'string')
    } catch (error) {
      console.error('Error obteniendo atributos:', error)
      return []
    }
  }, [layerData, layerId])

  // Obtener configuración actual de la capa
  const currentConfig = useMemo(() => {
    try {
      const config = getLayerSymbology(layerId, true, layerConfig?.color)
      return config
    } catch (error) {
      console.error('Error obteniendo configuración actual:', error)
      return {
        mode: 'fixed' as SymbologyMode,
        fixedColor: layerConfig?.color || '#3B82F6',
        opacity: 0.7,
        strokeWidth: 2,
        strokeColor: layerConfig?.color || '#1D4ED8',
        lineStyle: 'solid' as const,
        lineCap: 'round' as const,
        lineJoin: 'round' as const,
        pointSize: 8,
        pointShape: 'circle' as const,
        categoryColors: undefined,
        rangeColors: undefined,
        iconMappings: undefined,
        attribute: undefined
      }
    }
  }, [layerId, getLayerSymbology, layerConfig?.color, lastUpdateTimestamp])

  // Detectar tipo de geometría principal de la capa
  const getLayerGeometryType = (data: any) => {
    if (!data?.features) return 'unknown'
    
    const geometryTypes = data.features.map((f: any) => f.geometry?.type).filter(Boolean)
    const mostCommon = geometryTypes.reduce((a: any, b: any) => 
      geometryTypes.filter((v: any) => v === a).length >= geometryTypes.filter((v: any) => v === b).length ? a : b
    )
    
    return mostCommon || 'unknown'
  }

  const geometryType = useMemo(() => {
    return getLayerGeometryType(layerData)
  }, [layerData])

  // Aplicar cambios
  const handleApplyChanges = () => {
    try {
      if (!pendingChanges[layerId]) {
        onClose()
        return
      }
      
      applyPendingChanges(layerId)
      
      setTimeout(() => {
        if (onApplyChanges) {
          onApplyChanges(layerId)
        }
        onClose()
      }, 100)
      
    } catch (error) {
      console.error('Error aplicando cambios de simbología:', error)
    }
  }

  // Descartar cambios
  const handleDiscardChanges = () => {
    discardPendingChanges(layerId)
    onClose()
  }

  // Cerrar modal con confirmación si hay cambios pendientes
  const handleCloseModal = () => {
    if (hasPendingChanges(layerId)) {
      const confirmDiscard = window.confirm(
        '¿Estás seguro de cerrar sin aplicar los cambios? Se perderán todas las modificaciones.'
      )
      if (confirmDiscard) {
        handleDiscardChanges()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 symbology-modal-overlay"
        onClick={handleCloseModal}
        style={{ zIndex: 9999 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-[10000] symbology-modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: 10000 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Configuración de Simbología
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {layerName} • {geometryType}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
            
            {/* Selector de modo - Versión profesional estilo ArcGIS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Settings className="w-4 h-4 inline mr-2" />
                  Método de Simbolización
                </label>
                {previewMode && (
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-3 h-3" />
                    Vista previa activa
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { 
                    mode: 'fixed' as SymbologyMode, 
                    label: 'Símbolo único', 
                    icon: <Circle className="w-4 h-4" />, 
                    desc: 'Utiliza el mismo símbolo para todas las entidades',
                    color: 'bg-blue-50 border-blue-200 text-blue-700'
                  },
                  { 
                    mode: 'categories' as SymbologyMode, 
                    label: 'Valores únicos', 
                    icon: <Tag className="w-4 h-4" />, 
                    desc: 'Asigna un símbolo diferente a cada valor único',
                    color: 'bg-green-50 border-green-200 text-green-700'
                  },
                  { 
                    mode: 'ranges' as SymbologyMode, 
                    label: 'Valores graduados', 
                    icon: <BarChart3 className="w-4 h-4" />, 
                    desc: 'Clasifica datos numéricos en rangos de valores',
                    color: 'bg-purple-50 border-purple-200 text-purple-700'
                  }
                ].map(({ mode, label, icon, desc, color }) => (
                  <button
                    key={mode}
                    onClick={() => updatePendingChanges(layerId, { mode })}
                    className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                      currentConfig.mode === mode
                        ? `${color} border-opacity-100 shadow-sm`
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{label}</div>
                        <p className="text-xs opacity-80 mt-1 leading-relaxed">{desc}</p>
                      </div>
                      {currentConfig.mode === mode && (
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color fijo - Versión simplificada */}
            {currentConfig.mode === 'fixed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Símbolo Único
                  </span>
                </div>
                <div className="pl-6 border-l-2 border-blue-200 dark:border-blue-600 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color principal
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={currentConfig.fixedColor || '#3B82F6'}
                        onChange={(e) => updatePendingChanges(layerId, { fixedColor: e.target.value })}
                        className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer shadow-sm"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={currentConfig.fixedColor || '#3B82F6'}
                          onChange={(e) => updatePendingChanges(layerId, { fixedColor: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                          placeholder="#RRGGBB"
                        />
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(currentConfig.fixedColor || '#3B82F6')}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Copiar color"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Controles avanzados básicos */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Propiedades Avanzadas
                </span>
              </div>
              
              <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-600">
                {/* Opacidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transparencia: {Math.round((1 - (currentConfig.opacity || 0.7)) * 100)}%
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Opaco</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentConfig.opacity || 0.7}
                      onChange={(e) => updatePendingChanges(layerId, { opacity: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500">Transparente</span>
                  </div>
                </div>

                {/* Grosor del contorno */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grosor del contorno: {currentConfig.strokeWidth || 2}px
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="0.5"
                      value={currentConfig.strokeWidth || 2}
                      onChange={(e) => updatePendingChanges(layerId, { strokeWidth: parseFloat(e.target.value) })}
                      className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="8"
                      step="0.5"
                      value={currentConfig.strokeWidth || 2}
                      onChange={(e) => updatePendingChanges(layerId, { strokeWidth: parseFloat(e.target.value) || 2 })}
                      className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de cambios pendientes */}
            {hasPendingChanges(layerId) && (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <Zap className="w-4 h-4" />
                Hay cambios pendientes sin aplicar
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => resetLayerSymbology(layerId)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar por defecto
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleDiscardChanges}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleApplyChanges}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg transition-colors apply-button"
              >
                <Check className="w-4 h-4" />
                Aplicar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}

export default LayerSymbologyModal
