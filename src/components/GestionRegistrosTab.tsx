'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  Plus,
  Trash2,
  Edit3,
  TrendingUp,
  History,
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
import { useAuth } from '@/context/AuthContext'

const UpLocationPickerMap = dynamic(() => import('./UpLocationPickerMap'), { ssr: false })
const RegistrarAvanceUPModal = dynamic(() => import('./RegistrarAvanceUPModal'), { ssr: false })
const HistorialAvancesUP = dynamic(() => import('./HistorialAvancesUP'), { ssr: false })

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
  geometry?: {
    type?: string
    coordinates?: [number, number]
  }
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

declare global {
  interface Window {
    CLASES_UP?: string[]
    TIPOS_EQUIPAMIENTO?: string[]
    TIPOS_INTERVENCIONES?: string[]
    FUENTES_FINANCIACION?: string[]
    ESTADOS_UP?: string[]
    CENTROS_GESTORES?: string[]
    UNIDADES_PROYECTO_FILTERS_GLOBAL?: {
      centros_gestores?: string[]
      estados?: string[]
      tipos_intervencion?: string[]
      tipos_equipamiento?: string[]
      clases_up?: string[]
      frentes_activos?: string[]
      comunas_corregimientos?: string[]
      barrios_veredas?: string[]
      fuentes_financiacion?: string[]
      anos?: string[]
      proyectos_estrategicos?: string[]
    }
  }
}

const CLASES_UP_DEFAULT: string[] = [
  'Interventoria',
  'Estudios y diseños',
  'Obras equipamientos',
  'Obra vial',
  'Adquisición predial',
  'Subsidios',
  'Demarcación vial',
  'Dotaciones',
  'Obras de Arte (civil)',
]

const TIPOS_EQUIPAMIENTO_DEFAULT: string[] = [
  'Instituciones Educativas',
  'Parques y zonas verdes',
  'Fuentes y monumentos',
  'CALIS',
  'Centro Cultural',
  'Estaciones de policia',
  'Vivienda mejoramiento',
  'Estaciones MIO',
  'Casa de Justicia',
  'Bibliotecas',
  'IPS',
  'Jardines',
  'Reducción del riesgo',
  'Vivienda nueva',
  'UTS',
  'Canchas',
  'Eco parques',
  'CAD',
  'Infraestructura vial',
  'Infraestructura recreativa',
  'Infraestructura recreo deportiva',
  'Adquisición predios',
  'Infraestructura cultural',
  'Señalización vial',
  'Infraestructura de servicios publicos',
]

const TIPOS_INTERVENCIONES_DEFAULT: string[] = [
  'Obra nueva',
  'Adecuaciones',
  'Rehabilitación / Reforzamiento',
  'Demolición',
  'Mantenimiento',
  'Estudios y diseños',
  'Transferencia directa',
]

const FUENTES_FINANCIACION_DEFAULT: string[] = [
  'Empréstito',
  'Ingresos libre destinación',
  'Ingresos con destinación específica',
  'Cooperación Internacional - donaciones',
  'Presupuesto Participativo',
  'Otros créditos (vigencias anteriores)',
]

const ESTADOS_UP_DEFAULT: string[] = [
  'En alistamiento',
  'En ejecución',
  'Suspendido',
  'Terminado',
  'Inaugurado',
]

const getClaseUpOptions = (currentValue?: string): string[] => {
  const trimmedCurrent = String(currentValue || '').trim()

  let base = [...CLASES_UP_DEFAULT]
  if (typeof window !== 'undefined') {
    const existing = Array.isArray(window.CLASES_UP)
      ? window.CLASES_UP.map((item) => String(item || '').trim()).filter(Boolean)
      : []
    base = existing.length > 0 ? existing : [...CLASES_UP_DEFAULT]
    window.CLASES_UP = [...base]
  }

  if (trimmedCurrent && !base.includes(trimmedCurrent)) {
    return [...base, trimmedCurrent]
  }

  return base
}

const getTipoEquipamientoOptions = (currentValue?: string): string[] => {
  const base = [...TIPOS_EQUIPAMIENTO_DEFAULT]
  if (typeof window !== 'undefined') {
    window.TIPOS_EQUIPAMIENTO = [...base]
  }

  return base
}

const getTipoIntervencionOptions = (currentValue?: string): string[] => {
  const base = [...TIPOS_INTERVENCIONES_DEFAULT]
  if (typeof window !== 'undefined') {
    window.TIPOS_INTERVENCIONES = [...base]
  }

  return base
}

const getFuentesFinanciacionOptions = (currentValue?: string): string[] => {
  const base = [...FUENTES_FINANCIACION_DEFAULT]
  if (typeof window !== 'undefined') {
    window.FUENTES_FINANCIACION = [...base]
  }

  return base
}

const getEstadosUpOptions = (currentValue?: string): string[] => {
  const base = [...ESTADOS_UP_DEFAULT]
  if (typeof window !== 'undefined') {
    window.ESTADOS_UP = [...base]
  }

  return base
}

const getCentroGestorOptions = (): string[] => {
  let base: string[] = []
  if (typeof window !== 'undefined') {
    const fromGlobalFilters = Array.isArray(window.UNIDADES_PROYECTO_FILTERS_GLOBAL?.centros_gestores)
      ? window.UNIDADES_PROYECTO_FILTERS_GLOBAL!.centros_gestores!
      : []
    const fromGlobalVar = Array.isArray(window.CENTROS_GESTORES) ? window.CENTROS_GESTORES : []

    base = Array.from(new Set([
      ...fromGlobalFilters.map((item) => String(item || '').trim()).filter(Boolean),
      ...fromGlobalVar.map((item) => String(item || '').trim()).filter(Boolean),
    ])).sort((a, b) => a.localeCompare(b, 'es'))

    if (base.length > 0) {
      window.CENTROS_GESTORES = [...base]
    }
  }

  return base
}

// ─── Formulario campo genérico ────────────────────────────────────

const Field: React.FC<{
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}> = ({ label, value, onChange, type = 'text', required, placeholder, disabled = false }) => (
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
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
)

const SelectField: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  required?: boolean
  placeholder?: string
  disabled?: boolean
}> = ({ label, value, onChange, options, required, placeholder = 'Selecciona una opción', disabled = false }) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
)

