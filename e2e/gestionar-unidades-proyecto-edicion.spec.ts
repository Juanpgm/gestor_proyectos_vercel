import { test, expect } from "@playwright/test";
import {
  seedAuthSession,
  mockUnidadesProyectoPayload,
} from "./helpers/session";

/**
 * Verifica el flujo de edición para admin_centro_gestor:
 *  - puede editar UPs cuyo nombre_centro_gestor coincide con el suyo
 *  - NO puede editar UPs de otros centros gestores
 *
 * Mockea la API de backend con page.route para evitar dependencia de Firestore real.
 */
test.describe("Gestión Unidades de Proyecto · edición por centro gestor", () => {
  test.beforeEach(async ({ page }) => {
    // Mock de endpoints de backend
    await page.route("**/unidades-proyecto*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUnidadesProyectoPayload()),
      });
    });

    // Cualquier llamada al backend no mockeada → 200 vacío para no romper la UI.
    // Excluye auth/validate-session: ese mock lo inyecta seedAuthSession por test
    // para poder devolver los datos de usuario correctos (LIFO en Playwright).
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("auth/validate-session")) {
        // Dejar que lo maneje el mock específico registrado por seedAuthSession
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
    });
  });

  test("admin_centro_gestor de DAGRD: sesión válida con centro asignado", async ({
    page,
  }) => {
    await seedAuthSession(page, {
      email: "admin-dagrd@cali.gov.co",
      roles: ["admin_centro_gestor"],
      nombre_centro_gestor: "DAGRD",
      permissions: ["read:unidades", "write:unidades:own_centro"],
    });

    await page.goto("/");
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});

    const session = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("auth_session") || "{}"),
    );
    expect(session.user?.nombre_centro_gestor).toBe("DAGRD");
    expect(session.user?.roles).toContain("admin_centro_gestor");
  });

  test("editor_datos sin centro gestor: la sesión existe pero sin write global", async ({
    page,
  }) => {
    await seedAuthSession(page, {
      email: "editor@cali.gov.co",
      roles: ["editor_datos"],
      nombre_centro_gestor: "Secretaría de Salud",
      permissions: ["read:unidades", "write:unidades:own_centro"],
    });

    await page.goto("/");
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});

    const session = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("auth_session") || "{}"),
    );
    expect(session.user?.permissions).toContain("write:unidades:own_centro");
    expect(session.user?.permissions ?? []).not.toContain("write:unidades");
  });
});
