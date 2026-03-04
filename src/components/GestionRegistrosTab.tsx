'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  MapPin,
  X,
} from 'lucide-react'
import { formatCurrencyFull } from '@/utils/formatCurrency'
import {
  crearUnidadProyecto,
  crearIntervencion,
  eliminarUnidadProyecto,
  eliminarIntervencion,
  crearSolicitudCambioUP,
  crearSolicitudCambioIntervencion,
  type CrearUnidadProyectoPayload,
  type CrearIntervencionPayload,
  type SolicitudCambioUPPayload,
  type SolicitudCambioIntervencionPayload,
} from '@/services/unidades-proyecto.service'

// ─── tipos locales ────────────────────────────────────────────────

interface UP {
  upid: string
  nombre_up: string
  nombre_up_detalle?: string
  estado?: string
  tipo_intervencion?: string
  tipo_equipamiento?: string
  clase_up?: string
  nombre_centro_gestor?: string
  comuna_corregimiento?: string
  barrio_vereda?: string
  frente_activo?: string
  fuente_financiacion?: string
  direccion?: string
  ano?: number
  avance_obra?: number
  presupuesto_base?: number
  fecha_inicio?: string
  fecha_fin?: string
  identificador?: string
  descripcion_intervencion?: string
  referencia_contrato?: string
  referencia_proceso?: string
  url_proceso?: string
}

interface Intervencion {
  intervencion_id: string
  upid: string
  tipo_intervencion?: string
  avance_obra?: number
  presupuesto_base?: number
  nombre_centro_gestor?: string
  estado?: string
  identificador?: string
  fecha_inicio?: string
  fecha_fin?: string
  descripcion_intervencion?: string
  fuente_financiacion?: string
  referencia_contrato?: string
  referencia_proceso?: string
  url_proceso?: string
  clase_up?: string
  bpin?: string | number
  cantidad?: number
  unidad?: string
}

// ─── Formulario campo genérico ────────────────────────────────────

const Field: React.FC<{
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}> = ({ label, value, onChange, type = 'text', required, placeholder }) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
)

// ─── Modal genérico ───────────────────────────────────────────────

const Modal: React.FC<{
  title: string
  onClose: () => void
  children: React.ReactNode
}> = ({ title, onClose, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  </motion.div>
)

// ─── Formulario Crear UP ──────────────────────────────────────────

const CrearUPForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState<CrearUnidadProyectoPayload>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await crearUnidadProyecto(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear UP')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof CrearUnidadProyectoPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre UP" value={form.nombre_up || ''} onChange={set('nombre_up')} placeholder="Nombre de la UP" />
        <Field label="Nombre Detalle" value={form.nombre_up_detalle || ''} onChange={set('nombre_up_detalle')} />
        <Field label="Estado" value={form.estado || ''} onChange={set('estado')} />
        <Field label="Tipo Intervención" value={form.tipo_intervencion || ''} onChange={set('tipo_intervencion')} />
        <Field label="Tipo Equipamiento" value={form.tipo_equipamiento || ''} onChange={set('tipo_equipamiento')} />
        <Field label="Clase UP" value={form.clase_up || ''} onChange={set('clase_up')} />
        <Field label="Centro Gestor" value={form.nombre_centro_gestor || ''} onChange={set('nombre_centro_gestor')} />
        <Field label="Comuna / Corregimiento" value={form.comuna_corregimiento || ''} onChange={set('comuna_corregimiento')} />
        <Field label="Barrio / Vereda" value={form.barrio_vereda || ''} onChange={set('barrio_vereda')} />
        <Field label="Frente Activo" value={form.frente_activo || ''} onChange={set('frente_activo')} />
        <Field label="Fuente Financiación" value={form.fuente_financiacion || ''} onChange={set('fuente_financiacion')} />
        <Field label="Dirección" value={form.direccion || ''} onChange={set('direccion')} />
        <Field label="Año" value={form.ano || ''} onChange={(v) => setForm((p) => ({ ...p, ano: Number(v) || undefined }))} type="number" />
        <Field label="Avance Obra (%)" value={form.avance_obra ?? ''} onChange={(v) => setForm((p) => ({ ...p, avance_obra: Number(v) }))} type="number" />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={(v) => setForm((p) => ({ ...p, presupuesto_base: Number(v) }))} type="number" />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creando…' : 'Crear UP'}
        </button>
      </div>
    </form>
  )
}

