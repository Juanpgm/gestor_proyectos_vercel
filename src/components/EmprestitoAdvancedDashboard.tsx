'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  DollarSign,
  Building2,
  FileText,
  Target,
  Activity,
  Filter,
  Download,
  Briefcase,
  MapPin,
  Search,
  Calendar,
  LineChart,
  Eye,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react'
import { CATEGORIES, formatNumber, CHART_COLORS } from '@/lib/design-system'
import ContratosModal from './ContratosModal'
import { IPadOptimizedContainer, IPadOptimizedTable, IPadOptimizedButton } from './IPadOptimizedContainer'
import { useIPadClasses } from '@/hooks/useIPadDetection'

// Tipos para los reportes de contratos (usar la estructura existente)
interface ReporteContratoTS extends ReporteEmprestito {
  // Extendemos ReporteEmprestito con campos adicionales que necesitamos
}

// Tipos para la ordenación de tabla
type SortField = 'proceso' | 'banco' | 'estado' | 'valor_contrato' | 'avance_financiero' | 'avance_fisico' | 'observaciones'
type SortDirection = 'asc' | 'desc'

interface SortState {
  field: SortField | null
  direction: SortDirection
}

// Tipo para los datos de series de tiempo
interface TimeSeriesData {
  fecha: string
  valor_pagado: number
  valor_contrato: number
  contratos_count: number
  avance_fisico_promedio: number
  avance_financiero_promedio: number
  total_avance_fisico: number
  total_avance_financiero: number
}

