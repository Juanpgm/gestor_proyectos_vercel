'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  DollarSign
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { useProyectos } from '@/hooks/useProyectos'
import { useContratosCompletos } from '@/hooks/useContratosCompletos'
import { useEmpFoundationalDims } from '@/hooks/useEmpFoundationalDims'
import ContractDetailCard from '@/components/ContractDetailCard'

// Interfaz para proyecto con contratos asociados
interface ProjectWithContracts {
  bpin: number
  nombre_proyecto: string
  nombre_actividad: string
  nombre_centro_gestor: string
  nombre_programa: string
  tipo_gasto: string
  tipo_objetivo: string
  anio: number
  valor_proyecto: number
  // Datos agregados de contratos
  contratos: any[]
  contratosCount: number
  totalValueContratos: number
  valorPagado: number
  valorPendiente: number
  estadosContratos: string[]
  tiposContratos: string[]
  // Datos de empréstito
  isEmprestito: boolean
  valor_emprestito: number
  fuente_emprestito: string
}

const IntegratedProjectsContracts: React.FC = () => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')
  const [selectedTipoContrato, setSelectedTipoContrato] = useState('')
  const [selectedEstadoContrato, setSelectedEstadoContrato] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Hooks para datos
  const proyectosState = useProyectos()
  const contratosState = useContratosCompletos()
  const emprestitoState = useEmpFoundationalDims()

  // Integración de datos usando la misma lógica que la sección "Contratos"
  const integratedData = useMemo(() => {
    if (!proyectosState.proyectos || !contratosState.contratos) {
      return []
    }

    const proyectos = proyectosState.proyectos
    const contratos = contratosState.contratos
    const emprestitoData = emprestitoState.data || []

    // Agrupar contratos por BPIN, filtrando solo contratos posteriores al 31 de diciembre de 2024
    const contratosPorBpin = contratos.reduce((acc: Record<number, any[]>, contrato: any) => {
      if (!contrato.bpin) return acc
      
      // Función para verificar si un contrato es posterior al 31 de diciembre de 2024
      const isContractAfterDec2024 = (contrato: any) => {
        const cutoffDate = new Date('2024-12-31')
        
        const checkDate = (dateString: string) => {
          if (!dateString) return false
          const contractDate = new Date(dateString)
          return contractDate > cutoffDate
        }
        
        // Verificar en orden de prioridad: fecha_firma, fecha_inicio_contrato, fecha_inicio_ejecucion
        return checkDate(contrato.fecha_firma) || 
               checkDate(contrato.fecha_inicio_contrato) || 
               checkDate(contrato.fecha_inicio_ejecucion)
      }
      
      // Solo incluir contratos posteriores al 31 de diciembre de 2024
      if (isContractAfterDec2024(contrato)) {
        if (!acc[contrato.bpin]) {
          acc[contrato.bpin] = []
        }
        acc[contrato.bpin].push(contrato)
      }
      
      return acc
    }, {} as Record<number, any[]>)

    // Crear un mapa de proyectos de empréstito
    const emprestitoMap = emprestitoData.reduce((acc: Record<number, any>, emp: any) => {
      acc[emp.bpin] = emp
      return acc
    }, {} as Record<number, any>)

    // Integrar proyectos con sus contratos
    return proyectos.map((proyecto: any) => {
      const contratosAsociados = contratosPorBpin[proyecto.bpin] || []
      const emprestitoInfo = emprestitoMap[proyecto.bpin]
      
      return {
        ...proyecto,
        contratos: contratosAsociados,
        contratosCount: contratosAsociados.length,
        totalValueContratos: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_contrato || 0), 0),
        valorPagado: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0),
        valorPendiente: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_pendiente_pago || 0), 0),
        estadosContratos: Array.from(new Set(contratosAsociados.map((c: any) => c.estado_contrato).filter(Boolean))),
        tiposContratos: Array.from(new Set(contratosAsociados.map((c: any) => c.tipo_contrato).filter(Boolean))),
        // Datos de empréstito
        isEmprestito: !!emprestitoInfo,
        valor_emprestito: emprestitoInfo?.valor_vigencia_actual || 0,
        fuente_emprestito: emprestitoInfo?.fuente || ''
      } as ProjectWithContracts
    }).sort((a: any, b: any) => {
      // Ordenar: proyectos con contratos primero, luego por valor
      if (a.contratosCount > 0 && b.contratosCount === 0) return -1
      if (a.contratosCount === 0 && b.contratosCount > 0) return 1
      return b.totalValueContratos - a.totalValueContratos
    })
  }, [proyectosState.proyectos, contratosState.contratos, emprestitoState.data])

  // Opciones dinámicas para filtros
  const centrosGestor = useMemo(() => {
    const uniqueCentros = new Set(
      integratedData.map(p => p.nombre_centro_gestor).filter(Boolean)
    )
    return Array.from(uniqueCentros).sort()
  }, [integratedData])

  const tiposContrato = useMemo(() => {
    const uniqueTipos = new Set(
      integratedData.flatMap(p => p.tiposContratos)
    )
    return Array.from(uniqueTipos).sort()
  }, [integratedData])

  const estadosContrato = useMemo(() => {
    const uniqueEstados = new Set(
      integratedData.flatMap(p => p.estadosContratos)
    )
    return Array.from(uniqueEstados).sort()
  }, [integratedData])

  // Función para filtrar contratos por estado
  const filterContratosByEstado = (contratos: any[], estado: string) => {
    if (!estado) return contratos
    return contratos.filter(c => c.estado_contrato === estado)
  }

  // Función para filtrar contratos por tipo
  const filterContratosByTipo = (contratos: any[], tipo: string) => {
    if (!tipo) return contratos
    return contratos.filter(c => c.tipo_contrato === tipo)
  }

  // Función combinada para filtrar contratos
  const filterContratos = (contratos: any[]) => {
    let filtered = contratos
    filtered = filterContratosByEstado(filtered, selectedEstadoContrato)
    filtered = filterContratosByTipo(filtered, selectedTipoContrato)
    return filtered
  }

  // Datos filtrados
  const filteredData = useMemo(() => {
    return integratedData.filter((project: any) => {
      // Filtro por búsqueda
      const matchesSearch = searchTerm === '' || 
        project.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.nombre_actividad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.bpin.toString().includes(searchTerm) ||
        project.nombre_centro_gestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.nombre_programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.contratos.some((c: any) => 
          (c.descripcion_proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.proveedor_adjudicado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.nombre_entidad || '').toLowerCase().includes(searchTerm.toLowerCase())
        )

      // Filtro por centro gestor usando nombre_centro_gestor
      const matchesCentroGestor = selectedCentroGestor === '' || 
        project.nombre_centro_gestor === selectedCentroGestor

      return matchesSearch && matchesCentroGestor
    })
  }, [integratedData, searchTerm, selectedCentroGestor])

  // Filtrar para mostrar solo proyectos con contratos que coinciden con los filtros
  const finalFilteredData = useMemo(() => {
    return filteredData.map(project => {
      const filteredContratos = filterContratos(project.contratos)
      return {
        ...project,
        contratos: filteredContratos,
        contratosCount: filteredContratos.length,
        totalValueContratos: filteredContratos.reduce((sum: number, c: any) => sum + (c.valor_contrato || 0), 0),
        valorPagado: filteredContratos.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0),
        valorPendiente: filteredContratos.reduce((sum: number, c: any) => sum + (c.valor_pendiente_pago || 0), 0)
      }
    }).filter(project => {
      // Solo mostrar proyectos que tienen contratos que coinciden con los filtros aplicados
      // Si no hay filtros de contrato aplicados, mostrar todos los proyectos
      if (!selectedTipoContrato && !selectedEstadoContrato) {
        return true
      }
      // Si hay filtros de contrato aplicados, solo mostrar proyectos con contratos que coinciden
      return project.contratosCount > 0
    })
  }, [filteredData, selectedTipoContrato, selectedEstadoContrato])

  // Paginación usando finalFilteredData
  const totalPages = Math.ceil(finalFilteredData.length / itemsPerPage)
  const paginatedData = finalFilteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Métricas usando finalFilteredData
  const totalContratos = finalFilteredData.reduce((sum, p) => sum + p.contratosCount, 0)
  const totalValue = finalFilteredData.reduce((sum, p) => sum + p.totalValueContratos, 0)
  const emprestitoProjectsWithContracts = finalFilteredData.filter(p => p.isEmprestito && p.contratosCount > 0).length

  // Funciones auxiliares
  const toggleProjectExpansion = (bpin: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bpin)) {
        newSet.delete(bpin)
      } else {
        newSet.add(bpin)
      }
      return newSet
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCentroGestor('')
    setSelectedTipoContrato('')
    setSelectedEstadoContrato('')
    setCurrentPage(1)
  }

  const getActiveFiltersDescription = () => {
    const filters = []
    if (selectedCentroGestor) filters.push(`Centro: ${selectedCentroGestor}`)
    if (selectedTipoContrato) filters.push(`Tipo: ${selectedTipoContrato}`)
    if (selectedEstadoContrato) filters.push(`Estado: ${selectedEstadoContrato}`)
    return filters.length > 0 ? ` (${filters.join(', ')})` : ''
  }

  const loading = proyectosState.loading || contratosState.loading || emprestitoState.loading

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Proyectos y Contratos Integrados
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {finalFilteredData.length} proyectos con {totalContratos} contratos{getActiveFiltersDescription()}
              </p>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-teal-600 dark:text-teal-400">Total Proyectos</div>
            <div className="text-lg font-semibold text-teal-800 dark:text-teal-300">
              {finalFilteredData.length.toLocaleString()}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-amber-600 dark:text-amber-400">Total Contratos</div>
            <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
              {totalContratos.toLocaleString()}
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Valor Total</div>
            <div className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
              {formatNumber(totalValue, 'currency')}
            </div>
          </div>
          {emprestitoProjectsWithContracts > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2">
              <div className="text-xs text-purple-600 dark:text-purple-400">Empréstito</div>
              <div className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                {emprestitoProjectsWithContracts} proyectos
              </div>
            </div>
          )}
        </div>

        {/* Barra de búsqueda principal */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar proyectos, actividades, BPIN, entidades, contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-base"
            />
          </div>
        </div>

        {/* Filtros adicionales colapsables */}
        <div className="mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtros avanzados
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Centro Gestor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Centro Gestor
                    </label>
                    <select
                      value={selectedCentroGestor}
                      onChange={(e) => setSelectedCentroGestor(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todas las entidades</option>
                      {centrosGestor.map(centro => (
                        <option key={centro} value={centro}>
                          {centro}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de contrato */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Contrato
                    </label>
                    <select
                      value={selectedTipoContrato}
                      onChange={(e) => setSelectedTipoContrato(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los tipos</option>
                      {tiposContrato.map(tipo => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado de contrato */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado del Contrato
                    </label>
                    <select
                      value={selectedEstadoContrato}
                      onChange={(e) => setSelectedEstadoContrato(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los estados</option>
                      {estadosContrato.map(estado => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Limpiar filtros */}
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lista de proyectos */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {paginatedData.map((project, index) => {
            const isExpanded = expandedProjects.has(project.bpin)
            
            return (
              <motion.div
                key={project.bpin}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {/* Cabecera del proyecto */}
                <div 
                  className={`p-6 ${project.contratosCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => project.contratosCount > 0 && toggleProjectExpansion(project.bpin)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0">
                          {project.contratosCount > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">∅</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {project.nombre_proyecto}
                            </h3>
                            {project.isEmprestito && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                Empréstito
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {project.nombre_actividad}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{project.nombre_centro_gestor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>BPIN: {project.bpin}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{project.anio}</span>
                        </div>
                        {project.isEmprestito && project.valor_emprestito > 0 && (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <DollarSign className="h-4 w-4" />
                            <span>Emp: {formatNumber(project.valor_emprestito, 'currency')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-6">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                          {formatNumber(project.totalValueContratos, 'currency')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.contratosCount > 0 ? (
                            `${project.contratosCount} contrato${project.contratosCount > 1 ? 's' : ''}`
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">Sin contratos</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {project.tipo_gasto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos - Contratos */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Contratos Asociados ({project.contratos.length})
                        </h4>
                        
                        <div className="space-y-4">
                          {project.contratos.map((contrato, contractIndex) => (
                            <ContractDetailCard
                              key={`${contrato.bpin}-${contrato.id_contrato}-${contractIndex}`}
                              contrato={contrato}
                              contractIndex={contractIndex}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, finalFilteredData.length)} de {finalFilteredData.length} proyectos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegratedProjectsContracts
