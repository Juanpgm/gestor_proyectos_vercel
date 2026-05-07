"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from "lucide-react";
import {
  fetchSolicitudesCambiosUP,
  fetchSolicitudesCambiosIntervencion,
  type SolicitudCambio,
} from "@/services/unidades-proyecto.service";

// ─── helpers ──────────────────────────────────────────────────────

const estadoBadge = (estado?: string) => {
  switch (estado) {
    case "aprobada":
      return {
        icon: CheckCircle2,
        label: "Aprobada",
        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      };
    case "rechazada":
      return {
        icon: XCircle,
        label: "Rechazada",
        cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      };
    default:
      return {
        icon: Hourglass,
        label: "Pendiente",
        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      };
  }
};

const formatRequestedValue = (value: unknown): string => {
  if (value === null || value === undefined) return "Sin cambios";

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "Sin cambios";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : "Sin cambios";
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0
      ? JSON.stringify(value)
      : "Sin cambios";
  }

  return String(value);
};

const normalizeComparableValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && /^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return numeric;
    }

    return trimmed;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item));
  }

  if (typeof value === "object") {
    const normalizedEntries = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [k, normalizeComparableValue(v)] as const)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(normalizedEntries);
  }

  return value;
};

const areFieldValuesEqual = (a: unknown, b: unknown): boolean => {
  return (
    JSON.stringify(normalizeComparableValue(a)) ===
    JSON.stringify(normalizeComparableValue(b))
  );
};

const extractChangePair = (
  key: string,
  requestedValue: unknown,
  currentRecord?: Record<string, unknown> | null,
) => {
  const rawValue = requestedValue as Record<string, unknown> | unknown;

  if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const valueObj = rawValue as Record<string, unknown>;
    const prevExplicit =
      valueObj.anterior ??
      valueObj.valor_anterior ??
      valueObj.old ??
      valueObj.before ??
      valueObj.previo ??
      valueObj.previous;
    const nextExplicit =
      valueObj.nuevo ??
      valueObj.valor_nuevo ??
      valueObj.new ??
      valueObj.after ??
      valueObj.solicitado ??
      valueObj.requested ??
      valueObj.propuesto;

    const hasExplicitPair =
      prevExplicit !== undefined || nextExplicit !== undefined;

    if (hasExplicitPair) {
      const previous = prevExplicit ?? currentRecord?.[key] ?? null;
      const requested = nextExplicit ?? null;
      return {
        previous,
        requested,
        changed: !areFieldValuesEqual(previous, requested),
      };
    }
  }

  const previous = currentRecord?.[key] ?? null;
  return {
    previous,
    requested: requestedValue,
    changed: !areFieldValuesEqual(previous, requestedValue),
  };
};

const extractFirstRecordFromPayload = (
  payload: any,
): Record<string, unknown> | null => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    const first = payload[0];
    return first && typeof first === "object" ? first : null;
  }

  if (Array.isArray(payload?.data)) {
    const first = payload.data[0];
    return first && typeof first === "object" ? first : null;
  }

  if (Array.isArray(payload?.items)) {
    const first = payload.items[0];
    return first && typeof first === "object" ? first : null;
  }

  if (Array.isArray(payload?.features)) {
    const first = payload.features[0];
    if (!first || typeof first !== "object") return null;
    if (first.properties && typeof first.properties === "object")
      return first.properties;
    return first;
  }

  if (typeof payload === "object") {
    return payload;
  }

  return null;
};

// ─── Componente principal ─────────────────────────────────────────

interface HistorialSolicitudesTabProps {
  filterCentrosGestores?: string[];
  filterEstados?: string[];
  filterTiposIntervencion?: string[];
  filterIdentificadores?: string[];
}

