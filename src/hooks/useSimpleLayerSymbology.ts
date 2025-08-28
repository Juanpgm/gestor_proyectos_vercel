'use client'

import { useState, useCallback } from 'react'

// Tipos simplificados para simbología básica
export type SymbologyMode = 'fixed' | 'categories' | 'ranges'

export interface SimpleSymbologyConfig {
  mode: SymbologyMode
  color: string
  opacity: number
  strokeWidth: number
}

interface LayerSymbologyState {
  [layerId: string]: SimpleSymbologyConfig
}

export const useSimpleLayerSymbology = () => {
  const [symbologyState, setSymbologyState] = useState<LayerSymbologyState>({})

  const updateLayerSymbology = useCallback((layerId: string, config: Partial<SimpleSymbologyConfig>) => {
    setSymbologyState(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        ...config
      }
    }))
  }, [])

  const getLayerSymbology = useCallback((layerId: string, defaultColor?: string): SimpleSymbologyConfig => {
    return symbologyState[layerId] || {
      mode: 'fixed',
      color: defaultColor || '#3B82F6',
      opacity: 0.8,
      strokeWidth: 2
    }
  }, [symbologyState])

  const resetLayerSymbology = useCallback((layerId: string) => {
    setSymbologyState(prev => {
      const newState = { ...prev }
      delete newState[layerId]
      return newState
    })
  }, [])

  return {
    updateLayerSymbology,
    getLayerSymbology,
    resetLayerSymbology
  }
}
