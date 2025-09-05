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
  const [proyectos, setProyectos] = useState<EmprestitoProyecto[]>([])
  const [contratos, setContratos] = useState<EmprestitoContrato[]>([])
  const [selectedProyectos, setSelectedProyectos] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [dataLoading, setDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBanco, setSelectedBanco] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')

  // Cargar datos del archivo JSON
  useEffect(() => {
    const loadData = async () => {
      try {
        const [proyectosResponse, contratosResponse] = await Promise.all([
          fetch('/data/emprestito/emp_proyectos.json'),
          fetch('/data/emprestito/emp_contratos.json')
        ])
        
        const proyectosData: EmprestitoProyecto[] = await proyectosResponse.json()
        const contratosData: EmprestitoContrato[] = await contratosResponse.json()
        
        setProyectos(proyectosData)
        setContratos(contratosData)
        
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
    Array.from(new Set(proyectos.map(proyecto => proyecto.banco))).filter(Boolean)
  , [proyectos])

  const centrosGestor = useMemo(() => 
    Array.from(new Set(proyectos.map(proyecto => proyecto.centro_gestor))).filter(Boolean)
  , [proyectos])

  // Filtrar datos
  const filteredData = useMemo(() => {
    return proyectos.filter(proyecto => {
      const matchesSearch = !searchTerm || 
        proyecto.bpin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proyecto.centro_gestor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proyecto.banco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proyecto.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proyecto.descripcion_bp.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBanco = !selectedBanco || proyecto.banco === selectedBanco
      const matchesCentroGestor = !selectedCentroGestor || proyecto.centro_gestor === selectedCentroGestor
      const isSelected = selectedProyectos.has(proyecto.bpin)

      return matchesSearch && matchesBanco && matchesCentroGestor && isSelected
    })
  }, [proyectos, selectedProyectos, searchTerm, selectedBanco, selectedCentroGestor])

  const toggleProyectoSelection = (bpin: string) => {
    const newSelected = new Set(selectedProyectos)
    if (newSelected.has(bpin)) {
      newSelected.delete(bpin)
    } else {
      newSelected.add(bpin)
    }
    setSelectedProyectos(newSelected)
  }

  const toggleAllProyectos = () => {
    if (selectedProyectos.size === proyectos.length) {
      setSelectedProyectos(new Set())
    } else {
      setSelectedProyectos(new Set(proyectos.map(p => p.bpin)))
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

  // Reiniciar todos los filtros
  const resetFilters = () => {
    setSearchTerm('')
    setSelectedBanco('')
    setSelectedCentroGestor('')
    setSelectedProyectos(new Set(proyectos.map(p => p.bpin)))
  }

  // Obtener contratos para un proyecto específico
  const getContratosForProyecto = (bpin: string, bp: string) => {
    return contratos.filter(contrato => 
      contrato.bpin === bpin || contrato.bp === bp
    )
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
              Haz clic en las filas para seleccionar proyectos y expandir para ver contratos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda - 50% del espacio en desktop */}
          <div className="relative flex-1 md:w-1/2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por BPIN, Centro Gestor, Proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Contenedor para los selectores y botón - 50% restante */}
          <div className="flex gap-4 flex-1 md:w-1/2">
            {/* Filtro por Banco */}
            <select
              value={selectedBanco}
              onChange={(e) => setSelectedBanco(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos los centros</option>
              {centrosGestor.map(centro => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>

            {/* Botón de reiniciar filtros */}
            <button 
              onClick={resetFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Limpiar Filtros
            </button>
          </div>
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
              Haz clic en las filas para seleccionar y en ▼ para ver contratos
            </div>
          </div>
          
          {/* Tabla de proyectos compacta */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">
                      
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">
                      BPIN
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                      Centro Gestor
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                      Banco
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                      Contratos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((proyecto, index) => {
                    const proyectoContratos = getContratosForProyecto(proyecto.bpin, proyecto.bp)
                    const hasContratos = proyectoContratos.length > 0
                    const isExpanded = expandedRows.has(proyecto.bpin)
                    
                    return (
                      <React.Fragment key={proyecto.bpin}>
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          onClick={() => toggleProyectoSelection(proyecto.bpin)}
                          className={`cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900/30 ${
                            selectedProyectos.has(proyecto.bpin)
                              ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500'
                              : ''
                          }`}
                        >
                          <td className="px-2 py-3">
                            {hasContratos ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleRowExpansion(proyecto.bpin)
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 h-4" />
                            )}
                          </td>
                          <td className="px-2 py-3">
                            <span className="text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-blue-600 px-2 py-1 rounded-md shadow-sm">
                              {proyecto.bpin}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                                {proyecto.nombre_comercial}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                {proyecto.descripcion_bp}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600 dark:text-gray-300 leading-tight">
                                {proyecto.centro_gestor.length > 35 
                                  ? `${proyecto.centro_gestor.substring(0, 35)}...` 
                                  : proyecto.centro_gestor}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0"></div>
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {proyecto.banco}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            {hasContratos ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {proyectoContratos.length}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                        </motion.tr>

                        {/* Fila expandible para contratos */}
                        <AnimatePresence>
                          {isExpanded && hasContratos && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/20 dark:to-blue-900/20"
                            >
                              <td colSpan={6} className="px-6 py-6">
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-lg">
                                      <FileText className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Contratos Relacionados
                                      </h4>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {proyectoContratos.length} contrato{proyectoContratos.length !== 1 ? 's' : ''} encontrado{proyectoContratos.length !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    {proyectoContratos.map((contrato, contratoIndex) => (
                                      <motion.div
                                        key={`${contrato.bpin}-${contrato.bp}-${contratoIndex}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: contratoIndex * 0.1 }}
                                        className="p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-1 rounded-md">
                                              Contrato #{contratoIndex + 1}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {contrato.bp}
                                            </span>
                                          </div>
                                          {contrato.link_secop && (
                                            <button 
                                              onClick={() => window.open(contrato.link_secop, '_blank')}
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              SECOP
                                            </button>
                                          )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          <div>
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor del Contrato:</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                              {formatNumber(contrato.valor_contrato, 'currency')}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Centro Gestor:</span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                              {contrato.centro_gestor}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Banco:</span>
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                              {contrato.banco}
                                            </span>
                                          </div>
                                          {contrato.cdp && (
                                            <div>
                                              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CDP:</span>
                                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                {contrato.cdp}
                                              </span>
                                            </div>
                                          )}
                                          {contrato.rpc && (
                                            <div>
                                              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">RPC:</span>
                                              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                {contrato.rpc}
                                              </span>
                                            </div>
                                          )}
                                          {contrato.fecha_publicacion_proceso && (
                                            <div>
                                              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">F. Publicación:</span>
                                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(contrato.fecha_publicacion_proceso).toLocaleDateString('es-CO')}
                                              </span>
                                            </div>
                                          )}
                                          {contrato.fecha_adjudicacion && (
                                            <div>
                                              <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">F. Adjudicación:</span>
                                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(contrato.fecha_adjudicacion).toLocaleDateString('es-CO')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {contrato.proyectos_contratos && contrato.proyectos_contratos.length > 0 && (
                                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Proyectos del Contrato:</span>
                                            <div className="flex flex-wrap gap-1">
                                              {contrato.proyectos_contratos.map((proyectoContrato, idx) => (
                                                <span key={idx} className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                  {proyectoContrato}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {contrato.observaciones && (
                                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Observaciones:</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">
                                              {contrato.observaciones}
                                            </p>
                                          </div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmprestitoTable
