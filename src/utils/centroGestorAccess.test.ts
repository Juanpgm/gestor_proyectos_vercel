import { beforeEach, describe, expect, it } from "vitest";
import {
  getCentroGestorAccessFromSession,
  itemMatchesCentroGestor,
  userCanEditItem,
  normalizeCentroGestor,
  filterByCentroGestor,
} from "./centroGestorAccess";

const setSession = (user: Record<string, unknown>) =>
  localStorage.setItem("auth_session", JSON.stringify({ user }));

describe("centroGestorAccess — consume scope del backend", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("sin sesión: no autenticado, canViewAll true (gate aparte)", () => {
    const access = getCentroGestorAccessFromSession();
    expect(access.canViewAll).toBe(true);
    expect(access.isRestricted).toBe(false);
  });

  it("can_view_all=true del backend: ve todo, sin importar el centro", () => {
    setSession({
      can_view_all: true,
      nombre_centro_gestor: "Secretaría de Infraestructura",
      roles: ["admin_general"],
    });
    const access = getCentroGestorAccessFromSession();
    expect(access.canViewAll).toBe(true);
    expect(access.isRestricted).toBe(false);
    expect(access.userCentroGestor).toBe("Secretaría de Infraestructura");
  });

  it("can_view_all=false del backend: restringido a su centro", () => {
    setSession({
      can_view_all: false,
      effective_centro_gestor: "Secretaría de Infraestructura",
      roles: ["analista"],
    });
    const access = getCentroGestorAccessFromSession();
    expect(access.canViewAll).toBe(false);
    expect(access.isRestricted).toBe(true);
    expect(access.userCentroGestor).toBe("Secretaría de Infraestructura");
  });

  it("prefiere effective_centro_gestor (canónico) sobre nombre_centro_gestor", () => {
    setSession({
      can_view_all: false,
      effective_centro_gestor: "Departamento Administrativo de Planeación Municipal",
      nombre_centro_gestor: "Departamento Administrativo de Planeación",
      roles: ["editor_datos"],
    });
    const access = getCentroGestorAccessFromSession();
    expect(access.userCentroGestor).toBe(
      "Departamento Administrativo de Planeación Municipal",
    );
  });

  it.each(["super_admin", "admin_general"])(
    "fallback legacy (sin can_view_all): rol global %s ve todo",
    (role) => {
      setSession({
        nombre_centro_gestor: "Secretaría de Infraestructura",
        roles: [role],
      });
      const access = getCentroGestorAccessFromSession();
      expect(access.canViewAll).toBe(true);
    },
  );

  it.each(["analista", "editor_datos", "gestor_contratos", "admin_centro_gestor"])(
    "fallback legacy: rol NO admin %s queda restringido (política A)",
    (role) => {
      setSession({
        nombre_centro_gestor: "Secretaría de Infraestructura",
        roles: [role],
      });
      const access = getCentroGestorAccessFromSession();
      expect(access.canViewAll).toBe(false);
      expect(access.isRestricted).toBe(true);
    },
  );

  it("centro interno Calitrack: visibilidad global aunque el rol sea restringido", () => {
    setSession({
      nombre_centro_gestor: "Calitrack",
      roles: ["editor_datos"],
    });
    const access = getCentroGestorAccessFromSession();
    expect(access.canViewAll).toBe(true);
    expect(access.isRestricted).toBe(false);
  });

  it("fallback legacy normaliza el rol (admin-general con guion)", () => {
    setSession({
      nombre_centro_gestor: "X",
      roles: ["Admin-General"],
    });
    const access = getCentroGestorAccessFromSession();
    expect(access.canViewAll).toBe(true);
  });
});

describe("filtrado por centro_gestor", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const restricted = (centro: string) => {
    setSession({ can_view_all: false, effective_centro_gestor: centro, roles: ["analista"] });
    return getCentroGestorAccessFromSession();
  };

  it("itemMatchesCentroGestor matchea con múltiples claves candidatas", () => {
    const access = restricted("Secretaría de Infraestructura");
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

  it("filterByCentroGestor filtra cuando no es canViewAll", () => {
    const access = restricted("Secretaría de Cultura");
    const items = [
      { id: 1, nombre_centro_gestor: "Secretaría de Cultura" },
      { id: 2, nombre_centro_gestor: "Secretaría de Infraestructura" },
      { id: 3, nombre_centro_gestor: "Secretaría de Cultura" },
    ];
    expect(filterByCentroGestor(items, access).map((x) => x.id)).toEqual([1, 3]);
  });

  it("filterByCentroGestor no filtra para can_view_all", () => {
    setSession({ can_view_all: true, roles: ["super_admin"] });
    const access = getCentroGestorAccessFromSession();
    const items = [
      { id: 1, nombre_centro_gestor: "A" },
      { id: 2, nombre_centro_gestor: "B" },
    ];
    expect(filterByCentroGestor(items, access)).toHaveLength(2);
  });

  it("userCanEditItem: admin (canViewAll) edita cualquier centro", () => {
    setSession({ can_view_all: true, roles: ["admin_general"] });
    const access = getCentroGestorAccessFromSession();
    expect(userCanEditItem({ nombre_centro_gestor: "X" }, access)).toBe(true);
  });

  it("userCanEditItem: restringido sólo su centro", () => {
    const access = restricted("Secretaría de Educación");
    expect(
      userCanEditItem({ nombre_centro_gestor: "Secretaría de Educación" }, access),
    ).toBe(true);
    expect(
      userCanEditItem({ nombre_centro_gestor: "Secretaría de Salud Pública" }, access),
    ).toBe(false);
  });

  it("normalizeCentroGestor remueve tildes y normaliza case", () => {
    expect(normalizeCentroGestor("Secretaría de Educación")).toBe(
      "secretaria de educacion",
    );
    expect(normalizeCentroGestor("  DAGRD  ")).toBe("dagrd");
    expect(normalizeCentroGestor(null)).toBe("");
    expect(normalizeCentroGestor(undefined)).toBe("");
  });
});
