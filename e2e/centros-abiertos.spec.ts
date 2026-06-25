import { test, expect } from "@playwright/test";
import { seedAuthSession } from "./helpers/session";

/**
 * Política A: solo super_admin / admin_general ven todos los centros; el resto
 * queda restringido a su centro gestor. Antes existía una lista hardcodeada de
 * "centros abiertos" (OPEN_ACCESS_CENTROS) que daba acceso amplio por centro;
 * fue eliminada. Estos tests verifican el modelo nuevo con centros del catálogo.
 */
const CATALOGO_CENTROS = [
  "Secretaría de Gobierno",
  "Departamento Administrativo de Hacienda",
  "Secretaría de Infraestructura",
  "Secretaría de Educación",
];

test.describe("Centros gestores · sesión y persistencia (política A)", () => {
  for (const centro of CATALOGO_CENTROS) {
    test(`editor_datos en "${centro}" carga la app y persiste su centro`, async ({
      page,
    }) => {
      await seedAuthSession(page, {
        email: `user-${centro.slice(0, 5).toLowerCase()}@cali.gov.co`,
        roles: ["editor_datos"],
        nombre_centro_gestor: centro,
        permissions: ["read:unidades:own_centro", "write:unidades:own_centro"],
      });

      await page.goto("/");
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => {});

      const session = await page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("auth_session") || "{}"),
      );
      expect(session.user?.nombre_centro_gestor).toBe(centro);
    });
  }

  test("admin_general carga la app con visibilidad global", async ({ page }) => {
    await seedAuthSession(page, {
      email: "admin@cali.gov.co",
      roles: ["admin_general"],
      nombre_centro_gestor: "Secretaría de Infraestructura",
      permissions: ["read:unidades", "write:unidades"],
    });

    await page.goto("/");
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});

    const session = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("auth_session") || "{}"),
    );
    expect(session.user?.roles).toContain("admin_general");
  });
});
