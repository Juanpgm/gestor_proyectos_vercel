/*
  Diagnostico integral de fuentes para dropdowns de "Filtros".
  - Consulta datos reales de /intervenciones y /unidades-proyecto
  - Calcula catalogos como lo hace frontend
  - Reporta longitudes esperadas para globals
*/

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://gestorproyectoapi-production.up.railway.app";

const normalizeOptions = (values) => {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(values.map((v) => String(v || "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "es"));
};

const pickFirstNonEmpty = (...sources) => {
  for (const source of sources) {
    const normalized = normalizeOptions(source);
    if (normalized.length > 0) return normalized;
  }
  return [];
};

const extractFromRecords = (records, keys) => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const values = records
    .map((record) => {
      const props =
        record && typeof record.properties === "object"
          ? record.properties
          : undefined;
      for (const key of keys) {
        const value = String(
          (record && record[key]) ?? (props && props[key]) ?? "",
        ).trim();
        if (value) return value;
      }
      return "";
    })
    .filter(Boolean);

  return normalizeOptions(values);
};

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
  return res.json();
}

async function run() {
  console.log("=== DIAGNOSTICO GLOBALS FILTROS ===");
  console.log("API_BASE:", API_BASE);

  const [intervencionesPayload, unidadesPayload] = await Promise.all([
    fetchJson(`${API_BASE}/intervenciones?limit=10000`),
    fetchJson(`${API_BASE}/unidades-proyecto?limit=10000`),
  ]);

  const intervenciones = Array.isArray(intervencionesPayload?.data)
    ? intervencionesPayload.data
    : [];
  const unidades = Array.isArray(unidadesPayload?.data)
    ? unidadesPayload.data
    : [];

  console.log("Intervenciones:", intervenciones.length);
  console.log("Unidades:", unidades.length);

  const fromIntervenciones = {
    centros_gestores: extractFromRecords(intervenciones, [
      "nombre_centro_gestor",
      "centro_gestor",
    ]),
    estados: extractFromRecords(intervenciones, ["estado"]),
    tipos_intervencion: extractFromRecords(intervenciones, [
      "tipo_intervencion",
    ]),
    tipos_equipamiento: extractFromRecords(intervenciones, [
      "tipo_equipamiento",
    ]),
    frentes_activos: extractFromRecords(intervenciones, ["frente_activo"]),
    comunas_corregimientos: extractFromRecords(intervenciones, [
      "comuna_corregimiento",
      "comuna",
    ]),
    barrios_veredas: extractFromRecords(intervenciones, ["barrio_vereda"]),
    fuentes_financiacion: extractFromRecords(intervenciones, [
      "fuente_financiacion",
    ]),
    anos: extractFromRecords(intervenciones, ["ano", "anio"]),
    proyectos_estrategicos: extractFromRecords(intervenciones, [
      "proyectos_estrategicos",
    ]),
  };

  const fromUnidades = {
    centros_gestores: extractFromRecords(unidades, [
      "nombre_centro_gestor",
      "centro_gestor",
    ]),
    estados: extractFromRecords(unidades, ["estado"]),
    tipos_intervencion: extractFromRecords(unidades, ["tipo_intervencion"]),
    tipos_equipamiento: extractFromRecords(unidades, ["tipo_equipamiento"]),
    frentes_activos: extractFromRecords(unidades, ["frente_activo"]),
    comunas_corregimientos: extractFromRecords(unidades, [
      "comuna_corregimiento",
      "comuna",
    ]),
    barrios_veredas: extractFromRecords(unidades, ["barrio_vereda"]),
    fuentes_financiacion: extractFromRecords(unidades, ["fuente_financiacion"]),
    anos: extractFromRecords(unidades, ["ano", "anio"]),
    proyectos_estrategicos: extractFromRecords(unidades, [
      "proyectos_estrategicos",
    ]),
  };

  const resolved = {
    centros_gestores: pickFirstNonEmpty(
      fromUnidades.centros_gestores,
      fromIntervenciones.centros_gestores,
    ),
    estados: pickFirstNonEmpty(
      fromUnidades.estados,
      fromIntervenciones.estados,
    ),
    tipos_intervencion: pickFirstNonEmpty(
      fromUnidades.tipos_intervencion,
      fromIntervenciones.tipos_intervencion,
    ),
    tipos_equipamiento: pickFirstNonEmpty(
      fromUnidades.tipos_equipamiento,
      fromIntervenciones.tipos_equipamiento,
    ),
    frentes_activos: pickFirstNonEmpty(
      fromUnidades.frentes_activos,
      fromIntervenciones.frentes_activos,
    ),
    comunas_corregimientos: pickFirstNonEmpty(
      fromUnidades.comunas_corregimientos,
      fromIntervenciones.comunas_corregimientos,
    ),
    barrios_veredas: pickFirstNonEmpty(
      fromUnidades.barrios_veredas,
      fromIntervenciones.barrios_veredas,
    ),
    fuentes_financiacion: pickFirstNonEmpty(
      fromUnidades.fuentes_financiacion,
      fromIntervenciones.fuentes_financiacion,
    ),
    anos: pickFirstNonEmpty(fromUnidades.anos, fromIntervenciones.anos),
    proyectos_estrategicos: pickFirstNonEmpty(
      fromUnidades.proyectos_estrategicos,
      fromIntervenciones.proyectos_estrategicos,
    ),
  };

  const report = {
    "window.UNIDADES_PROYECTO_FILTERS_GLOBAL": Object.fromEntries(
      Object.entries(resolved).map(([k, v]) => [k, v.length]),
    ),
    "window.CENTROS_GESTORES?.length": resolved.centros_gestores.length,
    "window.TIPOS_INTERVENCION?.length": resolved.tipos_intervencion.length,
    "window.TIPOS_EQUIPAMIENTO?.length": resolved.tipos_equipamiento.length,
  };

  console.log("\n--- Longitudes esperadas de globals ---");
  console.log(JSON.stringify(report, null, 2));

  const criticalOk =
    resolved.centros_gestores.length > 0 &&
    resolved.tipos_intervencion.length > 0 &&
    resolved.tipos_equipamiento.length > 0;

  console.log("\nResultado critico:", criticalOk ? "OK" : "FALLA");
  process.exit(criticalOk ? 0 : 2);
}

run().catch((error) => {
  console.error("Diagnostico fallo:", error.message);
  process.exit(1);
});
