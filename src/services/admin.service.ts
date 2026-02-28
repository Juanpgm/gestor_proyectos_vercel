/**
 * Servicio de Administración de Usuarios
 * Comunicación con endpoints de la TAG "Administración y Control de Accesos"
 */

import { apiClient } from './api'
import {
  AdminUser,
  ListUsersParams,
  ListUsersResponse,
  AssignRolesRequest,
  AssignRolesResponse,
  UpdateCentroGestorRequest,
  UpdateCentroGestorResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  ToggleUserStatusRequest,
  ToggleUserStatusResponse,
  GrantTemporaryPermissionRequest,
  GrantTemporaryPermissionResponse,
  RevokeTemporaryPermissionResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DeleteUserResponse,
  Role,
  ListAuditLogsParams,
  ListAuditLogsResponse,
  SystemStats
} from '@/types/admin'

class AdminService {
  private toStringArray(value: any): string[] {
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

  private normalizeAdminUser(userLike: any): AdminUser {
    const roles = Array.from(new Set([
      ...this.toStringArray(userLike?.roles),
      ...this.toStringArray(userLike?.role),
      ...this.toStringArray(userLike?.user_role),
      ...this.toStringArray(userLike?.custom_claims?.roles),
      ...this.toStringArray(userLike?.custom_claims?.role),
      ...this.toStringArray(userLike?.claims?.roles),
      ...this.toStringArray(userLike?.claims?.role),
      ...this.toStringArray(userLike?.firestore_data?.roles),
      ...this.toStringArray(userLike?.firestore_data?.role)
    ]))

    const permissions = Array.from(new Set([
      ...this.toStringArray(userLike?.permissions),
      ...this.toStringArray(userLike?.permisos),
      ...this.toStringArray(userLike?.effective_permissions),
      ...this.toStringArray(userLike?.permissions_effective),
      ...this.toStringArray(userLike?.custom_claims?.permissions),
      ...this.toStringArray(userLike?.custom_claims?.effective_permissions),
      ...this.toStringArray(userLike?.claims?.permissions),
      ...this.toStringArray(userLike?.claims?.effective_permissions),
      ...this.toStringArray(userLike?.firestore_data?.permissions),
      ...this.toStringArray(userLike?.firestore_data?.effective_permissions)
    ]))

    const temporaryPermissions = Array.isArray(userLike?.temporary_permissions)
      ? userLike.temporary_permissions
      : []

    return {
      ...userLike,
      uid: userLike?.uid || userLike?.id || '',
      roles: roles as any,
      permissions,
      temporary_permissions: temporaryPermissions
    }
  }

  private getErrorStatus(error: any): number | null {
    if (typeof error?.status === 'number') return error.status
    if (typeof error?.response?.status === 'number') return error.response.status
    return null
  }

  private getErrorText(error: any): string {
    if (!error) return 'Error desconocido'
    if (typeof error?.message === 'string' && error.message.trim()) return error.message
    if (typeof error === 'string' && error.trim()) return error
    return JSON.stringify(error)
  }

  private normalizeRole(roleLike: any): Role {
    const roleId = (roleLike?.id || roleLike?.role_id || roleLike?.role || roleLike?.name || 'visualizador') as Role['id']
    const fallbackName = String(roleId).replace(/_/g, ' ')

    return {
      id: roleId,
      name: roleLike?.name || roleLike?.display_name || fallbackName,
      level: typeof roleLike?.level === 'number' ? roleLike.level : 99,
      permissions: Array.isArray(roleLike?.permissions)
        ? roleLike.permissions
        : Array.isArray(roleLike?.effective_permissions)
          ? roleLike.effective_permissions
          : [],
      description: roleLike?.description || roleLike?.desc || `Rol ${fallbackName}`,
      color: roleLike?.color || '#64748B',
      icon: roleLike?.icon || 'shield'
    }
  }

  private buildUsersQuery(params: ListUsersParams): string {
    const queryParams = new URLSearchParams()
    const offset = params.page ? (params.page - 1) * (params.limit || 100) : 0

    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (offset > 0) queryParams.append('offset', offset.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.role) queryParams.append('role', params.role)
    if (params.centro_gestor) queryParams.append('centro_gestor', params.centro_gestor)
    if (typeof params.is_active === 'boolean') {
      queryParams.append('is_active', String(params.is_active))
    }

    return queryParams.toString()
  }

  private normalizeUsersResponse(response: any, params: ListUsersParams): ListUsersResponse {
    const rawUsers = response?.users || response?.data || []
    const users = (Array.isArray(rawUsers) ? rawUsers : []).map((user) => this.normalizeAdminUser(user))
    const total = response?.total ?? users.length
    const limit = params.limit || 100

    return {
      success: response?.success !== false,
      users,
      total,
      page: params.page || 1,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      count: users.length
    }
  }

  /**
   * Listar usuarios por endpoint principal
   * Endpoint: GET /auth/admin/users
   */
  async listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
    try {
      const query = this.buildUsersQuery(params)
      const endpoint = `/auth/admin/users${query ? `?${query}` : ''}`
      const response = await apiClient.get<any>(endpoint)
      return this.normalizeUsersResponse(response, params)
    } catch (authAdminError) {
      console.warn('⚠️ Error en /auth/admin/users, intentando /admin/users', authAdminError)

      try {
        return await this.listSystemUsers(params)
      } catch (systemUsersError) {
        const authAdminErrorText = this.getErrorText(authAdminError)
        const systemUsersErrorText = this.getErrorText(systemUsersError)

        throw new Error(
          `No fue posible listar usuarios. Falló GET /auth/admin/users (${authAdminErrorText}) y GET /admin/users (${systemUsersErrorText}). ` +
          'Diagnóstico sugerido: validar que el token Bearer pertenezca a un super_admin activo y que backend reconozca permisos manage:users / roles en custom claims.'
        )
      }
    }
  }

