import { beforeEach, describe, expect, it } from "vitest";
import {
  getCentroGestorAccessFromSession,
  itemMatchesCentroGestor,
  userCanEditItem,
  normalizeCentroGestor,
  filterByCentroGestor,
} from "./centroGestorAccess";

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

describe("centroGestorAccess", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each(OPEN_CENTROS)(
    "permite ver todo cuando el centro gestor es %s",
    (centro) => {
      localStorage.setItem(
        "auth_session",
        JSON.stringify({
          user: {
            nombre_centro_gestor: centro,
          },
        }),
      );

      const access = getCentroGestorAccessFromSession();

      expect(access.userCentroGestor).toBe(centro);
      expect(access.canViewAll).toBe(true);
      expect(access.isRestricted).toBe(false);
    },
  );

  it("restringe cuando el centro gestor no está en la lista abierta", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: {
          nombre_centro_gestor: "Secretaría de Infraestructura",
        },
      }),
    );

    const access = getCentroGestorAccessFromSession();

    expect(access.canViewAll).toBe(false);
    expect(access.isRestricted).toBe(true);
  });

  it.each(["super_admin", "admin_general"])(
    "permite ver todo para rol privilegiado %s aunque el centro gestor sea restringido",
    (role) => {
      localStorage.setItem(
        "auth_session",
        JSON.stringify({
          user: {
            nombre_centro_gestor: "Secretaría de Infraestructura",
            roles: [role],
          },
        }),
      );

      const access = getCentroGestorAccessFromSession();

      expect(access.userCentroGestor).toBe("Secretaría de Infraestructura");
      expect(access.canViewAll).toBe(true);
      expect(access.isRestricted).toBe(false);
    },
  );
});

describe("userCanEditItem (rol × centro_gestor matrix)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const upDagrd = {
    nombre_centro_gestor:
      "DAGRD - Departamento Administrativo de Gestión del Riesgo",
  };
  const upInfra = { nombre_centro_gestor: "Secretaría de Infraestructura" };

  it("super_admin con centro restringido puede editar UP de cualquier centro", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: { nombre_centro_gestor: "DAGRD", roles: ["super_admin"] },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    expect(userCanEditItem(upDagrd, access)).toBe(true);
    expect(userCanEditItem(upInfra, access)).toBe(true);
  });

  it("admin_general puede editar UPs de cualquier centro", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: { nombre_centro_gestor: "DAGRD", roles: ["admin_general"] },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    expect(userCanEditItem(upInfra, access)).toBe(true);
  });

  it("admin_centro_gestor de DAGRD sólo puede editar UPs de DAGRD", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: {
          nombre_centro_gestor:
            "DAGRD - Departamento Administrativo de Gestión del Riesgo",
          roles: ["admin_centro_gestor"],
        },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    expect(userCanEditItem(upDagrd, access)).toBe(true);
    expect(userCanEditItem(upInfra, access)).toBe(false);
  });

  it("visualizador con centro restringido no puede editar UPs de otro centro", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: {
          nombre_centro_gestor:
            "DAGRD - Departamento Administrativo de Gestión del Riesgo",
          roles: ["visualizador"],
        },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    // userCanEditItem sólo valida la dimensión centro gestor;
    // visualizador SÍ pasa el centro check pero el rol lo bloquea aparte.
    expect(userCanEditItem(upDagrd, access)).toBe(true);
    expect(userCanEditItem(upInfra, access)).toBe(false);
  });

  it("usuario sin sesión: userCanEditItem retorna true sólo si centro abierto/no sesión = canViewAll", () => {
    const access = getCentroGestorAccessFromSession();
    // Sin sesión, getCentroGestorAccessFromSession devuelve canViewAll=true
    expect(access.canViewAll).toBe(true);
    expect(userCanEditItem(upInfra, access)).toBe(true);
  });

  it("normalizeCentroGestor remueve tildes y normaliza case", () => {
    expect(normalizeCentroGestor("Secretaría de Educación")).toBe(
      "secretaria de educacion",
    );
    expect(normalizeCentroGestor("  DAGRD  ")).toBe("dagrd");
    expect(normalizeCentroGestor(null)).toBe("");
    expect(normalizeCentroGestor(undefined)).toBe("");
  });

  it("itemMatchesCentroGestor matchea con múltiples claves candidatas", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: {
          nombre_centro_gestor: "Secretaría de Infraestructura",
          roles: ["editor_datos"],
        },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    expect(
      itemMatchesCentroGestor(
        { centro_gestor: "Secretaría de Infraestructura" },
        access,
      ),
    ).toBe(true);
    expect(
      itemMatchesCentroGestor(
        { responsible: "secretaria de infraestructura" },
        access,
      ),
    ).toBe(true);
    expect(
      itemMatchesCentroGestor({ nombre_centro_gestor: "Otro" }, access),
    ).toBe(false);
  });

  it("filterByCentroGestor filtra correctamente cuando no es canViewAll", () => {
    localStorage.setItem(
      "auth_session",
      JSON.stringify({
        user: {
          nombre_centro_gestor: "DAGRD",
          roles: ["editor_datos"],
        },
      }),
    );
    const access = getCentroGestorAccessFromSession();
    const items = [
      { id: 1, nombre_centro_gestor: "DAGRD" },
      { id: 2, nombre_centro_gestor: "Secretaría de Infraestructura" },
      { id: 3, nombre_centro_gestor: "DAGRD" },
    ];
    const filtered = filterByCentroGestor(items, access);
    expect(filtered.map((x) => x.id)).toEqual([1, 3]);
  });
});
