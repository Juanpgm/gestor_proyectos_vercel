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
    const users = response?.users || response?.data || []
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
    } catch (error) {
      console.warn('⚠️ Error en /auth/admin/users, intentando /admin/users', error)
      return this.listSystemUsers(params)
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

  /**
   * Listar usuarios super administradores
   * Endpoint: GET /auth/admin/users/super-admins
   */
  async listSuperAdminUsers(): Promise<AdminUser[]> {
    const response = await apiClient.get<any>('/auth/admin/users/super-admins')
    return response.users || response.data || []
  }

  /**
   * Obtener un usuario específico por UID
   * Endpoint: GET /auth/admin/users/{uid}
   */
  async getUser(uid: string): Promise<AdminUser> {
    const response = await apiClient.get<any>(`/auth/admin/users/${uid}`)
    return response.user || response.data || response
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
        user: response.user || response.data
      }
    } catch (error: any) {
      console.warn('⚠️ Error en /auth/admin/users/{uid}/roles, intentando /auth/admin/change_users_rol/{uid}', error)
      const response = await apiClient.put<any>(`/auth/admin/change_users_rol/${uid}`, request)
      return {
        success: response.success || true,
        message: response.message || 'Roles asignados exitosamente',
        user: response.user || response.data
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
        user: response.user || response.data
      }
    } catch (error: any) {
      console.warn('⚠️ Error en /auth/admin/users/{uid}, intentando endpoint legacy /admin/users/{uid}', error)

      const response = await apiClient.put<any>(`/admin/users/${uid}`, request)
      return {
        success: response.success || true,
        message: response.message || 'Usuario actualizado exitosamente',
        user: response.user || response.data
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
      user: response.user || response.data
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
      user: response.user || response.data
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
      user: response.user || response.data
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
      user: response.user || response.data
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
      return response.roles || response.data || []
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
    return response.role || response.data || response
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
