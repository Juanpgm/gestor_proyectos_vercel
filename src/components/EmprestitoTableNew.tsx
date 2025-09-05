'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  Eye,
  Calendar,
  DollarSign,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'

interface EmprestitoContrato {
  bpin: string
  bp: string
  centro_gestor: string
  valor_contrato: number
  banco: string
  proyectos_contratos: string[]
  cdp: string
  rpc: string
  link_secop: string
  fecha_publicacion_proceso: string | null
  fecha_adjudicacion: string | null
  observaciones: string
  cantidad_contratos: number
}

interface EmprestitoProyecto {
  bpin: string
  bp: string
  centro_gestor: string
  descripcion_bp: string
  nombre_comercial: string
  banco: string
}

interface EmprestitoTableProps {
  loading?: boolean
}

const EmprestitoTable: React.FC<EmprestitoTableProps> = ({
  loading = false
}) => {
  const [contratos, setContratos] = useState<EmprestitoContrato[]>([])
  const [proyectos, setProyectos] = useState<EmprestitoProyecto[]>([])
  const [selectedProyectos, setSelectedProyectos] = useState<Set<string>>(new Set())
  const [dataLoading, setDataLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBanco, setSelectedBanco] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')
  const [sortBy, setSortBy] = useState<'valor_contrato' | 'fecha_adjudicacion' | 'bp' | 'fecha_publicacion_proceso'>('valor_contrato')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Cargar datos del archivo JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contratosResponse, proyectosResponse] = await Promise.all([
          fetch('/data/emprestito/emp_contratos.json'),
          fetch('/data/emprestito/emp_proyectos.json')
        ])
        
        const contratosData: EmprestitoContrato[] = await contratosResponse.json()
        const proyectosData: EmprestitoProyecto[] = await proyectosResponse.json()
        
        setContratos(contratosData)
        setProyectos(proyectosData)
        
        // Seleccionar todos los proyectos por defecto
        setSelectedProyectos(new Set(proyectosData.map(p => p.bpin)))
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [])

  // Obtener listas únicas para filtros
  const bancos = useMemo(() => 
    Array.from(new Set(contratos.map(item => item.banco))).filter(Boolean)
  , [contratos])

  const centrosGestor = useMemo(() => 
    Array.from(new Set(contratos.map(item => item.centro_gestor))).filter(Boolean)
  , [contratos])

  // Filtrar datos
  const filteredData = useMemo(() => {
    return contratos.filter(item => {
      // Filtro por proyectos seleccionados
      const matchesProyectoSelection = selectedProyectos.has(item.bpin)
      
      const matchesSearch = !searchTerm || 
        item.bpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bp.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.centro_gestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proyectos_contratos.some(proyecto => 
          proyecto.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const matchesBanco = !selectedBanco || item.banco === selectedBanco
      const matchesCentroGestor = !selectedCentroGestor || item.centro_gestor === selectedCentroGestor

      return matchesProyectoSelection && matchesSearch && matchesBanco && matchesCentroGestor
    })
  }, [contratos, selectedProyectos, searchTerm, selectedBanco, selectedCentroGestor])

  // Ordenar datos
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aValue: any = a[sortBy]
      let bValue: any = b[sortBy]

      if (sortBy === 'valor_contrato') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortBy === 'fecha_adjudicacion' || sortBy === 'fecha_publicacion_proceso') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortBy, sortOrder])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const toggleRowExpansion = (bpin: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(bpin)) {
      newExpandedRows.delete(bpin)
    } else {
      newExpandedRows.add(bpin)
    }
    setExpandedRows(newExpandedRows)
  }

  const toggleProyectoSelection = (bpin: string) => {
    const newSelected = new Set(selectedProyectos)
    if (newSelected.has(bpin)) {
      newSelected.delete(bpin)
    } else {
      newSelected.add(bpin)
    }
    setSelectedProyectos(newSelected)
    // Reset a la primera página cuando cambia la selección
    setCurrentPage(1)
  }

  const toggleAllProyectos = () => {
    if (selectedProyectos.size === proyectos.length) {
      setSelectedProyectos(new Set())
    } else {
      setSelectedProyectos(new Set(proyectos.map(p => p.bpin)))
    }
    setCurrentPage(1)
  }

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida'
    try {
      return new Date(fecha).toLocaleDateString('es-CO')
    } catch {
      return fecha
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestión de Empréstito - Proyectos y Contratos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selecciona proyectos para filtrar contratos relacionados
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por BPIN, BP, Centro Gestor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filtro por Banco */}
          <select
            value={selectedBanco}
            onChange={(e) => setSelectedBanco(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los bancos</option>
            {bancos.map(banco => (
              <option key={banco} value={banco}>{banco}</option>
            ))}
          </select>

          {/* Filtro por Centro Gestor */}
          <select
            value={selectedCentroGestor}
            onChange={(e) => setSelectedCentroGestor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los centros</option>
            {centrosGestor.map(centro => (
              <option key={centro} value={centro}>{centro}</option>
            ))}
          </select>

          {/* Botón de exportar */}
          <button className={`${CATEGORIES.emprestito.className.button} flex items-center gap-2 px-4 py-2 rounded-lg transition-colors`}>
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Sección de Proyectos Rediseñada */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filtro de Proyectos
                </h4>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 font-medium">
                  {selectedProyectos.size}/{proyectos.length}
                </span>
                <button
                  onClick={toggleAllProyectos}
                  className="px-4 py-1.5 bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/50 dark:hover:bg-teal-800/50 text-teal-700 dark:text-teal-300 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  {selectedProyectos.size === proyectos.length ? '✕ Limpiar' : '✓ Todos'}
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Haz clic en las tarjetas para filtrar contratos
            </div>
          </div>
          
          {/* Cards responsivas mejoradas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {proyectos.map((proyecto, index) => (
              <motion.div
                key={proyecto.bpin}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => toggleProyectoSelection(proyecto.bpin)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:scale-[1.02] ${
                  selectedProyectos.has(proyecto.bpin)
                    ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/30 dark:to-blue-900/30 shadow-lg shadow-teal-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md'
                }`}
              >
                {/* Checkbox moderno */}
                <div className="absolute top-3 left-3">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    selectedProyectos.has(proyecto.bpin)
                      ? 'border-teal-500 bg-teal-500 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-teal-400 bg-white dark:bg-gray-700'
                  }`}>
                    {selectedProyectos.has(proyecto.bpin) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Contenido del proyecto */}
                <div className="ml-8">
                  {/* Header con badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-blue-600 px-2.5 py-1 rounded-md shadow-sm">
                      {proyecto.bp}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {proyecto.bpin.slice(-4)}
                    </span>
                  </div>

                  {/* Nombre del proyecto */}
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 leading-tight line-clamp-2 min-h-[2.5rem]">
                    {proyecto.nombre_comercial}
                  </h5>

                  {/* Metadatos con iconos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {proyecto.centro_gestor.replace('Secretaría de ', '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                        {proyecto.banco}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indicador de selección mejorado */}
                {selectedProyectos.has(proyecto.bpin) && (
                  <div className="absolute inset-0 border-2 border-teal-500 rounded-xl pointer-events-none">
                    <div className="absolute top-2 right-2 w-3 h-3 bg-teal-500 rounded-full shadow-lg animate-pulse"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Header de Contratos Filtrados */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Contratos Filtrados
            </h4>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
            {sortedData.length} encontrados
          </span>
        </div>
      </div>

      {/* Tabla de Contratos Compacta */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
                
              </th>
              <th 
                onClick={() => handleSort('bp')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                Proyecto
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contratos
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Banco
              </th>
              <th 
                onClick={() => handleSort('valor_contrato')}
                className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
              >
                Valor
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item, index) => (
              <React.Fragment key={item.bpin}>
                {/* Fila principal compacta */}
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group"
                >
                  {/* Columna de expansión */}
                  <td className="px-3 py-4">
                    <button
                      onClick={() => toggleRowExpansion(item.bpin)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={!item.proyectos_contratos || item.proyectos_contratos.length <= 1}
                    >
                      {item.proyectos_contratos && item.proyectos_contratos.length > 1 ? (
                        expandedRows.has(item.bpin) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  
                  {/* Información del proyecto */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col max-w-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-2 py-0.5 rounded">
                          {item.bp}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {item.bpin.slice(-4)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {item.centro_gestor.replace('Secretaría de ', '')}
                      </span>
                    </div>
                  </td>

                  {/* Información de contratos */}
                  <td className="px-3 py-4">
                    <div className="flex flex-col max-w-sm">
                      {item.proyectos_contratos && item.proyectos_contratos.length > 0 ? (
                        <>
                          <span className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {item.proyectos_contratos[0]}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {item.cantidad_contratos} contrato{item.cantidad_contratos !== 1 ? 's' : ''}
                            </span>
                            {item.proyectos_contratos.length > 1 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{item.proyectos_contratos.length - 1} más
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Sin contratos definidos
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Banco */}
                  <td className="px-3 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-200">
                      {item.banco}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="px-3 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatNumber(item.valor_contrato, 'currency')}
                    </span>
                  </td>

                  {/* Estado/Fechas */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex flex-col gap-1">
                      {item.fecha_adjudicacion ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                          Adjudicado
                        </span>
                      ) : item.fecha_publicacion_proceso ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                          En proceso
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center space-x-1">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/50"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.link_secop && (
                        <button 
                          className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-md hover:bg-green-50 dark:hover:bg-green-900/50"
                          title="Ver en SECOP"
                          onClick={() => window.open(item.link_secop, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>

                {/* Fila expandible mejorada */}
                <AnimatePresence>
                  {expandedRows.has(item.bpin) && item.proyectos_contratos && item.proyectos_contratos.length > 1 && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20"
                    >
                      <td colSpan={7} className="px-6 py-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg">
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Detalle de Contratos
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.proyectos_contratos.length} contratos en total
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.proyectos_contratos.map((contrato, contratoIndex) => (
                              <motion.div
                                key={contratoIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: contratoIndex * 0.1 }}
                                className="relative p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-sm font-bold text-white">
                                      {contratoIndex + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                                      {contrato}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          
                          {/* Información adicional */}
                          {(item.observaciones || item.cdp || item.rpc || item.fecha_publicacion_proceso || item.fecha_adjudicacion) && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Información Adicional
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                {item.fecha_publicacion_proceso && (
                                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                                    <span className="block font-medium text-blue-900 dark:text-blue-300 mb-1">Publicación:</span>
                                    <span className="text-blue-700 dark:text-blue-400">{formatFecha(item.fecha_publicacion_proceso)}</span>
                                  </div>
                                )}
                                {item.fecha_adjudicacion && (
                                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                                    <span className="block font-medium text-green-900 dark:text-green-300 mb-1">Adjudicación:</span>
                                    <span className="text-green-700 dark:text-green-400">{formatFecha(item.fecha_adjudicacion)}</span>
                                  </div>
                                )}
                                {item.cdp && (
                                  <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                                    <span className="block font-medium text-purple-900 dark:text-purple-300 mb-1">CDP:</span>
                                    <span className="text-purple-700 dark:text-purple-400 font-mono">{item.cdp}</span>
                                  </div>
                                )}
                                {item.rpc && (
                                  <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
                                    <span className="block font-medium text-orange-900 dark:text-orange-300 mb-1">RPC:</span>
                                    <span className="text-orange-700 dark:text-orange-400 font-mono">{item.rpc}</span>
                                  </div>
                                )}
                              </div>
                              {item.observaciones && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                  <span className="block font-medium text-gray-900 dark:text-gray-300 mb-2">Observaciones:</span>
                                  <p className="text-gray-700 dark:text-gray-400 text-sm leading-relaxed">{item.observaciones}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación mejorada */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> de <span className="font-medium">{sortedData.length}</span> contratos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmprestitoTable
