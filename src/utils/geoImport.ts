/**
 * Utilities for client-side geospatial file parsing and column mapping.
 * These run entirely in the browser — no Firestore writes here.
 */

export interface GeoJSONGeometry {
  type: string;
  coordinates?: unknown;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown>;
}

export interface ParseResult {
  features: GeoJSONFeature[];
  columns: string[];
  geometryTypes: string[];
  fileType: string;
}

// ── Known column aliases → target field ──────────────────────────────────────

// Nota: los shapefiles truncan los nombres de columna a 10 caracteres (límite DBF),
// por eso se incluyen las formas truncadas (p.ej. "PRESUPUEST", "AVANCE_OBR").
// Mantener en sync con _UP_FIELD_ALIASES del backend (unidades_proyecto.py).
export const UP_FIELD_ALIASES: Record<string, string[]> = {
  nombre_up: ["NOMBRE", "NOM", "NAME", "NOMBRE_UP", "NOM_UP", "PROYECTO"],
  nombre_up_detalle: ["DETALLE", "DESCRIPCION", "DESCRIPCIÓN", "DESC", "NOM_DET", "NOMBRE_UP_"],
  tipo_equipamiento: ["TIPO_EQ", "EQUIPAMIENTO", "TIPO_EQUIPAMIENTO", "TIPO_EQUIP"],
  clase_up: ["CLASE", "CLASE_UP", "CLASE_OBRA"],
  tipo_intervencion: ["TIPO_INT", "TIPO_INTERV", "TIPO_INTERVENCION", "T_INTERV", "TIPO_INTER"],
  estado: ["ESTADO", "STATUS", "ESTADO_UP"],
  presupuesto_base: ["PRESUPUESTO", "PRESUP", "VALOR", "COSTO", "PRESUPUESTO_BASE", "PRESUPUEST"],
  avance_obra: ["AVANCE", "AVANCE_OBRA", "PROGRESO", "PORCENTAJE", "AVANCE_OBR"],
  fuente_financiacion: ["FUENTE", "FUENTE_FIN", "FINANCIACION", "FUENTE_FINANCIACION"],
  nombre_centro_gestor: ["CENTRO", "CENTRO_GESTOR", "SECRETARIA", "SECRETARÍA", "CG", "NOMBRE_CEN"],
  direccion: ["DIRECCION", "DIRECCIÓN", "ADDRESS", "DIR"],
  bpin: ["BPIN", "B_PIN"],
  identificador: ["IDENTIFICADOR", "IDENTIFICA", "COD", "CODIGO", "CÓDIGO", "IDENT", "ID"],
  ano: ["AÑO", "ANO", "YEAR", "VIGENCIA", "ANIO"],
  fecha_inicio: ["FECHA_INI", "FECHA_INICIO", "F_INICIO", "INICIO", "FECHA_INIC"],
  fecha_fin: ["FECHA_FIN", "F_FIN", "FIN", "FECHA_CIERRE"],
  referencia_contrato: ["CONTRATO", "REF_CONTRATO", "REFERENCIA_CONTRATO"],
  referencia_proceso: ["PROCESO", "REF_PROCESO", "REFERENCIA_PROCESO"],
  url_proceso: ["URL", "URL_PROCESO", "LINK", "ENLACE", "SECOP", "URL_PROCES"],
  descripcion_intervencion: ["DESCRIPCION_INT", "DESC_INT", "DESCRIPCIO", "DESCRIPCION"],
  cantidad: ["CANTIDAD", "CANT", "QUANTITY"],
  unidad: ["UNIDAD", "UNIT", "UM"],
};

export const INTERVENCION_EXTRA_ALIASES: Record<string, string[]> = {
  upid: ["UPID", "UP_ID", "ID_UP", "UNIDAD_ID", "COD_UP"],
};

/**
 * Auto-suggest column_mapping from a list of source column names.
 * Returns: { sourceCol -> targetField }
 */
export function autoSuggestMapping(columns: string[]): Record<string, string> {
  const allAliases = { ...UP_FIELD_ALIASES, ...INTERVENCION_EXTRA_ALIASES };
  const mapping: Record<string, string> = {};
  const upperToOriginal = Object.fromEntries(columns.map((c) => [c.toUpperCase(), c]));

  for (const [targetField, aliases] of Object.entries(allAliases)) {
    // Try alias list first
    for (const alias of aliases) {
      if (alias.toUpperCase() in upperToOriginal) {
        const original = upperToOriginal[alias.toUpperCase()];
        if (!(original in mapping)) mapping[original] = targetField;
        break;
      }
    }
    // Also try exact match with target field name
    if (targetField.toUpperCase() in upperToOriginal) {
      const original = upperToOriginal[targetField.toUpperCase()];
      if (!(original in mapping)) mapping[original] = targetField;
    }
  }
  return mapping;
}

/**
 * Apply column_mapping to a feature's properties dict.
 */
export function applyMapping(
  properties: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [srcCol, targetField] of Object.entries(mapping)) {
    if (srcCol in properties && properties[srcCol] !== null) {
      result[targetField] = properties[srcCol];
    }
  }
  return result;
}

// ── Parsers ───────────────────────────────────────────────────────────────────

