import { describe, it, expect } from "vitest";
import {
  autoSuggestMapping,
  applyMapping,
  parseGeoJSONText,
  parseKMLText,
  extractColumns,
  extractGeometryTypes,
} from "./geoImport";

// ─── autoSuggestMapping ───────────────────────────────────────────────────────

describe("autoSuggestMapping", () => {
  it("maps known alias NOMBRE → nombre_up", () => {
    const result = autoSuggestMapping(["NOMBRE", "ESTADO"]);
    expect(result["NOMBRE"]).toBe("nombre_up");
    expect(result["ESTADO"]).toBe("estado");
  });

  it("maps exact target field name case-insensitively", () => {
    const result = autoSuggestMapping(["nombre_up", "presupuesto_base"]);
    expect(result["nombre_up"]).toBe("nombre_up");
    expect(result["presupuesto_base"]).toBe("presupuesto_base");
  });

  it("maps UPID → upid (intervencion field)", () => {
    const result = autoSuggestMapping(["UPID", "BPIN"]);
    expect(result["UPID"]).toBe("upid");
    expect(result["BPIN"]).toBe("bpin");
  });

  it("ignores columns with no matching alias", () => {
    const result = autoSuggestMapping(["XYZ_RANDOM_COL", "FOLIO_CATASTRO"]);
    expect(result["XYZ_RANDOM_COL"]).toBeUndefined();
    expect(result["FOLIO_CATASTRO"]).toBeUndefined();
  });

  it("does not map the same target field twice from different source columns", () => {
    // NOMBRE and NOM_UP both alias nombre_up — only the first found should win
    const result = autoSuggestMapping(["NOMBRE", "NOM_UP"]);
    const targets = Object.values(result);
    const count = targets.filter((t) => t === "nombre_up").length;
    expect(count).toBeLessThanOrEqual(1);
  });

  it("handles empty column list", () => {
    expect(autoSuggestMapping([])).toEqual({});
  });

  it("is case-insensitive for alias lookup", () => {
    const result = autoSuggestMapping(["nombre", "Presupuesto"]);
    expect(result["nombre"]).toBe("nombre_up");
    expect(result["Presupuesto"]).toBe("presupuesto_base");
  });
});

// ─── applyMapping ─────────────────────────────────────────────────────────────

describe("applyMapping", () => {
  it("renames source columns to target fields", () => {
    const props = { NOMBRE: "Parque ABC", ESTADO: "En ejecución" };
    const mapping = { NOMBRE: "nombre_up", ESTADO: "estado" };
    const result = applyMapping(props, mapping);
    expect(result).toEqual({ nombre_up: "Parque ABC", estado: "En ejecución" });
  });

  it("ignores columns not in the mapping", () => {
    const props = { NOMBRE: "test", EXTRA_COL: "ignored" };
    const mapping = { NOMBRE: "nombre_up" };
    const result = applyMapping(props, mapping);
    expect(result).not.toHaveProperty("EXTRA_COL");
    expect(result).not.toHaveProperty("EXTRA_COL".toLowerCase());
  });

  it("skips null values", () => {
    const props = { NOMBRE: null, ESTADO: "En ejecución" };
    const mapping = { NOMBRE: "nombre_up", ESTADO: "estado" };
    const result = applyMapping(props as Record<string, unknown>, mapping);
    expect(result).not.toHaveProperty("nombre_up");
    expect(result["estado"]).toBe("En ejecución");
  });

  it("handles empty mapping", () => {
    const props = { COL: "value" };
    expect(applyMapping(props, {})).toEqual({});
  });

  it("handles empty properties", () => {
    const mapping = { NOMBRE: "nombre_up" };
    expect(applyMapping({}, mapping)).toEqual({});
  });
});

// ─── parseGeoJSONText ─────────────────────────────────────────────────────────

