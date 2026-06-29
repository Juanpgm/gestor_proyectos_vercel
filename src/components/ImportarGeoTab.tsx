"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  MapPin,
  Table2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  RefreshCw,
  Info,
  Download,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

import type { GeoJSONFeature, ParseResult } from "@/utils/geoImport";
import { parseFile } from "@/utils/geoImport";
import { useAuth } from "@/context/AuthContext";

type EntityType = "unidad_proyecto" | "intervencion" | "combinado";
type Step = "upload" | "mapping" | "preview" | "import";

const ENTITY_LABELS: Record<EntityType, string> = {
  unidad_proyecto: "Unidades de Proyecto",
  intervencion: "Intervenciones",
  combinado: "UP + Intervenciones (combinado)",
};

type ExportFormat = "geojson" | "kml" | "kmz" | "shp" | "gpkg";

const EXPORT_FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "geojson", label: "GeoJSON", hint: ".geojson" },
  { id: "gpkg", label: "GeoPackage", hint: ".gpkg" },
  { id: "shp", label: "Shapefile", hint: ".zip" },
  { id: "kml", label: "KML", hint: ".kml" },
  { id: "kmz", label: "KMZ", hint: ".kmz" },
];

interface ValidationResult {
  success: boolean;
  entity_type: EntityType;
  total_features: number;
  valid_count: number;
  error_count: number;
  errors: Array<{ feature_index: number; errors: string[] }>;
  preview: Array<{
    feature_index: number;
    mapped_fields: Record<string, unknown>;
    has_geometry: boolean;
    geometry_type: string | null;
    errors: string[];
  }>;
  combinado_summary?: {
    unique_ups: number;
    total_intervenciones: number;
  };
}

interface ImportResult {
  success: boolean;
  entity_type: EntityType;
  created_count: number;
  error_count: number;
  created_ids: string[];
  errors: Array<{ feature_index: number; errors: string[] }>;
  created_up_count?: number;
  created_intervencion_count?: number;
}

// ─── Field definitions ───────────────────────────────────────────────────────

const UP_TARGET_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "nombre_up", label: "Nombre UP", required: false },
  { key: "nombre_up_detalle", label: "Nombre UP Detalle" },
  { key: "tipo_equipamiento", label: "Tipo Equipamiento" },
  { key: "clase_up", label: "Clase UP" },
  { key: "tipo_intervencion", label: "Tipo Intervención" },
  { key: "estado", label: "Estado" },
  { key: "presupuesto_base", label: "Presupuesto Base" },
  { key: "avance_obra", label: "Avance de Obra (%)" },
  { key: "fuente_financiacion", label: "Fuente Financiación" },
  { key: "nombre_centro_gestor", label: "Centro Gestor" },
  { key: "direccion", label: "Dirección" },
  { key: "bpin", label: "BPIN" },
  { key: "identificador", label: "Identificador" },
  { key: "ano", label: "Año" },
  { key: "fecha_inicio", label: "Fecha Inicio" },
  { key: "fecha_fin", label: "Fecha Fin" },
  { key: "referencia_contrato", label: "Referencia Contrato" },
  { key: "referencia_proceso", label: "Referencia Proceso" },
  { key: "url_proceso", label: "URL Proceso" },
  { key: "descripcion_intervencion", label: "Descripción" },
  { key: "cantidad", label: "Cantidad" },
  { key: "unidad", label: "Unidad" },
];

const INTERVENCION_TARGET_FIELDS = [
  { key: "upid", label: "UPID", required: true },
  ...UP_TARGET_FIELDS,
];

