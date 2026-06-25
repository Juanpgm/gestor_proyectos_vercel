/**
 * RBAC unificado (frontend) — fuente única de constantes de rol y helpers de
 * comparación normalizada. Reemplaza los strings de rol hardcodeados y las
 * normalizaciones divergentes que había repartidas por el código.
 *
 * Política A: solo `super_admin` y `admin_general` ven todos los centros gestores.
 */

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN_GENERAL: "admin_general",
  ADMIN_CENTRO_GESTOR: "admin_centro_gestor",
  EDITOR_DATOS: "editor_datos",
  GESTOR_CONTRATOS: "gestor_contratos",
  ANALISTA: "analista",
  VISUALIZADOR: "visualizador",
  PUBLICO: "publico",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/** Jerarquía (mayor → menor privilegio). Debe coincidir con el backend. */
export const ROLE_HIERARCHY: string[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_CENTRO_GESTOR,
  ROLES.EDITOR_DATOS,
  ROLES.GESTOR_CONTRATOS,
  ROLES.ANALISTA,
  ROLES.VISUALIZADOR,
  ROLES.PUBLICO,
];

/** Roles con visibilidad global (ven todos los centros). Política A. */
export const GLOBAL_VIEW_ROLES: ReadonlySet<string> = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN_GENERAL,
]);

/** Normaliza un rol: trim, lower, separadores (`-`/espacios) → `_`. */
export const normalizeRole = (role: unknown): string =>
  String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

/** Lista de roles normalizada y deduplicada. */
export const normalizeRoles = (roles: unknown): string[] => {
  const arr = Array.isArray(roles)
    ? roles
    : typeof roles === "string"
      ? [roles]
      : [];
  return Array.from(
    new Set(arr.map(normalizeRole).filter((r) => r.length > 0)),
  );
};

/** True si la lista de roles (normalizada) incluye `role` (normalizado). */
export const hasRole = (roles: unknown, role: string): boolean =>
  normalizeRoles(roles).includes(normalizeRole(role));

/** True si la lista incluye CUALQUIERA de los roles dados. */
export const hasAnyRole = (roles: unknown, candidates: string[]): boolean => {
  const owned = new Set(normalizeRoles(roles));
  return candidates.some((c) => owned.has(normalizeRole(c)));
};

/** True si los roles otorgan visibilidad global (política A). */
export const rolesCanViewAll = (roles: unknown): boolean =>
  normalizeRoles(roles).some((r) => GLOBAL_VIEW_ROLES.has(r));

/**
 * Verifica un permiso `action:resource[:scope]`.
 * `*` otorga todo; `action:*` cubre cualquier recurso de esa acción;
 * un permiso scopeado (`read:x:own_centro`) cuenta como tener `read:x`.
 */
export const hasPermission = (
  permissions: unknown,
  required: string,
): boolean => {
  const perms = Array.isArray(permissions) ? permissions.map(String) : [];
  if (perms.includes("*")) return true;
  if (perms.includes(required)) return true;
  const [action] = required.split(":");
  if (action && perms.includes(`${action}:*`)) return true;
  // Variantes scopeadas del mismo action:resource.
  return perms.some(
    (p) => p === required || p.startsWith(`${required}:`),
  );
};

/** Rol de mayor jerarquía de la lista, o null. */
export const getHighestRole = (roles: unknown): string | null => {
  const owned = new Set(normalizeRoles(roles));
  if (owned.size === 0) return null;
  for (const role of ROLE_HIERARCHY) {
    if (owned.has(role)) return role;
  }
  return Array.from(owned)[0] ?? null;
};
