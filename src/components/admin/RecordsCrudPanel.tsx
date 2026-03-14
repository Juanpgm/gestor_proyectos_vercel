'use client'

import React, { useMemo, useState } from 'react'
import { RefreshCw, Save, Trash2, Pencil, X, Inbox, Clock, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CrudFieldConfig {
  key: string
  label: string
  requiredOnCreate?: boolean
  multiline?: boolean
}

interface RecordsCrudPanelProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  records: Array<Record<string, unknown>>
  fields: CrudFieldConfig[]
  loading: boolean
  canManage: boolean
  onRefresh: () => Promise<void> | void
  onUpdate: (registroId: string, payload: Record<string, unknown>) => Promise<void>
  onDelete: (registroId: string) => Promise<void>
  emptyMessage?: string
  accentColor?: string
}

const asText = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const formatDate = (value: unknown): string => {
  const raw = asText(value)
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function RecordsCrudPanel({
  title,
  subtitle,
  icon,
  records,
  fields,
  loading,
  canManage,
  onRefresh,
  onUpdate,
  onDelete,
  emptyMessage = 'No hay registros para mostrar.',
  accentColor = 'blue'
}: RecordsCrudPanelProps) {
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const normalizedRecords = useMemo<Array<Record<string, unknown>>>(() => {
    return records.map((record) => {
      const rid = asText(record.registro_id || record.id)
      return { ...record, registro_id: rid } as Record<string, unknown>
    })
  }, [records])

  const startEdit = (record: Record<string, unknown>) => {
    const rid = asText(record.registro_id)
    if (!rid) return
    const nextDraft = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = asText(record[field.key])
      return acc
    }, {})
    setEditTarget(rid)
    setEditDraft(nextDraft)
  }

  const cancelEdit = () => {
    setEditTarget(null)
    setEditDraft({})
  }

  const handleSaveEdit = async () => {
    if (!canManage || submitting || !editTarget) return
    const payload = fields.reduce<Record<string, unknown>>((acc, field) => {
      const value = asText(editDraft[field.key]).trim()
      if (value) acc[field.key] = value
      return acc
    }, {})

    setSubmitting(true)
    try {
      await onUpdate(editTarget, payload)
      cancelEdit()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (registroId: string) => {
    if (!canManage || submitting || !registroId) return
    setSubmitting(true)
    try {
      await onDelete(registroId)
    } finally {
      setSubmitting(false)
      setDeleteConfirmId(null)
    }
  }

  const colorMap: Record<string, { bg: string; border: string; badge: string; badgeText: string; accent: string; ring: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/40',
      badge: 'bg-blue-100 dark:bg-blue-900/30',
      badgeText: 'text-blue-700 dark:text-blue-300',
      accent: 'text-blue-600 dark:text-blue-400',
      ring: 'focus:ring-blue-500'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800/40',
      badge: 'bg-red-100 dark:bg-red-900/30',
      badgeText: 'text-red-700 dark:text-red-300',
      accent: 'text-red-600 dark:text-red-400',
      ring: 'focus:ring-red-500'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800/40',
      badge: 'bg-amber-100 dark:bg-amber-900/30',
      badgeText: 'text-amber-700 dark:text-amber-300',
      accent: 'text-amber-600 dark:text-amber-400',
      ring: 'focus:ring-amber-500'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      badge: 'bg-emerald-100 dark:bg-emerald-900/30',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      accent: 'text-emerald-600 dark:text-emerald-400',
      ring: 'focus:ring-emerald-500'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      border: 'border-purple-200 dark:border-purple-800/40',
      badge: 'bg-purple-100 dark:bg-purple-900/30',
      badgeText: 'text-purple-700 dark:text-purple-300',
      accent: 'text-purple-600 dark:text-purple-400',
      ring: 'focus:ring-purple-500'
    }
  }

  const colors = colorMap[accentColor] || colorMap.blue

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl border ${colors.border} ${colors.bg} p-5`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && <div className={colors.accent}>{icon}</div>}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${colors.badge} ${colors.badgeText}`}>
              {normalizedRecords.length} registro{normalizedRecords.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onRefresh()}
              disabled={loading || submitting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-400 dark:border-gray-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando registros...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && normalizedRecords.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Inbox className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{emptyMessage}</p>
          </div>
        </div>
      )}

      {/* Records as cards */}
      {!loading && normalizedRecords.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {normalizedRecords.map((record, index) => {
              const rid = asText(record.registro_id)
              const isEditing = editTarget === rid
              const reportedBy = asText(record.reportado_por)
              const createdAt = formatDate(record.created_at)
              const updatedAt = formatDate(record.updated_at)

              return (
                <motion.div
                  key={rid || `record-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card header with metadata */}
                  <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      {reportedBy && (
                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-200">
                          <User className="w-3.5 h-3.5" />
                          {reportedBy}
                        </span>
                      )}
                      {rid && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${colors.badge} ${colors.badgeText}`}>
                          #{rid.length > 12 ? `${rid.slice(0, 6)}...${rid.slice(-4)}` : rid}
                        </span>
                      )}
                      {createdAt && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {createdAt}
                        </span>
                      )}
                      {updatedAt && updatedAt !== createdAt && (
                        <span className="inline-flex items-center gap-1 italic">
                          Editado: {updatedAt}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {canManage && !isEditing && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEdit(record)}
                          disabled={!rid}
                          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(rid)}
                          disabled={!rid || submitting}
                          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        {fields
                          .filter((field) => field.key !== 'reportado_por')
                          .map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                              {field.label}
                            </label>
                            {field.multiline ? (
                              <textarea
                                rows={3}
                                value={editDraft[field.key] || ''}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 ${colors.ring} focus:border-transparent transition`}
                              />
                            ) : (
                              <input
                                type="text"
                                value={editDraft[field.key] || ''}
                                onChange={(e) => setEditDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 ${colors.ring} focus:border-transparent transition`}
                              />
                            )}
                          </div>
                        ))}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {fields
                          .filter((field) => field.key !== 'reportado_por')
                          .map((field) => {
                          const value = asText(record[field.key])
                          if (!value) return null
                          return (
                            <div key={field.key}>
                              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                                {field.label}
                              </p>
                              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                {value}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirmar eliminación</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                ¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read-only notice */}
      {!canManage && normalizedRecords.length > 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5">
          Modo solo lectura: necesitas permisos de super administrador para editar o eliminar registros.
        </div>
      )}
    </div>
  )
}
