'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
import { AdminUser, Role, RoleId, ROLES_CONFIG, getHighestRole, getRoleInfo, SystemStats } from '@/types/admin'
import { useAuth } from '@/context/AuthContext'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LabelList } from 'recharts'
import UserList from './UserList'
import UserEditModal from './UserEditModal'
import RoleAssignmentModal from './RoleAssignmentModal'
import UserDetailsViewer from './UserDetailsViewer'

interface UserManagementPageProps {
  currentUserRole?: RoleId
  currentUserCentroGestor?: string
}

interface EndpointDiagnosticItem {
  endpoint: string
  ok: boolean
  status: number | null
  message: string
}

export default function UserManagementPage({
  currentUserRole
}: UserManagementPageProps) {
  const USERS_PAGE_SIZE = 20

  const router = useRouter()
  const { state, validateSession } = useAuth()

  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [hasBearerToken, setHasBearerToken] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
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
  const [rolesCatalog, setRolesCatalog] = useState<Role[]>([])
  const [connectedUserPermissions, setConnectedUserPermissions] = useState<string[]>([])
  const [endpointDiagnostics, setEndpointDiagnostics] = useState<EndpointDiagnosticItem[]>([])
  const [endpointDiagnosticsLoading, setEndpointDiagnosticsLoading] = useState(false)
  const [endpointDiagnosticsUpdatedAt, setEndpointDiagnosticsUpdatedAt] = useState<string | null>(null)

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)

  const centroGestorOptions = useMemo(() => {
    const normalize = (value: any): string => (typeof value === 'string' ? value.trim() : '')

    const fromEndpoint = centrosGestores.map(normalize)
    const fromGlobalUsers = allUsers.map((user) => normalize(user.centro_gestor_assigned || (user as any).nombre_centro_gestor))
    const fromSession = [
      normalize(state.user?.centro_gestor_assigned),
      normalize((state.user as any)?.nombre_centro_gestor)
    ]

    return Array.from(new Set([...fromEndpoint, ...fromGlobalUsers, ...fromSession].filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es'))
  }, [centrosGestores, allUsers, state.user?.centro_gestor_assigned])

  const detectedUserRole = currentUserRole || getHighestRole((state.user?.roles as RoleId[] | undefined) || []) || 'publico'
  const isSuperAdmin = detectedUserRole === 'super_admin'
  const isAdminGeneral = detectedUserRole === 'admin_general'
  const canManageUsers = isSuperAdmin

  const normalizePermissionList = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).map(String)
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, any>)
        .filter(([key, enabled]) => Boolean(key) && (enabled === true || enabled === 1 || enabled === 'true'))
        .map(([key]) => key)
    }

    return []
  }

  const inferPermissionsFromRoles = (): string[] => {
    const userRoles = (state.user?.roles as RoleId[] | undefined) || []
    if (userRoles.length === 0) return []

    return userRoles.flatMap((roleId) => {
      const backendRole = rolesCatalog.find((role) => role.id === roleId)
      if (backendRole?.permissions?.length) return backendRole.permissions
      return getRoleInfo(roleId).permissions || []
    })
  }

  const roleFilterOptions = useMemo(() => {
    const fromCatalog = rolesCatalog.map((role) => String(role.id))
    const fromStats = Object.keys((systemStats?.users_by_role || {}) as Record<string, number>)
    const fromUsers = allUsers.flatMap((user) => (Array.isArray(user.roles) ? user.roles : []).map(String))
    const fromConfig = Object.keys(ROLES_CONFIG)

    return Array.from(new Set([...fromCatalog, ...fromStats, ...fromUsers, ...fromConfig]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'))
  }, [rolesCatalog, systemStats?.users_by_role, allUsers])

  const getRoleMeta = (roleId: string) => {
    const roleFromCatalog = rolesCatalog.find((role) => String(role.id) === roleId)
    const roleFromConfig = (ROLES_CONFIG as Record<string, any>)[roleId]
    const fallbackName = roleId.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

    return {
      label: roleFromCatalog?.name || roleFromConfig?.name || fallbackName,
      color: roleFromCatalog?.color || roleFromConfig?.color || '#64748B',
      description: roleFromCatalog?.description || roleFromConfig?.description || `Rol ${fallbackName}`
    }
  }

  const effectivePermissions = Array.from(new Set([
    ...normalizePermissionList(connectedUserPermissions),
    ...normalizePermissionList(state.user?.permissions),
    ...inferPermissionsFromRoles()
  ]))
  const roleNameMap = new Map(roleFilterOptions.map((roleId) => [
    roleId,
    getRoleMeta(roleId).label
  ]))
  const hasToken = hasBearerToken
  const isUserActive = state.user?.is_active !== false
  const hasManageUsers = isSuperAdmin || effectivePermissions.includes('manage:users') || effectivePermissions.includes('*')
  const hasManageRoles = isSuperAdmin || effectivePermissions.includes('manage:roles') || effectivePermissions.includes('*')
  const hasViewAuditLogs = isSuperAdmin || effectivePermissions.includes('view:audit_logs') || effectivePermissions.includes('*')

  const roleAggregations = roleFilterOptions.map((roleId) => {
    const roleInfo = getRoleMeta(roleId)
    const usersByRole = (systemStats?.users_by_role || {}) as Record<string, number>

    const countFromStats = usersByRole[roleId]
    const countFromUsers = allUsers.reduce((count, user) => {
      const roles = Array.isArray(user.roles) ? user.roles : []
      return roles.map(String).includes(roleId) ? count + 1 : count
    }, 0)

    const count = typeof countFromStats === 'number' ? countFromStats : countFromUsers

    return {
      id: roleId,
      label: roleInfo.label,
      value: count,
      color: roleInfo.color,
      description: roleInfo.description
    }
  })

  const roleChartData = roleAggregations
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)

  const centroGestorDistribution = useMemo(() => {
    const normalize = (value: any): string => {
      if (typeof value !== 'string') return 'Sin centro gestor'
      const normalized = value.trim()
      return normalized || 'Sin centro gestor'
    }

    const fromStats = (systemStats?.users_by_centro_gestor || {}) as Record<string, number>
    const statsEntries = Object.entries(fromStats)
      .filter(([key]) => Boolean(key))
      .map(([key, value]) => ({
        centro_gestor: normalize(key),
        total: typeof value === 'number' ? value : 0
      }))

    if (statsEntries.length > 0) {
      return statsEntries.sort((a, b) => b.total - a.total)
    }

    const grouped = allUsers.reduce<Record<string, number>>((acc, user) => {
      const centro = normalize(user.centro_gestor_assigned || (user as any).nombre_centro_gestor)
      acc[centro] = (acc[centro] || 0) + 1
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([centro_gestor, total]) => ({ centro_gestor, total }))
      .sort((a, b) => b.total - a.total)
  }, [systemStats?.users_by_centro_gestor, allUsers])

  const centroGestorChartData = centroGestorDistribution

  const totalUsersForMetrics = systemStats?.total_users ?? allUsers.length

  const wrapLabel = (value: string, maxCharsPerLine: number = 24): string[] => {
    if (!value) return ['']
    const words = value.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word
      if (candidate.length <= maxCharsPerLine) {
        currentLine = candidate
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines.length ? lines : [value]
  }

  const renderWrappedCategoryTick = (maxCharsPerLine: number) => (props: any) => {
    const { x, y, payload } = props
    const value = String(payload?.value || '')
    const lines = wrapLabel(value, maxCharsPerLine)

    return (
      <text x={x} y={y} textAnchor="end" fill="currentColor" fontSize={11}>
        {lines.map((line, index) => (
          <tspan key={`${value}-${index}`} x={x} dy={index === 0 ? 4 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    )
  }

  const roleBarsHeight = Math.max(320, roleChartData.length * 48)
  const centrosBarsHeight = Math.max(320, centroGestorChartData.length * 44)
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const syncTheme = () => setIsDarkTheme(root.classList.contains('dark'))

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkTheme ? '#111827' : '#FFFFFF',
      border: `1px solid ${isDarkTheme ? '#374151' : '#E5E7EB'}`,
      borderRadius: '8px',
      color: isDarkTheme ? '#F9FAFB' : '#111827',
      fontSize: '12px'
    },
    labelStyle: {
      color: isDarkTheme ? '#F9FAFB' : '#111827',
      fontWeight: 600
    },
    itemStyle: {
      color: isDarkTheme ? '#F3F4F6' : '#1F2937'
    }
  }

  const endpointChecks = [
    {
      endpoint: 'GET /auth/admin/roles',
      allowed: hasToken && isUserActive && hasManageRoles,
      reason: !hasToken
        ? 'Sin Bearer token'
        : !isUserActive
          ? 'Usuario inactivo (is_active=false)'
          : !hasManageRoles
            ? 'Falta permiso manage:roles'
            : 'Permitido'
    },
    {
      endpoint: 'GET /auth/admin/roles/{role_id}',
      allowed: hasToken && isUserActive && hasManageRoles,
      reason: !hasToken
        ? 'Sin Bearer token'
        : !isUserActive
          ? 'Usuario inactivo (is_active=false)'
          : !hasManageRoles
            ? 'Falta permiso manage:roles'
            : 'Permitido'
    },
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
        await validateSession()

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

      const loadedUsers = await adminService.listAllUsers(500)
      setAllUsers(loadedUsers)
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()

    const filteredUsers = allUsers.filter((user) => {
      const userRoles = Array.isArray(user.roles) ? user.roles : []

      if (term) {
        const searchable = [
          user.email,
          user.full_name,
          user.uid,
          user.phone_number,
          user.centro_gestor_assigned
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase())

        const match = searchable.some((value) => value.includes(term))
        if (!match) return false
      }

      if (filterRole && !userRoles.map(String).includes(filterRole)) {
        return false
      }

      if (filterCentroGestor) {
        const centro = (user.centro_gestor_assigned || '').toLowerCase()
        if (centro !== filterCentroGestor.toLowerCase()) {
          return false
        }
      }

      if (typeof filterActive === 'boolean' && user.is_active !== filterActive) {
        return false
      }

      return true
    })

    const computedTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE))

    if (currentPage > computedTotalPages) {
      setCurrentPage(computedTotalPages)
      return
    }

    const start = (currentPage - 1) * USERS_PAGE_SIZE
    const end = start + USERS_PAGE_SIZE

    setTotalPages(computedTotalPages)
    setUsers(filteredUsers.slice(start, end))
  }, [allUsers, currentPage, searchTerm, filterRole, filterCentroGestor, filterActive])

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

  const loadRolesCatalog = async () => {
    if (!authReady || !hasToken || !isUserActive || !hasManageRoles) {
      setRolesCatalog([])
      return
    }

    try {
      const roles = await adminService.getRolesCatalog()
      setRolesCatalog(roles)
    } catch {
      setRolesCatalog([])
    }
  }

  const loadConnectedUserContext = async () => {
    if (!authReady || !state.user?.uid || !hasToken || !isUserActive || !hasManageUsers) {
      setConnectedUserPermissions(normalizePermissionList(state.user?.permissions))
      return
    }

    try {
      const connectedUser = await adminService.getUser(state.user.uid)
      const currentPermissions = Array.from(new Set([
        ...normalizePermissionList((connectedUser as any)?.permissions),
        ...normalizePermissionList((connectedUser as any)?.permisos),
        ...normalizePermissionList((connectedUser as any)?.effective_permissions),
        ...normalizePermissionList((connectedUser as any)?.permissions_effective),
        ...normalizePermissionList(state.user?.permissions)
      ]))

      setConnectedUserPermissions(currentPermissions)
    } catch {
      setConnectedUserPermissions(normalizePermissionList(state.user?.permissions))
    }
  }

  const loadEndpointDiagnostics = async () => {
    if (!authReady) return

    try {
      setEndpointDiagnosticsLoading(true)
      const diagnostics = await adminService.diagnoseUsersEndpoints(state.user?.uid)
      setEndpointDiagnostics(diagnostics)
      setEndpointDiagnosticsUpdatedAt(new Date().toISOString())
    } catch {
      setEndpointDiagnostics([
        {
          endpoint: 'Diagnóstico endpoints usuarios',
          ok: false,
          status: null,
          message: 'No se pudo ejecutar el diagnóstico de endpoints'
        }
      ])
      setEndpointDiagnosticsUpdatedAt(new Date().toISOString())
    } finally {
      setEndpointDiagnosticsLoading(false)
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
    loadConnectedUserContext()
    loadRolesCatalog()
    loadGovernance()
    loadEndpointDiagnostics()
  }, [authReady, hasToken, isUserActive, hasManageUsers, hasManageRoles, state.user?.uid])

  useEffect(() => {
    if (!authReady) return

    const timeout = setTimeout(() => {
      loadUsers()
    }, 220)

    return () => clearTimeout(timeout)
  }, [authReady])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole, filterCentroGestor, filterActive])

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleAssignRoles = async (user: AdminUser) => {
    try {
      const detailedUser = await adminService.getUser(user.uid)
      setSelectedUser(detailedUser)
    } catch {
      setSelectedUser(user)
    }

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

    await Promise.all([loadUsers(), loadGovernance(), loadEndpointDiagnostics()])
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
        <div className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-3">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestionar Usuarios
          </h1>
          <p className="text-sm text-gray-200 mt-1">
            Gobernanza de datos por roles, privilegios y auditoría
          </p>
          <p className="text-xs text-gray-300 mt-1">
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsersForMetrics}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Fuente: sistema + fallback listado usuarios</p>
        </div>

        {roleAggregations.map((aggregation) => (
          <div
            key={aggregation.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <p className="text-xs text-gray-500">{aggregation.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: aggregation.color }} />
              {aggregation.value}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {aggregation.description}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lógica de gestión de usuarios</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Las agregaciones por rol cuentan usuarios según los roles asignados en backend. Si está disponible,
          se priorizan métricas de `GET /auth/admin/system/stats`; en caso contrario, se calculan desde el listado
          consolidado de usuarios (`GET /auth/admin/users` con fallback a `GET /admin/users`). Cuando un usuario tiene
          más de un rol, se contabiliza en cada rol correspondiente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Usuarios por rol (barras)</h3>
          <div className="max-h-[30rem] overflow-y-auto text-gray-700 dark:text-gray-200">
            <div style={{ height: `${roleBarsHeight}px`, minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleChartData} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 34 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 11 }} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={220}
                    tick={renderWrappedCategoryTick(28)}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle.contentStyle}
                    labelStyle={chartTooltipStyle.labelStyle}
                    itemStyle={chartTooltipStyle.itemStyle}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {roleChartData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                    <LabelList dataKey="value" position="right" fill="currentColor" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Distribución de roles</h3>
            <div className="h-72 text-gray-700 dark:text-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={88}
                    label={false}
                    labelLine={false}
                  >
                    {roleChartData.map((entry) => (
                      <Cell key={`pie-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle.contentStyle}
                    labelStyle={chartTooltipStyle.labelStyle}
                    itemStyle={chartTooltipStyle.itemStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {roleChartData.map((item) => (
                <div key={`legend-${item.id}`} className="text-xs text-gray-700 dark:text-gray-200 flex items-start gap-2">
                  <span className="inline-block mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="leading-4 break-words">{item.label}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Distribución por nombre_centro_gestor</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
              {centroGestorChartData.length} centros gestores con usuarios
            </p>
            <div className="max-h-[30rem] overflow-y-auto text-gray-700 dark:text-gray-200">
              <div style={{ height: `${centrosBarsHeight}px`, minHeight: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={centroGestorChartData} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 34 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 11 }} />
                    <YAxis
                      dataKey="centro_gestor"
                      type="category"
                      width={220}
                      tick={renderWrappedCategoryTick(30)}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle.contentStyle}
                      labelStyle={chartTooltipStyle.labelStyle}
                      itemStyle={chartTooltipStyle.itemStyle}
                    />
                    <Bar dataKey="total" fill="#0EA5E9" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="total" position="right" fill="currentColor" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
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

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Diagnóstico de endpoints de usuarios</h3>
          <button
            onClick={() => loadEndpointDiagnostics()}
            disabled={endpointDiagnosticsLoading}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {endpointDiagnosticsLoading ? 'Probando...' : 'Reprobar endpoints'}
          </button>
        </div>

        <div className="space-y-2">
          {endpointDiagnostics.map((item) => (
            <div
              key={item.endpoint}
              className={`text-xs rounded-md px-3 py-2 border ${
                item.ok
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
              }`}
            >
              <span className="font-semibold">{item.endpoint}</span>
              {' · '}
              Estado: {item.status ?? 'N/A'}
              {' · '}
              {item.message}
            </div>
          ))}

          {!endpointDiagnosticsLoading && endpointDiagnostics.length === 0 && (
            <div className="text-xs rounded-md px-3 py-2 border bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
              Sin diagnóstico aún. Usa "Reprobar endpoints".
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
          Última verificación: {endpointDiagnosticsUpdatedAt ? new Date(endpointDiagnosticsUpdatedAt).toLocaleString() : 'No ejecutada'}
        </p>
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
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos los roles</option>
              {roleFilterOptions.map((roleId) => (
                <option key={roleId} value={roleId}>
                  {roleNameMap.get(roleId) || roleId}
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
              {centroGestorOptions.map((centro) => (
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
          centrosGestores={centroGestorOptions}
        />
      )}

      {showRoleModal && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          rolesCatalog={rolesCatalog}
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
