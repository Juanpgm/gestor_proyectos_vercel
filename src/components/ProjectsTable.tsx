'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import ProjectModal from './ProjectModal'
import { useDataContext } from '@/context/DataContext'
import { formatCurrency, formatCurrencyFull } from '../utils/formatCurrency'

export interface Project {
  id: string
  bpin: string
  name: string
  status: 'En Ejecución' | 'Planificación' | 'Completado' | 'Suspendido' | 'En Evaluación'
  comuna?: string
  barrio?: string
  corregimiento?: string
  vereda?: string
  budget: number
  executed: number
  pagado: number
  beneficiaries: number
  startDate: string
  endDate: string
  responsible: string
  progress: number
  progressFinanciero?: number // Nuevo campo para progreso financiero real
  unidadesDeProyecto?: number
  descripcion?: string
  texto1?: string
  texto2?: string
}

interface ProjectsTableProps {
  className?: string
}

type SortKey = keyof Project
type SortDirection = 'asc' | 'desc'

const ProjectsTable: React.FC<ProjectsTableProps> = ({ 
  className = '' 
}) => {
    const { filteredMovimientosPresupuestales, filteredProyectos, ejecucionPresupuestal, seguimientoPa } = useDataContext()
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Combinar datos de ambas fuentes usando BPIN
  const projects = useMemo(() => {
    if (!filteredProyectos || filteredProyectos.length === 0) return []

    console.log('📊 ProjectsTable - Data sources:', {
      movimientosLength: filteredMovimientosPresupuestales?.length || 0,
      proyectosLength: filteredProyectos.length,
      ejecucionLength: ejecucionPresupuestal?.length || 0,
      seguimientoLength: seguimientoPa?.length || 0,
      firstProyecto: filteredProyectos[0]
    })

    // Crear mapas por BPIN para acceso rápido
    const movimientosPorBpin = new Map()
    const ejecucionPorBpin = new Map()
    
    // Mapa de movimientos presupuestales
    if (filteredMovimientosPresupuestales && filteredMovimientosPresupuestales.length > 0) {
      const movimientosAgrupados = filteredMovimientosPresupuestales.reduce((acc: any, item: any) => {
        const bpin = item.bpin
        if (!acc[bpin] || item.periodo_corte >= acc[bpin].periodo_corte) {
          acc[bpin] = item
        }
        return acc
      }, {})
      
      Object.values(movimientosAgrupados).forEach((movimiento: any) => {
        movimientosPorBpin.set(movimiento.bpin, movimiento)
      })
    }

    // Mapa de ejecución presupuestal - obtener el más reciente por BPIN
    if (ejecucionPresupuestal && ejecucionPresupuestal.length > 0) {
      const ejecucionAgrupada = ejecucionPresupuestal.reduce((acc: any, item: any) => {
        const bpin = item.bpin
        if (!acc[bpin] || item.periodo_corte >= acc[bpin].periodo_corte) {
          acc[bpin] = item
        }
        return acc
      }, {})
      
      Object.values(ejecucionAgrupada).forEach((ejecucion: any) => {
        ejecucionPorBpin.set(ejecucion.bpin, ejecucion)
      })
    }

    // Mapa de seguimiento PA - obtener el más reciente por BPIN para progreso físico
    const seguimientoPorBpin = new Map()
    if (seguimientoPa && seguimientoPa.length > 0) {
      const seguimientoAgrupado = seguimientoPa.reduce((acc: any, item: any) => {
        const bpin = item.bpin
        if (bpin && (!acc[bpin] || item.periodo_corte >= acc[bpin].periodo_corte)) {
          acc[bpin] = item
        }
        return acc
      }, {})
      
      Object.values(seguimientoAgrupado).forEach((seguimiento: any) => {
        seguimientoPorBpin.set(seguimiento.bpin, seguimiento)
      })
    }

    // Convertir TODOS los proyectos, con datos reales de progreso financiero
    const projectsArray = filteredProyectos
      .filter((proyecto: any) => proyecto.bpin != null)
      .map((proyecto: any) => {
        const movimiento = movimientosPorBpin.get(proyecto.bpin)
        const ejecucion = ejecucionPorBpin.get(proyecto.bpin)
        const seguimiento = seguimientoPorBpin.get(proyecto.bpin)
        
        // Calcular progreso financiero real: ejecucion / ppto_modificado
        let progresoFinanciero = 0
        const pptoModificado = movimiento?.ppto_modificado || 0
        const ejecucionReal = ejecucion?.ejecucion || 0
        
        if (pptoModificado > 0) {
          progresoFinanciero = (ejecucionReal / pptoModificado) * 100
        }

        // Obtener progreso físico real del seguimiento PA
        const progresoFisico = seguimiento?.avance_proyecto_pa ? (seguimiento.avance_proyecto_pa * 100) : 0
        
        return {
          id: `${proyecto.bpin}`,
          bpin: proyecto.bpin.toString(),
          name: proyecto.nombre_proyecto || `Proyecto ${proyecto.bpin}`,
          status: 'En Ejecución' as const, // Estado predeterminado basado en datos reales
          comuna: proyecto.comuna || movimiento?.comuna || undefined,
          budget: pptoModificado,
          executed: ejecucionReal,
          pagado: movimiento?.vr_pagos || 0,
          beneficiaries: 0, // Usar 0 si no hay datos específicos
          startDate: proyecto.fecha_inicio || '2024-01-01', // Fecha predeterminada
          endDate: proyecto.fecha_fin || '2024-12-31', // Fecha predeterminada
          responsible: proyecto.nombre_centro_gestor || 'No especificado',
          progress: progresoFisico, // Progreso físico real del seguimiento PA
          progressFinanciero: progresoFinanciero, // Progreso financiero real calculado
          descripcion: proyecto.nombre_actividad || `Descripción del proyecto ${proyecto.bpin}`,
          texto1: proyecto.nombre_programa || 'Programa asociado',
          texto2: proyecto.nombre_linea_estrategica || 'Línea estratégica'
        } as Project
      })

    console.log('📋 ProjectsTable - combined projects with real progress:', {
      totalProjects: filteredProyectos.length,
      validBpinProjects: filteredProyectos.filter((p: any) => p.bpin != null).length,
      finalLength: projectsArray.length,
      withPhysicalProgress: projectsArray.filter(p => p.progress > 0).length,
      withFinancialProgress: projectsArray.filter((p: any) => (p as any).progressFinanciero > 0).length,
      avgPhysicalProgress: projectsArray.length > 0 
        ? (projectsArray.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / projectsArray.length).toFixed(2)
        : 0,
      avgFinancialProgress: projectsArray.length > 0 
        ? (projectsArray.reduce((sum: number, p: any) => sum + (p.progressFinanciero || 0), 0) / projectsArray.length).toFixed(2)
        : 0,
      seguimientoDataCount: seguimientoPa?.length || 0,
      ejecucionDataCount: ejecucionPresupuestal?.length || 0,
      first3WithProgress: projectsArray.slice(0, 3).map(p => ({
        bpin: p.bpin,
        budget: p.budget,
        executed: p.executed,
        progressFinanciero: (p as any).progressFinanciero
      }))
    })

    return projectsArray
  }, [filteredMovimientosPresupuestales, filteredProyectos, ejecucionPresupuestal, seguimientoPa])

  const formatNumber = (num: number) => {
    if (!mounted) {
      return num.toString()
    }
    return num.toLocaleString('es-CO')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Ejecución': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Planificación': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'Completado': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Suspendido': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'En Evaluación': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-500" />
      : <ArrowDown className="w-4 h-4 text-blue-500" />
  }

  const handleViewProject = (project: Project) => {
    console.log('👁️ Opening project modal for:', {
      id: project.id,
      name: project.name,
      bpin: project.bpin,
      budget: project.budget,
      responsible: project.responsible,
      fullProject: project
    })
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return 1
      if (bValue === undefined) return -1

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const av = aValue.toLowerCase()
        const bv = bValue.toLowerCase()
        if (av < bv) return sortDirection === 'asc' ? -1 : 1
        if (av > bv) return sortDirection === 'asc' ? 1 : -1
        return 0
      }

      if (aValue < (bValue as any)) return sortDirection === 'asc' ? -1 : 1
      if (aValue > (bValue as any)) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [projects, sortKey, sortDirection])

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when projects change
  useEffect(() => {
    setCurrentPage(1)
  }, [projects.length])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}
    >
      {/* Header más compacto */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Proyectos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedProjects.length} proyectos encontrados
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>

      {/* Table con altura fija y scroll */}
      <div className="overflow-x-auto w-full max-h-[700px] overflow-y-auto">
        <table className="w-full table-fixed min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th 
                className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('name')}
                style={{ width: '50%' }}
              >
                <div className="flex items-center space-x-1">
                  <span>Proyecto</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
                style={{ width: '22%' }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Estado</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('progress')}
                style={{ width: '21%' }}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Progreso</span>
                  {getSortIcon('progress')}
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                style={{ width: '7%' }}
              >
                Ver
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {paginatedProjects.map((project) => (
              <motion.tr
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td className="px-2 py-3 align-top" style={{ width: '50%' }}>
                  <div>
                    {/* Nombre del proyecto */}
                    <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1 break-words">
                      {project.name}
                    </div>
                    
                    {/* BPIN */}
                    <div className="text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">BPIN:</span>
                      <span className="ml-1 text-blue-700 dark:text-blue-300 font-medium">{project.bpin}</span>
                    </div>

                    {/* Ubicación */}
                    <div className="text-xs mb-1">
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        {project.comuna && `${project.comuna}`}
                        {project.corregimiento && `${project.corregimiento}`}
                      </div>
                      {(project.barrio || project.vereda) && (
                        <div className="text-gray-500 dark:text-gray-400">
                          {project.barrio || project.vereda}
                        </div>
                      )}
                    </div>

                    {/* Presupuesto */}
                    <div className="mb-1">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrencyFull(project.budget)}</div>
                    </div>
                    
                    {/* Centro gestor */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium italic break-words">
                      {project.responsible}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 align-middle text-center" style={{ width: '18%' }}>
                  <div className="flex justify-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </td>
                {/* Progreso: física y financiera */}
                <td className="px-2 py-3 align-middle" style={{ width: '25%' }}>
                  <div className="space-y-2">
                    <div>
                      {(() => {
                        const physicalPct = Number(project.progress)
                        const physicalDisplay = physicalPct.toFixed(1)
                        const physicalAria = Number(physicalDisplay)
                        return (
                          <>
                            <div className="text-xs text-gray-500 text-center mb-1">Física</div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white text-center mb-1">{physicalDisplay}%</div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-label={`Progreso físico de ${project.name}`} aria-valuenow={physicalAria} aria-valuemin={0} aria-valuemax={100}>
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${physicalPct}%` }} />
                            </div>
                            <span className="sr-only">Progreso físico {physicalDisplay} por ciento</span>
                          </>
                        )
                      })()}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 text-center">Financiera</div>
                      {project.budget > 0 && typeof project.progressFinanciero === 'number' ? (
                        (() => {
                          const financieraPct = Math.min(project.progressFinanciero, 100) // Limitar a 100%
                          const financieraDisplay = financieraPct.toFixed(1)
                          const financieraAria = Number(financieraDisplay)
                          return (
                            <>
                              <div className="text-xs font-medium text-gray-900 dark:text-white text-center">{financieraDisplay}%</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1" role="progressbar" aria-label={`Progreso financiero de ${project.name}`} aria-valuenow={financieraAria} aria-valuemin={0} aria-valuemax={100}>
                                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(financieraPct, 100)}%` }} />
                              </div>
                              <span className="sr-only">Progreso financiero {financieraDisplay} por ciento</span>
                            </>
                          )
                        })()
                      ) : (
                        <div className="text-xs font-medium text-gray-900 dark:text-white text-center">—</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-sm font-medium align-middle text-center" style={{ width: '7%' }}>
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => handleViewProject(project)}
                      aria-label={`Ver detalle del proyecto ${project.name}`} 
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 transition-colors duration-200 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedProjects.length)} de {sortedProjects.length} proyectos
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Selector de elementos por página */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              
              <div className="flex items-center">
                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = i + 1
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i
                  } else {
                    pageNumber = currentPage - 2 + i
                  }
                  
                  if (pageNumber < 1 || pageNumber > totalPages) return null
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium border-t border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                        currentPage === pageNumber
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-400'
                          : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700 transition-colors duration-200"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ficha de Proyecto */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
    </motion.div>
  )
}

export default ProjectsTable
