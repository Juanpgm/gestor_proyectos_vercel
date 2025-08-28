'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Hash
} from 'lucide-react'
import { 
  SymbologyMode, 
  SymbologyConfig, 
  RangeColorConfig,
  useLayerSymbology 
} from '@/hooks/useLayerSymbology'
import SymbologyDiagnostics from './SymbologyDiagnostics'

interface LayerSymbologyModalProps {
  isOpen: boolean
  onClose: () => void
  layerId: string
  layerName: string
  layerData: any
  layerConfig?: any // Agregar configuración actual de la capa
  onApplyChanges?: (layerId: string) => void
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
    symbologyState,
    pendingChanges,
    lastUpdateTimestamp
  } = useLayerSymbology()

  // Estado local para forzar re-renders
  const [modalKey, setModalKey] = useState(0)

  // Efecto para reinicializar cuando se abre el modal
  useEffect(() => {
    if (isOpen && layerId) {
      console.log(`🔓 Modal abierto para: ${layerId}`)
      setModalKey(prev => prev + 1)
      
      // Limpiar cualquier cambio pendiente al abrir
      discardPendingChanges(layerId)
      
      console.log('🔍 Estado inicial de simbología:', symbologyState[layerId])
    }
  }, [isOpen, layerId, discardPendingChanges, symbologyState])

  // Obtener atributos disponibles para la capa
  const availableAttributes = useMemo(() => {
    if (!layerData) {
      console.log('⚠️ No hay datos de capa disponibles para', layerId)
      return []
    }

    let attributes: string[] = []
    
    try {
      // Para datos GeoJSON
      if (layerData.features && Array.isArray(layerData.features)) {
        const firstFeature = layerData.features[0]
        if (firstFeature && firstFeature.properties) {
          attributes = Object.keys(firstFeature.properties)
        }
      }
      // Para arrays de puntos
      else if (Array.isArray(layerData) && layerData.length > 0) {
        attributes = Object.keys(layerData[0]).filter(key => 
          !['lat', 'lng', 'geometry', '_id'].includes(key)
        )
      }

      const validAttributes = attributes.filter(attr => attr && typeof attr === 'string')
      console.log('📋 Atributos disponibles para', layerId, ':', validAttributes)
      return validAttributes
    } catch (error) {
      console.error('❌ Error obteniendo atributos:', error)
      return []
    }
  }, [layerData, layerId])

  // Obtener configuración actual de la capa
  const currentConfig = useMemo(() => {
    try {
      // Forzar recálculo siempre que sea necesario
      const config = getLayerSymbology(layerId, true, layerConfig?.color)
      console.log('🔄 Modal: Recalculando configuración actual para', layerId, config)
      return config
    } catch (error) {
      console.error('❌ Error obteniendo configuración actual:', error)
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
  }, [layerId, getLayerSymbology, layerConfig?.color, lastUpdateTimestamp]) // Usar timestamp para detectar cambios

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

  // Inicializar simbología cuando se abre el modal
  useEffect(() => {
    if (isOpen && layerConfig) {
      try {
        console.log('🚀 Inicializando modal de simbología para:', layerId, 'con config:', layerConfig)
        
        const currentSymbology = getLayerSymbology(layerId, true, layerConfig.color)
        
        // Solo inicializar si no existe configuración previa o si el color fijo coincide con el por defecto
        const hasCustomConfig = symbologyState[layerId] && 
                               symbologyState[layerId].fixedColor && 
                               symbologyState[layerId].fixedColor !== '#3B82F6'
        
        if (!hasCustomConfig) {
          console.log(`🎨 Inicializando simbología para ${layerId} con color: ${layerConfig.color}`)
          updatePendingChanges(layerId, {
            mode: 'fixed',
            fixedColor: layerConfig.color || '#3B82F6',
            opacity: layerConfig.opacity || 0.7,
            strokeWidth: 2,
            strokeColor: layerConfig.color || '#3B82F6',
            lineStyle: 'solid',
            lineCap: 'round',
            lineJoin: 'round',
            pointSize: 8,
            pointShape: 'circle'
          })
        } else {
          // Si ya hay configuración, asegurar que los cambios pendientes reflejen la configuración actual
          console.log(`🔄 Cargando simbología existente para ${layerId}:`, currentSymbology)
          updatePendingChanges(layerId, {
            ...currentSymbology
          })
        }
      } catch (error) {
        console.error('❌ Error inicializando modal de simbología:', error)
        // Configuración de emergencia
        updatePendingChanges(layerId, {
          mode: 'fixed',
          fixedColor: '#3B82F6',
          opacity: 0.7,
          strokeWidth: 2,
          strokeColor: '#3B82F6',
          lineStyle: 'solid',
          lineCap: 'round',
          lineJoin: 'round',
          pointSize: 8,
          pointShape: 'circle'
        })
      }
    }
  }, [isOpen, layerId, layerConfig, getLayerSymbology, updatePendingChanges, symbologyState])

  // Actualizar modo de simbología
  const handleModeChange = (mode: SymbologyMode) => {
    updatePendingChanges(layerId, { mode })
    
    // Resetear configuraciones específicas del modo anterior
    if (mode !== 'categories') {
      updatePendingChanges(layerId, { categoryColors: undefined })
    }
    if (mode !== 'ranges') {
      updatePendingChanges(layerId, { rangeColors: undefined })
    }
    if (mode !== 'icons') {
      updatePendingChanges(layerId, { iconMappings: undefined })
    }
  }

  // Actualizar atributo seleccionado
  const handleAttributeChange = (attribute: string) => {
    setSelectedAttribute(attribute)
    updatePendingChanges(layerId, { attribute })
    
    const config = getLayerSymbology(layerId, true, layerConfig?.color)
    
    // Generar configuraciones automáticas según el modo
    if (config.mode === 'categories') {
      const uniqueValues = getUniqueAttributeValues(layerData, attribute)
      const categoryColors = generateCategoryColors(uniqueValues)
      updatePendingChanges(layerId, { categoryColors })
    } else if (config.mode === 'ranges') {
      const numericValues = getNumericAttributeValues(layerData, attribute)
      const rangeColors = generateRanges(numericValues, numRanges)
      updatePendingChanges(layerId, { rangeColors })
    }
  }

  // Actualizar color fijo
  const handleFixedColorChange = (color: string) => {
    console.log(`🎨 Cambiando color fijo a: ${color} para capa: ${layerId}`)
    updatePendingChanges(layerId, { fixedColor: color })
    console.log('✅ Color actualizado en pendingChanges')
  }

  // Actualizar color de categoría
  const handleCategoryColorChange = (category: string, color: string) => {
    const currentConfig = getLayerSymbology(layerId, true, layerConfig?.color)
    if (!currentConfig?.categoryColors) return
    
    const newCategoryColors = {
      ...currentConfig.categoryColors,
      [category]: color
    }
    updatePendingChanges(layerId, { categoryColors: newCategoryColors })
  }

  // Actualizar color de rango
  const handleRangeColorChange = (rangeIndex: number, color: string) => {
    const currentConfig = getLayerSymbology(layerId, true, layerConfig?.color)
    if (!currentConfig?.rangeColors) return
    
    const newRangeColors = currentConfig.rangeColors.map((range, index) => 
      index === rangeIndex ? { ...range, color } : range
    )
    updatePendingChanges(layerId, { rangeColors: newRangeColors })
  }

  // Regenerar rangos
  const handleRegenerateRanges = () => {
    if (!selectedAttribute) return
    
    const numericValues = getNumericAttributeValues(layerData, selectedAttribute)
    const rangeColors = generateRanges(numericValues, numRanges)
    updatePendingChanges(layerId, { rangeColors })
  }

  // Aplicar cambios - VERSIÓN MEJORADA
  const handleApplyChanges = () => {
    try {
      console.log(`🔥 MODAL: Aplicando cambios para ${layerId}`)
      console.log('📊 Cambios pendientes antes:', pendingChanges[layerId])
      
      // Si no hay cambios pendientes, simplemente cerrar
      if (!pendingChanges[layerId]) {
        console.log('⚠️ No hay cambios pendientes para aplicar')
        onClose()
        return
      }
      
      // 1. Aplicar cambios al estado de simbología
      applyPendingChanges(layerId)
      
      // 2. Dar tiempo al estado para propagarse antes de notificar al padre
      setTimeout(() => {
        console.log('📊 Estado después de aplicar:', symbologyState[layerId])
        
        // 3. Notificar al componente padre para re-renderizar el mapa
        if (onApplyChanges) {
          onApplyChanges(layerId)
        }
        
        // 4. Cerrar modal después de aplicar
        onClose()
        
        console.log(`✅ Simbología aplicada exitosamente para: ${layerId}`)
      }, 100) // Pequeño delay para asegurar propagación del estado
      
    } catch (error) {
      console.error('❌ Error aplicando cambios de simbología:', error)
      // Mantener el modal abierto en caso de error para que el usuario pueda reintentar
    }
  }

  // Descartar cambios - VERSIÓN MEJORADA
  const handleDiscardChanges = () => {
    console.log(`❌ Descartando cambios para: ${layerId}`)
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
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden relative z-[10000] symbology-modal-content"
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
            
            {/* Diagnóstico de depuración MEJORADO */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-3">
                <SymbologyDiagnostics
                  layerId={layerId}
                  layerData={layerData}
                  layerConfig={layerConfig}
                  symbologyState={symbologyState}
                  pendingChanges={pendingChanges}
                />
                
                {/* Estado en tiempo real */}
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <h5 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Estado del Modal</h5>
                  <div className="text-xs font-mono space-y-1 text-yellow-700 dark:text-yellow-300">
                    <div>⏰ Timestamp: {lastUpdateTimestamp}</div>
                    <div>🔧 Modal Key: {modalKey}</div>
                    <div>📋 Cambios Pendientes: {hasPendingChanges(layerId) ? '✅ SÍ' : '❌ NO'}</div>
                    <div>⚙️ Modo Actual: {currentConfig.mode}</div>
                    <div>🎨 Color Actual: {currentConfig.fixedColor || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Selector de modo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Settings className="w-4 h-4 inline mr-2" />
                Modo de Simbología
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { mode: 'fixed' as SymbologyMode, label: 'Color Fijo', icon: '🎨', desc: 'Un solo color para todos los elementos' },
                  { mode: 'categories' as SymbologyMode, label: 'Categorías', icon: '📊', desc: 'Colores por valores únicos' },
                  { mode: 'ranges' as SymbologyMode, label: 'Rangos', icon: '📈', desc: 'Colores por rangos numéricos' },
                  { mode: 'icons' as SymbologyMode, label: 'Iconos', icon: '📍', desc: 'Iconos personalizados' }
                ].map(({ mode, label, icon, desc }) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      currentConfig.mode === mode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{icon}</span>
                      <span className="font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de atributo */}
            {(currentConfig.mode === 'categories' || currentConfig.mode === 'ranges' || currentConfig.mode === 'icons') && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Atributo de Clasificación
                </label>
                <select
                  value={selectedAttribute}
                  onChange={(e) => handleAttributeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Color Principal
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentConfig.fixedColor || '#3B82F6'}
                    onChange={(e) => handleFixedColorChange(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Colores por Categoría
                </label>
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {Object.entries(currentConfig.categoryColors).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleCategoryColorChange(category, e.target.value)}
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
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
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Rangos Numéricos
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Número de rangos:</span>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={numRanges}
                      onChange={(e) => setNumRanges(parseInt(e.target.value) || 5)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      onClick={handleRegenerateRanges}
                      className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Regenerar rangos"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {currentConfig.rangeColors && currentConfig.rangeColors.length > 0 ? (
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {currentConfig.rangeColors.map((range, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <input
                          type="color"
                          value={range.color}
                          onChange={(e) => handleRangeColorChange(index, e.target.value)}
                          className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                          {range.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                    Selecciona un atributo numérico para generar rangos
                  </div>
                )}
              </div>
            )}

            {/* Controles generales */}
            <div className="space-y-4">
              {/* Opacidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Opacidad: {Math.round((currentConfig.opacity || 0.7) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={currentConfig.opacity || 0.7}
                  onChange={(e) => updatePendingChanges(layerId, { opacity: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Grosor del borde */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Grosor: {currentConfig.strokeWidth || 2}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={currentConfig.strokeWidth || 2}
                  onChange={(e) => updatePendingChanges(layerId, { strokeWidth: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Controles específicos para líneas */}
              {geometryType === 'LineString' && (
                <>
                  {/* Estilo de línea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Estilo de Línea
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'solid', label: 'Sólida', icon: <Minus className="w-4 h-4" /> },
                        { value: 'dashed', label: 'Guiones', icon: <span className="text-sm">- - -</span> },
                        { value: 'dotted', label: 'Puntos', icon: <span className="text-sm">• • •</span> },
                        { value: 'dashdot', label: 'Mixta', icon: <span className="text-sm">-•-</span> }
                      ].map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => updatePendingChanges(layerId, { lineStyle: value as any })}
                          className={`p-3 text-sm rounded-lg border transition-all flex items-center gap-2 ${
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Terminaciones
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'butt', label: 'Plana' },
                        { value: 'round', label: 'Redonda' },
                        { value: 'square', label: 'Cuadrada' }
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updatePendingChanges(layerId, { lineCap: value as any })}
                          className={`p-2 text-sm rounded border transition-all ${
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
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Tamaño: {currentConfig.pointSize || 8}px
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="20"
                      step="1"
                      value={currentConfig.pointSize || 8}
                      onChange={(e) => updatePendingChanges(layerId, { pointSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Forma del punto */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Forma del Punto
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'circle', label: 'Círculo', icon: <Circle className="w-4 h-4" /> },
                        { value: 'square', label: 'Cuadrado', icon: <Square className="w-4 h-4" /> },
                        { value: 'triangle', label: 'Triángulo', icon: <Triangle className="w-4 h-4" /> },
                        { value: 'star', label: 'Estrella', icon: <Star className="w-4 h-4" /> }
                      ].map(({ value, label, icon }) => (
                        <button
                          key={value}
                          onClick={() => updatePendingChanges(layerId, { pointShape: value as any })}
                          className={`p-3 text-sm rounded-lg border transition-all flex items-center gap-2 ${
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

            {/* Indicador de cambios pendientes */}
            {hasPendingChanges(layerId) && (
              <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                ⚠️ Hay cambios pendientes sin aplicar
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

  // Renderizar el modal usando portal para asegurar que esté en el nivel más alto del DOM
  if (!isOpen) return null

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}

export default LayerSymbologyModal
