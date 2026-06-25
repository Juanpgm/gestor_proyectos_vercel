import { describe, expect, it } from "vitest";
import {
  hasRole,
  hasAnyRole,
  hasPermission,
  normalizeRole,
  rolesCanViewAll,
  getHighestRole,
} from "./rbac";

describe("rbac.normalizeRole", () => {
  it("normaliza separadores y case", () => {
    expect(normalizeRole("Admin-General")).toBe("admin_general");
    expect(normalizeRole("  super admin ")).toBe("super_admin");
    expect(normalizeRole(null)).toBe("");
  });
});

describe("rbac.hasRole", () => {
  it("match normalizado", () => {
    expect(hasRole(["Admin-General"], "admin_general")).toBe(true);
    expect(hasRole(["analista"], "super_admin")).toBe(false);
    expect(hasRole("super_admin", "super_admin")).toBe(true);
  });

  it("hasAnyRole", () => {
    expect(hasAnyRole(["editor_datos"], ["super_admin", "editor_datos"])).toBe(
      true,
    );
    expect(hasAnyRole(["publico"], ["super_admin", "admin_general"])).toBe(false);
  });
});

describe("rbac.rolesCanViewAll (política A)", () => {
  it("solo super_admin/admin_general", () => {
    expect(rolesCanViewAll(["super_admin"])).toBe(true);
    expect(rolesCanViewAll(["admin_general"])).toBe(true);
    expect(rolesCanViewAll(["admin_centro_gestor"])).toBe(false);
    expect(rolesCanViewAll(["analista", "editor_datos"])).toBe(false);
  });
});

describe("rbac.hasPermission", () => {
  it("wildcard total y de acción", () => {
    expect(hasPermission(["*"], "manage:users")).toBe(true);
    expect(hasPermission(["read:*"], "read:contratos")).toBe(true);
  });

  it("exacto y scopeado", () => {
    expect(hasPermission(["write:unidades"], "write:unidades")).toBe(true);
    expect(hasPermission(["read:contratos:own_centro"], "read:contratos")).toBe(
      true,
    );
    expect(hasPermission(["read:contratos"], "write:contratos")).toBe(false);
  });
});

describe("rbac.getHighestRole", () => {
  it("devuelve el de mayor jerarquía (real)", () => {
    expect(getHighestRole(["analista", "super_admin"])).toBe("super_admin");
    expect(getHighestRole(["visualizador", "editor_datos"])).toBe(
      "editor_datos",
    );
    expect(getHighestRole([])).toBe(null);
  });
});
