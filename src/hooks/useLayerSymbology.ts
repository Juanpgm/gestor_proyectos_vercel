'use client'

import { useState, useCallback, useMemo } from 'react'

// Tipos para la simbología
export type SymbologyMode = 'fixed' | 'categories' | 'ranges' | 'icons'

export interface SymbologyConfig {
  mode: SymbologyMode
  attribute?: string
  fixedColor?: string
  categoryColors?: Record<string, string>
  rangeColors?: RangeColorConfig[]
  iconMappings?: Record<string, string>
  opacity?: number
  strokeWidth?: number
  strokeColor?: string
  // Nuevas propiedades para líneas
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'dashdot'
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
  // Para puntos
  pointSize?: number
  pointShape?: 'circle' | 'square' | 'triangle' | 'star'
}

export interface RangeColorConfig {
  min: number
  max: number
  color: string
  label: string
}

export interface LayerSymbologyState {
  [layerId: string]: SymbologyConfig
}

export interface PendingChangesState {
  [layerId: string]: SymbologyConfig
}

// Paleta de colores por defecto para categorías
const DEFAULT_CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
]

// Iconos predefinidos para puntos
const DEFAULT_ICONS = {
  'Educación': '🏫',
  'Salud': '🏥',
  'Deporte': '⚽',
  'Cultura': '🎭',
  'Parque': '🌳',
  'Seguridad': '🚓',
  'default': '📍'
}

