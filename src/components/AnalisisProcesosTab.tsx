'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
  FileText,
  FolderOpen,
  MapPin,
  Hash,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { fetchIntervenciones } from '@/services/unidades-proyecto.service'

// ── Types ────────────────────────────────────────────────────────

interface IntervencionRaw {
  intervencion_id?: string
  upid?: string
  nombre_up?: string
  nombre_up_detalle?: string
  nombre_centro_gestor?: string
  centro_gestor?: string
  referencia_proceso?: string
  referencia_contrato?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  tipo_intervencion?: string
  estado?: string
  descripcion_intervencion?: string
  presupuesto_base?: number
  avance_obra?: number
  [key: string]: any
}

type AgruparPor = 'procesos' | 'contratos'

// ── Component ────────────────────────────────────────────────────

export default function AnalisisProcesosTab() {
  const [intervenciones, setIntervenciones] = useState<IntervencionRaw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agruparPor, setAgruparPor] = useState<AgruparPor>('procesos')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCentros, setExpandedCentros] = useState<Set<string>>(new Set())
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set())

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch intervenciones y unidades de proyecto en paralelo
      const [intRes, upRes] = await Promise.all([
        fetch('/api/proxy/intervenciones?limit=10000').then((r) => r.json()),
        fetch('/api/proxy/unidades-proyecto?limit=10000').then((r) => r.json()),
      ])

      // Normalizar arrays — la API de intervenciones wrappea en {data:[...]}, la de UP es array directo
      const intArr: any[] = Array.isArray(intRes)
        ? intRes
        : Array.isArray(intRes?.data)
          ? intRes.data
          : []

      const upArr: any[] = Array.isArray(upRes)
        ? upRes
        : Array.isArray(upRes?.data)
          ? upRes.data
          : []

      // Lookup de UP por upid para enriquecer intervenciones
      const upMap = new Map<string, any>()
      for (const up of upArr) {
        if (up.upid) upMap.set(String(up.upid), up)
      }

      // Enriquecer cada intervención con datos de su UP
      const enriquecidas = intArr.map((item: any) => {
        const up = item.upid ? upMap.get(String(item.upid)) : undefined
        return {
          ...item,
          nombre_up: item.nombre_up ?? up?.nombre_up ?? '',
          nombre_up_detalle: item.nombre_up_detalle ?? up?.nombre_up_detalle ?? '',
          comuna_corregimiento: item.comuna_corregimiento ?? up?.comuna_corregimiento ?? '',
          barrio_vereda: item.barrio_vereda ?? up?.barrio_vereda ?? '',
        }
      })

      setIntervenciones(enriquecidas)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  // ── Agrupación jerárquica ────────────────────────────────────

  const datosAgrupados = useMemo(() => {
    const campoRef = agruparPor === 'procesos' ? 'referencia_proceso' : 'referencia_contrato'
    const term = searchTerm.toLowerCase().trim()

    const filtradas = term
      ? intervenciones.filter((i) => {
          const centroGestor = (i.nombre_centro_gestor || i.centro_gestor || '').toLowerCase()
          const ref = (i[campoRef] || '').toLowerCase()
          const up = (i.nombre_up || '').toLowerCase()
          const upDetalle = (i.nombre_up_detalle || '').toLowerCase()
          return (
            centroGestor.includes(term) ||
            ref.includes(term) ||
            up.includes(term) ||
            upDetalle.includes(term)
          )
        })
      : intervenciones

    // Nivel 1: Agrupar por nombre_centro_gestor
    const porCentro = new Map<string, IntervencionRaw[]>()
    for (const item of filtradas) {
      const centro = item.nombre_centro_gestor || item.centro_gestor || 'Sin Centro Gestor'
      if (!porCentro.has(centro)) porCentro.set(centro, [])
      porCentro.get(centro)!.push(item)
    }

    // Ordenar centros alfabéticamente
    const centrosOrdenados = Array.from(porCentro.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], 'es')
    )

    // Nivel 2: Dentro de cada centro, agrupar por referencia_proceso o referencia_contrato
    return centrosOrdenados.map(([centro, items]) => {
      const porRef = new Map<string, IntervencionRaw[]>()
      for (const item of items) {
        const ref = item[campoRef] || 'Sin referencia'
        if (!porRef.has(ref)) porRef.set(ref, [])
        porRef.get(ref)!.push(item)
      }

      const refsOrdenadas = Array.from(porRef.entries()).sort((a, b) =>
        a[0].localeCompare(b[0], 'es')
      )

      return {
        centro,
        totalIntervenciones: items.length,
        totalRefs: refsOrdenadas.length,
        referencias: refsOrdenadas.map(([ref, refItems]) => ({
          referencia: ref,
          intervenciones: refItems,
        })),
      }
    })
  }, [intervenciones, agruparPor, searchTerm])

  // ── Toggles ──────────────────────────────────────────────────

  const toggleCentro = (centro: string) => {
    setExpandedCentros((prev) => {
      const next = new Set(prev)
      if (next.has(centro)) next.delete(centro)
      else next.add(centro)
      return next
    })
  }

  const toggleRef = (key: string) => {
    setExpandedRefs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Render ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando intervenciones…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={cargarDatos}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    )
  }

  const labelRef = agruparPor === 'procesos' ? 'Proceso' : 'Contrato'
  const labelRefPlural = agruparPor === 'procesos' ? 'Procesos' : 'Contratos'

  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Toggle Procesos / Contratos */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agrupar por:</span>
          <button
            onClick={() => {
              setAgruparPor((prev) => (prev === 'procesos' ? 'contratos' : 'procesos'))
              setExpandedCentros(new Set())
              setExpandedRefs(new Set())
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              agruparPor === 'procesos'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            }`}
          >
            {agruparPor === 'procesos' ? (
              <ToggleLeft className="w-4 h-4" />
            ) : (
              <ToggleRight className="w-4 h-4" />
            )}
            {agruparPor === 'procesos' ? 'Procesos' : 'Contratos'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar centro, proceso, UP…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={cargarDatos}
            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400">Centros Gestores</p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{datosAgrupados.length}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-indigo-600 dark:text-indigo-400">{labelRefPlural}</p>
          <p className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
            {datosAgrupados.reduce((acc, c) => acc + c.totalRefs, 0)}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Intervenciones</p>
          <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
            {datosAgrupados.reduce((acc, c) => acc + c.totalIntervenciones, 0)}
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-600 dark:text-amber-400">Modo</p>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mt-1">
            Por {labelRefPlural}
          </p>
        </div>
      </div>

      {/* Sin datos */}
      {datosAgrupados.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No se encontraron datos{searchTerm ? ' para la búsqueda actual' : ''}</p>
        </div>
      )}

      {/* Nivel 1: Centros Gestores */}
      <div className="space-y-2">
        {datosAgrupados.map(({ centro, totalIntervenciones, totalRefs, referencias }) => {
          const isCentroOpen = expandedCentros.has(centro)

          return (
            <div
              key={centro}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800"
            >
              {/* Centro Gestor Header */}
              <button
                onClick={() => toggleCentro(centro)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <motion.div
                  animate={{ rotate: isCentroOpen ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.div>
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white truncate block">
                    {centro}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                    {totalRefs} {totalRefs === 1 ? labelRef : labelRefPlural}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                    {totalIntervenciones} interv.
                  </span>
                </div>
              </button>

              {/* Nivel 2: Referencias (Proceso o Contrato) */}
              <AnimatePresence initial={false}>
                {isCentroOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      {referencias.map(({ referencia, intervenciones: refItems }) => {
                        const refKey = `${centro}::${referencia}`
                        const isRefOpen = expandedRefs.has(refKey)

                        return (
                          <div key={refKey}>
                            {/* Referencia Header */}
                            <button
                              onClick={() => toggleRef(refKey)}
                              className="w-full flex items-center gap-3 px-6 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <motion.div
                                animate={{ rotate: isRefOpen ? 90 : 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </motion.div>
                              <Hash className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate block">
                                  {referencia}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                                {refItems.length} intervención{refItems.length !== 1 ? 'es' : ''}
                              </span>
                            </button>

                            {/* Nivel 3: Intervenciones */}
                            <AnimatePresence initial={false}>
                              {isRefOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-6 pb-3 pt-1">
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
                                      <table className="w-full text-xs bg-white dark:bg-slate-800">
                                        <thead>
                                          <tr className="bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300">
                                            <th className="px-3 py-2 text-left font-semibold">Nombre UP</th>
                                            <th className="px-3 py-2 text-left font-semibold">Detalle UP</th>
                                            <th className="px-3 py-2 text-left font-semibold">Comuna / Corregimiento</th>
                                            <th className="px-3 py-2 text-left font-semibold">Barrio / Vereda</th>
                                            <th className="px-3 py-2 text-left font-semibold">Tipo Intervención</th>
                                            <th className="px-3 py-2 text-left font-semibold">Estado</th>
                                            <th className="px-3 py-2 text-right font-semibold">Avance</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                          {refItems.map((item, idx) => (
                                            <tr
                                              key={item.intervencion_id || `${refKey}-${idx}`}
                                              className="bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-700/40 transition-colors"
                                            >
                                              <td className="px-3 py-2 text-slate-900 dark:text-slate-100 font-medium max-w-[200px] truncate">
                                                {item.nombre_up || '—'}
                                              </td>
                                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                                                {item.nombre_up_detalle || '—'}
                                              </td>
                                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                  {item.comuna_corregimiento || '—'}
                                                </div>
                                              </td>
                                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                {item.barrio_vereda || '—'}
                                              </td>
                                              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                                {item.tipo_intervencion || '—'}
                                              </td>
                                              <td className="px-3 py-2">
                                                <EstadoBadge estado={item.estado} />
                                              </td>
                                              <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                                                {item.avance_obra != null
                                                  ? `${Number(item.avance_obra).toFixed(1)}%`
                                                  : '—'}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Subcomponente: Badge de estado ──────────────────────────────

function EstadoBadge({ estado }: { estado?: string }) {
  const label = estado || 'Sin estado'
  const lower = label.toLowerCase()

  let colors = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  if (lower.includes('terminad') || lower.includes('completad') || lower.includes('inaugura'))
    colors = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  else if (lower.includes('ejecuc') || lower.includes('activ'))
    colors = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  else if (lower.includes('suspendid') || lower.includes('paraliz'))
    colors = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  else if (lower.includes('cancel') || lower.includes('sin'))
    colors = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${colors}`}>
      {label}
    </span>
  )
}
