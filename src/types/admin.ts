/**
 * Tipos para el módulo de administración de usuarios
 * Basado en el sistema de roles y permisos del backend
 */

// ============================================================================
// ROLES Y PERMISOS
// ============================================================================

export type RoleId = 
  | 'super_admin'
  | 'admin_general'
  | 'admin_centro_gestor'
  | 'editor_datos'
  | 'gestor_contratos'
  | 'analista'
  | 'visualizador'
  | 'publico'

export interface Role {
  id: RoleId
  name: string
  level: number
  permissions: string[]
  description: string
  color: string
  icon: string
}

export interface Permission {
  action: string
  resource: string
  scope?: string
  description?: string
}

// ============================================================================
// USUARIO
// ============================================================================

export interface AdminUser {
  uid: string
  email: string
  full_name?: string
  phone_number?: string
  centro_gestor_assigned?: string
  roles: RoleId[]
  permissions: string[]
  temporary_permissions?: TemporaryPermission[]
  is_active: boolean
  email_verified: boolean
  created_at: string
  last_login_at?: string
  updated_at?: string
  photo_url?: string
  provider?: string
}

export interface TemporaryPermission {
  permission: string
  expires_at: string
  granted_by: string
  granted_at: string
  reason?: string
}

// ============================================================================
// REQUESTS Y RESPONSES
// ============================================================================

export interface ListUsersParams {
  page?: number
  limit?: number
  role?: RoleId
  centro_gestor?: string
  is_active?: boolean
  search?: string
}

export interface ListUsersResponse {
  success: boolean
  users: AdminUser[]
  total: number
  page: number
  total_pages: number
  count: number
}

export interface AssignRolesRequest {
  roles: RoleId[]
  reason?: string
}

export interface AssignRolesResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface UpdateCentroGestorRequest {
  centro_gestor_assigned: string
  reason?: string
}

export interface UpdateCentroGestorResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface ToggleUserStatusRequest {
  is_active: boolean
  reason?: string
}

export interface ToggleUserStatusResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface GrantTemporaryPermissionRequest {
  permission: string
  expires_at: string
  reason?: string
}

export interface GrantTemporaryPermissionResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface RevokeTemporaryPermissionResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface ChangePasswordRequest {
  uid: string
  new_password: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export interface UpdateUserRequest {
  full_name?: string
  phone_number?: string
  centro_gestor_assigned?: string
  email_verified?: boolean
  phone_verified?: boolean
  is_active?: boolean
}

export interface UpdateUserResponse {
  success: boolean
  message: string
  user: AdminUser
}

export interface DeleteUserResponse {
  success: boolean
  message: string
}

// ============================================================================
// GESTION DE REPORTES Y SOLICITUDES (CRUD)
// ============================================================================

export interface ReporteBugPayload {
  reportado_por?: string
  descripcion_bug?: string
  contexto_adicional_bug?: string
}

export interface ReporteBugRecord extends ReporteBugPayload {
  registro_id?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface SolicitudEscaladaPayload {
  reportado_por?: string
  rol_solicitado?: string
  motivo_solicitud?: string
  justificacion_escalada?: string
}

export interface SolicitudEscaladaRecord extends SolicitudEscaladaPayload {
  registro_id?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface RecomendacionPayload {
  reportado_por: string
  recomendacion_sugerencia: string
  beneficio_esperado: string
}

export interface ActualizarRecomendacionPayload {
  reportado_por?: string
  recomendacion_sugerencia?: string
  beneficio_esperado?: string
}

export interface RecomendacionRecord extends ActualizarRecomendacionPayload {
  registro_id?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface GenericCrudResponse<TRecord> {
  success: boolean
  message?: string
  data?: TRecord | TRecord[]
  count?: number
  [key: string]: unknown
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export interface AuditLog {
  id: string
  timestamp: string
  user_uid: string
  user_email?: string
  action: string
  resource?: string
  resource_id?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: 'success' | 'failed'
  error_message?: string
}

export interface ListAuditLogsParams {
  page?: number
  limit?: number
  user_uid?: string
  action?: string
  resource?: string
  start_date?: string
  end_date?: string
}

export interface ListAuditLogsResponse {
  success: boolean
  logs: AuditLog[]
  total: number
  page: number
  total_pages: number
}

// ============================================================================
// ESTADÍSTICAS DEL SISTEMA
// ============================================================================

export interface SystemStats {
  total_users: number
  active_users: number
  inactive_users: number
  users_by_role: Record<RoleId, number>
  users_by_centro_gestor: Record<string, number>
  recent_logins: number
  new_users_last_30_days: number
}

// ============================================================================
// ROLES DISPONIBLES (CONSTANTES)
// ============================================================================

export const ROLES_CONFIG: Record<RoleId, Omit<Role, 'id'>> = {
  super_admin: {
    name: "Super Administrador",
    level: 0,
    permissions: ["*"],
    description: "Control absoluto del sistema incluyendo gestión de usuarios",
    color: "#8B5CF6",
    icon: "shield"
  },
  admin_general: {
    name: "Administrador General",
    level: 1,
    permissions: [
      "read:*",
      "write:proyectos", "write:unidades", "write:contratos",
      "delete:proyectos", "delete:unidades",
      "manage:roles",
      "view:audit_logs",
      "upload:geojson", "download:geojson",
      "export:*"
    ],
    description: "Administración completa de datos y roles, sin acceso a gestión de usuarios",
    color: "#EC4899",
    icon: "user-shield"
  },
  admin_centro_gestor: {
    name: "Administrador de Centro Gestor",
    level: 2,
    permissions: [
      "read:proyectos:own_centro",
      "write:proyectos:own_centro",
      "write:unidades:own_centro",
      "delete:proyectos:own_centro",
      "read:contratos:own_centro",
      "write:contratos:own_centro",
      "create:reportes_contratos:own_centro",
      "export:proyectos:own_centro",
      "export:unidades:own_centro",
      "export:contratos:own_centro",
      "upload:geojson",
      "download:geojson"
    ],
    description: "Gestión completa de datos de su centro gestor (sin acceso a usuarios)",
    color: "#3B82F6",
    icon: "building"
  },
  editor_datos: {
    name: "Editor de Datos",
    level: 3,
    permissions: [
      "read:proyectos", "read:unidades", "read:contratos",
      "write:proyectos", "write:unidades",
      "upload:geojson",
      "export:proyectos", "export:unidades"
    ],
    description: "Edición de datos sin eliminación",
    color: "#14B8A6",
    icon: "edit"
  },
  gestor_contratos: {
    name: "Gestor de Contratos",
    level: 3,
    permissions: [
      "read:contratos",
      "write:contratos",
      "create:reportes_contratos",
      "read:proyectos:reference",
      "export:contratos"
    ],
    description: "Gestión exclusiva de contratos",
    color: "#F59E0B",
    icon: "file-contract"
  },
  analista: {
    name: "Analista de Datos",
    level: 4,
    permissions: [
      "read:proyectos", "read:unidades", "read:contratos",
      "read:reportes_contratos",
      "export:proyectos", "export:unidades", "export:contratos",
      "download:geojson",
      "view:dashboard:advanced"
    ],
    description: "Análisis y exportación de datos",
    color: "#10B981",
    icon: "chart-line"
  },
  visualizador: {
    name: "Visualizador",
    level: 5,
    permissions: [
      "read:proyectos:basic",
      "read:unidades:basic",
      "read:contratos:basic",
      "view:dashboard:basic"
    ],
    description: "Solo lectura de datos básicos (ROL POR DEFECTO)",
    color: "#06B6D4",
    icon: "eye"
  },
  publico: {
    name: "Usuario Público",
    level: 6,
    permissions: [
      "read:proyectos:public",
      "read:unidades:public",
      "view:map:public"
    ],
    description: "Acceso público limitado",
    color: "#64748B",
    icon: "globe"
  }
}

export const DEFAULT_USER_ROLE: RoleId = 'publico'

// Función helper para obtener información de un rol
export function getRoleInfo(roleId: RoleId): Role {
  return {
    id: roleId,
    ...ROLES_CONFIG[roleId]
  }
}

// Función helper para verificar si un rol tiene mayor autoridad que otro
export function hasHigherAuthority(roleId1: RoleId, roleId2: RoleId): boolean {
  return ROLES_CONFIG[roleId1].level < ROLES_CONFIG[roleId2].level
}

// Función helper para obtener el rol de mayor autoridad de un usuario
export function getHighestRole(roles?: RoleId[] | null): RoleId | null {
  if (!roles || roles.length === 0) return null
  
  return roles.reduce((highest, current) => 
    hasHigherAuthority(current, highest) ? current : highest
  )
}
