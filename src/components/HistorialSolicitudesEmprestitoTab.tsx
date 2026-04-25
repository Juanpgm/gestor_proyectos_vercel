'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  ChevronDown,
  ChevronRight,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { fetchSolicitudesCambiosEmprestito } from '@/services/emprestito-gestion.service'
import type { SolicitudCambioEmprestito } from '@/types/gestion-emprestito'
import { EMPRESTITO_ENTITY_LABELS } from '@/types/gestion-emprestito'

// ── Helpers ──────────────────────────────────────────────────────

const estadoBadge = (estado: string | null) => {
  switch (estado) {
    case 'aprobada':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'rechazada':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
}

const tipoBadge = (tipo: string) => {
  const colors: Record<string, string> = {
    contrato: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    proceso: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    rpc: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pago: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    convenio: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  }
  return colors[tipo] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
}

const formatRequestedValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value.trim() || '—'
  if (typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

// ── Props ────────────────────────────────────────────────────────

interface Props {
  /* sin props requeridos por ahora */
}

// ── Componente principal ─────────────────────────────────────────

export default function HistorialSolicitudesEmprestitoTab(_props: Props) {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambioEmprestito[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterEstado, setFilterEstado] = useState<string>('todos')

  const cargarHistorial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSolicitudesCambiosEmprestito()
      // Solo solicitudes ya procesadas
      setSolicitudes(
        data.filter((s) => s.estado_decision && s.estado_decision !== 'pendiente')
      )
    } catch (err: any) {
      setError(err.message || 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarHistorial()
  }, [cargarHistorial])

  // Filtrado
  const filtered = solicitudes.filter((s) => {
    if (filterTipo !== 'todos' && s.tipo !== filterTipo) return false
    if (filterEstado !== 'todos' && s.estado_decision !== filterEstado) return false
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const match =
        s.referencia.toLowerCase().includes(term) ||
        s.nombre_centro_gestor.toLowerCase().includes(term) ||
        s.solicitado_por.toLowerCase().includes(term) ||
        s.justificacion.toLowerCase().includes(term)
      if (!match) return false
    }
    return true
  })

  // Ordenar por fecha más reciente
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Historial de Solicitudes
          </h3>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={cargarHistorial}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por referencia, centro gestor, usuario..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3 h-3" />
            Tipo:
          </div>
          {['todos', 'contrato', 'proceso', 'rpc', 'pago', 'convenio'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                filterTipo === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t === 'todos' ? 'Todos' : EMPRESTITO_ENTITY_LABELS[t as keyof typeof EMPRESTITO_ENTITY_LABELS] || t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            Estado:
          </div>
          {['todos', 'aprobada', 'rechazada'].map((e) => (
            <button
              key={e}
              onClick={() => setFilterEstado(e)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                filterEstado === e
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {e === 'todos' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Listado */}
      {!loading && !error && (
        <div className="space-y-2">
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Sin historial</p>
              <p className="text-sm mt-1">No se encontraron solicitudes procesadas</p>
            </div>
          ) : (
            sorted.map((sol) => {
              const isExpanded = expandedId === sol.id
              return (
                <div
                  key={sol.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${tipoBadge(sol.tipo)}`}>
                            {EMPRESTITO_ENTITY_LABELS[sol.tipo] || sol.tipo}
                          </span>
                          <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                            {sol.referencia}
                          </span>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${estadoBadge(sol.estado_decision)}`}>
                            {sol.estado_decision || 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sol.nombre_centro_gestor} · {sol.solicitado_por} · {new Date(sol.created_at).toLocaleDateString('es-CO')}
                          {sol.fecha_decision && (
                            <> · Decidido: {new Date(sol.fecha_decision).toLocaleDateString('es-CO')}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <div className="px-4 py-3 space-y-3">
                          {/* Justificación */}
                          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Justificación</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{sol.justificacion}</p>
                          </div>

                          {/* Decisor */}
                          {sol.decidido_por && (
                            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Decidido por</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{sol.decidido_por}</p>
                            </div>
                          )}

                          {/* Campos modificados */}
                          <div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Cambios Solicitados</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {Object.entries(sol.campos_modificados || {}).map(([field, change]) => (
                                <div key={field} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                    {field.replace(/_/g, ' ')}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-red-700 dark:text-red-300 line-through">
                                      {formatRequestedValue(change?.anterior)}
                                    </span>
                                    <span className="text-slate-400">→</span>
                                    <span className="bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-green-700 dark:text-green-300 font-semibold">
                                      {formatRequestedValue(change?.nuevo)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
