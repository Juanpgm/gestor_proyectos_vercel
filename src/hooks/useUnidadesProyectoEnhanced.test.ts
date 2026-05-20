/**
 * Tests para useUnidadesProyectoEnhanced
 *  - propagación de errores (estado.error cuando ambos endpoints fallan)
 *  - normalización de UPIDs (string + case-insensitive)
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useUnidadesProyecto } from "./useUnidadesProyectoEnhanced";

vi.mock("@/services/unidades-proyecto.service", async () => {
  const actual = await vi.importActual<any>(
    "@/services/unidades-proyecto.service",
  );
  return {
    ...actual,
    fetchGeometryData: vi.fn(),
    fetchAttributeData: vi.fn(),
  };
});

import {
  fetchGeometryData,
  fetchAttributeData,
} from "@/services/unidades-proyecto.service";

const mockedFetchGeometry = fetchGeometryData as unknown as ReturnType<
  typeof vi.fn
>;
const mockedFetchAttributes = fetchAttributeData as unknown as ReturnType<
  typeof vi.fn
>;

describe("useUnidadesProyectoEnhanced", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propaga error al estado cuando AMBOS endpoints fallan", async () => {
    mockedFetchGeometry.mockRejectedValueOnce(new Error("boom-geom"));
    mockedFetchAttributes.mockRejectedValueOnce(new Error("boom-attrs"));

    const { result } = renderHook(() =>
      useUnidadesProyecto({ autoRefresh: false }),
    );

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(result.current.state.error).toBeTruthy();
    expect(result.current.state.error).toContain("Geometría");
    expect(result.current.state.error).toContain("Atributos");
  });

  it("NO marca error si sólo falla geometría pero atributos llegan", async () => {
    mockedFetchGeometry.mockRejectedValueOnce(new Error("boom-geom"));
    mockedFetchAttributes.mockResolvedValueOnce([
      { upid: "UP-001", nombre_up: "Test", nombre_centro_gestor: "DAGRD" },
    ]);

    const { result } = renderHook(() =>
      useUnidadesProyecto({ autoRefresh: false }),
    );

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    expect(result.current.state.error).toBeNull();
    expect(result.current.state.attributeData.length).toBe(1);
  });

  it("matchea UPIDs entre geometría y atributos de forma case-insensitive", async () => {
    mockedFetchGeometry.mockResolvedValueOnce({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { upid: "UP-001" },
          geometry: { type: "Point", coordinates: [0, 0] },
        },
        {
          type: "Feature",
          properties: { upid: "  up-002  " },
          geometry: { type: "Point", coordinates: [1, 1] },
        },
      ],
    });
    mockedFetchAttributes.mockResolvedValueOnce([
      { upid: "up-001", nombre_up: "A" },
      { upid: "UP-002", nombre_up: "B" },
    ]);

    const { result } = renderHook(() =>
      useUnidadesProyecto({ autoRefresh: false }),
    );

    await waitFor(() => {
      expect(result.current.state.loading).toBe(false);
    });

    // filteredGeometry debe incluir ambas features tras normalización
    expect(result.current.filteredGeometry?.features.length).toBe(2);
  });
});
