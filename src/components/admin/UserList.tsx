'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Key,
  Eye
} from 'lucide-react'
import { AdminUser, getRoleInfo } from '@/types/admin'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserListProps {
  users: AdminUser[]
  loading: boolean
  onEdit: (user: AdminUser) => void
  onAssignRoles: (user: AdminUser) => void
  onViewPermissions: (user: AdminUser) => void
  canEdit: boolean
}

export default function UserList({
  users,
  loading,
  onEdit,
  onAssignRoles,
  onViewPermissions,
  canEdit
}: UserListProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 dark:text-gray-400">Cargando usuarios...</span>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          No se encontraron usuarios con los filtros seleccionados.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Roles
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Centro Gestor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <motion.tr
                key={user.uid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                {/* Usuario */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.photo_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={user.photo_url}
                          alt={user.full_name || user.email}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 font-medium text-lg">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      {user.phone_number && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {user.phone_number}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Roles */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((roleId) => {
                        const roleInfo = getRoleInfo(roleId)
                        return (
                          <span
                            key={roleId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${roleInfo.color}20`,
                              color: roleInfo.color
                            }}
                          >
                            {roleInfo.name}
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-xs text-gray-400 italic">Sin roles</span>
                    )}
                  </div>
                </td>

                {/* Centro Gestor */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {user.centro_gestor_assigned || (
                        <span className="text-gray-400 italic">No asignado</span>
                      )}
                    </span>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {user.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </span>
                  {!user.email_verified && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Email no verificado
                      </span>
                    </div>
                  )}
                </td>

                {/* Último Login */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.last_login_at ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">Nunca</span>
                  )}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onViewPermissions(user)}
                      className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Ver permisos"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>

                    {canEdit && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onAssignRoles(user)}
                          className="p-2 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Asignar roles"
                        >
                          <Shield className="w-4 h-4" />
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(user)}
                          className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
// TS refresh