const SearchableSelectField: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  required?: boolean
  placeholder?: string
  searchPlaceholder?: string
  clearSearchOnOpen?: boolean
  disabled?: boolean
}> = ({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = 'Selecciona una opción',
  searchPlaceholder = 'Buscar...',
  clearSearchOnOpen = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = 260
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      ...(openUpward ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [isOpen, updateDropdownPosition])

  useEffect(() => {
    setSearchTerm(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target)
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(target)
      if (!clickedInsideDropdown && !clickedTrigger) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return options
    return options.filter((option) => option.toLowerCase().includes(term))
  }, [options, searchTerm])

  const handleSelect = (option: string) => {
    onChange(option)
    setSearchTerm(option)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input type="hidden" value={value} required={required} disabled={disabled} readOnly />

      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return
          setIsOpen((prev) => {
            const next = !prev
            if (next && clearSearchOnOpen) {
              setSearchTerm('')
            }
            return next
          })
        }}
        disabled={disabled}
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
      >
        <span className={value ? '' : 'text-slate-400 dark:text-slate-500'}>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-lg p-2"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${value === option ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  {option}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Sin resultados</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Modal genérico ───────────────────────────────────────────────

const Modal: React.FC<{
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClass?: string
}> = ({ title, onClose, children, maxWidthClass = 'max-w-lg' }) => (
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
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${maxWidthClass} max-h-[85vh] overflow-y-auto`}
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
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState<CrearUnidadProyectoPayload>({
    nombre_up: '',
    nombre_up_detalle: '',
    tipo_equipamiento: '',
    direccion: '',
  })
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const [pendingPayload, setPendingPayload] = useState<CrearUnidadProyectoPayload | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tipoEquipamientoOptions = useMemo(() => getTipoEquipamientoOptions(form.tipo_equipamiento), [form.tipo_equipamiento])

  useEffect(() => {
    if (!toast) return

    const id = window.setTimeout(() => {
      setToast(null)
    }, 3000)

    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const updateGeometryWithPosition = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng])
    setForm((prev) => ({
      ...prev,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    }))
  }, [])

  const handleMapPositionChange = useCallback((newPosition: [number, number]) => {
    updateGeometryWithPosition(newPosition[0], newPosition[1])
    setGeoError(null)
  }, [updateGeometryWithPosition])

  const handleGeocodeAddress = useCallback(async () => {
    const address = (form.direccion || '').trim()
    if (!address) {
      setGeoError('Ingresa una dirección antes de buscar en el mapa.')
      return
    }

    setIsGeocoding(true)
    setGeoError(null)

    try {
      const query = `${address}, Cali, Colombia`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      )

      if (!response.ok) {
        throw new Error('No fue posible geocodificar la dirección.')
      }

      const data = await response.json()
      const firstResult = Array.isArray(data) ? data[0] : null

      if (!firstResult?.lat || !firstResult?.lon) {
        setGeoError('No se encontró una ubicación para esa dirección. Marca el punto manualmente en el mapa.')
        return
      }

      const lat = Number(firstResult.lat)
      const lng = Number(firstResult.lon)

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setGeoError('La geocodificación devolvió coordenadas inválidas. Marca el punto manualmente.')
        return
      }

      updateGeometryWithPosition(lat, lng)
    } catch (geoErr) {
      setGeoError(geoErr instanceof Error ? geoErr.message : 'Error geocodificando la dirección.')
    } finally {
      setIsGeocoding(false)
    }
  }, [form.direccion, updateGeometryWithPosition])

  const validateStep1 = () => {
    const requiredFields: Array<keyof CrearUnidadProyectoPayload> = [
      'nombre_up',
      'nombre_up_detalle',
      'tipo_equipamiento',
      'direccion',
    ]

    const missingField = requiredFields.find((field) => !(form[field] || '').toString().trim())

    if (missingField) {
      setError('Completa todos los campos del Paso 1 para continuar.')
      return false
    }

    return true
  }

  const buildPayload = (): CrearUnidadProyectoPayload | null => {
    if (!validateStep1()) {
      setStep(1)
      return null
    }

    if (!position) {
      setError('Debes seleccionar un punto en el mapa para construir geometry.')
      setStep(1)
      return null
    }

    return {
      nombre_up: (form.nombre_up || '').trim(),
      nombre_up_detalle: (form.nombre_up_detalle || '').trim(),
      tipo_equipamiento: (form.tipo_equipamiento || '').trim(),
      direccion: (form.direccion || '').trim(),
      geometry: {
        type: 'Point',
        coordinates: [position![1], position![0]],
      },
    }
  }

  const executeCreate = async (payload: CrearUnidadProyectoPayload) => {
    setLoading(true)
    setError(null)
    setDecisionMessage(null)

    try {
      await crearUnidadProyecto(payload)
      setToast({ type: 'success', message: 'Unidad de Proyecto creada exitosamente.' })
      await new Promise((resolve) => setTimeout(resolve, 900))
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear UP')
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Error al crear UP' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      setError(null)
      const payload = buildPayload()
      if (!payload) return
      setPendingPayload(payload)
      setDecisionMessage(null)
      setStep(2)
      return
    }

    setConfirmDialogOpen(true)
  }

  const set = (key: keyof CrearUnidadProyectoPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3 text-xs">
        <span className={`px-2.5 py-1 rounded-full font-medium ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
          Paso 1
        </span>
        <span className="text-slate-500 dark:text-slate-400">Datos básicos, dirección y geometry</span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <span className={`px-2.5 py-1 rounded-full font-medium ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
          Paso 2
        </span>
        <span className="text-slate-500 dark:text-slate-400">Resumen y confirmación</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre UP" value={form.nombre_up || ''} onChange={set('nombre_up')} placeholder="Nombre de la UP" required />
            <Field label="Nombre UP Detalle" value={form.nombre_up_detalle || ''} onChange={set('nombre_up_detalle')} placeholder="Detalle de la UP" required />
            <SearchableSelectField
              label="Tipo Equipamiento"
              value={form.tipo_equipamiento || ''}
              onChange={set('tipo_equipamiento')}
              options={tipoEquipamientoOptions}
              placeholder="Selecciona un tipo"
              searchPlaceholder="Buscar tipo de equipamiento"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Field
                label="Dirección"
                value={form.direccion || ''}
                onChange={set('direccion')}
                placeholder="Ingresa la dirección a geocodificar"
                required
              />
            </div>
            <div className="sm:pt-6">
              <button
                type="button"
                onClick={handleGeocodeAddress}
                disabled={isGeocoding}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-60"
              >
                {isGeocoding ? 'Buscando…' : 'Buscar dirección'}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Si el punto geocodificado no coincide, haz clic en el mapa o arrastra el marcador para corregirlo manualmente.
          </p>

          <UpLocationPickerMap
            position={position}
            onPositionChange={handleMapPositionChange}
            isDark={isDark}
          />

          {position && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Coordenadas seleccionadas: <span className="font-mono">lat {position[0].toFixed(6)}, lng {position[1].toFixed(6)}</span>
            </p>
          )}

          {geoError && <p className="text-sm text-amber-600 dark:text-amber-400">{geoError}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Revisa la información antes de registrar la Unidad de Proyecto.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Nombre UP</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{(form.nombre_up || '').trim() || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Nombre UP Detalle</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{(form.nombre_up_detalle || '').trim() || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Tipo Equipamiento</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{(form.tipo_equipamiento || '').trim() || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Dirección</p>
              <p className="font-medium text-slate-900 dark:text-slate-100">{(form.direccion || '').trim() || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Geometry (Point)</p>
              <p className="font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {position
                  ? `{"type":"Point","coordinates":[${position[1].toFixed(6)},${position[0].toFixed(6)}]}`
                  : 'Sin coordenadas seleccionadas'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 sm:col-span-2 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">Previsualización en mapa</p>
              <UpLocationPickerMap
                position={position}
                onPositionChange={() => {}}
                isDark={isDark}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {decisionMessage && <p className="text-sm text-amber-600 dark:text-amber-400">{decisionMessage}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>

        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setDecisionMessage(null)
              setPendingPayload(null)
              setStep(1)
            }}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Atrás
          </button>
        )}

        {step === 1 ? (
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Continuar
          </button>
        ) : (
          <button type="button" onClick={() => setConfirmDialogOpen(true)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creando…' : 'Crear UP'}
          </button>
        )}
      </div>

      {confirmDialogOpen && (
        <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmDialogOpen(false)}>
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Confirmar registro</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              ¿Estás seguro de crear esta Unidad de Proyecto?
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmDialogOpen(false)
                  setDecisionMessage('Solicitud rechazada')
                  setToast({ type: 'warning', message: 'Solicitud rechazada' })
                }}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                No
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDialogOpen(false)
                  if (!pendingPayload) {
                    setError('No hay datos listos para enviar. Revisa el Paso 3 y vuelve a intentar.')
                    setToast({ type: 'error', message: 'No hay datos listos para enviar.' })
                    return
                  }
                  await executeCreate(pendingPayload)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Si
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-[10002]">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium border ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700'
                : toast.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700'
                : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </form>
  )
}

// ─── Formulario Crear Intervención ────────────────────────────────

const CrearIntervencionForm: React.FC<{ defaultUpid?: string; onSuccess: (upids?: string[]) => void; onClose: () => void; onTabModeChange?: (mode: 'individual' | 'multiple') => void }> = ({ defaultUpid, onSuccess, onClose, onTabModeChange }) => {
  const { state: authState } = useAuth()
  const [activeTab, setActiveTab] = useState<'individual' | 'multiple'>('individual')
  const [form, setForm] = useState<CrearIntervencionPayload>({ upid: defaultUpid || '' })
  const [bulkRows, setBulkRows] = useState<Array<CrearIntervencionPayload & { _rowId: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [globalFiltersVersion, setGlobalFiltersVersion] = useState(0)
  const claseUpOptions = useMemo(() => getClaseUpOptions(form.clase_up), [form.clase_up])
  const tipoIntervencionOptions = useMemo(() => getTipoIntervencionOptions(form.tipo_intervencion), [form.tipo_intervencion])
  const fuentesFinanciacionOptions = useMemo(() => getFuentesFinanciacionOptions(form.fuente_financiacion), [form.fuente_financiacion])
  const estadosUpOptions = useMemo(() => getEstadosUpOptions(form.estado), [form.estado])
  const centroGestorOptions = useMemo(() => getCentroGestorOptions(), [form.nombre_centro_gestor, globalFiltersVersion])
  const bulkClaseUpOptions = useMemo(() => getClaseUpOptions(), [])
  const bulkTipoIntervencionOptions = useMemo(() => getTipoIntervencionOptions(), [])
  const bulkFuentesFinanciacionOptions = useMemo(() => getFuentesFinanciacionOptions(), [])
  const bulkEstadosUpOptions = useMemo(() => getEstadosUpOptions(), [])
  const bulkCentroGestorOptions = useMemo(() => getCentroGestorOptions(), [bulkRows, globalFiltersVersion])
  const bulkRowSeqRef = useRef(1)
  const userCentroGestor = useMemo(() => {
    return String(
      authState.user?.nombre_centro_gestor ||
      authState.user?.centro_gestor_assigned ||
      ''
    ).trim()
  }, [authState.user?.nombre_centro_gestor, authState.user?.centro_gestor_assigned])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onGlobalFiltersUpdated = () => {
      setGlobalFiltersVersion((prev) => prev + 1)
    }

    window.addEventListener('up-filters-updated', onGlobalFiltersUpdated)
    return () => {
      window.removeEventListener('up-filters-updated', onGlobalFiltersUpdated)
    }
  }, [])

  useEffect(() => {
    if (!userCentroGestor) return
    setForm((prev) => {
      if (String(prev.nombre_centro_gestor || '').trim()) return prev
      return { ...prev, nombre_centro_gestor: userCentroGestor }
    })
  }, [userCentroGestor])

  useEffect(() => {
    const defaultRow: CrearIntervencionPayload & { _rowId: string } = {
      _rowId: `row-${bulkRowSeqRef.current++}`,
      upid: defaultUpid || '',
      nombre_centro_gestor: userCentroGestor || '',
    }
    setBulkRows([defaultRow])
  }, [defaultUpid, userCentroGestor])

  useEffect(() => {
    onTabModeChange?.(activeTab)
  }, [activeTab, onTabModeChange])

  const requiredLabels: Record<string, string> = {
    tipo_intervencion: 'Tipo Intervención',
    nombre_centro_gestor: 'Nombre Centro Gestor',
    fuente_financiacion: 'Fuente Financiación',
    identificador: 'Identificador',
    presupuesto_base: 'Presupuesto Base',
    avance_obra: 'Avance Obra',
    clase_up: 'Clase UP',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.upid.trim()) {
      setError('El UPID es obligatorio')
      return
    }

    const missingRequired = Object.entries(requiredLabels)
      .filter(([key]) => {
        const value = (form as any)[key]
        if (typeof value === 'number') return !Number.isFinite(value)
        return !String(value ?? '').trim()
      })
      .map(([, label]) => label)

    if (missingRequired.length > 0) {
      setError(`Completa los campos obligatorios: ${missingRequired.join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await crearIntervencion(form)
      onSuccess([String(form.upid || '').trim()])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear intervención')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof CrearIntervencionPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  const setNumber = (key: keyof CrearIntervencionPayload) => (v: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: v === '' ? undefined : Number(v),
    }))

  const addBulkRow = () => {
    const newRow: CrearIntervencionPayload & { _rowId: string } = {
      _rowId: `row-${bulkRowSeqRef.current++}`,
      upid: defaultUpid || '',
      nombre_centro_gestor: userCentroGestor || '',
    }
    setBulkRows((prev) => [...prev, newRow])
  }

  const removeBulkRow = (rowId: string) => {
    setBulkRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row._rowId !== rowId)))
  }

  const setBulkValue = (rowId: string, key: keyof CrearIntervencionPayload, value: string) => {
    setBulkRows((prev) => prev.map((row) => (row._rowId === rowId ? { ...row, [key]: value } : row)))
  }

  const setBulkNumber = (rowId: string, key: keyof CrearIntervencionPayload, value: string) => {
    setBulkRows((prev) =>
      prev.map((row) =>
        row._rowId === rowId
          ? { ...row, [key]: value === '' ? undefined : Number(value) }
          : row,
      ),
    )
  }

  const validateBulkRow = (row: CrearIntervencionPayload, rowIndex: number): string[] => {
    const errors: string[] = []

    if (!String(row.upid || '').trim()) {
      errors.push(`Fila ${rowIndex + 1}: UPID es obligatorio`)
    }

    for (const [key, label] of Object.entries(requiredLabels)) {
      const value = (row as any)[key]
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) errors.push(`Fila ${rowIndex + 1}: ${label} es obligatorio`)
      } else if (!String(value ?? '').trim()) {
        errors.push(`Fila ${rowIndex + 1}: ${label} es obligatorio`)
      }
    }

    return errors
  }

  const handleBulkSubmit = async () => {
    setError(null)

    const validationErrors = bulkRows.flatMap((row, idx) => validateBulkRow(row, idx))
    if (validationErrors.length > 0) {
      setError(validationErrors.slice(0, 3).join(' | '))
      return
    }

    const payloads: CrearIntervencionPayload[] = bulkRows.map((row) => ({
      upid: String(row.upid || '').trim(),
      tipo_intervencion: String(row.tipo_intervencion || '').trim(),
      nombre_centro_gestor: String(row.nombre_centro_gestor || '').trim(),
      fuente_financiacion: String(row.fuente_financiacion || '').trim(),
      identificador: String(row.identificador || '').trim(),
      presupuesto_base: row.presupuesto_base,
      avance_obra: row.avance_obra,
      clase_up: String(row.clase_up || '').trim(),
      estado: row.estado ? String(row.estado).trim() : undefined,
      bpin: row.bpin,
      cantidad: row.cantidad,
      unidad: row.unidad ? String(row.unidad).trim() : undefined,
      fecha_inicio: row.fecha_inicio ? String(row.fecha_inicio).trim() : undefined,
      fecha_fin: row.fecha_fin ? String(row.fecha_fin).trim() : undefined,
      referencia_contrato: row.referencia_contrato ? String(row.referencia_contrato).trim() : undefined,
      referencia_proceso: row.referencia_proceso ? String(row.referencia_proceso).trim() : undefined,
      url_proceso: row.url_proceso ? String(row.url_proceso).trim() : undefined,
      descripcion_intervencion: row.descripcion_intervencion ? String(row.descripcion_intervencion).trim() : undefined,
    }))

    setLoading(true)
    try {
      const results = await Promise.allSettled(payloads.map((payload) => crearIntervencion(payload)))
      const successCount = results.filter((result) => result.status === 'fulfilled').length
      const successUpids = new Set<string>()
      results.forEach((result, idx) => {
        if (result.status !== 'fulfilled') return
        const upid = String(payloads[idx]?.upid || '').trim()
        if (upid) successUpids.add(upid)
      })
      const failed = results
        .map((result, idx) => ({ result, idx }))
        .filter((item) => item.result.status === 'rejected')

      if (successCount > 0) {
        onSuccess(Array.from(successUpids))
      }

      if (failed.length === 0) {
        onClose()
        return
      }

      setError(`Se crearon ${successCount} intervenciones y fallaron ${failed.length}. Revisa filas: ${failed.map((f) => f.idx + 1).join(', ')}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        if (activeTab === 'multiple') {
          e.preventDefault()
          void handleBulkSubmit()
          return
        }
        void handleSubmit(e)
      }}
      className="space-y-4"
    >
      <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-600 p-1 bg-slate-50 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('individual')
            setError(null)
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'individual' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          Carga Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('multiple')
            setError(null)
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${activeTab === 'multiple' ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          Carga Múltiple
        </button>
      </div>

      {activeTab === 'individual' && (
        <>
      <p className="text-xs text-slate-500 dark:text-slate-400">Los campos con <span className="text-red-500">*</span> son obligatorios.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="UPID" value={form.upid} onChange={set('upid')} required placeholder="ID de la UP padre" />
        <SelectField
          label="Tipo Intervención"
          value={form.tipo_intervencion || ''}
          onChange={set('tipo_intervencion')}
          options={tipoIntervencionOptions}
          placeholder="Selecciona un tipo"
          required
        />
        <SearchableSelectField
          label="Centro Gestor"
          value={form.nombre_centro_gestor || ''}
          onChange={set('nombre_centro_gestor')}
          options={centroGestorOptions}
          placeholder="Selecciona un centro gestor"
          searchPlaceholder="Buscar centro gestor"
          clearSearchOnOpen
          required
        />
        <SelectField
          label="Fuente Financiación"
          value={form.fuente_financiacion || ''}
          onChange={set('fuente_financiacion')}
          options={fuentesFinanciacionOptions}
          placeholder="Selecciona una fuente"
          required
        />
        <SelectField
          label="Estado"
          value={form.estado || ''}
          onChange={set('estado')}
          options={estadosUpOptions}
          placeholder="Selecciona un estado"
        />
        <SelectField
          label="Clase UP"
          value={form.clase_up || ''}
          onChange={set('clase_up')}
          options={claseUpOptions}
          placeholder="Selecciona una clase"
          required
        />

        <Field label="Identificador" value={form.identificador || ''} onChange={set('identificador')} required />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={setNumber('presupuesto_base')} type="number" required />
        <Field label="Avance Obra (%)" value={form.avance_obra ?? ''} onChange={setNumber('avance_obra')} type="number" required />

        <Field label="BPIN" value={form.bpin ?? ''} onChange={setNumber('bpin')} type="number" />
        <Field label="Cantidad" value={form.cantidad ?? ''} onChange={setNumber('cantidad')} type="number" />
        <Field label="Fecha Inicio" value={form.fecha_inicio || ''} onChange={set('fecha_inicio')} type="date" />
        <Field label="Fecha Fin" value={form.fecha_fin || ''} onChange={set('fecha_fin')} type="date" />
        <Field label="Ref. Contrato" value={form.referencia_contrato || ''} onChange={set('referencia_contrato')} />
        <Field label="Ref. Proceso" value={form.referencia_proceso || ''} onChange={set('referencia_proceso')} />
        <Field label="Unidad" value={form.unidad || ''} onChange={set('unidad')} />
        <Field label="URL Proceso" value={form.url_proceso || ''} onChange={set('url_proceso')} />
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
        </>
      )}

      {activeTab === 'multiple' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Agrega una o varias filas. Se aplican los mismos campos y validaciones de la carga individual.
          </p>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="min-w-[1800px] w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="px-2 py-2 text-left">UPID *</th>
                  <th className="px-2 py-2 text-left">Tipo Intervención *</th>
                  <th className="px-2 py-2 text-left">Centro Gestor *</th>
                  <th className="px-2 py-2 text-left">Fuente Financiación *</th>
                  <th className="px-2 py-2 text-left">Estado</th>
                  <th className="px-2 py-2 text-left">Clase UP *</th>
                  <th className="px-2 py-2 text-left">Identificador *</th>
                  <th className="px-2 py-2 text-left">Presupuesto Base *</th>
                  <th className="px-2 py-2 text-left">Avance Obra *</th>
                  <th className="px-2 py-2 text-left">BPIN</th>
                  <th className="px-2 py-2 text-left">Cantidad</th>
                  <th className="px-2 py-2 text-left">Unidad</th>
                  <th className="px-2 py-2 text-left">Fecha Inicio</th>
                  <th className="px-2 py-2 text-left">Fecha Fin</th>
                  <th className="px-2 py-2 text-left">Ref. Contrato</th>
                  <th className="px-2 py-2 text-left">Ref. Proceso</th>
                  <th className="px-2 py-2 text-left">URL Proceso</th>
                  <th className="px-2 py-2 text-left">Descripción</th>
                  <th className="px-2 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row) => (
                  <tr key={row._rowId} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-1.5"><input value={row.upid || ''} onChange={(e) => setBulkValue(row._rowId, 'upid', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><select value={row.tipo_intervencion || ''} onChange={(e) => setBulkValue(row._rowId, 'tipo_intervencion', e.target.value)} className="w-44 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"><option value="">Seleccionar</option>{bulkTipoIntervencionOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></td>
                    <td className="p-1.5">
                      <select
                        value={row.nombre_centro_gestor || ''}
                        onChange={(e) => setBulkValue(row._rowId, 'nombre_centro_gestor', e.target.value)}
                        className="w-52 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"
                      >
                        <option value="">Seleccionar</option>
                        {bulkCentroGestorOptions.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-1.5"><select value={row.fuente_financiacion || ''} onChange={(e) => setBulkValue(row._rowId, 'fuente_financiacion', e.target.value)} className="w-52 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"><option value="">Seleccionar</option>{bulkFuentesFinanciacionOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></td>
                    <td className="p-1.5"><select value={row.estado || ''} onChange={(e) => setBulkValue(row._rowId, 'estado', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"><option value="">Seleccionar</option>{bulkEstadosUpOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></td>
                    <td className="p-1.5"><select value={row.clase_up || ''} onChange={(e) => setBulkValue(row._rowId, 'clase_up', e.target.value)} className="w-44 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900"><option value="">Seleccionar</option>{bulkClaseUpOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></td>
                    <td className="p-1.5"><input value={row.identificador || ''} onChange={(e) => setBulkValue(row._rowId, 'identificador', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="number" value={row.presupuesto_base ?? ''} onChange={(e) => setBulkNumber(row._rowId, 'presupuesto_base', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="number" value={row.avance_obra ?? ''} onChange={(e) => setBulkNumber(row._rowId, 'avance_obra', e.target.value)} className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="number" value={row.bpin ?? ''} onChange={(e) => setBulkNumber(row._rowId, 'bpin', e.target.value)} className="w-28 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="number" value={row.cantidad ?? ''} onChange={(e) => setBulkNumber(row._rowId, 'cantidad', e.target.value)} className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input value={row.unidad || ''} onChange={(e) => setBulkValue(row._rowId, 'unidad', e.target.value)} className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="date" value={row.fecha_inicio || ''} onChange={(e) => setBulkValue(row._rowId, 'fecha_inicio', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input type="date" value={row.fecha_fin || ''} onChange={(e) => setBulkValue(row._rowId, 'fecha_fin', e.target.value)} className="w-36 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input value={row.referencia_contrato || ''} onChange={(e) => setBulkValue(row._rowId, 'referencia_contrato', e.target.value)} className="w-40 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input value={row.referencia_proceso || ''} onChange={(e) => setBulkValue(row._rowId, 'referencia_proceso', e.target.value)} className="w-40 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input value={row.url_proceso || ''} onChange={(e) => setBulkValue(row._rowId, 'url_proceso', e.target.value)} className="w-44 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5"><input value={row.descripcion_intervencion || ''} onChange={(e) => setBulkValue(row._rowId, 'descripcion_intervencion', e.target.value)} className="w-56 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900" /></td>
                    <td className="p-1.5">
                      <button
                        type="button"
                        onClick={() => removeBulkRow(row._rowId)}
                        className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        disabled={bulkRows.length <= 1}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <button
              type="button"
              onClick={addBulkRow}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Agregar fila
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? (activeTab === 'multiple' ? 'Creando varias…' : 'Creando…')
            : (activeTab === 'multiple' ? 'Crear Intervenciones' : 'Crear Intervención')}
        </button>
      </div>
    </form>
  )
}

// ─── Formulario Solicitud de Cambio UP ────────────────────────────

const SolicitarCambioUPForm: React.FC<{ up: UP; onSuccess: () => void; onClose: () => void }> = ({ up, onSuccess, onClose }) => {
  const initialPosition: [number, number] | null =
    up?.geometry?.type === 'Point' && Array.isArray(up?.geometry?.coordinates) && up.geometry.coordinates.length >= 2
      ? [Number(up.geometry.coordinates[1]), Number(up.geometry.coordinates[0])]
      : null

  const [form, setForm] = useState<SolicitudCambioUPPayload>({
    upid: up.upid,
    nombre_up: up.nombre_up,
    nombre_up_detalle: up.nombre_up_detalle || '',
    tipo_equipamiento: up.tipo_equipamiento || '',
    clase_up: up.clase_up || '',
    direccion: up.direccion || '',
    geometry: up.geometry,
  })
  const [position, setPosition] = useState<[number, number] | null>(initialPosition)
  const [isDark, setIsDark] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const claseUpOptions = useMemo(() => getClaseUpOptions(form.clase_up), [form.clase_up])
  const tipoEquipamientoOptions = useMemo(() => getTipoEquipamientoOptions(form.tipo_equipamiento), [form.tipo_equipamiento])

  const allowedSolicitudUPFields: Array<Exclude<keyof SolicitudCambioUPPayload, 'upid' | 'geometry'>> = [
    'nombre_up',
    'nombre_up_detalle',
    'tipo_equipamiento',
    'clase_up',
    'direccion',
  ]

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const updateGeometryWithPosition = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng])
    setForm((prev) => ({
      ...prev,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    }))
  }, [])

  const handleMapPositionChange = useCallback((newPosition: [number, number]) => {
    updateGeometryWithPosition(newPosition[0], newPosition[1])
    setGeoError(null)
  }, [updateGeometryWithPosition])

  const handleGeocodeAddress = useCallback(async () => {
    const address = String(form.direccion || '').trim()
    if (!address) {
      setGeoError('Ingresa una dirección antes de buscar en el mapa.')
      return
    }

    setIsGeocoding(true)
    setGeoError(null)

    try {
      const query = `${address}, Cali, Colombia`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      )

      if (!response.ok) {
        throw new Error('No fue posible geocodificar la dirección.')
      }

      const data = await response.json()
      const firstResult = Array.isArray(data) ? data[0] : null

      if (!firstResult?.lat || !firstResult?.lon) {
        setGeoError('No se encontró una ubicación para esa dirección. Marca el punto manualmente en el mapa.')
        return
      }

      const lat = Number(firstResult.lat)
      const lng = Number(firstResult.lon)

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setGeoError('La geocodificación devolvió coordenadas inválidas. Marca el punto manualmente.')
        return
      }

      updateGeometryWithPosition(lat, lng)
    } catch (geoErr) {
      setGeoError(geoErr instanceof Error ? geoErr.message : 'Error geocodificando la dirección.')
    } finally {
      setIsGeocoding(false)
    }
  }, [form.direccion, updateGeometryWithPosition])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload: SolicitudCambioUPPayload = { upid: form.upid, aprobado: true }

      // Solo incluir campos definidos para la solicitud de cambio de UP.
      for (const key of allowedSolicitudUPFields) {
        const value = form[key]
        if (value === undefined || value === null) continue
        if (typeof value === 'string' && value.trim() === '') continue
        ;(payload as any)[key] = value
      }

      if (form.geometry) {
        payload.geometry = form.geometry
      }

      await crearSolicitudCambioUP(payload)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud de cambio de unidad de proyecto')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof SolicitudCambioUPPayload) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
        Esta acción genera una solicitud en <span className="font-mono">POST /solicitudes_cambios_unidad_proyecto</span>.
        Puedes geocodificar la dirección y ajustar la ubicación manualmente en el mapa.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="UPID" value={form.upid} onChange={() => {}} disabled />
        <Field label="Nombre UP" value={form.nombre_up || ''} onChange={set('nombre_up')} />
        <Field label="Nombre Detalle" value={form.nombre_up_detalle || ''} onChange={set('nombre_up_detalle')} />
        <SearchableSelectField
          label="Tipo Equipamiento"
          value={form.tipo_equipamiento || ''}
          onChange={set('tipo_equipamiento')}
          options={tipoEquipamientoOptions}
          placeholder="Selecciona un tipo"
          searchPlaceholder="Buscar tipo de equipamiento"
        />
        <SelectField
          label="Clase UP"
          value={form.clase_up || ''}
          onChange={set('clase_up')}
          options={claseUpOptions}
          placeholder="Selecciona una clase"
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Field
              label="Dirección"
              value={form.direccion || ''}
              onChange={set('direccion')}
              placeholder="Ingresa la dirección para ubicar la UP"
            />
          </div>
          <div className="sm:pt-6">
            <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={isGeocoding}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:opacity-60"
            >
              {isGeocoding ? 'Buscando…' : 'Buscar dirección'}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          Si no coincide la búsqueda, haz clic en el mapa o arrastra el marcador para ajustar la geometry manualmente.
        </p>

        <UpLocationPickerMap
          position={position}
          onPositionChange={handleMapPositionChange}
          isDark={isDark}
        />

        <div className="text-xs text-slate-500 dark:text-slate-400">
          {position
            ? `Coordenadas seleccionadas: lat ${position[0].toFixed(6)}, lng ${position[1].toFixed(6)}`
            : 'Sin coordenadas seleccionadas. Puedes definirlas manualmente en el mapa.'}
        </div>

        {geoError && <p className="text-sm text-amber-700 dark:text-amber-300">{geoError}</p>}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Enviando…' : 'Solicitar cambio'}
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
  const tipoIntervencionOptions = useMemo(() => getTipoIntervencionOptions(form.tipo_intervencion), [form.tipo_intervencion])
  const fuentesFinanciacionOptions = useMemo(() => getFuentesFinanciacionOptions(form.fuente_financiacion), [form.fuente_financiacion])
  const estadosUpOptions = useMemo(() => getEstadosUpOptions(form.estado), [form.estado])

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
        <SelectField
          label="Estado"
          value={form.estado || ''}
          onChange={set('estado')}
          options={estadosUpOptions}
          placeholder="Selecciona un estado"
        />
        <SelectField
          label="Tipo Intervención"
          value={form.tipo_intervencion || ''}
          onChange={set('tipo_intervencion')}
          options={tipoIntervencionOptions}
          placeholder="Selecciona un tipo"
        />
        <Field label="Centro Gestor" value={form.nombre_centro_gestor || ''} onChange={set('nombre_centro_gestor')} />
        <Field label="Presupuesto Base" value={form.presupuesto_base ?? ''} onChange={(v) => setForm((p) => ({ ...p, presupuesto_base: Number(v) }))} type="number" />
        <Field label="Fecha Inicio" value={form.fecha_inicio || ''} onChange={set('fecha_inicio')} type="date" />
        <Field label="Fecha Fin" value={form.fecha_fin || ''} onChange={set('fecha_fin')} type="date" />
        <SelectField
          label="Fuente Financiación"
          value={form.fuente_financiacion || ''}
          onChange={set('fuente_financiacion')}
          options={fuentesFinanciacionOptions}
          placeholder="Selecciona una fuente"
        />
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

const MS_PER_DAY = 24 * 60 * 60 * 1000

const parseDateOnlyAsUtc = (value?: string): Date | null => {
  if (!value) return null

  const trimmed = String(value).trim()
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1])
    const month = Number(dateOnlyMatch[2]) - 1
    const day = Number(dateOnlyMatch[3])
    return new Date(Date.UTC(year, month, day))
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatIntervDate = (value?: string): string => {
  const parsed = parseDateOnlyAsUtc(value)
  if (!parsed) return '-'
  return parsed.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

const getEstimatedDuration = (start?: string, end?: string): string => {
  const startDate = parseDateOnlyAsUtc(start)
  const endDate = parseDateOnlyAsUtc(end)

  if (!startDate || !endDate) return '-'

  const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY)
  if (diffDays < 0) return '-'

  return `${diffDays} día${diffDays === 1 ? '' : 's'}`
}

// ─── Componente principal ─────────────────────────────────────────

const GestionRegistrosTab: React.FC = () => {
  const { hasRole, state: authState } = useAuth()
  const canDeleteRecords = hasRole('super_admin') || hasRole('admin_general')

  const [ups, setUps] = useState<UP[]>([])
  const [intervencionesMap, setIntervencionesMap] = useState<Record<string, Intervencion[]>>({})
  const [intervencionesCountByUpid, setIntervencionesCountByUpid] = useState<Record<string, number>>({})
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
  const [crearIntervencionTabMode, setCrearIntervencionTabMode] = useState<'individual' | 'multiple'>('individual')
  const [showModificarUP, setShowModificarUP] = useState<UP | null>(null)
  const [showModificarIntervencion, setShowModificarIntervencion] = useState<Intervencion | null>(null)
  const [modalAvance, setModalAvance] = useState<{ upid: string; intervencionId: string; nombre: string; avance: number; presupuesto: number } | null>(null)
  const [modalHistorial, setModalHistorial] = useState<{ upid: string; intervencionId: string; nombre: string; avance: number; presupuesto: number } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'up' | 'intervencion'; id: string; upid?: string } | null>(null)

  const API_BASE = '/api/proxy'
  const latestAvanceByIntervencionRef = useRef<Record<string, number | null>>({})

  const parseListPayload = useCallback((payload: any): any[] => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.items)) return payload.items
    if (Array.isArray(payload?.results)) return payload.results
    return []
  }, [])

  const normalizeCentro = useCallback((value: unknown): string =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim(),
  [])

  const userCentroGestorRaw = useMemo(
    () => authState.user?.nombre_centro_gestor || authState.user?.centro_gestor_assigned || '',
    [authState.user?.centro_gestor_assigned, authState.user?.nombre_centro_gestor],
  )

  const userCentroGestor = useMemo(() => normalizeCentro(userCentroGestorRaw), [normalizeCentro, userCentroGestorRaw])
  const canViewAllCentros = useMemo(
    () => userCentroGestor === '' || userCentroGestor === 'calitrack' || userCentroGestor === 'secretaria de gobierno' || userCentroGestor === 'otro',
    [userCentroGestor],
  )

  const toTimestamp = useCallback((row: any): number => {
    const candidates = [row?.updated_at, row?.fecha_reporte, row?.created_at, row?.fecha, row?.timestamp]
    for (const candidate of candidates) {
      if (typeof candidate !== 'string' || !candidate.trim()) continue
      const parsed = Date.parse(candidate)
      if (!Number.isNaN(parsed)) return parsed
    }
    return 0
  }, [])

  const pickLatestValidAvance = useCallback((rows: any[]): number | null => {
    let bestValue: number | null = null
    let bestTs = Number.NEGATIVE_INFINITY

    rows.forEach((row) => {
      const raw = row?.avance_obra
      const value = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(value)) return
      const ts = toTimestamp(row)
      if (ts >= bestTs) {
        bestTs = ts
        bestValue = value
      }
    })

    return bestValue
  }, [toTimestamp])

  const fetchLatestAvanceForIntervencion = useCallback(async (intervencionId: string): Promise<number | null> => {
    const key = String(intervencionId || '').trim()
    if (!key) return null

    if (Object.prototype.hasOwnProperty.call(latestAvanceByIntervencionRef.current, key)) {
      return latestAvanceByIntervencionRef.current[key]
    }

    try {
      const res = await fetch(`${API_BASE}/avances_unidades_proyecto?intervencion_id=${encodeURIComponent(key)}`)
      if (!res.ok) {
        latestAvanceByIntervencionRef.current[key] = null
        return null
      }

      const json = await res.json()
      const rows = parseListPayload(json)
      const latest = pickLatestValidAvance(rows)
      latestAvanceByIntervencionRef.current[key] = latest
      return latest
    } catch {
      latestAvanceByIntervencionRef.current[key] = null
      return null
    }
  }, [API_BASE, parseListPayload, pickLatestValidAvance])

  const mergeIntervencionesWithLatestAvances = useCallback(async (items: Intervencion[]): Promise<Intervencion[]> => {
    if (!Array.isArray(items) || items.length === 0) return []

    return Promise.all(items.map(async (interv) => {
      const latest = await fetchLatestAvanceForIntervencion(interv.intervencion_id)
      if (typeof latest === 'number') {
        return { ...interv, avance_obra: latest }
      }
      return interv
    }))
  }, [fetchLatestAvanceForIntervencion])

  const extractIntervencionesCountByUpid = useCallback((payload: any): Record<string, number> => {
    const countByUpid: Record<string, number> = {}

    const increment = (upidRaw: unknown, incrementBy: number = 1) => {
      const upid = String(upidRaw || '').trim()
      if (!upid) return
      countByUpid[upid] = (countByUpid[upid] || 0) + incrementBy
    }

    const visit = (node: any) => {
      if (!node) return

      if (Array.isArray(node)) {
        node.forEach(visit)
        return
      }

      if (node?.type === 'FeatureCollection' && Array.isArray(node.features)) {
        node.features.forEach((feature: any) => {
          const props = feature?.properties || {}
          const upid = props?.upid
          if (!upid) return

          if (typeof props?.n_intervenciones === 'number') {
            countByUpid[String(upid).trim()] = Math.max(0, props.n_intervenciones)
            return
          }

          if (Array.isArray(props?.intervenciones)) {
            countByUpid[String(upid).trim()] = props.intervenciones.length
            return
          }

          increment(upid, 1)
        })
        return
      }

      if (Array.isArray(node?.data)) {
        visit(node.data)
        return
      }

      if (node?.upid !== undefined && Array.isArray(node?.intervenciones)) {
        countByUpid[String(node.upid).trim()] = node.intervenciones.length
        return
      }

      if (node?.upid !== undefined) {
        increment(node.upid, 1)
      }
    }

    visit(payload)
    return countByUpid
  }, [])

  const loadIntervencionesSummary = useCallback(async (upsToEvaluate: UP[]) => {
    if (upsToEvaluate.length === 0) {
      setIntervencionesCountByUpid({})
      return
    }

    const baseMap: Record<string, number> = {}
    upsToEvaluate.forEach((up) => {
      baseMap[String(up.upid || '').trim()] = 0
    })

    try {
      const res = await fetch(`${API_BASE}/intervenciones?limit=10000`)
      const json = await res.json()
      const extractedCounts = extractIntervencionesCountByUpid(json)

      setIntervencionesCountByUpid({
        ...baseMap,
        ...extractedCounts,
      })
    } catch {
      // Mantener estado base (0) para permitir identificar rápidamente UP sin intervenciones.
      setIntervencionesCountByUpid(baseMap)
    }
  }, [API_BASE, extractIntervencionesCountByUpid])

  // Cargar UPs
  const loadUPs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/unidades-proyecto?limit=10000`)
      const json = await res.json()
      const rawItems = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []

      // Enriquecer cada UP con datos de su primera intervención (si viene anidada)
      const normalizedItems: Array<{ up: UP; intervenciones: any[] }> = rawItems.map((item: any) => {
        const intervenciones = Array.isArray(item.intervenciones) ? item.intervenciones : []
        const first = intervenciones[0] || {}

        const up: UP = {
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

        return { up, intervenciones }
      })

      const matchesCentro = (candidate: unknown): boolean => {
        const normalizedCandidate = normalizeCentro(candidate)
        if (!normalizedCandidate || !userCentroGestor) return false
        return (
          normalizedCandidate === userCentroGestor ||
          normalizedCandidate.includes(userCentroGestor) ||
          userCentroGestor.includes(normalizedCandidate)
        )
      }

      let filteredItems: UP[] = canViewAllCentros
        ? normalizedItems.map(({ up }) => up)
        : normalizedItems
            .filter(({ up, intervenciones }) => {
              const topLevelCandidates = [
                up.nombre_centro_gestor,
                (up as any)?.centro_gestor,
                (up as any)?.responsible,
              ]

              const intervencionCandidates = intervenciones.flatMap((interv: any) => [
                interv?.nombre_centro_gestor,
                interv?.centro_gestor,
                interv?.responsible,
              ])

              return [...topLevelCandidates, ...intervencionCandidates].some(matchesCentro)
            })
            .map(({ up }) => up)

      // Fallback robusto: si el endpoint de UP no trae centros consistentes,
      // usar /intervenciones para mapear UPID permitidos por centro gestor.
      if (!canViewAllCentros && filteredItems.length === 0 && userCentroGestor) {
        try {
          const intervRes = await fetch(`${API_BASE}/intervenciones?limit=10000`)
          const intervJson = await intervRes.json()
          const intervRows = parseListPayload(intervJson)

          const allowedUpids = new Set(
            intervRows
              .filter((row: any) => {
                const candidates = [
                  row?.nombre_centro_gestor,
                  row?.centro_gestor,
                  row?.responsible,
                ]
                return candidates.some(matchesCentro)
              })
              .map((row: any) => String(row?.upid || '').trim())
              .filter(Boolean)
          )

          if (allowedUpids.size > 0) {
            filteredItems = normalizedItems
              .filter(({ up }) => allowedUpids.has(String(up.upid || '').trim()))
              .map(({ up }) => up)
          }
        } catch {
          // Si falla el fallback, mantener resultado actual y mostrar estado vacío controlado.
        }
      }

      setUps(filteredItems)
      void loadIntervencionesSummary(filteredItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar UPs')
    } finally {
      setLoading(false)
    }
  }, [API_BASE, canViewAllCentros, loadIntervencionesSummary, normalizeCentro, parseListPayload, userCentroGestor])

  useEffect(() => { loadUPs() }, [loadUPs])

  // Cargar intervenciones + calcular métricas
  const loadIntervenciones = useCallback(async (upid: string, options?: { force?: boolean }) => {
    const force = options?.force === true
    if ((!force && intervencionesMap[upid] !== undefined) || loadingIntervUp[upid]) return
    setLoadingIntervUp(prev => ({ ...prev, [upid]: true }))
    try {
      const res = await fetch(`${API_BASE}/intervenciones?upid=${encodeURIComponent(upid)}&limit=10000`)
      const json = await res.json()
      const rawItems: Intervencion[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
      const items = await mergeIntervencionesWithLatestAvances(rawItems)
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
  }, [intervencionesMap, loadingIntervUp, mergeIntervencionesWithLatestAvances])

  const refreshIntervencionesForUpid = useCallback((upidRaw?: string) => {
    const upid = String(upidRaw || '').trim()
    if (!upid) return

    setIntervencionesMap(prev => {
      const copy = { ...prev }
      delete copy[upid]
      return copy
    })

    setMetrics(prev => {
      const copy = { ...prev }
      delete copy[upid]
      return copy
    })

    // Invalida cache de avances para evitar mostrar valores viejos tras mutaciones.
    latestAvanceByIntervencionRef.current = {}

    void loadIntervenciones(upid, { force: true })
    void loadIntervencionesSummary(ups)
  }, [loadIntervenciones, loadIntervencionesSummary, ups])

  // Filtrar + paginar
  const filteredUPs = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? ups.filter(u =>
          u.upid.toLowerCase().includes(term) ||
          u.nombre_up?.toLowerCase().includes(term) ||
          u.nombre_centro_gestor?.toLowerCase().includes(term)
        )
      : ups

    return [...filtered].sort((a, b) => {
      const aHasNoIntervenciones = (intervencionesCountByUpid[a.upid] ?? 0) === 0
      const bHasNoIntervenciones = (intervencionesCountByUpid[b.upid] ?? 0) === 0

      if (aHasNoIntervenciones !== bHasNoIntervenciones) {
        return aHasNoIntervenciones ? -1 : 1
      }

      return a.upid.localeCompare(b.upid, 'es', { numeric: true, sensitivity: 'base' })
    })
  }, [ups, search, intervencionesCountByUpid])

  const upsSinIntervencionesCount = useMemo(
    () => filteredUPs.filter((up) => (intervencionesCountByUpid[up.upid] ?? 0) === 0).length,
    [filteredUPs, intervencionesCountByUpid]
  )

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

  const handleOpenAvance = (up: UP, interv: Intervencion) => {
    if (!interv?.intervencion_id) return
    setModalAvance({
      upid: up.upid,
      intervencionId: interv.intervencion_id,
      nombre: `${up.nombre_up || up.upid} · ${interv.intervencion_id}`,
      avance: interv.avance_obra || 0,
      presupuesto: interv.presupuesto_base || 0,
    })
  }

  const handleOpenHistorial = (up: UP, interv: Intervencion) => {
    if (!interv?.intervencion_id) return
    setModalHistorial({
      upid: up.upid,
      intervencionId: interv.intervencion_id,
      nombre: `${up.nombre_up || up.upid} · ${interv.intervencion_id}`,
      avance: interv.avance_obra || 0,
      presupuesto: interv.presupuesto_base || 0,
    })
  }

  // Eliminar
  const handleDelete = async () => {
    if (!canDeleteRecords) {
      setConfirmDelete(null)
      alert('No tienes permisos para eliminar registros.')
      return
    }

    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'up') {
        await eliminarUnidadProyecto(confirmDelete.id)
        await loadUPs()
      } else {
        await eliminarIntervencion(confirmDelete.id)
        if (confirmDelete.upid) {
          refreshIntervencionesForUpid(confirmDelete.upid)
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
        <div className="flex items-center w-full sm:w-auto justify-end">
          <button onClick={() => setShowCrearUP(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Nueva UP
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {upsSinIntervencionesCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {upsSinIntervencionesCount} UP{upsSinIntervencionesCount !== 1 ? 's' : ''} sin intervenciones asociadas aparecen primero para facilitar su gestión.
        </div>
      )}

      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <span className="font-medium">Filtro de centro gestor:</span>
        <span className="font-semibold">
          {canViewAllCentros ? 'Sin restricción (Calitrack/Otro)' : (userCentroGestorRaw || 'No definido')}
        </span>
        {!canViewAllCentros && (
          <span className="text-slate-500 dark:text-slate-400">· {ups.length} registros visibles</span>
        )}
      </div>

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
                    const intervenciones = (intervencionesMap[up.upid] || []).filter(
                      (interv) => String(interv.upid || '').trim() === String(up.upid).trim()
                    )
                    const hasNoIntervenciones = (intervencionesCountByUpid[up.upid] ?? 0) === 0
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
                          className={`transition-colors cursor-pointer ${
                            hasNoIntervenciones
                              ? 'bg-amber-50/70 dark:bg-amber-900/10 border-l-4 border-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
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
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm leading-none">
                                {up.upid}
                              </span>
                              {hasNoIntervenciones && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-semibold">
                                  Sin intervenciones
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Nombre */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <div className="space-y-0.5">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">{up.nombre_up}</p>
                              {up.nombre_up_detalle && (
                                <p className="font-normal italic text-gray-900 dark:text-white text-[11px] sm:text-xs leading-tight">
                                  {up.nombre_up_detalle}
                                </p>
                              )}
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
                              {canDeleteRecords && (
                                <button
                                  onClick={() => setConfirmDelete({ type: 'up', id: up.upid })}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Eliminar UP"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
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
                                    <span className="text-xs text-gray-500">Sin intervenciones asignadas</span>
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
                                      <table className="w-full table-fixed text-xs min-w-[760px] md:min-w-0">
                                        <thead>
                                          <tr className="bg-blue-100 dark:bg-blue-900/30">
                                            <th className="px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-32">ID Intervención</th>
                                            <th className="px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-36">Tipo</th>
                                            <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-36">Estado</th>
                                            <th className="hidden md:table-cell px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-24">Fecha Inicio</th>
                                            <th className="hidden md:table-cell px-2 py-1.5 text-left font-semibold text-blue-700 dark:text-blue-300 w-24">Fecha Fin</th>
                                            <th className="hidden md:table-cell px-2 py-1.5 text-center font-semibold text-blue-700 dark:text-blue-300 w-24">Duración estimada</th>
                                            <th className="px-2 py-1.5 text-center font-semibold text-blue-700 dark:text-blue-300 w-20">Avance</th>
                                            <th className="hidden lg:table-cell px-2 py-1.5 text-right font-semibold text-blue-700 dark:text-blue-300 w-28">Presupuesto</th>
                                            <th className="px-2 py-1.5 text-center font-semibold text-blue-700 dark:text-blue-300 w-24">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-blue-100 dark:divide-blue-800">
                                          {intervenciones.map(interv => (
                                            <tr key={interv.intervencion_id} className="bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                                              <td className="px-2 py-1.5 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{interv.intervencion_id}</td>
                                              <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300 w-36">
                                                <div className="truncate">{interv.tipo_intervencion || '-'}</div>
                                                <div className="mt-0.5 space-y-0.5 text-[10px] leading-tight text-slate-500 dark:text-slate-400 md:hidden">
                                                  <div><span className="font-medium">Inicio:</span> {formatIntervDate(interv.fecha_inicio)}</div>
                                                  <div><span className="font-medium">Fin:</span> {formatIntervDate(interv.fecha_fin)}</div>
                                                  <div><span className="font-medium">Duración:</span> {getEstimatedDuration(interv.fecha_inicio, interv.fecha_fin)}</div>
                                                </div>
                                              </td>
                                              <td className="hidden sm:table-cell px-2 py-1.5 text-gray-700 dark:text-gray-300 w-36 truncate">{interv.estado || '-'}</td>
                                              <td className="hidden md:table-cell px-2 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatIntervDate(interv.fecha_inicio)}</td>
                                              <td className="hidden md:table-cell px-2 py-1.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatIntervDate(interv.fecha_fin)}</td>
                                              <td className="hidden md:table-cell px-2 py-1.5 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">{getEstimatedDuration(interv.fecha_inicio, interv.fecha_fin)}</td>
                                              <td className="px-2 py-1.5"><ProgressBar value={interv.avance_obra || 0} /></td>
                                              <td className="hidden lg:table-cell px-2 py-1.5 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap tabular-nums">
                                                {formatCurrencyFull(interv.presupuesto_base || 0)}
                                              </td>
                                              <td className="px-2 py-1.5">
                                                <div className="flex items-center justify-center gap-0.5">
                                                  <button
                                                    onClick={() => handleOpenAvance(up, interv)}
                                                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                                    title="Registrar avance"
                                                  >
                                                    <TrendingUp className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleOpenHistorial(up, interv)}
                                                    className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded transition-colors"
                                                    title="Ver historial"
                                                  >
                                                    <History className="w-3 h-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => setShowModificarIntervencion(interv)}
                                                    className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                                                    title="Editar intervención"
                                                  >
                                                    <Edit3 className="w-3 h-3" />
                                                  </button>
                                                  {canDeleteRecords && (
                                                    <button
                                                      onClick={() => setConfirmDelete({ type: 'intervencion', id: interv.intervencion_id, upid: up.upid })}
                                                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                      title="Eliminar intervención"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  )}
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
        {modalAvance && (
          <RegistrarAvanceUPModal
            upid={modalAvance.upid}
            intervencionId={modalAvance.intervencionId}
            nombreUP={modalAvance.nombre}
            avanceActual={modalAvance.avance}
            presupuesto={modalAvance.presupuesto}
            onClose={() => setModalAvance(null)}
            onSuccess={() => {
              const upid = modalAvance.upid
              refreshIntervencionesForUpid(upid)
              setModalAvance(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalHistorial && (
          <HistorialAvancesUP
            upid={modalHistorial.upid}
            intervencionId={modalHistorial.intervencionId}
            nombreUP={modalHistorial.nombre}
            presupuesto={modalHistorial.presupuesto}
            onClose={() => setModalHistorial(null)}
            onRegistrarAvance={() => {
              setModalHistorial(null)
              setModalAvance({
                upid: modalHistorial.upid,
                intervencionId: modalHistorial.intervencionId,
                nombre: modalHistorial.nombre,
                avance: modalHistorial.avance,
                presupuesto: modalHistorial.presupuesto,
              })
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCrearUP && (
          <Modal title="Crear Unidad de Proyecto" onClose={() => setShowCrearUP(false)} maxWidthClass="max-w-4xl">
            <CrearUPForm onSuccess={loadUPs} onClose={() => setShowCrearUP(false)} />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCrearIntervencion !== null && (
          <Modal
            title="Crear Intervención"
            onClose={() => {
              setShowCrearIntervencion(null)
              setCrearIntervencionTabMode('individual')
            }}
            maxWidthClass={crearIntervencionTabMode === 'multiple' ? 'max-w-[96vw] 2xl:max-w-[1860px]' : 'max-w-lg'}
          >
            <CrearIntervencionForm
              defaultUpid={showCrearIntervencion}
              onSuccess={(upids) => {
                const affected = Array.isArray(upids) && upids.length > 0
                  ? upids
                  : (showCrearIntervencion ? [showCrearIntervencion] : [])
                affected.forEach((upid) => refreshIntervencionesForUpid(upid))
              }}
              onClose={() => {
                setShowCrearIntervencion(null)
                setCrearIntervencionTabMode('individual')
              }}
              onTabModeChange={setCrearIntervencionTabMode}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModificarUP && (
          <Modal title="Solicitud de cambio en unidad de proyecto" onClose={() => setShowModificarUP(null)} maxWidthClass="max-w-4xl">
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
                  refreshIntervencionesForUpid(showModificarIntervencion.upid)
                }
              }}
              onClose={() => setShowModificarIntervencion(null)}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canDeleteRecords && confirmDelete && (
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