const CHUNK_SIZE = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (!res.ok) {
    const detail = (data as Record<string, unknown>)?.detail;
    throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`);
  }
  return data;
}

// ─── Main component ───────────────────────────────────────────────────────────

const ImportarGeoTab: React.FC = () => {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const entityType: EntityType = "combinado";
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [centroGestorGlobal, setCentroGestorGlobal] = useState("");

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);

  const [crsWarning, setCrsWarning] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export state / auth ──────────────────────────────────────────────────────
  const { state: authState, hasRole, isSuperAdmin } = useAuth();
  const userCentro = authState.user?.nombre_centro_gestor ?? "";
  // Solo perfiles de gestión global eligen centro; admin_centro_gestor lo fuerza el backend.
  const canChooseCentro =
    isSuperAdmin() || hasRole("admin_general") || hasRole("editor_datos");

  const [view, setView] = useState<"importar" | "exportar">("importar");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("geojson");
  const [exportCentro, setExportCentro] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Catálogo de centros gestores para el dropdown (init desde el catálogo global
  // que publica el padre; se refresca con el endpoint de filtros como fuente firme).
  const [availableCentros, setAvailableCentros] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const g = (
      window as unknown as {
        UNIDADES_PROYECTO_FILTERS_GLOBAL?: { centros_gestores?: string[] };
      }
    ).UNIDADES_PROYECTO_FILTERS_GLOBAL?.centros_gestores;
    return Array.isArray(g) ? g.filter(Boolean) : [];
  });

  useEffect(() => {
    if (view !== "exportar" || !canChooseCentro) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/proxy/unidades-proyecto/filters?field=nombre_centro_gestor",
        );
        if (!res.ok) return;
        const data = await res.json();
        const list =
          data?.filters?.nombre_centro_gestor ??
          data?.filters?.centros_gestores ??
          [];
        if (!cancelled && Array.isArray(list) && list.length) {
          setAvailableCentros(
            [...new Set(list.filter(Boolean) as string[])].sort((a, b) =>
              a.localeCompare(b),
            ),
          );
        }
      } catch {
        /* se mantiene el fallback del catálogo global */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, canChooseCentro]);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const params = new URLSearchParams({ formato: exportFormat });
      if (canChooseCentro && exportCentro.trim()) {
        params.set("nombre_centro_gestor", exportCentro.trim());
      }
      const res = await fetch(
        `/api/proxy/unidades-proyecto/exportar?${params.toString()}`,
      );
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const j = await res.json();
          msg = j.detail ?? msg;
        } catch {
          /* respuesta no-JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      const ext = exportFormat === "shp" ? "zip" : exportFormat;
      const filename = match?.[1] || `unidades_proyecto.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const targetFields = INTERVENCION_TARGET_FIELDS;

  // Per-column stats (sample values, distinct count, fill rate) to make mapping easier
  const columnStats = useMemo(() => {
    const stats: Record<
      string,
      { samples: string[]; distinct: number; filled: number; total: number }
    > = {};
    if (!parseResult) return stats;
    const feats = parseResult.features;
    for (const col of parseResult.columns) {
      const seen = new Set<string>();
      const samples: string[] = [];
      let filled = 0;
      for (const f of feats) {
        const raw = (f.properties ?? {})[col];
        if (raw === null || raw === undefined || raw === "") continue;
        filled++;
        const s = String(raw).trim();
        if (!s) continue;
        if (!seen.has(s)) {
          seen.add(s);
          if (samples.length < 3) {
            samples.push(s.length > 40 ? `${s.slice(0, 40)}…` : s);
          }
        }
      }
      stats[col] = { samples, distinct: seen.size, filled, total: feats.length };
    }
    return stats;
  }, [parseResult]);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFileDrop = useCallback(
    async (droppedFile: File) => {
      setFile(droppedFile);
      setParseError(null);
      setParseResult(null);
      setColumnMapping({});
      setValidationResult(null);
      setCrsWarning(null);
      setImportResult(null);
      setParseLoading(true);
      try {
        const result = await parseFile(droppedFile);
        setParseResult(result);
        if (result.crsWarning) setCrsWarning(result.crsWarning);
        // Ask the backend for auto-suggested mapping
        const res = await fetch("/api/proxy/unidades-proyecto/importar/sugerir-mapping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.columns),
        });
        if (res.ok) {
          const data = await res.json();
          setColumnMapping(data.suggested_mapping ?? {});
        }
        setStep("mapping");
      } catch (err: unknown) {
        setParseError(err instanceof Error ? err.message : "Error desconocido al parsear el archivo");
      } finally {
        setParseLoading(false);
      }
    },
    []
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileDrop(f);
    },
    [handleFileDrop]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFileDrop(f);
    },
    [handleFileDrop]
  );

  // ── Validate ───────────────────────────────────────────────────────────────

  const handleValidate = async () => {
    if (!parseResult) return;
    setValidating(true);
    setValidationError(null);
    try {
      const body = {
        entity_type: entityType,
        column_mapping: columnMapping,
        features: parseResult.features.map((f) => ({
          geometry: f.geometry,
          properties: f.properties,
        })),
        nombre_centro_gestor_global: centroGestorGlobal || null,
      };
      const res = await fetch("/api/proxy/unidades-proyecto/importar/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await parseJsonOrThrow(res);
      setValidationResult(data as ValidationResult);
      setStep("preview");
    } catch (err: unknown) {
      setValidationError(err instanceof Error ? err.message : "Error al validar");
    } finally {
      setValidating(false);
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!parseResult || !importConfirmed) return;
    setImporting(true);
    setImportError(null);

    const allFeatures = parseResult.features.map((f) => ({
      geometry: f.geometry,
      properties: f.properties,
    }));

    const chunks: (typeof allFeatures)[] = [];
    for (let i = 0; i < allFeatures.length; i += CHUNK_SIZE) {
      chunks.push(allFeatures.slice(i, i + CHUNK_SIZE));
    }

    const aggregated: ImportResult = {
      success: false,
      entity_type: entityType,
      created_count: 0,
      error_count: 0,
      created_ids: [],
      errors: [],
      created_up_count: 0,
      created_intervencion_count: 0,
    };

    try {
      for (let i = 0; i < chunks.length; i++) {
        setImportProgress({ current: i + 1, total: chunks.length });

        const body = {
          entity_type: entityType,
          column_mapping: columnMapping,
          features: chunks[i],
          nombre_centro_gestor_global: centroGestorGlobal || null,
        };

        const res = await fetch("/api/proxy/unidades-proyecto/importar/ejecutar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        const data = (await parseJsonOrThrow(res)) as ImportResult;

        aggregated.success = aggregated.success || data.success;
        aggregated.created_count += data.created_count ?? 0;
        aggregated.error_count += data.error_count ?? 0;
        aggregated.created_ids.push(...(data.created_ids ?? []));
        aggregated.created_up_count =
          (aggregated.created_up_count ?? 0) + (data.created_up_count ?? 0);
        aggregated.created_intervencion_count =
          (aggregated.created_intervencion_count ?? 0) + (data.created_intervencion_count ?? 0);

        // Offset feature_index so errors reference the global position
        const offset = i * CHUNK_SIZE;
        for (const e of data.errors ?? []) {
          aggregated.errors.push({ ...e, feature_index: e.feature_index + offset });
        }
      }

      setImportResult(aggregated);
      setStep("import");
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setColumnMapping({});
    setValidationResult(null);
    setValidationError(null);
    setImportResult(null);
    setImportError(null);
    setImportConfirmed(false);
    setCrsWarning(null);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Step indicators ────────────────────────────────────────────────────────

  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Cargar archivo" },
    { id: "mapping", label: "Mapear columnas" },
    { id: "preview", label: "Vista previa" },
    { id: "import", label: "Resultado" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      {/* View toggle: Importar | Exportar */}
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
        {(["importar", "exportar"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-5 py-1.5 text-sm font-medium rounded-md transition-colors ${
              view === v
                ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {v === "importar" ? "Importar" : "Exportar"}
          </button>
        ))}
      </div>

      {view === "importar" && (
        <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Importar desde archivo geoespacial
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Cargá un archivo .geojson, .kml, .kmz o .zip (shapefile) para crear Unidades de
            Proyecto o Intervenciones en lote.
          </p>
        </div>
        {step !== "upload" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        )}
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                i < stepIndex
                  ? "text-green-600 dark:text-green-400"
                  : i === stepIndex
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < stepIndex
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : i === stepIndex
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Combined mode hint */}
            <div className="flex gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-indigo-700 dark:text-indigo-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Cargá UP e intervenciones en una sola tabla. El sistema agrupa por{" "}
                <code className="font-mono text-xs bg-indigo-100 dark:bg-indigo-900/40 px-1 rounded">
                  upid
                </code>
                : filas con el mismo <code className="font-mono text-xs">upid</code> son la
                misma UP. Si el <code className="font-mono text-xs">upid</code> ya existe se
                preserva y se le agregan las intervenciones; si es nuevo, se crea la UP con un{" "}
                <code className="font-mono text-xs">upid</code> generado.
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".geojson,.json,.kml,.kmz,.zip"
                className="hidden"
                onChange={handleFileInput}
              />
              <Upload
                className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                  dragActive ? "text-indigo-500" : "text-gray-400"
                }`}
              />
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                Arrastrá el archivo aquí o hacé clic para explorar
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                .geojson · .json · .kml · .kmz · .zip (shapefile)
              </p>
            </div>

            {/* Info box */}
            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Si las columnas del archivo tienen nombres distintos a los esperados, podés
                mapearlas manualmente en el siguiente paso. El sistema intentará detectarlas
                automáticamente.
              </span>
            </div>

            {parseLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando archivo...
              </div>
            )}

            {parseError && (
              <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {parseError}
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 2: Column Mapping ──────────────────────────────────── */}
        {step === "mapping" && parseResult && (
          <motion.div
            key="mapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* File summary */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{file?.name}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {parseResult.fileType} · {parseResult.features.length} features ·{" "}
                  {parseResult.columns.length} columnas ·{" "}
                  {parseResult.geometryTypes.join(", ")}
                </span>
              </div>
            </div>

            {/* CRS warning */}
            {crsWarning && (
              <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{crsWarning}</span>
              </div>
            )}

            {/* Global centro gestor */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Centro Gestor global{" "}
                <span className="text-gray-400 font-normal">
                  (se aplica a todos los features que no tengan este campo mapeado)
                </span>
              </label>
              <input
                type="text"
                value={centroGestorGlobal}
                onChange={(e) => setCentroGestorGlobal(e.target.value)}
                placeholder="Ej: DAGMA"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Mapping table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <Table2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mapeo de columnas
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  Columna del archivo → Campo del sistema
                </span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-80 overflow-y-auto">
                {parseResult.columns.map((col) => {
                  const stats = columnStats[col];
                  const mapped = Boolean(columnMapping[col]);
                  return (
                    <div
                      key={col}
                      className={`px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        mapped ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex-1 min-w-0 truncate">
                          {col}
                        </code>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <select
                          value={columnMapping[col] ?? ""}
                          onChange={(e) =>
                            setColumnMapping((prev) => {
                              const next = { ...prev };
                              if (e.target.value) {
                                next[col] = e.target.value;
                              } else {
                                delete next[col];
                              }
                              return next;
                            })
                          }
                          className="flex-1 min-w-0 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">(ignorar)</option>
                          {targetFields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                              {f.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sample values + stats to ease mapping */}
                      {stats && (stats.samples.length > 0 || stats.total > 0) && (
                        <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
                          {stats.samples.length > 0 ? (
                            <>
                              <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                ej:
                              </span>
                              {stats.samples.map((s, i) => (
                                <span
                                  key={i}
                                  title={s}
                                  className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 max-w-[160px] truncate"
                                >
                                  {s}
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-[10px] text-amber-500 dark:text-amber-400">
                              sin valores
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto whitespace-nowrap">
                            {stats.distinct} distinto{stats.distinct === 1 ? "" : "s"} ·{" "}
                            {stats.filled}/{stats.total} con dato
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick preview of sample values */}
            {parseResult.features.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Ver valores de muestra (primer feature)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(parseResult.features[0].properties ?? {}).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-gray-500 truncate max-w-[120px]">{k}:</span>
                      <span className="text-gray-900 dark:text-white truncate">
                        {String(v ?? "")}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {validationError && (
              <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {validationError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {validating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Validar y ver preview
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Preview ──────────────────────────────────────────── */}
        {step === "preview" && validationResult && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {validationResult.total_features}
                </div>
                <div className="text-xs text-gray-500">Total features</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {validationResult.valid_count}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500">Válidos</div>
              </div>
              <div
                className={`p-3 rounded-lg text-center ${
                  validationResult.error_count > 0
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    validationResult.error_count > 0
                      ? "text-red-700 dark:text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {validationResult.error_count}
                </div>
                <div className="text-xs text-gray-500">Con errores</div>
              </div>
            </div>

            {/* Combined-mode summary: how many UPs vs intervenciones */}
            {validationResult.combinado_summary && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {validationResult.combinado_summary.unique_ups}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    Unidades de Proyecto
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {validationResult.combinado_summary.total_intervenciones}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400">
                    Intervenciones
                  </div>
                </div>
              </div>
            )}

            {/* Global errors */}
            {validationResult.error_count > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Features con problemas ({validationResult.error_count})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {validationResult.errors.slice(0, 20).map((e, i) => (
                    <div key={i} className="text-xs text-amber-700 dark:text-amber-400">
                      {e.errors.join("; ")}
                    </div>
                  ))}
                  {validationResult.errors.length > 20 && (
                    <div className="text-xs text-amber-500">
                      +{validationResult.errors.length - 20} más...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista previa (primeros {validationResult.preview.length} features)
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Geometría</th>
                      {targetFields.slice(0, 5).map((f) => (
                        <th key={f.key} className="px-3 py-2 text-left text-gray-500 font-medium">
                          {f.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {validationResult.preview.map((row) => (
                      <tr
                        key={row.feature_index}
                        className={
                          row.errors.length > 0
                            ? "bg-red-50 dark:bg-red-900/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }
                      >
                        <td className="px-3 py-2 text-gray-400">{row.feature_index + 1}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                          {row.has_geometry ? row.geometry_type : "—"}
                        </td>
                        {targetFields.slice(0, 5).map((f) => (
                          <td
                            key={f.key}
                            className="px-3 py-2 text-gray-900 dark:text-white max-w-[120px] truncate"
                          >
                            {row.mapped_fields[f.key] != null
                              ? String(row.mapped_fields[f.key])
                              : <span className="text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <X className="w-3 h-3" />
                              Error
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import confirmation */}
            {validationResult.valid_count > 0 && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
                <div className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                  {validationResult.combinado_summary ? (
                    <>
                      Listo para importar{" "}
                      {validationResult.combinado_summary.unique_ups} Unidades de Proyecto
                      {" y "}
                      {validationResult.combinado_summary.total_intervenciones} Intervenciones
                    </>
                  ) : (
                    <>
                      Listo para importar {validationResult.valid_count}{" "}
                      {ENTITY_LABELS[entityType]}
                    </>
                  )}
                  {validationResult.error_count > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {" "}({validationResult.error_count} con errores serán omitidos)
                    </span>
                  )}
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importConfirmed}
                    onChange={(e) => setImportConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-sm text-indigo-700 dark:text-indigo-300">
                    Confirmo que revisé el preview y quiero crear los registros en la base de datos
                  </span>
                </label>
              </div>
            )}

            {importError && (
              <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {importError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("mapping")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !importConfirmed || validationResult.valid_count === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {importProgress && importProgress.total > 1
                      ? `Lote ${importProgress.current}/${importProgress.total}...`
                      : "Importando..."}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Importar {validationResult.valid_count} registros
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Result ───────────────────────────────────────────── */}
        {step === "import" && importResult && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div
              className={`p-5 rounded-xl border ${
                importResult.error_count === 0
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {importResult.error_count === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Importación completada
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {importResult.created_count}
                  </div>
                  <div className="text-xs text-gray-500">Registros creados</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div className={`text-2xl font-bold ${importResult.error_count > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}>
                    {importResult.error_count}
                  </div>
                  <div className="text-xs text-gray-500">Con errores</div>
                </div>
              </div>

              {/* Combined-mode breakdown: UPs vs intervenciones created */}
              {importResult.entity_type === "combinado" &&
                importResult.created_up_count != null && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                        {importResult.created_up_count}
                      </div>
                      <div className="text-xs text-gray-500">UP creadas</div>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                        {importResult.created_intervencion_count ?? 0}
                      </div>
                      <div className="text-xs text-gray-500">Intervenciones creadas</div>
                    </div>
                  </div>
                )}
            </div>

            {importResult.created_count > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IDs creados
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {importResult.created_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2 py-0.5 text-xs font-mono bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Errores durante la importación
                </div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-600 dark:text-red-400">
                      {e.errors.join("; ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Importar otro archivo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* ── EXPORT VIEW ──────────────────────────────────────────────────── */}
      {view === "exportar" && (
        <motion.div
          key="exportar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-500" />
              Exportar datos geoespaciales
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Descargá la tabla única (Unidades de Proyecto + intervenciones, vinculadas por{" "}
              <code className="font-mono text-xs">upid</code>, con todas las variables y la
              geometría) en formato estandarizado para trabajarla.
            </p>
          </div>

          {/* Format selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formato
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setExportFormat(f.id)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors flex flex-col items-center gap-0.5 ${
                    exportFormat === f.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {f.label}
                  <span className="text-[10px] font-mono text-gray-400">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Centro scope */}
          {canChooseCentro ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Centro Gestor
              </label>
              <select
                value={exportCentro}
                onChange={(e) => setExportCentro(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Todos los centros gestores</option>
                {availableCentros.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Se exportarán los datos de tu centro gestor:{" "}
                <strong>{userCentro || "(no asignado)"}</strong>.
              </span>
            </div>
          )}

          {exportError && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {exportError}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generando archivo...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar {EXPORT_FORMATS.find((f) => f.id === exportFormat)?.label}
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ImportarGeoTab;
