'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import {
  fetchSolicitudesCambiosEmprestito,
  aprobarSolicitudEmprestito,
  rechazarSolicitudEmprestito,
} from '@/services/emprestito-gestion.service'
import type { SolicitudCambioEmprestito } from '@/types/gestion-emprestito'
import { EMPRESTITO_ENTITY_LABELS } from '@/types/gestion-emprestito'

// ── Helpers ──────────────────────────────────────────────────────

const formatRequestedValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'Sin cambios'
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : 'Sin cambios'
  }
  if (Array.isArray(value)) return value.length > 0 ? JSON.stringify(value) : 'Sin cambios'
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0 ? JSON.stringify(value) : 'Sin cambios'
  return String(value)
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

// ── Props ────────────────────────────────────────────────────────

interface Props {
  onRefresh?: () => void
}

// ── Componente principal ─────────────────────────────────────────

export default function SolicitudesPendientesEmprestitoTab({ onRefresh }: Props) {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambioEmprestito[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSolicitudesCambiosEmprestito()
      // Solo pendientes
      setSolicitudes(data.filter((s) => !s.estado_decision || s.estado_decision === 'pendiente'))
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarSolicitudes()
  }, [cargarSolicitudes])

  const handleAprobar = async (sol: SolicitudCambioEmprestito) => {
    setProcessingId(sol.id)
    try {
      await aprobarSolicitudEmprestito(sol.id, sol.tipo, sol.campos_modificados)
      setToast({ type: 'success', message: `Solicitud ${sol.referencia} aprobada exitosamente` })
      setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id))
      onRefresh?.()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error al aprobar solicitud' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRechazar = async (sol: SolicitudCambioEmprestito) => {
    const motivo = prompt('Motivo de rechazo:')
    if (!motivo || !motivo.trim()) return
    setProcessingId(sol.id)
    try {
      await rechazarSolicitudEmprestito(sol.id, motivo.trim())
      setToast({ type: 'success', message: `Solicitud ${sol.referencia} rechazada` })
      setSolicitudes((prev) => prev.filter((s) => s.id !== sol.id))
      onRefresh?.()
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error al rechazar solicitud' })
    } finally {
      setProcessingId(null)
    }
  }

  // Filtro
  const filtered = solicitudes.filter((s) => {
    if (filterTipo !== 'todos' && s.tipo !== filterTipo) return false
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const hayMatch =
        s.referencia.toLowerCase().includes(term) ||
        s.nombre_centro_gestor.toLowerCase().includes(term) ||
        s.solicitado_por.toLowerCase().includes(term) ||
        s.justificacion.toLowerCase().includes(term)
      if (!hayMatch) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Solicitudes Pendientes de Empréstito
          </h3>
          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {filtered.length}
          </span>
        </div>
        <button
          onClick={cargarSolicitudes}
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
        <div className="flex gap-2">
          {['todos', 'contrato', 'proceso', 'rpc', 'pago', 'convenio'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filterTipo === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {t === 'todos' ? 'Todos' : EMPRESTITO_ENTITY_LABELS[t as keyof typeof EMPRESTITO_ENTITY_LABELS] || t}
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
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">No hay solicitudes pendientes</p>
              <p className="text-sm mt-1">Todas las solicitudes han sido procesadas</p>
            </div>
          ) : (
            filtered.map((sol) => {
              const isExpanded = expandedId === sol.id
              const isProcessing = processingId === sol.id
              return (
                <div
                  key={sol.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Header */}
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
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${tipoBadge(sol.tipo)}`}>
                            {EMPRESTITO_ENTITY_LABELS[sol.tipo] || sol.tipo}
                          </span>
                          <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                            {sol.referencia}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sol.nombre_centro_gestor} · {sol.solicitado_por} · {new Date(sol.created_at).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    {/* Botones de aprobación/rechazo */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleAprobar(sol)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazar(sol)}
                        disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        Rechazar
                      </button>
                    </div>
                  </button>

                  {/* Detalle expandido */}
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
