'use client'

import { useDataContext } from '@/context/DataContext'
import { useDashboardFilters } from '@/context/DashboardContext'
import { useEffect } from 'react'

/**
 * Hook que sincroniza los filtros del dashboard con el contexto de datos
 * Permite que los componentes existentes sigan funcionando mientras
 * obtienen datos filtrados del nuevo sistema centralizado
 */
export const useDataFilters = () => {
  const { filters: dashboardFilters } = useDashboardFilters()
  const { setFilters: setDataFilters, ...dataContext } = useDataContext()

  // Sincronizar filtros del dashboard con el contexto de datos
  useEffect(() => {
    const dataFilters = {
      search: dashboardFilters.search || '',
      // Incluir otros filtros relevantes sin duplicar 'search'
      estado: dashboardFilters.estado,
      comunas: dashboardFilters.comunas || [],
      barrios: dashboardFilters.barrios || [],
      corregimientos: dashboardFilters.corregimientos || [],
      veredas: dashboardFilters.veredas || [],
      centroGestor: dashboardFilters.centroGestor || [],
      fuentesFinanciamiento: dashboardFilters.fuentesFinanciamiento || []
    }

    setDataFilters(dataFilters)
  }, [dashboardFilters, setDataFilters])

  return {
    ...dataContext,
    // Mantener compatibilidad con nombres anteriores
    filteredProjects: dataContext.filteredProyectos,
    filteredUnits: dataContext.filteredUnidadesProyecto,
    // Exponer todos los datos filtrados
    ...dataContext
  }
}

/**
 * Hook específico para obtener estadísticas filtradas
 * Compatible con el sistema existente de StatsCards
 */
export const useFilteredStats = () => {
  const { stats, loading, error, filters } = useDataFilters()
  
  return {
    stats: {
      // Mapear a la estructura esperada por StatsCards
      totalProyectos: stats?.totalProyectos || 0,
      totalUnidadesProyecto: stats?.totalUnidadesProyecto || 0,
      totalProductos: stats?.totalProductos || 0,
      totalActividades: stats?.totalActividades || 0,
      totalContratos: stats?.totalContratos || 0
    },
    loading,
    error
  }
}
