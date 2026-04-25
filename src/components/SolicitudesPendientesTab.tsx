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

const formatRequestedValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'Sin cambios'

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : 'Sin cambios'
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : 'Sin cambios'
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
      ? JSON.stringify(value)
      : 'Sin cambios'
  }

  return String(value)
}

const normalizeComparableValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    const numeric = Number(trimmed)
    if (!Number.isNaN(numeric) && /^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return numeric
    }

    return trimmed
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item))
  }

  if (typeof value === 'object') {
    const normalizedEntries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, normalizeComparableValue(v)] as const)
      .sort(([a], [b]) => a.localeCompare(b))
    return Object.fromEntries(normalizedEntries)
  }

  return value
}

const areFieldValuesEqual = (a: unknown, b: unknown): boolean => {
  return JSON.stringify(normalizeComparableValue(a)) === JSON.stringify(normalizeComparableValue(b))
}

const extractChangePair = (
  key: string,
  requestedValue: unknown,
  currentRecord?: Record<string, unknown> | null,
) => {
  const rawValue = requestedValue as Record<string, unknown> | unknown

  if (
    rawValue &&
    typeof rawValue === 'object' &&
    !Array.isArray(rawValue)
  ) {
    const valueObj = rawValue as Record<string, unknown>
    const prevExplicit =
      valueObj.anterior ??
      valueObj.valor_anterior ??
      valueObj.old ??
      valueObj.before ??
      valueObj.previo ??
      valueObj.previous
    const nextExplicit =
      valueObj.nuevo ??
      valueObj.valor_nuevo ??
      valueObj.new ??
      valueObj.after ??
      valueObj.solicitado ??
      valueObj.requested ??
      valueObj.propuesto

    const hasExplicitPair = prevExplicit !== undefined || nextExplicit !== undefined

    if (hasExplicitPair) {
      const previous = prevExplicit ?? currentRecord?.[key] ?? null
      const requested = nextExplicit ?? null
      return {
        previous,
        requested,
        changed: !areFieldValuesEqual(previous, requested),
      }
    }
  }

  const previous = currentRecord?.[key] ?? null
  return {
    previous,
    requested: requestedValue,
    changed: !areFieldValuesEqual(previous, requestedValue),
  }
}

const extractFirstRecordFromPayload = (payload: any): Record<string, unknown> | null => {
  if (!payload) return null

  if (Array.isArray(payload)) {
    const first = payload[0]
    return first && typeof first === 'object' ? first : null
  }

  if (Array.isArray(payload?.data)) {
    const first = payload.data[0]
    return first && typeof first === 'object' ? first : null
  }

  if (Array.isArray(payload?.items)) {
    const first = payload.items[0]
    return first && typeof first === 'object' ? first : null
  }

  if (Array.isArray(payload?.features)) {
    const first = payload.features[0]
    if (!first || typeof first !== 'object') return null
    if (first.properties && typeof first.properties === 'object') return first.properties
    return first
  }

  if (typeof payload === 'object') {
    return payload
  }

  return null
}

