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
} from 'lucide-react'
import {
  fetchSolicitudesCambiosUP,
  fetchSolicitudesCambiosIntervencion,
  type SolicitudCambio,
} from '@/services/unidades-proyecto.service'
import { actualizarEstadoSolicitud, aplicarCambiosFirestore } from '@/lib/firebase'

// ─── Componente principal ─────────────────────────────────────────

const SolicitudesPendientesTab: React.FC = () => {
  const [solicitudesUP, setSolicitudesUP] = useState<SolicitudCambio[]>([])
  const [solicitudesIntervencion, setSolicitudesIntervencion] = useState<SolicitudCambio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'up' | 'intervencion'>('all')

  const loadSolicitudes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [upRes, intervRes] = await Promise.allSettled([
        fetchSolicitudesCambiosUP(),
        fetchSolicitudesCambiosIntervencion(),
      ])

      // Solo mostrar solicitudes que NO tengan estado_decision (pendientes)
      const upList =
        upRes.status === 'fulfilled'
          ? (Array.isArray(upRes.value) ? upRes.value : [])
              .map((s) => ({ ...s, tipo: 'unidad_proyecto' as const }))
              .filter((s) => !(s as any).estado_decision)
          : []

      const intervList =
        intervRes.status === 'fulfilled'
          ? (Array.isArray(intervRes.value) ? intervRes.value : [])
              .map((s) => ({ ...s, tipo: 'intervencion' as const }))
              .filter((s) => !(s as any).estado_decision)
          : []

      setSolicitudesUP(upList)
      setSolicitudesIntervencion(intervList)

      // Reportar si ambos fallaron
      if (upRes.status === 'rejected' && intervRes.status === 'rejected') {
        setError('No se pudieron cargar las solicitudes. Los endpoints pueden no estar disponibles aún.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSolicitudes()
  }, [loadSolicitudes])

  // Campos de metadatos a excluir al extraer datos de cambio
  const METADATA_KEYS = new Set(['id', 'tipo', 'created_at', 'updated_at', 'upid', 'intervencion_id', 'estado_decision', 'decision_at'])

  // Extraer solo los campos de datos (no metadatos) de una solicitud plana
  const extractCambios = (sol: SolicitudCambio) => {
    const cambios: Record<string, any> = {}
    for (const [k, v] of Object.entries(sol)) {
      if (!METADATA_KEYS.has(k)) cambios[k] = v
    }
    return cambios
  }

  // Aprobar: aplica cambios directamente en Firestore + marca solicitud como aprobada
  const handleAprobar = async (solicitud: SolicitudCambio) => {
    setProcessingId(solicitud.id)
    try {
      const cambios = extractCambios(solicitud)

      if (solicitud.tipo === 'unidad_proyecto') {
        const upid = solicitud.upid
        if (!upid) throw new Error('Falta el UPID en la solicitud')
        // Aplicar cambios directamente en Firestore (el PUT del backend no persiste)
        await aplicarCambiosFirestore('unidad_proyecto', { upid }, cambios)
        // Marcar solicitud como aprobada
        await actualizarEstadoSolicitud('solicitudes_cambios_unidades_proyecto', solicitud.id, 'aprobada')
      } else {
        const intervencionId = solicitud.intervencion_id
        if (!intervencionId) throw new Error('Falta el intervencion_id en la solicitud')
        await aplicarCambiosFirestore('intervencion', { intervencion_id: intervencionId }, cambios)
        await actualizarEstadoSolicitud('solicitudes_cambios_intervenciones', solicitud.id, 'aprobada')
      }

      // Remover de la lista local
      if (solicitud.tipo === 'unidad_proyecto') {
        setSolicitudesUP((prev) => prev.filter((s) => s.id !== solicitud.id))
      } else {
        setSolicitudesIntervencion((prev) => prev.filter((s) => s.id !== solicitud.id))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al aprobar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  // Rechazar: marca en Firestore como rechazada (NO aplica cambios en la UP)
  const handleRechazar = async (solicitud: SolicitudCambio) => {
    if (!confirm('¿Deseas rechazar esta solicitud de cambio? Se marcará como rechazada en el sistema.')) return
    setProcessingId(solicitud.id)
    try {
      if (solicitud.tipo === 'unidad_proyecto') {
        await actualizarEstadoSolicitud('solicitudes_cambios_unidades_proyecto', solicitud.id, 'rechazada')
        setSolicitudesUP((prev) => prev.filter((s) => s.id !== solicitud.id))
      } else {
        await actualizarEstadoSolicitud('solicitudes_cambios_intervenciones', solicitud.id, 'rechazada')
        setSolicitudesIntervencion((prev) => prev.filter((s) => s.id !== solicitud.id))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al rechazar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  // Combinar y filtrar
  const allSolicitudes = [
    ...(filter === 'intervencion' ? [] : solicitudesUP),
    ...(filter === 'up' ? [] : solicitudesIntervencion),
  ].filter((s) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      s.id?.toLowerCase().includes(term) ||
      s.upid?.toLowerCase().includes(term) ||
      s.intervencion_id?.toLowerCase().includes(term) ||
      JSON.stringify(s).toLowerCase().includes(term)
    )
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
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todas</option>
            <option value="up">Solo UP</option>
            <option value="intervencion">Solo Intervención</option>
          </select>
          <button onClick={loadSolicitudes} disabled={loading} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
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

      {/* Estado: cargando */}
      {loading && allSolicitudes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : allSolicitudes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-12 h-12 mb-3 text-green-500" />
          <p className="text-sm font-medium">No hay solicitudes pendientes</p>
          <p className="text-xs mt-1">Todas las solicitudes han sido procesadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allSolicitudes.map((sol) => {
            const isExpanded = expandedId === sol.id
            const isProcessing = processingId === sol.id
            const entries = Object.entries(sol).filter(
              ([k]) => !METADATA_KEYS.has(k)
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
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sol.created_at
                        ? new Date(sol.created_at).toLocaleString('es-CO')
                        : 'Fecha no disponible'}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAprobar(sol)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                      title="Aprobar y aplicar cambio"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {isProcessing ? 'Aplicando…' : 'Aprobar'}
                    </button>
                    <button
                      onClick={() => handleRechazar(sol)}
                      disabled={isProcessing}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                      title="Rechazar solicitud"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                </div>

                {/* Detalle expandido */}
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
                          Campos solicitados para cambio:
                        </p>
                        {entries.length === 0 ? (
                          <p className="text-xs text-slate-500">Sin datos de cambio disponibles.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entries.map(([key, value]) => (
                              <div key={key} className="flex flex-col bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
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

export default SolicitudesPendientesTab
