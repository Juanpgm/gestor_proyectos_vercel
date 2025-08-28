'use client'

import { useState, useCallback, useEffect } from 'react'

// Interfaces para la configuración de capas
export interface LayerConfig {
  id: string
  name: string
  visible: boolean
  opacity: number
  color: string
  icon: string
  representationMode: 'clase_obra' | 'tipo_intervencion' | 'estado' | 'novedad'
  data?: any
  type: 'geojson' | 'points'
  customStyles?: any
  lastUpdated?: number
  categorization?: {
    type: string
    property: string
    config: any
  }
}

export interface LayerFilters {
  search?: string
  categoria?: string[]
  estado?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
}

// Hook principal para gestión unificada de capas
export function useUnifiedLayerManagement() {
  // Estado principal de las capas
  const [layers, setLayers] = useState<LayerConfig[]>([
    {
      id: 'equipamientos',
      name: 'Equipamientos',
      visible: true,
      opacity: 0.8,
      color: '#10B981',
      icon: '🏢',
      representationMode: 'clase_obra',
      type: 'geojson'
    },
    {
      id: 'infraestructura_vial',
      name: 'Infraestructura Vial',
      visible: true,
      opacity: 0.8,
      color: '#F59E0B',
      icon: '🛣️',
      representationMode: 'tipo_intervencion',
      type: 'geojson'
    },
    {
      id: 'centros_gravedad_unificado',
      name: 'Centros de Gravedad',
      visible: true,
      opacity: 0.8,
      color: '#8B5CF6',
      icon: '🎯',
      representationMode: 'estado',
      type: 'geojson'
    }
  ])

  // Estado de filtros activos
  const [layerFilters, setLayerFilters] = useState<LayerFilters>({})

  // Estado de configuración de mapa base
  const [baseMapConfig, setBaseMapConfig] = useState({
    type: 'light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  })

  // Persistir configuración en localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('unifiedMapConfig')
    if (savedConfig) {
      try {
        const { layers: savedLayers, baseMap } = JSON.parse(savedConfig)
        if (savedLayers) setLayers(savedLayers)
        if (baseMap) setBaseMapConfig(baseMap)
      } catch (error) {
        console.warn('Error loading saved map config:', error)
      }
    }
  }, [])

  // Guardar configuración cuando cambie
  useEffect(() => {
    const config = {
      layers,
      baseMap: baseMapConfig
    }
    localStorage.setItem('unifiedMapConfig', JSON.stringify(config))
  }, [layers, baseMapConfig])

  // Funciones para gestión de capas
  const updateLayer = useCallback((layerId: string, updates: Partial<LayerConfig>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, ...updates, lastUpdated: Date.now() }
        : layer
    ))
  }, [])

  const toggleLayerVisibility = useCallback((layerId: string) => {
    updateLayer(layerId, { 
      visible: !layers.find(l => l.id === layerId)?.visible 
    })
  }, [layers, updateLayer])

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity: Math.max(0, Math.min(1, opacity)) })
  }, [updateLayer])

  const updateLayerColor = useCallback((layerId: string, color: string) => {
    updateLayer(layerId, { color })
  }, [updateLayer])

  const updateLayerRepresentationMode = useCallback((layerId: string, mode: LayerConfig['representationMode']) => {
    updateLayer(layerId, { representationMode: mode })
  }, [updateLayer])

  const addLayer = useCallback((layerConfig: Omit<LayerConfig, 'lastUpdated'>) => {
    setLayers(prev => [...prev, { ...layerConfig, lastUpdated: Date.now() }])
  }, [])

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId))
  }, [])

  const resetLayersToDefault = useCallback(() => {
    setLayers([
      {
        id: 'equipamientos',
        name: 'Equipamientos',
        visible: true,
        opacity: 0.8,
        color: '#10B981',
        icon: '🏢',
        representationMode: 'clase_obra',
        type: 'geojson',
        lastUpdated: Date.now()
      },
      {
        id: 'infraestructura_vial',
        name: 'Infraestructura Vial',
        visible: true,
        opacity: 0.8,
        color: '#F59E0B',
        icon: '🛣️',
        representationMode: 'tipo_intervencion',
        type: 'geojson',
        lastUpdated: Date.now()
      },
      {
        id: 'centros_gravedad_unificado',
        name: 'Centros de Gravedad',
        visible: true,
        opacity: 0.8,
        color: '#8B5CF6',
        icon: '🎯',
        representationMode: 'estado',
        type: 'geojson',
        lastUpdated: Date.now()
      }
    ])
  }, [])

  // Funciones para gestión de datos de capas
  const updateLayerData = useCallback((layerId: string, data: any) => {
    updateLayer(layerId, { data })
  }, [updateLayer])

  const getLayerById = useCallback((layerId: string) => {
    return layers.find(layer => layer.id === layerId)
  }, [layers])

  const getVisibleLayers = useCallback(() => {
    return layers.filter(layer => layer.visible)
  }, [layers])

  const getLayerStats = useCallback(() => {
    const visible = layers.filter(l => l.visible).length
    const total = layers.length
    const dataLoaded = layers.filter(l => l.data).length
    
    return {
      total,
      visible,
      hidden: total - visible,
      dataLoaded,
      dataNotLoaded: total - dataLoaded
    }
  }, [layers])

  // Funciones para gestión de filtros
  const updateFilters = useCallback((newFilters: Partial<LayerFilters>) => {
    setLayerFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setLayerFilters({})
  }, [])

  // Función para aplicar filtros a los datos
  const getFilteredData = useCallback((layerId: string) => {
    const layer = getLayerById(layerId)
    if (!layer?.data) return null

    let filteredData = layer.data

    // Aplicar filtros si están definidos
    if (layerFilters.search) {
      // Filtrar por texto de búsqueda
      if (filteredData.features) {
        filteredData = {
          ...filteredData,
          features: filteredData.features.filter((feature: any) => {
            const searchFields = Object.values(feature.properties || {}).join(' ').toLowerCase()
            return searchFields.includes(layerFilters.search!.toLowerCase())
          })
        }
      }
    }

    if (layerFilters.categoria && layerFilters.categoria.length > 0) {
      // Filtrar por categoría
      if (filteredData.features) {
        filteredData = {
          ...filteredData,
          features: filteredData.features.filter((feature: any) => {
            const categoria = feature.properties?.clase_obra || feature.properties?.tipo_intervencion || ''
            return layerFilters.categoria!.includes(categoria)
          })
        }
      }
    }

    if (layerFilters.estado && layerFilters.estado.length > 0) {
      // Filtrar por estado
      if (filteredData.features) {
        filteredData = {
          ...filteredData,
          features: filteredData.features.filter((feature: any) => {
            const estado = feature.properties?.estado_unidad_proyecto || ''
            return layerFilters.estado!.includes(estado)
          })
        }
      }
    }

    return filteredData
  }, [layerFilters, getLayerById])

  // Funciones para gestión de mapa base
  const updateBaseMap = useCallback((type: string, url: string, attribution: string) => {
    setBaseMapConfig({ type, url, attribution })
  }, [])

  return {
    // Estado
    layers,
    layerFilters,
    baseMapConfig,
    
    // Funciones de gestión de capas
    updateLayer,
    toggleLayerVisibility,
    updateLayerOpacity,
    updateLayerColor,
    updateLayerRepresentationMode,
    addLayer,
    removeLayer,
    resetLayersToDefault,
    
    // Funciones de gestión de datos
    updateLayerData,
    getLayerById,
    getVisibleLayers,
    getLayerStats,
    getFilteredData,
    
    // Funciones de filtros
    updateFilters,
    clearFilters,
    
    // Funciones de mapa base
    updateBaseMap,
    
    // Utilidades
    stats: getLayerStats()
  }
}

export default useUnifiedLayerManagement