const formatServerTimestampToColombia = (value?: string): string => {
  if (!value) return 'Fecha no disponible'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Fecha no disponible'

  return parsed.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

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
  const [currentDataCache, setCurrentDataCache] = useState<Record<string, Record<string, unknown> | null>>({})
  const [loadingCurrentData, setLoadingCurrentData] = useState<Set<string>>(new Set())

  const getSolicitudId = (sol: SolicitudCambio): string => {
    const raw =
      (sol as any).id ??
      (sol as any).solicitud_id ??
      (sol as any)._id ??
      (sol as any).document_id ??
      ''
    return String(raw || '').trim()
  }

  const removeSolicitudFromList = (list: SolicitudCambio[], solicitud: SolicitudCambio): SolicitudCambio[] => {
    const targetId = getSolicitudId(solicitud)

    return list.filter((item) => {
      const currentId = getSolicitudId(item)

      // Prioridad 1: remover por ID estable
      if (targetId && currentId) return currentId !== targetId

      // Prioridad 2: fallback por referencia cuando no hay ID utilizable
      return item !== solicitud
    })
  }

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

  const getComparisonKey = (sol: SolicitudCambio) => {
    const stableId = getSolicitudId(sol)
    if (stableId) return `${sol.tipo || 'sol'}:${stableId}`
    return `${sol.tipo || 'sol'}:${sol.upid || sol.intervencion_id || 'unknown'}`
  }

  const fetchCurrentRecord = useCallback(async (sol: SolicitudCambio) => {
    const cacheKey = getComparisonKey(sol)
    if (cacheKey in currentDataCache || loadingCurrentData.has(cacheKey)) return

    setLoadingCurrentData((prev) => new Set(prev).add(cacheKey))

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
    const isUP = sol.tipo === 'unidad_proyecto'
    const identifier = isUP ? sol.upid : sol.intervencion_id
    const query = isUP
      ? `upid=${encodeURIComponent(identifier || '')}`
      : `intervencion_id=${encodeURIComponent(identifier || '')}`
    const endpoint = isUP ? 'unidades-proyecto' : 'intervenciones'
    const candidates = [
      apiUrl ? `${apiUrl}/${endpoint}?${query}&limit=1` : '',
      `/api/proxy/${endpoint}?${query}&limit=1`,
    ].filter(Boolean)

    let found: Record<string, unknown> | null = null

    for (const url of candidates) {
      try {
        const response = await fetch(url, { method: 'GET', cache: 'no-store' })
        if (!response.ok) continue
        const payload = await response.json()
        found = extractFirstRecordFromPayload(payload)
        if (found) break
      } catch {
        continue
      }
    }

    setCurrentDataCache((prev) => ({ ...prev, [cacheKey]: found }))
    setLoadingCurrentData((prev) => {
      const next = new Set(prev)
      next.delete(cacheKey)
      return next
    })
  }, [currentDataCache, loadingCurrentData])

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
    const solicitudId = getSolicitudId(solicitud)
    setProcessingId(solicitudId)
    try {
      const cambios = extractCambios(solicitud)

      if (solicitud.tipo === 'unidad_proyecto') {
        const upid = solicitud.upid
        if (!upid) throw new Error('Falta el UPID en la solicitud')
        if (!solicitudId) throw new Error('Falta el ID de la solicitud')
        // Aplicar cambios directamente en Firestore (el PUT del backend no persiste)
        await aplicarCambiosFirestore('unidad_proyecto', { upid }, cambios)
        // Marcar solicitud como aprobada
        await actualizarEstadoSolicitud('solicitudes_cambios_unidades_proyecto', solicitudId, 'aprobada')
      } else {
        const intervencionId = solicitud.intervencion_id
        if (!intervencionId) throw new Error('Falta el intervencion_id en la solicitud')
        if (!solicitudId) throw new Error('Falta el ID de la solicitud')
        await aplicarCambiosFirestore('intervencion', { intervencion_id: intervencionId }, cambios)
        await actualizarEstadoSolicitud('solicitudes_cambios_intervenciones', solicitudId, 'aprobada')
      }

      // Remover de la lista local
      if (solicitud.tipo === 'unidad_proyecto') {
        setSolicitudesUP((prev) => removeSolicitudFromList(prev, solicitud))
      } else {
        setSolicitudesIntervencion((prev) => removeSolicitudFromList(prev, solicitud))
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
    const solicitudId = getSolicitudId(solicitud)
    setProcessingId(solicitudId)
    try {
      if (!solicitudId) throw new Error('Falta el ID de la solicitud')

      if (solicitud.tipo === 'unidad_proyecto') {
        await actualizarEstadoSolicitud('solicitudes_cambios_unidades_proyecto', solicitudId, 'rechazada')
        setSolicitudesUP((prev) => removeSolicitudFromList(prev, solicitud))
      } else {
        await actualizarEstadoSolicitud('solicitudes_cambios_intervenciones', solicitudId, 'rechazada')
        setSolicitudesIntervencion((prev) => removeSolicitudFromList(prev, solicitud))
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
      getSolicitudId(s).toLowerCase().includes(term) ||
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
          {allSolicitudes.map((sol, index) => {
            const solId = getSolicitudId(sol)
            const isExpanded = expandedId === solId
            const isProcessing = processingId === solId
            const comparisonKey = getComparisonKey(sol)
            const currentRecord = currentDataCache[comparisonKey]
            const isLoadingComparison = loadingCurrentData.has(comparisonKey)
            const entries = Object.entries(sol).filter(
              ([k]) => !METADATA_KEYS.has(k)
            )

            return (
              <div
                key={solId || `${sol.tipo}-${sol.upid || sol.intervencion_id || index}`}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null)
                    } else {
                      setExpandedId(solId)
                      void fetchCurrentRecord(sol)
                    }
                  }}
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
                        {sol.upid || sol.intervencion_id || solId || 'Solicitud sin ID'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatServerTimestampToColombia(sol.created_at)}
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
                        {isLoadingComparison && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando valores actuales para comparación...</p>
                        )}
                        {entries.length === 0 ? (
                          <p className="text-xs text-slate-500">Sin datos de cambio disponibles.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entries.map(([key, value]) => {
                              const { previous, requested, changed } = extractChangePair(key, value, currentRecord)

                              const previousColor = changed
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-slate-900 dark:text-white'
                              const requestedColor = changed
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-slate-900 dark:text-white'

                              return (
                                <div key={key} className="flex flex-col bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 gap-1">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">{key}</span>
                                  <div className="text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">Anterior:</span>{' '}
                                    <span className={`font-medium break-words ${previousColor}`}>
                                      {formatRequestedValue(previous)}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">Solicitado:</span>{' '}
                                    <span className={`font-medium break-words ${requestedColor}`}>
                                      {formatRequestedValue(requested)}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
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