describe("parseGeoJSONText", () => {
  it("parses a FeatureCollection", () => {
    const gj = JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [-76.5, 3.45] },
          properties: { NOMBRE: "UP 1" },
        },
      ],
    });
    const result = parseGeoJSONText(gj);
    expect(result).toHaveLength(1);
    expect(result[0].properties["NOMBRE"]).toBe("UP 1");
    expect(result[0].geometry?.type).toBe("Point");
  });

  it("parses a single Feature", () => {
    const gj = JSON.stringify({
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { ID: "001" },
    });
    const result = parseGeoJSONText(gj);
    expect(result).toHaveLength(1);
  });

  it("wraps a raw geometry object as a Feature", () => {
    const gj = JSON.stringify({ type: "Point", coordinates: [1, 2] });
    const result = parseGeoJSONText(gj);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("Feature");
    expect(result[0].properties).toEqual({});
  });

  it("throws on invalid JSON", () => {
    expect(() => parseGeoJSONText("not json")).toThrow();
  });
});

// ─── parseKMLText ─────────────────────────────────────────────────────────────

describe("parseKMLText", () => {
  const makeKML = (content: string) =>
    `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>${content}</Document>
    </kml>`;

  it("parses a Point placemark", () => {
    const kml = makeKML(`
      <Placemark>
        <name>Test Point</name>
        <Point><coordinates>-76.5,3.45,0</coordinates></Point>
      </Placemark>
    `);
    const result = parseKMLText(kml);
    expect(result).toHaveLength(1);
    expect(result[0].geometry?.type).toBe("Point");
    expect(result[0].properties["name"]).toBe("Test Point");
  });

  it("parses extended data attributes", () => {
    const kml = makeKML(`
      <Placemark>
        <ExtendedData>
          <SchemaData>
            <SimpleData name="NOMBRE_UP">Parque Central</SimpleData>
            <SimpleData name="ESTADO">En ejecución</SimpleData>
          </SchemaData>
        </ExtendedData>
        <Point><coordinates>0,0,0</coordinates></Point>
      </Placemark>
    `);
    const result = parseKMLText(kml);
    expect(result[0].properties["NOMBRE_UP"]).toBe("Parque Central");
    expect(result[0].properties["ESTADO"]).toBe("En ejecución");
  });

  it("returns empty array for KML with no placemarks", () => {
    const kml = makeKML(`<Folder><name>empty</name></Folder>`);
    expect(parseKMLText(kml)).toHaveLength(0);
  });

  it("handles LineString geometry", () => {
    const kml = makeKML(`
      <Placemark>
        <LineString>
          <coordinates>-76.5,3.45 -76.6,3.46</coordinates>
        </LineString>
      </Placemark>
    `);
    const result = parseKMLText(kml);
    expect(result[0].geometry?.type).toBe("LineString");
  });
});

// ─── extractColumns ───────────────────────────────────────────────────────────

describe("extractColumns", () => {
  it("collects unique column names across features", () => {
    const features = [
      { type: "Feature" as const, geometry: null, properties: { A: 1, B: 2 } },
      { type: "Feature" as const, geometry: null, properties: { B: 3, C: 4 } },
    ];
    const cols = extractColumns(features);
    expect(cols.sort()).toEqual(["A", "B", "C"]);
  });

  it("returns empty array for empty features", () => {
    expect(extractColumns([])).toEqual([]);
  });
});

// ─── extractGeometryTypes ─────────────────────────────────────────────────────

describe("extractGeometryTypes", () => {
  it("returns unique geometry types", () => {
    const features = [
      { type: "Feature" as const, geometry: { type: "Point" }, properties: {} },
      { type: "Feature" as const, geometry: { type: "Point" }, properties: {} },
      { type: "Feature" as const, geometry: { type: "LineString" }, properties: {} },
      { type: "Feature" as const, geometry: null, properties: {} },
    ];
    const types = extractGeometryTypes(features);
    expect(types.sort()).toEqual(["LineString", "Point"]);
  });
});
