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
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  ComposedChart,
  LabelList
} from 'recharts'
import { CATEGORIES, formatNumber, CHART_COLORS } from '@/lib/design-system'
import ContratosModal from './ContratosModal'
import { fetchWithErrorHandling } from '@/utils/errorHandler'

// Tipos para los reportes de contratos (usar la estructura existente)
interface ReporteContratoTS extends ReporteEmprestito {
  // Extendemos ReporteEmprestito con campos adicionales que necesitamos
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

      // Acumular avances PONDERADOS para calcular promedios
      data.total_avance_fisico += (reporte.avance_fisico || 0) * valorContrato
      data.total_avance_financiero += (reporte.avance_financiero || 0) * valorContrato
    })

    // Calcular promedios PONDERADOS y convertir a array
    const result = Array.from(dateMap.values()).map(data => ({
      ...data,
      avance_fisico_promedio: data.valor_contrato > 0 ? data.total_avance_fisico / data.valor_contrato : 0,
      avance_financiero_promedio: data.valor_contrato > 0 ? data.total_avance_financiero / data.valor_contrato : 0
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

      // Acumular avances PONDERADOS para calcular promedios
      data.total_avance_fisico += (reporte.avance_fisico || 0) * valorContrato
      data.total_avance_financiero += (reporte.avance_financiero || 0) * valorContrato
    })

    // Calcular promedios PONDERADOS y devolver ordenado
    const filteredResult = Array.from(dateMap.values()).map(data => ({
      ...data,
      avance_fisico_promedio: data.valor_contrato > 0 ? data.total_avance_fisico / data.valor_contrato : 0,
      avance_financiero_promedio: data.valor_contrato > 0 ? data.total_avance_financiero / data.valor_contrato : 0
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
      </div>

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
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
      </div>
    </motion.div>
  )
}

// Helper para obtener el número de semana ISO
const getISOWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// Componente para mostrar variación entre semanas
const WeeklyVariationPanel: React.FC<{
  reportes: ReporteEmprestito[]
  contratos: ContratoEmprestito[]
}> = ({ reportes, contratos }) => {
  const variationData = useMemo(() => {
    if (!reportes || reportes.length === 0 || !contratos || contratos.length === 0) return []

    const contratoMap = new Map(
      contratos.map(c => [c.referencia_contrato, Number(c.valor_contrato) || 0])
    )

    const weeksSet = new Set<string>()
    reportes.forEach(reporte => {
      if (!reporte.fecha_reporte) return
      const fecha = new Date(reporte.fecha_reporte)
      if (isNaN(fecha.getTime())) return

      const week = getISOWeek(fecha)
      const year = fecha.getFullYear()
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`
      weeksSet.add(weekKey)
    })

    const sortedWeeks = Array.from(weeksSet).sort((a, b) => {
      const [yearA, weekA] = a.split('-W').map(Number)
      const [yearB, weekB] = b.split('-W').map(Number)
      if (yearA !== yearB) return yearA - yearB
      return weekA - weekB
    })

    const timeSeriesData = sortedWeeks.map(weekKey => {
      const [year, week] = weekKey.split('-W').map(Number)

      const lastReportByContract: { [contrato: string]: ReporteEmprestito } = {}

      reportes.forEach(reporte => {
        if (!reporte.fecha_reporte) return
        const fecha = new Date(reporte.fecha_reporte)
        if (isNaN(fecha.getTime())) return

        const reportWeek = getISOWeek(fecha)
        const reportYear = fecha.getFullYear()

        if (reportYear === year && reportWeek === week) {
          const contratoKey = reporte.referencia_contrato

          if (!lastReportByContract[contratoKey]) {
            lastReportByContract[contratoKey] = reporte
          } else {
            const existingDate = new Date(lastReportByContract[contratoKey].fecha_reporte)
            if (fecha > existingDate) {
              lastReportByContract[contratoKey] = reporte
            }
          }
        }
      })

      let totalFisicoPonderado = 0
      let totalValorContratos = 0

      Object.entries(lastReportByContract).forEach(([contratoKey, reporte]) => {
        const avanceFisico = reporte.avance_fisico || 0
        const valorContrato = contratoMap.get(contratoKey) || 0

        if (valorContrato > 0) {
          totalFisicoPonderado += (avanceFisico * valorContrato)
          totalValorContratos += valorContrato
        }
      })

      const avanceFisicoPromedio = totalValorContratos > 0 ? totalFisicoPonderado / totalValorContratos : 0

      return {
        periodo: weekKey,
        'Avance Físico': avanceFisicoPromedio,
      }
    })

    // Calcular variaciones
    return timeSeriesData.slice(1).map((item, index) => {
      const anterior = timeSeriesData[index]['Avance Físico']
      const actual = item['Avance Físico']
      const variacion = actual - anterior

      // Calcular rendimiento: [(Valor final - Valor inicial) / Valor inicial] x 100%
      const rendimiento = anterior !== 0 ? ((actual - anterior) / anterior) * 100 : 0

      return {
        periodo: item.periodo,
        variacion,
        rendimiento,
        valorInicial: anterior,
        valorFinal: actual,
        isPositivo: variacion >= 0
      }
    }).reverse() // Invertir para mostrar la más reciente primero
  }, [reportes, contratos])

  return (
    <div className="lg:col-span-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 flex flex-col h-full"
      >
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Variación Semanal
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Puntos porcentuales
        </p>

        <div className="flex-1 overflow-y-auto space-y-2">
          {variationData.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              Sin datos de variación
            </div>
          ) : (
            variationData.map(item => (
              <div key={item.periodo} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {item.periodo}
                </div>
                <div className={`font-bold text-sm mt-1 ${item.isPositivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {item.isPositivo ? '↑' : '↓'} {Math.abs(item.variacion).toFixed(1)}pp
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                  {item.valorInicial.toFixed(1)}% → {item.valorFinal.toFixed(1)}%
                </div>
                <div className={`text-xs mt-1 font-medium ${item.isPositivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Rend: {item.isPositivo ? '+' : ''}{item.rendimiento.toFixed(1)}%
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Componente para gráfica de evolución temporal
const WeeklyProgressChart: React.FC<{
  data: ReporteEmprestito[],
  contratos: ContratoEmprestito[],
  maxAvance: number
}> = ({ data, contratos, maxAvance }) => {
  // Para cada semana, calcular el promedio ponderado por valor de contrato
  const timeSeriesData = useMemo(() => {
    console.log('📊 WeeklyProgressChart - Datos recibidos:', {
      reportes: data?.length || 0,
      contratos: contratos?.length || 0,
      muestraReportes: data?.slice(0, 2)
    })

    if (!data || data.length === 0 || !contratos || contratos.length === 0) {
      console.log('⚠️ WeeklyProgressChart - Sin datos suficientes para mostrar')
      return []
    }

    // Crear mapa de contratos para acceso rápido
    const contratoMap = new Map(
      contratos.map(c => [c.referencia_contrato, Number(c.valor_contrato) || 0])
    )

    // Obtener todas las semanas únicas y ordenarlas
    const weeksSet = new Set<string>()
    data.forEach(reporte => {
      if (!reporte.fecha_reporte) return
      const fecha = new Date(reporte.fecha_reporte)
      if (isNaN(fecha.getTime())) return

      const week = getISOWeek(fecha)
      const year = fecha.getFullYear()
      const weekKey = `${year}-W${String(week).padStart(2, '0')}`
      weeksSet.add(weekKey)
    })

    const sortedWeeks = Array.from(weeksSet).sort((a, b) => {
      const [yearA, weekA] = a.split('-W').map(Number)
      const [yearB, weekB] = b.split('-W').map(Number)
      if (yearA !== yearB) return yearA - yearB
      return weekA - weekB
    })

    // Para cada semana, calcular el promedio PONDERADO del último reporte DE ESA SEMANA de cada contrato
    return sortedWeeks.map((weekKey, weekIndex) => {
      const [year, week] = weekKey.split('-W').map(Number)
      const isLastWeek = weekIndex === sortedWeeks.length - 1

      // Obtener el último reporte de cada contrato EN esta semana específica
      // EXCEPTO en la última semana, donde usamos el último reporte absoluto de cada contrato
      const lastReportByContract: { [contrato: string]: ReporteEmprestito } = {}

      data.forEach(reporte => {
        if (!reporte.fecha_reporte) return
        const fecha = new Date(reporte.fecha_reporte)
        if (isNaN(fecha.getTime())) return

        const reportWeek = getISOWeek(fecha)
        const reportYear = fecha.getFullYear()

        const contratoKey = reporte.referencia_contrato

        if (isLastWeek) {
          // En la última semana, incluir el último reporte de cada contrato, sin importar la semana
          if (!lastReportByContract[contratoKey]) {
            lastReportByContract[contratoKey] = reporte
          } else {
            const existingDate = new Date(lastReportByContract[contratoKey].fecha_reporte)
            if (fecha > existingDate) {
              lastReportByContract[contratoKey] = reporte
            }
          }
        } else {
          // En semanas anteriores, solo considerar reportes DE esa semana específica
          if (reportYear === year && reportWeek === week) {
            if (!lastReportByContract[contratoKey]) {
              lastReportByContract[contratoKey] = reporte
            } else {
              const existingDate = new Date(lastReportByContract[contratoKey].fecha_reporte)
              if (fecha > existingDate) {
                lastReportByContract[contratoKey] = reporte
              }
            }
          }
        }
      })

      // Calcular promedio PONDERADO del último reporte de cada contrato en esta semana
      let totalFisicoPonderado = 0
      let totalFinancieroPonderado = 0
      let totalValorContratos = 0

      Object.entries(lastReportByContract).forEach(([contratoKey, reporte]) => {
        const avanceFisico = reporte.avance_fisico || 0
        const avanceFinanciero = reporte.avance_financiero || 0
        const valorContrato = contratoMap.get(contratoKey) || 0

        if (valorContrato > 0) {
          totalFisicoPonderado += (avanceFisico * valorContrato)
          totalFinancieroPonderado += (avanceFinanciero * valorContrato)
          totalValorContratos += valorContrato
        }
      })

      const avanceFisicoPromedio = totalValorContratos > 0 ? totalFisicoPonderado / totalValorContratos : 0
      const avanceFinancieroPromedio = totalValorContratos > 0 ? totalFinancieroPonderado / totalValorContratos : 0

      return {
        periodo: weekKey,
        'Avance Físico': avanceFisicoPromedio,
        'Avance Financiero': avanceFinancieroPromedio,
      }
    })
  }, [data, contratos])

  const formatYAxis = (value: number) => `${value.toFixed(0)}%`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Evolución Temporal
        </h4>
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="periodo"
              tick={{ fontSize: 10 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              stroke="#6b7280"
              tickFormatter={formatYAxis}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)}%`,
                name
              ]}
              labelStyle={{ fontSize: '11px' }}
              contentStyle={{
                fontSize: '11px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />

            <Line
              type="monotone"
              dataKey="Avance Físico"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="0"
              dot={{ r: 4, fill: "#10b981" }}
              name="Avance Físico"
            />
            <Line
              type="monotone"
              dataKey="Avance Financiero"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 1 }}
              name="Avance Financiero"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Componente Fusionado: Torta + Tabla de Organismos
const OrganismosWithPieChart: React.FC<{ data: AnalysisByCentroGestor[] }> = ({ data }) => {
  const COLORS = ['#6B7280', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316']

  // Calcular el total con TODOS los datos
  const totalGeneral = data.reduce((sum, item) => sum + item.valorAdjudicado, 0)

  // Preparar datos con colores y porcentajes
  const tableData = data
    .filter(item => item.valorAdjudicado > 0)
    .map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length],
      percent: (item.valorAdjudicado / totalGeneral) * 100
    }))

  // Datos para la torta (solo top 5)
  const chartData = tableData.slice(0, 5)

  if (tableData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center justify-center"
        style={{ minHeight: '350px' }}
      >
        <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-teal-600" />
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          Total Adjudicado por Organismo
        </h4>
      </div>

      {/* Layout horizontal: torta a la izquierda, tabla a la derecha */}
      <div className="flex items-start gap-6">
        {/* Gráfica de torta - con porcentajes internos */}
        <div style={{ height: '400px', width: '400px', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <defs>
                {chartData.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={150}
                paddingAngle={3}
                dataKey="valorAdjudicado"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, payload }: any) => {
                  const RADIAN = Math.PI / 180
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                  const x = cx + radius * Math.cos(-midAngle * RADIAN)
                  const y = cy + radius * Math.sin(-midAngle * RADIAN)

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="13"
                      fontWeight="700"
                    >
                      {`${payload.percent.toFixed(1)}%`}
                    </text>
                  )
                }}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    stroke={entry.color}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {data.centroGestor}
                        </p>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Porcentaje:</span>{' '}
                            <span className="font-bold text-gray-900 dark:text-white">
                              {data.percent.toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Valor:</span>{' '}
                            <span className="font-bold text-gray-900 dark:text-white">
                              {formatNumber(data.valorAdjudicado, 'currency')}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla con todos los datos */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">#</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Organismo</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Contratos</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">%</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Adjudicado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tableData.map((item, index) => (
                <motion.tr
                  key={item.centroGestor}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{index + 1}.</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white text-xs">
                    {item.centroGestor}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-900 dark:text-white">
                    {item.totalContratos}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">
                    {item.percent.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white text-xs">
                    {formatNumber(item.valorAdjudicado, 'currency')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

// Componente GaugeChart
const GaugeChart: React.FC<{
  title: string
  description?: string
  percentage: number
  value?: number
  total?: number
  color: string
  icon: React.ReactNode
  showMonetaryValues?: boolean
}> = ({ title, description, percentage, value = 0, total = 0, color, icon, showMonetaryValues = true }) => {
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h4>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="relative w-32 h-32 mb-3">
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

        {/* Descriptive legend */}
        {description && (
          <div className="text-center mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          </div>
        )}

        {showMonetaryValues && (
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
  yearlySummary: YearlySummary
}> = ({ analysisByBank, analysisByCentroGestor, totalContratos, valorTotalAsignado, valorTotalAsignadoBanco, yearlySummary }) => {
  const topBanco = analysisByBank[0]
  const topCentroGestor = analysisByCentroGestor[0]

  const [selectedYear, setSelectedYear] = useState<string>('Consolidado')

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value)
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Resumen Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Resumen Ejecutivo
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="Consolidado">Consolidado</option>
            {Object.keys(yearlySummary).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
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
  valorAdjudicado: number    // Del endpoint contratos_emprestito_all
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

interface YearlySummary {
  [year: string]: {
    totalContratos: number
    valorTotalAsignado: number
    valorTotalAsignadoBanco: number
    valorTotalEjecutado: number
    valorTotalPagado: number
    valorTotalFisico: number
    porcentajeFisicoPromedio: number
    porcentajeFinancieroPromedio: number
  }
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
        // Endpoint para reportes de contratos - usar el endpoint directo
        const reportesData = await fetchWithErrorHandling<any>(
          'https://gestorproyectoapi-production.up.railway.app/reportes_contratos/',
          {},
          120000 // 2 minutos de timeout
        )
        setSeguimiento(reportesData.data || [])
        setLastUpdate(new Date().toISOString())
      } catch (error: any) {
        console.warn('⚠️ Error fetching seguimiento data:', error)
        console.warn('⚠️ Detalles del error:', {
          message: error?.message,
          type: error?.type,
          code: error?.code
        })
        setSeguimiento([]) // Set empty array on error
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
  const [yearlySummary, setYearlySummary] = useState<YearlySummary>({})

  // Estados para el modal de contratos
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState<any>(null)

  // Estado para filtros
  const [filters, setFilters] = useState({
    banco: '',
    centroGestor: '',
    estado: '',
    sector: '',
    ano: '',
    fechaInicio: '',
    fechaFin: ''
  })

  // Función para calcular el resumen anual
  const calculateYearlySummary = useCallback((allContratos: ContratoEmprestito[], allReportes: ReporteEmprestito[], allBancosEmprestito: BancoEmprestito[]) => {
    const yearlyData: YearlySummary = {}

    allContratos.forEach(contrato => {
      const year = contrato.fecha_inicio_contrato ? new Date(contrato.fecha_inicio_contrato).getFullYear().toString() : 'Sin Año'

      if (!yearlyData[year]) {
        yearlyData[year] = {
          totalContratos: 0,
          valorTotalAsignado: 0,
          valorTotalAsignadoBanco: 0,
          valorTotalEjecutado: 0,
          valorTotalPagado: 0,
          valorTotalFisico: 0,
          porcentajeFisicoPromedio: 0,
          porcentajeFinancieroPromedio: 0,
        }
      }

      const yearSummary = yearlyData[year]
      const valorContrato = Number(contrato.valor_contrato) || 0

      yearSummary.totalContratos += 1
      yearSummary.valorTotalAsignado += valorContrato

      // Buscar el reporte más reciente para este contrato
      const reporteContrato = allReportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]

      if (reporteContrato) {
        const avanceFinanciero = reporteContrato.avance_financiero || 0
        const avanceFisico = reporteContrato.avance_fisico || 0
        // const porcentajePagado = (reporteContrato as any).porcentaje_pagado || 0 // No hay datos para esto actualmente

        yearSummary.valorTotalEjecutado += (valorContrato * avanceFinanciero) / 100
        yearSummary.valorTotalFisico += (valorContrato * avanceFisico) / 100
        // yearSummary.valorTotalPagado += (valorContrato * porcentajePagado) / 100
      }
    })

    // Calcular valorTotalAsignadoBanco por año (sumando de bancosEmprestito)
    allBancosEmprestito.forEach(banco => {
      // Asumiendo que banco.nombre_banco o similar puede ser usado para agrupar por año si la data lo permite
      // Por ahora, sumaremos todo al total consolidado si no hay un campo de año en BancoEmprestito
      // Si BancoEmprestito tuviera un campo de año, se usaría aquí.
      // Para este ejemplo, asumimos que valor_asignado_banco es un total general o se distribuye.
      // Si necesitamos por año, la API de bancos_emprestito_all debería proveerlo.
      // Por simplicidad, si no hay año en el banco, lo sumamos al total general o al año del contrato.
      // Para el resumen anual, necesitamos que el valor_asignado_banco esté asociado a un año.
      // Si no lo está, este cálculo será menos preciso a nivel anual.
      // Por ahora, lo dejaremos como 0 para los años individuales si no hay un campo de año en BancoEmprestito.
      // Si la API de bancos_emprestito_all tuviera un campo 'año', lo usaríamos aquí.
      // Por ahora, este valor se calculará de forma consolidada y no por año individualmente desde esta fuente.
    })

    // Recalcular promedios ponderados por año
    Object.keys(yearlyData).forEach(year => {
      const yearSummary = yearlyData[year]
      let totalPonderadoFisico = 0
      let totalPonderadoFinanciero = 0
      let totalPeso = 0

      allContratos.filter(c => (c.fecha_inicio_contrato ? new Date(c.fecha_inicio_contrato).getFullYear().toString() : 'Sin Año') === year)
        .forEach(contrato => {
          const valorContrato = Number(contrato.valor_contrato) || 0
          const reporteContrato = allReportes
            .filter(r => r.referencia_contrato === contrato.referencia_contrato)
            .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]

          if (reporteContrato) {
            const avanceFisico = reporteContrato.avance_fisico || 0
            const avanceFinanciero = reporteContrato.avance_financiero || 0

            totalPonderadoFisico += avanceFisico * valorContrato
            totalPonderadoFinanciero += avanceFinanciero * valorContrato
            totalPeso += valorContrato
          }
        })

      yearSummary.porcentajeFisicoPromedio = totalPeso > 0 ? totalPonderadoFisico / totalPeso : 0
      yearSummary.porcentajeFinancieroPromedio = totalPeso > 0 ? totalPonderadoFinanciero / totalPeso : 0
    })

    return yearlyData
  }, [])

  // Obtener datos de la API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔄 Iniciando carga de datos de Empréstito...')

        // Obtener contratos con timeout extendido
        console.log('📡 Solicitando contratos_emprestito_all...')
        const contratosData = await fetchWithErrorHandling<any>(
          'https://gestorproyectoapi-production.up.railway.app/contratos_emprestito_all',
          {},
          120000 // 2 minutos de timeout
        )
        console.log('✅ Contratos recibidos:', contratosData)

        // Obtener reportes del endpoint correcto
        console.log('📡 Solicitando reportes_contratos...')
        const reportesData = await fetchWithErrorHandling<any>(
          'https://gestorproyectoapi-production.up.railway.app/reportes_contratos/',
          {},
          120000 // 2 minutos de timeout
        ).catch((err) => {
          console.warn('⚠️ Error en reportes_contratos, usando array vacío:', err)
          return { data: [] }
        })
        console.log('✅ Reportes recibidos:', reportesData)

        // Obtener datos de bancos empréstito
        console.log('📡 Solicitando bancos_emprestito_all...')
        const bancosData = await fetchWithErrorHandling<any>(
          'https://gestorproyectoapi-production.up.railway.app/bancos_emprestito_all',
          {},
          120000 // 2 minutos de timeout
        ).catch((err) => {
          console.warn('⚠️ Error en bancos_emprestito_all, usando array vacío:', err)
          return { data: [] }
        })
        console.log('✅ Bancos recibidos:', bancosData)

        const contratosArray = contratosData.data || []
        const reportesArray = reportesData.data || []
        const bancosArray = bancosData.data || []

        setContratos(contratosArray)
        setReportes(reportesArray)
        setBancosEmprestito(bancosArray)
        setEmprestitoBancos(bancosArray) // Usar los mismos datos de bancosEmprestito que tienen valor_asignado_banco
        setFilteredData(contratosArray)
        setYearlySummary(calculateYearlySummary(contratosArray, reportesArray, bancosArray))

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

      } catch (err: any) {
        const errorMessage = err?.message || err?.type || 'Error al cargar datos de Empréstito'
        setError(errorMessage)
        console.error('❌ Error cargando datos:', err)
        console.error('❌ Detalles del error:', {
          message: err?.message,
          type: err?.type,
          code: err?.code,
          context: err?.context
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [calculateYearlySummary])

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
    if (filters.ano) {
      filtered = filtered.filter(c => {
        const fechaInicio = c.fecha_inicio_contrato ? new Date(c.fecha_inicio_contrato).getFullYear().toString() : null
        return fechaInicio === filters.ano
      })
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

    setSelectedContrato(contratoCompleto)
    setModalOpen(true)
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

      // Solo sumar al promedio ponderado si hay reporte
      if (reporteContrato) {
        analysis.promedioAvance += (avanceFinanciero * valorContrato)
      }
    })

    // Calcular porcentajes y promedios
    bankMap.forEach(analysis => {
      analysis.porcentajeEjecucion = analysis.valorAdjudicado > 0
        ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100
        : 0
      // Promedio PONDERADO: dividir suma ponderada entre valor total
      analysis.promedioAvance = analysis.valorAdjudicado > 0
        ? analysis.promedioAvance / analysis.valorAdjudicado
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

        // Solo sumar al promedio ponderado si hay reporte
        if (reporteContrato) {
          analysis.promedioAvance += (avanceFinanciero * valorContrato)
        }
      }
    })

    // Calcular porcentajes y promedios
    bankMap.forEach(analysis => {
      analysis.porcentajeEjecucion = analysis.valorAdjudicado > 0
        ? (analysis.valorEjecutado / analysis.valorAdjudicado) * 100
        : 0
      // Promedio PONDERADO: dividir suma ponderada entre valor total
      analysis.promedioAvance = analysis.valorAdjudicado > 0
        ? analysis.promedioAvance / analysis.valorAdjudicado
        : 0
    })

    // Filtrar para mostrar solo bancos que tienen contratos asignados, luego ordenar por valorAsignadoBanco
    return Array.from(bankMap.values())
      .filter(banco => banco.totalContratos > 0) // Solo mostrar bancos con contratos
      .sort((a, b) => b.valorAsignadoBanco - a.valorAsignadoBanco)
  }, [filteredData, reportes, emprestitoBancos])

  // Cálculo correcto del avance físico total basado en los contratos
  // Usa el último reporte de cada contrato (mismo que la gráfica semanal usa para la última semana)
  const valorTotalFisico = useMemo(() => {
    let totalAvanceFisico = 0

    filteredData.forEach(contrato => {
      // Buscar el último reporte de este contrato (más reciente por fecha)
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

  // Cálculo del porcentaje de pagos promedio ponderado por valor_contrato
  const porcentajePagosPromedio = useMemo(() => {
    let totalPonderado = 0
    let totalPeso = 0

    filteredData.forEach(contrato => {
      // Buscar el reporte más reciente para este contrato
      const reporteContrato = reportes
        .filter(r => r.referencia_contrato === contrato.referencia_contrato)
        .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]

      if (reporteContrato) {
        const avancePagos = (reporteContrato as any).avance_pagos || 0
        const valorContrato = Number(contrato.valor_contrato) || 0

        totalPonderado += avancePagos * valorContrato
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
    porcentajeFinancieroPromedio,
    porcentajePagosPromedio,
    yearlySummary
  }
}

// Componente BankBarChart
const BankBarChart: React.FC<{
  data: AnalysisByBank[]
  title?: string
  maxItems?: number
}> = ({ data, title = "Análisis por Banco", maxItems = 8 }) => {
  const chartData = data.slice(0, maxItems)

  const metrics = [
    { key: 'valorAsignadoBanco', label: 'Asignado Banco', color: '#F59E0B' },
    { key: 'valorAdjudicado', label: 'Valor Adjudicado', color: '#3B82F6' },
    { key: 'valorEjecutado', label: 'Ejecución Financiera', color: '#10B981' },
    { key: 'valorPagado', label: 'Pagos', color: '#8B5CF6' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex flex-col border border-gray-100 dark:border-gray-700 w-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda simple */}
      <div className="flex flex-wrap gap-4 mb-2 text-sm">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: metric.color }} />
            <span className="text-gray-700 dark:text-gray-300">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: `${Math.max(800, chartData.length * 85)}px`, height: '550px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />

              <XAxis
                dataKey="banco"
                tick={({ x, y, payload }) => {
                  const text = payload.value as string
                  const words = text.split(' ')
                  const lines: string[] = []
                  let currentLine = ''

                  // Dividir en líneas de máximo 15 caracteres
                  words.forEach(word => {
                    if ((currentLine + ' ' + word).length <= 15) {
                      currentLine += (currentLine ? ' ' : '') + word
                    } else {
                      if (currentLine) lines.push(currentLine)
                      currentLine = word
                    }
                  })
                  if (currentLine) lines.push(currentLine)

                  // Limitar a 2 líneas
                  const displayLines = lines.slice(0, 2)
                  if (lines.length > 2) {
                    displayLines[1] = displayLines[1].substring(0, 13) + '...'
                  }

                  return (
                    <g transform={`translate(${x},${y})`}>
                      {displayLines.map((line, i) => (
                        <text
                          key={i}
                          x={0}
                          y={i * 11 + 5}
                          textAnchor="middle"
                          fill="#4B5563"
                          fontSize="9"
                          fontWeight="500"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )
                }}
                height={60}
                interval={0}
              />

              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(1)} Bill`
                  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)} Mil M`
                  if (value >= 2000000) return `$${(value / 1000000).toFixed(1)} Mill`
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)} Millón`
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)} Mil`
                  return `$${value}`
                }}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={90}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(value, 'currency')}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />

              {metrics.map(metric => (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                  label={({ x, y, width, value, index }: any) => {
                    if (!value || value === 0) return <g />

                    // Formato correcto de pesos colombianos
                    let formattedValue = ''
                    if (value >= 1000000000000) { // Billones
                      formattedValue = `$${(value / 1000000000000).toFixed(1)} Bill`
                    } else if (value >= 1000000000) { // Miles de millones
                      formattedValue = `$${(value / 1000000000).toFixed(1)} Mil M`
                    } else if (value >= 2000000) { // Millones (plural)
                      formattedValue = `$${(value / 1000000).toFixed(1)} Mill`
                    } else if (value >= 1000000) { // Millón (singular)
                      formattedValue = `$${(value / 1000000).toFixed(1)} Millón`
                    } else if (value >= 1000) { // Miles
                      formattedValue = `$${(value / 1000).toFixed(0)} Mil`
                    } else {
                      formattedValue = `$${value}`
                    }

                    return (
                      <g>
                        <rect
                          x={x + width / 2 - 35}
                          y={y - 32}
                          width="70"
                          height="24"
                          fill={metric.color}
                          opacity="0.95"
                          rx="5"
                        />
                        <text
                          x={x + width / 2}
                          y={y - 15}
                          fill="white"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {formattedValue}
                        </text>
                      </g>
                    )
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.length > maxItems && (
        <div className="text-center mt-3 p-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded">
          Mostrando {maxItems} de {data.length} bancos • Desliza para ver más
        </div>
      )}
    </motion.div>
  )
}

// Componente CentroGestorBarChart
const CentroGestorBarChart: React.FC<{
  data: AnalysisByCentroGestor[]
  title?: string
  maxItems?: number
}> = ({ data, title = "Análisis por Centro Gestor", maxItems = 100 }) => {
  // Mostrar todos los centros gestores
  const chartData = data

  const metrics = [
    { key: 'valorAdjudicado', label: 'Valor Adjudicado', color: '#3B82F6' },
    { key: 'valorEjecutado', label: 'Ejecución Financiera', color: '#10B981' },
    { key: 'valorPagado', label: 'Pagos', color: '#8B5CF6' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 flex flex-col border border-gray-100 dark:border-gray-700 w-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Leyenda simple */}
      <div className="flex flex-wrap gap-4 mb-2 text-sm">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: metric.color }} />
            <span className="text-gray-700 dark:text-gray-300">{metric.label}</span>
          </div>
        ))}
      </div>

      {/* Gráfico con scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ minWidth: `${Math.max(800, chartData.length * 120)}px`, height: '550px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 30, right: 10, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />

              <XAxis
                dataKey="centroGestor"
                tick={({ x, y, payload }) => {
                  const text = payload.value as string
                  const words = text.split(' ')
                  const lines: string[] = []
                  let currentLine = ''

                  // Aumentar caracteres por línea para nombres horizontales
                  words.forEach(word => {
                    if ((currentLine + ' ' + word).length <= 20) {
                      currentLine += (currentLine ? ' ' : '') + word
                    } else {
                      if (currentLine) lines.push(currentLine)
                      currentLine = word
                    }
                  })
                  if (currentLine) lines.push(currentLine)

                  // Limitar a 2 líneas para mejor legibilidad
                  const displayLines = lines.slice(0, 2)
                  if (lines.length > 2) {
                    displayLines[1] = displayLines[1].substring(0, 18) + '...'
                  }

                  return (
                    <g transform={`translate(${x},${y})`}>
                      {displayLines.map((line, i) => (
                        <text
                          key={i}
                          x={0}
                          y={i * 11 + 5}
                          textAnchor="middle"
                          fill="#4B5563"
                          fontSize="9"
                          fontWeight="500"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  )
                }}
                height={60}
                interval={0}
              />

              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(1)} Bill`
                  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)} Mil M`
                  if (value >= 2000000) return `$${(value / 1000000).toFixed(1)} Mill`
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)} Millón`
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)} Mil`
                  return `$${value}`
                }}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={90}
              />

              <Tooltip
                formatter={(value: any) => formatNumber(value, 'currency')}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />

              {metrics.map(metric => (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  radius={[4, 4, 0, 0]}
                  label={({ x, y, width, value, index }: any) => {
                    if (!value || value === 0) return <g />

                    // Separar valor numérico y notación
                    let numericValue = ''
                    let notation = ''

                    if (value >= 1000000000000) { // Billones
                      numericValue = `$${(value / 1000000000000).toFixed(1)}`
                      notation = 'Bill'
                    } else if (value >= 1000000000) { // Miles de millones
                      numericValue = `$${(value / 1000000000).toFixed(1)}`
                      notation = 'Mil M'
                    } else if (value >= 2000000) { // Millones (plural)
                      numericValue = `$${(value / 1000000).toFixed(1)}`
                      notation = 'Mill'
                    } else if (value >= 1000000) { // Millón (singular)
                      numericValue = `$${(value / 1000000).toFixed(1)}`
                      notation = 'Millón'
                    } else if (value >= 1000) { // Miles
                      numericValue = `$${(value / 1000).toFixed(0)}`
                      notation = 'Mil'
                    } else {
                      numericValue = `$${value}`
                      notation = ''
                    }

                    const labelHeight = notation ? 32 : 24

                    return (
                      <g>
                        <rect
                          x={x}
                          y={y - labelHeight - 5}
                          width={width}
                          height={labelHeight}
                          fill={metric.color}
                          opacity="0.95"
                          rx="4"
                        />
                        <text
                          x={x + width / 2}
                          y={y - (notation ? 20 : 12)}
                          fill="white"
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                        >
                          {numericValue}
                        </text>
                        {notation && (
                          <text
                            x={x + width / 2}
                            y={y - 8}
                            fill="white"
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="600"
                          >
                            {notation}
                          </text>
                        )}
                      </g>
                    )
                  }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {chartData.length > 6 && (
        <div className="text-center mt-3 p-2 text-sm text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 rounded">
          Mostrando {chartData.length} centros gestores • Desliza para ver más
        </div>
      )}
    </motion.div>
  )
}

// Componente unificado para análisis financiero con toggle
const FinancialAnalysisToggle: React.FC<{
  bankData: AnalysisByBank[]
  centroGestorData: AnalysisByCentroGestor[]
}> = ({ bankData, centroGestorData }) => {
  const [viewMode, setViewMode] = useState<'banco' | 'centroGestor'>('banco')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 w-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-teal-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Análisis Financiero
          </h3>
        </div>

        {/* Toggle para cambiar vista */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('banco')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${viewMode === 'banco'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Briefcase className="w-4 h-4 inline mr-2" />
            Por Banco
          </button>
          <button
            onClick={() => setViewMode('centroGestor')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${viewMode === 'centroGestor'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Por Centro Gestor
          </button>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      <AnimatePresence mode="wait">
        {viewMode === 'banco' ? (
          <motion.div
            key="banco-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px]"
          >
            <BankBarChart
              data={bankData}
              title=""
              maxItems={8}
            />
          </motion.div>
        ) : (
          <motion.div
            key="centro-gestor-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px]"
          >
            <CentroGestorBarChart
              data={centroGestorData}
              title=""
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Componente fusionado: Torta + Tabla de Organismos */}
      <div className="mt-3">
        <OrganismosWithPieChart data={centroGestorData} />
      </div>
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
  const [selectedYear, setSelectedYear] = useState<string>('Consolidado')

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  // Estados para el modal de contratos
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState<any>(null)

  // Estado para selector de columnas
  const [columnSettings, setColumnSettings] = useState({
    proceso: true,
    banco: true,
    estado: true,
    valor: true,
    avance: true,
    observaciones: true,
    detalle: true,
    tipo: false,
    modalidad: false,
    sector: false,
    supervisor: false,
    categoria: false,
    fechaInicio: false,
    fechaFin: false,
    diasTranscurridos: false,
    diasRestantes: false
  })
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' })

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
    porcentajeFinancieroPromedio,
    porcentajePagosPromedio,
    yearlySummary
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

  // Función para manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Contratos ordenados
  const sortedContratos = useMemo(() => {
    if (!sortConfig.key) return contratos

    return [...contratos].sort((a: any, b: any) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // Casos especiales para campos calculados
      if (sortConfig.key === 'avance_financiero') {
        // Buscar el reporte más reciente para cada contrato
        const reporteA = reportes
          .filter(r => r.referencia_contrato === a.referencia_contrato)
          .sort((r1, r2) => new Date(r2.fecha_reporte).getTime() - new Date(r1.fecha_reporte).getTime())[0]
        const reporteB = reportes
          .filter(r => r.referencia_contrato === b.referencia_contrato)
          .sort((r1, r2) => new Date(r2.fecha_reporte).getTime() - new Date(r1.fecha_reporte).getTime())[0]

        // Obtener el avance financiero del reporte o calcularlo
        aValue = reporteA?.avance_financiero || ((a.valor_pagado || 0) / (a.valor_contrato || 1)) * 100
        bValue = reporteB?.avance_financiero || ((b.valor_pagado || 0) / (b.valor_contrato || 1)) * 100
      } else if (sortConfig.key === 'dias_transcurridos' || sortConfig.key === 'dias_restantes') {
        const fechaInicioA = a.fecha_firma_contrato ? new Date(a.fecha_firma_contrato) : null
        const fechaFinA = a.fecha_fin_contrato ? new Date(a.fecha_fin_contrato) : null
        const fechaInicioB = b.fecha_firma_contrato ? new Date(b.fecha_firma_contrato) : null
        const fechaFinB = b.fecha_fin_contrato ? new Date(b.fecha_fin_contrato) : null
        const fechaActual = new Date()

        if (sortConfig.key === 'dias_transcurridos') {
          aValue = fechaInicioA ? Math.floor((fechaActual.getTime() - fechaInicioA.getTime()) / (1000 * 60 * 60 * 24)) : null
          bValue = fechaInicioB ? Math.floor((fechaActual.getTime() - fechaInicioB.getTime()) / (1000 * 60 * 60 * 24)) : null
        } else {
          aValue = fechaFinA ? Math.floor((fechaFinA.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)) : null
          bValue = fechaFinB ? Math.floor((fechaFinB.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)) : null
        }
      }

      // Manejar valores nulos o indefinidos
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Comparación numérica
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Comparación de strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [contratos, sortConfig, reportes])

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
    <div className="flex relative w-full">
      {/* Contenido principal */}
      <div
        className="flex-1 space-y-3 sm:space-y-4 p-4 sm:p-6 transition-all duration-300"
        style={{ marginRight: showFilters ? '320px' : '0' }}
      >
        {/* Título del Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
        </motion.div>



        {/* Resumen Ejecutivo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Resumen Ejecutivo
            </h3>
          </div>

          {/* Consolidado General - Siempre visible */}
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Consolidado General
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Contratos Totales</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatNumber(totalContratos)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Valor Total Contratos</p>
                <p className="text-sm font-bold text-green-700 dark:text-green-300">{formatNumber(valorTotalAsignado, 'currency')}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Valor Asignado Bancos</p>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{formatNumber(valorTotalAsignadoBanco, 'currency')}</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Bancos Activos</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{analysisByBank.length}</p>
              </div>
              <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-2 border-teal-200 dark:border-teal-800">
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Centros Gestores</p>
                <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{analysisByCentroGestor.length}</p>
              </div>
            </div>
          </div>

          {/* Indicadores de Ejecución con Gráficos de Anillos y Línea Temporal */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Indicadores de Ejecución
            </h4>

            {/* Anillos en una sola fila */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
              {/* Ejecución Física */}
              <div className="min-w-0">
                <GaugeChart
                  title="Ejecución Física"
                  description="Progreso físico de los contratos"
                  percentage={porcentajeFisicoPromedio}
                  color="text-cyan-500"
                  icon={<Activity className="w-5 h-5 text-cyan-600" />}
                  showMonetaryValues={false}
                />
              </div>

              {/* Ejecución Financiera */}
              <div className="min-w-0">
                <GaugeChart
                  title="Ejecución Financiera"
                  description="Progreso financiero de los contratos"
                  percentage={porcentajeFinancieroPromedio}
                  color="text-indigo-500"
                  icon={<TrendingUp className="w-5 h-5 text-indigo-600" />}
                  showMonetaryValues={false}
                />
              </div>

              {/* Pagos Realizados */}
              <div className="min-w-0">
                <GaugeChart
                  title="Pagos Realizados"
                  description="Pagos efectuados sobre el total"
                  percentage={porcentajePagosPromedio}
                  color="text-pink-500"
                  icon={<DollarSign className="w-5 h-5 text-pink-600" />}
                  showMonetaryValues={false}
                />
              </div>
            </div>

            {/* Gráfica de Avance Físico por Organismo */}
            <div className="min-w-0 mb-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 flex flex-col"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                    Avance Físico por Organismo
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <div style={{ minWidth: '800px', height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analysisByCentroGestor
                          .map(centro => {
                            // Calcular el promedio PONDERADO de avance físico para este centro gestor
                            const contratosDelCentro = contratos.filter(c =>
                              (c.nombre_centro_gestor || 'Sin definir') === centro.centroGestor
                            )

                            let totalAvanceFisicoPonderado = 0
                            let totalValorContratos = 0

                            contratosDelCentro.forEach(contrato => {
                              const reporteContrato = reportes
                                .filter(r => r.referencia_contrato === contrato.referencia_contrato)
                                .sort((a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime())[0]

                              if (reporteContrato) {
                                const avanceFisico = reporteContrato.avance_fisico || 0
                                const valorContrato = Number(contrato.valor_contrato) || 0

                                totalAvanceFisicoPonderado += (avanceFisico * valorContrato)
                                totalValorContratos += valorContrato
                              }
                            })

                            const promedioAvanceFisico = totalValorContratos > 0 ? totalAvanceFisicoPonderado / totalValorContratos : 0

                            return {
                              name: centro.centroGestor,
                              avanceFisico: promedioAvanceFisico,
                              valorAdjudicado: centro.valorAdjudicado
                            }
                          })
                          .sort((a, b) => b.valorAdjudicado - a.valorAdjudicado)}
                        margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />

                        <XAxis
                          dataKey="name"
                          tick={({ x, y, payload }) => {
                            const text = payload.value as string
                            const words = text.split(' ')
                            const lines: string[] = []
                            let currentLine = ''

                            // Dividir el texto en líneas sin límite de caracteres estricto
                            words.forEach(word => {
                              if ((currentLine + ' ' + word).length <= 30) {
                                currentLine += (currentLine ? ' ' : '') + word
                              } else {
                                if (currentLine) lines.push(currentLine)
                                currentLine = word
                              }
                            })
                            if (currentLine) lines.push(currentLine)

                            // Mostrar todas las líneas necesarias sin truncar
                            return (
                              <g transform={`translate(${x},${y})`}>
                                {lines.map((line, i) => (
                                  <text
                                    key={i}
                                    x={0}
                                    y={i * 11 + 5}
                                    textAnchor="middle"
                                    fill="#4B5563"
                                    fontSize="10"
                                  >
                                    {line}
                                  </text>
                                ))}
                              </g>
                            )
                          }}
                          height={80}
                          interval={0}
                        />

                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />

                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Avance Físico']}
                          labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                        />

                        <Bar dataKey="avanceFisico" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          <LabelList
                            dataKey="avanceFisico"
                            position="top"
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                            style={{ fontSize: '10px', fill: '#1F2937', fontWeight: 'bold' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Gráfica de línea temporal + Variación */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {/* Gráfica de evolución temporal */}
              <div className="lg:col-span-3 min-w-0">
                <WeeklyProgressChart
                  data={reportes}
                  contratos={contratos}
                  maxAvance={porcentajeFisicoPromedio}
                />
              </div>

              {/* Variación entre semanas */}
              <WeeklyVariationPanel
                reportes={reportes}
                contratos={contratos}
              />
            </div>
          </div>
        </motion.div>

        {/* Análisis Financiero Unificado */}
        <FinancialAnalysisToggle
          bankData={analysisByBankForChart}
          centroGestorData={analysisByCentroGestor}
        />

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
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Columnas
                </button>

                {/* Dropdown de columnas */}
                {showColumnSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl z-10 p-3 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {[
                        { key: 'proceso', label: 'Proceso / Centro Gestor' },
                        { key: 'banco', label: 'Banco' },
                        { key: 'estado', label: 'Estado' },
                        { key: 'valor', label: 'Valor Contrato' },
                        { key: 'avance', label: 'Avance Ejecución' },
                        { key: 'observaciones', label: 'Observaciones / Alertas' },
                        { key: 'tipo', label: 'Tipo Contrato' },
                        { key: 'modalidad', label: 'Modalidad Contratación' },
                        { key: 'sector', label: 'Sector' },
                        { key: 'categoria', label: 'Código Categoría' },
                        { key: 'supervisor', label: 'Supervisor' },
                        { key: 'fechaInicio', label: 'Fecha Inicio' },
                        { key: 'fechaFin', label: 'Fecha Fin' },
                        { key: 'diasTranscurridos', label: 'Días Transcurridos' },
                        { key: 'diasRestantes', label: 'Días Restantes' },
                        { key: 'detalle', label: 'Detalle' }
                      ].map(col => (
                        <label key={col.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={columnSettings[col.key as keyof typeof columnSettings]}
                            onChange={(e) => setColumnSettings({
                              ...columnSettings,
                              [col.key]: e.target.checked
                            })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Tabla Responsiva Mejorada */}
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full min-w-[1200px] table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {columnSettings.proceso && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[300px]">
                        <div className="flex items-center gap-2">
                          <div>
                            <div>Proceso / Centro Gestor</div>
                            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">Nombre - Entidad - Referencia</div>
                          </div>
                          <button onClick={() => handleSort('nombre_resumido_proceso')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'nombre_resumido_proceso' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.banco && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>Banco</span>
                          <button onClick={() => handleSort('banco')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'banco' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.estado && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[100px]">
                        <div className="flex items-center justify-center gap-2">
                          <span>Estado</span>
                          <button onClick={() => handleSort('estado')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'estado' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.valor && (
                      <th className="text-right py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[130px]">
                        <div className="flex items-center justify-end gap-2">
                          <span>Valor Contrato</span>
                          <button onClick={() => handleSort('valor_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'valor_contrato' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.avance && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[160px]">
                        <div className="flex items-center justify-center gap-2">
                          <div>
                            <div>Avance Ejecución</div>
                            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">Financiero / Físico</div>
                          </div>
                          <button onClick={() => handleSort('avance_financiero')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'avance_financiero' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.observaciones && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[200px]">
                        Observaciones / Alertas
                      </th>
                    )}
                    {columnSettings.tipo && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>Tipo Contrato</span>
                          <button onClick={() => handleSort('tipo_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'tipo_contrato' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.modalidad && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[140px]">
                        <div className="flex items-center gap-2">
                          <span>Modalidad</span>
                          <button onClick={() => handleSort('modalidad_contratacion')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'modalidad_contratacion' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.sector && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>Sector</span>
                          <button onClick={() => handleSort('sector')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'sector' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.categoria && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[120px]">
                        <div className="flex items-center gap-2">
                          <span>Categoría</span>
                          <button onClick={() => handleSort('codigo_categoria')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'codigo_categoria' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.supervisor && (
                      <th className="text-left py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[140px]">
                        <div className="flex items-center gap-2">
                          <span>Supervisor</span>
                          <button onClick={() => handleSort('supervisor')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'supervisor' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.fechaInicio && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[110px]">
                        <div className="flex items-center justify-center gap-2">
                          <span>Fecha Inicio</span>
                          <button onClick={() => handleSort('fecha_firma_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'fecha_firma_contrato' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.fechaFin && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[110px]">
                        <div className="flex items-center justify-center gap-2">
                          <span>Fecha Fin</span>
                          <button onClick={() => handleSort('fecha_fin_contrato')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'fecha_fin_contrato' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.diasTranscurridos && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[100px]">
                        <div className="flex items-center justify-center gap-2">
                          <div>
                            <div>Días</div>
                            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">Transcurridos</div>
                          </div>
                          <button onClick={() => handleSort('dias_transcurridos')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'dias_transcurridos' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.diasRestantes && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[100px]">
                        <div className="flex items-center justify-center gap-2">
                          <div>
                            <div>Días</div>
                            <div className="text-xs font-normal text-gray-500 dark:text-gray-400">Restantes</div>
                          </div>
                          <button onClick={() => handleSort('dias_restantes')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                            {sortConfig.key === 'dias_restantes' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    {columnSettings.detalle && (
                      <th className="text-center py-3 px-2 font-semibold text-gray-700 dark:text-gray-300 text-sm w-[80px]">
                        Detalle
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
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
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {columnSettings.proceso && (
                          <td className="py-3 px-2 text-sm w-[300px]">
                            <div className="space-y-1 overflow-hidden">
                              <div className="font-medium text-gray-900 dark:text-white text-xs leading-tight truncate"
                                title={contrato.nombre_resumido_proceso || 'Sin proceso'}>
                                {contrato.nombre_resumido_proceso || 'Sin proceso'}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight whitespace-normal break-words"
                                title={contrato.nombre_centro_gestor || 'Sin centro gestor'}>
                                {contrato.nombre_centro_gestor || 'Sin centro gestor'}
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-mono truncate"
                                title={contrato.referencia_contrato || 'Sin referencia'}>
                                {contrato.referencia_contrato || 'Sin referencia'}
                              </div>
                            </div>
                          </td>
                        )}
                        {columnSettings.banco && (
                          <td className="py-3 px-2 text-sm text-gray-700 dark:text-gray-300 w-[120px]">
                            <div className="truncate text-xs" title={contrato.banco || 'No especificado'}>
                              {contrato.banco || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.estado && (
                          <td className="py-3 px-2 text-center w-[100px]">
                            <span className={`px-2 py-1 text-xs rounded-full inline-block max-w-full truncate ${contrato.estado_contrato === 'En ejecución'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : contrato.estado_contrato === 'Aprobado'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`} title={contrato.estado_contrato}>
                              {contrato.estado_contrato?.substring(0, 12) || 'N/A'}
                            </span>
                          </td>
                        )}
                        {columnSettings.valor && (
                          <td className="py-3 px-2 text-sm text-right font-medium text-gray-700 dark:text-gray-300 w-[130px]">
                            <div className="truncate text-xs" title={formatNumber(Number(contrato.valor_contrato || contrato.valor_del_contrato || 0), 'currency')}>
                              {formatNumber(Number(contrato.valor_contrato || contrato.valor_del_contrato || 0), 'currency')}
                            </div>
                          </td>
                        )}
                        {columnSettings.avance && (
                          <td className="py-3 px-2 w-[160px]">
                            <div className="space-y-2">
                              {/* Progress bar para Avance Financiero - más compacto */}
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs">Fin.</span>
                                  <span className="font-medium text-xs">
                                    {reporteContrato?.avance_financiero?.toFixed(1) || '0'}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(reporteContrato?.avance_financiero || 0, 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                              {/* Progress bar para Avance Físico - más compacto */}
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs">Fís.</span>
                                  <span className="font-medium text-xs">
                                    {reporteContrato?.avance_fisico?.toFixed(1) || '0'}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(reporteContrato?.avance_fisico || 0, 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                              {reporteContrato?.fecha_reporte && (
                                <div className="text-xs text-gray-400 text-center truncate">
                                  {new Date(reporteContrato.fecha_reporte).toLocaleDateString('es-CO', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        {columnSettings.observaciones && (
                          <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400 w-[200px]">
                            <div className="text-xs break-words overflow-hidden" style={{ maxHeight: '4rem' }}>
                              {(() => {
                                const observaciones = []

                                // Revisar si hay retrasos basados en fechas del contrato
                                const fechaFin = contrato.fecha_fin_contrato ? new Date(contrato.fecha_fin_contrato) : null
                                if (fechaFin && fechaFin < new Date() && !['Liquidado', 'Terminado', 'Finalizado'].includes(contrato.estado_contrato)) {
                                  observaciones.push('⚠️ Contrato vencido')
                                }

                                // Revisar avance financiero vs físico si hay reportes
                                if (reporteContrato) {
                                  const avanceFinanciero = reporteContrato.avance_financiero || 0
                                  const avanceFisico = reporteContrato.avance_fisico || 0

                                  if (avanceFinanciero > avanceFisico + 15) {
                                    observaciones.push('📈 Avance financiero elevado')
                                  } else if (avanceFisico > avanceFinanciero + 15) {
                                    observaciones.push('📉 Avance financiero rezagado')
                                  }
                                }

                                // Revisar si está próximo a vencer
                                if (fechaFin) {
                                  const diasRestantes = Math.ceil((fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                  if (diasRestantes <= 30 && diasRestantes > 0) {
                                    observaciones.push('🔔 Próximo a vencer')
                                  }
                                }

                                // Revisar contratos sin supervisión
                                if (!contrato.supervisor || contrato.supervisor === 'No definido') {
                                  observaciones.push('👤 Sin supervisor asignado')
                                }

                                // Revisar contratos sin contratista
                                if (!contrato.nombre_contratista) {
                                  observaciones.push('🏢 Sin contratista asignado')
                                }

                                // Mostrar observaciones del reporte si las hay
                                if (reporteContrato?.observaciones) {
                                  observaciones.push(`💬 ${reporteContrato.observaciones}`)
                                }

                                return observaciones.length > 0 ? observaciones.join(' • ') : 'Sin observaciones'
                              })()}
                            </div>
                            {reporteContrato?.alertas?.es_alerta && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                  ⚠ {reporteContrato.alertas.descripcion || 'Alerta'}
                                </span>
                              </div>
                            )}
                          </td>
                        )}
                        {columnSettings.tipo && (
                          <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300 w-[120px]">
                            <div className="truncate" title={(contrato as any).tipo_contrato || (contrato as any).tipo_de_contrato || 'N/A'}>
                              {(contrato as any).tipo_contrato || (contrato as any).tipo_de_contrato || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.modalidad && (
                          <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300 w-[140px]">
                            <div className="truncate" title={(contrato as any).modalidad_contratacion || (contrato as any).modalidad_de_selecci_n || 'N/A'}>
                              {(contrato as any).modalidad_contratacion || (contrato as any).modalidad_de_selecci_n || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.sector && (
                          <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300 w-[120px]">
                            <div className="truncate" title={contrato.sector || 'N/A'}>
                              {contrato.sector || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.categoria && (
                          <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300 w-[120px]">
                            <div className="truncate font-mono" title={(contrato as any).codigo_categoria_principal || (contrato as any).codigo_secop || 'N/A'}>
                              {(contrato as any).codigo_categoria_principal || (contrato as any).codigo_secop || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.supervisor && (
                          <td className="py-3 px-2 text-xs text-gray-700 dark:text-gray-300 w-[140px]">
                            <div className="truncate" title={(contrato as any).nombre_supervisor || 'N/A'}>
                              {(contrato as any).nombre_supervisor || 'N/A'}
                            </div>
                          </td>
                        )}
                        {columnSettings.fechaInicio && (
                          <td className="py-3 px-2 text-center text-xs text-gray-700 dark:text-gray-300 w-[110px]">
                            {contrato.fecha_inicio_contrato ? new Date(contrato.fecha_inicio_contrato).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </td>
                        )}
                        {columnSettings.fechaFin && (
                          <td className="py-3 px-2 text-center text-xs text-gray-700 dark:text-gray-300 w-[110px]">
                            {contrato.fecha_fin_contrato ? new Date(contrato.fecha_fin_contrato).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'N/A'}
                          </td>
                        )}
                        {columnSettings.diasTranscurridos && (
                          <td className="py-3 px-2 text-center text-xs w-[100px]">
                            {(() => {
                              if (!contrato.fecha_inicio_contrato) return <span className="text-gray-400">N/A</span>
                              const inicio = new Date(contrato.fecha_inicio_contrato)
                              const hoy = new Date()
                              const diasTranscurridos = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
                              return (
                                <span className={`font-semibold ${diasTranscurridos < 0 ? 'text-gray-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {diasTranscurridos < 0 ? 'No iniciado' : `${diasTranscurridos} días`}
                                </span>
                              )
                            })()}
                          </td>
                        )}
                        {columnSettings.diasRestantes && (
                          <td className="py-3 px-2 text-center text-xs w-[100px]">
                            {(() => {
                              if (!contrato.fecha_fin_contrato) return <span className="text-gray-400">N/A</span>
                              const fin = new Date(contrato.fecha_fin_contrato)
                              const hoy = new Date()
                              const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
                              return (
                                <span className={`font-semibold ${diasRestantes < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : diasRestantes <= 30
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-green-600 dark:text-green-400'
                                  }`}>
                                  {diasRestantes < 0 ? `Vencido (${Math.abs(diasRestantes)} días)` : `${diasRestantes} días`}
                                </span>
                              )
                            })()}
                          </td>
                        )}
                        {columnSettings.detalle && (
                          <td className="py-3 px-2 text-center w-[80px]">
                            <button
                              onClick={() => handleOpenModal(contrato)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg w-8 h-8 flex items-center justify-center"
                              title="Ver detalles del contrato"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
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
                          className={`px-3 py-2 text-sm font-medium rounded-md ${i === currentPage
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

      {/* Botón flotante fijo para filtros - siempre visible */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-200 shadow-2xl transform hover:scale-110 active:scale-95"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Filter className="w-5 h-5" />
        <span className="hidden md:inline font-medium">
          {showFilters ? 'Cerrar' : 'Filtros'}
        </span>
      </motion.button>

      {/* Panel lateral de filtros */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-teal-600" />
                  Filtros de Análisis
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Filtro por Año */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Año
                  </label>
                  <select
                    value={filters.ano || ''}
                    onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Todos los años</option>
                    {Object.keys(yearlySummary || {}).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

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
                    onClick={() => setFilters({ banco: '', centroGestor: '', estado: '', sector: '', ano: '', fechaInicio: '', fechaFin: '' })}
                    className="w-full px-4 py-2 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 font-medium rounded-lg transition-colors"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de detalles del contrato */}
      <ContratosModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedContrato(null)
        }}
        contratoData={selectedContrato}
        referenciaContrato={selectedContrato?.referencia_contrato}
        reportes={reportes}
      />
    </div>
  )
}

export default EmprestitoAdvancedDashboard