export const useLayerSymbology = () => {
  const [symbologyState, setSymbologyState] = useState<LayerSymbologyState>({})
  const [pendingChanges, setPendingChanges] = useState<PendingChangesState>({})

  // Función para actualizar cambios pendientes (no aplicados aún)
  const updatePendingChanges = useCallback((layerId: string, config: Partial<SymbologyConfig>) => {
    setPendingChanges(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        ...config
      }
    }))
  }, [])

  // Función para aplicar cambios pendientes
  const applyPendingChanges = useCallback((layerId?: string) => {
    if (layerId) {
      // Aplicar cambios de una capa específica
      const pendingConfig = pendingChanges[layerId]
      if (pendingConfig) {
        setSymbologyState(prev => ({
          ...prev,
          [layerId]: pendingConfig
        }))
        setPendingChanges(prev => {
          const newPending = { ...prev }
          delete newPending[layerId]
          return newPending
        })
      }
    } else {
      // Aplicar todos los cambios pendientes
      setSymbologyState(prev => ({
        ...prev,
        ...pendingChanges
      }))
      setPendingChanges({})
    }
  }, [pendingChanges])

  // Función para descartar cambios pendientes
  const discardPendingChanges = useCallback((layerId?: string) => {
    if (layerId) {
      setPendingChanges(prev => {
        const newPending = { ...prev }
        delete newPending[layerId]
        return newPending
      })
    } else {
      setPendingChanges({})
    }
  }, [])

  // Verificar si hay cambios pendientes
  const hasPendingChanges = useCallback((layerId?: string) => {
    if (layerId) {
      return !!pendingChanges[layerId]
    }
    return Object.keys(pendingChanges).length > 0
  }, [pendingChanges])

  // Función para actualizar la configuración de simbología de una capa (DEPRECATED - usar updatePendingChanges)
  const updateLayerSymbology = useCallback((layerId: string, config: Partial<SymbologyConfig>) => {
    setSymbologyState(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        ...config
      }
    }))
  }, [])

  // Función para obtener la configuración de una capa (incluyendo cambios pendientes)
  const getLayerSymbology = useCallback((layerId: string, includePending: boolean = false, defaultColor?: string): SymbologyConfig => {
    const appliedConfig = symbologyState[layerId] || {
      mode: 'fixed',
      fixedColor: defaultColor || '#3B82F6',
      opacity: 0.7,
      strokeWidth: 2,
      strokeColor: defaultColor || '#1D4ED8',
      lineStyle: 'solid',
      lineCap: 'round',
      lineJoin: 'round',
      pointSize: 8,
      pointShape: 'circle'
    }
    
    if (includePending && pendingChanges[layerId]) {
      return {
        ...appliedConfig,
        ...pendingChanges[layerId]
      }
    }
    
    return appliedConfig
  }, [symbologyState, pendingChanges])

  // Función para generar colores automáticos por categorías
  const generateCategoryColors = useCallback((values: (string | number)[]): Record<string, string> => {
    const uniqueValues = Array.from(new Set(values.filter(v => v !== null && v !== undefined)))
    const categoryColors: Record<string, string> = {}
    
    uniqueValues.forEach((value, index) => {
      categoryColors[String(value)] = DEFAULT_CATEGORY_COLORS[index % DEFAULT_CATEGORY_COLORS.length]
    })
    
    return categoryColors
  }, [])

  // Función para generar rangos automáticos
  const generateRanges = useCallback((values: number[], numRanges: number = 5): RangeColorConfig[] => {
    const validValues = values.filter(v => typeof v === 'number' && !isNaN(v))
    if (validValues.length === 0) return []
    
    const min = Math.min(...validValues)
    const max = Math.max(...validValues)
    const step = (max - min) / numRanges
    
    const ranges: RangeColorConfig[] = []
    const colors = ['#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706'] // Gradiente amarillo-naranja
    
    for (let i = 0; i < numRanges; i++) {
      const rangeMin = min + (step * i)
      const rangeMax = i === numRanges - 1 ? max : min + (step * (i + 1))
      
      ranges.push({
        min: rangeMin,
        max: rangeMax,
        color: colors[i % colors.length],
        label: `${rangeMin.toFixed(1)} - ${rangeMax.toFixed(1)}`
      })
    }
    
    return ranges
  }, [])

  // Función principal para obtener el estilo de una feature
  const getFeatureStyle = useCallback((feature: any, layerId: string, geometryType: string = 'unknown', includePending: boolean = false) => {
    const config = getLayerSymbology(layerId, includePending)
    const properties = feature.properties || {}
    
    // Estilo base
    let style: any = {
      weight: config.strokeWidth || 2,
      opacity: config.opacity || 0.7,
      fillOpacity: config.opacity || 0.7,
      color: config.strokeColor || '#1D4ED8',
      fillColor: config.fixedColor || '#3B82F6'
    }
    
    // Aplicar estilos según el modo
    switch (config.mode) {
      case 'fixed':
        // Color fijo - usar configuración base
        break
        
      case 'categories':
        if (config.attribute && config.categoryColors) {
          const attributeValue = String(properties[config.attribute] || '')
          const categoryColor = config.categoryColors[attributeValue]
          if (categoryColor) {
            style.fillColor = categoryColor
            style.color = categoryColor
          }
        }
        break
        
      case 'ranges':
        if (config.attribute && config.rangeColors) {
          const attributeValue = parseFloat(properties[config.attribute])
          if (!isNaN(attributeValue)) {
            const range = config.rangeColors.find((r: any) => attributeValue >= r.min && attributeValue <= r.max)
            if (range) {
              style.fillColor = range.color
              style.color = range.color
            }
          }
        }
        break
        
      case 'icons':
        // Los iconos se manejan en el componente del mapa
        break
    }
    
    // Ajustes específicos por tipo de geometría
    if (geometryType === 'LineString') {
      style.weight = config.strokeWidth || 4
      style.fillOpacity = 0 // Las líneas no tienen relleno
      
      // Aplicar estilo de línea
      switch (config.lineStyle) {
        case 'dashed':
          style.dashArray = '10, 10'
          break
        case 'dotted':
          style.dashArray = '2, 8'
          break
        case 'dashdot':
          style.dashArray = '10, 5, 2, 5'
          break
        default:
          style.dashArray = null
      }
      
      // Aplicar terminaciones de línea
      style.lineCap = config.lineCap || 'round'
      style.lineJoin = config.lineJoin || 'round'
      
    } else if (geometryType === 'Point') {
      style.weight = config.strokeWidth || 2
      style.opacity = 1
      style.radius = config.pointSize || 8
      
    } else if (geometryType === 'Polygon' || geometryType === 'MultiPolygon') {
      // Configuración específica para polígonos
      style.weight = config.strokeWidth || 2
    }
    
    return style
  }, [getLayerSymbology])

  // Función para obtener iconos personalizados para puntos
  const getFeatureIcon = useCallback((feature: any, layerId: string): string => {
    const config = getLayerSymbology(layerId)
    
    if (config.mode === 'icons' && config.attribute && config.iconMappings) {
      const properties = feature.properties || {}
      const attributeValue = String(properties[config.attribute] || '')
      return config.iconMappings[attributeValue] || DEFAULT_ICONS.default
    }
    
    return DEFAULT_ICONS.default
  }, [getLayerSymbology])

  // Función para extraer valores únicos de un atributo
  const getUniqueAttributeValues = useCallback((data: any, attribute: string) => {
    if (!data || !attribute) return []
    
    let values: any[] = []
    
    // Manejar datos GeoJSON
    if (data.features && Array.isArray(data.features)) {
      values = data.features
        .map((feature: any) => feature.properties?.[attribute])
        .filter((value: any) => value !== null && value !== undefined)
    }
    // Manejar arrays de puntos
    else if (Array.isArray(data)) {
      values = data
        .map((item: any) => item[attribute])
        .filter((value: any) => value !== null && value !== undefined)
    }
    
    return Array.from(new Set(values))
  }, [])

  // Función para extraer valores numéricos de un atributo
  const getNumericAttributeValues = useCallback((data: any, attribute: string): number[] => {
    const allValues = getUniqueAttributeValues(data, attribute)
    return allValues
      .map(v => parseFloat(String(v)))
      .filter(v => !isNaN(v))
  }, [getUniqueAttributeValues])

  // Función para resetear la simbología de una capa
  const resetLayerSymbology = useCallback((layerId: string) => {
    setSymbologyState(prev => {
      const newState = { ...prev }
      delete newState[layerId]
      return newState
    })
  }, [])

  return {
    symbologyState,
    pendingChanges,
    updateLayerSymbology,
    updatePendingChanges,
    applyPendingChanges,
    discardPendingChanges,
    hasPendingChanges,
    getLayerSymbology,
    getFeatureStyle,
    getFeatureIcon,
    getUniqueAttributeValues,
    getNumericAttributeValues,
    generateCategoryColors,
    generateRanges,
    resetLayerSymbology,
    DEFAULT_CATEGORY_COLORS,
    DEFAULT_ICONS
  }
}
