'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Shield,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import adminService from '@/services/admin.service'
import { AdminUser, ListUsersParams, RoleId, ROLES_CONFIG, getHighestRole, getRoleInfo, SystemStats } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import UserList from './UserList'
import UserEditModal from './UserEditModal'
import RoleAssignmentModal from './RoleAssignmentModal'
import UserDetailsViewer from './UserDetailsViewer'

interface UserManagementPageProps {
  currentUserRole?: RoleId
  currentUserCentroGestor?: string
}

export default function UserManagementPage({
  currentUserRole
}: UserManagementPageProps) {
  const router = useRouter()
  const { state, validateSession } = useAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [hasBearerToken, setHasBearerToken] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<RoleId | ''>('')
  const [filterCentroGestor, setFilterCentroGestor] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionViewer, setShowPermissionViewer] = useState(false)
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(null)

  const [grantPermissionTarget, setGrantPermissionTarget] = useState<AdminUser | null>(null)
  const [grantPermissionValue, setGrantPermissionValue] = useState('')
  const [grantPermissionReason, setGrantPermissionReason] = useState('')
  const [grantPermissionExpiresAt, setGrantPermissionExpiresAt] = useState('')

  const [revokePermissionTarget, setRevokePermissionTarget] = useState<AdminUser | null>(null)
  const [revokePermissionValue, setRevokePermissionValue] = useState('')
  const [revokePermissionOptions, setRevokePermissionOptions] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)

  const detectedUserRole = currentUserRole || getHighestRole((state.user?.roles as RoleId[] | undefined) || []) || 'visualizador'
  const isSuperAdmin = detectedUserRole === 'super_admin'
  const isAdminGeneral = detectedUserRole === 'admin_general'
  const canManageUsers = isSuperAdmin
  const roleFilterOptions = Object.keys(ROLES_CONFIG) as RoleId[]
  const effectivePermissions = state.user?.permissions || []
  const hasToken = hasBearerToken
  const isUserActive = state.user?.is_active !== false
  const hasManageUsers = isSuperAdmin || effectivePermissions.includes('manage:users') || effectivePermissions.includes('*')
  const hasViewAuditLogs = isSuperAdmin || effectivePermissions.includes('view:audit_logs') || effectivePermissions.includes('*')

  const endpointChecks = [
    {
      endpoint: 'GET /auth/admin/audit-logs',
      allowed: hasToken && isUserActive && hasViewAuditLogs,
      reason: !hasToken
        ? 'Sin Bearer token'
        : !isUserActive
          ? 'Usuario inactivo (is_active=false)'
          : !hasViewAuditLogs
            ? 'Falta permiso view:audit_logs'
            : 'Permitido'
    },
    {
      endpoint: 'GET /auth/admin/system/stats',
      allowed: hasToken && isUserActive && hasManageUsers,
      reason: !hasToken
        ? 'Sin Bearer token'
        : !isUserActive
          ? 'Usuario inactivo (is_active=false)'
          : !hasManageUsers
            ? 'Falta permiso manage:users'
            : 'Permitido'
    },
    {
      endpoint: 'GET /auth/admin/users/super-admins',
      allowed: hasToken && isUserActive && hasManageUsers,
      reason: !hasToken
        ? 'Sin Bearer token'
        : !isUserActive
          ? 'Usuario inactivo (is_active=false)'
          : !hasManageUsers
            ? 'Falta permiso manage:users'
            : 'Permitido'
    }
  ]

  useEffect(() => {
    let isMounted = true

    const resolveHasBearerToken = async (): Promise<boolean> => {
      try {
        if (typeof window === 'undefined') return false

        const { getCurrentIdToken } = await import('@/lib/firebase')
        const firebaseToken = await getCurrentIdToken()
        if (firebaseToken) return true

        const sessionRaw = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session')
        if (!sessionRaw) return false

        const session = JSON.parse(sessionRaw)
        return Boolean(session?.user?.idToken || session?.user?.id_token)
      } catch {
        return false
      }
    }

    const ensureAuthenticatedSession = async () => {
      if (!state.isAuthenticated || !state.user) {
        if (isMounted) {
          setAuthReady(false)
          setHasBearerToken(false)
          setLoading(false)
          setError('No hay una sesión activa para ejecutar endpoints administrativos')
        }
        return
      }

      try {
        // Si no hay token persistido, revalidar sesión para obtener credenciales frescas
        const hasToken = (state.user as any)?.idToken || (state.user as any)?.id_token
        if (!hasToken) {
          await validateSession()
        }

        const tokenAvailable = await resolveHasBearerToken()

        if (isMounted) {
          setAuthReady(true)
          setHasBearerToken(tokenAvailable)
          setError(null)
          setAuthNotice(null)
        }
      } catch {
        if (isMounted) {
          setAuthReady(false)
          setHasBearerToken(false)
          setError('No se pudo validar la sesión del usuario autenticado')
        }
      }
    }

    ensureAuthenticatedSession()

    return () => {
      isMounted = false
    }
  }, [state.isAuthenticated, state.user?.uid])

  const loadUsers = async () => {
    if (!authReady) return

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
      setError(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const loadGovernance = async () => {
    if (!authReady) return

    if (!hasToken) {
      setSystemStats(null)
      setAuthNotice('No se consultó GET /auth/admin/system/stats: falta Authorization Bearer token.')
      return
    }

    if (!isUserActive) {
      setSystemStats(null)
      setAuthNotice('No se consultó GET /auth/admin/system/stats: usuario inactivo (is_active=false).')
      return
    }

    if (!hasManageUsers) {
      setSystemStats(null)
      setAuthNotice('No se consultó GET /auth/admin/system/stats: tu rol/permisos no incluyen manage:users.')
      return
    }

    try {
      setAuthNotice(null)
      const stats = await adminService.getSystemStats()
      setSystemStats(stats)
    } catch (err: any) {
      setError(err.message || 'Falló la carga en: GET /auth/admin/system/stats')
    }
  }

  const loadCentrosGestores = async () => {
    if (!authReady) return

    try {
      const centros = await adminService.getCentrosGestores()
      setCentrosGestores(centros)
    } catch {
      setCentrosGestores([])
    }
  }

  useEffect(() => {
    if (!authReady) return
    loadCentrosGestores()
    loadGovernance()
  }, [authReady, hasToken, isUserActive, hasManageUsers])

  useEffect(() => {
    if (!authReady) return

    const timeout = setTimeout(() => {
      loadUsers()
    }, 220)

    return () => clearTimeout(timeout)
  }, [authReady, currentPage, searchTerm, filterRole, filterCentroGestor, filterActive])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole, filterCentroGestor, filterActive])

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleAssignRoles = (user: AdminUser) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  const handleViewPermissions = async (user: AdminUser) => {
    setSelectedUser(user)
    setShowPermissionViewer(true)

    try {
      const detailedUser = await adminService.getUser(user.uid)
      setSelectedUser(detailedUser)
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar todos los detalles del usuario')
    }
  }

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await adminService.toggleUserStatus(user.uid, {
        is_active: !user.is_active,
        reason: `Cambio de estado desde tabla de gobernanza: ${user.is_active ? 'desactivar' : 'activar'}`
      })
      await loadUsers()
      await loadGovernance()
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar el estado del usuario')
    }
  }

  const handleDeleteUser = async (user: AdminUser) => {
    setDeleteUserTarget(user)
  }

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return

    try {
      await adminService.deleteUser(deleteUserTarget.uid, true)
      setDeleteUserTarget(null)
      await loadUsers()
      await loadGovernance()
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar el usuario')
    }
  }

  const handleGrantTemporaryPermission = async (user: AdminUser) => {
    setGrantPermissionTarget(user)
    setGrantPermissionValue('')
    setGrantPermissionReason('')

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const localInputValue = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}T${String(tomorrow.getHours()).padStart(2, '0')}:${String(tomorrow.getMinutes()).padStart(2, '0')}`
    setGrantPermissionExpiresAt(localInputValue)
  }

  const confirmGrantTemporaryPermission = async () => {
    if (!grantPermissionTarget) return

    const permission = grantPermissionValue.trim()
    if (!permission) {
      setError('Debes ingresar un permiso temporal')
      return
    }

    const expiresAt = new Date(grantPermissionExpiresAt).toISOString()
    if (!grantPermissionExpiresAt || Number.isNaN(new Date(expiresAt).getTime())) {
      setError('Fecha de expiración inválida')
      return
    }

    try {
      await adminService.grantTemporaryPermission(grantPermissionTarget.uid, {
        permission,
        expires_at: expiresAt,
        reason: grantPermissionReason.trim() || undefined
      })
      setGrantPermissionTarget(null)
      setGrantPermissionValue('')
      setGrantPermissionReason('')
      setGrantPermissionExpiresAt('')
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'No se pudo otorgar el permiso temporal')
    }
  }

  const handleRevokeTemporaryPermission = async (user: AdminUser) => {
    try {
      const detailedUser = await adminService.getUser(user.uid)
      const options = (detailedUser.temporary_permissions || []).map(tp => tp.permission)
      const first = options[0] || ''

      setRevokePermissionTarget(user)
      setRevokePermissionOptions(options)
      setRevokePermissionValue(first)
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar permisos temporales para revocar')
    }
  }

  const confirmRevokeTemporaryPermission = async () => {
    if (!revokePermissionTarget) return
    const permission = revokePermissionValue.trim()
    if (!permission) {
      setError('Debes seleccionar o escribir el permiso a revocar')
      return
    }

    try {
      await adminService.revokeTemporaryPermission(revokePermissionTarget.uid, permission)
      setRevokePermissionTarget(null)
      setRevokePermissionValue('')
      setRevokePermissionOptions([])
      await loadUsers()
    } catch (err: any) {
      setError(err.message || 'No se pudo revocar el permiso temporal')
    }
  }

  const handleUserUpdated = async () => {
    await loadUsers()
    await loadGovernance()
    setShowEditModal(false)
    setShowRoleModal(false)
    setSelectedUser(null)
  }

  const handleRefresh = async () => {
    if (!authReady) {
      setError('No hay sesión autenticada para recargar datos')
      return
    }

    await Promise.all([loadUsers(), loadGovernance()])
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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestionar Usuarios
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gobernanza de datos por roles, privilegios y auditoría
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sesión activa: {state.user?.email || 'No detectada'} · Rol: {detectedUserRole}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Usuarios Totales</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemStats?.total_users ?? '-'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Usuarios Activos</p>
          <p className="text-2xl font-bold text-green-600">{systemStats?.active_users ?? '-'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Usuarios Inactivos</p>
          <p className="text-2xl font-bold text-red-600">{systemStats?.inactive_users ?? '-'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">Logins Recientes</p>
          <p className="text-2xl font-bold text-blue-600">{systemStats?.recent_logins ?? '-'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Check rápido de autenticación y permisos</h3>
          <button
            onClick={() => validateSession()}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Revalidar sesión
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
            Token: <span className="font-semibold">{hasToken ? 'Sí' : 'No'}</span>
          </div>
          <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
            Usuario activo: <span className="font-semibold">{isUserActive ? 'Sí' : 'No'}</span>
          </div>
          <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
            Permisos: <span className="font-semibold">{effectivePermissions.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {effectivePermissions.length > 0 ? effectivePermissions.map((permission) => (
            <span
              key={permission}
              className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              {permission}
            </span>
          )) : (
            <span className="text-xs text-gray-500">No se detectaron permisos efectivos en sesión</span>
          )}
        </div>

        <div className="space-y-2">
          {endpointChecks.map((check) => (
            <div
              key={check.endpoint}
              className={`text-xs rounded-md px-3 py-2 border ${
                check.allowed
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className="font-semibold">{check.endpoint}</span> · {check.reason}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros (aplicación automática)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Email, nombre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rol</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as RoleId | '')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos los roles</option>
              {roleFilterOptions.map((roleId) => (
                <option key={roleId} value={roleId}>
                  {getRoleInfo(roleId).name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Centro Gestor</label>
            <select
              value={filterCentroGestor}
              onChange={(e) => setFilterCentroGestor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos los centros</option>
              {centrosGestores.map((centro) => (
                <option key={centro} value={centro}>{centro}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
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
      </div>

      {isAdminGeneral && !isSuperAdmin && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Modo Solo Lectura</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Como Admin General, puedes ver usuarios y gobernanza pero no modificarlos.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        </div>
      )}

      {authNotice && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-900 dark:text-amber-100">{authNotice}</p>
          </div>
        </div>
      )}

      <UserList
        users={users}
        loading={loading}
        onEdit={handleEditUser}
        onAssignRoles={handleAssignRoles}
        onViewPermissions={handleViewPermissions}
        onToggleStatus={handleToggleStatus}
        onDeleteUser={handleDeleteUser}
        onGrantTemporaryPermission={handleGrantTemporaryPermission}
        onRevokeTemporaryPermission={handleRevokeTemporaryPermission}
        canEdit={isSuperAdmin}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Siguiente
          </button>
        </div>
      )}

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
        <UserDetailsViewer
          user={selectedUser}
          onClose={() => setShowPermissionViewer(false)}
        />
      )}

      {deleteUserTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar eliminación</h3>
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              ¿Deseas eliminar al usuario <span className="font-semibold">{deleteUserTarget.email}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {grantPermissionTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Otorgar permiso temporal</h3>
              <button
                onClick={() => setGrantPermissionTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Usuario: {grantPermissionTarget.email}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permiso</label>
                <input
                  type="text"
                  value={grantPermissionValue}
                  onChange={(e) => setGrantPermissionValue(e.target.value)}
                  placeholder="write:proyectos"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expira en</label>
                <input
                  type="datetime-local"
                  value={grantPermissionExpiresAt}
                  onChange={(e) => setGrantPermissionExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón (opcional)</label>
                <textarea
                  value={grantPermissionReason}
                  onChange={(e) => setGrantPermissionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setGrantPermissionTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmGrantTemporaryPermission}
                className="px-4 py-2 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Otorgar
              </button>
            </div>
          </div>
        </div>
      )}

      {revokePermissionTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revocar permiso temporal</h3>
              <button
                onClick={() => setRevokePermissionTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Usuario: {revokePermissionTarget.email}</p>

            <div className="space-y-3">
              {revokePermissionOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permisos detectados</label>
                  <select
                    value={revokePermissionValue}
                    onChange={(e) => setRevokePermissionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {revokePermissionOptions.map((permission) => (
                      <option key={permission} value={permission}>{permission}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permiso a revocar</label>
                <input
                  type="text"
                  value={revokePermissionValue}
                  onChange={(e) => setRevokePermissionValue(e.target.value)}
                  placeholder="write:proyectos"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRevokePermissionTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRevokeTemporaryPermission}
                className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-800 text-white"
              >
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
