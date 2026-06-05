/**
 * KML / KMZ export utilities for Unidades de Proyecto.
 *
 * KML 2.2 — compatible with Google My Maps, Google Earth, ArcGIS Online,
 * ArcGIS Desktop (≥ 10.x), QGIS (≥ 3.x), and most OGC-compliant viewers.
 *
 * KMZ is a standard ZIP archive containing doc.kml at its root (RFC 2396 §4.1).
 * Generated with fflate (already a dependency via jspdf).
 */

import type {
  AttributeData,
  GeometryData,
} from "@/services/unidades-proyecto.service";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Escape XML 1.0 special characters. */
function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Convert an HTML hex colour (#RRGGBB) to KML AABBGGRR notation.
 * KML colour channel order is reversed relative to HTML.
 */
function hexToKmlColor(hex: string, alpha = 178): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `${h(alpha)}${h(b)}${h(g)}${h(r)}`;
}

/** Pick a colour for a given estado value (mirrors the map colour scheme). */
function getEstadoColor(estado: string): string {
  const lower = (estado ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("ejecuci") || lower === "activo") return "#10B981";
  if (lower.includes("termin")) return "#3B82F6";
  if (lower.includes("paus") || lower.includes("suspend")) return "#F59E0B";
  if (lower.includes("cancel")) return "#EF4444";
  return "#8B5CF6";
}

/** Convert a GeoJSON ring (array of positions) to a KML coordinate string. */
function ringToKml(ring: number[][]): string {
  return ring.map((c) => `${c[0]},${c[1]},0`).join(" ");
}

/** Convert a GeoJSON geometry object to its KML XML representation. */
function geometryToKml(geometry: {
  type: string;
  coordinates: unknown;
}): string {
  if (!geometry?.type) return "";
  const c = geometry.coordinates;

  switch (geometry.type) {
    case "Point": {
      const [lon, lat] = c as number[];
      return [
        `<Point>`,
        `  <altitudeMode>clampToGround</altitudeMode>`,
        `  <coordinates>${lon},${lat},0</coordinates>`,
        `</Point>`,
      ].join("\n      ");
    }

    case "LineString": {
      return [
        `<LineString>`,
        `  <altitudeMode>clampToGround</altitudeMode>`,
        `  <coordinates>${ringToKml(c as number[][])}</coordinates>`,
        `</LineString>`,
      ].join("\n      ");
    }

    case "Polygon": {
      const rings = c as number[][][];
      const outer = `<outerBoundaryIs><LinearRing><altitudeMode>clampToGround</altitudeMode><coordinates>${ringToKml(rings[0])}</coordinates></LinearRing></outerBoundaryIs>`;
      const holes = rings
        .slice(1)
        .map(
          (r) =>
            `<innerBoundaryIs><LinearRing><altitudeMode>clampToGround</altitudeMode><coordinates>${ringToKml(r)}</coordinates></LinearRing></innerBoundaryIs>`,
        )
        .join("");
      return `<Polygon>${outer}${holes}</Polygon>`;
    }

    case "MultiPoint": {
      const pts = (c as number[][])
        .map(
          ([lon, lat]) =>
            `<Point><altitudeMode>clampToGround</altitudeMode><coordinates>${lon},${lat},0</coordinates></Point>`,
        )
        .join("");
      return `<MultiGeometry>${pts}</MultiGeometry>`;
    }

    case "MultiLineString": {
      const lines = (c as number[][][])
        .map(
          (l) =>
            `<LineString><altitudeMode>clampToGround</altitudeMode><coordinates>${ringToKml(l)}</coordinates></LineString>`,
        )
        .join("");
      return `<MultiGeometry>${lines}</MultiGeometry>`;
    }

    case "MultiPolygon": {
      const polys = (c as number[][][][])
        .map((poly) => {
          const outer = `<outerBoundaryIs><LinearRing><altitudeMode>clampToGround</altitudeMode><coordinates>${ringToKml(poly[0])}</coordinates></LinearRing></outerBoundaryIs>`;
          const holes = poly
            .slice(1)
            .map(
              (r) =>
                `<innerBoundaryIs><LinearRing><altitudeMode>clampToGround</altitudeMode><coordinates>${ringToKml(r)}</coordinates></LinearRing></innerBoundaryIs>`,
            )
            .join("");
          return `<Polygon>${outer}${holes}</Polygon>`;
        })
        .join("");
      return `<MultiGeometry>${polys}</MultiGeometry>`;
    }

    default:
      return "";
  }
}

/** Build a CDATA HTML description table for the KML balloon popup. */
function buildDescription(item: AttributeData): string {
  const fmt = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toLocaleString("es-CO")}` : "";

  const rows: [string, string][] = [
    ["Estado", item.estado],
    ["Tipo Intervención", item.tipo_intervencion],
    ["Tipo Equipamiento", item.tipo_equipamiento ?? ""],
    ["Clase UP", item.clase_up ?? ""],
    ["Frente Activo", item.frente_activo ?? ""],
    ["Centro Gestor", item.nombre_centro_gestor ?? ""],
    ["Comuna / Corregimiento", item.comuna_corregimiento],
    ["Barrio / Vereda", item.barrio_vereda],
    ["Dirección", item.direccion ?? ""],
    ["Avance Obra (%)", item.avance_obra != null ? `${item.avance_obra}%` : ""],
    ["Presupuesto Base", fmt(item.presupuesto_base)],
    ["Fecha Inicio", item.fecha_inicio],
    ["Fecha Fin", item.fecha_fin],
    ["Fecha Inauguración", item.fecha_inauguracion ?? ""],
    ["Duración", item.duracion_proyecto ?? ""],
    ["Fuente Financiación", item.fuente_financiacion],
    [
      "Proyectos Estratégicos",
      Array.isArray(item.proyectos_estrategicos)
        ? item.proyectos_estrategicos.join(", ")
        : "",
    ],
    ["Referencia Contrato", item.referencia_contrato ?? ""],
    ["Referencia Proceso", item.referencia_proceso ?? ""],
    ["Descripción", item.descripcion_intervencion],
  ];

  const tableRows = rows
    .filter(([, v]) => v)
    .map(
      ([label, val]) =>
        `<tr><td style="font-weight:bold;padding:3px 8px;background:#f3f4f6;white-space:nowrap">${label}</td><td style="padding:3px 8px">${escapeXml(val)}</td></tr>`,
    )
    .join("");

  return `<![CDATA[<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;width:100%">${tableRows}</table>]]>`;
}

/** Generate KML `<Style>` blocks for each unique estado value. */
function buildStyles(estadoSet: Set<string>): string {
  return Array.from(estadoSet)
    .map((estado) => {
      const hex = getEstadoColor(estado);
      const fill = hexToKmlColor(hex, 178); // 70% opacity fill
      const line = hexToKmlColor(hex, 255); // fully opaque outline / icon
      const id = `style-${estado.replace(/[^a-zA-Z0-9]/g, "_")}`;
      return `  <Style id="${id}">
    <IconStyle>
      <color>${line}</color>
      <scale>0.8</scale>
    </IconStyle>
    <LineStyle>
      <color>${line}</color>
      <width>2</width>
    </LineStyle>
    <PolyStyle>
      <color>${fill}</color>
      <fill>1</fill>
      <outline>1</outline>
    </PolyStyle>
    <BalloonStyle>
      <text>$[description]</text>
    </BalloonStyle>
  </Style>`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a KML 2.2 document string from the currently filtered data.
 *
 * Only features present in `filteredGeometry` are exported (attribute-only
 * rows without spatial data are skipped). Both KML and KMZ call this first.
 */
export function generateKml(
  filteredData: AttributeData[],
  filteredGeometry: GeometryData | null,
): string {
  // Index attribute rows by lowercase upid for O(1) lookup
  const attrMap = new Map<string, AttributeData>();
  filteredData.forEach((item) => {
    const key = String(item.upid ?? "")
      .trim()
      .toLowerCase();
    if (key) attrMap.set(key, item);
  });

  const features = (filteredGeometry?.features ?? []).filter((f) => f.geometry);

  // Collect distinct estados to generate colour styles
  const estadoSet = new Set<string>();
  features.forEach((f) => {
    const upid = String(f.properties?.upid ?? "")
      .trim()
      .toLowerCase();
    const attr = attrMap.get(upid);
    if (attr?.estado) estadoSet.add(attr.estado);
  });

  const dateTag = new Date().toISOString().slice(0, 10);

  const placemarks = features
    .map((feature) => {
      const upid = String(feature.properties?.upid ?? "")
        .trim()
        .toLowerCase();
      const attr = attrMap.get(upid);

      const geomKml = geometryToKml(
        feature.geometry as { type: string; coordinates: unknown },
      );
      if (!geomKml) return "";

      const name = attr
        ? escapeXml(attr.nombre_up ?? attr.upid)
        : escapeXml(String(feature.properties?.upid ?? upid));

      const estado = attr?.estado ?? "";
      const styleRef = estado
        ? `<styleUrl>#style-${estado.replace(/[^a-zA-Z0-9]/g, "_")}</styleUrl>`
        : "";

      const description = attr ? buildDescription(attr) : "";

      // <ExtendedData> provides a proper attribute table in GIS tools
      const extData = attr
        ? `<ExtendedData>
      <Data name="upid"><value>${escapeXml(attr.upid)}</value></Data>
      <Data name="nombre_up"><value>${escapeXml(attr.nombre_up)}</value></Data>
      <Data name="nombre_up_detalle"><value>${escapeXml(attr.nombre_up_detalle ?? "")}</value></Data>
      <Data name="identificador"><value>${escapeXml(attr.identificador ?? "")}</value></Data>
      <Data name="estado"><value>${escapeXml(attr.estado)}</value></Data>
      <Data name="tipo_intervencion"><value>${escapeXml(attr.tipo_intervencion)}</value></Data>
      <Data name="tipo_equipamiento"><value>${escapeXml(attr.tipo_equipamiento ?? "")}</value></Data>
      <Data name="clase_up"><value>${escapeXml(attr.clase_up ?? "")}</value></Data>
      <Data name="frente_activo"><value>${escapeXml(attr.frente_activo ?? "")}</value></Data>
      <Data name="centro_gestor"><value>${escapeXml(attr.nombre_centro_gestor ?? "")}</value></Data>
      <Data name="comuna_corregimiento"><value>${escapeXml(attr.comuna_corregimiento)}</value></Data>
      <Data name="barrio_vereda"><value>${escapeXml(attr.barrio_vereda)}</value></Data>
      <Data name="direccion"><value>${escapeXml(attr.direccion ?? "")}</value></Data>
      <Data name="avance_obra"><value>${attr.avance_obra ?? ""}</value></Data>
      <Data name="presupuesto_base"><value>${attr.presupuesto_base ?? ""}</value></Data>
      <Data name="unidad"><value>${escapeXml(attr.unidad ?? "")}</value></Data>
      <Data name="cantidad"><value>${escapeXml(String(attr.cantidad ?? ""))}</value></Data>
      <Data name="fecha_inicio"><value>${escapeXml(attr.fecha_inicio)}</value></Data>
      <Data name="fecha_fin"><value>${escapeXml(attr.fecha_fin)}</value></Data>
      <Data name="fecha_inauguracion"><value>${escapeXml(attr.fecha_inauguracion ?? "")}</value></Data>
      <Data name="duracion_proyecto"><value>${escapeXml(attr.duracion_proyecto ?? "")}</value></Data>
      <Data name="fuente_financiacion"><value>${escapeXml(attr.fuente_financiacion)}</value></Data>
      <Data name="referencia_contrato"><value>${escapeXml(attr.referencia_contrato ?? "")}</value></Data>
      <Data name="referencia_proceso"><value>${escapeXml(attr.referencia_proceso ?? "")}</value></Data>
      <Data name="url_proceso"><value>${escapeXml(attr.url_proceso ?? "")}</value></Data>
      <Data name="ano"><value>${attr.ano ?? ""}</value></Data>
      <Data name="proyectos_estrategicos"><value>${escapeXml(Array.isArray(attr.proyectos_estrategicos) ? attr.proyectos_estrategicos.join(", ") : "")}</value></Data>
      <Data name="descripcion_intervencion"><value>${escapeXml(attr.descripcion_intervencion)}</value></Data>
    </ExtendedData>`
        : "";

      return `
  <Placemark>
    <name>${name}</name>
    <description>${description}</description>
    ${styleRef}
    ${extData}
    ${geomKml}
  </Placemark>`;
    })
    .filter(Boolean)
    .join("\n");

  const styles = buildStyles(estadoSet);

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:gx="http://www.google.com/kml/ext/2.2"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.opengis.net/kml/2.2 http://schemas.opengis.net/kml/2.2.0/ogckml22.xsd">
  <Document>
    <name>Unidades de Proyecto — ${dateTag}</name>
    <description>Exportado desde CaliTrack · ${features.length} unidades</description>
${styles}
${placemarks}
  </Document>
</kml>`;
}

/**
 * Wrap a KML string in a KMZ (ZIP) container.
 *
 * Uses fflate (already bundled via jspdf) with DEFLATE level 6.
 * The resulting Uint8Array can be passed directly to a Blob.
 */
export async function generateKmz(kmlString: string): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import("fflate");
  const kmlBytes = strToU8(kmlString);
  return zipSync({ "doc.kml": kmlBytes }, { level: 6 });
}
