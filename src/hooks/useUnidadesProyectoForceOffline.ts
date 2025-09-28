'use client'

import { useState, useEffect } from 'react'
import { allMockUnidadesProyecto, mockMetrics, type UnidadProyectoMock } from '@/data/mockUnidadesProyecto'

export interface UnidadProyectoFilters {
  search?: string
  bpin?: string
  upid?: string
  tipo_intervencion?: string
  clase_obra?: string
  estado?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  nombre_centro_gestor?: string
  fuente_financiacion?: string
  ano?: string
}

// HOOK COMPLETAMENTE DESCONECTADO - NO HAY API, NO HAY FETCH, NO HAY NADA
export function useUnidadesProyectoOffline(filters?: UnidadProyectoFilters) {
  const [state, setState] = useState({
    data: allMockUnidadesProyecto,
    metrics: mockMetrics,
    loading: false,
    error: null,
    totalCount: allMockUnidadesProyecto.length,
    lastUpdated: new Date().toISOString(),
    isOffline: true,
    dataSource: 'local-mock'
  })

  // NO useEffect que haga nada, solo devolver datos inmediatos
  
  return {
    ...state,
    refresh: () => {
      console.log('🔄 Refresh (offline mode - no action)')
    },
    applyFilters: (newFilters: UnidadProyectoFilters) => {
      console.log('🔍 Apply filters (offline mode - no action)', newFilters)
    }
  }
}

// Alias para compatibilidad
export const useUnidadesProyectoAPI = useUnidadesProyectoOffline