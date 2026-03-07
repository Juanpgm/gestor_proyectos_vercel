'use client'

import React, { useMemo, useState } from 'react'
import { RefreshCw, Save, Trash2, Pencil, Plus, X } from 'lucide-react'

export interface CrudFieldConfig {
  key: string
  label: string
  requiredOnCreate?: boolean
  multiline?: boolean
}

interface RecordsCrudPanelProps {
  title: string
  subtitle: string
  records: Array<Record<string, unknown>>
  fields: CrudFieldConfig[]
  loading: boolean
  canManage: boolean
  onRefresh: () => Promise<void> | void
  onCreate: (payload: Record<string, unknown>) => Promise<void>
  onUpdate: (registroId: string, payload: Record<string, unknown>) => Promise<void>
  onDelete: (registroId: string) => Promise<void>
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

export default function RecordsCrudPanel({
  title,
  subtitle,
  records,
  fields,
  loading,
  canManage,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete
}: RecordsCrudPanelProps) {
  const [createDraft, setCreateDraft] = useState<Record<string, string>>({})
  const [editTarget, setEditTarget] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const normalizedRecords = useMemo<Array<Record<string, unknown>>>(() => {
    return records.map((record) => {
      const rid = asText(record.registro_id || record.id)
      return {
        ...record,
        registro_id: rid
      } as Record<string, unknown>
    })
  }, [records])

  const visibleColumns = useMemo(() => {
    const ordered = ['registro_id', ...fields.map((field) => field.key), 'created_at', 'updated_at']
    return ordered
  }, [fields])

  const resetCreateDraft = () => {
    setCreateDraft({})
  }

  const handleCreate = async () => {
    if (!canManage || submitting) return

    const missingRequired = fields.some((field) => field.requiredOnCreate && !asText(createDraft[field.key]).trim())
    if (missingRequired) return

    const payload = fields.reduce<Record<string, unknown>>((acc, field) => {
      const value = asText(createDraft[field.key]).trim()
      if (value) acc[field.key] = value
      return acc
    }, {})

    setSubmitting(true)
    try {
      await onCreate(payload)
      resetCreateDraft()
    } finally {
      setSubmitting(false)
    }
  }

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

    const approved = window.confirm(`Deseas eliminar el registro ${registroId}?`)
    if (!approved) return

    setSubmitting(true)
    try {
      await onDelete(registroId)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>

        <button
          onClick={() => onRefresh()}
          disabled={loading || submitting}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Crear nuevo registro</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={`create-${field.key}`}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                {field.label}{field.requiredOnCreate ? ' *' : ''}
              </label>
              {field.multiline ? (
                <textarea
                  rows={3}
                  value={createDraft[field.key] || ''}
                  onChange={(e) => setCreateDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
              ) : (
                <input
                  type="text"
                  value={createDraft[field.key] || ''}
                  onChange={(e) => setCreateDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={handleCreate}
            disabled={!canManage || submitting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Crear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/40">
            <tr>
              {visibleColumns.map((column) => (
                <th key={column} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">
                  {column}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase">acciones</th>
            </tr>
          </thead>
          <tbody>
            {normalizedRecords.map((record) => {
              const rid = asText(record.registro_id)
              const isEditing = editTarget === rid

              return (
                <tr key={rid || JSON.stringify(record)} className="border-t border-gray-100 dark:border-gray-700">
                  {visibleColumns.map((column) => (
                    <td key={`${rid}-${column}`} className="px-3 py-2 align-top text-gray-700 dark:text-gray-200 max-w-[280px]">
                      {isEditing && fields.some((field) => field.key === column) ? (
                        fields.find((field) => field.key === column)?.multiline ? (
                          <textarea
                            rows={2}
                            value={editDraft[column] || ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, [column]: e.target.value }))}
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editDraft[column] || ''}
                            onChange={(e) => setEditDraft((prev) => ({ ...prev, [column]: e.target.value }))}
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                          />
                        )
                      ) : (
                        <span className="line-clamp-3 break-words">{asText(record[column]) || '-'}</span>
                      )}
                    </td>
                  ))}

                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={!canManage || submitting}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(record)}
                            disabled={!canManage || !rid}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(rid)}
                            disabled={!canManage || !rid || submitting}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && normalizedRecords.length === 0 && (
          <div className="px-3 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            No hay registros para mostrar.
          </div>
        )}
      </div>

      {!canManage && (
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          Modo solo lectura: necesitas permisos de super administrador para crear, editar o eliminar.
        </div>
      )}
    </div>
  )
}
