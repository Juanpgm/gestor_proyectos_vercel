'use client'

import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Tag,
  MapPin,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  Minus,
  GitCompare,
  Calendar
} from 'lucide-react'

// Interfaces para comparación (ajustadas a la estructura real de la API)
interface ChangeMetric {
  previous: number
  value: number
  change: number
  change_percentage: number
  trend: 'improving' | 'stable' | 'worsening'
}

interface SeverityChange {
  previous: number
  value: number
  change: number
  change_percentage: number
  trend: 'improving' | 'stable' | 'worsening'
}

interface ComparisonWithPreviousData {
  has_previous: boolean
  previous_timestamp: string
  previous_report_id: string
  changes: {
    quality_score: ChangeMetric
    total_issues: ChangeMetric
    records_with_issues: ChangeMetric
    error_rate: ChangeMetric
    total_records: ChangeMetric
    centros_require_attention: ChangeMetric
  }
  severity_changes: {
    CRITICAL: SeverityChange
    HIGH: SeverityChange
    MEDIUM: SeverityChange
    LOW: SeverityChange
    INFO?: SeverityChange
  }
}

interface TrendsSummary {
  [key: string]: {
    trend: string
    change: number
    change_percentage: number
  }
}

interface TrendsCount {
  improving: number
  stable: number
  worsening: number
}

// Props extendidas para incluir datos de tendencia a nivel raíz
interface SummaryDataWithTrends {
  comparison_with_previous?: ComparisonWithPreviousData
  overall_trend?: 'improving' | 'stable' | 'worsening'
  trends_summary?: TrendsSummary
  trends_count?: TrendsCount
  has_comparison_data?: boolean
}

