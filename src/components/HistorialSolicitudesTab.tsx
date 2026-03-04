'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react'
import {
  fetchSolicitudesCambiosUP,
  fetchSolicitudesCambiosIntervencion,
  type SolicitudCambio,
} from '@/services/unidades-proyecto.service'

// ─── helpers ──────────────────────────────────────────────────────

const estadoBadge = (estado?: string) => {
  switch (estado) {
    case 'aprobada':
      return { icon: CheckCircle2, label: 'Aprobada', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
    case 'rechazada':
      return { icon: XCircle, label: 'Rechazada', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
    default:
      return { icon: Hourglass, label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
  }
}

// ─── Componente principal ─────────────────────────────────────────

const HistorialSolicitudesTab: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<'all' | 'up' | 'intervencion'>('all')

  const loadHistorial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [upRes, intervRes] = await Promise.allSettled([
        fetchSolicitudesCambiosUP(),
        fetchSolicitudesCambiosIntervencion(),
      ])

      const upList =
        upRes.status === 'fulfilled'
          ? (Array.isArray(upRes.value) ? upRes.value : []).map((s) => ({
              ...s,
              tipo: 'unidad_proyecto' as const,
            }))
          : []

      const intervList =
        intervRes.status === 'fulfilled'
          ? (Array.isArray(intervRes.value) ? intervRes.value : []).map((s) => ({
              ...s,
              tipo: 'intervencion' as const,
            }))
          : []

      // Combinar y ordenar por fecha descendente
      const all = [...upList, ...intervList].sort((a, b) => {
        const da = a.fecha_solicitud ? new Date(a.fecha_solicitud).getTime() : 0
        const db = b.fecha_solicitud ? new Date(b.fecha_solicitud).getTime() : 0
        return db - da
      })

      setSolicitudes(all)

      if (upRes.status === 'rejected' && intervRes.status === 'rejected') {
        setError('No se pudieron cargar las solicitudes. Los endpoints pueden no estar disponibles aún.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistorial()
  }, [loadHistorial])

  // Filtrar
  const filtered = solicitudes.filter((s) => {
    if (filterTipo !== 'all') {
      if (filterTipo === 'up' && s.tipo !== 'unidad_proyecto') return false
      if (filterTipo === 'intervencion' && s.tipo !== 'intervencion') return false
    }
    if (filterEstado !== 'all' && s.estado !== filterEstado) return false
    if (search.trim()) {
      const term = search.toLowerCase()
      return (
        s.id?.toLowerCase().includes(term) ||
        s.upid?.toLowerCase().includes(term) ||
        s.intervencion_id?.toLowerCase().includes(term) ||
        JSON.stringify(s.datos_cambio || {}).toLowerCase().includes(term)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, UPID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todas</option>
            <option value="up">UP</option>
            <option value="intervencion">Intervención</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
          <button onClick={loadHistorial} disabled={loading} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Estado */}
      {loading && solicitudes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">Sin registros de solicitudes</p>
          <p className="text-xs mt-1">Las solicitudes aparecerán aquí cuando se generen</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sol) => {
            const isExpanded = expandedId === sol.id
            const badge = estadoBadge(sol.estado)
            const BadgeIcon = badge.icon
            const datos = sol.datos_cambio || {}
            const entries = Object.entries(datos).filter(
              ([k]) => !['id', 'tipo', 'estado_solicitud', 'fecha_solicitud', 'solicitado_por'].includes(k)
            )

            return (
              <div
                key={sol.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sol.id)}
                >
                  <button className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          sol.tipo === 'unidad_proyecto'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {sol.tipo === 'unidad_proyecto' ? 'UP' : 'Intervención'}
                      </span>
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {sol.upid || sol.intervencion_id || sol.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sol.fecha_solicitud
                        ? new Date(sol.fecha_solicitud).toLocaleString('es-CO')
                        : 'Fecha no disponible'}
                      {sol.solicitado_por && ` • por ${sol.solicitado_por}`}
                    </div>
                  </div>
                </div>

                {/* Detalle */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                          Datos de la solicitud:
                        </p>
                        {entries.length === 0 ? (
                          <p className="text-xs text-slate-500">Sin datos disponibles.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entries.map(([key, value]) => (
                              <div
                                key={key}
                                className="flex flex-col bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700"
                              >
                                <span className="text-xs text-slate-500 dark:text-slate-400">{key}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white break-words">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HistorialSolicitudesTab
