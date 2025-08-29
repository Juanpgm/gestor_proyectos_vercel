'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { TrendingUp, DollarSign, Calendar, Filter, Eye, EyeOff } from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency, formatCurrencyFull } from '../utils/formatCurrency'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS, CHART_COLORS } from '@/lib/design-system'
import { LoadingChart, ErrorState } from './LoadingComponents'
import ResponsiveChart from './ResponsiveChart'
import ResponsiveMetricCard from './ResponsiveMetricCard'

interface BudgetAnalysisChartProps {
  className?: string
  showMetrics?: boolean
  orientation?: 'horizontal' | 'vertical'
  chartType?: 'line' | 'bar'
}

const BudgetAnalysisChart: React.FC<BudgetAnalysisChartProps> = ({ 
  className = '', 
  showMetrics = true,
  orientation = 'vertical',
  chartType = 'line'
}) => {
  const dataContext = useDataContext()
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = dataContext
  
  // Estado para años seleccionados
  const [selectedYears, setSelectedYears] = useState<string[]>(['2024', '2025'])
  
  // Estado para líneas visibles
  const [visibleLines, setVisibleLines] = useState({
    ppto_modificado: true,
    adiciones: true,
    reducciones: true,
    ejecucion: true,
    pagos: true
  })

  // Estado para tipo de vista en móvil
  const [isMobileView, setIsMobileView] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Obtener años disponibles de los datos
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    if (filteredMovimientosPresupuestales) {
      filteredMovimientosPresupuestales.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    if (filteredEjecucionPresupuestal) {
      filteredEjecucionPresupuestal.forEach((item: any) => {
        const year = item.periodo_corte?.substring(0, 4)
        if (year) years.add(year)
      })
    }
    return Array.from(years).sort()
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal])

  // Filtrar datos por años seleccionados
  const yearFilteredMovimientos = useMemo(() => {
    if (!filteredMovimientosPresupuestales) return []
    return filteredMovimientosPresupuestales.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [filteredMovimientosPresupuestales, selectedYears])

  const yearFilteredEjecucion = useMemo(() => {
    if (!filteredEjecucionPresupuestal) return []
    return filteredEjecucionPresupuestal.filter((item: any) => {
      const year = item.periodo_corte?.substring(0, 4)
      return year && selectedYears.includes(year)
    })
  }, [filteredEjecucionPresupuestal, selectedYears])

  // Procesar datos de líneas presupuestales
  const budgetLineData = useMemo(() => {
    const periodTotals: { [key: string]: any } = {}
    
    // Procesar movimientos presupuestales filtrados por año
    yearFilteredMovimientos?.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || '' // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0,
          pagos: 0
        }
      }

      periodTotals[period].ppto_modificado += item.ppto_modificado || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
    })

    // Procesar ejecución presupuestal filtrada por año
    yearFilteredEjecucion?.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || '' // YYYY-MM

      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          ppto_modificado: 0,
          adiciones: 0,
          reducciones: 0,
          ejecucion: 0,
          pagos: 0
        }
      }

      periodTotals[period].ejecucion += item.ejecucion || 0
      periodTotals[period].pagos += item.pagos || 0
    })

    return Object.values(periodTotals).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }, [yearFilteredMovimientos, yearFilteredEjecucion])

  // Calcular totales generales para mostrar debajo del gráfico
  const budgetTotals = useMemo(() => {
    let ppto_inicial = 0
    let ppto_modificado = 0
    let adiciones = 0
    let reducciones = 0
    let ejecucion = 0
    let pagos = 0

    // Obtener los valores del período más reciente para movimientos presupuestales filtrados por año
    if (yearFilteredMovimientos && yearFilteredMovimientos.length > 0) {
      // Encontrar el período más reciente en los datos filtrados por año
      const latestPeriod = yearFilteredMovimientos.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = yearFilteredMovimientos.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((movimiento: any) => {
        ppto_inicial += movimiento.ppto_inicial || 0
        ppto_modificado += movimiento.ppto_modificado || 0
        adiciones += movimiento.adiciones || 0
        reducciones += movimiento.reducciones || 0
      })
    }

    // Obtener los valores más recientes de ejecución y pagos filtrados por año
    if (yearFilteredEjecucion && yearFilteredEjecucion.length > 0) {
      // Encontrar el período más reciente en los datos filtrados por año
      const latestPeriod = yearFilteredEjecucion.reduce((latest, item) => {
        return item.periodo_corte > latest ? item.periodo_corte : latest
      }, '1900-01-01')
      
      // Filtrar solo los registros del período más reciente
      const latestPeriodData = yearFilteredEjecucion.filter(item => item.periodo_corte === latestPeriod)
      
      // Sumar todos los valores del período más reciente
      latestPeriodData.forEach((ejecucionItem: any) => {
        ejecucion += ejecucionItem.ejecucion || 0
        pagos += ejecucionItem.pagos || 0
      })
    }

    return {
      ppto_inicial,
      ppto_modificado, // Usar la suma correcta en lugar del máximo
      adiciones,
      reducciones,
      ejecucion,
      pagos
    }
  }, [yearFilteredMovimientos, yearFilteredEjecucion])



  // Colores para las líneas usando el nuevo sistema
  const lineColors = {
    ppto_modificado: CHART_COLORS[0], // Azul
    adiciones: CHART_COLORS[3],       // Naranja
    reducciones: CHART_COLORS[2],     // Rojo
    ejecucion: CHART_COLORS[4],       // Violeta
    pagos: CHART_COLORS[1]            // Verde
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          className={`${CSS_UTILS.card} p-3 shadow-lg border-0 min-w-[200px]`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={ANIMATIONS.slideUp.transition}
        >
          <p className={`${TYPOGRAPHY.h6} font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-gray-600 pb-1`}>
            {`Período: ${label}`}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-300 capitalize`}>
                    {entry.dataKey.replace('_', ' ')}
                  </span>
                </div>
                <span className={`${TYPOGRAPHY.bodySmall} font-semibold`} style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )
    }
    return null
  }

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      initial={ANIMATIONS.fadeIn.initial}
      animate={ANIMATIONS.fadeIn.animate}
      transition={ANIMATIONS.fadeIn.transition}
    >
      {/* Header responsivo */}
      <div className={`${CSS_UTILS.card} p-4 sm:p-6 border-l-4 border-l-blue-500`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${CATEGORIES.projects.className.accent} rounded-lg`}>
              <TrendingUp className={`w-5 h-5 ${CATEGORIES.projects.className.text}`} />
            </div>
            <div>
              <h2 className={`${TYPOGRAPHY.h4} font-bold text-gray-900 dark:text-white`}>
                Análisis Presupuestal
              </h2>
              <p className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-400`}>
                Evolución temporal del presupuesto municipal
              </p>
            </div>
          </div>
          
          {/* Controles responsivos */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Filtro de años */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400`}>Años:</span>
              <div className="flex gap-2">
                {availableYears.map((year) => (
                  <label key={year} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedYears(prev => [...prev, year])
                        } else {
                          setSelectedYears(prev => prev.filter(y => y !== year))
                        }
                      }}
                      className="w-3 h-3 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                    />
                    <span className={`${TYPOGRAPHY.caption} text-gray-700 dark:text-gray-300`}>{year}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Control de líneas visibles en móvil */}
            {isMobileView && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400`}>Líneas:</span>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(visibleLines).map(([key, visible]) => (
                    <button
                      key={key}
                      onClick={() => setVisibleLines(prev => ({ ...prev, [key]: !visible }))}
                      className={`p-1 rounded text-xs transition-colors ${
                        visible 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico principal responsivo */}
      <motion.div
        className={`${CSS_UTILS.card} overflow-hidden`}
        style={{ height: isMobileView ? '350px' : '450px' }}
        initial={ANIMATIONS.slideUp.initial}
        animate={ANIMATIONS.slideUp.animate}
        transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.1 }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className={`${TYPOGRAPHY.h5} font-semibold text-gray-900 dark:text-white`}>
              Evolución Presupuestal
            </h3>
            {!isMobileView && (
              <div className="flex items-center gap-2">
                {Object.entries(visibleLines).map(([key, visible]) => (
                  <button
                    key={key}
                    onClick={() => setVisibleLines(prev => ({ ...prev, [key]: !visible }))}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      visible 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span className="capitalize">{key.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 h-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={budgetLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: isMobileView ? 8 : 10, fill: '#6b7280' }}
                  className="dark:fill-gray-300"
                  angle={isMobileView ? -90 : -45}
                  textAnchor="end"
                  height={isMobileView ? 60 : 40}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  hide={isMobileView} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  className="dark:fill-gray-300"
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {visibleLines.ppto_modificado && (
                  <Line 
                    type="monotone" 
                    dataKey="ppto_modificado" 
                    stroke={lineColors.ppto_modificado} 
                    strokeWidth={2}
                    dot={{ r: isMobileView ? 2 : 3 }}
                    name="Presupuesto Actual"
                  />
                )}
                {visibleLines.adiciones && (
                  <Line 
                    type="monotone" 
                    dataKey="adiciones" 
                    stroke={lineColors.adiciones} 
                    strokeWidth={2}
                    dot={{ r: isMobileView ? 2 : 3 }}
                    name="Adiciones"
                  />
                )}
                {visibleLines.reducciones && (
                  <Line 
                    type="monotone" 
                    dataKey="reducciones" 
                    stroke={lineColors.reducciones} 
                    strokeWidth={2}
                    dot={{ r: isMobileView ? 2 : 3 }}
                    name="Reducciones"
                  />
                )}
                {visibleLines.ejecucion && (
                  <Line 
                    type="monotone" 
                    dataKey="ejecucion" 
                    stroke={lineColors.ejecucion} 
                    strokeWidth={2}
                    dot={{ r: isMobileView ? 2 : 3 }}
                    name="Ejecución"
                  />
                )}
                {visibleLines.pagos && (
                  <Line 
                    type="monotone" 
                    dataKey="pagos" 
                    stroke={lineColors.pagos} 
                    strokeWidth={2}
                    dot={{ r: isMobileView ? 2 : 3 }}
                    name="Pagos"
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={budgetLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-600 opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: isMobileView ? 8 : 10, fill: '#6b7280' }}
                  className="dark:fill-gray-300"
                  angle={isMobileView ? -90 : -45}
                  textAnchor="end"
                  height={isMobileView ? 60 : 40}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <YAxis 
                  hide={isMobileView} 
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  className="dark:fill-gray-300"
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={{ stroke: '#d1d5db' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {visibleLines.ppto_modificado && (
                  <Bar dataKey="ppto_modificado" fill={lineColors.ppto_modificado} name="Presupuesto Actual" />
                )}
                {visibleLines.adiciones && (
                  <Bar dataKey="adiciones" fill={lineColors.adiciones} name="Adiciones" />
                )}
                {visibleLines.reducciones && (
                  <Bar dataKey="reducciones" fill={lineColors.reducciones} name="Reducciones" />
                )}
                {visibleLines.ejecucion && (
                  <Bar dataKey="ejecucion" fill={lineColors.ejecucion} name="Ejecución" />
                )}
                {visibleLines.pagos && (
                  <Bar dataKey="pagos" fill={lineColors.pagos} name="Pagos" />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Métricas responsivas */}
      {showMetrics && (
        <motion.div
          initial={ANIMATIONS.slideUp.initial}
          animate={ANIMATIONS.slideUp.animate}
          transition={{ ...ANIMATIONS.slideUp.transition, delay: 0.2 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ResponsiveMetricCard
              title="Presupuesto Inicial"
              value={formatCurrency(budgetTotals.ppto_inicial)}
              icon={DollarSign}
              category="projects"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
            <ResponsiveMetricCard
              title="Presupuesto Actual"
              value={formatCurrency(budgetTotals.ppto_modificado)}
              icon={TrendingUp}
              category="projects"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
            <ResponsiveMetricCard
              title="Adiciones"
              value={formatCurrency(budgetTotals.adiciones)}
              icon={TrendingUp}
              category="products"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
            <ResponsiveMetricCard
              title="Reducciones"
              value={formatCurrency(budgetTotals.reducciones)}
              icon={TrendingUp}
              category="activities"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
            <ResponsiveMetricCard
              title="Ejecución"
              value={formatCurrency(budgetTotals.ejecucion)}
              icon={DollarSign}
              category="contracts"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
            <ResponsiveMetricCard
              title="Pagos"
              value={formatCurrency(budgetTotals.pagos)}
              icon={DollarSign}
              category="project_units"
              orientation={isMobileView ? 'vertical' : 'horizontal'}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default BudgetAnalysisChart
