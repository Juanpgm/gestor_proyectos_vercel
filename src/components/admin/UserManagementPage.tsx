'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  Download,
  Shield,
  AlertCircle
} from 'lucide-react'
import adminService from '@/services/admin.service'
import { AdminUser, ListUsersParams, RoleId } from '@/types/admin'
import UserList from './UserList'
import UserEditModal from './UserEditModal'
import RoleAssignmentModal from './RoleAssignmentModal'
import PermissionViewer from './PermissionViewer'

interface UserManagementPageProps {
  currentUserRole?: RoleId
  currentUserCentroGestor?: string
}

export default function UserManagementPage({
  currentUserRole = 'visualizador',
  currentUserCentroGestor
}: UserManagementPageProps) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<RoleId | ''>('')
  const [filterCentroGestor, setFilterCentroGestor] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionViewer, setShowPermissionViewer] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])

  // Verificar permisos
  const isSuperAdmin = currentUserRole === 'super_admin'
  const isAdminGeneral = currentUserRole === 'admin_general'
  const canManageUsers = isSuperAdmin

  useEffect(() => {
    loadUsers()
    loadCentrosGestores()
  }, [currentPage, filterRole, filterCentroGestor, filterActive])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: ListUsersParams = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        role: filterRole || undefined,
        centro_gestor: filterCentroGestor || undefined,
        is_active: filterActive
      }

      const response = await adminService.listUsers(params)
      setUsers(response.users)
      setTotalPages(response.total_pages)
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const loadCentrosGestores = async () => {
    try {
      const centros = await adminService.getCentrosGestores()
      setCentrosGestores(centros)
    } catch (err) {
      console.error('Error loading centros gestores:', err)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadUsers()
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleAssignRoles = (user: AdminUser) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  const handleViewPermissions = (user: AdminUser) => {
    setSelectedUser(user)
    setShowPermissionViewer(true)
  }

  const handleUserUpdated = () => {
    loadUsers()
    setShowEditModal(false)
    setShowRoleModal(false)
    setSelectedUser(null)
  }

  const handleExportUsers = () => {
    // Implementar exportación a CSV/Excel
    const csv = [
      ['Email', 'Nombre', 'Roles', 'Centro Gestor', 'Estado', 'Último Login'].join(','),
      ...users.map(user => [
        user.email,
        user.full_name || '',
        user.roles.join(';'),
        user.centro_gestor_assigned || '',
        user.is_active ? 'Activo' : 'Inactivo',
        user.last_login_at || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!canManageUsers && !isAdminGeneral) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a este módulo.
            <br />
            Solo los super administradores pueden gestionar usuarios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestionar Usuarios
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>

        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportUsers}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Email, nombre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Filtro por Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rol
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as RoleId | '')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos los roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_general">Admin General</option>
              <option value="admin_centro_gestor">Admin Centro Gestor</option>
              <option value="editor_datos">Editor Datos</option>
              <option value="gestor_contratos">Gestor Contratos</option>
              <option value="analista">Analista</option>
              <option value="visualizador">Visualizador</option>
              <option value="publico">Público</option>
            </select>
          </div>

          {/* Filtro por Centro Gestor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Centro Gestor
            </label>
            <select
              value={filterCentroGestor}
              onChange={(e) => setFilterCentroGestor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos los centros</option>
              {centrosGestores.map(centro => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value
                setFilterActive(value === '' ? undefined : value === 'true')
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Advertencia para Admin General */}
      {isAdminGeneral && !isSuperAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Modo Solo Lectura
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Como Admin General, puedes ver todos los usuarios pero no modificarlos.
                Solo el Super Admin puede gestionar usuarios, roles y permisos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        </div>
      )}

      {/* Lista de Usuarios */}
      <UserList
        users={users}
        loading={loading}
        onEdit={handleEditUser}
        onAssignRoles={handleAssignRoles}
        onViewPermissions={handleViewPermissions}
        canEdit={isSuperAdmin}
      />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modales */}
      {showEditModal && selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUserUpdated}
          centrosGestores={centrosGestores}
        />
      )}

      {showRoleModal && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onClose={() => setShowRoleModal(false)}
          onSuccess={handleUserUpdated}
        />
      )}

      {showPermissionViewer && selectedUser && (
        <PermissionViewer
          user={selectedUser}
          onClose={() => setShowPermissionViewer(false)}
        />
      )}
    </div>
  )
}
