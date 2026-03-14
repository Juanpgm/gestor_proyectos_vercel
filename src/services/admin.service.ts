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
  SystemStats,
  ReporteBugPayload,
  ReporteBugRecord,
  SolicitudEscaladaPayload,
  SolicitudEscaladaRecord,
  RecomendacionPayload,
  ActualizarRecomendacionPayload,
  RecomendacionRecord,
  GenericCrudResponse
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
    const stringOrUndefined = (...candidates: any[]): string | undefined => {
      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim()
        }
      }
      return undefined
    }

    const roles = Array.from(new Set([
      ...this.toStringArray(userLike?.roles),
      ...this.toStringArray(userLike?.role),
      ...this.toStringArray(userLike?.rol),
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
      ...this.toStringArray(userLike?.firestore_data?.effective_permissions),
      ...this.toStringArray(userLike?.firestore_data?.permisos)
    ]))

    const temporaryPermissions = Array.isArray(userLike?.temporary_permissions)
      ? userLike.temporary_permissions
      : []

    const fullName = stringOrUndefined(
      userLike?.full_name,
      userLike?.fullname,
      userLike?.name,
      userLike?.display_name,
      userLike?.displayName,
      userLike?.firestore_data?.full_name,
      userLike?.firestore_data?.fullname
    )

    const centroGestor = stringOrUndefined(
      userLike?.centro_gestor_assigned,
      userLike?.nombre_centro_gestor,
      userLike?.centro_gestor,
      userLike?.firestore_data?.nombre_centro_gestor,
      userLike?.firestore_data?.centro_gestor,
      userLike?.custom_claims?.centro_gestor,
      userLike?.claims?.centro_gestor
    )

    const phoneNumber = stringOrUndefined(
      userLike?.phone_number,
      userLike?.phone,
      userLike?.cellphone,
      userLike?.firestore_data?.cellphone
    )

    const photoUrl = stringOrUndefined(
      userLike?.photo_url,
      userLike?.photoURL
    )

    return {
      ...userLike,
      uid: userLike?.uid || userLike?.id || '',
      email: userLike?.email || '',
      full_name: fullName,
      centro_gestor_assigned: centroGestor,
      phone_number: phoneNumber,
      photo_url: photoUrl,
      provider: userLike?.provider || userLike?.sign_in_provider,
      email_verified: typeof userLike?.email_verified === 'boolean'
        ? userLike.email_verified
        : Boolean(userLike?.emailVerified),
      is_active: typeof userLike?.is_active === 'boolean'
        ? userLike.is_active
        : (typeof userLike?.firestore_data?.is_active === 'boolean' ? userLike.firestore_data.is_active : true),
      created_at: userLike?.created_at || userLike?.createdAt || userLike?.firestore_data?.created_at,
      last_login_at: userLike?.last_login_at || userLike?.lastLoginAt || userLike?.firestore_data?.last_login,
      updated_at: userLike?.updated_at || userLike?.updatedAt || userLike?.firestore_data?.updated_at,
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
    const roleId = (roleLike?.id || roleLike?.role_id || roleLike?.role || roleLike?.name || 'publico') as Role['id']
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

    return queryParams.toString()
  }

  private normalizeUsersResponse(response: any, params: ListUsersParams): ListUsersResponse {
    const rawUsers = response?.users || response?.data || []
    const usersArray = Array.isArray(rawUsers)
      ? rawUsers
      : (rawUsers && typeof rawUsers === 'object' ? Object.values(rawUsers) : [])
    const users = usersArray.map((user) => this.normalizeAdminUser(user))
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

  private extractCollection<TRecord>(response: any): TRecord[] {
    if (Array.isArray(response?.data)) return response.data as TRecord[]
    if (Array.isArray(response?.items)) return response.items as TRecord[]
    if (Array.isArray(response?.results)) return response.results as TRecord[]
    if (Array.isArray(response?.records)) return response.records as TRecord[]
    if (Array.isArray(response)) return response as TRecord[]
    if (response?.data && typeof response.data === 'object') return [response.data as TRecord]
    if (response && typeof response === 'object') return [response as TRecord]
    return []
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

  private getUserDedupKey(user: AdminUser, page: number, index: number): string {
    const uid = typeof user?.uid === 'string' ? user.uid.trim() : ''
    if (uid) return `uid:${uid}`

    const email = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : ''
    if (email) return `email:${email}`

    const fullName = typeof user?.full_name === 'string' ? user.full_name.trim().toLowerCase() : ''
    const createdAt = typeof user?.created_at === 'string' ? user.created_at.trim() : ''
    if (fullName || createdAt) return `fallback:${fullName}|${createdAt}`

    return `page:${page}:index:${index}`
  }

  async listAllUsers(limitPerRequest: number = 500): Promise<AdminUser[]> {
    const safeLimit = Math.max(1, Math.min(500, limitPerRequest))
    const usersByKey = new Map<string, AdminUser>()
    let page = 1
    let hasMore = true
    let consecutiveNoGrowth = 0
    const MAX_PAGES = 200

    while (hasMore && page <= MAX_PAGES) {
      const response = await this.listUsers({ page, limit: safeLimit })
      const received = response.users.length
      const sizeBefore = usersByKey.size

      response.users.forEach((user, index) => {
        const dedupKey = this.getUserDedupKey(user, page, index)
        usersByKey.set(dedupKey, user)
      })

      const grew = usersByKey.size > sizeBefore
      consecutiveNoGrowth = grew ? 0 : consecutiveNoGrowth + 1

      const reachedTotal = typeof response.total === 'number' && response.total > 0
        ? usersByKey.size >= response.total
        : false

      const backendSuggestsMore = received === safeLimit && !reachedTotal
      hasMore = backendSuggestsMore && consecutiveNoGrowth < 2
      page += 1
    }

    return Array.from(usersByKey.values())
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

    // listRoles already returns normalized roles with permissions.
    // Only fetch individual details for roles missing permissions data.
    const rolesNeedingDetails = roles.filter(
      (role) => !role.permissions || role.permissions.length === 0
    )

    if (rolesNeedingDetails.length > 0) {
      const detailedRoles = await Promise.all(
        rolesNeedingDetails.map(async (role) => {
          try {
            return await this.getRoleDetails(role.id)
          } catch {
            return role
          }
        })
      )

      const detailsById = new Map<string, Role>()
      detailedRoles.forEach((role) => detailsById.set(role.id, role))

      return roles.map((role) => detailsById.get(role.id) || role)
    }

    return roles
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
    const raw = response?.data || response?.centros_gestores || response

    const values = Array.isArray(raw)
      ? raw
      : (raw && typeof raw === 'object' ? Object.values(raw) : [])

    return Array.from(new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b, 'es'))
  }

  async listReportesBug(registroId?: string, limit: number = 50): Promise<ReporteBugRecord[]> {
    const queryParams = new URLSearchParams()
    const safeLimit = Math.max(1, Math.min(200, limit))
    queryParams.append('limit', safeLimit.toString())
    if (registroId?.trim()) queryParams.append('registro_id', registroId.trim())

    const response = await apiClient.get<any>(`/reportar-bug?${queryParams.toString()}`)
    return this.extractCollection<ReporteBugRecord>(response)
  }

  async createReporteBug(payload: ReporteBugPayload): Promise<GenericCrudResponse<ReporteBugRecord>> {
    const response = await apiClient.post<any>('/reportar-bug', payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async updateReporteBug(registroId: string, payload: ReporteBugPayload): Promise<GenericCrudResponse<ReporteBugRecord>> {
    const response = await apiClient.put<any>(`/reportar-bug/${encodeURIComponent(registroId)}`, payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async deleteReporteBug(registroId: string): Promise<GenericCrudResponse<ReporteBugRecord>> {
    const response = await apiClient.delete<any>(`/reportar-bug/${encodeURIComponent(registroId)}`)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async listSolicitudesEscalada(registroId?: string, limit: number = 50): Promise<SolicitudEscaladaRecord[]> {
    const queryParams = new URLSearchParams()
    const safeLimit = Math.max(1, Math.min(200, limit))
    queryParams.append('limit', safeLimit.toString())
    if (registroId?.trim()) queryParams.append('registro_id', registroId.trim())

    const response = await apiClient.get<any>(`/solicitar-escalada-privilegios?${queryParams.toString()}`)
    return this.extractCollection<SolicitudEscaladaRecord>(response)
  }

  async createSolicitudEscalada(payload: SolicitudEscaladaPayload): Promise<GenericCrudResponse<SolicitudEscaladaRecord>> {
    const response = await apiClient.post<any>('/solicitar-escalada-privilegios', payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async updateSolicitudEscalada(registroId: string, payload: SolicitudEscaladaPayload): Promise<GenericCrudResponse<SolicitudEscaladaRecord>> {
    const response = await apiClient.put<any>(`/solicitar-escalada-privilegios/${encodeURIComponent(registroId)}`, payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async deleteSolicitudEscalada(registroId: string): Promise<GenericCrudResponse<SolicitudEscaladaRecord>> {
    const response = await apiClient.delete<any>(`/solicitar-escalada-privilegios/${encodeURIComponent(registroId)}`)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async listRecomendaciones(registroId?: string, limit: number = 50): Promise<RecomendacionRecord[]> {
    const queryParams = new URLSearchParams()
    const safeLimit = Math.max(1, Math.min(200, limit))
    queryParams.append('limit', safeLimit.toString())
    if (registroId?.trim()) queryParams.append('registro_id', registroId.trim())

    const response = await apiClient.get<any>(`/realizar-recomendacion?${queryParams.toString()}`)
    return this.extractCollection<RecomendacionRecord>(response)
  }

  async createRecomendacion(payload: RecomendacionPayload): Promise<GenericCrudResponse<RecomendacionRecord>> {
    const response = await apiClient.post<any>('/realizar-recomendacion', payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async updateRecomendacion(registroId: string, payload: ActualizarRecomendacionPayload): Promise<GenericCrudResponse<RecomendacionRecord>> {
    const response = await apiClient.put<any>(`/realizar-recomendacion/${encodeURIComponent(registroId)}`, payload)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }

  async deleteRecomendacion(registroId: string): Promise<GenericCrudResponse<RecomendacionRecord>> {
    const response = await apiClient.delete<any>(`/realizar-recomendacion/${encodeURIComponent(registroId)}`)
    return {
      success: response?.success !== false,
      message: response?.message,
      data: response?.data,
      count: response?.count,
      ...response
    }
  }
}

export default new AdminService()
