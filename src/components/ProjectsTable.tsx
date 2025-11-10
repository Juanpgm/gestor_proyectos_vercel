'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Building2,
  Filter,
  X,
  ChevronDown,
  Check
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
  nombre_fondo?: string
  clasificacion_fondo?: string
}

interface ProjectsTableProps {
  className?: string
  showFilters?: boolean
  compact?: boolean
}

// Tipos para filtros
interface ProjectFilters {
  searchTerm: string
  status: string
  centroGestor: string
  comuna: string
  nombreFondo: string
  clasificacionFondo: string
  minBudget: string
  maxBudget: string
  minProgress: string
  maxProgress: string
}

type SortKey = keyof Project
type SortDirection = 'asc' | 'desc'

// Componente de dropdown mejorado
const FilterDropdown: React.FC<{
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  className?: string
}> = ({ label, value, onChange, options, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const displayValue = value || placeholder

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      >
        <span className="truncate text-left">
          {displayValue}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-2 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-64 overflow-hidden"
          >
            {/* Búsqueda interna */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Opción para limpiar */}
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
                setSearchTerm('')
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
            >
              <span className="italic">{placeholder}</span>
            </button>

            {/* Lista de opciones */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No se encontraron opciones
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = value === option
                  
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        onChange(option)
                        setIsOpen(false)
                        setSearchTerm('')
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate flex-1">
                        {option}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

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
  const [isMobileView, setIsMobileView] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  
  // Estados para filtros locales
  const [localFilters, setLocalFilters] = useState<ProjectFilters>({
    searchTerm: '',
    status: '',
    centroGestor: '',
    comuna: '',
    nombreFondo: '',
    clasificacionFondo: '',
    minBudget: '',
    maxBudget: '',
    minProgress: '',
    maxProgress: ''
  })

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
          texto2: proyecto.nombre_linea_estrategica || 'Línea estratégica',
          nombre_fondo: proyecto.nombre_fondo || movimiento?.nombre_fondo || 'No especificado',
          clasificacion_fondo: proyecto.clasificacion_fondo || movimiento?.clasificacion_fondo || 'No especificada'
        } as Project
      })

    return projectsArray
  }, [filteredMovimientosPresupuestales, filteredProyectos, ejecucionPresupuestal, seguimientoPa])

  // Filtros aplicados localmente
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filtro de búsqueda
      if (localFilters.searchTerm) {
        const searchTerm = localFilters.searchTerm.toLowerCase()
        const searchableText = [
          project.name,
          project.bpin,
          project.responsible,
          project.comuna || '',
          project.descripcion || '',
          project.texto1 || '',
          project.texto2 || '',
          project.nombre_fondo || '',
          project.clasificacion_fondo || ''
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) return false
      }

      // Filtro por estado
      if (localFilters.status && localFilters.status !== project.status) {
        return false
      }

      // Filtro por centro gestor
      if (localFilters.centroGestor && localFilters.centroGestor !== project.responsible) {
        return false
      }

      // Filtro por comuna
      if (localFilters.comuna && localFilters.comuna !== (project.comuna || '')) {
        return false
      }

      // Filtro por nombre de fondo
      if (localFilters.nombreFondo && localFilters.nombreFondo !== (project.nombre_fondo || '')) {
        return false
      }

      // Filtro por clasificación de fondo
      if (localFilters.clasificacionFondo && localFilters.clasificacionFondo !== (project.clasificacion_fondo || '')) {
        return false
      }

      // Filtro por presupuesto mínimo
      if (localFilters.minBudget) {
        const minBudget = parseFloat(localFilters.minBudget)
        if (!isNaN(minBudget) && project.budget < minBudget) return false
      }

      // Filtro por presupuesto máximo
      if (localFilters.maxBudget) {
        const maxBudget = parseFloat(localFilters.maxBudget)
        if (!isNaN(maxBudget) && project.budget > maxBudget) return false
      }

      // Filtro por progreso mínimo
      if (localFilters.minProgress) {
        const minProgress = parseFloat(localFilters.minProgress)
        if (!isNaN(minProgress) && project.progress < minProgress) return false
      }

      // Filtro por progreso máximo
      if (localFilters.maxProgress) {
        const maxProgress = parseFloat(localFilters.maxProgress)
        if (!isNaN(maxProgress) && project.progress > maxProgress) return false
      }

      return true
    })
  }, [projects, localFilters])

  // Opciones para dropdowns
  const filterOptions = useMemo(() => {
    const statuses = Array.from(new Set(projects.map(p => p.status))).sort()
    const centrosGestores = Array.from(new Set(projects.map(p => p.responsible))).filter(Boolean).sort()
    const comunas = Array.from(new Set(projects.map(p => p.comuna).filter(Boolean))).sort() as string[]
    const nombresFondo = Array.from(new Set(projects.map(p => p.nombre_fondo).filter(Boolean))).sort() as string[]
    const clasificacionesFondo = Array.from(new Set(projects.map(p => p.clasificacion_fondo).filter(Boolean))).sort() as string[]

    return {
      statuses,
      centrosGestores,
      comunas,
      nombresFondo,
      clasificacionesFondo
    }
  }, [projects])

  // Función para limpiar filtros
  const clearFilters = () => {
    setLocalFilters({
      searchTerm: '',
      status: '',
      centroGestor: '',
      comuna: '',
      nombreFondo: '',
      clasificacionFondo: '',
      minBudget: '',
      maxBudget: '',
      minProgress: '',
      maxProgress: ''
    })
  }

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(localFilters).filter(value => value !== '').length
  }, [localFilters])

  // Función para actualizar filtro
  const updateFilter = (key: keyof ProjectFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

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

  // Reset page when projects change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredProjects.length])

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
      {/* Panel de filtros colapsable */}
      <AnimatePresence>
        {showFilters && showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`${CSS_UTILS.card} mb-4 overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Filtros de Proyectos
                  </h3>
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Búsqueda general */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Búsqueda General
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, BPIN, descripción..."
                    value={localFilters.searchTerm}
                    onChange={(e) => updateFilter('searchTerm', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Primera fila de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Estado */}
                <FilterDropdown
                  label="Estado"
                  value={localFilters.status}
                  onChange={(value) => updateFilter('status', value)}
                  options={filterOptions.statuses}
                  placeholder="Todos los estados"
                />

                {/* Centro Gestor */}
                <FilterDropdown
                  label="Centro Gestor"
                  value={localFilters.centroGestor}
                  onChange={(value) => updateFilter('centroGestor', value)}
                  options={filterOptions.centrosGestores}
                  placeholder="Todos los centros"
                />

                {/* Comuna */}
                <FilterDropdown
                  label="Comuna"
                  value={localFilters.comuna}
                  onChange={(value) => updateFilter('comuna', value)}
                  options={filterOptions.comunas}
                  placeholder="Todas las comunas"
                />

                {/* Presupuesto mínimo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Presupuesto Mínimo (COP)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={localFilters.minBudget}
                    onChange={(e) => updateFilter('minBudget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Segunda fila de filtros con fondos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Nombre del Fondo */}
                <FilterDropdown
                  label="Nombre del Fondo"
                  value={localFilters.nombreFondo}
                  onChange={(value) => updateFilter('nombreFondo', value)}
                  options={filterOptions.nombresFondo}
                  placeholder="Todos los fondos"
                />

                {/* Clasificación del Fondo */}
                <FilterDropdown
                  label="Clasificación del Fondo"
                  value={localFilters.clasificacionFondo}
                  onChange={(value) => updateFilter('clasificacionFondo', value)}
                  options={filterOptions.clasificacionesFondo}
                  placeholder="Todas las clasificaciones"
                />

                {/* Presupuesto máximo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Presupuesto Máximo (COP)
                  </label>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={localFilters.maxBudget}
                    onChange={(e) => updateFilter('maxBudget', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Progreso mínimo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Progreso Mínimo (%)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={localFilters.minProgress}
                    onChange={(e) => updateFilter('minProgress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tercera fila de filtros con rangos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Progreso máximo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Progreso Máximo (%)
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={localFilters.maxProgress}
                    onChange={(e) => updateFilter('maxProgress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Espacio vacío para balance visual */}
                <div></div>
              </div>

              {/* Estadísticas de filtros */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>Total proyectos: {projects.length}</span>
                  <span>Filtrados: {filteredProjects.length}</span>
                  <span>Estados disponibles: {filterOptions.statuses.length}</span>
                  <span>Centros gestores: {filterOptions.centrosGestores.length}</span>
                  <span>Comunas: {filterOptions.comunas.length}</span>
                  <span>Fondos: {filterOptions.nombresFondo.length}</span>
                  <span>Clasificaciones: {filterOptions.clasificacionesFondo.length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <div className={`${CSS_UTILS.card} overflow-hidden`}>
          {/* Header mejorado con controles */}
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
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {filteredProjects.length} de {projects.length} proyectos
                    {activeFiltersCount > 0 && ` • ${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} activo${activeFiltersCount > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-2">
                {showFilters && (
                  <button
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      showFiltersPanel || activeFiltersCount > 0
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {activeFiltersCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                )}
                
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-2 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Limpiar todos los filtros"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
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
                className={`p-3 rounded-lg transition-colors min-w-[44px] h-[44px] flex items-center justify-center ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 py-1 text-gray-400 min-w-[44px] h-[44px] flex items-center justify-center">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[44px] h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
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
                className={`p-3 rounded-lg transition-colors min-w-[44px] h-[44px] flex items-center justify-center ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
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
