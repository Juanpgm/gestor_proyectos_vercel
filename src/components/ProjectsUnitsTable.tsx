'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Download, 
  Eye, 
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import ProjectModal from './ProjectModal'

export interface ProjectUnit {
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
  unidadesDeProyecto?: number
  descripcion?: string
  texto1?: string
  texto2?: string
  tipoIntervencion?: 'Construcción' | 'Mejoramiento' | 'Rehabilitación' | 'Mantenimiento'
  lat?: number
  lng?: number
}

interface ProjectsUnitsTableProps {
  projectUnits: ProjectUnit[]
  filteredProjectUnits: ProjectUnit[]
  className?: string
}

type SortKey = keyof ProjectUnit
type SortDirection = 'asc' | 'desc'

const ProjectsUnitsTable: React.FC<ProjectsUnitsTableProps> = ({ 
  projectUnits,
  filteredProjectUnits,
  className = '' 
}) => {
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProject, setSelectedProject] = useState<ProjectUnit | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const getInterventionColor = (tipo?: string) => {
    switch (tipo) {
      case 'Construcción': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
      case 'Mejoramiento': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
      case 'Rehabilitación': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
      case 'Mantenimiento': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1).replace('.', ',')}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`
    }
    return `$${value.toLocaleString('de-DE')}`
  }

  const formatCurrencyFull = (value: number) => {
    if (!mounted) return value.toString()
    return `$${value.toLocaleString('de-DE')} COP`
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

  const handleViewProject = (project: ProjectUnit) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjectUnits].sort((a, b) => {
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
  }, [filteredProjectUnits, sortKey, sortDirection])

  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = sortedProjects.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filtered projects change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredProjectUnits.length])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Unidades de Proyecto - Tabla de Atributos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedProjects.length} unidades de proyecto encontradas
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('name')}
                style={{ width: '22%' }}
              >
                <div className="flex items-center space-x-1">
                  <span>Unidad de Proyecto</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Estado</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('tipoIntervencion')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipo Intervención</span>
                  {getSortIcon('tipoIntervencion')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('comuna')}
              >
                <div className="flex items-center space-x-1">
                  <span>Ubicación</span>
                  {getSortIcon('comuna')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('progress')}
              >
                <div className="flex items-center space-x-1">
                  <span>Progreso</span>
                  {getSortIcon('progress')}
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                DETALLE
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
        <td className="px-6 py-4 whitespace-nowrap align-middle" style={{ width: '22%' }}>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {project.bpin}
                    </div>

                    {/* Texto compacto gris: Presupuesto y Beneficiarios */}
                    <div className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                      <div className="font-semibold text-indigo-700 dark:text-indigo-200">{formatCurrencyFull(project.budget)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Beneficiarios: {formatNumber(project.beneficiaries)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInterventionColor(project.tipoIntervencion)}`}>
                    {project.tipoIntervencion || 'No definido'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div>
                    <div className="font-medium">
                      {project.comuna && `${project.comuna}`}
                      {project.corregimiento && `${project.corregimiento}`}
                    </div>
                    {(project.barrio || project.vereda) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {project.barrio || project.vereda}
                      </div>
                    )}
                  </div>
                </td>
                {/* Progreso: física y financiera apiladas en una sola celda (accesible) */}
                <td className="px-6 py-4 whitespace-nowrap align-top">
                  <div className="space-y-2">
                    <div>
                      {(() => {
                        const physicalPct = Number(project.progress)
                        const physicalDisplay = physicalPct.toFixed(1)
                        const physicalAria = Number(physicalDisplay)
                        return (
                          <>
                            <div className="text-xs text-gray-500">Física</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{physicalDisplay}%</div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1" role="progressbar" aria-label={`Progreso físico de ${project.name}`} aria-valuenow={physicalAria} aria-valuemin={0} aria-valuemax={100}>
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${physicalPct}%` }} />
                            </div>
                            <span className="sr-only">Progreso físico {physicalDisplay} por ciento</span>
                          </>
                        )
                      })()}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Financiera</div>
                      {project.budget > 0 ? (
                        (() => {
                          const executedPct = (project.executed / project.budget) * 100
                          const executedDisplay = executedPct.toFixed(1)
                          const executedAria = Number(executedDisplay)
                          return (
                            <>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{executedDisplay}%</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1" role="progressbar" aria-label={`Progreso financiero de ${project.name}`} aria-valuenow={executedAria} aria-valuemin={0} aria-valuemax={100}>
                                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${executedPct}%` }} />
                              </div>
                              <span className="sr-only">Progreso financiero {executedDisplay} por ciento</span>
                            </>
                          )
                        })()
                      ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-white">—</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center justify-center align-middle">
                  <button 
                    onClick={() => handleViewProject(project)}
                    aria-label={`Ver detalle del proyecto ${project.name}`} 
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 transition-colors duration-200 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedProjects.length)} de {sortedProjects.length} resultados
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
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

export default ProjectsUnitsTable