export function parseGeoJSONText(text: string): GeoJSONFeature[] {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (parsed.type === "FeatureCollection") {
    return (parsed.features as GeoJSONFeature[]) ?? [];
  }
  if (parsed.type === "Feature") return [parsed as unknown as GeoJSONFeature];
  // Raw geometry
  return [{ type: "Feature", geometry: parsed as unknown as GeoJSONGeometry, properties: {} }];
}

export function parseKMLText(text: string): GeoJSONFeature[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "application/xml");
  const placemarks = Array.from(doc.querySelectorAll("Placemark"));

  return placemarks.map((pm): GeoJSONFeature => {
    const props: Record<string, unknown> = {};
    pm.querySelectorAll("SimpleData, Data").forEach((el) => {
      const name = el.getAttribute("name") || el.tagName;
      props[name] = el.textContent?.trim() ?? null;
    });
    const nameEl = pm.querySelector("name");
    if (nameEl?.textContent) props["name"] = nameEl.textContent.trim();
    const descEl = pm.querySelector("description");
    if (descEl?.textContent) props["description"] = descEl.textContent.trim();

    let geometry: GeoJSONGeometry | null = null;

    const point = pm.querySelector("Point > coordinates");
    if (point?.textContent) {
      const parts = point.textContent.trim().split(",");
      geometry = { type: "Point", coordinates: [parseFloat(parts[0]), parseFloat(parts[1])] };
    }

    const lineString = pm.querySelector("LineString > coordinates");
    if (!geometry && lineString?.textContent) {
      const coords = lineString.textContent
        .trim()
        .split(/\s+/)
        .map((c) => {
          const p = c.split(",");
          return [parseFloat(p[0]), parseFloat(p[1])];
        });
      geometry = { type: "LineString", coordinates: coords };
    }

    const polygonCoords = pm.querySelector(
      "Polygon outerBoundaryIs LinearRing coordinates"
    );
    if (!geometry && polygonCoords?.textContent) {
      const coords = polygonCoords.textContent
        .trim()
        .split(/\s+/)
        .map((c) => {
          const p = c.split(",");
          return [parseFloat(p[0]), parseFloat(p[1])];
        });
      geometry = { type: "Polygon", coordinates: [coords] };
    }

    return { type: "Feature", geometry, properties: props };
  });
}

export async function parseKMZBuffer(buffer: ArrayBuffer): Promise<GeoJSONFeature[]> {
  const { unzipSync, strFromU8 } = await import("fflate");
  const unzipped = unzipSync(new Uint8Array(buffer));
  const kmlEntry = Object.entries(unzipped).find(([name]) =>
    name.toLowerCase().endsWith(".kml")
  );
  if (!kmlEntry) throw new Error("No se encontró archivo .kml dentro del KMZ");
  const kmlText = strFromU8(kmlEntry[1]);
  return parseKMLText(kmlText);
}

export async function parseShapefileZipBuffer(buffer: ArrayBuffer): Promise<GeoJSONFeature[]> {
  const { unzipSync } = await import("fflate");
  const unzipped = unzipSync(new Uint8Array(buffer));

  const shpEntry = Object.entries(unzipped).find(([n]) => n.toLowerCase().endsWith(".shp"));
  const dbfEntry = Object.entries(unzipped).find(([n]) => n.toLowerCase().endsWith(".dbf"));

  if (!shpEntry) throw new Error("No se encontró .shp dentro del ZIP");

  const shapefile = await import("shapefile");
  const shpBuf = shpEntry[1].buffer as ArrayBuffer;
  const dbfBuf = dbfEntry ? (dbfEntry[1].buffer as ArrayBuffer) : undefined;

  const source = await shapefile.open(shpBuf, dbfBuf);
  const features: GeoJSONFeature[] = [];
  let result = await source.read();
  while (!result.done) {
    if (result.value) features.push(result.value as unknown as GeoJSONFeature);
    result = await source.read();
  }
  return features;
}

/**
 * Collect unique column names from all features.
 */
export function extractColumns(features: GeoJSONFeature[]): string[] {
  const colSet = new Set<string>();
  features.forEach((f) => Object.keys(f.properties ?? {}).forEach((k) => colSet.add(k)));
  return Array.from(colSet);
}

/**
 * Collect unique geometry types from all features.
 */
export function extractGeometryTypes(features: GeoJSONFeature[]): string[] {
  return Array.from(
    new Set(features.map((f) => f.geometry?.type).filter(Boolean) as string[])
  );
}

export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  let features: GeoJSONFeature[] = [];
  let fileType = "";

  if (name.endsWith(".geojson") || name.endsWith(".json")) {
    const text = await file.text();
    features = parseGeoJSONText(text);
    fileType = "GeoJSON";
  } else if (name.endsWith(".kml")) {
    const text = await file.text();
    features = parseKMLText(text);
    fileType = "KML";
  } else if (name.endsWith(".kmz")) {
    const buf = await file.arrayBuffer();
    features = await parseKMZBuffer(buf);
    fileType = "KMZ";
  } else if (name.endsWith(".zip")) {
    const buf = await file.arrayBuffer();
    features = await parseShapefileZipBuffer(buf);
    fileType = "Shapefile";
  } else {
    throw new Error(
      "Formato no soportado. Use .geojson, .json, .kml, .kmz o .zip (shapefile)"
    );
  }

  if (features.length === 0) throw new Error("El archivo no contiene features");

  return {
    features,
    columns: extractColumns(features),
    geometryTypes: extractGeometryTypes(features),
    fileType,
  };
}
