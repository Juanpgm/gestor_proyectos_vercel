'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  Loader2,
  Landmark,
  FolderOpen,
  Hash,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  RefreshCw,
  DollarSign,
  FileText,
} from 'lucide-react'
import {
  fetchContratosEmprestito,
  fetchProcesosEmprestito,
  fetchRPCsEmprestito,
  fetchPagosEmprestitoAll,
} from '@/services/emprestito-gestion.service'
import { useAuth } from '@/context/AuthContext'
import { getCentroGestorAccessFromSession } from '@/utils/centroGestorAccess'
import { formatCurrencyFull } from '@/utils/formatCurrency'

// ── Types ────────────────────────────────────────────────────────

interface EmprestitoItem {
  id?: string
  referencia_contrato?: string
  referencia_proceso?: string
  numero_rpc?: string
  nombre_centro_gestor?: string
  centro_gestor?: string
  banco?: string
  bp?: string
  nombre_proyecto?: string
  valor_contrato?: number
  valor_total?: number
  estado?: string
  tipo_entidad: string
  [key: string]: any
}

type AgruparPor = 'banco' | 'centro_gestor' | 'bp'

// ── Component ────────────────────────────────────────────────────

export default function AnalisisEmprestitoTab() {
  const { state: authState } = useAuth()
  const centroGestorAccess = useMemo(() => getCentroGestorAccessFromSession(), [authState.user])
  const userCentroGestor = centroGestorAccess.userCentroGestor || ''
  const canViewAll = centroGestorAccess.canViewAll

  const [items, setItems] = useState<EmprestitoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agruparPor, setAgruparPor] = useState<AgruparPor>('banco')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set())

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [contratos, procesos, rpcs, pagos] = await Promise.all([
        fetchContratosEmprestito(),
        fetchProcesosEmprestito(),
        fetchRPCsEmprestito(),
        fetchPagosEmprestitoAll(),
      ])

      const all: EmprestitoItem[] = [
        ...contratos.map((c: any) => ({ ...c, tipo_entidad: 'contrato' })),
        ...procesos.map((p: any) => ({ ...p, tipo_entidad: 'proceso' })),
        ...rpcs.map((r: any) => ({ ...r, tipo_entidad: 'rpc' })),
        ...pagos.map((p: any) => ({ ...p, tipo_entidad: 'pago' })),
      ]

      // Filtrar por centro gestor si es necesario
      let resultado = all
      if (!canViewAll && userCentroGestor) {
        const normalizado = userCentroGestor
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
        resultado = all.filter((item) => {
          const centro = (item.nombre_centro_gestor || item.centro_gestor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
          return centro === normalizado || centro.includes(normalizado) || normalizado.includes(centro)
        })
      }

      setItems(resultado)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos de empréstito')
    } finally {
      setLoading(false)
    }
  }, [canViewAll, userCentroGestor])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // ── Agrupación jerárquica ────────────────────────────────────

  const datosAgrupados = useMemo(() => {
    const campoGrupo = agruparPor === 'banco'
      ? 'banco'
      : agruparPor === 'centro_gestor'
        ? 'nombre_centro_gestor'
        : 'bp'

    const term = searchTerm.toLowerCase().trim()

    const filtradas = term
      ? items.filter((i) => {
          return (
            (i.nombre_centro_gestor || '').toLowerCase().includes(term) ||
            (i.banco || '').toLowerCase().includes(term) ||
            (i.bp || '').toLowerCase().includes(term) ||
            (i.referencia_contrato || '').toLowerCase().includes(term) ||
            (i.referencia_proceso || '').toLowerCase().includes(term) ||
            (i.nombre_proyecto || '').toLowerCase().includes(term)
          )
        })
      : items

    // Nivel 1: main grouping
    const porGrupo = new Map<string, EmprestitoItem[]>()
    for (const item of filtradas) {
      const key = (item[campoGrupo] as string) || `Sin ${agruparPor}`
      if (!porGrupo.has(key)) porGrupo.set(key, [])
      porGrupo.get(key)!.push(item)
    }

    const gruposOrdenados = Array.from(porGrupo.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], 'es')
    )

    // Nivel 2: within each group, group by tipo_entidad
    return gruposOrdenados.map(([grupo, groupItems]) => {
      const porTipo = new Map<string, EmprestitoItem[]>()
      for (const item of groupItems) {
        const tipo = item.tipo_entidad || 'otro'
        if (!porTipo.has(tipo)) porTipo.set(tipo, [])
        porTipo.get(tipo)!.push(item)
      }

      const tiposOrdenados = Array.from(porTipo.entries()).sort((a, b) =>
        a[0].localeCompare(b[0], 'es')
      )

      const valorTotal = groupItems.reduce(
        (acc, i) => acc + (i.valor_contrato || i.valor_total || 0),
        0
      )

      return {
        grupo,
        totalItems: groupItems.length,
        totalTipos: tiposOrdenados.length,
        valorTotal,
        tipos: tiposOrdenados.map(([tipo, tipoItems]) => ({
          tipo,
          items: tipoItems,
          valor: tipoItems.reduce((acc, i) => acc + (i.valor_contrato || i.valor_total || 0), 0),
        })),
      }
    })
  }, [items, agruparPor, searchTerm])

  // ── Toggles ──────────────────────────────────────────────────

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSub = (key: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Render ───────────────────────────────────────────────────

  const tipoLabel: Record<string, string> = {
    contrato: 'Contratos',
    proceso: 'Procesos',
    rpc: 'RPCs',
    pago: 'Pagos',
  }

  const tipoBadge: Record<string, string> = {
    contrato: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    proceso: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    rpc: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pago: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  }

  const groupLabel: Record<AgruparPor, string> = {
    banco: 'Banco',
    centro_gestor: 'Centro Gestor',
    bp: 'BP',
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando datos de empréstito…</p>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Toggle agrupación */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agrupar por:</span>
          <div className="flex gap-1">
            {(['banco', 'centro_gestor', 'bp'] as const).map((opcion) => (
              <button
                key={opcion}
                onClick={() => {
                  setAgruparPor(opcion)
                  setExpandedGroups(new Set())
                  setExpandedSubs(new Set())
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  agruparPor === opcion
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {opcion === 'banco' && <Landmark className="w-3 h-3" />}
                {opcion === 'centro_gestor' && <Building2 className="w-3 h-3" />}
                {opcion === 'bp' && <Hash className="w-3 h-3" />}
                {groupLabel[opcion]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar banco, centro, BP, referencia…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
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
          <p className="text-xs text-blue-600 dark:text-blue-400">{groupLabel[agruparPor]}s</p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{datosAgrupados.length}</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-indigo-600 dark:text-indigo-400">Registros</p>
          <p className="text-xl font-bold text-indigo-800 dark:text-indigo-200">
            {datosAgrupados.reduce((acc, g) => acc + g.totalItems, 0)}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Valor Total</p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
            {formatCurrencyFull(datosAgrupados.reduce((acc, g) => acc + g.valorTotal, 0))}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400">Tipos de Entidad</p>
          <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
            {new Set(items.map((i) => i.tipo_entidad)).size}
          </p>
        </div>
      </div>

      {/* Listado jerárquico */}
      <div className="space-y-2">
        {datosAgrupados.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Sin datos</p>
            <p className="text-sm mt-1">No se encontraron registros de empréstito</p>
          </div>
        ) : (
          datosAgrupados.map(({ grupo, totalItems, tipos, valorTotal }) => {
            const isExpanded = expandedGroups.has(grupo)

            return (
              <div
                key={grupo}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Nivel 1: Grupo */}
                <button
                  onClick={() => toggleGroup(grupo)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {grupo}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {totalItems} registros · {formatCurrencyFull(valorTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tipos.map(({ tipo, items: tipoItems }) => (
                      <span
                        key={tipo}
                        className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${tipoBadge[tipo] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
                      >
                        {tipoItems.length} {tipoLabel[tipo] || tipo}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Nivel 2: Tipos de entidad */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      {tipos.map(({ tipo, items: tipoItems, valor }) => {
                        const subKey = `${grupo}::${tipo}`
                        const isSubExpanded = expandedSubs.has(subKey)

                        return (
                          <div key={tipo}>
                            <button
                              onClick={() => toggleSub(subKey)}
                              className="w-full flex items-center justify-between px-6 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors border-b border-slate-100 dark:border-slate-700/50"
                            >
                              <div className="flex items-center gap-2">
                                {isSubExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${tipoBadge[tipo] || 'bg-slate-100 text-slate-700'}`}>
                                  {tipoLabel[tipo] || tipo}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {tipoItems.length} registros · {formatCurrencyFull(valor)}
                                </span>
                              </div>
                            </button>

                            <AnimatePresence>
                              {isSubExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="bg-slate-50 dark:bg-slate-900/20"
                                >
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                          <th className="px-6 py-2 font-medium">Referencia</th>
                                          <th className="px-3 py-2 font-medium">Centro Gestor</th>
                                          <th className="px-3 py-2 font-medium">Banco</th>
                                          <th className="px-3 py-2 font-medium">BP</th>
                                          <th className="px-3 py-2 font-medium text-right">Valor</th>
                                          <th className="px-3 py-2 font-medium">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {tipoItems.map((item, idx) => (
                                          <tr
                                            key={item.id || idx}
                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/50"
                                          >
                                            <td className="px-6 py-2 font-mono font-medium text-slate-900 dark:text-white">
                                              {item.referencia_contrato || item.referencia_proceso || item.numero_rpc || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                              {item.nombre_centro_gestor || item.centro_gestor || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                              {item.banco || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                              {item.bp || '—'}
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-900 dark:text-white font-medium">
                                              {formatCurrencyFull(item.valor_contrato || item.valor_total || 0)}
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                {item.estado || '—'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
