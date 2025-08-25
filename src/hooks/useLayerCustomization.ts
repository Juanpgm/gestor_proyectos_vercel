'use client'

import { useState, useEffect } from 'react'

export interface LayerConfig {
  id: string
  name: string
  visible: boolean
  opacity: number
  color: string
  icon: string
  type: 'geojson' | 'points'
}

export interface LayerCustomization {
  layers: LayerConfig[]
  updateLayer: (layerId: string, updates: Partial<LayerConfig>) => void
  toggleLayerVisibility: (layerId: string) => void
  changeLayerOpacity: (layerId: string, opacity: number) => void
  changeLayerColor: (layerId: string, color: string) => void
  changeLayerIcon: (layerId: string, icon: string) => void
  resetToDefaults: () => void
}

// Configuración por defecto de capas
const DEFAULT_LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'unidades_proyecto',
    name: 'Proyectos',
    visible: true,
    opacity: 0.8,
    color: '#3B82F6', // Azul
    icon: '📍',
    type: 'points'
  },
  {
    id: 'equipamientos',
    name: 'Equipamientos',
    visible: true,
    opacity: 0.8,
    color: '#10B981', // Verde
    icon: '🏢',
    type: 'geojson'
  },
  {
    id: 'infraestructura_vial',
    name: 'Infraestructura Vial',
    visible: true,
    opacity: 0.8,
    color: '#F59E0B', // Naranja
    icon: '🛣️',
    type: 'geojson'
  }
]

// Colores disponibles para personalización
export const AVAILABLE_COLORS = [
  '#10B981', // Verde
  '#F59E0B', // Naranja
  '#3B82F6', // Azul
  '#EF4444', // Rojo
  '#8B5CF6', // Púrpura
  '#06B6D4', // Cian
  '#F97316', // Naranja oscuro
  '#84CC16', // Lima
  '#EC4899', // Rosa
  '#6366F1', // Índigo
]

// Iconos disponibles para personalización
export const AVAILABLE_ICONS = [
  '🏢', '🛣️', '🏘️', '🏡', '🌳', '🌄', '📍', '⭐', '🔷', '🔶',
  '🟢', '🟡', '🔴', '🟣', '🔵', '🟠', '⚫', '⚪', '🔸', '🔹'
]

/**
 * Hook para gestionar la configuración personalizable de capas del mapa
 */
export function useLayerCustomization(): LayerCustomization {
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYER_CONFIGS)

  // Cargar configuración guardada del localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('mapLayerConfig')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        console.log('🎨 Configuración de capas cargada desde localStorage:', parsed)
        setLayers(parsed)
      } else {
        console.log('🎨 Usando configuración por defecto de capas:', DEFAULT_LAYER_CONFIGS)
        setLayers([...DEFAULT_LAYER_CONFIGS])
      }
    } catch (error) {
      console.warn('Error cargando configuración de capas:', error)
      console.log('🎨 Fallback a configuración por defecto')
      setLayers([...DEFAULT_LAYER_CONFIGS])
    }
  }, [])

  // Guardar configuración en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('mapLayerConfig', JSON.stringify(layers))
    } catch (error) {
      console.warn('Error guardando configuración de capas:', error)
    }
  }, [layers])

  const updateLayer = (layerId: string, updates: Partial<LayerConfig>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }

  const toggleLayerVisibility = (layerId: string) => {
    updateLayer(layerId, { visible: !layers.find(l => l.id === layerId)?.visible })
  }

  const changeLayerOpacity = (layerId: string, opacity: number) => {
    updateLayer(layerId, { opacity: Math.max(0, Math.min(1, opacity)) })
  }

  const changeLayerColor = (layerId: string, color: string) => {
    updateLayer(layerId, { color })
  }

  const changeLayerIcon = (layerId: string, icon: string) => {
    updateLayer(layerId, { icon })
  }

  const resetToDefaults = () => {
    setLayers([...DEFAULT_LAYER_CONFIGS])
    localStorage.removeItem('mapLayerConfig')
  }

  return {
    layers,
    updateLayer,
    toggleLayerVisibility,
    changeLayerOpacity,
    changeLayerColor,
    changeLayerIcon,
    resetToDefaults
  }
}
