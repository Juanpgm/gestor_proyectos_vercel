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
  ChangePasswordRequest,
  ChangePasswordResponse,
  Role,
  ListAuditLogsParams,
  ListAuditLogsResponse,
  SystemStats
} from '@/types/admin'

class AdminService {
  private baseUrl = '/admin'

  /**
   * Listar todos los usuarios del sistema
   * Endpoint: GET /admin/users
   */
  async listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.role) queryParams.append('role', params.role)
      if (params.centro_gestor) queryParams.append('centro_gestor', params.centro_gestor)
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
      if (params.search) queryParams.append('search', params.search)

      const url = `${this.baseUrl}/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get<any>(url)

      return {
        success: response.success || true,
        users: response.users || response.data || [],
        total: response.total || 0,
        page: response.page || params.page || 1,
        total_pages: response.total_pages || 1,
        count: response.count || response.users?.length || 0
      }
    } catch (error) {
      console.error('Error listing users:', error)
      throw error
    }
  }

  /**
   * Obtener un usuario específico por UID
   * Endpoint: GET /auth/user/{uid}
   */
  async getUser(uid: string): Promise<AdminUser> {
    try {
      const response = await apiClient.get<any>(`/auth/admin/users/${uid}`)
      return response.user || response.data || response
    } catch (error) {
      console.error(`Error getting user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Asignar roles a un usuario
   * Endpoint: POST /auth/users/{uid}/roles
   * SOLO super_admin puede usar este endpoint
   */
  async assignRoles(uid: string, request: AssignRolesRequest): Promise<AssignRolesResponse> {
    try {
      const response = await apiClient.post<any>(
        `/auth/admin/users/${uid}/roles`,
        request
      )
      return {
        success: response.success || true,
        message: response.message || 'Roles asignados exitosamente',
        user: response.user || response.data
      }
    } catch (error) {
      console.error(`Error assigning roles to user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Actualizar información general de un usuario
   * Endpoint: PUT /auth/admin/users/{uid}
   * Permite actualizar múltiples campos en una sola petición
   */
  async updateUser(uid: string, request: UpdateUserRequest): Promise<UpdateUserResponse> {
    try {
      const response = await apiClient.put<any>(
        `/auth/admin/users/${uid}`,
        request
      )
      return {
        success: response.success || true,
        message: response.message || 'Usuario actualizado exitosamente',
        user: response.user || response.data
      }
    } catch (error) {
      console.error(`Error updating user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Actualizar centro gestor de un usuario
   * Endpoint: PUT /auth/admin/users/{uid}/centro-gestor
   * @deprecated Usar updateUser() en su lugar para actualizaciones múltiples
   */
  async updateCentroGestor(uid: string, request: UpdateCentroGestorRequest): Promise<UpdateCentroGestorResponse> {
    try {
      const response = await apiClient.put<any>(
        `/auth/admin/users/${uid}/centro-gestor`,
        request
      )
      return {
        success: response.success || true,
        message: response.message || 'Centro gestor actualizado exitosamente',
        user: response.user || response.data
      }
    } catch (error) {
      console.error(`Error updating centro gestor for user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Activar o desactivar un usuario
   * Endpoint: PUT /auth/admin/users/{uid}/status
   */
  async toggleUserStatus(uid: string, request: ToggleUserStatusRequest): Promise<ToggleUserStatusResponse> {
    try {
      const response = await apiClient.put<any>(
        `/auth/admin/users/${uid}/status`,
        request
      )
      return {
        success: response.success || true,
        message: response.message || 'Estado del usuario actualizado exitosamente',
        user: response.user || response.data
      }
    } catch (error) {
      console.error(`Error toggling user status for ${uid}:`, error)
      throw error
    }
  }

  /**
   * Otorgar permiso temporal a un usuario
   * Endpoint: POST /auth/users/{uid}/temporary-permissions
   * SOLO super_admin puede usar este endpoint
   */
  async grantTemporaryPermission(uid: string, request: GrantTemporaryPermissionRequest): Promise<GrantTemporaryPermissionResponse> {
    try {
      const response = await apiClient.post<any>(
        `/auth/admin/users/${uid}/temporary-permissions`,
        request
      )
      return {
        success: response.success || true,
        message: response.message || 'Permiso temporal otorgado exitosamente',
        user: response.user || response.data
      }
    } catch (error) {
      console.error(`Error granting temporary permission to user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Cambiar contraseña de un usuario
   * Endpoint: POST /auth/change-password
   * SOLO super_admin puede usar este endpoint
   */
  async changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
      const formData = new URLSearchParams()
      formData.append('uid', request.uid)
      formData.append('new_password', request.new_password)

      const response = await apiClient.post<any>(
        '/auth/change-password',
        formData.toString(),
        false
      )
      return {
        success: response.success || true,
        message: response.message || 'Contraseña actualizada exitosamente'
      }
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  }

  /**
   * Eliminar un usuario (soft delete por defecto)
   * Endpoint: DELETE /auth/user/{uid}
   * SOLO super_admin puede usar este endpoint
   */
  async deleteUser(uid: string, softDelete: boolean = true): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<any>(
        `/auth/user/${uid}?soft_delete=${softDelete}`
      )
      return {
        success: response.success || true,
        message: response.message || 'Usuario eliminado exitosamente'
      }
    } catch (error) {
      console.error(`Error deleting user ${uid}:`, error)
      throw error
    }
  }

  /**
   * Listar todos los roles disponibles
   * Endpoint: GET /auth/roles (si existe) o usar constantes locales
   */
  async listRoles(): Promise<Role[]> {
    try {
      // Intentar obtener desde API si existe el endpoint
      const response = await apiClient.get<any>('/auth/admin/roles')
      return response.roles || response.data || []
    } catch (error) {
      // Si falla, retornar roles desde constantes locales
      console.warn('Roles endpoint not available, using local constants')
      const { ROLES_CONFIG, getRoleInfo } = await import('@/types/admin')
      return Object.keys(ROLES_CONFIG).map(roleId => getRoleInfo(roleId as any))
    }
  }

  /**
   * Obtener detalles de un rol específico
   * Endpoint: GET /auth/roles/{roleId}
   */
  async getRoleDetails(roleId: string): Promise<Role> {
    try {
      const response = await apiClient.get<any>(`/auth/admin/roles/${roleId}`)
      return response.role || response.data || response
    } catch (error) {
      console.error(`Error getting role ${roleId}:`, error)
      throw error
    }
  }

  /**
   * Listar logs de auditoría
   * Endpoint: GET /auth/audit-logs
   */
  async listAuditLogs(params: ListAuditLogsParams = {}): Promise<ListAuditLogsResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.user_uid) queryParams.append('user_uid', params.user_uid)
      if (params.action) queryParams.append('action', params.action)
      if (params.resource) queryParams.append('resource', params.resource)
      if (params.start_date) queryParams.append('start_date', params.start_date)
      if (params.end_date) queryParams.append('end_date', params.end_date)

      const url = `/auth/admin/audit-logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      const response = await apiClient.get<any>(url)

      return {
        success: response.success || true,
        logs: response.logs || response.data || [],
        total: response.total || 0,
        page: response.page || params.page || 1,
        total_pages: response.total_pages || 1
      }
    } catch (error) {
      console.error('Error listing audit logs:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del sistema
   * Endpoint: GET /auth/system/stats
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await apiClient.get<any>('/auth/admin/system/stats')
      return response.stats || response.data || response
    } catch (error) {
      console.error('Error getting system stats:', error)
      throw error
    }
  }

  /**
   * Obtener lista de centros gestores únicos
   * Endpoint: GET /centros-gestores/nombres-unicos
   */
  async getCentrosGestores(): Promise<string[]> {
    try {
      const response = await apiClient.get<any>('/centros-gestores/nombres-unicos')
      return response.data || response.centros_gestores || []
    } catch (error) {
      console.error('Error getting centros gestores:', error)
      throw error
    }
  }
}

export default new AdminService()
