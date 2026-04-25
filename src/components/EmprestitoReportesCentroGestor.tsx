'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Clock,
  Filter,
  BarChart3,
  Loader2,
} from 'lucide-react'
import {
  useReportesCentroGestorDashboard,
  CentroGestorResumen,
} from '@/hooks/useReportesCentroGestor'
import type { ReporteContrato } from '@/types/avances-emprestito'

// ─── Helpers ─────────────────────────────────────────────
function formatFecha(fecha: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatFechaCorta(fecha: string | null): string {
  if (!fecha) return '—'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
}

function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function estaEnRango(fecha: string | null | undefined, desde: Date | null, hasta: Date | null): boolean {
  if (!fecha) return false
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return false
  if (desde && d < desde) return false
  if (hasta) {
    const hastaFin = new Date(hasta)
    hastaFin.setHours(23, 59, 59, 999)
    if (d > hastaFin) return false
  }
  return true
}

type FiltroEstado = 'todos' | 'con_reportes' | 'sin_reportes' | 'recientes' | 'alertas'
type OrdenCampo = 'nombre' | 'total_reportes' | 'ultimo_reporte' | 'reportes_recientes'
type OrdenDir = 'asc' | 'desc'

// ─── Componente principal ────────────────────────────────
const EmprestitoReportesCentroGestor: React.FC = () => {
  const {
    reportes,
    resumenPorCentroGestor,
    centrosConReportes,
    centrosSinReportes,
    totalReportes,
    loading,
    error,
    refetch,
  } = useReportesCentroGestorDashboard()

  // State
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>('nombre')
  const [ordenDir, setOrdenDir] = useState<OrdenDir>('asc')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [detalleCentro, setDetalleCentro] = useState<string | null>(null)

  // Merge con/sin reportes para vista unificada
  const listaCompleta = useMemo((): CentroGestorResumen[] => {
    const sinReportes: CentroGestorResumen[] = centrosSinReportes.map(cg => ({
      nombre_centro_gestor: cg,
      total_reportes: 0,
      reportes_ultimos_10_dias: 0,
      ultimo_reporte: null,
      primer_reporte: null,
      contratos_reportados: [],
      ultimo_avance_fisico: 0,
      ultimo_avance_financiero: 0,
      tiene_alertas: false,
    }))
    return [...resumenPorCentroGestor, ...sinReportes]
  }, [resumenPorCentroGestor, centrosSinReportes])

  // Filtrado
  const listaFiltrada = useMemo(() => {
    let lista = listaCompleta

    // Búsqueda por texto
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim()
      lista = lista.filter(c => c.nombre_centro_gestor.toLowerCase().includes(term))
    }

    // Filtro de estado
    switch (filtroEstado) {
      case 'con_reportes':
        lista = lista.filter(c => c.total_reportes > 0)
        break
      case 'sin_reportes':
        lista = lista.filter(c => c.total_reportes === 0)
        break
      case 'recientes':
        lista = lista.filter(c => c.reportes_ultimos_10_dias > 0)
        break
      case 'alertas':
        lista = lista.filter(c => c.tiene_alertas)
        break
    }

    // Rango de fechas (aplicado sobre último reporte)
    if (fechaDesde || fechaHasta) {
      const desde = fechaDesde ? new Date(fechaDesde) : null
      const hasta = fechaHasta ? new Date(fechaHasta) : null
      lista = lista.filter(c => {
        if (c.total_reportes === 0) return false
        return estaEnRango(c.ultimo_reporte, desde, hasta)
      })
    }

    // Orden
    const dir = ordenDir === 'asc' ? 1 : -1
    lista = [...lista].sort((a, b) => {
      switch (ordenCampo) {
        case 'nombre':
          return dir * a.nombre_centro_gestor.localeCompare(b.nombre_centro_gestor, 'es')
        case 'total_reportes':
          return dir * (a.total_reportes - b.total_reportes)
        case 'ultimo_reporte': {
          const fa = a.ultimo_reporte ? new Date(a.ultimo_reporte).getTime() : 0
          const fb = b.ultimo_reporte ? new Date(b.ultimo_reporte).getTime() : 0
          return dir * (fa - fb)
        }
        case 'reportes_recientes':
          return dir * (a.reportes_ultimos_10_dias - b.reportes_ultimos_10_dias)
        default:
          return 0
      }
    })

    return lista
  }, [listaCompleta, busqueda, filtroEstado, ordenCampo, ordenDir, fechaDesde, fechaHasta])

  // Reportes filtrados por centro gestor para detalle
  const reportesDelCentro = useMemo((): ReporteContrato[] => {
    if (!detalleCentro) return []
    const desde = fechaDesde ? new Date(fechaDesde) : null
    const hasta = fechaHasta ? new Date(fechaHasta) : null
    return reportes.filter(r => {
      if ((r.nombre_centro_gestor || '').trim() !== detalleCentro) return false
      if (desde || hasta) return estaEnRango(r.fecha_reporte, desde, hasta)
      return true
    })
  }, [reportes, detalleCentro, fechaDesde, fechaHasta])

  const toggleOrden = useCallback((campo: OrdenCampo) => {
    if (ordenCampo === campo) {
      setOrdenDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenCampo(campo)
      setOrdenDir(campo === 'nombre' ? 'asc' : 'desc')
    }
  }, [ordenCampo])

  // ─── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Cargando reportes por Centro Gestor...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <XCircle className="w-10 h-10 text-red-500 mx-auto" />
          <p className="text-red-600 font-semibold">Error al cargar reportes</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={refetch} className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const totalConReportes = centrosConReportes.length
  const totalSinReportes = centrosSinReportes.length
  const totalConRecientes = resumenPorCentroGestor.filter(c => c.reportes_ultimos_10_dias > 0).length
  const totalConAlertas = resumenPorCentroGestor.filter(c => c.tiene_alertas).length

  return (
    <div className="space-y-6">
      {/* Header + métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Con Reportes"
          value={totalConReportes}
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
          border="border-emerald-200 dark:border-emerald-800/60"
        />
        <MetricCard
          label="Sin Reportes"
          value={totalSinReportes}
          icon={XCircle}
          color="text-rose-600 dark:text-rose-400"
          bg="bg-rose-50 dark:bg-rose-950/40"
          border="border-rose-200 dark:border-rose-800/60"
        />
        <MetricCard
          label="Reportaron últimos 10 días"
          value={totalConRecientes}
          icon={Clock}
          color="text-sky-600 dark:text-sky-400"
          bg="bg-sky-50 dark:bg-sky-950/40"
          border="border-sky-200 dark:border-sky-800/60"
        />
        <MetricCard
          label="Con Alertas Activas"
          value={totalConAlertas}
          icon={AlertTriangle}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-950/40"
          border="border-amber-200 dark:border-amber-800/60"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700/80 p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar centro gestor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 dark:focus:border-teal-400 transition-colors"
            />
          </div>
          {/* Botones filtro estado */}
          <div className="flex gap-1.5 flex-wrap">
            {([
              ['todos', 'Todos', Filter],
              ['con_reportes', 'Con reportes', CheckCircle2],
              ['sin_reportes', 'Sin reportes', XCircle],
              ['recientes', 'Últimos 10 días', Clock],
              ['alertas', 'Alertas', AlertTriangle],
            ] as [FiltroEstado, string, React.ElementType][]).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setFiltroEstado(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtroEstado === id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-sm shadow-teal-600/20 dark:shadow-teal-500/20'
                    : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/80 border border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/70 hover:bg-gray-200 dark:hover:bg-gray-600/80 text-gray-600 dark:text-gray-300 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Rango de fechas */}
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rango de fechas:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta('') }}
              className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {/* Tabla de centros gestores */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700/80 overflow-hidden shadow-sm">
        {/* Header de tabla */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/80 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <SortableHeader
            className="col-span-4"
            label="Centro Gestor"
            campo="nombre"
            actual={ordenCampo}
            dir={ordenDir}
            onClick={toggleOrden}
          />
          <SortableHeader
            className="col-span-2 text-center"
            label="Reportes"
            campo="total_reportes"
            actual={ordenCampo}
            dir={ordenDir}
            onClick={toggleOrden}
          />
          <SortableHeader
            className="col-span-2 text-center"
            label="Últimos 10d"
            campo="reportes_recientes"
            actual={ordenCampo}
            dir={ordenDir}
            onClick={toggleOrden}
          />
          <SortableHeader
            className="col-span-2 text-center"
            label="Último Reporte"
            campo="ultimo_reporte"
            actual={ordenCampo}
            dir={ordenDir}
            onClick={toggleOrden}
          />
          <div className="col-span-2 text-center">Estado</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-[600px] overflow-y-auto">
          {listaFiltrada.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
              No se encontraron centros gestores con los filtros actuales
            </div>
          ) : (
            listaFiltrada.map(cg => (
              <CentroGestorRow
                key={cg.nombre_centro_gestor}
                data={cg}
                isExpanded={expandido === cg.nombre_centro_gestor}
                onToggle={() => setExpandido(
                  expandido === cg.nombre_centro_gestor ? null : cg.nombre_centro_gestor
                )}
                onVerDetalle={() => setDetalleCentro(
                  detalleCentro === cg.nombre_centro_gestor ? null : cg.nombre_centro_gestor
                )}
              />
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700/80 text-xs text-gray-500 dark:text-gray-400">
          Mostrando {listaFiltrada.length} de {listaCompleta.length} centros gestores · {totalReportes} reportes totales
        </div>
      </div>

      {/* Panel de detalle por centro gestor */}
      <AnimatePresence>
        {detalleCentro && (
          <motion.div
            key={detalleCentro}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <DetalleReportesCentro
              centroGestor={detalleCentro}
              reportes={reportesDelCentro}
              onClose={() => setDetalleCentro(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Sub-componentes ─────────────────────────────────────

const MetricCard: React.FC<{
  label: string; value: number; icon: React.ElementType; color: string; bg: string; border?: string
}> = ({ label, value, icon: Icon, color, bg, border = 'border-gray-200 dark:border-gray-700' }) => (
  <div className={`rounded-xl border p-4 shadow-sm transition-colors ${bg} ${border}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-white/60 dark:bg-white/5 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{value}</p>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </div>
)

const SortableHeader: React.FC<{
  label: string; campo: OrdenCampo; actual: OrdenCampo; dir: OrdenDir
  onClick: (campo: OrdenCampo) => void; className?: string
}> = ({ label, campo, actual, dir, onClick, className }) => (
  <button
    className={`flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-100 transition-colors ${actual === campo ? 'text-teal-600 dark:text-teal-400' : ''} ${className}`}
    onClick={() => onClick(campo)}
  >
    {label}
    {actual === campo && (
      dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    )}
  </button>
)

const CentroGestorRow: React.FC<{
  data: CentroGestorResumen
  isExpanded: boolean
  onToggle: () => void
  onVerDetalle: () => void
}> = ({ data, isExpanded, onToggle, onVerDetalle }) => {
  const sinReportes = data.total_reportes === 0
  const dias = diasDesde(data.ultimo_reporte)
  const esReciente = dias !== null && dias <= 10

  return (
    <div>
      <div
        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
          sinReportes ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
        }`}
        onClick={onToggle}
      >
        {/* Nombre */}
        <div className="col-span-4 flex items-center gap-2">
          <Building2 className={`w-4 h-4 flex-shrink-0 ${sinReportes ? 'text-rose-400 dark:text-rose-500' : 'text-teal-500 dark:text-teal-400'}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {data.nombre_centro_gestor}
          </span>
        </div>

        {/* Total reportes */}
        <div className="col-span-2 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            sinReportes
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
          }`}>
            {data.total_reportes}
          </span>
        </div>

        {/* Últimos 10 días */}
        <div className="col-span-2 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            data.reportes_ultimos_10_dias > 0
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400'
          }`}>
            {data.reportes_ultimos_10_dias}
          </span>
        </div>

        {/* Último reporte */}
        <div className="col-span-2 text-center text-xs text-gray-600 dark:text-gray-300">
          {data.ultimo_reporte ? (
            <div>
              <div>{formatFechaCorta(data.ultimo_reporte)}</div>
              {dias !== null && (
                <div className={`text-[10px] ${esReciente ? 'text-emerald-600 dark:text-emerald-400' : dias > 30 ? 'text-rose-500 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  hace {dias}d
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-600">—</span>
          )}
        </div>

        {/* Estado */}
        <div className="col-span-2 flex items-center justify-center gap-1.5">
          {sinReportes ? (
            <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Sin reportes
            </span>
          ) : esReciente ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Al día
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> Pendiente
            </span>
          )}
          {data.tiene_alertas && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          )}
        </div>
      </div>

      {/* Expandir detalles del centro gestor */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Total reportes:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{data.total_reportes}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Contratos reportados:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{data.contratos_reportados.length}</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Último avance físico:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{data.ultimo_avance_fisico.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500">Último avance financiero:</span>{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{data.ultimo_avance_financiero.toFixed(1)}%</span>
                </div>
              </div>
              {data.contratos_reportados.length > 0 && (
                <div className="text-xs">
                  <span className="text-gray-400 dark:text-gray-500">Contratos: </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {data.contratos_reportados.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <span>Primer reporte: {formatFecha(data.primer_reporte)}</span>
                <span>·</span>
                <span>Último: {formatFecha(data.ultimo_reporte)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onVerDetalle() }}
                className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Ver historial completo de reportes
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Panel de detalle ────────────────────────────────────
const DetalleReportesCentro: React.FC<{
  centroGestor: string
  reportes: ReporteContrato[]
  onClose: () => void
}> = ({ centroGestor, reportes, onClose }) => {
  // Agrupar por contrato
  const porContrato = useMemo(() => {
    const mapa = new Map<string, ReporteContrato[]>()
    for (const r of reportes) {
      const ref = r.referencia_contrato || 'Sin referencia'
      if (!mapa.has(ref)) mapa.set(ref, [])
      mapa.get(ref)!.push(r)
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b, 'es'))
  }, [reportes])

  return (
    <div className="bg-white dark:bg-gray-800/95 rounded-xl border-2 border-teal-200 dark:border-teal-600/40 p-5 space-y-4 shadow-lg shadow-teal-500/5 dark:shadow-teal-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">{centroGestor}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{reportes.length} reportes · {porContrato.length} contratos</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
        >
          Cerrar ✕
        </button>
      </div>

      {reportes.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-6">
          No hay reportes para este centro gestor en el rango seleccionado
        </p>
      ) : (
        <div className="space-y-4">
          {porContrato.map(([ref, reps]) => (
            <div key={ref} className="border border-gray-200 dark:border-gray-700/60 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{ref}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded-full">{reps.length} reportes</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {reps.map((r, i) => (
                  <div key={r.id || i} className="px-4 py-3 text-xs grid grid-cols-12 gap-2 items-start hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="col-span-2 text-gray-500 dark:text-gray-400 font-medium">{formatFecha(r.fecha_reporte)}</div>
                    <div className="col-span-2">
                      <div className="text-gray-400 dark:text-gray-500">Físico</div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">{(r.avance_fisico || 0).toFixed(1)}%</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400 dark:text-gray-500">Financiero</div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">{(r.avance_financiero || 0).toFixed(1)}%</div>
                    </div>
                    <div className="col-span-4 text-gray-600 dark:text-gray-300 line-clamp-2">
                      {r.observaciones || '—'}
                    </div>
                    <div className="col-span-2 text-right">
                      {r.alertas?.es_alerta && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Alerta
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

EmprestitoReportesCentroGestor.displayName = 'EmprestitoReportesCentroGestor'

export default EmprestitoReportesCentroGestor
