import type { Page } from "@playwright/test";

export type UserRole =
  | "super_admin"
  | "admin_general"
  | "admin_centro_gestor"
  | "editor_datos"
  | "gestor_contratos"
  | "analista"
  | "visualizador"
  | "publico";

export interface SessionUser {
  uid?: string;
  email: string;
  roles: UserRole[];
  permissions?: string[];
  nombre_centro_gestor?: string | null;
  idToken?: string;
  name?: string;
}

/**
 * Registra un mock de red para /auth/validate-session en Playwright.
 * Devuelve siempre una respuesta exitosa con los datos del usuario recibido,
 * evitando que el AuthService contacte al backend real con tokens de prueba.
 */
export async function mockValidateSession(
  page: Page,
  user: SessionUser,
): Promise<void> {
  const mockUser = {
    uid: user.uid ?? "test-uid",
    email: user.email,
    roles: user.roles,
    permissions: user.permissions ?? [],
    nombre_centro_gestor: user.nombre_centro_gestor ?? null,
    centro_gestor_assigned: user.nombre_centro_gestor ?? null,
    idToken: user.idToken ?? "fake-token",
    name: user.name ?? user.email,
    session_valid: true,
    profile_complete: true,
    is_active: true,
  };

  await page.route("**/auth/validate-session**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_valid: true,
        success: true,
        user: mockUser,
      }),
    });
  });
}

/**
 * Inyecta una sesión `auth_session` en localStorage ANTES de cargar la app,
 * para simular un usuario autenticado sin pasar por el login real.
 *
 * Flujo:
 *  1. Registra mock de red para /auth/validate-session (previene borrado de sesión)
 *  2. Navega a "/" para inicializar la app sin sesión (primera visita)
 *  3. Siembra la sesión en localStorage
 * El test debe luego navegar a "/" de nuevo para que AuthContext cargue la sesión.
 */
export async function seedAuthSession(
  page: Page,
  user: SessionUser,
  baseURL = "http://localhost:3000",
) {
  // Interceptar ANTES de cualquier navegación para que el mock esté activo
  // en la segunda carga (cuando AuthContext llama validateSession).
  await mockValidateSession(page, user);

  await page.goto(`${baseURL}/`);
  await page.evaluate((u) => {
    const sessionData = {
      user: {
        uid: u.uid ?? "test-uid",
        email: u.email,
        roles: u.roles,
        permissions: u.permissions ?? [],
        nombre_centro_gestor: u.nombre_centro_gestor ?? null,
        centro_gestor_assigned: u.nombre_centro_gestor ?? null,
        idToken: u.idToken ?? "fake-token",
        name: u.name ?? u.email,
        session_valid: true,
        profile_complete: true,
        is_active: true,
      },
      timestamp: Date.now(),
      remember: true,
    };
    window.localStorage.setItem("auth_session", JSON.stringify(sessionData));
  }, user);
}

/**
 * Devuelve una lista mínima de unidades de proyecto de prueba,
 * suficiente para probar visibilidad / edición por centro gestor.
 */
export function mockUnidadesProyectoPayload() {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          upid: "UNP-1001",
          nombre_centro_gestor: "DAGRD",
          estado: "En ejecución",
          tipo_intervencion: "Obra nueva",
        },
        geometry: { type: "Point", coordinates: [-76.5, 3.4] },
      },
      {
        type: "Feature",
        properties: {
          upid: "UNP-1002",
          nombre_centro_gestor: "Secretaría de Salud",
          estado: "En ejecución",
          tipo_intervencion: "Mantenimiento",
        },
        geometry: { type: "Point", coordinates: [-76.51, 3.41] },
      },
    ],
  };
}
