'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Shield, Loader, AlertCircle } from 'lucide-react'
import { AdminUser, RoleId, ROLES_CONFIG, getHighestRole, getRoleInfo } from '@/types/admin'
import adminService from '@/services/admin.service'

interface RoleAssignmentModalProps {
  user: AdminUser
  onClose: () => void
  onSuccess: () => void
}

export default function RoleAssignmentModal({
  user,
  onClose,
  onSuccess
}: RoleAssignmentModalProps) {
  const detectedCurrentRole = getHighestRole(user.roles)
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(detectedCurrentRole)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!selectedRole) {
      setError('Debes seleccionar un rol')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await adminService.assignRoles(user.uid, {
        roles: [selectedRole],
        reason: reason || 'Asignación de rol único desde panel de administración'
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Error al asignar roles')
    } finally {
      setLoading(false)
    }
  }

  const rolesArray = Object.keys(ROLES_CONFIG) as RoleId[]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Asignar Roles
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Información sobre Roles
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Cada usuario debe tener un único rol activo. El rol detectado actualmente
                    para este usuario se preselecciona automáticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Rol actual detectado:{' '}
                <span className="font-semibold">
                  {detectedCurrentRole ? getRoleInfo(detectedCurrentRole).name : 'Sin rol asignado'}
                </span>
              </p>
            </div>

            {/* Lista de Roles */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Selecciona el rol para este usuario:
              </h3>

              <div className="grid gap-3">
                {rolesArray.map((roleId) => {
                  const roleInfo = getRoleInfo(roleId)
                  const isSelected = selectedRole === roleId

                  return (
                    <motion.button
                      key={roleId}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(roleId)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } cursor-pointer`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${roleInfo.color}20` }}
                            >
                              <Shield
                                className="w-5 h-5"
                                style={{ color: roleInfo.color }}
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {roleInfo.name}
                              </h4>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${roleInfo.color}20`,
                                  color: roleInfo.color
                                }}
                              >
                                Nivel {roleInfo.level}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {roleInfo.description}
                          </p>
                        </div>

                        <div className="ml-4">
                          <input
                            type="radio"
                            name="user-role"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Mostrar algunos permisos clave */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {roleInfo.permissions.slice(0, 5).map((perm, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {perm}
                          </span>
                        ))}
                        {roleInfo.permissions.length > 5 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            +{roleInfo.permissions.length - 5} más
                          </span>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Razón del Cambio */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Razón de la asignación (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe por qué asignas estos roles..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRole ? `Rol seleccionado: ${getRoleInfo(selectedRole).name}` : 'Sin rol seleccionado'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !selectedRole}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
