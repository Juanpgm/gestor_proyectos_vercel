'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar, 
  Filter, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  Info
} from 'lucide-react'
import { useDataContext } from '../context/DataContext'
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency'
import { CHART_COLORS } from '@/lib/design-system'

interface ModernBudgetAnalysisProps {
  className?: string
  showControls?: boolean
  height?: string
}

type ChartType = 'area' | 'bar' | 'line' | 'composed' | 'pie'
type TimeRange = 'all' | '2024' | '2025' | 'last6months'

const ModernBudgetAnalysis: React.FC<ModernBudgetAnalysisProps> = ({
  className = '',
  showControls = true,
  height = '600px'
}) => {
  const { filteredMovimientosPresupuestales, filteredEjecucionPresupuestal } = useDataContext()
  
  const [chartType, setChartType] = useState<ChartType>('area')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  // Procesar datos según el rango de tiempo seleccionado
  const processedData = useMemo(() => {
    if (!filteredMovimientosPresupuestales || !filteredEjecucionPresupuestal) return []

    // Filtrar por rango de tiempo
    const filterByTime = (data: any[]) => {
      if (timeRange === 'all') return data
      
      const now = new Date()
      const cutoffDate = new Date()
      
      switch (timeRange) {
        case '2024':
          return data.filter(item => item.periodo_corte?.startsWith('2024'))
        case '2025':
          return data.filter(item => item.periodo_corte?.startsWith('2025'))
        case 'last6months':
          cutoffDate.setMonth(now.getMonth() - 6)
          return data.filter(item => {
            const itemDate = new Date(item.periodo_corte)
            return itemDate >= cutoffDate
          })
        default:
          return data
      }
    }

    const filteredMovimientos = filterByTime(filteredMovimientosPresupuestales)
    const filteredEjecucion = filterByTime(filteredEjecucionPresupuestal)

    // Agrupar por período
    const periodTotals: { [key: string]: any } = {}
    
    filteredMovimientos.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || ''
      
      if (!periodTotals[period]) {
        periodTotals[period] = {
          period,
          name: period,
          presupuesto: 0,
          adiciones: 0,
          reducciones: 0,
          modificado: 0,
          ejecucion: 0,
          pagos: 0,
          saldo: 0
        }
      }

      periodTotals[period].presupuesto += item.ppto_inicial || 0
      periodTotals[period].adiciones += item.adiciones || 0
      periodTotals[period].reducciones += item.reducciones || 0
      periodTotals[period].modificado += item.ppto_modificado || 0
    })

    filteredEjecucion.forEach((item: any) => {
      const period = item.periodo_corte?.substring(0, 7) || ''
      
      if (periodTotals[period]) {
        periodTotals[period].ejecucion += item.ejecucion || 0
        periodTotals[period].pagos += item.pagos || 0
      }
    })

    // Calcular saldos y eficiencia
    Object.values(periodTotals).forEach((period: any) => {
      period.saldo = period.modificado - period.ejecucion
      period.eficiencia = period.modificado > 0 ? (period.ejecucion / period.modificado) * 100 : 0
      period.liquidez = period.ejecucion > 0 ? (period.pagos / period.ejecucion) * 100 : 0
    })

    return Object.values(periodTotals).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }, [filteredMovimientosPresupuestales, filteredEjecucionPresupuestal, timeRange])

  // Calcular métricas totales
  const totalMetrics = useMemo(() => {
    if (processedData.length === 0) {
      return {
        totalPresupuesto: 0,
        totalModificado: 0,
        totalEjecucion: 0,
        totalPagos: 0,
        totalSaldo: 0,
        eficienciaPromedio: 0,
        liquidezPromedio: 0,
        variacionPresupuestal: 0
      }
    }

    const latest = processedData[processedData.length - 1] as any
    const totals = processedData.reduce((acc: any, period: any) => ({
      totalPresupuesto: Math.max(acc.totalPresupuesto, period.presupuesto),
      totalModificado: Math.max(acc.totalModificado, period.modificado),
      totalEjecucion: Math.max(acc.totalEjecucion, period.ejecucion),
      totalPagos: Math.max(acc.totalPagos, period.pagos),
      totalSaldo: latest.saldo,
      eficienciaPromedio: acc.eficienciaPromedio + period.eficiencia,
      liquidezPromedio: acc.liquidezPromedio + period.liquidez,
      variacionPresupuestal: 0
    }), {
      totalPresupuesto: 0,
      totalModificado: 0,
      totalEjecucion: 0,
      totalPagos: 0,
      totalSaldo: 0,
      eficienciaPromedio: 0,
      liquidezPromedio: 0,
      variacionPresupuestal: 0
    })

    totals.eficienciaPromedio = totals.eficienciaPromedio / processedData.length
    totals.liquidezPromedio = totals.liquidezPromedio / processedData.length
    totals.variacionPresupuestal = totals.totalPresupuesto > 0 
      ? ((totals.totalModificado - totals.totalPresupuesto) / totals.totalPresupuesto) * 100 
      : 0

    return totals
  }, [processedData])

  // Datos para gráfico de torta
  const pieData = useMemo(() => {
    return [
      { name: 'Ejecutado', value: totalMetrics.totalEjecucion, color: CHART_COLORS[1] },
      { name: 'Pagado', value: totalMetrics.totalPagos, color: CHART_COLORS[3] },
      { name: 'Saldo', value: Math.max(0, totalMetrics.totalSaldo), color: CHART_COLORS[0] }
    ].filter(item => item.value > 0)
  }, [totalMetrics])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="font-semibold text-gray-900 dark:text-white mb-2 border-b border-gray-200 dark:border-gray-600 pb-1">
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
                  <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                    {entry.dataKey === 'modificado' ? 'Presupuesto' : 
                     entry.dataKey === 'ejecucion' ? 'Ejecutado' :
                     entry.dataKey === 'pagos' ? 'Pagado' :
                     entry.dataKey}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: entry.color }}>
                  {formatCurrencyCompact(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )
    }
    return null
  }

  const MetricCard: React.FC<{
    title: string
    value: number | string
    subtitle?: string
    icon: React.ElementType
    trend?: 'up' | 'down' | 'neutral'
    color: string
    onClick?: () => void
    isSelected?: boolean
  }> = ({ title, value, subtitle, icon: Icon, trend, color, onClick, isSelected }) => (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-lg shadow-blue-500/25' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.includes('blue') ? 'text-blue-600' :
                               color.includes('green') ? 'text-green-600' :
                               color.includes('orange') ? 'text-orange-600' :
                               color.includes('purple') ? 'text-purple-600' :
                               'text-gray-600'}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-100 text-green-700' :
              trend === 'down' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend === 'neutral' && <Minus className="w-3 h-3" />}
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {typeof value === 'number' ? formatCurrencyCompact(value) : value}
        </h3>
        
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {title}
        </p>
        
        {subtitle && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )

  const chartTypes = [
    { id: 'area', name: 'Área', icon: Activity },
    { id: 'bar', name: 'Barras', icon: BarChart3 },
    { id: 'line', name: 'Líneas', icon: TrendingUp },
    { id: 'composed', name: 'Combinado', icon: Zap },
    { id: 'pie', name: 'Torta', icon: PieChartIcon }
  ]

  const timeRanges = [
    { id: 'all', name: 'Todo' },
    { id: '2024', name: '2024' },
    { id: '2025', name: '2025' },
    { id: 'last6months', name: '6 meses' }
  ]

  const renderChart = (): React.ReactElement => {
    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    }

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="presupuesto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="ejecucion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[1]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS[1]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="modificado" stroke={CHART_COLORS[0]} fillOpacity={1} fill="url(#presupuesto)" strokeWidth={2} />
            <Area type="monotone" dataKey="ejecucion" stroke={CHART_COLORS[1]} fillOpacity={1} fill="url(#ejecucion)" strokeWidth={2} />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="modificado" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="ejecucion" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="pagos" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
          </BarChart>
        )

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="modificado" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="ejecucion" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="pagos" stroke={CHART_COLORS[3]} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        )

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="modificado" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="ejecucion" stroke={CHART_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="pagos" stroke={CHART_COLORS[3]} strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [formatCurrencyCompact(value), '']}
            />
          </PieChart>
        )

      default:
        // Fallback: devolver un gráfico de área básico
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="modificado" stroke={CHART_COLORS[0]} fillOpacity={0.3} fill={CHART_COLORS[0]} strokeWidth={2} />
          </AreaChart>
        )
    }
  }

  return (
    <motion.div 
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header con controles modernos */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análisis Presupuestal
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Monitoreo financiero integral y tendencias del presupuesto municipal
              </p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Selector de tipo de gráfico */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {chartTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setChartType(type.id as ChartType)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      chartType === type.id
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{type.name}</span>
                  </button>
                ))}
              </div>

              {/* Selector de rango de tiempo */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {timeRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setTimeRange(range.id as TimeRange)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      timeRange === range.id
                        ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Presupuesto Total"
          value={totalMetrics.totalModificado}
          subtitle="Modificado vigente"
          icon={DollarSign}
          trend="neutral"
          color="from-blue-500 to-blue-600"
          onClick={() => setSelectedMetric(selectedMetric === 'presupuesto' ? null : 'presupuesto')}
          isSelected={selectedMetric === 'presupuesto'}
        />
        
        <MetricCard
          title="Ejecutado"
          value={totalMetrics.totalEjecucion}
          subtitle={`${totalMetrics.eficienciaPromedio.toFixed(1)}% de eficiencia`}
          icon={Target}
          trend={totalMetrics.eficienciaPromedio > 70 ? 'up' : totalMetrics.eficienciaPromedio > 40 ? 'neutral' : 'down'}
          color="from-green-500 to-green-600"
          onClick={() => setSelectedMetric(selectedMetric === 'ejecucion' ? null : 'ejecucion')}
          isSelected={selectedMetric === 'ejecucion'}
        />
        
        <MetricCard
          title="Pagos"
          value={totalMetrics.totalPagos}
          subtitle={`${totalMetrics.liquidezPromedio.toFixed(1)}% de liquidez`}
          icon={Activity}
          trend={totalMetrics.liquidezPromedio > 80 ? 'up' : totalMetrics.liquidezPromedio > 50 ? 'neutral' : 'down'}
          color="from-orange-500 to-orange-600"
          onClick={() => setSelectedMetric(selectedMetric === 'pagos' ? null : 'pagos')}
          isSelected={selectedMetric === 'pagos'}
        />
        
        <MetricCard
          title="Saldo"
          value={totalMetrics.totalSaldo}
          subtitle="Disponible para ejecutar"
          icon={Zap}
          trend="neutral"
          color="from-purple-500 to-purple-600"
          onClick={() => setSelectedMetric(selectedMetric === 'saldo' ? null : 'saldo')}
          isSelected={selectedMetric === 'saldo'}
        />
      </div>

      {/* Gráfico principal */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Evolución Presupuestal {timeRange !== 'all' && `- ${timeRanges.find(r => r.id === timeRange)?.name}`}
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <Info className="w-4 h-4" />
              Detalles
              <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div style={{ height }} className="p-6">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Resumen Financiero</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Eficiencia promedio:</span>
                      <span className="font-medium">{totalMetrics.eficienciaPromedio.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Liquidez promedio:</span>
                      <span className="font-medium">{totalMetrics.liquidezPromedio.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Variación presupuestal:</span>
                      <span className={`font-medium ${totalMetrics.variacionPresupuestal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalMetrics.variacionPresupuestal.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Período de Análisis</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Períodos incluidos:</span>
                      <span className="font-medium">{processedData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tipo de visualización:</span>
                      <span className="font-medium capitalize">{chartTypes.find(t => t.id === chartType)?.name}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Últimos Datos</h4>
                  <div className="space-y-1 text-sm">
                    {processedData.length > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Último período:</span>
                          <span className="font-medium">{processedData[processedData.length - 1]?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Actualizado:</span>
                          <span className="font-medium">Tiempo real</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default ModernBudgetAnalysis
