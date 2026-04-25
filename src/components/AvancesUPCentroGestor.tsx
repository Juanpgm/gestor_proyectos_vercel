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
  Loader2,
  MapPin,
  Camera,
  Eye,
  EyeOff,
  BarChart3,
  Activity,
  ExternalLink,
  Download,
} from 'lucide-react'
import {
  useAvancesCentroGestor,
  CentroGestorAvancesResumen,
  IntervencionConAvances,
  AvanceUPRaw,
} from '@/hooks/useAvancesCentroGestor'
import { getCentroGestorAccessFromSession } from '@/utils/centroGestorAccess'
import { useAuth } from '@/context/AuthContext'
import { generarReporteUPsPorCentroGestor } from '@/utils/reporteUPsPdf'

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

type FiltroEstado = 'todos' | 'con_avances' | 'sin_avances' | 'completadas' | 'recientes' | 'alertas'
type OrdenCampo = 'nombre' | 'total_intervenciones' | 'con_avance' | 'ultimo_avance' | 'avances_recientes'
type OrdenDir = 'asc' | 'desc'

// ─── Componente principal ────────────────────────────────
export default function AvancesUPCentroGestor() {
  const { state: authState } = useAuth()
  const centroGestorAccess = useMemo(() => getCentroGestorAccessFromSession(), [authState.user])
  const userCentroGestor = centroGestorAccess.userCentroGestor || ''
  const canViewAll = centroGestorAccess.canViewAll

  const {
    avances,
    resumenPorCentroGestor,
    centrosConAvances,
    centrosSinAvances,
    totalAvances,
    totalIntervenciones,
    loading,
    error,
    refetch,
  } = useAvancesCentroGestor()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [ordenCampo, setOrdenCampo] = useState<OrdenCampo>('nombre')
  const [ordenDir, setOrdenDir] = useState<OrdenDir>('asc')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [detalleCentro, setDetalleCentro] = useState<string | null>(null)
  const [generandoPdf, setGenerandoPdf] = useState(false)

  // Filtrado y orden
  const listaFiltrada = useMemo(() => {
    let lista = resumenPorCentroGestor

    // Filtrar por centro_gestor del usuario si no tiene permiso de ver todo
    if (!canViewAll && userCentroGestor) {
      const normalizado = userCentroGestor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      lista = lista.filter(c => {
        const nombre = c.nombre_centro_gestor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
        return nombre === normalizado || nombre.includes(normalizado) || normalizado.includes(nombre)
      })
    }

    if (busqueda.trim()) {
      const _norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const term = _norm(busqueda.trim())
      lista = lista.filter(c => _norm(c.nombre_centro_gestor).includes(term))
    }

    switch (filtroEstado) {
      case 'con_avances':
        lista = lista.filter(c => c.intervenciones_con_avance > 0)
        break
      case 'sin_avances':
        lista = lista.filter(c => c.intervenciones_sin_avance > 0)
        break
      case 'completadas':
        lista = lista.filter(c => c.intervenciones_completadas > 0)
        break
      case 'recientes':
        lista = lista.filter(c => c.avances_ultimos_10_dias > 0)
        break
      case 'alertas':
        lista = lista.filter(c => c.tiene_alertas)
        break
    }

    if (fechaDesde || fechaHasta) {
      const desde = fechaDesde ? new Date(fechaDesde) : null
      const hasta = fechaHasta ? new Date(fechaHasta) : null
      lista = lista.filter(c => {
        if (c.total_avances === 0) return false
        return estaEnRango(c.ultimo_avance, desde, hasta)
      })
    }

    const dir = ordenDir === 'asc' ? 1 : -1
    lista = [...lista].sort((a, b) => {
      switch (ordenCampo) {
        case 'nombre':
          return dir * a.nombre_centro_gestor.localeCompare(b.nombre_centro_gestor, 'es')
        case 'total_intervenciones':
          return dir * (a.total_intervenciones - b.total_intervenciones)
        case 'con_avance':
          return dir * (a.intervenciones_con_avance - b.intervenciones_con_avance)
        case 'ultimo_avance': {
          const fa = a.ultimo_avance ? new Date(a.ultimo_avance).getTime() : 0
          const fb = b.ultimo_avance ? new Date(b.ultimo_avance).getTime() : 0
          return dir * (fa - fb)
        }
        case 'avances_recientes':
          return dir * (a.avances_ultimos_10_dias - b.avances_ultimos_10_dias)
        default:
          return 0
      }
    })

    return lista
  }, [resumenPorCentroGestor, busqueda, filtroEstado, ordenCampo, ordenDir, fechaDesde, fechaHasta, canViewAll, userCentroGestor])

  const toggleOrden = useCallback((campo: OrdenCampo) => {
    if (ordenCampo === campo) {
      setOrdenDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenCampo(campo)
      setOrdenDir(campo === 'nombre' ? 'asc' : 'desc')
    }
  }, [ordenCampo])

  const handleDescargarPdf = useCallback(async () => {
    if (generandoPdf) return
    setGenerandoPdf(true)
    try {
      await generarReporteUPsPorCentroGestor({
        resumenPorCentroGestor,
        totalIntervenciones,
        totalAvances,
      })
    } catch (err) {
      console.error('Error generando PDF de UPs:', err)
      alert(`Error al generar el reporte PDF: ${(err as Error)?.message || 'Error desconocido'}`)
    } finally {
      setGenerandoPdf(false)
    }
  }, [generandoPdf, resumenPorCentroGestor, totalIntervenciones, totalAvances])

  // ─── Render ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Cargando avances por Centro Gestor...
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
          <p className="text-red-600 font-semibold">Error al cargar datos</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={refetch} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const totalConAvances = centrosConAvances.length
  const totalSinAvances = centrosSinAvances.length
  const totalCompletadas = resumenPorCentroGestor.filter(c => c.intervenciones_completadas > 0).length
  const totalConRecientes = resumenPorCentroGestor.filter(c => c.avances_ultimos_10_dias > 0).length
  const totalConAlertas = resumenPorCentroGestor.filter(c => c.tiene_alertas).length

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          label="Con Avances Reportados"
          value={totalConAvances}
          icon={CheckCircle2}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-950/40"
          border="border-emerald-200 dark:border-emerald-800/60"
        />
        <MetricCard
          label="Completadas (100%)"
          value={totalCompletadas}
          icon={CheckCircle2}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-950/40"
          border="border-blue-200 dark:border-blue-800/60"
        />
        <MetricCard
          label="Sin Avances Reportados"
          value={totalSinAvances}
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
          label="Con Alertas (sin avance activo)"
          value={totalConAlertas}
          icon={AlertTriangle}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-950/40"
          border="border-amber-200 dark:border-amber-800/60"
        />
      </div>

      {/* Resumen general */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-500" />
          <strong className="text-gray-900 dark:text-gray-100">{totalIntervenciones}</strong> intervenciones totales
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-green-500" />
          <strong className="text-gray-900 dark:text-gray-100">{totalAvances}</strong> avances reportados
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-purple-500" />
          <strong className="text-gray-900 dark:text-gray-100">{resumenPorCentroGestor.length}</strong> centros gestores
        </span>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700/80 p-4 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar centro gestor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {([
              ['todos', 'Todos', Filter],
              ['con_avances', 'Con avances', CheckCircle2],
              ['completadas', 'Completadas', CheckCircle2],
              ['sin_avances', 'Sin avances', XCircle],
              ['recientes', 'Últimos 10 días', Clock],
              ['alertas', 'Alertas', AlertTriangle],
            ] as [FiltroEstado, string, React.ElementType][]).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setFiltroEstado(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filtroEstado === id
                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm shadow-blue-600/20 dark:shadow-blue-500/20'
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
          {canViewAll && (
            <button
              onClick={handleDescargarPdf}
              disabled={generandoPdf || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              title="Descargar reporte PDF por centro gestor"
            >
              {generandoPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {generandoPdf ? 'Generando...' : 'Reporte PDF'}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Rango de fechas:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
          />
          {(fechaDesde || fechaHasta) && (
            <button
              onClick={() => { setFechaDesde(''); setFechaHasta('') }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700/80 overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/80 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          <SortableHeader className="col-span-3" label="Centro Gestor" campo="nombre" actual={ordenCampo} dir={ordenDir} onClick={toggleOrden} />
          <SortableHeader className="col-span-2 text-center" label="Intervenciones" campo="total_intervenciones" actual={ordenCampo} dir={ordenDir} onClick={toggleOrden} />
          <SortableHeader className="col-span-2 text-center" label="Con Avance" campo="con_avance" actual={ordenCampo} dir={ordenDir} onClick={toggleOrden} />
          <SortableHeader className="col-span-1 text-center" label="Últ. 10d" campo="avances_recientes" actual={ordenCampo} dir={ordenDir} onClick={toggleOrden} />
          <SortableHeader className="col-span-2 text-center" label="Último Avance" campo="ultimo_avance" actual={ordenCampo} dir={ordenDir} onClick={toggleOrden} />
          <div className="col-span-2 text-center">Estado</div>
        </div>

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
                onToggle={() => setExpandido(expandido === cg.nombre_centro_gestor ? null : cg.nombre_centro_gestor)}
                onVerDetalle={() => setDetalleCentro(detalleCentro === cg.nombre_centro_gestor ? null : cg.nombre_centro_gestor)}
              />
            ))
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700/80 text-xs text-gray-500 dark:text-gray-400">
          Mostrando {listaFiltrada.length} de {resumenPorCentroGestor.length} centros gestores · {totalAvances} avances totales · {totalIntervenciones} intervenciones
        </div>
      </div>

      {/* Panel detalle */}
      <AnimatePresence>
        {detalleCentro && (
          <motion.div
            key={detalleCentro}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <DetalleIntervencionesPanel
              centroGestor={detalleCentro}
              data={resumenPorCentroGestor.find(c => c.nombre_centro_gestor === detalleCentro)}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
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
    className={`flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-100 transition-colors ${actual === campo ? 'text-blue-600 dark:text-blue-400' : ''} ${className}`}
    onClick={() => onClick(campo)}
  >
    {label}
    {actual === campo && (
      dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    )}
  </button>
)

const CentroGestorRow: React.FC<{
  data: CentroGestorAvancesResumen
  isExpanded: boolean
  onToggle: () => void
  onVerDetalle: () => void
}> = ({ data, isExpanded, onToggle, onVerDetalle }) => {
  const sinAvances = data.intervenciones_con_avance === 0 && data.intervenciones_completadas === 0
  const dias = diasDesde(data.ultimo_avance)
  const porcentajeConAvance = data.total_intervenciones > 0
    ? Math.round(((data.intervenciones_con_avance + data.intervenciones_completadas) / data.total_intervenciones) * 100)
    : 0

  return (
    <div>
      <div
        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
          sinAvances ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
        }`}
        onClick={onToggle}
      >
        {/* Nombre */}
        <div className="col-span-3 flex items-center gap-2">
          <Building2 className={`w-4 h-4 flex-shrink-0 ${sinAvances ? 'text-rose-400 dark:text-rose-500' : 'text-blue-500 dark:text-blue-400'}`} />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {data.nombre_centro_gestor}
          </span>
        </div>

        {/* Total intervenciones */}
        <div className="col-span-2 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300">
            {data.total_intervenciones}
          </span>
        </div>

        {/* Con avance */}
        <div className="col-span-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              sinAvances
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}>
              {data.intervenciones_con_avance + data.intervenciones_completadas}/{data.total_intervenciones}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {porcentajeConAvance}%
            </span>
          </div>
        </div>

        {/* Últimos 10 días */}
        <div className="col-span-1 text-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
            data.avances_ultimos_10_dias > 0
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400'
          }`}>
            {data.avances_ultimos_10_dias}
          </span>
        </div>

        {/* Último avance */}
        <div className="col-span-2 text-center text-xs text-gray-600 dark:text-gray-400">
          {data.ultimo_avance ? (
            <div>
              <div>{formatFecha(data.ultimo_avance)}</div>
              {dias !== null && (
                <div className={`text-xs ${dias > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  hace {dias}d
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">—</span>
          )}
        </div>

        {/* Estado */}
        <div className="col-span-2 flex items-center justify-center gap-2">
          {sinAvances ? (
            <span className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <EyeOff className="w-3.5 h-3.5" /> Sin avances
            </span>
          ) : data.tiene_alertas ? (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Parcial
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Al día
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onVerDetalle() }}
            className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            Detalle
          </button>
        </div>
      </div>

      {/* Expandido: lista rápida de intervenciones */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-3 bg-gray-50/80 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700/40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.intervenciones.slice(0, 12).map(int => (
                  <IntervencionMiniCard key={int.intervencion_id} data={int} />
                ))}
              </div>
              {data.intervenciones.length > 12 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                  ... y {data.intervenciones.length - 12} intervenciones más. Use &quot;Detalle&quot; para ver todas.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const IntervencionMiniCard: React.FC<{ data: IntervencionConAvances }> = ({ data }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
    data.tiene_avances
      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
      : data.esta_completada
        ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40'
        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/40'
  }`}>
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
      data.tiene_avances ? 'bg-emerald-500' : data.esta_completada ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
    }`} />
    <div className="min-w-0 flex-1">
      <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{data.intervencion_id}</div>
      <div className="text-gray-500 dark:text-gray-400 truncate">
        {data.tipo_intervencion} · {data.estado}
        {data.esta_completada && !data.tiene_avances && ' · Completada'}
      </div>
    </div>
    <div className="text-right flex-shrink-0">
      <div className={`font-bold ${data.esta_completada ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{data.avance_obra_intervencion}%</div>
      {data.tiene_avances ? (
        <div className="text-gray-400 dark:text-gray-500">{data.avances.length} av.</div>
      ) : data.esta_completada ? (
        <div className="text-blue-500 dark:text-blue-400 text-[10px] font-semibold">Completada</div>
      ) : null}
    </div>
  </div>
)

// ─── Panel de detalle ────────────────────────────────────

const DetalleIntervencionesPanel: React.FC<{
  centroGestor: string
  data: CentroGestorAvancesResumen | undefined
  fechaDesde: string
  fechaHasta: string
  onClose: () => void
}> = ({ centroGestor, data, fechaDesde, fechaHasta, onClose }) => {
  const [filtroDetalle, setFiltroDetalle] = useState<'todas' | 'con_avance' | 'sin_avance' | 'completadas'>('todas')
  const [expandidoInt, setExpandidoInt] = useState<string | null>(null)

  if (!data) return null

  const desde = fechaDesde ? new Date(fechaDesde) : null
  const hasta = fechaHasta ? new Date(fechaHasta) : null

  let intervencionesFiltradas = data.intervenciones
  if (filtroDetalle === 'con_avance') {
    intervencionesFiltradas = intervencionesFiltradas.filter(i => i.tiene_avances)
  } else if (filtroDetalle === 'sin_avance') {
    intervencionesFiltradas = intervencionesFiltradas.filter(i => !i.tiene_avances && !i.esta_completada)
  } else if (filtroDetalle === 'completadas') {
    intervencionesFiltradas = intervencionesFiltradas.filter(i => i.esta_completada)
  }

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-xl border border-blue-200 dark:border-blue-800/60 shadow-md overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-5 py-4 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/60">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{centroGestor}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.total_intervenciones} intervenciones · {data.total_avances} avances reportados ·
              {data.intervenciones_completadas > 0 && ` ${data.intervenciones_completadas} completada${data.intervenciones_completadas !== 1 ? 's' : ''} ·`}
              Avance promedio: {data.avance_obra_promedio.toFixed(1)}%
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-gray-500 dark:text-gray-400 transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros detalle */}
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 flex gap-2 flex-wrap">
        {([
          ['todas', 'Todas', null],
          ['con_avance', `Con avance (${data.intervenciones_con_avance})`, Eye],
          ['completadas', `Completadas (${data.intervenciones_completadas})`, CheckCircle2],
          ['sin_avance', `Sin avance (${data.intervenciones_sin_avance})`, EyeOff],
        ] as [typeof filtroDetalle, string, React.ElementType | null][]).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setFiltroDetalle(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filtroDetalle === id
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600/80'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Lista de intervenciones */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700/40 max-h-[500px] overflow-y-auto">
        {intervencionesFiltradas.length === 0 ? (
          <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
            No hay intervenciones con los filtros actuales
          </div>
        ) : (
          intervencionesFiltradas.map(int => (
            <IntervencionDetalleRow
              key={int.intervencion_id}
              data={int}
              isExpanded={expandidoInt === int.intervencion_id}
              onToggle={() => setExpandidoInt(expandidoInt === int.intervencion_id ? null : int.intervencion_id)}
              fechaDesde={desde}
              fechaHasta={hasta}
            />
          ))
        )}
      </div>
    </div>
  )
}

const IntervencionDetalleRow: React.FC<{
  data: IntervencionConAvances
  isExpanded: boolean
  onToggle: () => void
  fechaDesde: Date | null
  fechaHasta: Date | null
}> = ({ data, isExpanded, onToggle, fechaDesde, fechaHasta }) => {
  // Filtrar avances por rango de fechas si aplica
  const avancesFiltrados = useMemo(() => {
    if (!fechaDesde && !fechaHasta) return data.avances
    return data.avances.filter(a => estaEnRango(a.created_at, fechaDesde, fechaHasta))
  }, [data.avances, fechaDesde, fechaHasta])

  return (
    <div>
      <div
        className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors ${
          !data.tiene_avances && !data.esta_completada ? 'bg-rose-50/40 dark:bg-rose-950/10' : data.esta_completada && !data.tiene_avances ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
        }`}
        onClick={onToggle}
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          data.tiene_avances ? 'bg-emerald-500' : data.esta_completada ? 'bg-blue-500' : 'bg-rose-400 dark:bg-rose-500'
        }`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{data.intervencion_id}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
              {data.upid}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {data.tipo_intervencion} · {data.estado}
            {data.fecha_inicio && ` · Inicio: ${formatFechaCorta(data.fecha_inicio)}`}
            {data.fecha_fin && ` · Fin: ${formatFechaCorta(data.fecha_fin)}`}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Barra de progreso */}
          <div className="w-24">
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-gray-500 dark:text-gray-400">Avance</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{data.avance_obra_intervencion}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(data.avance_obra_intervencion, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">
            {data.esta_completada && !data.tiene_avances ? (
              <span className="text-blue-600 dark:text-blue-400 font-semibold">100%</span>
            ) : (
              <>{data.avances.length} avance{data.avances.length !== 1 ? 's' : ''}</>              
            )}
          </div>

          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Historial de avances */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 bg-gray-50/80 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/30">
              {avancesFiltrados.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                  {data.esta_completada && !data.tiene_avances
                    ? 'Intervención completada al 100% — no requiere más reportes de avance'
                    : data.tiene_avances ? 'No hay avances en el rango de fechas seleccionado' : 'No se han reportado avances para esta intervención'}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Historial de avances ({avancesFiltrados.length})
                  </p>
                  {avancesFiltrados.map((av, idx) => (
                    <AvanceHistorialCard key={av.id} avance={av} isLatest={idx === 0} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const AvanceHistorialCard: React.FC<{
  avance: AvanceUPRaw
  isLatest: boolean
}> = ({ avance, isLatest }) => {
  const [showMedia, setShowMedia] = React.useState(false)
  const [lightboxImg, setLightboxImg] = React.useState<string | null>(null)

  const imagenes = avance.imagenes_urls?.filter(Boolean) || []
  const documentos = avance.documentos_urls?.filter(Boolean) || []
  const tieneAdjuntos = imagenes.length > 0 || documentos.length > 0

  const fileNameFromUrl = (url: string, fallback: string): string => {
    const clean = url.split('?')[0]
    const name = clean.split('/').pop()
    if (!name) return fallback
    try { return decodeURIComponent(name) } catch { return name }
  }

  return (
    <>
      <div className={`rounded-lg border text-xs ${
        isLatest
          ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40'
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/40'
      }`}>
        <div className="flex items-start gap-3 px-3 py-2.5">
          <div className="flex-shrink-0 mt-0.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isLatest
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400'
            }`}>
              {avance.avance_obra}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800 dark:text-gray-200">{avance.avance_obra}% avance</span>
              {isLatest && (
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase">
                  Más reciente
                </span>
              )}
              <span className="text-gray-400 dark:text-gray-500">·</span>
              <span className="text-gray-500 dark:text-gray-400">{formatFecha(avance.created_at)}</span>
              {avance.registrado_por && (
                <>
                  <span className="text-gray-400 dark:text-gray-500">·</span>
                  <span className="text-gray-500 dark:text-gray-400">por {avance.registrado_por}</span>
                </>
              )}
            </div>
            {avance.observaciones && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{avance.observaciones}</p>
            )}
            {tieneAdjuntos && (
              <div className="flex items-center gap-3 mt-1.5">
                {imagenes.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <Camera className="w-3 h-3" /> {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}
                  </span>
                )}
                {documentos.length > 0 && (
                  <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <FileText className="w-3 h-3" /> {documentos.length} doc{documentos.length !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  onClick={() => setShowMedia(!showMedia)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
                >
                  {showMedia ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showMedia ? 'Ocultar' : 'Ver adjuntos'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Adjuntos expandidos */}
        <AnimatePresence>
          {showMedia && tieneAdjuntos && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-700/30 mt-1">
                {/* Fotos */}
                {imagenes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                      Fotos ({imagenes.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {imagenes.map((url, idx) => (
                        <button
                          key={`img-${idx}`}
                          onClick={() => setLightboxImg(url)}
                          className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-800"
                        >
                          <img
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Documentos */}
                {documentos.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                      Documentos ({documentos.length})
                    </p>
                    <div className="space-y-1.5">
                      {documentos.map((url, idx) => {
                        const nombre = fileNameFromUrl(url, `Documento ${idx + 1}`)
                        return (
                          <div key={`doc-${idx}`} className="flex items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{nombre}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 ml-auto" />
                            </a>
                            <a
                              href={url}
                              download
                              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              title="Descargar"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={lightboxImg}
              alt="Vista ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <a
                href={lightboxImg}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setLightboxImg(null)}
                className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow"
                title="Cerrar"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