  /**
   * Listar usuarios por endpoint alterno
   * Endpoint: GET /admin/users
   */
  async listSystemUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
    const query = this.buildUsersQuery(params)
    const endpoint = `/admin/users${query ? `?${query}` : ''}`
    const response = await apiClient.get<any>(endpoint)
    return this.normalizeUsersResponse(response, params)
  }

  async diagnoseUsersEndpoints(uid?: string): Promise<Array<{
    endpoint: string
    ok: boolean
    status: number | null
    message: string
  }>> {
    const checks = [
      { label: 'GET /admin/users', endpoint: '/admin/users?limit=1' },
      { label: 'GET /auth/admin/users', endpoint: '/auth/admin/users?limit=1' },
      { label: 'GET /auth/admin/users/{uid}', endpoint: uid ? `/auth/admin/users/${uid}` : null }
    ]

    const results = await Promise.all(checks.map(async (check) => {
      if (!check.endpoint) {
        return {
          endpoint: check.label,
          ok: false,
          status: null,
          message: 'No se pudo ejecutar: UID no disponible en sesión'
        }
      }

      try {
        const response = await apiClient.get<any>(check.endpoint, false)
        const users = response?.users || response?.data
        const count = Array.isArray(users) ? users.length : undefined

        return {
          endpoint: check.label,
          ok: true,
          status: 200,
          message: count !== undefined
            ? `OK (registros recibidos: ${count})`
            : 'OK'
        }
      } catch (error) {
        return {
          endpoint: check.label,
          ok: false,
          status: this.getErrorStatus(error),
          message: this.getErrorText(error)
        }
      }
    }))

    return results
  }

  /**
   * Listar usuarios super administradores
   * Endpoint: GET /auth/admin/users/super-admins
   */
  async listSuperAdminUsers(): Promise<AdminUser[]> {
    const response = await apiClient.get<any>('/auth/admin/users/super-admins')
    const rawUsers = response?.users || response?.data || []
    return (Array.isArray(rawUsers) ? rawUsers : []).map((user) => this.normalizeAdminUser(user))
  }

  /**
   * Obtener un usuario específico por UID
   * Endpoint: GET /auth/admin/users/{uid}
   */
  async getUser(uid: string): Promise<AdminUser> {
    try {
      const response = await apiClient.get<any>(`/auth/admin/users/${uid}`)
      return this.normalizeAdminUser(response?.user || response?.data || response)
    } catch (authUserDetailsError) {
      console.warn('⚠️ Error en /auth/admin/users/{uid}, intentando resolver desde /admin/users', authUserDetailsError)

      try {
        const response = await this.listSystemUsers({ limit: 500 })
        const matchedUser = response.users.find((user) => user.uid === uid)

        if (matchedUser) {
          return matchedUser
        }

        throw new Error('Usuario no encontrado en fallback /admin/users')
      } catch (systemUsersFallbackError) {
        const authErrorText = this.getErrorText(authUserDetailsError)
        const fallbackErrorText = this.getErrorText(systemUsersFallbackError)

        throw new Error(
          `No fue posible obtener detalle del usuario ${uid}. Falló GET /auth/admin/users/{uid} (${authErrorText}) y fallback GET /admin/users (${fallbackErrorText}). ` +
          'Diagnóstico sugerido: revisar autorización backend para /auth/admin/users/{uid} y consistencia de UID en colección users.'
        )
      }
    }
  }

  /**
   * Asignar roles a un usuario
   * Endpoint: POST /auth/admin/users/{uid}/roles
   */
  async assignRoles(uid: string, request: AssignRolesRequest): Promise<AssignRolesResponse> {
    try {
      const response = await apiClient.post<any>(`/auth/admin/users/${uid}/roles`, request)
      return {
        success: response.success || true,
        message: response.message || 'Roles asignados exitosamente',
        user: this.normalizeAdminUser(response.user || response.data)
      }
    } catch (error: any) {
      console.warn('⚠️ Error en /auth/admin/users/{uid}/roles, intentando /auth/admin/change_users_rol/{uid}', error)
      const response = await apiClient.put<any>(`/auth/admin/change_users_rol/${uid}`, request)
      return {
        success: response.success || true,
        message: response.message || 'Roles asignados exitosamente',
        user: this.normalizeAdminUser(response.user || response.data)
      }
    }
  }

  /**
   * Actualizar información general de un usuario
   * Endpoint: PUT /auth/admin/users/{uid}
   */
  async updateUser(uid: string, request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      const response = await apiClient.put<any>(`/auth/admin/users/${uid}`, request)
      return {
        success: response.success || true,
        message: response.message || 'Usuario actualizado exitosamente',
        user: this.normalizeAdminUser(response.user || response.data)
      }
    } catch (error: any) {
      console.warn('⚠️ Error en /auth/admin/users/{uid}, intentando endpoint legacy /admin/users/{uid}', error)

      const response = await apiClient.put<any>(`/admin/users/${uid}`, request)
      return {
        success: response.success || true,
        message: response.message || 'Usuario actualizado exitosamente',
        user: this.normalizeAdminUser(response.user || response.data)
      }
    }
  }

  /**
   * Actualizar centro gestor de un usuario
   * Endpoint: PUT /auth/admin/users/{uid}/centro-gestor
   */
  async updateCentroGestor(uid: string, request: UpdateCentroGestorRequest): Promise<UpdateCentroGestorResponse> {
    const response = await apiClient.put<any>(`/auth/admin/users/${uid}/centro-gestor`, request)
    return {
      success: response.success || true,
      message: response.message || 'Centro gestor actualizado exitosamente',
      user: this.normalizeAdminUser(response.user || response.data)
    }
  }

  /**
   * Activar o desactivar un usuario
   * Endpoint: PUT /auth/admin/users/{uid}/status
   */
  async toggleUserStatus(uid: string, request: ToggleUserStatusRequest): Promise<ToggleUserStatusResponse> {
    const response = await apiClient.put<any>(`/auth/admin/users/${uid}/status`, request)
    return {
      success: response.success || true,
      message: response.message || 'Estado del usuario actualizado exitosamente',
      user: this.normalizeAdminUser(response.user || response.data)
    }
  }

  /**
   * Otorgar permiso temporal
   * Endpoint: POST /auth/admin/users/{uid}/temporary-permissions
   */
  async grantTemporaryPermission(uid: string, request: GrantTemporaryPermissionRequest): Promise<GrantTemporaryPermissionResponse> {
    const response = await apiClient.post<any>(`/auth/admin/users/${uid}/temporary-permissions`, request)
    return {
      success: response.success || true,
      message: response.message || 'Permiso temporal otorgado exitosamente',
      user: this.normalizeAdminUser(response.user || response.data)
    }
  }

  /**
   * Revocar permiso temporal
   * Endpoint: DELETE /auth/admin/users/{uid}/temporary-permissions/{permission}
   */
  async revokeTemporaryPermission(uid: string, permission: string): Promise<RevokeTemporaryPermissionResponse> {
    const encodedPermission = encodeURIComponent(permission)
    const response = await apiClient.delete<any>(`/auth/admin/users/${uid}/temporary-permissions/${encodedPermission}`)
    return {
      success: response.success || true,
      message: response.message || 'Permiso temporal revocado exitosamente',
      user: this.normalizeAdminUser(response.user || response.data)
    }
  }

  /**
   * Cambiar contraseña de usuario
   * Endpoint: POST /auth/change-password
   */
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const formData = new URLSearchParams()
    formData.append('uid', request.uid)
    formData.append('new_password', request.new_password)

    const response = await apiClient.request<any>(
      '/auth/change-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      },
      false
    )
    return {
      success: response.success || true,
      message: response.message || 'Contraseña actualizada exitosamente'
    }
  }

  /**
   * Eliminar usuario
   * Endpoint: DELETE /auth/user/{uid}
   */
  async deleteUser(uid: string, softDelete: boolean = true): Promise<DeleteUserResponse> {
    const response = await apiClient.delete<any>(`/auth/user/${uid}?soft_delete=${softDelete}`)
    return {
      success: response.success || true,
      message: response.message || 'Usuario eliminado exitosamente'
    }
  }

  /**
   * Listar roles
   * Endpoint: GET /auth/admin/roles
   */
  async listRoles(): Promise<Role[]> {
    try {
      const response = await apiClient.get<any>('/auth/admin/roles')
      const rawRoles = response?.roles || response?.data || response

      if (!Array.isArray(rawRoles)) return []

      return rawRoles.map((roleLike: any) => this.normalizeRole(roleLike))
    } catch {
      const { ROLES_CONFIG, getRoleInfo } = await import('@/types/admin')
      return Object.keys(ROLES_CONFIG).map(roleId => getRoleInfo(roleId as any))
    }
  }

  /**
   * Detalle de rol
   * Endpoint: GET /auth/admin/roles/{role_id}
   */
  async getRoleDetails(roleId: string): Promise<Role> {
    const response = await apiClient.get<any>(`/auth/admin/roles/${roleId}`)
    return this.normalizeRole(response?.role || response?.data || response)
  }

  async getRolesCatalog(): Promise<Role[]> {
    const roles = await this.listRoles()
    if (roles.length === 0) return roles

    const detailedRoles = await Promise.all(
      roles.map(async (role) => {
        try {
          return await this.getRoleDetails(role.id)
        } catch {
          return role
        }
      })
    )

    const uniqueById = new Map<string, Role>()
    detailedRoles.forEach((role) => {
      uniqueById.set(role.id, role)
    })

    return Array.from(uniqueById.values())
  }

  /**
   * Logs de auditoría
   * Endpoint: GET /auth/admin/audit-logs
   */
  async listAuditLogs(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.user_uid) queryParams.append('user_uid', params.user_uid)
    if (params.action) queryParams.append('action', params.action)
    if (params.resource) queryParams.append('resource', params.resource)
    if (params.start_date) queryParams.append('start_date', params.start_date)
    if (params.end_date) queryParams.append('end_date', params.end_date)

    const endpoint = `/auth/admin/audit-logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await apiClient.get<any>(endpoint)

    return {
      success: response.success || true,
      logs: response.logs || response.data || [],
      total: response.total || 0,
      page: response.page || params.page || 1,
      total_pages: response.total_pages || 1
    }
  }

  /**
   * Estadísticas del sistema
   * Endpoint: GET /auth/admin/system/stats
   */
  async getSystemStats(): Promise<SystemStats> {
    const response = await apiClient.get<any>('/auth/admin/system/stats')
    return response.stats || response.data || response
  }

  /**
   * Lista de centros gestores
   * Endpoint: GET /centros-gestores/nombres-unicos
   */
  async getCentrosGestores(): Promise<string[]> {
    const response = await apiClient.get<any>('/centros-gestores/nombres-unicos')
    return response.data || response.centros_gestores || []
  }
}

export default new AdminService()
