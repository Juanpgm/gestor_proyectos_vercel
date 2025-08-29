'use client'

import { useMemo } from 'react'
import { type UnidadProyecto } from './useUnidadesProyecto'

export interface MapFilters {
  search: string
  estado: string
  centroGestor: string[]
  comunas: string[]
  barrios: string[]
  corregimientos: string[]
  veredas: string[]
  fuentesFinanciamiento: string[]
  periodos: string[]
}

/**
 * Hook para filtrar datos de unidades de proyecto basado en filtros del dashboard
 */
export function useMapFilters(
  unidadesProyecto: UnidadProyecto[],
  filters: MapFilters
): UnidadProyecto[] {
  
  const filteredData = useMemo(() => {
    if (!unidadesProyecto || unidadesProyecto.length === 0) {
      return []
    }

    return unidadesProyecto.filter(unit => {
      // Filtro por búsqueda de texto
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase()
        const searchFields = [
          unit.name,
          unit.bpin,
          unit.responsible,
          unit.comuna,
          unit.barrio,
          unit.corregimiento,
          unit.vereda,
          unit.tipoIntervencion,
          unit.claseObra,
          unit.descripcion,
          unit.direccion
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchFields.includes(searchTerm)) return false
      }

      // Filtro por estado
      if (filters.estado !== 'all' && filters.estado !== '' && unit.status !== filters.estado) {
        return false
      }

      // Filtro por centro gestor
      if (filters.centroGestor.length > 0 && unit.responsible) {
        if (!filters.centroGestor.includes(unit.responsible)) return false
      }

      // Filtro por comunas
      if (filters.comunas.length > 0) {
        if (!unit.comuna || !filters.comunas.some(filterComuna => 
          unit.comuna?.trim().toLowerCase() === filterComuna.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por barrios
      if (filters.barrios.length > 0) {
        if (!unit.barrio || !filters.barrios.some(filterBarrio => 
          unit.barrio?.trim().toLowerCase() === filterBarrio.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por corregimientos
      if (filters.corregimientos.length > 0) {
        if (!unit.corregimiento || !filters.corregimientos.some(filterCorregimiento => 
          unit.corregimiento?.trim().toLowerCase() === filterCorregimiento.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por veredas
      if (filters.veredas.length > 0) {
        if (!unit.vereda || !filters.veredas.some(filterVereda => 
          unit.vereda?.trim().toLowerCase() === filterVereda.trim().toLowerCase()
        )) {
          return false
        }
      }

      // Filtro por períodos
      if (filters.periodos.length > 0) {
        let matchesPeriod = false
        
        for (const periodo of filters.periodos) {
          // Verificar si es un año específico
          if (/^\d{4}$/.test(periodo)) {
            const year = parseInt(periodo)
            
            if (unit.startDate) {
              const startDate = new Date(unit.startDate)
              if (!isNaN(startDate.getTime()) && startDate.getFullYear() === year) {
                matchesPeriod = true
                break
              }
            }
            
            if (unit.endDate) {
              const endDate = new Date(unit.endDate)
              if (!isNaN(endDate.getTime()) && endDate.getFullYear() === year) {
                matchesPeriod = true
                break
              }
            }
          }
          // Verificar si es un rango de períodos (e.g., "2024-2027")
          else if (/^\d{4}-\d{4}$/.test(periodo)) {
            const [startYear, endYear] = periodo.split('-').map(y => parseInt(y))
            
            if (unit.startDate) {
              const startDate = new Date(unit.startDate)
              if (!isNaN(startDate.getTime())) {
                const unitYear = startDate.getFullYear()
                if (unitYear >= startYear && unitYear <= endYear) {
                  matchesPeriod = true
                  break
                }
              }
            }
            
            if (unit.endDate) {
              const endDate = new Date(unit.endDate)
              if (!isNaN(endDate.getTime())) {
                const unitYear = endDate.getFullYear()
                if (unitYear >= startYear && unitYear <= endYear) {
                  matchesPeriod = true
                  break
                }
              }
            }
          }
        }
        
        if (!matchesPeriod) {
          return false
        }
      }

      return true
    })
  }, [unidadesProyecto, filters])

  return filteredData
}