const HistorialSolicitudesTab: React.FC<HistorialSolicitudesTabProps> = ({
  filterCentrosGestores = [],
  filterEstados = [],
  filterTiposIntervencion = [],
  filterIdentificadores = [],
}) => {
  const [solicitudes, setSolicitudes] = useState<SolicitudCambio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<"all" | "up" | "intervencion">(
    "all",
  );
  const [currentDataCache, setCurrentDataCache] = useState<
    Record<string, Record<string, unknown> | null>
  >({});
  const [loadingCurrentData, setLoadingCurrentData] = useState<Set<string>>(
    new Set(),
  );

  const getSolicitudId = (sol: SolicitudCambio): string => {
    const raw =
      (sol as any).id ??
      (sol as any).solicitud_id ??
      (sol as any)._id ??
      (sol as any).document_id ??
      "";
    return String(raw || "").trim();
  };

  const getComparisonKey = (sol: SolicitudCambio) => {
    const stableId = getSolicitudId(sol);
    if (stableId) return `${sol.tipo || "sol"}:${stableId}`;
    return `${sol.tipo || "sol"}:${sol.upid || sol.intervencion_id || "unknown"}`;
  };

  const fetchCurrentRecord = useCallback(
    async (sol: SolicitudCambio) => {
      const cacheKey = getComparisonKey(sol);
      if (cacheKey in currentDataCache || loadingCurrentData.has(cacheKey))
        return;

      setLoadingCurrentData((prev) => new Set(prev).add(cacheKey));

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(
        /\/+$/,
        "",
      );
      const isUP = sol.tipo === "unidad_proyecto";
      const identifier = isUP ? sol.upid : sol.intervencion_id;
      const query = isUP
        ? `upid=${encodeURIComponent(identifier || "")}`
        : `intervencion_id=${encodeURIComponent(identifier || "")}`;
      const endpoint = isUP ? "unidades-proyecto" : "intervenciones";
      const candidates = [
        apiUrl ? `${apiUrl}/${endpoint}?${query}&limit=1` : "",
        `/api/proxy/${endpoint}?${query}&limit=1`,
      ].filter(Boolean);

      let found: Record<string, unknown> | null = null;

      for (const url of candidates) {
        try {
          const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
          });
          if (!response.ok) continue;
          const payload = await response.json();
          found = extractFirstRecordFromPayload(payload);
          if (found) break;
        } catch {
          continue;
        }
      }

      setCurrentDataCache((prev) => ({ ...prev, [cacheKey]: found }));
      setLoadingCurrentData((prev) => {
        const next = new Set(prev);
        next.delete(cacheKey);
        return next;
      });
    },
    [currentDataCache, loadingCurrentData],
  );

  const loadHistorial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [upRes, intervRes] = await Promise.allSettled([
        fetchSolicitudesCambiosUP(),
        fetchSolicitudesCambiosIntervencion(),
      ]);

      const upList =
        upRes.status === "fulfilled"
          ? (Array.isArray(upRes.value) ? upRes.value : []).map((s) => ({
              ...s,
              tipo: "unidad_proyecto" as const,
              estadoEfectivo: s.estado_decision || "pendiente",
            }))
          : [];

      const intervList =
        intervRes.status === "fulfilled"
          ? (Array.isArray(intervRes.value) ? intervRes.value : []).map(
              (s) => ({
                ...s,
                tipo: "intervencion" as const,
                estadoEfectivo: s.estado_decision || "pendiente",
              }),
            )
          : [];

      // Combinar y ordenar por fecha descendente
      const all = [...upList, ...intervList].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });

      setSolicitudes(all);

      if (upRes.status === "rejected" && intervRes.status === "rejected") {
        setError(
          "No se pudieron cargar las solicitudes. Los endpoints pueden no estar disponibles aún.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar historial",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  const matchesGlobalFilters = (s: SolicitudCambio): boolean => {
    const normalize = (v: unknown) =>
      String(v ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    if (filterCentrosGestores.length > 0) {
      const centro = normalize(s.nombre_centro_gestor ?? s.centro_gestor);
      if (!filterCentrosGestores.some((f) => normalize(f) === centro))
        return false;
    }
    if (filterEstados.length > 0) {
      const estado = normalize(
        s.estadoEfectivo ?? s.estado_decision ?? s.estado,
      );
      if (!filterEstados.some((f) => normalize(f) === estado)) return false;
    }
    if (filterTiposIntervencion.length > 0) {
      const tipo = normalize(s.tipo_intervencion);
      if (!filterTiposIntervencion.some((f) => normalize(f) === tipo))
        return false;
    }
    if (filterIdentificadores.length > 0) {
      const id = normalize(s.identificador);
      if (!filterIdentificadores.some((f) => normalize(f) === id)) return false;
    }
    return true;
  };

  // Filtrar
  const filtered = solicitudes.filter((s) => {
    if (!matchesGlobalFilters(s)) return false;
    if (filterTipo !== "all") {
      if (filterTipo === "up" && s.tipo !== "unidad_proyecto") return false;
      if (filterTipo === "intervencion" && s.tipo !== "intervencion")
        return false;
    }
    if (filterEstado !== "all" && s.estadoEfectivo !== filterEstado)
      return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        s.id?.toLowerCase().includes(term) ||
        s.upid?.toLowerCase().includes(term) ||
        s.intervencion_id?.toLowerCase().includes(term) ||
        JSON.stringify(s).toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID, UPID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todas</option>
            <option value="up">UP</option>
            <option value="intervencion">Intervención</option>
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
          <button
            onClick={loadHistorial}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Estado */}
      {loading && solicitudes.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
          <Clock className="w-12 h-12 mb-3" />
          <p className="text-sm font-medium">Sin registros de solicitudes</p>
          <p className="text-xs mt-1">
            Las solicitudes aparecerán aquí cuando se generen
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((sol) => {
            const solId = getSolicitudId(sol);
            const isExpanded = expandedId === solId;
            const badge = estadoBadge(sol.estadoEfectivo);
            const BadgeIcon = badge.icon;
            const METADATA_KEYS = new Set([
              "id",
              "tipo",
              "created_at",
              "updated_at",
              "upid",
              "intervencion_id",
              "estado",
              "estadoEfectivo",
              "estado_decision",
              "decision_at",
            ]);
            const comparisonKey = getComparisonKey(sol);
            const currentRecord = currentDataCache[comparisonKey];
            const isLoadingComparison = loadingCurrentData.has(comparisonKey);
            const entries = Object.entries(sol).filter(
              ([k]) => !METADATA_KEYS.has(k),
            );

            return (
              <div
                key={solId}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(solId);
                      void fetchCurrentRecord(sol);
                    }
                  }}
                >
                  <button className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          sol.tipo === "unidad_proyecto"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {sol.tipo === "unidad_proyecto" ? "UP" : "Intervención"}
                      </span>
                      <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {sol.upid || sol.intervencion_id || solId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {sol.created_at
                        ? new Date(sol.created_at).toLocaleString("es-CO")
                        : "Fecha no disponible"}
                    </div>
                  </div>
                </div>

                {/* Detalle */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                          Datos de la solicitud:
                        </p>
                        {isLoadingComparison && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Cargando valores actuales para comparación...
                          </p>
                        )}
                        {entries.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            Sin datos disponibles.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {entries.map(([key, value]) => {
                              const { previous, requested, changed } =
                                extractChangePair(key, value, currentRecord);

                              const previousColor = changed
                                ? "text-red-700 dark:text-red-300"
                                : "text-slate-900 dark:text-white";
                              const requestedColor = changed
                                ? "text-green-700 dark:text-green-300"
                                : "text-slate-900 dark:text-white";

                              return (
                                <div
                                  key={key}
                                  className="flex flex-col bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 gap-1"
                                >
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {key}
                                  </span>
                                  <div className="text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">
                                      Anterior:
                                    </span>{" "}
                                    <span
                                      className={`font-medium break-words ${previousColor}`}
                                    >
                                      {formatRequestedValue(previous)}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">
                                      Solicitado:
                                    </span>{" "}
                                    <span
                                      className={`font-medium break-words ${requestedColor}`}
                                    >
                                      {formatRequestedValue(requested)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistorialSolicitudesTab;