// Componente de Comparación con Reporte Anterior
const ComparisonWithPrevious: React.FC<{ 
  comparison: ComparisonWithPreviousData
  overallTrend?: string
  trendsCount?: TrendsCount
}> = ({ comparison, overallTrend, trendsCount }) => {
  
  const getTrendIcon = (trend: string, isPositiveGood: boolean = true) => {
    if (trend === 'improving') {
      return isPositiveGood 
        ? <ArrowUp className="w-4 h-4 text-green-500" />
        : <ArrowUp className="w-4 h-4 text-red-500" />
    } else if (trend === 'worsening') {
      return isPositiveGood 
        ? <ArrowDown className="w-4 h-4 text-red-500" />
        : <ArrowDown className="w-4 h-4 text-green-500" />
    }
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getTrendColor = (trend: string, isPositiveGood: boolean = true) => {
    if (trend === 'improving') {
      return isPositiveGood 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    } else if (trend === 'worsening') {
      return isPositiveGood 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-green-600 dark:text-green-400'
    }
    return 'text-slate-500 dark:text-slate-400'
  }

  const getOverallTrendConfig = (trend: string | undefined) => {
    switch (trend) {
      case 'improving':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          label: 'Mejorando'
        }
      case 'worsening':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          label: 'Empeorando'
        }
      default:
        return {
          icon: <Minus className="w-5 h-5" />,
          color: 'text-slate-600 dark:text-slate-400',
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          borderColor: 'border-slate-200 dark:border-slate-700',
          label: 'Estable'
        }
    }
  }

  const formatChange = (change: number, suffix: string = '', showSign: boolean = true) => {
    if (change === 0) return `0${suffix}`
    const sign = showSign && change > 0 ? '+' : ''
    return `${sign}${change.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  if (!comparison.has_previous) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-dashed border-slate-300 dark:border-slate-600">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <GitCompare className="w-5 h-5" />
          <span className="text-sm">Este es el primer reporte. No hay datos de comparación disponibles.</span>
        </div>
      </div>
    )
  }

  const overallConfig = getOverallTrendConfig(overallTrend)
  const changes = comparison.changes

  const metrics = [
    {
      label: 'Score de Calidad',
      data: changes.quality_score,
      suffix: '%',
      isPositiveGood: true // Mayor score es mejor
    },
    {
      label: 'Total de Problemas',
      data: changes.total_issues,
      suffix: '',
      isPositiveGood: false // Menos problemas es mejor
    },
    {
      label: 'Registros con Problemas',
      data: changes.records_with_issues,
      suffix: '',
      isPositiveGood: false // Menos registros con problemas es mejor
    },
    {
      label: 'Tasa de Error',
      data: changes.error_rate,
      suffix: '%',
      isPositiveGood: false // Menor tasa de error es mejor
    },
    {
      label: 'Total de Registros',
      data: changes.total_records,
      suffix: '',
      isPositiveGood: true // Más registros validados es mejor (más cobertura)
    },
    {
      label: 'Centros que Requieren Atención',
      data: changes.centros_require_attention,
      suffix: '',
      isPositiveGood: false // Menos centros con problemas es mejor
    }
  ]

  return (
    <div className={`rounded-lg p-4 border-2 ${overallConfig.bgColor} ${overallConfig.borderColor}`}>
      {/* Header con tendencia general */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Comparación con Reporte Anterior
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {/* Contador de tendencias */}
          {trendsCount && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {trendsCount.improving}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Minus className="w-3.5 h-3.5" />
                {trendsCount.stable}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="w-3.5 h-3.5" />
                {trendsCount.worsening}
              </span>
            </div>
          )}
          {/* Badge de tendencia general */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${overallConfig.bgColor} border ${overallConfig.borderColor}`}>
            <span className={overallConfig.color}>{overallConfig.icon}</span>
            <span className={`text-sm font-semibold ${overallConfig.color}`}>
              {overallConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Info del reporte anterior */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Reporte anterior: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">{comparison.previous_report_id}</code></span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(comparison.previous_timestamp).toLocaleString('es-CO')}</span>
        </div>
      </div>

      {/* Grid de métricas comparativas */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {metrics.map((metric, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
          >
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{metric.label}</p>
            
            {/* Valores anterior vs actual */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-center flex-1">
                <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">Anterior</p>
                <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
                  {metric.data?.previous?.toLocaleString(undefined, { maximumFractionDigits: 2 })}{metric.suffix}
                </p>
              </div>
              <div className="text-slate-300 dark:text-slate-600 px-1">→</div>
              <div className="text-center flex-1">
                <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">Actual</p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {metric.data?.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}{metric.suffix}
                </p>
              </div>
            </div>

            {/* Cambio */}
            <div className={`flex items-center justify-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700 ${getTrendColor(metric.data?.trend, metric.isPositiveGood)}`}>
              {getTrendIcon(metric.data?.trend, metric.isPositiveGood)}
              <span className="text-sm font-semibold">
                {formatChange(metric.data?.change || 0, metric.suffix)}
              </span>
              {metric.data?.change_percentage !== 0 && (
                <span className="text-xs opacity-75">
                  ({formatChange(metric.data?.change_percentage || 0, '%')})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cambios por Severidad */}
      {comparison.severity_changes && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Cambios por Severidad
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(comparison.severity_changes)
              .filter(([key]) => key !== 'INFO')
              .map(([severity, data]) => (
                <div key={severity} className={`p-2 rounded-lg border ${getSeverityColor(severity)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{severity}</span>
                    <span className={`text-xs ${getTrendColor(data.trend, false)}`}>
                      {getTrendIcon(data.trend, false)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{data.value.toLocaleString()}</span>
                    {data.change !== 0 && (
                      <span className={`text-xs ${getTrendColor(data.trend, false)}`}>
                        ({formatChange(data.change)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Vista para Summary (Resumen Ejecutivo)
export const SummaryView: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400'
      case 'WARNING': return 'text-orange-600 dark:text-orange-400'
      case 'NORMAL': return 'text-green-600 dark:text-green-400'
      default: return 'text-slate-600 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-4">
      {/* Estado del Sistema */}
      <div className={`p-4 rounded-lg border-2 ${
        data.system_status === 'CRITICAL' 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800'
      }`}>
        <div className="flex items-start gap-3">
          {data.system_status === 'CRITICAL' ? (
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${getStatusColor(data.system_status)}`}>
              Estado del Sistema: {data.system_status}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {data.requires_immediate_action 
                ? '⚠️ Requiere atención inmediata' 
                : '✓ Sistema operando normalmente'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Reporte: {data.report_id} | {new Date(data.report_timestamp).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Score Global</p>
          <p className={`text-3xl font-bold ${
            data.global_quality_score >= 80 ? 'text-green-600 dark:text-green-400' :
            data.global_quality_score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {data.global_quality_score}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Tasa de Error</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {data.error_rate}%
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Registros Validados</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {data.total_records_validated?.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Problemas Encontrados</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {data.total_issues_found?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Comparación con Reporte Anterior */}
      {data.comparison_with_previous ? (
        <ComparisonWithPrevious 
          comparison={data.comparison_with_previous} 
          overallTrend={data.overall_trend}
          trendsCount={data.trends_count}
        />
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-dashed border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <GitCompare className="w-5 h-5" />
            <span className="text-sm">No hay datos de comparación con reporte anterior disponibles</span>
          </div>
        </div>
      )}

      {/* Distribución por Severidad */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Distribución por Severidad
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data.severity_distribution || {}).map(([severity, count]) => (
            <div key={severity} className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}>
              <p className="text-xs font-medium mb-1">{severity}</p>
              <p className="text-2xl font-bold">{(count as number).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribución por Dimensión ISO 19157 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Distribución por Dimensión (ISO 19157)
        </h3>
        <div className="space-y-2">
          {Object.entries(data.dimension_distribution || {}).map(([dimension, count]) => {
            const total = Object.values(data.dimension_distribution || {}).reduce((a, b) => (a as number) + (b as number), 0) as number
            const percentage = ((count as number) / total * 100).toFixed(1)
            
            return (
              <div key={dimension}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700 dark:text-slate-300">{dimension}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {(count as number).toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Centros con Mejor Calidad */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Centros con Mejor Calidad (Top 5)
        </h3>
        <div className="space-y-2">
          {data.top_quality_centros?.slice(0, 5).map((centro: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {centro.nombre || 'Sin nombre'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {centro.issues} problema{centro.issues !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {centro.quality_score}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Error: {centro.error_rate}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Centros Problemáticos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          Centros que Requieren Atención (Top 5)
        </h3>
        <div className="space-y-2">
          {data.top_problematic_centros?.slice(0, 5).map((centro: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {centro.nombre || 'Sin nombre'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {centro.issues} problema{centro.issues !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {centro.quality_score}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Error: {centro.error_rate}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendaciones */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Recomendaciones
          </h3>
          <div className="space-y-2">
            {data.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="flex gap-2">
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                  rec.priority === 'URGENT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {rec.priority}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    {rec.category}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                    {rec.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Vista para Records (Registros Detallados)
export const RecordsView: React.FC<{ records: any[] }> = ({ records }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <XCircle className="w-4 h-4" />
      case 'HIGH': return <AlertTriangle className="w-4 h-4" />
      case 'MEDIUM': return <AlertCircle className="w-4 h-4" />
      case 'LOW': return <CheckCircle2 className="w-4 h-4" />
      default: return null
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const [expandedRecords, setExpandedRecords] = React.useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecords)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRecords(newExpanded)
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const isExpanded = expandedRecords.has(record.id)
        
        return (
          <div 
            key={record.id} 
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header del registro */}
            <div 
              className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              onClick={() => toggleExpand(record.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {record.upid}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${getSeverityColor(record.max_severity)}`}>
                      {getSeverityIcon(record.max_severity)}
                      {record.max_severity}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      record.priority === 'P0' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      record.priority === 'P1' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      record.priority === 'P2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {record.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {record.nombre_up}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {record.nombre_centro_gestor}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {record.total_issues}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    problema{record.total_issues !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Resumen de dimensiones afectadas */}
              {record.dimension_counts && Object.keys(record.dimension_counts).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(record.dimension_counts).map(([dim, count]) => (
                    <span key={dim} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                      {dim}: {count as number}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Detalles expandidos */}
            {isExpanded && record.issues && record.issues.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
                <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Problemas Detectados ({record.issues.length})
                </h5>
                <div className="space-y-3">
                  {record.issues.map((issue: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(issue.severity)}
                          <span className="text-xs font-semibold">
                            {issue.rule_id}: {issue.rule_name}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-white/50 dark:bg-black/20 rounded">
                          {issue.dimension}
                        </span>
                      </div>
                      <p className="text-xs mb-2">{issue.details}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-semibold">Campo:</span> {issue.field_name}
                        </div>
                        <div>
                          <span className="font-semibold">Valor actual:</span>{' '}
                          <code className="bg-white/50 dark:bg-black/20 px-1 rounded">
                            {JSON.stringify(issue.current_value)}
                          </code>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-semibold">Sugerencia:</span> {issue.suggestion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Vista para Stats (Estadísticas)
export const StatsView: React.FC<{ data: any }> = ({ data }) => {
  if (!data || !data.data) return null

  const collections = Object.entries(data.data)

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            Timestamp del Sistema
          </h3>
        </div>
        <p className="text-lg font-mono text-blue-700 dark:text-blue-300">
          {new Date(data.timestamp).toLocaleString('es-CO')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(([key, value]: [string, any]) => (
          <div key={key} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Colección</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {value.count.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 truncate">
              {value.collection}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Resumen Total
        </h3>
        <div className="text-center">
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {collections.reduce((sum, [_, value]: [string, any]) => sum + value.count, 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total de documentos en todas las colecciones
          </p>
        </div>
      </div>
    </div>
  )
}
