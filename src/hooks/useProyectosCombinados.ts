import { useState, useEffect, useMemo } from 'react'
import { useProyectos, ProyectoCaracteristicas } from './useProyectos'
import { useMovimientosPresupuestales, MovimientoPresupuestal } from './useMovimientosPresupuestales'
import { Project } from '@/components/ProjectsTable'

// Función para generar un estado aleatorio (temporal hasta que tengamos datos reales de estado)
const getRandomStatus = (): Project['status'] => {
  const statuses: Project['status'][] = ['En Ejecución', 'Planificación', 'Completado', 'Suspendido', 'En Evaluación']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

// Función para generar datos aleatorios de beneficiarios (temporal)
const getRandomBeneficiaries = (): number => {
  return Math.floor(Math.random() * 10000) + 100
}

// Función para generar fechas aleatorias (temporal)
const getRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

interface CombinedProjectData {
  proyecto: ProyectoCaracteristicas
  movimiento?: MovimientoPresupuestal
}

interface FilterState {
  search: string
  estado: string
  centroGestor: string[]
  comunas: string[]
  barrios: string[]
  corregimientos: string[]
  veredas: string[]
  fuentesFinanciamiento: string[]
  filtrosPersonalizados: string[]
  subfiltrosPersonalizados: string[]
  periodos: string[]
}

export function useProyectosCombinados() {
  const { proyectos, loading: loadingProyectos, error: errorProyectos } = useProyectos()
  const { 
    movimientos, 
    loading: loadingMovimientos, 
    error: errorMovimientos,
    getUltimoMovimientoPorBpin,
    getMovimientosPorPeriodos
  } = useMovimientosPresupuestales()

  const [combinedData, setCombinedData] = useState<CombinedProjectData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Debug: log estados de carga
  useEffect(() => {
    console.log('🔄 useProyectosCombinados - loading states:', {
      loadingProyectos,
      loadingMovimientos,
      proyectosLength: proyectos?.length || 0,
      movimientosLength: movimientos?.length || 0,
      errorProyectos,
      errorMovimientos
    })
  }, [loadingProyectos, loadingMovimientos, proyectos, movimientos, errorProyectos, errorMovimientos])

  // Combinar datos cuando ambos estén cargados
  useEffect(() => {
    if (!loadingProyectos && !loadingMovimientos) {
      try {
        console.log('🔄 Combinando datos de proyectos y movimientos...')
        
        const combined: CombinedProjectData[] = proyectos.map(proyecto => {
          const movimiento = getUltimoMovimientoPorBpin(proyecto.bpin)
          return {
            proyecto,
            movimiento
          }
        })

        console.log('✅ Datos combinados:', combined.length, 'proyectos')
        setCombinedData(combined)
        setError(null)
      } catch (err) {
        console.error('❌ Error combinando datos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
  }, [proyectos, movimientos, loadingProyectos, loadingMovimientos])

  // Error handling
  useEffect(() => {
    if (errorProyectos || errorMovimientos) {
      setError(errorProyectos || errorMovimientos || 'Error cargando datos')
      setLoading(false)
    }
  }, [errorProyectos, errorMovimientos])

  // Función para convertir datos combinados al formato Project
  const convertToProjects = (data: CombinedProjectData[], filtros?: FilterState): Project[] => {
    return data
      .filter(item => {
        // Filtrar por períodos si están especificados
        if (filtros?.periodos && filtros.periodos.length > 0) {
          if (!item.movimiento) return false
          return filtros.periodos.includes(item.movimiento.periodo)
        }
        return true
      })
      .map((item, index) => {
        const proyecto = item.proyecto
        const movimiento = item.movimiento

        // Usar vr_cdp como presupuesto modificado (ppto_modificado)
        const budget = movimiento?.vr_cdp || 0
        const executed = movimiento?.vr_obligaciones || 0
        const pagado = movimiento?.vr_pagos || 0

        return {
          id: `${proyecto.bpin}`,
          bpin: proyecto.bpin.toString(),
          name: proyecto.nombre_proyecto || 'Proyecto sin nombre',
          status: getRandomStatus(), // TODO: Mapear desde datos reales
          comuna: proyecto.comuna || undefined,
          budget: budget,
          executed: executed,
          pagado: pagado,
          beneficiaries: getRandomBeneficiaries(), // TODO: Obtener de datos reales
          startDate: getRandomDate(new Date('2024-01-01'), new Date('2024-06-01')), // TODO: Obtener de datos reales
          endDate: getRandomDate(new Date('2024-06-01'), new Date('2024-12-31')), // TODO: Obtener de datos reales
          responsible: proyecto.nombre_centro_gestor || 'No especificado',
          progress: 0.0, // Por defecto 0.0% como se solicitó
          descripcion: proyecto.nombre_actividad,
          texto1: proyecto.nombre_programa,
          texto2: proyecto.nombre_linea_estrategica
        } as Project
      })
  }

  // Función para aplicar filtros
  const getFilteredProjects = (filtros: FilterState): Project[] => {
    let dataToFilter = combinedData

    // Si hay períodos seleccionados, filtrar los movimientos correspondientes
    if (filtros.periodos && filtros.periodos.length > 0) {
      const movimientosFiltrados = getMovimientosPorPeriodos(filtros.periodos)
      const bpinsPermitidos = new Set(movimientosFiltrados.map(m => m.bpin))
      
      dataToFilter = combinedData.filter(item => 
        bpinsPermitidos.has(item.proyecto.bpin)
      ).map(item => ({
        ...item,
        movimiento: movimientosFiltrados.find(m => m.bpin === item.proyecto.bpin)
      }))
    }

    const projects = convertToProjects(dataToFilter, filtros)

    // Aplicar filtros adicionales
    return projects.filter(project => {
      // Filtro de búsqueda
      if (filtros.search) {
        const searchLower = filtros.search.toLowerCase()
        const matchesSearch = 
          project.name.toLowerCase().includes(searchLower) ||
          project.bpin.toLowerCase().includes(searchLower) ||
          project.responsible.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Filtro de estado
      if (filtros.estado && filtros.estado !== 'all') {
        if (project.status !== filtros.estado) return false
      }

      // Filtro de comunas
      if (filtros.comunas && filtros.comunas.length > 0) {
        if (!project.comuna || !filtros.comunas.includes(project.comuna)) return false
      }

      // Filtro de centro gestor
      if (filtros.centroGestor && filtros.centroGestor.length > 0) {
        if (!filtros.centroGestor.includes(project.responsible)) return false
      }

      return true
    })
  }

  return {
    combinedData,
    loading: loading || loadingProyectos || loadingMovimientos,
    error,
    convertToProjects,
    getFilteredProjects
  }
}