// ─── Formulario Crear Intervención ────────────────────────────────

const CrearIntervencionForm: React.FC<{ defaultUpid?: string; onSuccess: () => void; onClose: () => void }> = ({ defaultUpid, onSuccess, onClose }) => {
  const [form, setForm] = useState<CrearIntervencionPayload>({ upid: defaultUpid || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.upid.trim()) {
      setError('El UPID es obligatorio')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await crearIntervencion(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear intervención')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof CrearIntervencionPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="UPID" value={form.upid} onChange={set('upid')} required placeholder="ID de la UP padre" />
        <Field label="Estado" value={form.estado || ''} onChange={set('estado')} />
        <Field label="Tipo Intervención" value={form.tipo_intervencion || ''} onChange={set('tipo_intervencion')} />
        <Field label="Centro Gestor" value={form.nombre_centro_gestor || ''} onChange={set('nombre_centro_gestor')} />
        <Field label="Identificador" value={form.identificador || ''} onChange={set('identificador')} />
        <Field label="Clase UP" value={form.clase_up || ''} onChange={set('clase_up')} />
        <Field label="Fuente Financiación" value={form.fuente_financiacion || ''} onChange={set('fuente_financiacion')} />
        <Field label="Avance Obra (%)" value={form.avance_obra ?? ''} onChange={(v) => setForm((p) => ({ ...p, avance_obra: Number(v) }))} type="number" />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={(v) => setForm((p) => ({ ...p, presupuesto_base: Number(v) }))} type="number" />
        <Field label="Fecha Inicio" value={form.fecha_inicio || ''} onChange={set('fecha_inicio')} type="date" />
        <Field label="Fecha Fin" value={form.fecha_fin || ''} onChange={set('fecha_fin')} type="date" />
        <Field label="Ref. Contrato" value={form.referencia_contrato || ''} onChange={set('referencia_contrato')} />
        <Field label="Ref. Proceso" value={form.referencia_proceso || ''} onChange={set('referencia_proceso')} />
        <Field label="URL Proceso" value={form.url_proceso || ''} onChange={set('url_proceso')} />
        <Field label="BPIN" value={String(form.bpin ?? '')} onChange={set('bpin' as any)} />
        <Field label="Unidad" value={form.unidad || ''} onChange={set('unidad')} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
        <textarea
          value={form.descripcion_intervencion || ''}
          onChange={(e) => setForm((p) => ({ ...p, descripcion_intervencion: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creando…' : 'Crear Intervención'}
        </button>
      </div>
    </form>
  )
}

// ─── Formulario Solicitud de Cambio UP ────────────────────────────

const SolicitarCambioUPForm: React.FC<{ up: UP; onSuccess: () => void; onClose: () => void }> = ({ up, onSuccess, onClose }) => {
  const [form, setForm] = useState<SolicitudCambioUPPayload>({
    upid: up.upid,
    nombre_up: up.nombre_up,
    nombre_up_detalle: up.nombre_up_detalle || '',
    estado: up.estado || '',
    tipo_intervencion: up.tipo_intervencion || '',
    tipo_equipamiento: up.tipo_equipamiento || '',
    clase_up: up.clase_up || '',
    nombre_centro_gestor: up.nombre_centro_gestor || '',
    comuna_corregimiento: up.comuna_corregimiento || '',
    barrio_vereda: up.barrio_vereda || '',
    frente_activo: up.frente_activo || '',
    fuente_financiacion: up.fuente_financiacion || '',
    direccion: up.direccion || '',
    ano: up.ano,
    avance_obra: up.avance_obra,
    presupuesto_base: up.presupuesto_base,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await crearSolicitudCambioUP(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof SolicitudCambioUPPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Modifica los campos que desees cambiar. La solicitud será revisada por un validador.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="UPID" value={form.upid} onChange={() => {}} />
        <Field label="Nombre UP" value={form.nombre_up || ''} onChange={set('nombre_up')} />
        <Field label="Nombre Detalle" value={form.nombre_up_detalle || ''} onChange={set('nombre_up_detalle')} />
        <Field label="Estado" value={form.estado || ''} onChange={set('estado')} />
        <Field label="Tipo Intervención" value={form.tipo_intervencion || ''} onChange={set('tipo_intervencion')} />
        <Field label="Tipo Equipamiento" value={form.tipo_equipamiento || ''} onChange={set('tipo_equipamiento')} />
        <Field label="Clase UP" value={form.clase_up || ''} onChange={set('clase_up')} />
        <Field label="Centro Gestor" value={form.nombre_centro_gestor || ''} onChange={set('nombre_centro_gestor')} />
        <Field label="Comuna / Corregimiento" value={form.comuna_corregimiento || ''} onChange={set('comuna_corregimiento')} />
        <Field label="Barrio / Vereda" value={form.barrio_vereda || ''} onChange={set('barrio_vereda')} />
        <Field label="Frente Activo" value={form.frente_activo || ''} onChange={set('frente_activo')} />
        <Field label="Fuente Financiación" value={form.fuente_financiacion || ''} onChange={set('fuente_financiacion')} />
        <Field label="Dirección" value={form.direccion || ''} onChange={set('direccion')} />
        <Field label="Año" value={form.ano ?? ''} onChange={(v) => setForm((p) => ({ ...p, ano: Number(v) || undefined }))} type="number" />
        <Field label="Avance Obra (%)" value={form.avance_obra ?? ''} onChange={(v) => setForm((p) => ({ ...p, avance_obra: Number(v) }))} type="number" />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={(v) => setForm((p) => ({ ...p, presupuesto_base: Number(v) }))} type="number" />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Enviando…' : 'Solicitar Cambio'}
        </button>
      </div>
    </form>
  )
}

// ─── Formulario Solicitud de Cambio Intervención ──────────────────

const SolicitarCambioIntervencionForm: React.FC<{ interv: Intervencion; onSuccess: () => void; onClose: () => void }> = ({ interv, onSuccess, onClose }) => {
  const [form, setForm] = useState<SolicitudCambioIntervencionPayload>({
    intervencion_id: interv.intervencion_id,
    upid: interv.upid,
    estado: interv.estado || '',
    tipo_intervencion: interv.tipo_intervencion || '',
    nombre_centro_gestor: interv.nombre_centro_gestor || '',
    avance_obra: interv.avance_obra,
    presupuesto_base: interv.presupuesto_base,
    fecha_inicio: interv.fecha_inicio || '',
    fecha_fin: interv.fecha_fin || '',
    fuente_financiacion: interv.fuente_financiacion || '',
    referencia_contrato: interv.referencia_contrato || '',
    descripcion_intervencion: interv.descripcion_intervencion || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await crearSolicitudCambioIntervencion(form)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof SolicitudCambioIntervencionPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Modifica los campos que desees cambiar. La solicitud será revisada por un validador.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ID Intervención" value={form.intervencion_id} onChange={() => {}} />
        <Field label="UPID" value={form.upid || ''} onChange={() => {}} />
        <Field label="Estado" value={form.estado || ''} onChange={set('estado')} />
        <Field label="Tipo Intervención" value={form.tipo_intervencion || ''} onChange={set('tipo_intervencion')} />
        <Field label="Centro Gestor" value={form.nombre_centro_gestor || ''} onChange={set('nombre_centro_gestor')} />
        <Field label="Avance Obra (%)" value={form.avance_obra ?? ''} onChange={(v) => setForm((p) => ({ ...p, avance_obra: Number(v) }))} type="number" />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={(v) => setForm((p) => ({ ...p, presupuesto_base: Number(v) }))} type="number" />
        <Field label="Fecha Inicio" value={form.fecha_inicio || ''} onChange={set('fecha_inicio')} type="date" />
        <Field label="Fecha Fin" value={form.fecha_fin || ''} onChange={set('fecha_fin')} type="date" />
        <Field label="Fuente Financiación" value={form.fuente_financiacion || ''} onChange={set('fuente_financiacion')} />
        <Field label="Ref. Contrato" value={form.referencia_contrato || ''} onChange={set('referencia_contrato')} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
        <textarea
          value={form.descripcion_intervencion || ''}
          onChange={(e) => setForm((p) => ({ ...p, descripcion_intervencion: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Enviando…' : 'Solicitar Cambio'}
        </button>
      </div>
    </form>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const percentage = Math.min(value, 100)
  const getColor = (val: number) => {
    if (val >= 90) return 'from-green-500 to-emerald-600'
    if (val >= 70) return 'from-blue-500 to-cyan-600'
    if (val >= 50) return 'from-yellow-500 to-amber-600'
    if (val >= 30) return 'from-orange-500 to-red-600'
    return 'from-red-500 to-rose-600'
  }
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <span className="text-xs font-bold text-center text-gray-700 dark:text-gray-300 leading-none">
        {percentage.toFixed(0)}%
      </span>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full bg-gradient-to-r ${getColor(percentage)}`}
        />
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────

const GestionRegistrosTab: React.FC = () => {
  const [ups, setUps] = useState<UP[]>([])
  const [intervencionesMap, setIntervencionesMap] = useState<Record<string, Intervencion[]>>({})
  const [loadingIntervUp, setLoadingIntervUp] = useState<Record<string, boolean>>({})
  const [metrics, setMetrics] = useState<Record<string, { avance: number; presupuesto: number }>>({})
  const [expandedUP, setExpandedUP] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  // Modales
  const [showCrearUP, setShowCrearUP] = useState(false)
  const [showCrearIntervencion, setShowCrearIntervencion] = useState<string | null>(null)
  const [showModificarUP, setShowModificarUP] = useState<UP | null>(null)
  const [showModificarIntervencion, setShowModificarIntervencion] = useState<Intervencion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'up' | 'intervencion'; id: string; upid?: string } | null>(null)

  const API_BASE = '/api/proxy'

  // Cargar UPs
  const loadUPs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/unidades-proyecto?limit=10000`)
      const json = await res.json()
      const rawItems = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      // Enriquecer cada UP con datos de su primera intervención (si viene anidada)
      const items: UP[] = rawItems.map((item: any) => {
        const intervenciones = item.intervenciones || []
        const first = intervenciones[0] || {}
        return {
          ...item,
          estado: item.estado || first.estado || '',
          tipo_intervencion: item.tipo_intervencion || first.tipo_intervencion || '',
          nombre_centro_gestor: item.nombre_centro_gestor || first.nombre_centro_gestor || '',
          fuente_financiacion: item.fuente_financiacion || first.fuente_financiacion || '',
          frente_activo: item.frente_activo || first.frente_activo || '',
          clase_up: item.clase_up || first.clase_up || '',
          ano: item.ano || first.ano || undefined,
          avance_obra: item.avance_obra ?? (intervenciones.length > 0
            ? intervenciones.reduce((s: number, i: any) => s + (parseFloat(i.avance_obra) || 0), 0) / intervenciones.length
            : 0),
          presupuesto_base: item.presupuesto_base ?? intervenciones.reduce((s: number, i: any) => s + (parseFloat(i.presupuesto_base) || 0), 0),
          fecha_inicio: item.fecha_inicio || first.fecha_inicio || '',
          fecha_fin: item.fecha_fin || first.fecha_fin || '',
          identificador: item.identificador || first.identificador || '',
          descripcion_intervencion: item.descripcion_intervencion || first.descripcion_intervencion || '',
          referencia_contrato: item.referencia_contrato || first.referencia_contrato || '',
          referencia_proceso: item.referencia_proceso || first.referencia_proceso || '',
          url_proceso: item.url_proceso || first.url_proceso || '',
        }
      })
      setUps(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar UPs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUPs() }, [loadUPs])

  // Cargar intervenciones + calcular métricas
  const loadIntervenciones = useCallback(async (upid: string) => {
    if (intervencionesMap[upid] !== undefined || loadingIntervUp[upid]) return
    setLoadingIntervUp(prev => ({ ...prev, [upid]: true }))
    try {
      const res = await fetch(`${API_BASE}/intervenciones?upid=${encodeURIComponent(upid)}&limit=10000`)
      const json = await res.json()
      const items: Intervencion[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      const avance = items.length > 0 ? items.reduce((s, i) => s + (i.avance_obra || 0), 0) / items.length : 0
      const presupuesto = items.reduce((s, i) => s + (i.presupuesto_base || 0), 0)
      setMetrics(prev => ({ ...prev, [upid]: { avance, presupuesto } }))
      setIntervencionesMap(prev => ({ ...prev, [upid]: items }))
    } catch {
      setIntervencionesMap(prev => ({ ...prev, [upid]: [] }))
      setMetrics(prev => ({ ...prev, [upid]: { avance: 0, presupuesto: 0 } }))
    } finally {
      setLoadingIntervUp(prev => { const c = { ...prev }; delete c[upid]; return c })
    }
  }, [intervencionesMap, loadingIntervUp])

  // Filtrar + paginar
  const filteredUPs = useMemo(() => {
    if (!search.trim()) return ups
    const term = search.toLowerCase()
    return ups.filter(u =>
      u.upid.toLowerCase().includes(term) ||
      u.nombre_up?.toLowerCase().includes(term) ||
      u.nombre_centro_gestor?.toLowerCase().includes(term)
    )
  }, [ups, search])

  const totalPages = Math.ceil(filteredUPs.length / ITEMS_PER_PAGE)
  const paginatedUPs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredUPs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredUPs, currentPage])

  // Auto-cargar métricas para la página actual
  useEffect(() => {
    paginatedUPs.forEach(up => {
      if (intervencionesMap[up.upid] === undefined && !loadingIntervUp[up.upid]) {
        loadIntervenciones(up.upid)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedUPs])

  // Paginación — páginas visibles
  const getVisiblePages = (): Array<number | 'ellipsis'> => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: Array<number | 'ellipsis'> = []
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
    for (let p = start; p <= end; p++) pages.push(p)
    if (end < totalPages - 1) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  // Helpers consolidados
  const getEstadoConsolidado = (intervs: Intervencion[]): string => {
    if (!intervs.length) return '-'
    const estados = new Set(intervs.map(i => i.estado).filter(Boolean))
    return estados.size === 1 ? Array.from(estados)[0]! : 'Varios estados'
  }
  const getTipoConsolidado = (intervs: Intervencion[]): string => {
    if (!intervs.length) return '-'
    const tipos = new Set(intervs.map(i => i.tipo_intervencion).filter(Boolean))
    return tipos.size === 1 ? Array.from(tipos)[0]! : 'Varios tipos'
  }
  const getCentroConsolidado = (intervs: Intervencion[]): string => {
    if (!intervs.length) return '-'
    const centros = new Set(intervs.map(i => i.nombre_centro_gestor).filter(Boolean))
    return centros.size === 1 ? Array.from(centros)[0]! : 'Varios organismos'
  }

  const toggleExpand = (upid: string) => {
    setExpandedUP(prev => prev === upid ? null : upid)
    loadIntervenciones(upid)
  }

  // Eliminar
  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'up') {
        await eliminarUnidadProyecto(confirmDelete.id)
        await loadUPs()
      } else {
        await eliminarIntervencion(confirmDelete.id)
        if (confirmDelete.upid) {
          setIntervencionesMap(prev => { const c = { ...prev }; delete c[confirmDelete.upid!]; return c })
          setMetrics(prev => { const c = { ...prev }; delete c[confirmDelete.upid!]; return c })
          loadIntervenciones(confirmDelete.upid)
        }
      }
      setConfirmDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por UPID, nombre, centro gestor…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button onClick={loadUPs} disabled={loading} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCrearUP(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nueva UP
          </button>
          <button onClick={() => setShowCrearIntervencion('')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Nueva Intervención
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tabla */}
      {loading && ups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 w-5 sm:w-6"></th>
                  <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[68px] sm:w-[78px]">UPID</th>
                  <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[128px] sm:w-[148px] md:w-[184px] lg:w-[202px]">Nombre</th>
                  <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 md:w-24 lg:w-28">Centro</th>
                  <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Estado</th>
                  <th className="hidden lg:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Tipo</th>
                  <th className="px-0 sm:px-0.5 py-2 sm:py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-[64px] sm:w-[72px] md:w-[80px] lg:w-[88px]">Avance</th>
                  <th className="hidden md:table-cell px-1 sm:px-2 py-2 sm:py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 w-24 md:w-28 lg:w-32">Presupuesto</th>
                  <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 lg:w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence mode="popLayout">
                  {paginatedUPs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <AlertCircle className="w-5 h-5" />
                          <p className="text-xs sm:text-sm">No se encontraron unidades de proyecto</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedUPs.map((up) => {
                    const isExpanded = expandedUP === up.upid
                    const intervenciones = intervencionesMap[up.upid] || []
                    const isLoadingInterv = !!loadingIntervUp[up.upid]
                    const itemMetrics = metrics[up.upid] || { avance: 0, presupuesto: 0 }

                    return (
                      <React.Fragment key={up.upid}>
                        {/* Fila UP */}
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => toggleExpand(up.upid)}
                        >
                          {/* Expandir */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExpand(up.upid) }}
                              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                            >
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                : <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
                            </button>
                          </td>
                          {/* UPID */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 whitespace-nowrap">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm leading-none">
                              {up.upid}
                            </span>
                          </td>
                          {/* Nombre */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <div className="space-y-0.5">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{up.nombre_up}</p>
                              {(up.barrio_vereda || up.comuna_corregimiento) && (
                                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span>
                                    {up.barrio_vereda && up.comuna_corregimiento
                                      ? `${up.barrio_vereda} • ${up.comuna_corregimiento}`
                                      : up.barrio_vereda || up.comuna_corregimiento}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          {/* Centro */}
                          <td className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">{getCentroConsolidado(intervenciones)}</span>
                          </td>
                          {/* Estado */}
                          <td className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">{getEstadoConsolidado(intervenciones)}</span>
                          </td>
                          {/* Tipo */}
                          <td className="hidden lg:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">{getTipoConsolidado(intervenciones)}</span>
                          </td>
                          {/* Avance */}
                          <td className="px-0 sm:px-0.5 py-2 sm:py-2.5">
                            <ProgressBar value={itemMetrics.avance} />
                          </td>
                          {/* Presupuesto */}
                          <td className="hidden md:table-cell px-1 sm:px-2 pr-2 sm:pr-2.5 py-2 sm:py-2.5 text-right">
                            <span className="inline-block font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm whitespace-nowrap tabular-nums">
                              {formatCurrencyFull(itemMetrics.presupuesto)}
                            </span>
                          </td>
                          {/* Acciones */}
                          <td className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setShowModificarUP(up)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                title="Editar UP"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: 'up', id: up.upid })}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar UP"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>

                        {/* Fila expandida — sub-tabla de intervenciones */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/5 dark:to-blue-900/0">
                              <td colSpan={9} className="px-2 sm:px-3 py-2 sm:py-3">
                                {isLoadingInterv ? (
                                  <div className="flex items-center justify-center gap-2 py-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Cargando intervenciones…</span>
                                  </div>
                                ) : intervenciones.length === 0 ? (
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-xs text-gray-500">Sin intervenciones</span>
                                    <button
                                      onClick={() => setShowCrearIntervencion(up.upid)}
                                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200"
                                    >
                                      <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                  </div>
                                ) : (
                                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        {intervenciones.length} intervención{intervenciones.length !== 1 ? 'es' : ''}
                                      </span>
                                      <button
                                        onClick={() => setShowCrearIntervencion(up.upid)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                                      >
                                        <Plus className="w-3 h-3" /> Agregar
                                      </button>
                                    </div>
                                    <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-700">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="bg-blue-100 dark:bg-blue-900/30">
                                            <th className="px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-32">ID Intervención</th>
                                            <th className="px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300">Tipo</th>
                                            <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300">Estado</th>
                                            <th className="px-2 py-1.5 text-center font-semibold text-blue-700 dark:text-blue-300 w-20">Avance</th>
                                            <th className="hidden md:table-cell px-2 py-1.5 text-right font-semibold text-blue-700 dark:text-blue-300 w-28">Presupuesto</th>
                                            <th className="px-2 py-1.5 text-center font-semibold text-blue-700 dark:text-blue-300 w-20">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-100 dark:divide-blue-800">
                                          {intervenciones.map(interv => (
                                            <tr key={interv.intervencion_id} className="bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                              <td className="px-2 py-1.5 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{interv.intervencion_id}</td>
                                              <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{interv.tipo_intervencion || '-'}</td>
                                              <td className="hidden sm:table-cell px-2 py-1.5 text-gray-700 dark:text-gray-300">{interv.estado || '-'}</td>
                                              <td className="px-2 py-1.5"><ProgressBar value={interv.avance_obra || 0} /></td>
                                              <td className="hidden md:table-cell px-2 py-1.5 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                                                {formatCurrencyFull(interv.presupuesto_base || 0)}
                                              </td>
                                              <td className="px-2 py-1.5">
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    onClick={() => setShowModificarIntervencion(interv)}
                                                    className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                                                    title="Editar intervención"
                                                  >
                                                    <Edit3 className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => setConfirmDelete({ type: 'intervencion', id: interv.intervencion_id, upid: up.upid })}
                                                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Eliminar intervención"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </motion.div>
                                )}
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredUPs.length} registros · página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getVisiblePages().map((page, i) =>
                  page === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[28px] h-7 text-xs rounded transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modales ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCrearUP && (
          <Modal title="Crear Unidad de Proyecto" onClose={() => setShowCrearUP(false)}>
            <CrearUPForm onSuccess={loadUPs} onClose={() => setShowCrearUP(false)} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCrearIntervencion !== null && (
          <Modal title="Crear Intervención" onClose={() => setShowCrearIntervencion(null)}>
            <CrearIntervencionForm
              defaultUpid={showCrearIntervencion}
              onSuccess={() => {
                if (showCrearIntervencion) {
                  setIntervencionesMap(prev => { const c = { ...prev }; delete c[showCrearIntervencion]; return c })
                  setMetrics(prev => { const c = { ...prev }; delete c[showCrearIntervencion]; return c })
                  loadIntervenciones(showCrearIntervencion)
                }
              }}
              onClose={() => setShowCrearIntervencion(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModificarUP && (
          <Modal title="Solicitar Cambio — UP" onClose={() => setShowModificarUP(null)}>
            <SolicitarCambioUPForm up={showModificarUP} onSuccess={loadUPs} onClose={() => setShowModificarUP(null)} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModificarIntervencion && (
          <Modal title="Solicitar Cambio — Intervención" onClose={() => setShowModificarIntervencion(null)}>
            <SolicitarCambioIntervencionForm
              interv={showModificarIntervencion}
              onSuccess={() => {
                if (showModificarIntervencion?.upid) {
                  setIntervencionesMap(prev => { const c = { ...prev }; delete c[showModificarIntervencion.upid!]; return c })
                  setMetrics(prev => { const c = { ...prev }; delete c[showModificarIntervencion.upid!]; return c })
                  loadIntervenciones(showModificarIntervencion.upid)
                }
              }}
              onClose={() => setShowModificarIntervencion(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <Modal title="Confirmar Eliminación" onClose={() => setConfirmDelete(null)}>
            <div className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                ¿Estás seguro de eliminar {confirmDelete.type === 'up' ? 'la Unidad de Proyecto' : 'la Intervención'}{' '}
                <span className="font-bold">{confirmDelete.id}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
                <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GestionRegistrosTab
