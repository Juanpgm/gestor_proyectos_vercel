'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Key, Clock, CheckCircle } from 'lucide-react'
import { AdminUser, getRoleInfo } from '@/types/admin'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PermissionViewerProps {
  user: AdminUser
  onClose: () => void
}

export default function PermissionViewer({ user, onClose }: PermissionViewerProps) {
  // Combinar permisos de roles + permisos temporales activos
  const temporaryPermissionsActive = (user.temporary_permissions || []).filter(
    tp => new Date(tp.expires_at) > new Date()
  )

  const allPermissions = Array.from(
    new Set([
      ...(user.permissions || []), 
      ...temporaryPermissionsActive.map(tp => tp.permission)
    ])
  )

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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Key className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Permisos de Usuario
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
            {/* Roles Asignados */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Roles Asignados
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((roleId) => {
                    const roleInfo = getRoleInfo(roleId)
                    return (
                      <div
                        key={roleId}
                        className="p-4 rounded-xl border-2"
                        style={{
                          borderColor: `${roleInfo.color}40`,
                          backgroundColor: `${roleInfo.color}10`
                        }}
                      >
                      <div className="flex items-center gap-3">
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
                          <h4
                            className="font-semibold"
                            style={{ color: roleInfo.color }}
                          >
                            {roleInfo.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Nivel {roleInfo.level}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {roleInfo.description}
                      </p>
                    </div>
                  )
                  })
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No hay roles asignados</p>
                  </div>
                )}
              </div>
            </div>

            {/* Permisos Efectivos */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Permisos Efectivos ({allPermissions.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2">
                {allPermissions.sort().map((permission, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm font-mono text-green-900 dark:text-green-100">
                        {permission}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permisos Temporales */}
            {temporaryPermissionsActive.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Permisos Temporales Activos
                  </h3>
                </div>
                <div className="space-y-3">
                  {temporaryPermissionsActive.map((tp, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="font-mono font-semibold text-yellow-900 dark:text-yellow-100">
                              {tp.permission}
                            </span>
                          </div>
                          {tp.reason && (
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                              <span className="font-medium">Razón:</span> {tp.reason}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-yellow-700 dark:text-yellow-300">
                            <span>
                              Otorgado: {format(new Date(tp.granted_at), "dd/MM/yyyy HH:mm", { locale: es })}
                            </span>
                            <span>
                              Expira: {format(new Date(tp.expires_at), "dd/MM/yyyy HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 rounded-full">
                          <Clock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                            Temporal
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permisos Temporales Expirados */}
            {user.temporary_permissions && user.temporary_permissions.length > temporaryPermissionsActive.length && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-500 dark:text-gray-400">
                    Permisos Temporales Expirados
                  </h3>
                </div>
                <div className="space-y-2">
                  {user.temporary_permissions
                    .filter(tp => new Date(tp.expires_at) <= new Date())
                    .map((tp, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {tp.permission}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Expiró: {format(new Date(tp.expires_at), "dd/MM/yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
