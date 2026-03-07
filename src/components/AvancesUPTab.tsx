'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Download, ExternalLink, FileText, ImageIcon, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { eliminarIntervencion } from '@/services/unidades-proyecto.service'
import { useAuth } from '@/context/AuthContext'

interface SoporteItem {
  indice?: number
  tipo?: 'imagen' | 'documento' | string
  nombre_original?: string
  s3_key?: string
  url?: string
  url_presigned?: string
  presigned_url?: string
  url_directa?: string
}

interface AvanceRow {
  id: string
  intervencion_id: string
  upid: string
  avance_obra: number
  observaciones: string
  reportado_por: string
  created_at: string
  updated_at: string
  imagenes: string[]
  documentos: string[]
  soportes: SoporteItem[]
}

const AVANCES_ENDPOINT = '/api/proxy/avances_unidades_proyecto'
const INTERVENCIONES_ENDPOINT = '/api/proxy/intervenciones'

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const asText = (value: unknown): string => (typeof value === 'string' ? value : '')

const resolveUrl = (soporte?: SoporteItem): string => {
  if (!soporte) return ''
  return asText(soporte.url_presigned) || asText(soporte.presigned_url) || asText(soporte.url) || asText(soporte.url_directa)
}

const normalizeAvanceRow = (raw: Record<string, unknown>): AvanceRow => {
  const soportes = asArray<SoporteItem>(raw.soportes)

  const imagenesFromSoportes = soportes
    .filter((s) => s.tipo === 'imagen')
    .map((s) => resolveUrl(s))
    .filter(Boolean)

  const documentosFromSoportes = soportes
    .filter((s) => s.tipo !== 'imagen')
    .map((s) => resolveUrl(s))
    .filter(Boolean)

  const imagenes = imagenesFromSoportes.length > 0
    ? imagenesFromSoportes
    : asArray<string>(raw.imagenes_urls).filter(Boolean)

  const documentos = documentosFromSoportes.length > 0
    ? documentosFromSoportes
    : asArray<string>(raw.documentos_urls).filter(Boolean)

  return {
    id: asText(raw.id) || asText(raw.doc_id) || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    intervencion_id: asText(raw.intervencion_id),
    upid: asText(raw.upid),
    avance_obra: Number(raw.avance_obra ?? 0),
    observaciones: asText(raw.observaciones),
    reportado_por: asText(raw.registrado_por) || asText(raw.reportado_por),
    created_at: asText(raw.created_at),
    updated_at: asText(raw.updated_at),
    imagenes,
    documentos,
    soportes
  }
}

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values))

const formatDate = (value: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CO')
}

