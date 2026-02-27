'use client'

import React from 'react'
import {
  GitBranch,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Layers
} from 'lucide-react'

// Vista para Changelog (Historial de Cambios)
export const ChangelogView: React.FC<{ changes: any[] }> = ({ changes }) => {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'updated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'deleted': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  const renderChangeValue = (oldVal: any, newVal: any) => {
    if (typeof oldVal === 'object' || typeof newVal === 'object') {
      return (
        <div className="space-y-1">
          {oldVal && (
            <div className="flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 text-xs">Anterior:</span>
              <code className="text-xs bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded flex-1">
                {JSON.stringify(oldVal, null, 2)}
              </code>
            </div>
          )}
          {newVal && (
            <div className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 text-xs">Nuevo:</span>
              <code className="text-xs bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded flex-1">
                {JSON.stringify(newVal, null, 2)}
              </code>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <code className="text-xs bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-red-700 dark:text-red-300">
          {String(oldVal)}
        </code>
        <ArrowRight className="w-3 h-3 text-slate-400" />
        <code className="text-xs bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-green-700 dark:text-green-300">
          {String(newVal)}
        </code>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <div 
          key={change.id} 
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
        >
          {/* Header del cambio */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                {change.upid}
              </span>
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getActionColor(change.action)}`}>
                {change.action}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(change.timestamp).toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Información del reporte */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Reporte Anterior</p>
              <p className="font-mono text-slate-900 dark:text-white">
                {change.old_report_id}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-2">
              <p className="text-slate-600 dark:text-slate-400 mb-1">Reporte Nuevo</p>
              <p className="font-mono text-slate-900 dark:text-white">
                {change.new_report_id}
              </p>
            </div>
          </div>

          {/* Cambios detectados */}
          {change.changes && Object.keys(change.changes).length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Cambios Detectados ({Object.keys(change.changes).length})
              </h5>
              <div className="space-y-2">
                {Object.entries(change.changes).map(([field, values]: [string, any]) => (
                  <div key={field} className="bg-slate-50 dark:bg-slate-900 rounded p-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {renderChangeValue(values.old, values.new)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Vista para By Centro Gestor (Análisis por Centro)
export const ByCentroGestorView: React.FC<{ centros: any[] }> = ({ centros }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'GOOD': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'ACCEPTABLE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      case 'POOR': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      {centros.map((centro) => (
        <div 
          key={centro.id} 
          className={`bg-white dark:bg-slate-800 rounded-lg border-2 p-4 ${
            centro.requires_attention 
              ? 'border-red-300 dark:border-red-800' 
              : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          {/* Header del centro */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {centro.nombre_centro_gestor || 'Sin nombre'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(centro.status)}`}>
                  {centro.status}
                </span>
                {centro.requires_attention && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-3 h-3" />
                    Requiere Atención
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                centro.quality_score >= 80 ? 'text-green-600 dark:text-green-400' :
                centro.quality_score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {centro.quality_score}%
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Score de Calidad</p>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Registros</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {centro.total_records}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">Con Problemas</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {centro.records_with_issues}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Sin Problemas</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {centro.records_without_issues}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3">
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Tasa Error</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {centro.error_rate}%
              </p>
            </div>
          </div>

          {/* Distribución por Severidad */}
          {centro.severity_counts && Object.keys(centro.severity_counts).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Distribución por Severidad
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(centro.severity_counts).map(([severity, count]) => (
                  <div key={severity} className={`p-2 rounded border ${
                    severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' :
                    severity === 'HIGH' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' :
                    severity === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  }`}>
                    <p className="text-xs font-medium">{severity}</p>
                    <p className="text-lg font-bold">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribución por Dimensión */}
          {centro.dimension_counts && Object.keys(centro.dimension_counts).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Distribución por Dimensión ISO 19157
              </h4>
              <div className="space-y-2">
                {Object.entries(centro.dimension_counts).map(([dimension, count]) => {
                  const total = Object.values(centro.dimension_counts).reduce((a, b) => (a as number) + (b as number), 0) as number
                  const percentage = ((count as number) / total * 100).toFixed(1)
                  
                  return (
                    <div key={dimension}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-700 dark:text-slate-300">{dimension}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {count as number} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reglas más violadas */}
          {centro.top_violated_rules && centro.top_violated_rules.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Reglas Más Violadas (Top 5)
              </h4>
              <div className="space-y-1">
                {centro.top_violated_rules.slice(0, 5).map((rule: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <code className="text-xs font-mono text-slate-900 dark:text-white">
                      {rule.rule_id}
                    </code>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {rule.count} veces
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos más problemáticos */}
          {centro.top_problematic_fields && centro.top_problematic_fields.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Campos Más Problemáticos (Top 5)
              </h4>
              <div className="flex flex-wrap gap-2">
                {centro.top_problematic_fields.slice(0, 5).map((field: any, idx: number) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs">
                    <code className="font-mono text-orange-900 dark:text-orange-100">
                      {field.field}
                    </code>
                    <span className="font-semibold text-orange-700 dark:text-orange-300">
                      ({field.count})
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Muestra de registros afectados */}
          {centro.affected_records_sample && centro.affected_records_sample.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Muestra de Registros Afectados
              </h4>
              <div className="flex flex-wrap gap-1">
                {centro.affected_records_sample.slice(0, 10).map((upid: string, idx: number) => (
                  <code key={idx} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded font-mono">
                    {upid}
                  </code>
                ))}
                {centro.affected_records_sample.length > 10 && (
                  <span className="text-xs px-2 py-0.5 text-slate-600 dark:text-slate-400">
                    +{centro.affected_records_sample.length - 10} más
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Vista para Metadata (Configuración del Sistema)
export const MetadataView: React.FC<{ metadata: any[] }> = ({ metadata }) => {
  const latestMetadata = metadata[0] // Usar el más reciente

  const displayValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') {
      if ('label' in value && value.label) return String(value.label)
      if ('code' in value && value.code) return String(value.code)
      if ('name' in value && value.name) return String(value.name)
      return JSON.stringify(value)
    }
    return String(value)
  }

  if (!latestMetadata) {
    return (
      <div className="text-center py-8 text-slate-600 dark:text-slate-400">
        No hay metadata disponible
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Información General */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Información del Sistema
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Report ID</p>
            <p className="font-mono text-blue-900 dark:text-blue-100">{latestMetadata.report_id}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Versión</p>
            <p className="font-semibold text-blue-900 dark:text-blue-100">{latestMetadata.version}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Generado</p>
            <p className="text-blue-900 dark:text-blue-100">
              {new Date(latestMetadata.generated_at).toLocaleString('es-CO')}
            </p>
          </div>
        </div>
      </div>

      {/* Contadores Globales */}
      {latestMetadata.counts && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Contadores Globales
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Registros</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {latestMetadata.counts.total_records?.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Centros</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {latestMetadata.counts.total_centros}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-3">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">Total Problemas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {latestMetadata.counts.total_issues?.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3">
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Con Problemas</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {latestMetadata.counts.records_with_issues?.toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Centros Atención</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {latestMetadata.counts.centros_require_attention}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Disponibles */}
      {latestMetadata.filters && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros Disponibles en el Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestMetadata.filters.severities && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Severidades ({latestMetadata.filters.severities.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {latestMetadata.filters.severities.map((s: any, idx: number) => (
                    <span key={`${displayValue(s)}-${idx}`} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded">
                      {displayValue(s)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {latestMetadata.filters.priorities && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Prioridades ({latestMetadata.filters.priorities.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {latestMetadata.filters.priorities.map((p: any, idx: number) => (
                    <span key={`${displayValue(p)}-${idx}`} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded">
                      {displayValue(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {latestMetadata.filters.dimensions && (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Dimensiones ISO 19157 ({latestMetadata.filters.dimensions.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {latestMetadata.filters.dimensions.map((d: any, idx: number) => (
                    <span key={`${displayValue(d)}-${idx}`} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded border border-blue-200 dark:border-blue-800">
                      {displayValue(d)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {latestMetadata.filters.centros_gestores && (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Centros Gestores ({latestMetadata.filters.centros_gestores.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {latestMetadata.filters.centros_gestores.map((c: any, idx: number) => (
                    <div key={`${displayValue(c)}-${idx}`} className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded">
                      {displayValue(c)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rangos de Métricas */}
      {latestMetadata.ranges && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Rangos de Métricas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(latestMetadata.ranges).map(([metric, range]: [string, any]) => (
              <div key={metric} className="bg-slate-50 dark:bg-slate-900 rounded p-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Min:</span>
                    <span className="ml-1 font-semibold">{range.min}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Max:</span>
                    <span className="ml-1 font-semibold">{range.max}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Media:</span>
                    <span className="ml-1 font-semibold">{range.average?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Mediana:</span>
                    <span className="ml-1 font-semibold">{range.median}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
