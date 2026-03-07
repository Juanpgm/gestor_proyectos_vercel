'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Bug, ShieldAlert, Lightbulb, X, ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { CSS_UTILS, CATEGORIES } from '@/lib/design-system'
import { apiClient } from '@/services/api'

type ModalType = 'bug' | 'escalada' | 'recomendacion' | null

const ROLES_DISPONIBLES = [
  { value: 'editor', label: 'Editor' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Administrador' },
  { value: 'coordinador', label: 'Coordinador' },
]

interface FormState {
  descripcion: string
  justificacion: string
  rolSolicitado: string
}

const INITIAL_FORM: FormState = {
  descripcion: '',
  justificacion: '',
  rolSolicitado: '',
}

const MODAL_CONFIG = {
  bug: {
    title: 'Reportar Bug',
    icon: Bug,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    btnColor: 'bg-red-600 hover:bg-red-700',
    descLabel: 'Descripción del bug',
    descPlaceholder: 'Describe el comportamiento inesperado, los pasos para reproducirlo y lo que esperabas que ocurriera...',
    justLabel: 'Impacto / Contexto adicional',
    justPlaceholder: 'Indica el impacto en tu trabajo y cualquier detalle adicional que ayude a reproducir el error...',
    endpoint: 'reportar-bug',
  },
  escalada: {
    title: 'Solicitar Escalada de Privilegios',
    icon: ShieldAlert,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    btnColor: 'bg-amber-600 hover:bg-amber-700',
    descLabel: 'Motivo de la solicitud',
    descPlaceholder: 'Explica las funcionalidades que necesitas acceder y para qué proyecto o tarea...',
    justLabel: 'Justificación de la escalada',
    justPlaceholder: 'Indica por qué requieres este nivel de acceso y cómo beneficiará al proyecto...',
    endpoint: 'solicitar-escalada-privilegios',
  },
  recomendacion: {
    title: 'Realizar Recomendación',
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    btnColor: 'bg-blue-600 hover:bg-blue-700',
    descLabel: 'Recomendación o sugerencia',
    descPlaceholder: 'Describe tu idea o mejora propuesta para el sistema...',
    justLabel: 'Beneficio esperado',
    justPlaceholder: 'Explica cómo esta mejora beneficiaría al equipo o al proceso de gestión...',
    endpoint: 'realizar-recomendacion',
  },
}

const GearMenu: React.FC = () => {
  const { state, getHighestRole } = useAuth()
  const user = state.user

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openModal = (type: ModalType) => {
    setMenuOpen(false)
    setForm(INITIAL_FORM)
    setStatus('idle')
    setErrorMsg('')
    setActiveModal(type)
  }

  const closeModal = () => {
    if (status === 'loading') return
    setActiveModal(null)
    setStatus('idle')
    setErrorMsg('')
    setForm(INITIAL_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeModal) return

    if (!form.descripcion.trim() || !form.justificacion.trim()) {
      setErrorMsg('Todos los campos son obligatorios.')
      return
    }
    if (activeModal === 'escalada' && !form.rolSolicitado) {
      setErrorMsg('Debes seleccionar el rol solicitado.')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    const config = MODAL_CONFIG[activeModal]
    const userPayload = {
      uid: user?.uid || 'desconocido',
      email: user?.email || 'desconocido',
      nombre: user?.displayName || user?.email || 'Usuario sin nombre',
      rol: getHighestRole() || user?.primary_role || 'sin_rol',
      centro_gestor: user?.nombre_centro_gestor || user?.centro_gestor_assigned || null,
    }

    const payload: Record<string, unknown> = {
      descripcion: form.descripcion.trim(),
      justificacion: form.justificacion.trim(),
      usuario: userPayload,
      metadata: {
        fuente: 'gear_menu_modal',
        tipo_formulario: activeModal,
        submitted_at: new Date().toISOString(),
      },
    }

    if (activeModal === 'bug') {
      payload.reportado_por = userPayload
      payload.impacto = form.justificacion.trim()
    }

    if (activeModal === 'escalada') {
      payload.rol_solicitado = form.rolSolicitado
      payload.solicitado_por = userPayload
      payload.motivo = form.descripcion.trim()
    }

    if (activeModal === 'recomendacion') {
      payload.recomendacion = form.descripcion.trim()
      payload.beneficio_esperado = form.justificacion.trim()
      payload.enviado_por = userPayload
    }

    try {
      await apiClient.post(config.endpoint, payload)
      setStatus('success')
    } catch (err) {
      console.error(`Error al guardar ${activeModal}:`, err)
      setErrorMsg('Ocurrió un error al enviar la solicitud. Inténtalo de nuevo.')
      setStatus('error')
    }
  }

  const renderModal = () => {
    if (!activeModal) return null
    const config = MODAL_CONFIG[activeModal]
    const Icon = config.icon

    return (
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b ${config.borderColor}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${config.bgColor}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{config.title}</h2>
              </div>
              <button
                onClick={closeModal}
                disabled={status === 'loading'}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {status === 'success' ? (
              /* Success state */
              <div className="p-8 flex flex-col items-center gap-4 text-center">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <p className="text-base font-semibold text-gray-900 dark:text-white">¡Enviado correctamente!</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tu {
                    activeModal === 'bug'
                      ? 'reporte'
                      : activeModal === 'escalada'
                      ? 'solicitud'
                      : 'recomendación'
                  } ha sido registrada. El equipo administrativo lo revisará a la brevedad.
                </p>
                <button
                  onClick={closeModal}
                  className="mt-2 px-5 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                {/* Datos del usuario (solo lectura) */}
                <div className={`rounded-xl p-3 ${config.bgColor} border ${config.borderColor}`}>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Enviado por</p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.displayName || user?.email || 'Usuario desconocido'}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(getHighestRole() || user?.primary_role) && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                          {getHighestRole() || user?.primary_role}
                        </span>
                      )}
                      {(user?.nombre_centro_gestor || user?.centro_gestor_assigned) && (
                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          {user?.nombre_centro_gestor || user?.centro_gestor_assigned}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rol solicitado (solo para escalada) */}
                {activeModal === 'escalada' && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rol solicitado <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.rolSolicitado}
                        onChange={(e) => setForm(f => ({ ...f, rolSolicitado: e.target.value }))}
                        required
                        className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 pr-9"
                      >
                        <option value="">Seleccionar rol...</option>
                        {ROLES_DISPONIBLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.descLabel} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    required
                    rows={3}
                    placeholder={config.descPlaceholder}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Justificación */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.justLabel} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.justificacion}
                    onChange={(e) => setForm(f => ({ ...f, justificacion: e.target.value }))}
                    required
                    rows={3}
                    placeholder={config.justPlaceholder}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Error */}
                {(status === 'error' || errorMsg) && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{errorMsg || 'Error al enviar. Inténtalo nuevamente.'}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={status === 'loading'}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white ${config.btnColor} transition-colors disabled:opacity-70`}
                  >
                    {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'loading' ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <>
      <div ref={menuRef} className="relative">
        {/* Gear button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMenuOpen(o => !o)}
          className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.contracts.className.text} hidden tablet:flex md:flex items-center justify-center`}
          title="Opciones del sistema"
          data-tour-id="header-settings"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <Settings className="w-5 h-5 tablet:w-6 tablet:h-6" />
        </motion.button>

        {/* Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Sistema</p>
              </div>

              <button
                onClick={() => openModal('bug')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors group"
              >
                <Bug className="w-4 h-4 text-red-400 group-hover:text-red-500 flex-shrink-0" />
                Reportar Bug
              </button>

              <button
                onClick={() => openModal('escalada')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors group"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400 group-hover:text-amber-500 flex-shrink-0" />
                Solicitar Escalada de Privilegios
              </button>

              <button
                onClick={() => openModal('recomendacion')}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors group"
              >
                <Lightbulb className="w-4 h-4 text-blue-400 group-hover:text-blue-500 flex-shrink-0" />
                Realizar Recomendación
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals portal */}
      {renderModal()}
    </>
  )
}

export default GearMenu