const fileNameFromUrl = (url: string, fallback: string): string => {
  const clean = url.split('?')[0]
  const name = clean.split('/').pop()
  if (!name) return fallback
  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

export default function AvancesUPTab() {
  const { hasRole } = useAuth()
  const canDeleteIntervenciones = hasRole('super_admin') || hasRole('admin_general')

  const [rows, setRows] = useState<AvanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [intervencionIdInput, setIntervencionIdInput] = useState('')
  const [upidInput, setUpidInput] = useState('')

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [deletingIntervencionId, setDeletingIntervencionId] = useState<string | null>(null)

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
  }, [rows])

  const fetchIntervencionIdsByUpid = async (upid: string): Promise<string[]> => {
    const response = await fetch(`${INTERVENCIONES_ENDPOINT}?upid=${encodeURIComponent(upid)}&limit=200`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`No se pudo resolver intervenciones para UPID (${response.status})`)
    }

    const json = await response.json()
    const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []

    return unique(
      data
        .map((item: Record<string, unknown>) => asText(item.intervencion_id))
        .filter(Boolean)
    )
  }

  const fetchUpidByIntervencionId = async (intervencionId: string): Promise<string> => {
    const response = await fetch(`${INTERVENCIONES_ENDPOINT}?intervencion_id=${encodeURIComponent(intervencionId)}&limit=1`, {
      cache: 'no-store'
    })

    if (!response.ok) return ''

    const json = await response.json()
    const data = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []
    const first = data[0] as Record<string, unknown> | undefined
    return first ? asText(first.upid) : ''
  }

  const fetchAvancesByIntervencionId = async (intervencionId: string): Promise<AvanceRow[]> => {
    const response = await fetch(`${AVANCES_ENDPOINT}?intervencion_id=${encodeURIComponent(intervencionId)}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Error consultando avances por intervencion_id (${response.status})`)
    }

    const json = await response.json()
    const records = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []

    const upid = await fetchUpidByIntervencionId(intervencionId)

    return records.map((item: Record<string, unknown>) => {
      const normalized = normalizeAvanceRow(item)
      return {
        ...normalized,
        intervencion_id: normalized.intervencion_id || intervencionId,
        upid: normalized.upid || upid
      }
    })
  }

  const fetchAllAvances = async (): Promise<AvanceRow[]> => {
    const response = await fetch(AVANCES_ENDPOINT, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error(`Error consultando avances (${response.status})`)
    }

    const json = await response.json()
    const records = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : []

    const mapped = await Promise.all(records.map(async (item: Record<string, unknown>) => {
      const normalized = normalizeAvanceRow(item)
      if (normalized.upid) return normalized

      if (!normalized.intervencion_id) return normalized

      const upid = await fetchUpidByIntervencionId(normalized.intervencion_id)
      return { ...normalized, upid }
    }))

    return mapped
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const intervencionId = intervencionIdInput.trim()
      const upid = upidInput.trim()

      let result: AvanceRow[] = []

      if (intervencionId) {
        result = await fetchAvancesByIntervencionId(intervencionId)
      } else if (upid) {
        const intervenciones = await fetchIntervencionIdsByUpid(upid)
        const batches = await Promise.all(intervenciones.map((id) => fetchAvancesByIntervencionId(id)))
        result = batches.flat().map((row) => ({ ...row, upid: row.upid || upid }))
      } else {
        result = await fetchAllAvances()
      }

      const dedup = new Map<string, AvanceRow>()
      result.forEach((row) => dedup.set(row.id, row))
      setRows(Array.from(dedup.values()))
    } catch (err: unknown) {
      setRows([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar avances de UP')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = async () => {
    setIntervencionIdInput('')
    setUpidInput('')
    await loadData()
  }

  const handleDeleteIntervencion = async (intervencionId: string) => {
    if (!canDeleteIntervenciones) {
      setError('No tienes permisos para eliminar intervenciones')
      return
    }

    const safeIntervencionId = intervencionId.trim()
    if (!safeIntervencionId) {
      setError('No se puede eliminar: intervencion_id vacío')
      return
    }

    const approved = window.confirm(
      `Vas a eliminar la intervención ${safeIntervencionId}. Esta acción es irreversible. ¿Deseas continuar?`
    )

    if (!approved) return

    try {
      setDeletingIntervencionId(safeIntervencionId)
      setError(null)

      await eliminarIntervencion(safeIntervencionId)

      // Limpieza optimista en tabla local: se eliminan todos los avances de esa intervención.
      setRows((prev) => prev.filter((row) => row.intervencion_id !== safeIntervencionId))

      if (expandedRow) {
        const expanded = rows.find((row) => row.id === expandedRow)
        if (expanded?.intervencion_id === safeIntervencionId) setExpandedRow(null)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la intervención')
    } finally {
      setDeletingIntervencionId(null)
    }
  }

  React.useEffect(() => {
    void loadData()
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtrar por intervencion_id</label>
            <input
              type="text"
              value={intervencionIdInput}
              onChange={(event) => setIntervencionIdInput(event.target.value)}
              placeholder="INT-001"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filtrar por upid</label>
            <input
              type="text"
              value={upidInput}
              onChange={(event) => setUpidInput(event.target.value)}
              placeholder="UNP-1000"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>

            <button
              onClick={() => void clearFilters()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Avances de Unidades de Proyecto</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{sortedRows.length} registro(s)</span>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando avances...
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">No se encontraron avances para los filtros seleccionados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/40">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">UPID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">intervencion_id</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">avance_obra</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">reportado_por</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">fecha</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">fotos</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200">documentos</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-200">detalle</th>
                  {canDeleteIntervenciones && (
                    <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-200">acciones</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const isExpanded = expandedRow === row.id
                  const isDeleting = deletingIntervencionId === row.intervencion_id
                  return (
                    <React.Fragment key={row.id}>
                      <tr className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{row.upid || '-'}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{row.intervencion_id || '-'}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{Number.isFinite(row.avance_obra) ? `${row.avance_obra}%` : '-'}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{row.reportado_por || '-'}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{formatDate(row.created_at)}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{row.imagenes.length}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{row.documentos.length}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200"
                          >
                            {isExpanded ? 'Ocultar' : 'Ver'}
                          </button>
                        </td>
                        {canDeleteIntervenciones && (
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => void handleDeleteIntervencion(row.intervencion_id)}
                              disabled={isDeleting || !row.intervencion_id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs"
                              title="Eliminar intervención"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </td>
                        )}
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/20">
                          <td colSpan={canDeleteIntervenciones ? 9 : 8} className="px-4 py-3">
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                              <div className="xl:col-span-1 space-y-2">
                                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">Datos de avance</h4>
                                <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                                  <p><span className="font-medium">updated_at:</span> {formatDate(row.updated_at)}</p>
                                  <p><span className="font-medium">observaciones:</span> {row.observaciones || '-'}</p>
                                </div>
                              </div>

                              <div className="xl:col-span-1">
                                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Fotos</h4>
                                {row.imagenes.length === 0 ? (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Sin fotos.</p>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2">
                                    {row.imagenes.map((img, index) => (
                                      <a
                                        key={`${row.id}-img-${index}`}
                                        href={img}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                                      >
                                        <img src={img} alt={`foto-${index + 1}`} className="w-full h-24 object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="xl:col-span-1">
                                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Documentos</h4>
                                {row.documentos.length === 0 ? (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">Sin documentos.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {row.documentos.map((doc, index) => {
                                      const fileName = fileNameFromUrl(doc, `Documento ${index + 1}`)
                                      return (
                                        <div key={`${row.id}-doc-${index}`} className="flex items-center gap-2">
                                          <a
                                            href={doc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="truncate">{fileName}</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                          <a
                                            href={doc}
                                            download
                                            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600"
                                            title="Descargar"
                                          >
                                            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                          </a>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5" />
        Vista tabular de avances consumiendo <code>{AVANCES_ENDPOINT}</code> e identificación por <code>intervencion_id</code> / <code>upid</code>.
      </div>

      {!canDeleteIntervenciones && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          Modo solo lectura: la eliminación de intervenciones está habilitada solo para super_admin y admin_general.
        </div>
      )}
    </div>
  )
}
