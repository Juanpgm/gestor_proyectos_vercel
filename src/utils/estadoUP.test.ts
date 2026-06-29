import { describe, expect, it } from "vitest";
import {
  deriveEstadoUP,
  getEstadoUPColor,
  withDerivedEstado,
} from "./estadoUP";

describe("deriveEstadoUP", () => {
  describe("derives estado from avance_obra", () => {
    it("returns 'En alistamiento' for avance 0", () => {
      expect(deriveEstadoUP(0)).toBe("En alistamiento");
    });

    it("returns 'En alistamiento' for null/undefined avance", () => {
      expect(deriveEstadoUP(null)).toBe("En alistamiento");
      expect(deriveEstadoUP(undefined)).toBe("En alistamiento");
    });

    it("returns 'En alistamiento' for non-numeric avance", () => {
      expect(deriveEstadoUP(NaN)).toBe("En alistamiento");
      expect(deriveEstadoUP("abc" as unknown as number)).toBe("En alistamiento");
    });

    it("returns 'En alistamiento' for avance below 0.5", () => {
      expect(deriveEstadoUP(0.3)).toBe("En alistamiento");
    });

    it("returns 'En ejecución' for avance in [0.5, 99.5)", () => {
      expect(deriveEstadoUP(0.5)).toBe("En ejecución");
      expect(deriveEstadoUP(50)).toBe("En ejecución");
      expect(deriveEstadoUP(99.4)).toBe("En ejecución");
    });

    it("returns 'Terminado' for avance >= 99.5", () => {
      expect(deriveEstadoUP(99.5)).toBe("Terminado");
      expect(deriveEstadoUP(100)).toBe("Terminado");
    });

    it("parses numeric strings for avance", () => {
      expect(deriveEstadoUP("100" as unknown as number)).toBe("Terminado");
      expect(deriveEstadoUP("50" as unknown as number)).toBe("En ejecución");
    });
  });

  describe("respects only explicit manual estados (whitelist)", () => {
    it("respects 'Suspendido' regardless of avance", () => {
      expect(deriveEstadoUP(100, "Suspendido")).toBe("Suspendido");
      expect(deriveEstadoUP(0, "Suspendido")).toBe("Suspendido");
    });

    it("respects 'Inaugurado' regardless of avance", () => {
      expect(deriveEstadoUP(0, "Inaugurado")).toBe("Inaugurado");
    });

    it("matches manual estados case- and accent-insensitively", () => {
      expect(deriveEstadoUP(0, "suspendido")).toBe("suspendido");
      expect(deriveEstadoUP(0, "  INAUGURADO  ")).toBe("INAUGURADO");
    });
  });

  describe("withDerivedEstado", () => {
    it("overwrites estado with the value derived from avance_obra", () => {
      const record = { upid: "1", avance_obra: 100, estado: "En ejecución" };
      expect(withDerivedEstado(record)).toEqual({
        upid: "1",
        avance_obra: 100,
        estado: "Terminado",
      });
    });

    it("respects whitelist estados regardless of avance_obra", () => {
      const record = { avance_obra: 100, estado: "Suspendido" };
      expect(withDerivedEstado(record).estado).toBe("Suspendido");
    });

    it("re-derives non-canonical stored estados", () => {
      expect(withDerivedEstado({ avance_obra: 0, estado: "Liquidado" }).estado).toBe(
        "En alistamiento",
      );
    });

    it("derives 'En alistamiento' when avance_obra is missing", () => {
      const record = { upid: "2", avance_obra: undefined };
      expect(withDerivedEstado(record).estado).toBe("En alistamiento");
    });

    it("does not mutate the original record", () => {
      const record = { avance_obra: 100, estado: "En ejecución" };
      withDerivedEstado(record);
      expect(record.estado).toBe("En ejecución");
    });
  });

  describe("getEstadoUPColor", () => {
    it("maps each canonical estado to its color", () => {
      expect(getEstadoUPColor("En alistamiento")).toBe("#F59E0B");
      expect(getEstadoUPColor("En ejecución")).toBe("#3B82F6");
      expect(getEstadoUPColor("Terminado")).toBe("#10B981");
      expect(getEstadoUPColor("Suspendido")).toBe("#EF4444");
      expect(getEstadoUPColor("Inaugurado")).toBe("#8B5CF6");
    });

    it("maps aggregate/empty labels to gray", () => {
      expect(getEstadoUPColor("Varios estados")).toBe("#6B7280");
      expect(getEstadoUPColor("Sin estado")).toBe("#6B7280");
      expect(getEstadoUPColor("")).toBe("#6B7280");
    });

    it("is case- and accent-insensitive", () => {
      expect(getEstadoUPColor("  EN EJECUCION ")).toBe("#3B82F6");
      expect(getEstadoUPColor("terminado")).toBe("#10B981");
    });

    it("falls back to gray for unknown estados", () => {
      expect(getEstadoUPColor("Cualquier cosa")).toBe("#6B7280");
    });
  });

  describe("regression: imported non-canonical estados must NOT override derivation", () => {
    it("re-derives when stored estado is 'Finalizado' and avance is 0", () => {
      expect(deriveEstadoUP(0, "Finalizado")).toBe("En alistamiento");
    });

    it("re-derives for 'Sin iniciar' / 'En proceso'", () => {
      expect(deriveEstadoUP(0, "Sin iniciar")).toBe("En alistamiento");
      expect(deriveEstadoUP(60, "En proceso")).toBe("En ejecución");
    });

    it("re-derives when stored canonical estado disagrees with avance", () => {
      // estado guardado dice "En ejecución" pero avance es 100 → Terminado
      expect(deriveEstadoUP(100, "En ejecución")).toBe("Terminado");
    });
  });
});
