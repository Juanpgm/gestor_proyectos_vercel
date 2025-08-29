'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  MapPin,
  Calendar,
  Building2
} from 'lucide-react'
import ProjectModal from './ProjectModal'
import { useDataContext } from '@/context/DataContext'
import { formatCurrency, formatCurrencyFull } from '../utils/formatCurrency'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS, CHART_COLORS } from '@/lib/design-system'

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
  progressFinanciero?: number
  unidadesDeProyecto?: number
  descripcion?: string
  texto1?: string
  texto2?: string
}

interface ProjectsTableProps {
  className?: string
  showFilters?: boolean
  compact?: boolean
}

type SortKey = keyof Project
type SortDirection = 'asc' | 'desc'

const ProjectsTable: React.FC<ProjectsTableProps> = ({ 
  className = '',
  showFilters = true,
  compact = false
}) => {
  const { filteredMovimientosPresupuestales, filteredProyectos, ejecucionPresupuestal, seguimientoPa } = useDataContext()
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobileView(mobile)
      setItemsPerPage(mobile ? 6 : (compact ? 8 : 10))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [compact])

  // Combinar datos de ambas fuentes usando BPIN
  const projects = useMemo(() => {
    if (!filteredProyectos || filteredProyectos.length === 0) return []

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
          status: 'En Ejecución' as const,
          comuna: proyecto.comuna || movimiento?.comuna || undefined,
          budget: pptoModificado,
          executed: ejecucionReal,
          pagado: movimiento?.vr_pagos || 0,
          beneficiaries: 0,
          startDate: proyecto.fecha_inicio || '2024-01-01',
          endDate: proyecto.fecha_fin || '2024-12-31',
          responsible: proyecto.nombre_centro_gestor || 'No especificado',
          progress: progresoFisico,
          progressFinanciero: progresoFinanciero,
          descripcion: proyecto.nombre_actividad || `Descripción del proyecto ${proyecto.bpin}`,
          texto1: proyecto.nombre_programa || 'Programa asociado',
          texto2: proyecto.nombre_linea_estrategica || 'Línea estratégica'
        } as Project
      })

    return projectsArray
  }, [filteredMovimientosPresupuestales, filteredProyectos, ejecucionPresupuestal, seguimientoPa])

  // Filtrar proyectos por término de búsqueda
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects
    
    const term = searchTerm.toLowerCase().trim()
    return projects.filter(project => 
      project.name.toLowerCase().includes(term) ||
      project.bpin.toLowerCase().includes(term) ||
      project.responsible.toLowerCase().includes(term) ||
      project.comuna?.toLowerCase().includes(term) ||
      project.status.toLowerCase().includes(term)
    )
  }, [projects, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'En Ejecución': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
      case 'En Contratación': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
      case 'Planificación': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
      case 'Completado': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
      case 'Terminado': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
      case 'Suspendido': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800'
      case 'En Evaluación': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
      case 'En Estructuración': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
    }
  }

  const getProgressBarColor = (type: 'physical' | 'financial', progress: number) => {
    if (type === 'physical') {
      if (progress < 30) return 'bg-red-500'
      if (progress < 60) return 'bg-amber-500'
      if (progress < 90) return 'bg-blue-500'
      return 'bg-emerald-500'
    } else {
      if (progress < 30) return 'bg-red-600'
      if (progress < 60) return 'bg-orange-500'
      if (progress < 90) return 'bg-emerald-600'
      return 'bg-green-600'
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
      return <ArrowUpDown className="w-3 h-3" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />
  }

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects].sort((a, b) => {
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
  }, [filteredProjects, sortKey, sortDirection])

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filtered projects change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredProjects.length, searchTerm])

  // Componente de tarjeta de proyecto para vista responsiva
  if (!mounted) {
    return <div>Cargando...</div>
  }

  return (
    <motion.div
      initial={ANIMATIONS.fadeIn.initial}
      animate={ANIMATIONS.fadeIn.animate}
      transition={ANIMATIONS.fadeIn.transition}
      className={`space-y-4 ${className}`}
    >
      {/* Contenido principal */}
      <div className={`${CSS_UTILS.card} overflow-hidden`}>
          {/* Header más compacto integrado */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${CATEGORIES.projects.className.accent} rounded-lg shadow-sm`}>
                  <Building2 className={`w-5 h-5 ${CATEGORIES.projects.className.text}`} />
                </div>
                <div>
                  <h2 className={`${TYPOGRAPHY.h5} font-bold text-gray-900 dark:text-white`}>
                    Proyectos de Inversión
                  </h2>
                  <p className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400`}>
                    {filteredProjects.length} proyectos • Total: 
                    <span className="hidden lg:inline ml-1 font-semibold text-blue-600 dark:text-blue-400">{formatCurrencyFull(filteredProjects.reduce((sum, p) => sum + p.budget, 0))}</span>
                    <span className="lg:hidden ml-1 font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(filteredProjects.reduce((sum, p) => sum + p.budget, 0))}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th 
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('name')}
                    style={{ width: '45%' }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Proyecto</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('status')}
                    style={{ width: '15%' }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Estado</span>
                      {getSortIcon('status')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('budget')}
                    style={{ width: '20%' }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Presupuesto</span>
                      {getSortIcon('budget')}
                    </div>
                  </th>
                  <th 
                    className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort('progress')}
                    style={{ width: '15%' }}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Progreso</span>
                      {getSortIcon('progress')}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '5%' }}>
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
                    {/* Columna Proyecto - Más información comprimida */}
                    <td className="px-3 py-3" style={{ width: '45%' }}>
                      <div className="space-y-1">
                        {/* Nombre del proyecto */}
                        <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">
                          {project.name}
                        </div>
                        
                        {/* BPIN y ubicación en una línea */}
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                            <Building2 className="w-3 h-3" />
                            BPIN: {project.bpin}
                          </span>
                          {project.comuna && (
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {project.comuna}
                            </span>
                          )}
                        </div>

                        {/* Responsable y fechas */}
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                          <div className="font-medium italic truncate" title={project.responsible}>
                            {project.responsible}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {project.startDate} - {project.endDate}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Estado con color */}
                    <td className="px-3 py-3 text-center" style={{ width: '15%' }}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>

                    {/* Presupuesto con contraste de colores */}
                    <td className="px-3 py-3 text-center" style={{ width: '20%' }}>
                      <div className="space-y-1">
                        {/* Presupuesto total */}
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="hidden lg:inline">{formatCurrencyFull(project.budget)}</span>
                          <span className="lg:hidden">{formatCurrency(project.budget)}</span>
                        </div>
                        {/* Ejecutado */}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Ejecutado: <span className="font-semibold text-blue-600 dark:text-blue-400">
                            <span className="hidden lg:inline">{formatCurrencyFull(project.executed)}</span>
                            <span className="lg:hidden">{formatCurrency(project.executed)}</span>
                          </span>
                        </div>
                        {/* Pagado */}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Pagado: <span className="font-semibold text-green-600 dark:text-green-400">
                            <span className="hidden lg:inline">{formatCurrencyFull(project.pagado)}</span>
                            <span className="lg:hidden">{formatCurrency(project.pagado)}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Progreso con barras reales */}
                    <td className="px-3 py-3" style={{ width: '15%' }}>
                      <div className="space-y-2">
                        {/* Progreso físico */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Físico</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{project.progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`${getProgressBarColor('physical', project.progress)} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min(project.progress, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Progreso financiero */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Financiero</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{((project as any).progressFinanciero || 0).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`${getProgressBarColor('financial', (project as any).progressFinanciero || 0)} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min((project as any).progressFinanciero || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Acción compacta */}
                    <td className="px-3 py-3 text-center" style={{ width: '5%' }}>
                      <button
                        onClick={() => {
                          setSelectedProject(project)
                          setIsModalOpen(true)
                        }}
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 transition-colors"
                        title="Ver detalles del proyecto"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Paginación responsiva */}
      {totalPages > 1 && (
        <motion.div
          className={`${CSS_UTILS.card} p-4`}
          initial={ANIMATIONS.slideUp.initial}
          animate={ANIMATIONS.slideUp.animate}
          transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-400`}>
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedProjects.length)} de {sortedProjects.length} proyectos
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 py-1 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          currentPage === page
                            ? `${CATEGORIES.projects.className.bg} ${CATEGORIES.projects.className.text}`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de proyecto */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </motion.div>
  )
}

export default ProjectsTable
