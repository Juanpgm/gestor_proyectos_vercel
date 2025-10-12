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
  MapPin
} from 'lucide-react'
import { CATEGORIES, formatNumber, CHART_COLORS } from '@/lib/design-system'

// Componente GaugeChart
const GaugeChart: React.FC<{
  title: string
  percentage: number
  value: number
  total: number
  color: string
  icon: React.ReactNode
}> = ({ title, percentage, value, total, color, icon }) => {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center"
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          {title}
        </h4>
      </div>
      
      <div className="relative w-32 h-32 mb-4">
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
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {percentage.toFixed(1)}%
          </motion.span>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {formatNumber(value, 'currency')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          de {formatNumber(total, 'currency')}
        </p>
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
}> = ({ analysisByBank, analysisByCentroGestor, totalContratos, valorTotalAsignado }) => {
  const topBanco = analysisByBank[0]
  const topCentroGestor = analysisByCentroGestor[0]
  
  return (
    <div className="space-y-6 mb-6">
      {/* Resumen Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Resumen Ejecutivo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
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
                    {formatNumber(bank.valorAsignado, 'currency')}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${(bank.valorAsignado / Math.max(...analysisByBank.map(b => b.valorAsignado))) * 100}%` }}
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
                    {formatNumber(centro.valorAsignado, 'currency')}
                  </p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-cyan-600 h-2 rounded-full" 
                      style={{ width: `${(centro.valorAsignado / Math.max(...analysisByCentroGestor.map(c => c.valorAsignado))) * 100}%` }}
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
  referencia_contrato: string
  nombre_centro_gestor: string
  banco: string
  estado_contrato: string
  valor_contrato: number
  valor_pagado: string
  fecha_inicio_contrato?: string
  fecha_fin_contrato?: string
  sector: string
  tipo_contrato: string
  objeto_contrato: string
  proceso_contractual: string
  bpin?: number
}

interface ReporteEmprestito {
  referencia_contrato: string
  avance_fisico: number
  avance_financiero: number
  fecha_reporte: string
  observaciones: string
  alertas_es_alerta: boolean
}

interface AnalysisByBank {
  banco: string
  totalContratos: number
  valorAsignado: number
  valorEjecutado: number
  valorPagado: number
  porcentajeEjecucion: number
  promedioAvance: number
}

interface AnalysisByCentroGestor {
  centroGestor: string
  totalContratos: number
  valorAsignado: number
  valorEjecutado: number
  sectores: string[]
  estadosContratos: Record<string, number>
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

        // Obtener reportes
        const reportesRes = await fetch('https://gestorproyectoapi-production.up.railway.app/reportes_contratos/')
        let reportesData = { data: [] }
        if (reportesRes.ok) {
          reportesData = await reportesRes.json()
        }

        const contratosArray = contratosData.data || []
        const reportesArray = reportesData.data || []

        setContratos(contratosArray)
        setReportes(reportesArray)
        setFilteredData(contratosArray)
        
        console.log('✅ Datos cargados:', {
          contratos: contratosArray.length,
          reportes: reportesArray.length
        })

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

  // Análisis por banco
  const analysisByBank = useMemo((): AnalysisByBank[] => {
    const bankMap = new Map<string, AnalysisByBank>()

    filteredData.forEach(contrato => {
      const banco = contrato.banco || 'Sin definir'
      const valorContrato = Number(contrato.valor_contrato) || 0
      const valorPagado = Number(contrato.valor_pagado) || 0

      if (!bankMap.has(banco)) {
        bankMap.set(banco, {
          banco,
          totalContratos: 0,
          valorAsignado: 0,
          valorEjecutado: 0,
          valorPagado: 0,
          porcentajeEjecucion: 0,
          promedioAvance: 0
        })
      }

      const analysis = bankMap.get(banco)!
      analysis.totalContratos += 1
      analysis.valorAsignado += valorContrato
      analysis.valorPagado += valorPagado
      analysis.valorEjecutado += valorPagado // Asumir que pagado = ejecutado
    })

    // Calcular porcentajes
    bankMap.forEach(analysis => {
      analysis.porcentajeEjecucion = analysis.valorAsignado > 0 
        ? (analysis.valorEjecutado / analysis.valorAsignado) * 100 
        : 0
    })

    return Array.from(bankMap.values()).sort((a, b) => b.valorAsignado - a.valorAsignado)
  }, [filteredData])

  // Análisis por centro gestor
  const analysisByCentroGestor = useMemo((): AnalysisByCentroGestor[] => {
    const centroMap = new Map<string, AnalysisByCentroGestor>()

    filteredData.forEach(contrato => {
      const centro = contrato.nombre_centro_gestor || 'Sin definir'
      const valorContrato = Number(contrato.valor_contrato) || 0

      if (!centroMap.has(centro)) {
        centroMap.set(centro, {
          centroGestor: centro,
          totalContratos: 0,
          valorAsignado: 0,
          valorEjecutado: 0,
          sectores: [],
          estadosContratos: {}
        })
      }

      const analysis = centroMap.get(centro)!
      analysis.totalContratos += 1
      analysis.valorAsignado += valorContrato
      
      // Agregar sector
      if (contrato.sector && !analysis.sectores.includes(contrato.sector)) {
        analysis.sectores.push(contrato.sector)
      }

      // Contar estados
      const estado = contrato.estado_contrato || 'Sin definir'
      analysis.estadosContratos[estado] = (analysis.estadosContratos[estado] || 0) + 1
    })

    return Array.from(centroMap.values()).sort((a, b) => b.valorAsignado - a.valorAsignado)
  }, [filteredData])

  return {
    loading,
    error,
    contratos: filteredData,
    reportes,
    filters,
    setFilters,
    analysisByBank,
    analysisByCentroGestor,
    totalContratos: filteredData.length,
    valorTotalAsignado: filteredData.reduce((sum, c) => sum + (Number(c.valor_contrato) || 0), 0),
    valorTotalEjecutado: analysisByBank.reduce((sum, bank) => sum + bank.valorEjecutado, 0),
    valorTotalPagado: analysisByBank.reduce((sum, bank) => sum + bank.valorPagado, 0)
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
      item.valorAsignado,
      item.valorEjecutado,
      item.valorPagado
    ])
  )

  const metrics = [
    { key: 'valorAsignado', label: 'Asignado', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { key: 'valorEjecutado', label: 'Ejecutado', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
    { key: 'valorPagado', label: 'Pagado', color: 'bg-purple-500', hoverColor: 'hover:bg-purple-600' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
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

      {/* Gráfico de barras - Diseño optimizado */}
      <div className="relative overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <div className="flex items-end gap-4 sm:gap-6 h-80 pb-20 pl-16 pr-4 min-w-fit" style={{ minWidth: `${chartData.length * 140}px` }}>
            {chartData.map((bank, bankIndex) => (
              <div key={bank.banco} className="flex flex-col items-center h-full" style={{ minWidth: '130px', maxWidth: '140px' }}>
                {/* Barras agrupadas */}
                <div className="flex items-end justify-center gap-1 h-full w-full mb-3">
                  {metrics.map((metric, metricIndex) => {
                    const value = bank[metric.key as keyof AnalysisByBank] as number
                    const heightPercent = (value / maxValue) * 100
                    
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
                        style={{ minWidth: '18px', maxWidth: '28px' }}
                        title={`${metric.label}: ${formatNumber(value, 'currency')}`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {formatNumber(value, 'currency')}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Etiquetas del banco */}
                <div className="text-center w-full px-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" title={bank.banco}>
                    {bank.banco}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatNumber(bank.totalContratos)} contratos
                  </div>
                  <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    {formatNumber(bank.porcentajeEjecucion, 'percent')} ejec.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Líneas de referencia del eje Y */}
        <div className="absolute left-16 top-0 right-4 h-80 pointer-events-none">
          {[0, 25, 50, 75, 100].map(percent => (
            <div
              key={percent}
              className="absolute border-t border-gray-200 dark:border-gray-600 border-dashed"
              style={{ 
                bottom: `${20 + (percent / 100) * (320 - 80)}px`,
                left: 0,
                right: 0
              }}
            >
              <span className="absolute -left-14 -top-2 text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                {percent === 0 ? '0' : `${Math.round((maxValue * percent) / 100 / 1000000)}M`}
              </span>
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
      item.valorAsignado,
      item.valorEjecutado
    ])
  )

  const metrics = [
    { key: 'valorAsignado', label: 'Asignado', color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
    { key: 'valorEjecutado', label: 'Ejecutado', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' }
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

      {/* Gráfico de barras - Diseño mejorado para evitar desbordamiento */}
      <div className="relative overflow-hidden">
        {/* Contenedor principal con scroll horizontal si es necesario */}
        <div className="overflow-x-auto pb-4">
          <div className="flex items-end gap-3 sm:gap-4 h-80 pb-24 pl-16 pr-4 min-w-fit" style={{ minWidth: `${chartData.length * 120}px` }}>
            {chartData.map((centro, centroIndex) => (
              <div key={centro.centroGestor} className="flex flex-col items-center h-full" style={{ minWidth: '110px', maxWidth: '120px' }}>
                {/* Barras agrupadas */}
                <div className="flex items-end justify-center gap-1 h-full w-full mb-3">
                  {metrics.map((metric, metricIndex) => {
                    const value = centro[metric.key as keyof AnalysisByCentroGestor] as number
                    const heightPercent = (value / maxValue) * 100
                    
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
                        style={{ minWidth: '16px', maxWidth: '24px' }}
                        title={`${metric.label}: ${formatNumber(value, 'currency')}`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {formatNumber(value, 'currency')}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Etiquetas del centro gestor - Optimizadas */}
                <div className="text-center w-full px-1">
                  {/* Nombre del centro gestor con altura fija y wrap */}
                  <div 
                    className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight mb-2 h-12 flex items-center justify-center" 
                    title={centro.centroGestor}
                    style={{ 
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {centro.centroGestor}
                  </div>
                  
                  {/* Información adicional */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {formatNumber(centro.totalContratos)} contratos
                  </div>
                  
                  {/* Estados como mini indicadores */}
                  <div className="flex gap-1 justify-center flex-wrap">
                    {Object.entries(centro.estadosContratos).map(([estado, cantidad]) => {
                      const colorClass = estado === 'En ejecución' 
                        ? 'bg-green-400' 
                        : estado === 'Aprobado' 
                        ? 'bg-yellow-400' 
                        : estado === 'Borrador'
                        ? 'bg-red-400'
                        : 'bg-gray-400'
                      
                      return (
                        <motion.div
                          key={estado}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + centroIndex * 0.1 }}
                          className={`w-2 h-2 rounded-full ${colorClass}`}
                          title={`${estado}: ${cantidad} contratos`}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Líneas de referencia del eje Y */}
        <div className="absolute left-16 top-0 right-4 h-80 pointer-events-none">
          {[0, 25, 50, 75, 100].map(percent => (
            <div
              key={percent}
              className="absolute border-t border-gray-200 dark:border-gray-600 border-dashed"
              style={{ 
                bottom: `${24 + (percent / 100) * (320 - 96)}px`,
                left: 0,
                right: 0
              }}
            >
              <span className="absolute -left-14 -top-2 text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                {percent === 0 ? '0' : `${Math.round((maxValue * percent) / 100 / 1000000)}M`}
              </span>
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
  const {
    loading,
    error,
    contratos,
    reportes,
    filters,
    setFilters,
    analysisByBank,
    analysisByCentroGestor,
    totalContratos,
    valorTotalAsignado,
    valorTotalEjecutado,
    valorTotalPagado
  } = useEmprestitoRealData()

  const { seguimiento, lastUpdate, loadingSeguimiento } = useSeguimientoData()

  // Extraer valores únicos para filtros
  const bancos = useMemo(() => {
    const uniqueBancos = Array.from(new Set(contratos.map(c => c.banco).filter(Boolean)))
    return uniqueBancos.sort()
  }, [contratos])
  
  const centrosGestores = useMemo(() => {
    const uniqueCentros = Array.from(new Set(contratos.map(c => c.nombre_centro_gestor).filter(Boolean)))
    return uniqueCentros.sort()
  }, [contratos])
  
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-full overflow-hidden">
      {/* Título del Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard - Empréstito
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
          Análisis detallado por Banco y Centro Gestor con datos en tiempo real
        </p>
      </motion.div>

      {/* Filtros Avanzados */}
      <AdvancedFilters
        filters={filters}
        setFilters={setFilters}
        bancos={bancos}
        centrosGestores={centrosGestores}
        estados={estados}
        sectores={sectores}
      />

      {/* Leyenda de Métricas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Leyenda de Métricas Financieras
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Asignado:</strong> Valor total del contrato
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-green-600"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Ejecutado:</strong> Valor comprometido/ejecutado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-400 to-purple-600"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Pagado:</strong> Valor efectivamente pagado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-teal-400 to-teal-600"></div>
            <span className="text-gray-700 dark:text-gray-300">
              <strong>% Ejecución:</strong> Pagado/Asignado
            </span>
          </div>
        </div>
      </motion.div>

      {/* Resumen Ejecutivo y Distribuciones */}
      <ResumenEjecutivo 
        analysisByBank={analysisByBank}
        analysisByCentroGestor={analysisByCentroGestor}
        totalContratos={totalContratos}
        valorTotalAsignado={valorTotalAsignado}
      />

      {/* Indicadores de Ejecución - Gauge Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Indicadores de Ejecución Financiera
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GaugeChart
            title="Ejecución Financiera"
            percentage={valorTotalAsignado > 0 ? (valorTotalEjecutado / valorTotalAsignado) * 100 : 0}
            value={valorTotalEjecutado}
            total={valorTotalAsignado}
            color="text-green-500"
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          />
          <GaugeChart
            title="Pagos Realizados"
            percentage={valorTotalAsignado > 0 ? (valorTotalPagado / valorTotalAsignado) * 100 : 0}
            value={valorTotalPagado}
            total={valorTotalAsignado}
            color="text-purple-500"
            icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          />
        </div>
      </motion.div>

      {/* Gráficos de Barras - Análisis Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
        {/* Análisis por Banco */}
        <div className="min-w-0">
          <BankBarChart 
            data={analysisByBank}
            title="Análisis Financiero por Banco"
            maxItems={6}
          />
        </div>

        {/* Análisis por Centro Gestor */}
        <div className="min-w-0">
          <CentroGestorBarChart 
            data={analysisByCentroGestor}
            title="Análisis Financiero por Centro Gestor"
            maxItems={6}
          />
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
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Tabla Responsiva Mejorada */}
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="min-w-full inline-block align-middle">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[180px]">
                    Referencia / Centro Gestor
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[120px]">
                    Banco
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[120px]">
                    Estado
                  </th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[140px]">
                    Valor
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[120px]">
                    Avance
                  </th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 text-sm min-w-[200px]">
                    Observaciones / Alertas
                  </th>
                </tr>
              </thead>
              <tbody>
                {contratos.slice(0, 15).map((contrato, index) => {
                  // Buscar datos de seguimiento para este contrato
                  const seguimientoContrato = seguimiento.find(s => s.referencia_contrato === contrato.referencia_contrato)
                  
                  return (
                    <motion.tr
                      key={contrato.referencia_contrato}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-3 text-sm">
                        <div className="space-y-1">
                          <div className="font-mono font-medium text-blue-600 dark:text-blue-400" title={contrato.referencia_contrato}>
                            {contrato.referencia_contrato}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 break-words leading-tight" title={contrato.nombre_centro_gestor}>
                            {contrato.nombre_centro_gestor}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">
                        <div className="max-w-[120px] break-words" title={contrato.banco || 'No especificado'}>
                          {contrato.banco || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${
                          contrato.estado_contrato === 'En ejecución' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : contrato.estado_contrato === 'Aprobado'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {contrato.estado_contrato}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-right font-medium text-gray-700 dark:text-gray-300">
                        <div className="whitespace-nowrap" title={formatNumber(contrato.valor_contrato, 'currency')}>
                          {formatNumber(contrato.valor_contrato, 'currency')}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="block">Presupuestal: {seguimientoContrato?.ejecucion_presupuestal || 'N/D'}%</span>
                            <span className="block">Física: {seguimientoContrato?.ejecucion_fisica || 'N/D'}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="max-w-[200px] break-words text-xs" title={seguimientoContrato?.ultima_observacion || 'Sin observaciones'}>
                          {seguimientoContrato?.ultima_observacion || 'Sin observaciones registradas'}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {contratos.length > 15 && (
          <div className="text-center mt-4">
            <button className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium">
              Ver todos los contratos ({formatNumber(contratos.length)})
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default EmprestitoAdvancedDashboard