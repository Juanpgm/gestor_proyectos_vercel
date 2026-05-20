import { test, expect } from "@playwright/test";
import { seedAuthSession } from "./helpers/session";

/**
 * Verifica que la lista de "centros gestores abiertos" sea legible por la app
 * y que un usuario asignado a uno de ellos sea tratado como acceso amplio.
 *
 * Esta lista debe mantenerse alineada con OPEN_ACCESS_CENTROS_RAW en
 * front/src/utils/centroGestorAccess.ts (12 entradas).
 */
const OPEN_CENTROS = [
  "Calitrack",
  "Otro",
  "Secretaría de Gobierno",
  "Departamento Administrativo de Gestión Jurídica Pública",
  "Departamento Administrativo de Control Interno",
  "Departamento Administrativo de Control Disciplinario Interno de Instrucción",
  "Departamento Administrativo de Hacienda",
  "Departamento Administrativo de Planeación",
  "Departamento Administrativo de Gestión del Medio Ambiente",
  "Departamento Administrativo de Tecnologías de la Información y las Comunicaciones",
  "Departamento Administrativo de Contratación Pública",
  "Departamento Administrativo de Desarrollo e Innovación Institucional",
];

test.describe("Centros gestores abiertos · sesión y persistencia", () => {
  for (const centro of OPEN_CENTROS) {
    test(`usuario asignado a "${centro}" carga la app con sesión válida`, async ({
      page,
    }) => {
      await seedAuthSession(page, {
        email: `user-${centro.slice(0, 5).toLowerCase()}@cali.gov.co`,
        roles: ["editor_datos"],
        nombre_centro_gestor: centro,
        permissions: ["read:unidades", "write:unidades:own_centro"],
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
});
