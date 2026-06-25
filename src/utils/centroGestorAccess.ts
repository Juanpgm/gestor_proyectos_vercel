/**
 * Acceso por centro gestor (frontend) — CONSUME el scope autoritativo del backend.
 *
 * Antes este módulo re-derivaba la autorización con listas hardcodeadas
 * (PRIVILEGED_ROLES + OPEN_ACCESS_CENTROS), divergentes del backend. Ahora la
 * fuente única de verdad es el backend, que emite en la sesión:
 *   - `can_view_all`: si el rol ve todos los centros (política A: solo admins),
 *   - `effective_centro_gestor`: el centro canónico del usuario.
 *
 * Si la sesión es legacy (sin esos campos), se cae a un fallback seguro basado en
 * rol (solo super_admin/admin_general son globales) — nunca por centro.
 */

import { rolesCanViewAll } from "./rbac";
import {
  normalizeCentro,
  canonicalizeCentro,
  isGlobalViewCentro,
} from "./centrosCatalog";

export interface CentroGestorAccess {
  userCentroGestor: string | null;
  canViewAll: boolean;
  isRestricted: boolean;
}

const normalizeValue = normalizeCentro;

/**
 * Clave de comparación CANÓNICA de un centro gestor.
 *
 * Mapea formas cortas/alias al nombre canónico antes de normalizar, igual que el
 * backend. Así un dato en forma corta (p.ej. "Deportes", "Cultura" en
 * flujo_caja.json) matchea contra el centro canónico del usuario. Si el valor no
 * es un centro reconocible (p.ej. un nombre de persona en "responsible"), cae a
 * la normalización simple para no perder coincidencias legítimas.
 */
const centroMatchKey = (value: unknown): string =>
  normalizeCentro(canonicalizeCentro(value) ?? value);

const extractUserCentroGestor = (sessionPayload: any): string | null => {
  const user = sessionPayload?.user ?? sessionPayload ?? {};
  const value =
    user.effective_centro_gestor ||
    user.nombre_centro_gestor ||
    user.centro_gestor_assigned ||
    sessionPayload?.effective_centro_gestor ||
    sessionPayload?.nombre_centro_gestor ||
    null;

  if (!value || typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const extractRoles = (sessionPayload: any): unknown => {
  const user = sessionPayload?.user ?? sessionPayload ?? {};
  return user.roles ?? user.role ?? sessionPayload?.roles ?? [];
};

const extractCanViewAll = (sessionPayload: any): boolean | undefined => {
  const user = sessionPayload?.user ?? sessionPayload ?? {};
  if (typeof user.can_view_all === "boolean") return user.can_view_all;
  if (typeof sessionPayload?.can_view_all === "boolean")
    return sessionPayload.can_view_all;
  return undefined;
};

export const getCentroGestorAccessFromSession = (): CentroGestorAccess => {
  if (typeof window === "undefined") {
    return { userCentroGestor: null, canViewAll: true, isRestricted: false };
  }

  try {
    const rawSession =
      localStorage.getItem("auth_session") ||
      sessionStorage.getItem("auth_session");

    if (!rawSession) {
      // Sin sesión: usuario no autenticado; el AuthWrapper bloquea la app.
      return { userCentroGestor: null, canViewAll: true, isRestricted: false };
    }

    const parsedSession = JSON.parse(rawSession);
    const userCentroGestor = extractUserCentroGestor(parsedSession);

    // Fuente única: scope del backend. Fallback legacy: rol global (política A)
    // o centro interno especial (Calitrack) con visibilidad global.
    const explicit = extractCanViewAll(parsedSession);
    const canViewAll =
      explicit !== undefined
        ? explicit
        : rolesCanViewAll(extractRoles(parsedSession)) ||
          isGlobalViewCentro(userCentroGestor);

    return {
      userCentroGestor,
      canViewAll,
      isRestricted: !canViewAll,
    };
  } catch (error) {
    console.warn(
      "⚠️ Error reading auth session for centro gestor filtering:",
      error,
    );
    return { userCentroGestor: null, canViewAll: true, isRestricted: false };
  }
};

export const itemMatchesCentroGestor = (
  item: Record<string, any>,
  access: CentroGestorAccess,
  candidateKeys: string[] = [
    "nombre_centro_gestor",
    "centro_gestor",
    "responsible",
  ],
): boolean => {
  if (access.canViewAll || !access.userCentroGestor) return true;

  const userKey = centroMatchKey(access.userCentroGestor);

  for (const key of candidateKeys) {
    const value = item?.[key];

    if (Array.isArray(value)) {
      const hasMatchInArray = value.some(
        (entry) => centroMatchKey(entry) === userKey,
      );
      if (hasMatchInArray) return true;
      continue;
    }

    if (centroMatchKey(value) === userKey) {
      return true;
    }
  }

  return false;
};

export const filterByCentroGestor = <T extends Record<string, any>>(
  data: T[],
  access: CentroGestorAccess,
  candidateKeys?: string[],
): T[] => {
  if (!Array.isArray(data) || data.length === 0 || access.canViewAll)
    return data;
  return data.filter((item) =>
    itemMatchesCentroGestor(item, access, candidateKeys),
  );
};

export const toBpinKey = (
  bpin: string | number | null | undefined,
): string | null => {
  if (bpin === null || bpin === undefined) return null;
  const normalized = String(bpin).trim();
  return normalized.length > 0 ? normalized : null;
};

export const buildAllowedBpinsSet = <T extends Record<string, any>>(
  projects: T[],
  access: CentroGestorAccess,
  centroKeys: string[] = [
    "nombre_centro_gestor",
    "centro_gestor",
    "responsible",
  ],
  bpinKey: string = "bpin",
): Set<string> | null => {
  if (access.canViewAll) return null;

  const filteredProjects = filterByCentroGestor(projects, access, centroKeys);
  const bpins = filteredProjects
    .map((project) => toBpinKey(project?.[bpinKey]))
    .filter((value): value is string => Boolean(value));

  return new Set(bpins);
};

export const filterByAllowedBpins = <T extends Record<string, any>>(
  data: T[],
  allowedBpins: Set<string> | null,
  bpinKey: string = "bpin",
): T[] => {
  if (!Array.isArray(data) || data.length === 0 || !allowedBpins) return data;

  return data.filter((item) => {
    const bpin = toBpinKey(item?.[bpinKey]);
    return bpin ? allowedBpins.has(bpin) : false;
  });
};

/**
 * Normaliza un valor de centro gestor (trim + lowercase + sin tildes).
 * Reexporta la normalización canónica del catálogo para reutilización.
 */
export const normalizeCentroGestor = (value: unknown): string =>
  normalizeValue(value);

/**
 * Verifica si el usuario puede modificar un item por su dimensión centro gestor:
 *  - acceso global (canViewAll) autoriza,
 *  - o pertenencia del item al mismo centro gestor del usuario.
 * No reemplaza la verificación de permisos por rol (write:unidades).
 */
export const userCanEditItem = (
  item: Record<string, any> | null | undefined,
  access: CentroGestorAccess,
  candidateKeys: string[] = [
    "nombre_centro_gestor",
    "centro_gestor",
    "responsible",
  ],
): boolean => {
  if (access.canViewAll) return true;
  if (!access.userCentroGestor) return false;
  if (!item) return false;
  return itemMatchesCentroGestor(item, access, candidateKeys);
};
