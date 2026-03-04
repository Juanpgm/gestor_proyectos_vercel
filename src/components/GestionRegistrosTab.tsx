'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
  X,
} from 'lucide-react'
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

// ─── Componente principal ─────────────────────────────────────────

const GestionRegistrosTab: React.FC = () => {
  const [ups, setUps] = useState<UP[]>([])
  const [intervencionesMap, setIntervencionesMap] = useState<Record<string, Intervencion[]>>({})
  const [expandedUP, setExpandedUP] = useState<string | null>(null)
  const [loadingIntervUp, setLoadingIntervUp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Modales
  const [showCrearUP, setShowCrearUP] = useState(false)
  const [showCrearIntervencion, setShowCrearIntervencion] = useState<string | null>(null) // upid destino
  const [showModificarUP, setShowModificarUP] = useState<UP | null>(null)
  const [showModificarIntervencion, setShowModificarIntervencion] = useState<Intervencion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'up' | 'intervencion'; id: string } | null>(null)

  const API_BASE = '/api/proxy'

  // Cargar UPs
  const loadUPs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/unidades-proyecto?limit=500`)
      const json = await res.json()
      const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      setUps(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar UPs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUPs()
  }, [loadUPs])

  // Cargar intervenciones de una UP
  const loadIntervenciones = async (upid: string) => {
    if (intervencionesMap[upid]) return
    setLoadingIntervUp(upid)
    try {
      const res = await fetch(`${API_BASE}/intervenciones?upid=${encodeURIComponent(upid)}&limit=10000`)
      const json = await res.json()
      const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      setIntervencionesMap((prev) => ({ ...prev, [upid]: items }))
    } catch {
      setIntervencionesMap((prev) => ({ ...prev, [upid]: [] }))
    } finally {
      setLoadingIntervUp(null)
    }
  }

  const toggleExpand = (upid: string) => {
    if (expandedUP === upid) {
      setExpandedUP(null)
    } else {
      setExpandedUP(upid)
      loadIntervenciones(upid)
    }
  }

  // Eliminar
  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'up') {
        await eliminarUnidadProyecto(confirmDelete.id)
      } else {
        await eliminarIntervencion(confirmDelete.id)
      }
      setConfirmDelete(null)
      // Refresh
      if (confirmDelete.type === 'intervencion') {
        // Limpiar cache de intervenciones para que se recarguen
        setIntervencionesMap((prev) => {
          const copy = { ...prev }
          Object.keys(copy).forEach((k) => {
            copy[k] = copy[k].filter((i) => i.intervencion_id !== confirmDelete.id)
          })
          return copy
        })
      } else {
        await loadUPs()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Filtrar
  const filteredUPs = search.trim()
    ? ups.filter(
        (u) =>
          u.upid.toLowerCase().includes(search.toLowerCase()) ||
          u.nombre_up?.toLowerCase().includes(search.toLowerCase()) ||
          u.nombre_centro_gestor?.toLowerCase().includes(search.toLowerCase())
      )
    : ups

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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button onClick={loadUPs} disabled={loading} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCrearUP(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Nueva UP
          </button>
          <button
            onClick={() => setShowCrearIntervencion('')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
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

      {/* Lista */}
      {loading && ups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : filteredUPs.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
          No se encontraron unidades de proyecto
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUPs.map((up) => {
            const isExpanded = expandedUP === up.upid
            const intervenciones = intervencionesMap[up.upid] || []
            const isLoadingInterv = loadingIntervUp === up.upid

            return (
              <div key={up.upid} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {/* Fila UP */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleExpand(up.upid)}
                >
                  <button className="flex-shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">{up.upid}</span>
                      <span className="text-sm text-slate-900 dark:text-white truncate">{up.nombre_up}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {up.nombre_centro_gestor || '-'} • {up.estado || '-'} • {up.tipo_intervencion || '-'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowModificarUP(up)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                      title="Solicitar cambio"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: 'up', id: up.upid })}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Eliminar UP"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Intervenciones */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Intervenciones</span>
                          <button
                            onClick={() => setShowCrearIntervencion(up.upid)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                          >
                            <Plus className="w-3 h-3" /> Agregar
                          </button>
                        </div>

                        {isLoadingInterv ? (
                          <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Cargando…
                          </div>
                        ) : intervenciones.length === 0 ? (
                          <p className="text-xs text-slate-500 py-2">Sin intervenciones</p>
                        ) : (
                          <div className="space-y-2">
                            {intervenciones.map((interv) => (
                              <div
                                key={interv.intervencion_id}
                                className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-slate-900 dark:text-white">{interv.intervencion_id}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      {interv.estado || 'Sin estado'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {interv.tipo_intervencion || '-'} • Avance: {interv.avance_obra ?? 0}%
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => setShowModificarIntervencion(interv)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg"
                                    title="Solicitar cambio"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete({ type: 'intervencion', id: interv.intervencion_id })}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="Eliminar intervención"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                // Limpiar cache de esa UP para recargar
                if (showCrearIntervencion) {
                  setIntervencionesMap((prev) => {
                    const copy = { ...prev }
                    delete copy[showCrearIntervencion]
                    return copy
                  })
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
                setIntervencionesMap((prev) => {
                  const copy = { ...prev }
                  if (showModificarIntervencion?.upid) delete copy[showModificarIntervencion.upid]
                  return copy
                })
                if (showModificarIntervencion?.upid) loadIntervenciones(showModificarIntervencion.upid)
              }}
              onClose={() => setShowModificarIntervencion(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirmación de eliminación */}
      <AnimatePresence>
        {confirmDelete && (
          <Modal title="Confirmar Eliminación" onClose={() => setConfirmDelete(null)}>
            <div className="space-y-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                ¿Estás seguro de que deseas eliminar {confirmDelete.type === 'up' ? 'la Unidad de Proyecto' : 'la Intervención'}{' '}
                <span className="font-bold">{confirmDelete.id}</span>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GestionRegistrosTab
