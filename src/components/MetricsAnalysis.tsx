import React, { useMemo } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react'

export interface MetricData {
  location: string
  value: number
  count: number
  percentage: number
}

export interface MetricsAnalysisProps {
  metrics: MetricData[]
  metricType: 'presupuesto' | 'proyectos' | 'actividades'
  formatValue: (value: number, metricType: 'presupuesto' | 'proyectos' | 'actividades') => string
  maxValue: number
  activeColor: string
}

/**
 * Componente para análisis detallado de métricas en el panel lateral
 */
const MetricsAnalysis: React.FC<MetricsAnalysisProps> = ({
  metrics,
  metricType,
  formatValue,
  maxValue,
  activeColor
}) => {
  // Estadísticas calculadas
  const stats = useMemo(() => {
    if (metrics.length === 0) return null

    const totalValue = metrics.reduce((sum, m) => sum + m.value, 0)
    const totalCount = metrics.reduce((sum, m) => sum + m.count, 0)
    const avgValue = totalValue / metrics.length
    const areasWithData = metrics.filter(m => m.value > 0).length
    const coveragePercentage = (areasWithData / metrics.length) * 100

    // Top 3 áreas
    const top3 = metrics.slice(0, 3)

    return {
      totalValue,
      totalCount,
      avgValue,
      areasWithData,
      coveragePercentage,
      top3
    }
  }, [metrics])

  if (!stats) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        <Activity className="w-8 h-8 mx-auto mb-2" />
        <p>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatValue(stats.totalValue, metricType)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total acumulado
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.totalCount.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total de items
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {formatValue(stats.avgValue, metricType)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Promedio por área
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.coveragePercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Cobertura territorial
          </div>
        </div>
      </div>

      {/* Top 3 áreas */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top 3 Áreas
        </h4>
        <div className="space-y-3">
          {stats.top3.map((metric, index) => (
            <div key={metric.location} className="relative">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: activeColor }}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {metric.location}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.count} items
                </span>
              </div>
              
              <div className="text-sm font-bold mb-2" style={{ color: activeColor }}>
                {formatValue(metric.value, metricType)}
              </div>
              
              <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: activeColor,
                    width: `${(metric.value / maxValue) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por rangos */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <PieChart className="w-4 h-4" />
          Distribución por Rangos
        </h4>
        
        {(() => {
          const ranges = [
            { label: 'Alto', min: maxValue * 0.7, color: activeColor, opacity: 1 },
            { label: 'Medio', min: maxValue * 0.3, max: maxValue * 0.7, color: activeColor, opacity: 0.7 },
            { label: 'Bajo', min: 0, max: maxValue * 0.3, color: activeColor, opacity: 0.4 },
            { label: 'Sin datos', min: 0, max: 0, color: '#6B7280', opacity: 0.3 }
          ]

          const distribution = ranges.map(range => {
            let count = 0
            if (range.label === 'Sin datos') {
              count = metrics.filter(m => m.value === 0).length
            } else if (range.max) {
              count = metrics.filter(m => m.value >= range.min && m.value < range.max).length
            } else {
              count = metrics.filter(m => m.value >= range.min).length
            }
            
            return {
              ...range,
              count,
              percentage: (count / metrics.length) * 100
            }
          })

          return distribution.map((range, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ 
                    backgroundColor: range.color,
                    opacity: range.opacity
                  }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {range.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {range.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {range.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))
        })()}
      </div>

      {/* Lista completa - scroll */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Ranking Completo
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {metrics.map((metric, index) => (
            <div key={metric.location} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {index + 1}. {metric.location}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.count}
                </span>
              </div>
              <div className="text-xs font-semibold" style={{ color: activeColor }}>
                {formatValue(metric.value, metricType)}
              </div>
              <div className="mt-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: activeColor,
                    width: `${(metric.value / maxValue) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MetricsAnalysis