// Hook para procesar datos de series de tiempo
const useTimeSeriesData = (reportes: ReporteEmprestito[], contratos: ContratoEmprestito[]) => {
  return useMemo(() => {
    // Crear un mapa de contratos para obtener información adicional
    const contratoMap = new Map<string, ContratoEmprestito>()
    contratos.forEach(contrato => {
      if (contrato.referencia_contrato) {
        contratoMap.set(contrato.referencia_contrato, contrato)
      }
    })
    
    // Agrupar por fecha
    const dateMap = new Map<string, TimeSeriesData>()
    
    reportes.forEach(reporte => {
      if (!reporte.fecha_reporte) return
      
      const fecha = reporte.fecha_reporte.split('T')[0] // Obtener solo la fecha
      const contrato = contratoMap.get(reporte.referencia_contrato)
      
      if (!dateMap.has(fecha)) {
        dateMap.set(fecha, {
          fecha,
          valor_pagado: 0,
          valor_contrato: 0,
          contratos_count: 0,
          avance_fisico_promedio: 0,
          avance_financiero_promedio: 0,
          total_avance_fisico: 0,
          total_avance_financiero: 0
        })
      }
      
      const data = dateMap.get(fecha)!
      // Usar avance financiero como proxy del valor pagado
      const valorContrato = Number(contrato?.valor_contrato) || 0
      data.valor_pagado += (valorContrato * (reporte.avance_financiero / 100)) || 0
      data.valor_contrato += valorContrato
      data.contratos_count += 1
      
      // Acumular avances para calcular promedios
      data.total_avance_fisico += reporte.avance_fisico || 0
      data.total_avance_financiero += reporte.avance_financiero || 0
    })
    
    // Calcular promedios y convertir a array
    const result = Array.from(dateMap.values()).map(data => ({
      ...data,
      avance_fisico_promedio: data.contratos_count > 0 ? data.total_avance_fisico / data.contratos_count : 0,
      avance_financiero_promedio: data.contratos_count > 0 ? data.total_avance_financiero / data.contratos_count : 0
    }))
    
    return result.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [reportes, contratos])
}

// Componente de Series de Tiempo
const TimeSeriesChart: React.FC<{ reportes: ReporteEmprestito[], contratos: ContratoEmprestito[] }> = ({ reportes, contratos }) => {
  const [viewType, setViewType] = useState<'banco' | 'centro_gestor' | 'contrato'>('banco')
  const [selectedFilter, setSelectedFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Mostrar indicador de carga si no hay datos aún
  const isLoading = reportes.length === 0 && contratos.length === 0
  
  const timeSeriesData = useTimeSeriesData(reportes, contratos)
  
  // Obtener opciones únicas para filtros basándose en los reportes y contratos
  const filterOptions = useMemo(() => {
    const options = new Set<string>()
    
    switch (viewType) {
      case 'banco':
        // Para bancos, usar los contratos
        contratos.forEach(contrato => {
          if (contrato.banco) options.add(contrato.banco)
        })
        break
      case 'centro_gestor':
        // Para centros gestores, usar los reportes directamente
        reportes.forEach(reporte => {
          if (reporte.nombre_centro_gestor) options.add(reporte.nombre_centro_gestor)
        })
        break
      case 'contrato':
        // Para contratos, usar los reportes
        reportes.forEach(reporte => {
          if (reporte.referencia_contrato) options.add(reporte.referencia_contrato)
        })
        break
    }
    
    return Array.from(options).sort()
  }, [contratos, reportes, viewType])
  
  // Filtrar opciones por búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return filterOptions
    return filterOptions.filter(option => 
      option.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [filterOptions, searchTerm])
  
  // Datos filtrados por selección
  const filteredTimeSeriesData = useMemo(() => {
    if (!selectedFilter) return timeSeriesData
    
    // Filtrar reportes según el tipo de vista
    const reportesFiltrados = reportes.filter(reporte => {
      switch (viewType) {
        case 'banco':
          // Para banco, necesitamos encontrar el contrato correspondiente
          const contrato = contratos.find(c => c.referencia_contrato === reporte.referencia_contrato)
          return contrato?.banco === selectedFilter
        case 'centro_gestor':
          return reporte.nombre_centro_gestor === selectedFilter
        case 'contrato':
          return reporte.referencia_contrato === selectedFilter
        default:
          return true
      }
    })
    
    // Crear un mapa de contratos para obtener información adicional
    const contratoMap = new Map<string, ContratoEmprestito>()
    contratos.forEach(contrato => {
      if (contrato.referencia_contrato) {
        contratoMap.set(contrato.referencia_contrato, contrato)
      }
    })
    
    // Agrupar reportes filtrados por fecha
    const dateMap = new Map<string, TimeSeriesData>()
    
    reportesFiltrados.forEach(reporte => {
      if (!reporte.fecha_reporte) return
      
      const fecha = reporte.fecha_reporte.split('T')[0]
      const contrato = contratoMap.get(reporte.referencia_contrato)
      
      if (!dateMap.has(fecha)) {
        dateMap.set(fecha, {
          fecha,
          valor_pagado: 0,
          valor_contrato: 0,
          contratos_count: 0,
          avance_fisico_promedio: 0,
          avance_financiero_promedio: 0,
          total_avance_fisico: 0,
          total_avance_financiero: 0
        })
      }
      
      const data = dateMap.get(fecha)!
      const valorContrato = Number(contrato?.valor_contrato) || 0
      data.valor_pagado += (valorContrato * (reporte.avance_financiero / 100)) || 0
      data.valor_contrato += valorContrato
      data.contratos_count += 1
      
      // Acumular avances para calcular promedios
      data.total_avance_fisico += reporte.avance_fisico || 0
      data.total_avance_financiero += reporte.avance_financiero || 0
    })
    
    // Calcular promedios y devolver ordenado
    const filteredResult = Array.from(dateMap.values()).map(data => ({
      ...data,
      avance_fisico_promedio: data.contratos_count > 0 ? data.total_avance_fisico / data.contratos_count : 0,
      avance_financiero_promedio: data.contratos_count > 0 ? data.total_avance_financiero / data.contratos_count : 0
    }))
    
    return filteredResult.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  }, [reportes, contratos, viewType, selectedFilter, timeSeriesData])
  
  // Calcular valores máximos para escalas basado en los totales
  const maxValue = useMemo(() => {
    return Math.max(
      100, // Mínimo 100 para que se vea bien
      ...filteredTimeSeriesData.map(d => Math.max(d.total_avance_fisico, d.total_avance_financiero))
    )
  }, [filteredTimeSeriesData])
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <LineChart className="w-6 h-6 text-teal-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Series de Tiempo - Avance de Contratos (%)
        </h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin" />
            Cargando datos...
          </div>
        )}
      </div>
      
      {/* Controles de filtrado */}
      <IPadOptimizedContainer type="grid" cols={3} className="gap-4 mb-6">
        {/* Selector de tipo de vista */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ver por:
          </label>
          <select
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value as 'banco' | 'centro_gestor' | 'contrato')
              setSelectedFilter('')
              setSearchTerm('')
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="banco">Banco</option>
            <option value="centro_gestor">Centro Gestor</option>
            <option value="contrato">Contrato Específico</option>
          </select>
        </div>
        
        {/* Barra de búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar {viewType === 'centro_gestor' ? 'Centro Gestor' : viewType === 'banco' ? 'Banco' : 'Contrato'}:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar ${viewType === 'centro_gestor' ? 'centro gestor' : viewType}...`}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        {/* Selector específico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar:
          </label>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos</option>
            {filteredOptions.slice(0, 50).map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </IPadOptimizedContainer>
      
      {/* Gráfico de líneas */}
      <div className="h-80 relative">
        {filteredTimeSeriesData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                No hay datos disponibles
              </h4>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {selectedFilter 
                  ? `No se encontraron reportes para ${selectedFilter}`
                  : 'No hay reportes de contratos para mostrar'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <svg className="w-full h-full">
              {/* Líneas de referencia */}
              {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
                <g key={fraction}>
                  <line
                    x1="80"
                    y1={320 - (fraction * 240)}
                    x2="100%"
                    y2={320 - (fraction * 240)}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <text
                    x="10"
                    y={325 - (fraction * 240)}
                    className="text-xs fill-current text-gray-500 dark:text-gray-400"
                    textAnchor="start"
                  >
                    {(maxValue * fraction).toFixed(0)}%
                  </text>
                </g>
              ))}
              
              {/* Líneas de datos */}
              {filteredTimeSeriesData.length > 1 && (
                <>
                  {/* Línea de avance financiero total */}
                  <path
                    d={filteredTimeSeriesData.map((point, index) => {
                      const x = 80 + (index / (filteredTimeSeriesData.length - 1)) * (100 - 80)
                      const y = 320 - ((point.total_avance_financiero / maxValue) * 240)
                      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  
                  {/* Línea de avance físico total */}
                  <path
                    d={filteredTimeSeriesData.map((point, index) => {
                      const x = 80 + (index / (filteredTimeSeriesData.length - 1)) * (100 - 80)
                      const y = 320 - ((point.total_avance_fisico / maxValue) * 240)
                      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  
                  {/* Puntos de datos */}
                  {filteredTimeSeriesData.map((point, index) => {
                    const x = 80 + (index / (filteredTimeSeriesData.length - 1)) * (100 - 80)
                    const yFinanciero = 320 - ((point.total_avance_financiero / maxValue) * 240)
                    const yFisico = 320 - ((point.total_avance_fisico / maxValue) * 240)
                    
                    return (
                      <g key={point.fecha}>
                        <circle cx={`${x}%`} cy={yFinanciero} r="4" fill="#3b82f6" className="hover:r-6 cursor-pointer">
                          <title>{`Total Avance Financiero: ${point.total_avance_financiero.toFixed(1)}%`}</title>
                        </circle>
                        <circle cx={`${x}%`} cy={yFisico} r="4" fill="#10b981" className="hover:r-6 cursor-pointer">
                          <title>{`Total Avance Físico: ${point.total_avance_fisico.toFixed(1)}%`}</title>
                        </circle>
                      </g>
                    )
                  })}
                </>
              )}
            </svg>
          </div>
        )}
        
        {/* Etiquetas de fechas */}
        {filteredTimeSeriesData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-20">
            {filteredTimeSeriesData.slice(0, 10).map((point, index) => (
              <div key={point.fecha} className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45">
                {new Date(point.fecha).toLocaleDateString('es-CO', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Avance Financiero</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Avance Físico</span>
        </div>
      </div>
      
      {/* Resumen de datos */}
      <IPadOptimizedContainer type="grid" cols={4} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Puntos de Datos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredTimeSeriesData.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Avance Financiero</p>
          <p className="text-lg font-semibold text-blue-600">
            {filteredTimeSeriesData.reduce((sum, d) => sum + d.total_avance_financiero, 0).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Avance Físico</p>
          <p className="text-lg font-semibold text-green-600">
            {filteredTimeSeriesData.reduce((sum, d) => sum + d.total_avance_fisico, 0).toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Contratos</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredTimeSeriesData.reduce((sum, d) => sum + d.contratos_count, 0)}
          </p>
        </div>
      </IPadOptimizedContainer>
    </motion.div>
  )
}

// Componente GaugeChart
const GaugeChart: React.FC<{
  title: string
  description?: string
  percentage: number
  value: number
  total: number
  color: string
  icon: React.ReactNode
  showMonetaryValues?: boolean
}> = ({ title, description, percentage, value, total, color, icon, showMonetaryValues = true }) => {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col h-[450px]"
    >
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
          {title}
        </h4>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={color}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ strokeDasharray }}
            />
          </svg>
          
          {/* Percentage in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {percentage.toFixed(1)}%
            </motion.span>
          </div>
        </div>
        
        {/* Descriptive legend */}
        {description && (
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        )}
        
        {showMonetaryValues && (
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {formatNumber(value, 'currency')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              de {formatNumber(total, 'currency')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Componente de Resumen Ejecutivo
const ResumenEjecutivo: React.FC<{
  analysisByBank: AnalysisByBank[]
  analysisByCentroGestor: AnalysisByCentroGestor[]
  totalContratos: number
  valorTotalAsignado: number
  valorTotalAsignadoBanco: number
}> = ({ analysisByBank, analysisByCentroGestor, totalContratos, valorTotalAsignado, valorTotalAsignadoBanco }) => {
  const topBanco = analysisByBank[0]
  const topCentroGestor = analysisByCentroGestor[0]
  
  return (
    <div className="space-y-6 mb-6">
      {/* Resumen Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 adaptive-width dashboard-card"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Resumen Ejecutivo
        </h3>
        <IPadOptimizedContainer type="grid" cols={4} className="gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Contratos Totales</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(totalContratos)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Valor Total</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatNumber(valorTotalAsignado, 'currency')}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">Bancos Activos</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analysisByBank.length}</p>
          </div>
          <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <p className="text-sm text-teal-600 dark:text-teal-400">Centros Gestores</p>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{analysisByCentroGestor.length}</p>
          </div>
        </IPadOptimizedContainer>
      </motion.div>

      {/* Distribución por Bancos y Centros Gestores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Distribución por Bancos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Distribución por Banco
          </h4>
          <div className="space-y-3">
            {analysisByBank.slice(0, 5).map((bank, index) => (
              <div key={bank.banco} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={bank.banco}>
                    {bank.banco}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(bank.totalContratos)} contratos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatNumber(bank.valorAdjudicado, 'currency')}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(bank.valorAdjudicado / Math.max(...analysisByBank.map(b => b.valorAdjudicado))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Centro Gestor */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            Distribución por Centro Gestor
          </h4>
          <div className="space-y-3">
            {analysisByCentroGestor.slice(0, 5).map((centro, index) => (
              <div key={centro.centroGestor} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words leading-tight" title={centro.centroGestor}>
                    {centro.centroGestor}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(centro.totalContratos)} contratos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    {formatNumber(centro.valorAdjudicado, 'currency')}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-cyan-600 h-2 rounded-full" 
                      style={{ width: `${(centro.valorAdjudicado / Math.max(...analysisByCentroGestor.map(c => c.valorAdjudicado))) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Interfaces para tipado
interface ContratoEmprestito {
  id: string
  referencia_contrato: string
  nombre_resumido_proceso: string
  descripcion_proceso: string
  nombre_centro_gestor: string
  entidad_contratante: string
  banco: string
  estado_contrato: string
  valor_contrato: number
  valor_del_contrato?: number
  valor_pagado: string
  fecha_inicio_contrato?: string
  fecha_fin_contrato?: string
  fecha_firma_contrato?: string
  sector: string
  tipo_contrato: string
  objeto_contrato: string
  proceso_contractual: string
  bpin?: number
  bp?: string
  representante_legal?: string
  ordenador_gasto?: string
  supervisor?: string
  modalidad_contratacion?: string
  nombre_contratista?: string
  nit_entidad?: string
  nit_contratista?: string
  urlproceso?: {
    url: string
  }
}

interface ReporteEmprestito {
  id: string
  referencia_contrato: string
  avance_fisico: number
  avance_financiero: number
  fecha_reporte: string
  observaciones: string
  nombre_centro_gestor: string
  nombre_centro_gestor_source: string
  estado_reporte: string
  alertas: {
    descripcion: string
    es_alerta: boolean
    tipos: string[]
  }
  archivos_evidencia?: Array<{
    url: string
    drive_id: string
    name: string
    type: string
    size: number
    status: string
    download_url: string
  }>
  url_carpeta_drive?: string
}

interface BancoEmprestito {
  nombre_banco: string
  nombre_centro_gestor?: string
  valor_asignado_banco?: number
  id: string
}

interface AnalysisByBank {
  banco: string
  totalContratos: number
  valorAsignadoBanco: number // Suma de valores adjudicados de contratos por banco
  valorAdjudicado: number    // Del endpoint contratos_emprestito_all (valor_contrato)
  valorEjecutado: number     // Calculado desde reportes (avance_financiero * valor_contrato)
  valorPagado: number        // Inicialmente 0 (no hay información)
  porcentajeEjecucion: number
  promedioAvance: number
}

interface AnalysisByCentroGestor {
  centroGestor: string
  totalContratos: number
  valorAsignadoBanco: number // Suma de valores adjudicados de contratos por centro gestor
  valorAdjudicado: number    // Del endpoint contratos_emprestito_all (valor_contrato)
  valorEjecutado: number     // Calculado desde reportes (avance_financiero * valor_contrato)
  valorPagado: number        // Inicialmente 0 (no hay información)
  sectores: string[]
  estadosContratos: Record<string, number>
  bancos: Array<{            // Detalle de bancos para este centro gestor
    nombre: string
    valorAsignado: number      // Suma de valores adjudicados de contratos por banco
    valorAdjudicado: number
    valorEjecutado: number
    contratos: number
  }>
}

// Hook para datos de seguimiento
const useSeguimientoData = () => {
  const [seguimiento, setSeguimiento] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [loadingSeguimiento, setLoadingSeguimiento] = useState(false)

  useEffect(() => {
    const fetchSeguimiento = async () => {
      setLoadingSeguimiento(true)
      try {
        // Endpoint para reportes de contratos con timestamp
        const reportesResponse = await fetch('/api/reportes_contratos_all')
        if (reportesResponse.ok) {
          const reportesData = await reportesResponse.json()
          setSeguimiento(reportesData.data || [])
          setLastUpdate(reportesData.lastUpdate || new Date().toISOString())
        }
      } catch (error) {
        console.warn('Error fetching seguimiento data:', error)
      } finally {
        setLoadingSeguimiento(false)
      }
    }

    fetchSeguimiento()
  }, [])

  return { seguimiento, lastUpdate, loadingSeguimiento }
}

// Hook avanzado para obtener y procesar datos reales de la API
const useEmprestitoRealData = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contratos, setContratos] = useState<ContratoEmprestito[]>([])
  const [reportes, setReportes] = useState<ReporteEmprestito[]>([])
  const [bancosEmprestito, setBancosEmprestito] = useState<BancoEmprestito[]>([])
  const [emprestitoBancos, setEmprestitoBancos] = useState<any[]>([]) // Para /emprestito_bancos_all
  const [filteredData, setFilteredData] = useState<ContratoEmprestito[]>([])
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    banco: '',
    centroGestor: '',
    estado: '',
    sector: '',
    fechaInicio: '',
    fechaFin: ''
  })

  // Obtener datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener contratos
        const contratosRes = await fetch('https://gestorproyectoapi-production.up.railway.app/contratos_emprestito_all')
        if (!contratosRes.ok) throw new Error('Error al obtener contratos')
        const contratosData = await contratosRes.json()

        // Obtener reportes del endpoint correcto
        const reportesRes = await fetch('https://gestorproyectoapi-production.up.railway.app/reportes_contratos/')
        let reportesData = { data: [] }
        if (reportesRes.ok) {
          reportesData = await reportesRes.json()
        }

        // Obtener datos de bancos empréstito
        const bancosRes = await fetch('https://gestorproyectoapi-production.up.railway.app/bancos_emprestito_all')
        let bancosData = { data: [] }
        if (bancosRes.ok) {
          bancosData = await bancosRes.json()
        }

        const contratosArray = contratosData.data || []
        const reportesArray = reportesData.data || []
        const bancosArray = bancosData.data || []

        setContratos(contratosArray)
        setReportes(reportesArray)
        setBancosEmprestito(bancosArray)
        setEmprestitoBancos(bancosArray) // Usar los mismos datos de bancosEmprestito que tienen valor_asignado_banco
        setFilteredData(contratosArray)
        
        console.log('✅ Datos cargados:', {
          contratos: contratosArray.length,
          reportes: reportesArray.length,
          bancos: bancosArray.length,
          bancosConValores: bancosArray.filter((b: any) => b.valor_asignado_banco).length
        })
        
        // Debug: Mostrar algunos datos de bancos para verificar estructura
        console.log('📊 Muestra de datos de bancos (bancos_emprestito_all):', bancosArray.slice(0, 3))
        console.log('� Muestra de datos de empréstito bancos (emprestito_bancos_all):', bancosArray.slice(0, 3))
        console.log('�💰 Bancos con valor_asignado_banco:', 
          bancosArray.filter((b: any) => b.valor_asignado_banco).map((b: any) => ({
            nombre: b.nombre_banco,
            valor: b.valor_asignado_banco,
            centro: b.nombre_centro_gestor
          }))
        )
        console.log('💰 Empréstito bancos con valor_asignado_banco:', 
          bancosArray.filter((b: any) => b.valor_asignado_banco).map((b: any) => ({
            nombre: b.nombre_banco || b.banco,
            valorAsignadoBanco: b.valor_asignado_banco,
            campos: Object.keys(b)
          }))
        )
        
        // Debug: Calcular suma total de valor_asignado_banco para la card
        const totalValorAsignadoBanco = bancosArray.reduce((sum: number, banco: any) => sum + (banco.valor_asignado_banco || 0), 0)
        console.log('💵 Total Valor Asignado Banco calculado para card:', totalValorAsignadoBanco.toLocaleString())

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
        console.error('❌ Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...contratos]

    if (filters.banco) {
      filtered = filtered.filter(c => c.banco?.toLowerCase().includes(filters.banco.toLowerCase()))
    }
    if (filters.centroGestor) {
      filtered = filtered.filter(c => c.nombre_centro_gestor?.toLowerCase().includes(filters.centroGestor.toLowerCase()))
    }
    if (filters.estado) {
      filtered = filtered.filter(c => c.estado_contrato?.toLowerCase().includes(filters.estado.toLowerCase()))
    }
    if (filters.sector) {
      filtered = filtered.filter(c => c.sector?.toLowerCase().includes(filters.sector.toLowerCase()))
    }

    setFilteredData(filtered)
  }, [filters, contratos])

  // Función para abrir el modal con los datos del contrato
  const handleOpenModal = (contrato: ContratoEmprestito) => {
    // Buscar todos los reportes para este contrato (para la gráfica de evolución)
    const reportesContrato = reportes
      .filter(r => r.referencia_contrato === contrato.referencia_contrato)
      .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())

    // Tomar el reporte más reciente para los datos principales
    const reporteContrato = reportesContrato[0]

    // Combinar datos del contrato con datos del reporte
    const contratoCompleto = {
      ...contrato,
      ...reporteContrato,
      // Incluir todos los reportes para la gráfica de evolución
      reportes: reportesContrato,
      // Asegurar que el título sea nombre_resumido_proceso
      descripcion_proceso: contrato.nombre_resumido_proceso || contrato.descripcion_proceso,
      // Asegurar que los campos de ejecución estén disponibles desde reportes-contratos
      ejecucion_fisica: reporteContrato?.avance_fisico || null,
      ejecucion_financiera: reporteContrato?.avance_financiero || null,
      avance_fisico: reporteContrato?.avance_fisico || null,
      avance_financiero: reporteContrato?.avance_financiero || null,
      pagos: contrato.valor_pagado || null,
      // Campos adicionales del endpoint reportes-contratos disponibles
      alertas: reporteContrato?.alertas || null,
      observaciones: reporteContrato?.observaciones || null,
      // Asegurar fechas y estados
      fecha_reporte: reporteContrato?.fecha_reporte || null,
      estado_reporte: reporteContrato?.estado_reporte || null
    }

    // Modal logic will be handled by main component
    console.log('Contrato selected:', contratoCompleto.referencia_contrato)
  }

  // Análisis por banco
  const analysisByBank = useMemo((): AnalysisByBank[] => {
    const bankMap = new Map<string, AnalysisByBank>()

    filteredData.forEach(contrato => {
      const banco = contrato.banco || 'Sin definir'
      const valorContrato = Number(contrato.valor_contrato) || 0
      
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      const avanceFinanciero = reporteContrato?.avance_financiero || 0
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100
      
      if (!bankMap.has(banco)) {
        bankMap.set(banco, {
          banco,
          totalContratos: 0,
          valorAsignadoBanco: 0,                  // Será la suma de valorAdjudicado por banco
          valorAdjudicado: 0,                     // Del endpoint contratos_emprestito_all
          valorEjecutado: 0,                      // Calculado desde reportes
          valorPagado: 0,                         // Inicialmente 0
          porcentajeEjecucion: 0,
          promedioAvance: 0
        })
      }

      const analysis = bankMap.get(banco)!
      analysis.totalContratos += 1
      analysis.valorAdjudicado += valorContrato
      analysis.valorAsignadoBanco += valorContrato // Asignado Banco = suma de contratos adjudicados
      analysis.valorEjecutado += valorEjecutado
      // valorPagado se mantiene en 0 como solicitado
      analysis.promedioAvance += avanceFinanciero
    })

    // Calcular porcentajes y promedios
    bankMap.forEach(analysis => {
      analysis.porcentajeEjecucion = analysis.valorAdjudicado > 0 
        ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100 
        : 0
      analysis.promedioAvance = analysis.totalContratos > 0 
        ? analysis.promedioAvance / analysis.totalContratos 
        : 0
    })

    return Array.from(bankMap.values()).sort((a, b) => b.valorAdjudicado - a.valorAdjudicado)
  }, [filteredData, reportes])

  // Análisis por centro gestor
  const analysisByCentroGestor = useMemo((): AnalysisByCentroGestor[] => {
    const centroMap = new Map<string, AnalysisByCentroGestor>()

    filteredData.forEach(contrato => {
      const centro = contrato.nombre_centro_gestor || 'Sin definir'
      const banco = contrato.banco || 'Sin definir'
      const valorContrato = Number(contrato.valor_contrato) || 0
      
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      const avanceFinanciero = reporteContrato?.avance_financiero || 0
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100
      
      if (!centroMap.has(centro)) {
        centroMap.set(centro, {
          centroGestor: centro,
          totalContratos: 0,
          valorAsignadoBanco: 0, // Será la suma de valorAdjudicado por centro gestor
          valorAdjudicado: 0,     // Del endpoint contratos_emprestito_all
          valorEjecutado: 0,      // Calculado desde reportes
          valorPagado: 0,         // Inicialmente 0
          sectores: [],
          estadosContratos: {},
          bancos: []              // Array para almacenar detalle de bancos
        })
      }

      const analysis = centroMap.get(centro)!
      analysis.totalContratos += 1
      analysis.valorAdjudicado += valorContrato
      analysis.valorAsignadoBanco += valorContrato // Asignado Banco = suma de contratos adjudicados
      analysis.valorEjecutado += valorEjecutado
      
      // Agregar sector
      if (contrato.sector && !analysis.sectores.includes(contrato.sector)) {
        analysis.sectores.push(contrato.sector)
      }

      // Contar estados
      const estado = contrato.estado_contrato || 'Sin definir'
      analysis.estadosContratos[estado] = (analysis.estadosContratos[estado] || 0) + 1
    })

    // Después de procesar todos los contratos, agregar información detallada de bancos
    centroMap.forEach(analysis => {
      const bancosMap = new Map<string, {
        nombre: string
        valorAsignado: number
        valorAdjudicado: number
        valorEjecutado: number
        contratos: number
      }>()

      // Obtener todos los bancos únicos para este centro gestor desde los contratos
      filteredData
        .filter(contrato => (contrato.nombre_centro_gestor || 'Sin definir') === analysis.centroGestor)
        .forEach(contrato => {
          const banco = contrato.banco || 'Sin definir'
          const valorContrato = Number(contrato.valor_contrato) || 0
          
          // Buscar el reporte más reciente para este contrato
          const reporteContrato = reportes
            .filter(r => r.referencia_contrato === contrato.referencia_contrato)
            .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
          
          const avanceFinanciero = reporteContrato?.avance_financiero || 0
          const valorEjecutado = (valorContrato * avanceFinanciero) / 100

          if (!bancosMap.has(banco)) {
            bancosMap.set(banco, {
              nombre: banco,
              valorAsignado: 0, // Se calculará como suma de valorAdjudicado
              valorAdjudicado: 0,
              valorEjecutado: 0,
              contratos: 0
            })
          }

          const bancoInfo = bancosMap.get(banco)!
          bancoInfo.valorAdjudicado += valorContrato
          bancoInfo.valorAsignado += valorContrato // Asignado = suma de adjudicados
          bancoInfo.valorEjecutado += valorEjecutado
          bancoInfo.contratos += 1
        })

      // Actualizar el array de bancos 
      analysis.bancos = Array.from(bancosMap.values()).filter(banco => 
        banco.valorAdjudicado > 0
      )
    })

    return Array.from(centroMap.values()).sort((a, b) => b.valorAdjudicado - a.valorAdjudicado)
  }, [filteredData, reportes])

  // Análisis por banco para el gráfico (solo bancos con contratos asignados)
  const analysisByBankForChart = useMemo((): AnalysisByBank[] => {
    const bankMap = new Map<string, AnalysisByBank>()

    // PASO 1: Inicializar TODOS los bancos que tienen valor_asignado_banco válido del endpoint
    emprestitoBancos.forEach((datosBanco: any) => {
      if (datosBanco.valor_asignado_banco && datosBanco.valor_asignado_banco > 0) {
        const nombreBanco = datosBanco.nombre_banco
        bankMap.set(nombreBanco, {
          banco: nombreBanco,
          totalContratos: 0,
          valorAsignadoBanco: datosBanco.valor_asignado_banco, // Del endpoint bancos_emprestito_all
          valorAdjudicado: 0,                                  // Se calculará desde contratos
          valorEjecutado: 0,                                   // Se calculará desde reportes
          valorPagado: 0,                                      // Inicialmente 0
          porcentajeEjecucion: 0,
          promedioAvance: 0
        })
      }
    })

    // Debug: Log de bancos inicializados
    console.log('🏦 Bancos inicializados en analysisByBankForChart:', {
      totalBancosConValor: bankMap.size,
      bancos: Array.from(bankMap.keys())
    })

    // PASO 2: Agregar datos de contratos a los bancos que los tienen
    filteredData.forEach(contrato => {
      const banco = contrato.banco || 'Sin definir'
      const valorContrato = Number(contrato.valor_contrato) || 0
      
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      const avanceFinanciero = reporteContrato?.avance_financiero || 0
      const valorEjecutado = (valorContrato * avanceFinanciero) / 100

      // Solo agregar datos si el banco ya existe en el mapa (tiene valor_asignado_banco)
      if (bankMap.has(banco)) {
        const analysis = bankMap.get(banco)!
        analysis.totalContratos += 1
        analysis.valorAdjudicado += valorContrato
        analysis.valorEjecutado += valorEjecutado
        analysis.promedioAvance += avanceFinanciero
      }
    })

    // Calcular porcentajes y promedios
    bankMap.forEach(analysis => {
      analysis.porcentajeEjecucion = analysis.valorAdjudicado > 0 
        ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100 
        : 0
      analysis.promedioAvance = analysis.totalContratos > 0 
        ? analysis.promedioAvance / analysis.totalContratos 
        : 0
    })

    // Filtrar para mostrar solo bancos que tienen contratos asignados, luego ordenar por valorAsignadoBanco
    return Array.from(bankMap.values())
      .filter(banco => banco.totalContratos > 0) // Solo mostrar bancos con contratos
      .sort((a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco)
  }, [filteredData, reportes, emprestitoBancos])

  // Cálculo correcto del avance físico total basado en los contratos
  const valorTotalFisico = useMemo(() => {
    let totalAvanceFisico = 0
    
    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      if (reporteContrato) {
        const valorContrato = Number(contrato.valor_contrato) || 0
        const avanceFisico = reporteContrato.avance_fisico || 0
        // Calcular el valor físico ejecutado (avance_fisico ya viene como porcentaje 0-100)
        totalAvanceFisico += (valorContrato * avanceFisico) / 100
      }
    })
    
    return totalAvanceFisico
  }, [filteredData, reportes])

  // Cálculo correcto del valor ejecutado total basado en los contratos (igual lógica que físico)
  const valorTotalEjecutado = useMemo(() => {
    let totalEjecutado = 0
    
    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      if (reporteContrato) {
        const valorContrato = Number(contrato.valor_contrato) || 0
        const avanceFinanciero = (reporteContrato as any).avance_financiero || 0
        // Calcular el valor financiero ejecutado (avance_financiero ya viene como porcentaje 0-100)
        totalEjecutado += (valorContrato * avanceFinanciero) / 100
      }
    })
    
    return totalEjecutado
  }, [filteredData, reportes])

  // Cálculo correcto del valor pagado total basado en los contratos (igual lógica que físico)
  const valorTotalPagado = useMemo(() => {
    let totalPagado = 0
    
    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      if (reporteContrato) {
        const valorContrato = Number(contrato.valor_contrato) || 0
        const porcentajePagado = (reporteContrato as any).porcentaje_pagado || 0
        // Calcular el valor pagado (porcentaje_pagado ya viene como porcentaje 0-100)
        // Nota: actualmente este campo no tiene datos en el endpoint
        totalPagado += (valorContrato * porcentajePagado) / 100
      }
    })
    
    return totalPagado
  }, [filteredData, reportes])

  // Cálculo del porcentaje físico promedio ponderado por valor_contrato
  const porcentajeFisicoPromedio = useMemo(() => {
    let totalPonderado = 0
    let totalPeso = 0
    
    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      if (reporteContrato) {
        const avanceFisico = reporteContrato.avance_fisico || 0
        const valorContrato = Number(contrato.valor_contrato) || 0
        
        totalPonderado += avanceFisico * valorContrato
        totalPeso += valorContrato
      }
    })
    
    return totalPeso > 0 ? totalPonderado / totalPeso : 0
  }, [filteredData, reportes])

  // Cálculo del porcentaje financiero promedio ponderado por valor_contrato
  const porcentajeFinancieroPromedio = useMemo(() => {
    let totalPonderado = 0
    let totalPeso = 0
    
    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
      
      if (reporteContrato) {
        const avanceFinanciero = (reporteContrato as any).avance_financiero || 0
        const valorContrato = Number(contrato.valor_contrato) || 0
        
        totalPonderado += avanceFinanciero * valorContrato
        totalPeso += valorContrato
      }
    })
    
    return totalPeso > 0 ? totalPonderado / totalPeso : 0
  }, [filteredData, reportes])

  return {
    loading,
    error,
    contratos: filteredData,
    reportes,
    bancosEmprestito,
    emprestitoBancos,
    filters,
    setFilters,
    analysisByBank,
    analysisByBankForChart,
    analysisByCentroGestor,
    totalContratos: filteredData.length,
    valorTotalAsignado: filteredData.reduce((sum, c) => sum + (Number(c.valor_contrato) || 0), 0),
    valorTotalAsignadoBanco: bancosEmprestito.reduce((sum, banco) => sum + ((banco as any).valor_asignado_banco || 0), 0), // Suma directa de valor_asignado_banco del endpoint
    valorTotalEjecutado, // Ahora usa el cálculo correcto basado en contratos filtrados
    valorTotalPagado, // Ahora usa el cálculo correcto basado en contratos filtrados
    valorTotalFisico,
    porcentajeFisicoPromedio,
    porcentajeFinancieroPromedio
  }
}

// Componente de gráfico de barras convencional para bancos
const BankBarChart: React.FC<{ 
  data: AnalysisByBank[] 
  title: string
  maxItems?: number 
}> = ({ data, title, maxItems = 8 }) => {
  const chartData = data.slice(0, maxItems)
  const maxValue = Math.max(
    ...chartData.flatMap(item => [
      item.valorAsignadoBanco,
      item.valorAdjudicado,
      item.valorEjecutado,
      item.valorPagado
    ])
  )

  const metrics = [
    { key: 'valorAsignadoBanco', label: 'Asignado Banco', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
    { key: 'valorAdjudicado', label: 'Valor Adjudicado', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { key: 'valorEjecutado', label: 'Ejecución Financiera', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    { key: 'valorPagado', label: 'Pagos', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[450px] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-teal-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-6">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${metric.color}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico de barras - Diseño optimizado con mejor uso del espacio */}
      <div className="flex-1 relative overflow-hidden">
        <div className="overflow-x-auto pb-4 h-full">
          <div className="flex items-end justify-center gap-6 lg:gap-8 xl:gap-10 h-full pt-4 pl-20 pr-4 mx-auto" style={{ paddingBottom: '75px' }}>
            {chartData.map((bank, bankIndex) => (
              <div key={bank.banco} className="flex flex-col items-center h-full flex-1" style={{ minWidth: '140px', maxWidth: '200px' }}>
                {/* Barras agrupadas - Crecen desde la base */}
                <div className="flex items-end justify-center gap-1 h-full w-full">
                  {metrics.map((metric, metricIndex) => {
                    const value = bank[metric.key as keyof AnalysisByBank] as number
                    const heightPercent = maxValue > 0 ? Math.max(0, (value / maxValue) * 100) : 0
                    
                    return (
                      <motion.div
                        key={metric.key}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ 
                          delay: 0.2 + bankIndex * 0.1 + metricIndex * 0.05, 
                          duration: 0.8,
                          ease: "easeOut"
                        }}
                        className={`
                          ${metric.color} ${metric.hoverColor} 
                          rounded-t transition-colors duration-200 cursor-pointer
                          flex-1 min-h-1 relative group
                        `}
                        style={{ minWidth: '20px', maxWidth: '35px' }}
                        title={`${metric.label}: ${formatNumber(value, 'currency')}`}
                      >
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Líneas de referencia del eje Y */}
        <div className="absolute left-20 top-4 right-4 pointer-events-none" style={{ bottom: '75px' }}>
          {[0, 20, 40, 60, 80, 100].map(percent => (
            <div
              key={percent}
              className="absolute border-t border-gray-200 dark:border-gray-600 border-dashed"
              style={{ 
                bottom: `${(percent / 100) * 100}%`,
                left: 0,
                right: 0
              }}
            >
              <span className="absolute -left-20 -top-2 text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                {percent === 0 ? '$0' : (() => {
                  const value = (maxValue * percent) / 100;
                  if (value >= 1000000000000) {
                    return `$${(value / 1000000000000).toFixed(1)}B`;
                  } else if (value >= 1000000000) {
                    return `$${(value / 1000000000).toFixed(1)}MM`;
                  } else if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(0)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}K`;
                  } else {
                    return `$${Math.round(value)}`;
                  }
                })()}
              </span>
            </div>
          ))}
        </div>
        
        {/* Etiquetas de los bancos - Centradas y con mejor espaciado */}
        <div className="absolute left-20 right-4 flex justify-center gap-6 lg:gap-8 xl:gap-10 overflow-x-auto" style={{ bottom: '0px', paddingTop: '1px' }}>
          {chartData.map((bank) => (
            <div key={`label-${bank.banco}`} className="text-center flex-1" style={{ minWidth: '140px', maxWidth: '200px' }}>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 px-1">
                {bank.banco}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {formatNumber(bank.totalContratos)} contratos
              </div>
              <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                {formatNumber(bank.porcentajeEjecucion, 'percent')} ejec.
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.length > maxItems && (
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {maxItems} de {data.length} bancos
          </span>
        </div>
      )}


    </motion.div>
  )
}

// Componente de gráfico de barras convencional para centros gestores
const CentroGestorBarChart: React.FC<{ 
  data: AnalysisByCentroGestor[] 
  title: string
  maxItems?: number 
}> = ({ data, title, maxItems = 8 }) => {
  const chartData = data.slice(0, maxItems)
  const maxValue = Math.max(
    ...chartData.flatMap(item => [
      item.valorAsignadoBanco,
      item.valorAdjudicado,
      item.valorEjecutado,
      item.valorPagado
    ])
  )

  const metrics = [
    { key: 'valorAsignadoBanco', label: 'Asignado Banco', color: 'bg-orange-500', hoverColor: 'hover:bg-orange-600' },
    { key: 'valorAdjudicado', label: 'Valor Adjudicado', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { key: 'valorEjecutado', label: 'Ejecución Financiera', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    { key: 'valorPagado', label: 'Pagos', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-6">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${metric.color}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico de barras - Diseño centrado con mejor uso del espacio */}
      <div className="relative overflow-hidden">
        {/* Contenedor principal con distribución uniforme */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-end justify-center gap-4 lg:gap-6 xl:gap-8 h-[400px] pl-20 pr-4 mx-auto w-full" style={{ paddingBottom: '112px' }}>
            {chartData.map((centro, centroIndex) => (
              <div key={centro.centroGestor} className="flex flex-col items-center h-full flex-1" style={{ minWidth: '120px', maxWidth: '180px' }}>
                {/* Barras agrupadas - Crecen desde la base */}
                <div className="flex items-end justify-center gap-1 h-full w-full">
                  {metrics.map((metric, metricIndex) => {
                    const value = centro[metric.key as keyof AnalysisByCentroGestor] as number
                    const heightPercent = maxValue > 0 ? Math.max(0, (value / maxValue) * 100) : 0
                    
                    return (
                      <motion.div
                        key={metric.key}
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ 
                          delay: 0.2 + centroIndex * 0.1 + metricIndex * 0.05, 
                          duration: 0.8,
                          ease: "easeOut"
                        }}
                        className={`
                          ${metric.color} ${metric.hoverColor} 
                          rounded-t transition-colors duration-200 cursor-pointer
                          flex-1 min-h-1 relative group
                        `}
                        style={{ minWidth: '18px', maxWidth: '30px' }}
                        title={metric.key === 'valorAsignadoBanco' && centro.bancos.length > 0 ? 
                          `${metric.label}: ${formatNumber(value, 'currency')}\n\nBancos contribuyentes:\n${centro.bancos
                            .filter(b => b.valorAsignado > 0)
                            .map(b => `• ${b.nombre}: ${formatNumber(b.valorAsignado, 'currency')}`)
                            .join('\n')}` :
                          `${metric.label}: ${formatNumber(value, 'currency')}`
                        }
                      >
                        {/* Tooltip simple */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {formatNumber(value, 'currency')}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Líneas de referencia del eje Y */}
        <div className="absolute left-20 top-0 right-4 pointer-events-none" style={{ bottom: '112px', height: '288px' }}>
          {[0, 20, 40, 60, 80, 100].map(percent => (
            <div
              key={percent}
              className="absolute border-t border-gray-200 dark:border-gray-600 border-dashed"
              style={{ 
                bottom: `${(percent / 100) * 100}%`,
                left: 0,
                right: 0
              }}
            >
              <span className="absolute -left-20 -top-2 text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
                {percent === 0 ? '$0' : (() => {
                  const value = (maxValue * percent) / 100;
                  if (value >= 1000000000000) {
                    return `$${(value / 1000000000000).toFixed(1)}B`;
                  } else if (value >= 1000000000) {
                    return `$${(value / 1000000000).toFixed(1)}MM`;
                  } else if (value >= 1000000) {
                    return `$${(value / 1000000).toFixed(0)}M`;
                  } else if (value >= 1000) {
                    return `$${(value / 1000).toFixed(0)}K`;
                  } else {
                    return `$${Math.round(value)}`;
                  }
                })()}
              </span>
            </div>
          ))}
        </div>
        
        {/* Etiquetas de los centros gestores - Centradas y con mejor distribución */}
        <div className="absolute left-20 right-4 flex justify-center gap-4 lg:gap-6 xl:gap-8 overflow-x-auto" style={{ bottom: '0px', paddingTop: '1px' }}>
          {chartData.map((centro) => (
            <div key={`label-${centro.centroGestor}`} className="text-center flex-1" style={{ minWidth: '120px', maxWidth: '180px' }}>
              <div 
                className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight px-1" 
                style={{ 
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                  overflowWrap: 'break-word'
                }}
              >
                {centro.centroGestor}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatNumber(centro.totalContratos)} contratos
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {centro.sectores.length > 0 ? `${centro.sectores.length} sectores` : 'Sin sectores'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.length > maxItems && (
        <div className="text-center mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {maxItems} de {data.length} centros gestores
          </span>
        </div>
      )}


    </motion.div>
  )
}

// Componente de filtros avanzados
const AdvancedFilters: React.FC<{
  filters: any
  setFilters: (filters: any) => void
  bancos: string[]
  centrosGestores: string[]
  estados: string[]
  sectores: string[]
}> = ({ filters, setFilters, bancos, centrosGestores, estados, sectores }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 mb-6"
    >
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <Filter className="w-5 h-5 text-teal-600" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Filtros de Análisis
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Filtro por Banco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Briefcase className="w-4 h-4 inline mr-1" />
            Banco
          </label>
          <select
            value={filters.banco}
            onChange={(e) => setFilters({ ...filters, banco: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los bancos</option>
            {bancos.map(banco => (
              <option key={banco} value={banco}>{banco}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Centro Gestor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Building2 className="w-4 h-4 inline mr-1" />
            Centro Gestor
          </label>
          <select
            value={filters.centroGestor}
            onChange={(e) => setFilters({ ...filters, centroGestor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los centros</option>
            {centrosGestores.map(centro => (
              <option key={centro} value={centro}>{centro}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Activity className="w-4 h-4 inline mr-1" />
            Estado
          </label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los estados</option>
            {estados.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Sector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Sector
          </label>
          <select
            value={filters.sector}
            onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Todos los sectores</option>
            {sectores.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => setFilters({ banco: '', centroGestor: '', estado: '', sector: '', fechaInicio: '', fechaFin: '' })}
          className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Limpiar filtros
        </button>
      </div>
    </motion.div>
  )
}

// Componente principal del dashboard avanzado
const EmprestitoAdvancedDashboard: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false)

  // Función para manejar el toggle de filtros
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])
  
  // Hook para optimizaciones de iPad
  const { deviceInfo, getResponsiveClasses, getGridClasses, getTableClasses, getTouchTargetClasses } = useIPadClasses()
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  
  // Estados para el modal de contratos
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState<any>(null)
  
  // Estado para la ordenación de tabla
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: 'asc'
  })

  const {
    loading,
    error,
    contratos,
    reportes,
    filters,
    setFilters,
    analysisByBank,
    analysisByBankForChart,
    analysisByCentroGestor,
    totalContratos,
    valorTotalAsignado,
    valorTotalAsignadoBanco,
    valorTotalEjecutado,
    valorTotalPagado,
    valorTotalFisico,
    porcentajeFisicoPromedio,
    porcentajeFinancieroPromedio
  } = useEmprestitoRealData()

  const { seguimiento, lastUpdate, loadingSeguimiento } = useSeguimientoData()

  // Debug - verificar valores calculados
  React.useEffect(() => {
    if (!loading && valorTotalAsignado > 0) {
      console.log('💰 Valores Dashboard:', {
        asignado: valorTotalAsignado.toLocaleString(),
        ejecutado: valorTotalEjecutado.toLocaleString(),
        pagado: valorTotalPagado.toLocaleString(),
        fisico: valorTotalFisico.toLocaleString(),
        porcentEjec: ((valorTotalEjecutado / valorTotalAsignado) * 100).toFixed(1) + '%',
        porcentFisico: ((valorTotalFisico / valorTotalAsignado) * 100).toFixed(1) + '%',
        porcentFisicoPromedio: porcentajeFisicoPromedio.toFixed(1) + '%',
        porcentFinancieroPromedio: porcentajeFinancieroPromedio.toFixed(1) + '%'
      })
    }
  }, [loading, valorTotalAsignado, valorTotalEjecutado, valorTotalPagado, valorTotalFisico, porcentajeFisicoPromedio, porcentajeFinancieroPromedio])

  // Extraer valores únicos para filtros
  const bancos = useMemo(() => {
    const uniqueBancos = Array.from(new Set(contratos.map(c => c.banco).filter(Boolean)))
    return uniqueBancos.sort()
  }, [contratos])
  
  const centrosGestores = useMemo(() => {
    const uniqueCentros = Array.from(new Set(contratos.map(c => c.nombre_centro_gestor).filter(Boolean)))
    return uniqueCentros.sort()
  }, [contratos])

  // Función para manejar la ordenación
  const handleSort = (field: SortField) => {
    setSortState(prevState => ({
      field,
      direction: prevState.field === field && prevState.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Componente para el icono de ordenación
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    
    return sortState.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Función para obtener el valor de ordenación
  const getSortValue = (contrato: ContratoEmprestito, field: SortField) => {
    const reporteContrato = reportes
      .filter(r => r.referencia_contrato === contrato.referencia_contrato)
      .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]

    switch (field) {
      case 'proceso':
        return (contrato.nombre_resumido_proceso || '').toLowerCase()
      case 'banco':
        return (contrato.banco || '').toLowerCase()
      case 'estado':
        return (contrato.estado_contrato || '').toLowerCase()
      case 'valor_contrato':
        return Number(contrato.valor_contrato) || 0
      case 'avance_financiero':
        return reporteContrato?.avance_financiero || 0
      case 'avance_fisico':
        return reporteContrato?.avance_fisico || 0
      case 'observaciones':
        return (reporteContrato?.observaciones || '').toLowerCase()
      default:
        return ''
    }
  }

  // Ordenar los contratos según el estado actual de ordenación
  const sortedContratos = useMemo(() => {
    if (!sortState.field) return contratos

    const sorted = [...contratos].sort((a, b) => {
      const valueA = getSortValue(a, sortState.field!)
      const valueB = getSortValue(b, sortState.field!)

      // Manejar diferentes tipos de datos
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortState.direction === 'asc' ? valueA - valueB : valueB - valueA
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortState.direction === 'asc' 
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA)
      }

      return 0
    })

    return sorted
  }, [contratos, sortState, reportes])

  // Cálculos de paginación
  const totalItems = sortedContratos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = sortedContratos.slice(startIndex, endIndex)

  // Función para cambiar página
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Función para cambiar items por página
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Reset a primera página
  }

  // Función para abrir el modal con los datos del contrato
  const handleOpenModal = (contrato: ContratoEmprestito) => {
    // Buscar TODOS los reportes históricos para este contrato (para la gráfica de evolución)
    const reportesContrato = reportes
      .filter(r => r.referencia_contrato === contrato.referencia_contrato)
      .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())

    // Tomar el reporte más reciente para los datos principales
    const reporteContrato = reportesContrato[0]

    // Combinar datos del contrato con datos del reporte para el modal
    const contratoCompleto = {
      // Datos principales del contrato
      ...contrato,
      // Mapear campos del contrato al formato esperado por el modal
      referencia_del_contrato: contrato.referencia_contrato,
      nombre_entidad: contrato.nombre_centro_gestor,
      proveedor_adjudicado: contrato.nombre_contratista || contrato.representante_legal || 'Sin asignar',
      valor_del_contrato: contrato.valor_contrato,
      descripcion_del_proceso: contrato.descripcion_proceso,
      tipo_de_contrato: contrato.tipo_contrato,
      modalidad_de_contratacion: contrato.modalidad_contratacion,
      fecha_de_firma: contrato.fecha_firma_contrato,
      fecha_de_fin_del_contrato: contrato.fecha_fin_contrato,
      fecha_inicio_ejecucion: contrato.fecha_inicio_contrato,
      nombre_supervisor: contrato.supervisor,
      // Datos del reporte si están disponibles
      ...(reporteContrato && {
        ejecucion_fisica: reporteContrato.avance_fisico,
        ejecucion_financiera: reporteContrato.avance_financiero,
        observaciones_reporte: reporteContrato.observaciones,
        fecha_ultimo_reporte: reporteContrato.fecha_reporte,
        alertas_reporte: reporteContrato.alertas
      }),
      // Incluir TODOS los reportes históricos para la gráfica de evolución
      reportes: reportesContrato,
      // Campos calculados
      pagos: parseInt(contrato.valor_pagado) || 0,
      avance_financiero_calculado: reporteContrato?.avance_financiero || 0,
      avance_fisico_calculado: reporteContrato?.avance_fisico || 0
    }

    setSelectedContrato(contratoCompleto)
    setModalOpen(true)
  }
  
  const estados = useMemo(() => {
    const uniqueEstados = Array.from(new Set(contratos.map(c => c.estado_contrato).filter(Boolean)))
    return uniqueEstados.sort()
  }, [contratos])
  
  const sectores = useMemo(() => {
    const uniqueSectores = Array.from(new Set(contratos.map(c => c.sector).filter(Boolean)))
    return uniqueSectores.sort()
  }, [contratos])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard avanzado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 m-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Error de conexión con API
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Contenido principal */}
      <div 
        className="w-full space-y-3 sm:space-y-4 ipad-10:space-y-4 p-2 sm:p-4 ipad-10:p-4 lg:p-6 transition-all duration-300 ease-in-out" 
        style={{ 
          marginRight: showFilters ? (deviceInfo.isIpad10 ? '320px' : '280px') : '0'
        }}
      >
        {/* Título del Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
        </motion.div>



      {/* Resumen Ejecutivo */}
      <div className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 ipad-10:p-5 lg:p-6 adaptive-width"
        >
          <h3 className="text-lg sm:text-xl ipad-10:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 ipad-10:mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 ipad-10:w-6 ipad-10:h-6 text-blue-600" />
            Resumen Ejecutivo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 ipad-10:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 ipad-10:gap-4 lg:gap-4 w-full">
            <div className="text-center p-2 sm:p-3 ipad-10:p-4 lg:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-w-0">
              <p className="text-xs sm:text-sm ipad-10:text-sm text-blue-600 dark:text-blue-400 truncate">Contratos Totales</p>
              <p className="text-lg sm:text-xl ipad-10:text-2xl lg:text-2xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(totalContratos)}</p>
            </div>
            <div className="text-center p-2 sm:p-3 ipad-10:p-4 lg:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-0">
              <p className="text-xs sm:text-sm ipad-10:text-sm text-green-600 dark:text-green-400 truncate">Valor Total Contratos</p>
              <p className="text-sm sm:text-base ipad-10:text-lg lg:text-lg font-bold text-green-700 dark:text-green-300 truncate">{formatNumber(valorTotalAsignado, 'currency')}</p>
            </div>
            <div className="text-center p-2 sm:p-3 ipad-10:p-4 lg:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg min-w-0">
              <p className="text-xs sm:text-sm ipad-10:text-sm text-orange-600 dark:text-orange-400 truncate">Valor Asignado Bancos</p>
              <p className="text-sm sm:text-base ipad-10:text-lg lg:text-lg font-bold text-orange-700 dark:text-orange-300 truncate">{formatNumber(valorTotalAsignadoBanco, 'currency')}</p>
            </div>
            <div className="text-center p-2 sm:p-3 ipad-10:p-4 lg:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg min-w-0">
              <p className="text-xs sm:text-sm ipad-10:text-sm text-purple-600 dark:text-purple-400 truncate">Bancos Activos</p>
              <p className="text-lg sm:text-xl ipad-10:text-2xl lg:text-2xl font-bold text-purple-700 dark:text-purple-300">{analysisByBank.length}</p>
            </div>
            <div className="text-center p-2 sm:p-3 ipad-10:p-4 lg:p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg min-w-0">
              <p className="text-xs sm:text-sm ipad-10:text-sm text-teal-600 dark:text-teal-400 truncate">Centros Gestores</p>
              <p className="text-lg sm:text-xl ipad-10:text-2xl lg:text-2xl font-bold text-teal-700 dark:text-teal-300">{analysisByCentroGestor.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Análisis Financiero por Banco - Ancho Completo */}
      <div className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full adaptive-width"
        >
          <BankBarChart 
            data={analysisByBankForChart}
            title="Análisis Financiero por Banco"
            maxItems={6}
          />
        </motion.div>
      </div>

      {/* Análisis Financiero por Centro Gestor - Ancho Completo */}
      <div className="w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full adaptive-width"
        >
          <CentroGestorBarChart 
            data={analysisByCentroGestor}
            title="Análisis Financiero por Centro Gestor"
            maxItems={6}
          />
        </motion.div>
      </div>

      {/* Métricas de Ejecución - Tres componentes en fila */}
      <div className="w-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 ipad-10:grid-cols-3 lg:grid-cols-3 gap-4 ipad-10:gap-6 h-[450px] adaptive-width">
          {/* Ejecución Física */}
          <div className="min-w-0 h-full">
            <GaugeChart
              title="Ejecución Física"
              description="Progreso físico de los contratos a la fecha"
              percentage={porcentajeFisicoPromedio}
              value={valorTotalFisico}
              total={valorTotalAsignado}
              color="text-blue-500"
              icon={<Activity className="w-6 h-6 text-blue-600" />}
              showMonetaryValues={false}
            />
          </div>

          {/* Ejecución Financiera */}
          <div className="min-w-0 h-full">
            <GaugeChart
              title="Ejecución Financiera"
              percentage={porcentajeFinancieroPromedio}
              value={valorTotalEjecutado}
              total={valorTotalAsignado}
              color="text-green-500"
              icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            />
          </div>

          {/* Pagos Realizados */}
          <div className="min-w-0 h-full">
            <GaugeChart
              title="Pagos Realizados"
              percentage={porcentajeFinancieroPromedio}
              value={valorTotalPagado}
              total={valorTotalAsignado}
              color="text-purple-500"
              icon={<DollarSign className="w-6 h-6 text-purple-600" />}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Contratos Detallada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contratos Detallados ({formatNumber(contratos.length)})
              </h3>
              {lastUpdate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Última actualización: {new Date(lastUpdate).toLocaleString('es-CO')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadingSeguimiento && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                Actualizando...
              </div>
            )}
            <IPadOptimizedButton 
              variant="primary" 
              className="bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
            >
              <Download className="w-4 h-4" />
              Exportar
            </IPadOptimizedButton>
          </div>
        </div>

        {/* Tabla Responsiva Mejorada - Scrolleable Horizontalmente */}
        <div className="w-full overflow-x-auto overflow-y-visible bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className={`contracts-table-container ${deviceInfo.isIpad10 ? 'ipad-10-scroll' : ''}`}>
            <IPadOptimizedTable className={`contracts-table ${deviceInfo.isIpad10 ? 'ipad-10-table' : ''}`}>
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  style={{ width: '25%' }}
                  onClick={() => handleSort('proceso')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div>Proceso / Centro Gestor</div>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400">Nombre - Entidad - Referencia</div>
                    </div>
                    <SortIcon field="proceso" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  style={{ width: '12%' }}
                  onClick={() => handleSort('banco')}
                >
                  <div className="flex items-center justify-between">
                    <span>Banco</span>
                    <SortIcon field="banco" />
                  </div>
                </th>
                <th 
                  className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  style={{ width: '10%' }}
                  onClick={() => handleSort('estado')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Estado</span>
                    <SortIcon field="estado" />
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  style={{ width: '13%' }}
                  onClick={() => handleSort('valor_contrato')}
                >
                  <div className="flex items-center justify-end gap-2">
                    <span>Valor Contrato</span>
                    <SortIcon field="valor_contrato" />
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm" style={{ width: '18%' }}>
                  <div className="flex items-center justify-center gap-2">
                    <div>
                      <div>Avance Ejecución</div>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        <button 
                          onClick={() => handleSort('avance_financiero')}
                          className="hover:text-blue-600 cursor-pointer inline-flex items-center gap-1 mr-2"
                        >
                          Financiero <SortIcon field="avance_financiero" />
                        </button>
                        /
                        <button 
                          onClick={() => handleSort('avance_fisico')}
                          className="hover:text-blue-600 cursor-pointer inline-flex items-center gap-1 ml-2"
                        >
                          Físico <SortIcon field="avance_fisico" />
                        </button>
                      </div>
                    </div>
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                  style={{ width: '17%' }}
                  onClick={() => handleSort('observaciones')}
                >
                  <div className="flex items-center justify-between">
                    <span>Observaciones / Alertas</span>
                    <SortIcon field="observaciones" />
                  </div>
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm" style={{ width: '5%' }}>
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentItems.map((contrato, index) => {
                // Buscar datos de reporte más reciente para este contrato
                const reporteContrato = reportes
                  .filter(r => r.referencia_contrato === contrato.referencia_contrato)
                  .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]
                
                return (
                  <motion.tr
                    key={contrato.referencia_contrato}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4" style={{ width: '25%' }}>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight" 
                             style={{ 
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden',
                               wordBreak: 'break-word',
                               hyphens: 'auto'
                             }}
                             title={contrato.nombre_resumido_proceso || 'Sin proceso'}>
                          {contrato.nombre_resumido_proceso || 'Sin proceso'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight"
                             style={{ 
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden',
                               wordBreak: 'break-word',
                               hyphens: 'auto'
                             }}
                             title={contrato.nombre_centro_gestor || 'Sin centro gestor'}>
                          {contrato.nombre_centro_gestor || 'Sin centro gestor'}
                        </div>
                      </div>
                    </td>
                      <td className="py-3 px-2 text-center w-[100px]">
                        <span className={`px-2 py-1 text-xs rounded-full inline-block max-w-full truncate ${
                          contrato.estado_contrato === 'En ejecución' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : contrato.estado_contrato === 'Aprobado'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`} title={contrato.estado_contrato}>
                          {contrato.estado_contrato?.substring(0, 12) || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-right font-medium text-gray-700 dark:text-gray-300 w-[130px]">
                        <div className="truncate text-xs" title={formatNumber(Number(contrato.valor_contrato || contrato.valor_del_contrato || 0), 'currency')}>
                          {formatNumber(Number(contrato.valor_contrato || contrato.valor_del_contrato || 0), 'currency')}
                        </div>
                      </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300" style={{ width: '12%' }}>
                      <div className="truncate" title={contrato.banco || 'No especificado'}>
                        {contrato.banco || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center" style={{ width: '10%' }}>
                      <span className={`px-2 py-1 text-xs rounded-full inline-block truncate ${
                        contrato.estado_contrato === 'En ejecución' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : contrato.estado_contrato === 'Aprobado'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`} title={contrato.estado_contrato}>
                        {contrato.estado_contrato || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-700 dark:text-gray-300" style={{ width: '13%' }}>
                      <div className="truncate" title={formatNumber(contrato.valor_contrato, 'currency')}>
                        {formatNumber(contrato.valor_contrato, 'currency')}
                      </div>
                    </td>
                    <td className="py-3 px-4" style={{ width: '18%' }}>
                      <div className="space-y-2">
                        {/* Progress bar para Avance Financiero */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Financiero</span>
                            <span className="font-medium">
                              {reporteContrato?.avance_financiero?.toFixed(1) || '0'}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(reporteContrato?.avance_financiero || 0, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        {/* Progress bar para Avance Físico */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Físico</span>
                            <span className="font-medium">
                              {reporteContrato?.avance_fisico?.toFixed(1) || '0'}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(reporteContrato?.avance_fisico || 0, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                        {reporteContrato?.fecha_reporte && (
                          <div className="text-xs text-gray-400 text-center">
                            {new Date(reporteContrato.fecha_reporte).toLocaleDateString('es-CO', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400" style={{ width: '17%' }}>
                      <div className="text-xs break-words" style={{maxHeight: '4rem', overflow: 'hidden'}}>
                        {(() => {
                          const observaciones = []
                          
                          // Revisar si hay retrasos basados en fechas del contrato
                          const fechaFin = contrato.fecha_fin_contrato ? new Date(contrato.fecha_fin_contrato) : null
                          if (fechaFin && fechaFin < new Date() && !['Liquidado', 'Terminado', 'Finalizado'].includes(contrato.estado_contrato)) {
                            observaciones.push('⚠️ Vencido')
                          }
                          
                          // Revisar avance financiero vs físico si hay reportes
                          if (reporteContrato) {
                            const avanceFinanciero = reporteContrato.avance_financiero || 0
                            const avanceFisico = reporteContrato.avance_fisico || 0
                            
                            if (avanceFinanciero > avanceFisico + 15) {
                              observaciones.push('📈 Fin. elevado')
                            } else if (avanceFisico > avanceFinanciero + 15) {
                              observaciones.push('📉 Fin. rezagado')
                            }
                          }
                          
                          // Revisar si está próximo a vencer
                          if (fechaFin) {
                            const diasRestantes = Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            if (diasRestantes <= 30 && diasRestantes > 0) {
                              observaciones.push('🔔 Próx. vencer')
                            }
                          }
                          
                          // Mostrar observaciones del reporte si las hay
                          if (reporteContrato?.observaciones) {
                            observaciones.push(`💬 ${reporteContrato.observaciones.substring(0, 30)}...`)
                          }
                          
                          return observaciones.length > 0 ? observaciones.join(' • ') : 'Sin observaciones'
                        })()}
                      </div>
                      {reporteContrato?.alertas?.es_alerta && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            ⚠ Alerta
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center" style={{ width: '5%' }}>
                      <IPadOptimizedButton
                        onClick={() => handleOpenModal(contrato)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
                      >
                        <Eye className="h-4 w-4" />
                      </IPadOptimizedButton>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </IPadOptimizedTable>
        </div>
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Información de paginación */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {formatNumber(totalItems)} contratos
              </div>
              
              {/* Selector de items por página */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {/* Números de página */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const showPages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  if (endPage - startPage + 1 < showPages) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }

                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-2 text-gray-500 dark:text-gray-400">...</span>
                      );
                    }
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          i === currentPage
                            ? 'text-white bg-teal-600 border border-teal-600'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-2 text-gray-500 dark:text-gray-400">...</span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </motion.div>
      </div>

      {/* Botón flotante fijo para filtros - Sidebar toggle */}
      <button
        onClick={handleToggleFilters}
        className={`
          filter-button-floating
          fixed top-20 z-[51]
          ${showFilters 
            ? (deviceInfo.isIpad10 ? 'right-[21rem]' : 'right-80') 
            : 'right-4 sm:right-6'
          }
          text-white font-medium
          shadow-2xl rounded-full
          transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-teal-300
          cursor-pointer select-none
          ${deviceInfo.isIpad10 
            ? 'px-6 py-4 text-lg min-h-[56px] min-w-[56px]' 
            : 'px-4 py-3 text-base min-h-[48px] min-w-[48px]'
          }
          ${showFilters 
            ? 'bg-orange-600 hover:bg-orange-700 focus:bg-orange-800' 
            : 'bg-teal-600 hover:bg-teal-700 focus:bg-teal-800'
          }
        `}
        type="button"
        aria-label={showFilters ? 'Cerrar filtros' : 'Abrir filtros'}
        title={showFilters ? 'Cerrar panel de filtros' : 'Abrir panel de filtros'}
      >
        <div className="flex items-center justify-center gap-2">
          <Filter className={`${deviceInfo.isIpad10 ? 'w-6 h-6' : 'w-5 h-5'} ${showFilters ? 'rotate-180' : ''} transition-transform duration-300`} />
          <span className={`hidden lg:inline font-medium ${deviceInfo.isIpad10 ? 'text-base' : 'text-sm'}`}>
            {showFilters ? 'Cerrar' : 'Filtros'}
          </span>
        </div>
      </button>

      {/* Panel lateral de filtros - Sidebar no modal */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ 
          x: showFilters ? 0 : 300,
          opacity: showFilters ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          filters-sidebar ${showFilters ? 'open' : ''}
          fixed right-0 top-0 h-full 
          bg-white/95 dark:bg-gray-800/95
          backdrop-blur-sm
          border-l border-gray-200 dark:border-gray-700 
          z-50
          ${deviceInfo.isIpad10 
            ? 'w-80 ipad-10-landscape:w-96' 
            : 'w-72 sm:w-80'
          } 
          ${showFilters ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
      >
        <div className="h-full overflow-y-auto filter-controls">
          <div className={`p-4 sm:p-6 ${deviceInfo.isIpad10 ? 'ipad-10:p-8' : ''}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`font-semibold text-gray-900 dark:text-white flex items-center gap-2 ${
                  deviceInfo.isIpad10 ? 'text-xl' : 'text-lg'
                }`}>
                  <Filter className={`text-teal-600 ${deviceInfo.isIpad10 ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  Filtros de Análisis
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`
                    text-gray-500 hover:text-white hover:bg-red-500
                    border-2 border-gray-300 hover:border-red-500
                    rounded-full transition-all duration-200
                    cursor-pointer select-none flex items-center justify-center
                    ${deviceInfo.isIpad10 
                      ? 'w-10 h-10 text-lg' 
                      : 'w-8 h-8 text-base'
                    }
                  `}
                  type="button"
                  aria-label="Cerrar panel de filtros"
                  title="Cerrar filtros"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Filtro por Banco */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Banco
                  </label>
                  <select
                    value={filters.banco}
                    onChange={(e) => setFilters({ ...filters, banco: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los bancos</option>
                    {bancos.map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Centro Gestor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Centro Gestor
                  </label>
                  <select
                    value={filters.centroGestor}
                    onChange={(e) => setFilters({ ...filters, centroGestor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los centros</option>
                    {centrosGestores.map(centro => (
                      <option key={centro} value={centro}>{centro}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Activity className="w-4 h-4 inline mr-2" />
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los estados</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Sector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Sector
                  </label>
                  <select
                    value={filters.sector}
                    onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los sectores</option>
                    {sectores.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                {/* Botón limpiar filtros */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setFilters({ banco: '', centroGestor: '', estado: '', sector: '', fechaInicio: '', fechaFin: '' })}
                    className="w-full px-4 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 font-medium rounded-lg transition-colors"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      {/* Modal de detalles del contrato */}
      <ContratosModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedContrato(null)
        }}
        contratoData={selectedContrato}
        referenciaContrato={selectedContrato?.referencia_contrato}
      />
    </div>
  )
}

export default EmprestitoAdvancedDashboard