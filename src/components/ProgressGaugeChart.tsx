'use client'

import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Activity } from 'lucide-react'

interface ProgressGaugeChartProps {
  data: any[]
  className?: string
  showStates?: boolean
}

// Colores para los estados
const STATE_COLORS = {
  'En Ejecución': '#10B981',     // Verde
  'Completado': '#059669',       // Verde oscuro
  'Planificación': '#3B82F6',    // Azul
  'Suspendido': '#EF4444',       // Rojo
  'En Evaluación': '#F59E0B'     // Amarillo
}

// Colores para el gauge de progreso
const PROGRESS_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#059669']

const ProgressGaugeChart: React.FC<ProgressGaugeChartProps> = ({ 
  data, 
  className = '',
  showStates = true 
}) => {
  
  // Calcular métricas de progreso
  const progressMetrics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        averageProgress: 0,
        totalProjects: 0,
        progressRanges: [],
        statusCounts: []
      }
    }

    // Calcular progreso promedio - usar campo progress que ya viene en porcentaje
    const validProgress = data.filter(item => typeof item.progress === 'number' && item.progress >= 0 && item.progress <= 100)
    const averageProgress = validProgress.length > 0 
      ? validProgress.reduce((sum, item) => sum + item.progress, 0) / validProgress.length 
      : 0

    // Agrupar por rangos de progreso
    const progressRanges = [
      { name: '0-25%', count: 0, color: PROGRESS_COLORS[0] },
      { name: '26-50%', count: 0, color: PROGRESS_COLORS[1] },
      { name: '51-75%', count: 0, color: PROGRESS_COLORS[2] },
      { name: '76-100%', count: 0, color: PROGRESS_COLORS[3] }
    ]

    validProgress.forEach(item => {
      const progress = item.progress
      if (progress <= 25) progressRanges[0].count++
      else if (progress <= 50) progressRanges[1].count++
      else if (progress <= 75) progressRanges[2].count++
      else progressRanges[3].count++
    })

    // Contar por estados usando el campo status que ya está mapeado
    const statusMap = new Map<string, number>()
    data.forEach(item => {
      if (item.status) {
        statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1)
      }
    })

    const statusCounts = Array.from(statusMap.entries()).map(([status, count]) => ({
      name: status,
      count,
      color: STATE_COLORS[status as keyof typeof STATE_COLORS] || '#6B7280'
    })).filter(item => item.count > 0)

    return {
      averageProgress: Math.round(averageProgress),
      totalProjects: data.length,
      progressRanges: progressRanges.filter(range => range.count > 0),
      statusCounts
    }
  }, [data])

  // Datos para el gauge principal
  const gaugeData = useMemo(() => {
    const progress = progressMetrics.averageProgress
    const remaining = 100 - progress
    
    return [
      { name: 'Completado', value: progress, color: progress >= 75 ? '#059669' : progress >= 50 ? '#10B981' : progress >= 25 ? '#F59E0B' : '#EF4444' },
      { name: 'Pendiente', value: remaining, color: '#E5E7EB' }
    ]
  }, [progressMetrics.averageProgress])

  // Función para obtener el color del progreso
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#059669'
    if (progress >= 50) return '#10B981'
    if (progress >= 25) return '#F59E0B'
    return '#EF4444'
  }

  // Función para obtener el icono del progreso
  const getProgressIcon = (progress: number) => {
    if (progress >= 75) return <CheckCircle className="w-4 h-4" />
    if (progress >= 50) return <TrendingUp className="w-4 h-4" />
    if (progress >= 25) return <Activity className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  // Tooltip personalizado para el gauge
  const GaugeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      if (data.name === 'Pendiente') return null
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">
            Progreso Promedio: {data.value}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progressMetrics.totalProjects} proyectos
          </p>
        </div>
      )
    }
    return null
  }

  // Tooltip para estados
  const StateTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.count} proyecto{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  if (progressMetrics.totalProjects === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 ${className}`}>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay datos disponibles</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 space-y-3 ${className}`}>
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          {getProgressIcon(progressMetrics.averageProgress)}
          Progreso de Obras
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {progressMetrics.totalProjects} proyectos
        </span>
      </div>

      {/* Gauge principal - Progreso promedio */}
      <div className="relative">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<GaugeTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Valor central del gauge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center mt-6">
            <div 
              className="text-4xl font-bold"
              style={{ color: getProgressColor(progressMetrics.averageProgress) }}
            >
              {progressMetrics.averageProgress}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Promedio
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por rangos de progreso */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">Distribución</h4>
        <div className="grid grid-cols-2 gap-1">
          {progressMetrics.progressRanges.map((range, index) => (
            <div 
              key={range.name}
              className="flex items-center justify-between p-2 rounded"
              style={{ backgroundColor: `${range.color}15` }}
            >
              <span className="text-xs font-medium" style={{ color: range.color }}>
                {range.name}
              </span>
              <span className="text-xs font-bold text-gray-800 dark:text-white">
                {range.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Estados de proyectos comprimidos */}
      {showStates && progressMetrics.statusCounts.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Estados
          </h4>
          
          {/* Mini chart de estados */}
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressMetrics.statusCounts} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={30}
                  interval={0}
                />
                <YAxis hide />
                <Tooltip content={<StateTooltip />} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {progressMetrics.statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista compacta de estados */}
          <div className="grid grid-cols-1 gap-1">
            {progressMetrics.statusCounts.slice(0, 3).map((state) => (
              <div key={state.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: state.color }}
                  />
                  <span className="text-gray-600 dark:text-gray-400 truncate">
                    {state.name}
                  </span>
                </div>
                <span className="font-medium text-gray-800 dark:text-white">
                  {state.count}
                </span>
              </div>
            ))}
            {progressMetrics.statusCounts.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{progressMetrics.statusCounts.length - 3} más...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressGaugeChart
