"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  Building2,
  FileText,
  CheckCircle2,
  ClipboardList,
  History,
  TrendingUp,
  Filter,
  FilterX,
  FilePenLine,
  ShieldCheck,
  Archive,
  GitBranch,
} from "lucide-react";
import { SummaryView, RecordsView, StatsView } from "./QualityControlViews";
import {
  ChangelogView,
  ByCentroGestorView,
} from "./QualityControlViewsExtended";
import { MultiSelect } from "./MultiSelect";
import dynamic from "next/dynamic";
import ManagementFeatureTour from "./ManagementFeatureTour";
import { useAuth } from "@/context/AuthContext";
import { auth as firebaseAuth } from "@/lib/firebase";
import {
  getCentroGestorAccessFromSession,
  itemMatchesCentroGestor,
} from "@/utils/centroGestorAccess";

const GestionRegistrosTab = dynamic(() => import("./GestionRegistrosTab"), {
  ssr: false,
});
const AvancesUPCentroGestor = dynamic(() => import("./AvancesUPCentroGestor"), {
  ssr: false,
});
const SolicitudesPendientesTab = dynamic(
  () => import("./SolicitudesPendientesTab"),
  { ssr: false },
);
const HistorialSolicitudesTab = dynamic(
  () => import("./HistorialSolicitudesTab"),
  { ssr: false },
);
const AnalisisProcesosTab = dynamic(() => import("./AnalisisProcesosTab"), {
  ssr: false,
});

// Interfaces específicas para cada endpoint
interface ChangeMetric {
  previous: number;
  value: number;
  change: number;
  change_percentage: number;
  trend: "improving" | "stable" | "worsening";
}

interface SeverityChange {
  previous: number;
  value: number;
  change: number;
  change_percentage: number;
  trend: "improving" | "stable" | "worsening";
}

interface ComparisonWithPrevious {
  has_previous: boolean;
  previous_timestamp: string;
  previous_report_id: string;
  changes: {
    quality_score: ChangeMetric;
    total_issues: ChangeMetric;
    records_with_issues: ChangeMetric;
    error_rate: ChangeMetric;
    total_records: ChangeMetric;
    centros_require_attention: ChangeMetric;
  };
  severity_changes: {
    CRITICAL: SeverityChange;
    HIGH: SeverityChange;
    MEDIUM: SeverityChange;
    LOW: SeverityChange;
    INFO?: SeverityChange;
  };
}

interface TrendsCount {
  improving: number;
  stable: number;
  worsening: number;
}

interface SummaryData {
  id: string;
  report_id: string;
  report_timestamp: string;
  global_quality_score: number;
  error_rate: number;
  total_records_validated: number;
  records_with_issues: number;
  records_without_issues: number;
  total_issues_found: number;
  system_status: string;
  requires_immediate_action: boolean;
  severity_distribution: { [key: string]: number };
  dimension_distribution: { [key: string]: number };
  top_quality_centros: Array<{
    nombre: string;
    quality_score: number;
    error_rate: number;
    issues: number;
  }>;
  top_problematic_centros: Array<{
    nombre: string;
    quality_score: number;
    error_rate: number;
    issues: number;
  }>;
  recommendations: Array<{
    category: string;
    priority: string;
    recommendation: string;
  }>;
  comparison_with_previous?: ComparisonWithPrevious;
  // Campos adicionales de tendencia (vienen a nivel raíz de la respuesta)
  overall_trend?: "improving" | "stable" | "worsening";
  trends_count?: TrendsCount;
  has_comparison_data?: boolean;
}

interface RecordData {
  id: string;
  upid: string;
  nombre_up: string;
  nombre_centro_gestor: string;
  total_issues: number;
  max_severity: string;
  priority: string;
  issues: Array<{
    rule_id: string;
    rule_name: string;
    dimension: string;
    severity: string;
    field_name: string;
    current_value: any;
    expected_value: any;
    suggestion: string;
    details: string;
  }>;
  affected_fields: string[];
  severity_counts: { [key: string]: number };
  dimension_counts: { [key: string]: number };
}

interface ChangelogData {
  id: string;
  upid: string;
  document_id: string;
  action: string;
  timestamp: string;
  old_report_id: string;
  new_report_id: string;
  changes: { [key: string]: { old: any; new: any } };
}

interface CentroGestorData {
  id: string;
  nombre_centro_gestor: string;
  total_records: number;
  records_with_issues: number;
  records_without_issues: number;
  total_issues: number;
  quality_score: number;
  error_rate: number;
  status: string;
  requires_attention: boolean;
  severity_counts: { [key: string]: number };
  dimension_counts: { [key: string]: number };
  top_violated_rules: Array<{ rule_id: string; count: number }>;
  top_problematic_fields: Array<{ field: string; count: number }>;
  affected_records_sample: string[];
}

interface MetadataData {
  id: string;
  report_id: string;
  version: string;
  generated_at: string;
  counts: {
    total_records: number;
    total_centros: number;
    total_issues: number;
    records_with_issues: number;
    centros_require_attention: number;
  };
  filters: {
    centros_gestores: string[];
    severities: string[];
    priorities: string[];
    dimensions: string[];
    statuses: string[];
  };
  colors: any;
  charts: any;
}

interface StatsData {
  success: boolean;
  data: {
    [key: string]: {
      collection: string;
      count: number;
    };
  };
  timestamp: string;
}

interface ApiResponse {
  success: boolean;
  data: any[];
  count: number;
  message?: string;
  error?: string;
}

interface GestionUnidadesProyectoProps {
  onNavigateHome: () => void;
}

type GlobalFilterOptions = {
  centros_gestores: string[];
  estados: string[];
  tipos_intervencion: string[];
  identificadores: string[];
};

type GlobalFilterCatalog = {
  centros_gestores?: string[];
  estados?: string[];
  tipos_intervencion?: string[];
  identificadores?: string[];
  tipos_equipamiento?: string[];
  clases_up?: string[];
  frentes_activos?: string[];
  comunas_corregimientos?: string[];
  barrios_veredas?: string[];
  fuentes_financiacion?: string[];
  anos?: string[];
  proyectos_estrategicos?: string[];
};

interface SelectedFilters {
  centros_gestores: string[];
  estados: string[];
  tipos_intervencion: string[];
  identificadores: string[];
}

declare global {
  interface Window {
    UNIDADES_PROYECTO_FILTERS_GLOBAL?: GlobalFilterCatalog;
    UNIDADES_PROYECTO_SELECTED_FILTERS?: SelectedFilters;
    CENTROS_GESTORES?: string[];
    ESTADOS?: string[];
    TIPOS_INTERVENCION?: string[];
    IDENTIFICADORES?: string[];
  }
}

type TabType =
  | "summary"
  | "records"
  | "changelog"
  | "by-centro-gestor"
  | "stats"
  | "analisis-procesos"
  | "gestionar-registros"
  | "avances-up"
  | "solicitudes-pendientes"
  | "historial-solicitudes";

const GestionUnidadesProyecto: React.FC<GestionUnidadesProyectoProps> = ({
  onNavigateHome,
}) => {
  const { hasRole, state: authState } = useAuth();

  // Determinar si el usuario puede ver todos los centros gestores (centralizado)
  const centroGestorAccess = useMemo(
    () => getCentroGestorAccessFromSession(),
    [authState.user],
  );
  const userCentroGestor = centroGestorAccess.userCentroGestor;
  const canViewAll = centroGestorAccess.canViewAll;

  const canViewSolicitudesTabs =
    hasRole("super_admin") || hasRole("admin_general");
  const canViewAnalisisProcesos =
    hasRole("super_admin") ||
    hasRole("admin_general") ||
    hasRole("admin_centro_gestor") ||
    hasRole("analista");

  // Estado para tabs
  const [activeTab, setActiveTab] = useState<TabType>("summary");

  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Estados para datos
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros avanzados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<
    string[]
  >([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedIdentificadores, setSelectedIdentificadores] = useState<
    string[]
  >([]);

  // Listas de opciones disponibles
  const [availableCentrosGestores, setAvailableCentrosGestores] = useState<
    string[]
  >([]);
  const [availableSeverities, setAvailableSeverities] = useState<string[]>([]);
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
  const [availableIdentificadores, setAvailableIdentificadores] = useState<
    string[]
  >([]);

  const [showFilters, setShowFilters] = useState(true);

  // Para usuarios restringidos: auto-seleccionar su centro gestor y bloquear el dropdown
  useEffect(() => {
    if (
      !canViewAll &&
      userCentroGestor &&
      selectedCentrosGestores.length === 0
    ) {
      setSelectedCentrosGestores([userCentroGestor]);
    }
  }, [canViewAll, userCentroGestor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Publicar filtros seleccionados para tabs autónomos (Gestionar Registros, etc.)
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.UNIDADES_PROYECTO_SELECTED_FILTERS = {
      centros_gestores: selectedCentrosGestores,
      estados: selectedSeverities,
      tipos_intervencion: selectedPriorities,
      identificadores: selectedIdentificadores,
    };
    window.dispatchEvent(new Event("up-selected-filters-changed"));
  }, [
    selectedCentrosGestores,
    selectedSeverities,
    selectedPriorities,
    selectedIdentificadores,
  ]);

  const API_BASE_URL = "/api/proxy"; // Usar el proxy de Next.js para evitar CORS
  const CALIDAD_DATOS_ENDPOINT = "/unidades-proyecto/calidad-datos";

  const normalizeOptions = (values: unknown): string[] => {
    if (!Array.isArray(values)) return [];
    return Array.from(
      new Set(
        values.map((value) => String(value || "").trim()).filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  };

  const pickFirstNonEmpty = (...sources: unknown[]): string[] => {
    for (const source of sources) {
      const normalized = normalizeOptions(source);
      if (normalized.length > 0) return normalized;
    }
    return [];
  };

  const readGlobalFilterOptions = (): GlobalFilterOptions => {
    if (typeof window === "undefined") {
      return {
        centros_gestores: [],
        estados: [],
        tipos_intervencion: [],
        identificadores: [],
      };
    }

    const globalObject = window.UNIDADES_PROYECTO_FILTERS_GLOBAL || {};
    return {
      centros_gestores: normalizeOptions(
        globalObject.centros_gestores &&
          globalObject.centros_gestores.length > 0
          ? globalObject.centros_gestores
          : window.CENTROS_GESTORES,
      ),
      estados: normalizeOptions(
        globalObject.estados && globalObject.estados.length > 0
          ? globalObject.estados
          : window.ESTADOS,
      ),
      tipos_intervencion: normalizeOptions(
        globalObject.tipos_intervencion &&
          globalObject.tipos_intervencion.length > 0
          ? globalObject.tipos_intervencion
          : window.TIPOS_INTERVENCION,
      ),
      identificadores: normalizeOptions(
        globalObject.identificadores && globalObject.identificadores.length > 0
          ? globalObject.identificadores
          : window.IDENTIFICADORES,
      ),
    };
  };

  const publishGlobalFilterOptions = (options: GlobalFilterOptions) => {
    if (typeof window === "undefined") return;
    const existing = window.UNIDADES_PROYECTO_FILTERS_GLOBAL || {};
    const mergedCatalog: GlobalFilterCatalog = {
      ...existing,
      centros_gestores: pickFirstNonEmpty(
        options.centros_gestores,
        existing.centros_gestores,
      ),
      estados: pickFirstNonEmpty(options.estados, existing.estados),
      tipos_intervencion: pickFirstNonEmpty(
        options.tipos_intervencion,
        existing.tipos_intervencion,
      ),
      identificadores: pickFirstNonEmpty(
        options.identificadores,
        existing.identificadores,
      ),
    };

    window.UNIDADES_PROYECTO_FILTERS_GLOBAL = mergedCatalog;
    window.CENTROS_GESTORES = normalizeOptions(mergedCatalog.centros_gestores);
    window.ESTADOS = normalizeOptions(mergedCatalog.estados);
    window.TIPOS_INTERVENCION = normalizeOptions(
      mergedCatalog.tipos_intervencion,
    );
    window.IDENTIFICADORES = normalizeOptions(mergedCatalog.identificadores);
    window.dispatchEvent(new Event("up-filters-updated"));
  };

  useEffect(() => {
    const globalOptions = readGlobalFilterOptions();
    if (globalOptions.centros_gestores.length > 0)
      setAvailableCentrosGestores(globalOptions.centros_gestores);
    if (globalOptions.estados.length > 0)
      setAvailableSeverities(globalOptions.estados);
    if (globalOptions.tipos_intervencion.length > 0)
      setAvailablePriorities(globalOptions.tipos_intervencion);
    if (globalOptions.identificadores.length > 0)
      setAvailableIdentificadores(globalOptions.identificadores);
  }, []);

  useEffect(() => {
    const hydrateGlobalOptionsFromRecords = async () => {
      const globalOptions = readGlobalFilterOptions();
      const hasAllGlobalOptions =
        globalOptions.centros_gestores.length > 0 &&
        globalOptions.estados.length > 0 &&
        globalOptions.tipos_intervencion.length > 0 &&
        globalOptions.identificadores.length > 0;

      if (hasAllGlobalOptions) return;

      try {
        await firebaseAuth.authStateReady();
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        const response = await fetch(
          `${API_BASE_URL}/intervenciones?limit=10000`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) return;

        const json = await response.json();
        let records = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : [];

        // Filtrar intervenciones por centro gestor del usuario si es restringido
        if (!canViewAll && userCentroGestor) {
          const normalizeVal = (v: unknown) =>
            String(v || "")
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim()
              .toLowerCase();
          const normalizedUser = normalizeVal(userCentroGestor);
          records = records.filter((item: any) => {
            const itemCentro = normalizeVal(
              item?.nombre_centro_gestor || item?.centro_gestor,
            );
            return (
              itemCentro === normalizedUser ||
              itemCentro.includes(normalizedUser) ||
              normalizedUser.includes(itemCentro)
            );
          });
        }

        const merged: GlobalFilterOptions = {
          centros_gestores: normalizeOptions([
            ...globalOptions.centros_gestores,
            ...records.map(
              (item: any) => item?.nombre_centro_gestor || item?.centro_gestor,
            ),
          ]),
          estados: normalizeOptions([
            ...globalOptions.estados,
            ...records.map((item: any) => item?.estado),
          ]),
          tipos_intervencion: normalizeOptions([
            ...globalOptions.tipos_intervencion,
            ...records.map((item: any) => item?.tipo_intervencion),
          ]),
          identificadores: normalizeOptions([
            ...globalOptions.identificadores,
            ...records.map((item: any) => item?.identificador),
          ]),
        };

        publishGlobalFilterOptions(merged);
        setAvailableCentrosGestores(merged.centros_gestores);
        setAvailableSeverities(merged.estados);
        setAvailablePriorities(merged.tipos_intervencion);
        setAvailableIdentificadores(merged.identificadores);
      } catch {
        // Fallback silencioso: la UI mantiene placeholders hasta siguiente carga.
      }
    };

    hydrateGlobalOptionsFromRecords();
  }, [API_BASE_URL, canViewAll, userCentroGestor]);

  // Definición de tabs - quality-control endpoints de la API
  const tabs = [
    {
      id: "summary" as TabType,
      label: "Resumen",
      icon: CheckCircle2,
      endpoint: "/unidades-proyecto/quality-control/summary",
      description: "Resumen general de calidad de datos (ISO/DAMA)",
    },
    {
      id: "records" as TabType,
      label: "Registros",
      icon: ClipboardList,
      endpoint: "/unidades-proyecto/quality-control/records",
      description: "Todos los registros de control de calidad",
    },
    {
      id: "changelog" as TabType,
      label: "Historial",
      icon: History,
      endpoint: "/unidades-proyecto/quality-control/changelog",
      description: "Historial de cambios en control de calidad",
    },
    {
      id: "by-centro-gestor" as TabType,
      label: "Por Centro Gestor",
      icon: Building2,
      endpoint: "/unidades-proyecto/quality-control/by-centro-gestor",
      description: "Control de calidad agrupado por centro gestor",
    },
    {
      id: "stats" as TabType,
      label: "Estadísticas",
      icon: TrendingUp,
      endpoint: "/unidades-proyecto/quality-control/stats",
      description: "Estadísticas de control de calidad",
    },
    ...(canViewAnalisisProcesos
      ? [
          {
            id: "analisis-procesos" as TabType,
            label: "Análisis por procesos",
            icon: GitBranch,
            endpoint: "",
            description: "Agrupaciones por centro gestor, proceso y contrato",
          },
        ]
      : []),
    {
      id: "gestionar-registros" as TabType,
      label: "Gestionar Registros",
      icon: FilePenLine,
      endpoint: "",
      description:
        "Crear, eliminar y solicitar cambios de UPs e intervenciones",
    },
    {
      id: "avances-up" as TabType,
      label: "Avances UP",
      icon: FileText,
      endpoint: "/avances_unidades_proyecto",
      description:
        "Avances agrupados por centro gestor: cuáles reportaron, cuáles no, historial",
    },
    ...(canViewSolicitudesTabs
      ? [
          {
            id: "solicitudes-pendientes" as TabType,
            label: "Solicitudes Pendientes",
            icon: ShieldCheck,
            endpoint: "",
            description: "Revisar y aprobar/rechazar solicitudes de cambio",
          },
          {
            id: "historial-solicitudes" as TabType,
            label: "Historial Solicitudes",
            icon: Archive,
            endpoint: "",
            description:
              "Ver todas las solicitudes de cambio (pendientes, aprobadas, rechazadas)",
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (
      !canViewSolicitudesTabs &&
      (activeTab === "solicitudes-pendientes" ||
        activeTab === "historial-solicitudes")
    ) {
      setActiveTab("summary");
      setCurrentPage(1);
    }
    if (!canViewAnalisisProcesos && activeTab === "analisis-procesos") {
      setActiveTab("summary");
      setCurrentPage(1);
    }
  }, [activeTab, canViewSolicitudesTabs, canViewAnalisisProcesos]);

  const pickFirst = (...values: any[]) =>
    values.find((value) => value !== undefined && value !== null);

  const normalizeLookupKey = (key: string) =>
    String(key || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const pickFromSourceByAliases = (source: any, aliases: string[]) => {
    if (!source || typeof source !== "object") return undefined;

    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(source, alias)) {
        return source[alias];
      }
    }

    const aliasSet = new Set(aliases.map((alias) => normalizeLookupKey(alias)));
    const sourceEntries = Object.entries(source);
    const match = sourceEntries.find(([key]) =>
      aliasSet.has(normalizeLookupKey(key)),
    );

    return match ? match[1] : undefined;
  };

  const mapSeverityCode = (code?: string) => {
    const normalized = String(code || "").toUpperCase();
    if (
      normalized === "CRITICAL" ||
      normalized === "HIGH" ||
      normalized === "MEDIUM" ||
      normalized === "LOW"
    )
      return normalized;
    if (normalized === "ALTA") return "HIGH";
    if (normalized === "MEDIA") return "MEDIUM";
    if (normalized === "BAJA") return "LOW";
    if (normalized === "S1") return "CRITICAL";
    if (normalized === "S2") return "HIGH";
    if (normalized === "S3") return "MEDIUM";
    return "LOW";
  };

  const mapPriorityCode = (value: any) => {
    const normalized = String(value || "").toUpperCase();
    if (
      normalized === "P0" ||
      normalized === "P1" ||
      normalized === "P2" ||
      normalized === "P3"
    )
      return normalized;
    if (normalized === "URGENT") return "P0";
    if (normalized === "HIGH" || normalized === "ALTA") return "P1";
    if (normalized === "MEDIUM" || normalized === "MEDIA") return "P2";
    if (normalized === "LOW" || normalized === "BAJA") return "P3";
    return "P3";
  };

  const toNumber = (value: any, fallback: number = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const normalizePriorityValue = (value: any): string => {
    if (typeof value === "string" || typeof value === "number")
      return String(value).toUpperCase();
    if (value && typeof value === "object") {
      if (value.code) return String(value.code).toUpperCase();
      if (value.label) return String(value.label);
    }
    return "P3";
  };

  const normalizeDimensionLabel = (value: any) => {
    const raw = String(value || "").trim();
    return raw || "no_clasificado";
  };

  const getRecordsArrayFromCalidadDatos = (source: any): any[] => {
    const recordsRoot = pickFirst(
      source.registros,
      source.records,
      source.data_records,
      source.detalle_registros,
      source.issues,
    );

    const isRecordLike = (item: any) => {
      if (!item || typeof item !== "object" || Array.isArray(item))
        return false;
      const keys = Object.keys(item);
      return (
        keys.includes("upid") ||
        keys.includes("intervencion_id") ||
        keys.includes("nombre_up") ||
        keys.includes("nombre_intervencion") ||
        keys.includes("diagnostico") ||
        keys.includes("diagnostico_calidad") ||
        keys.includes("quality_diagnostics") ||
        keys.includes("issues") ||
        keys.includes("hallazgos") ||
        keys.includes("problemas")
      );
    };

    const normalizeEntryArray = (entry: any, collectionKey?: string): any[] => {
      let rawList: any[] = [];

      if (Array.isArray(entry)) {
        rawList = entry;
      } else if (entry && typeof entry === "object") {
        if (Array.isArray(entry.items)) rawList = entry.items;
        else if (Array.isArray(entry.records)) rawList = entry.records;
        else if (Array.isArray(entry.data)) rawList = entry.data;
        else if (isRecordLike(entry)) rawList = [entry];
      }

      return rawList
        .filter((item) => isRecordLike(item))
        .map((item) => ({
          ...item,
          __collection_key: collectionKey || item?.__collection_key,
        }));
    };

    if (Array.isArray(recordsRoot)) return normalizeEntryArray(recordsRoot);
    if (recordsRoot && Array.isArray(recordsRoot.items))
      return normalizeEntryArray(recordsRoot.items);
    if (recordsRoot && Array.isArray(recordsRoot.records))
      return normalizeEntryArray(recordsRoot.records);
    if (recordsRoot && Array.isArray(recordsRoot.data))
      return normalizeEntryArray(recordsRoot.data);

    if (recordsRoot && typeof recordsRoot === "object") {
      const merged: any[] = [];
      Object.entries(recordsRoot).forEach(([key, value]) => {
        if (key === "rules" || key === "count") return;
        merged.push(...normalizeEntryArray(value, key));
      });
      if (merged.length > 0) return merged;
    }

    if (source.collections && typeof source.collections === "object") {
      const mergedFromCollections: any[] = [];
      Object.entries(source.collections).forEach(([key, value]) => {
        mergedFromCollections.push(...normalizeEntryArray(value, key));
      });
      if (mergedFromCollections.length > 0) return mergedFromCollections;
    }

    return [];
  };

  const mapIssueFromDiagnostico = (issue: any, fallbackIndex: number) => {
    const severity = mapSeverityCode(
      pickFirst(
        issue?.severity,
        issue?.nivel,
        issue?.severity_code,
        issue?.criticality,
        issue?.criticidad,
      ),
    );
    const dimension = normalizeDimensionLabel(
      pickFirst(
        issue?.dimension,
        issue?.dimension_name,
        issue?.categoria,
        issue?.tipo,
      ),
    );

    return {
      rule_id: String(
        pickFirst(
          issue?.rule_id,
          issue?.codigo_regla,
          issue?.id,
          issue?.code,
          `R-${fallbackIndex + 1}`,
        ),
      ),
      rule_name: String(
        pickFirst(
          issue?.rule_name,
          issue?.regla,
          issue?.nombre,
          issue?.name,
          "Regla de calidad",
        ),
      ),
      dimension,
      severity,
      field_name: String(
        pickFirst(
          issue?.field_name,
          issue?.campo,
          issue?.field,
          issue?.atributo,
          "N/A",
        ),
      ),
      current_value: pickFirst(
        issue?.current_value,
        issue?.valor_actual,
        issue?.actual,
        issue?.value,
      ),
      expected_value: pickFirst(
        issue?.expected_value,
        issue?.valor_esperado,
        issue?.expected,
      ),
      suggestion: String(
        pickFirst(
          issue?.suggestion,
          issue?.sugerencia,
          issue?.recommendation,
          issue?.accion_recomendada,
          "Revisar y corregir el dato en origen",
        ),
      ),
      details: String(
        pickFirst(
          issue?.details,
          issue?.detalle,
          issue?.description,
          issue?.mensaje,
          issue?.message,
          "Sin detalles",
        ),
      ),
    };
  };

  const aggregateCountsFromIssues = (issues: any[]) => {
    const severityCounts: Record<string, number> = {};
    const dimensionCounts: Record<string, number> = {};

    issues.forEach((issue) => {
      const severity = mapSeverityCode(issue?.severity);
      const dimension = normalizeDimensionLabel(issue?.dimension);
      severityCounts[severity] = (severityCounts[severity] || 0) + 1;
      dimensionCounts[dimension] = (dimensionCounts[dimension] || 0) + 1;
    });

    return { severityCounts, dimensionCounts };
  };

  const buildSummaryFromCalidadDatos = (source: any) => {
    const resumen =
      pickFirst(
        source.resumen,
        source.summary,
        source.resumen_ejecutivo,
        source.metricas_generales,
      ) || {};
    const overall = source.overall || {};
    const rules = Array.isArray(source.rules) ? source.rules : [];
    const records = buildRecordsFromCalidadDatos(source);
    const recordsWithIssues = records.filter(
      (record: any) => toNumber(record.total_issues) > 0,
    );

    const severityFromRecords = records.reduce(
      (acc: Record<string, number>, record: any) => {
        Object.entries(record?.severity_counts || {}).forEach(
          ([severity, count]) => {
            acc[severity] = (acc[severity] || 0) + toNumber(count);
          },
        );
        return acc;
      },
      {},
    );

    const dimensionFromRecords = records.reduce(
      (acc: Record<string, number>, record: any) => {
        Object.entries(record?.dimension_counts || {}).forEach(
          ([dimension, count]) => {
            acc[dimension] = (acc[dimension] || 0) + toNumber(count);
          },
        );
        return acc;
      },
      {},
    );

    const severityDistribution = rules.reduce(
      (acc: Record<string, number>, rule: any) => {
        const severity = mapSeverityCode(rule?.severity?.code);
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {},
    );

    const dimensionDistribution = rules.reduce(
      (acc: Record<string, number>, rule: any) => {
        const dimension = rule?.dimension || "no_clasificado";
        const affected = toNumber(rule?.scope?.affected_records);
        acc[dimension] = (acc[dimension] || 0) + affected;
        return acc;
      },
      {},
    );

    const recommendations = (
      Array.isArray(resumen.hallazgos_principales)
        ? resumen.hallazgos_principales
        : []
    ).map((item: any) => ({
      category: item?.category || "General",
      priority: normalizePriorityValue(item?.priority),
      recommendation:
        item?.recommendation || item?.description || String(item || ""),
    }));

    return {
      ...resumen,
      report_id: source.report_id || resumen.report_id,
      report_timestamp: source.generated_at || resumen.generated_at,
      global_quality_score: toNumber(
        resumen.data_quality_score,
        toNumber(overall.quality_score),
      ),
      error_rate: toNumber(
        resumen.error_rate,
        100 -
          toNumber(resumen.data_quality_score, toNumber(overall.quality_score)),
      ),
      total_records_validated: toNumber(
        resumen.total_registros,
        toNumber(overall.total_records, records.length),
      ),
      records_with_issues: toNumber(
        resumen.registros_con_problemas,
        recordsWithIssues.length,
      ),
      records_without_issues: Math.max(
        0,
        toNumber(
          resumen.total_registros,
          toNumber(overall.total_records, records.length),
        ) - toNumber(resumen.registros_con_problemas, recordsWithIssues.length),
      ),
      total_issues_found: toNumber(
        resumen.total_hallazgos,
        toNumber(
          overall.total_issues,
          records.reduce(
            (acc: number, record: any) => acc + toNumber(record.total_issues),
            0,
          ),
        ),
      ),
      system_status: (
        resumen?.clasificacion?.status ||
        source?.overall?.classification?.status ||
        "NORMAL"
      ).toUpperCase(),
      requires_immediate_action: ["CRITICAL", "WARNING", "ACEPTABLE"].includes(
        (resumen?.clasificacion?.status || "").toUpperCase(),
      ),
      severity_distribution:
        Object.keys(severityDistribution).length > 0
          ? severityDistribution
          : severityFromRecords,
      dimension_distribution:
        Object.keys(dimensionDistribution).length > 0
          ? dimensionDistribution
          : dimensionFromRecords,
      top_quality_centros: [],
      top_problematic_centros: [],
      recommendations,
      overall_trend: source.overall_trend,
      trends_summary: source.trends_summary,
      trends_count: source.trends_count,
      has_comparison_data: source.has_comparison_data,
    };
  };

  const buildRecordsFromCalidadDatos = (source: any) => {
    const registros = getRecordsArrayFromCalidadDatos(source);

    if (registros.length > 0) {
      return registros.map((registro: any, index: number) => {
        const diagnostico =
          pickFirst(
            registro?.diagnostico,
            registro?.diagnostico_calidad,
            registro?.quality_diagnostics,
            registro?.quality,
            {},
          ) || {};
        const rawIssues = pickFirst(
          diagnostico?.issues,
          diagnostico?.hallazgos,
          diagnostico?.problemas,
          registro?.issues,
          registro?.hallazgos,
          registro?.problemas,
          [],
        );

        const issues = Array.isArray(rawIssues)
          ? rawIssues.map((issue: any, issueIndex: number) =>
              mapIssueFromDiagnostico(issue, issueIndex),
            )
          : rawIssues && typeof rawIssues === "object"
            ? Object.entries(rawIssues)
                .filter(
                  ([, value]) => toNumber((value as any)?.count ?? value) > 0,
                )
                .map(([key, value], issueIndex) =>
                  mapIssueFromDiagnostico(
                    {
                      rule_id: key,
                      rule_name: key,
                      field_name: key,
                      details:
                        typeof value === "object"
                          ? JSON.stringify(value)
                          : `Hallazgo detectado: ${key}`,
                      current_value: value,
                      severity: pickFirst(
                        (value as any)?.severity,
                        diagnostico?.max_severity,
                        registro?.max_severity,
                      ),
                      dimension: pickFirst(
                        (value as any)?.dimension,
                        "no_clasificado",
                      ),
                    },
                    issueIndex,
                  ),
                )
            : [];

        const fallbackCounts = aggregateCountsFromIssues(issues);
        const severityCounts =
          Object.keys(fallbackCounts.severityCounts).length > 0
            ? fallbackCounts.severityCounts
            : diagnostico?.severity_counts ||
              diagnostico?.by_severity ||
              registro?.severity_counts ||
              {};

        const dimensionCounts =
          Object.keys(fallbackCounts.dimensionCounts).length > 0
            ? fallbackCounts.dimensionCounts
            : diagnostico?.dimension_counts ||
              diagnostico?.by_dimension ||
              registro?.dimension_counts ||
              {};

        const totalIssues = toNumber(
          pickFirst(
            diagnostico?.total_issues,
            diagnostico?.issues_count,
            diagnostico?.total_hallazgos,
            registro?.total_issues,
            registro?.issues_count,
            issues.length,
          ),
        );

        const maxSeverity = mapSeverityCode(
          pickFirst(
            diagnostico?.max_severity,
            diagnostico?.severidad_maxima,
            registro?.max_severity,
            registro?.severity,
            issues[0]?.severity,
          ),
        );

        const priority = mapPriorityCode(
          pickFirst(
            diagnostico?.priority,
            diagnostico?.prioridad,
            registro?.priority,
            registro?.prioridad,
          ),
        );

        const affectedFields = Array.from(
          new Set(issues.map((issue) => issue.field_name).filter(Boolean)),
        );

        return {
          id: String(
            pickFirst(
              registro?.id,
              registro?.upid,
              registro?.document_id,
              `registro-${index}`,
            ),
          ),
          upid: String(
            pickFirst(
              registro?.upid,
              registro?.intervencion_id,
              registro?.id,
              registro?.codigo,
              `UP-${index + 1}`,
            ),
          ),
          nombre_up: String(
            pickFirst(
              registro?.nombre_up,
              registro?.nombre_intervencion,
              registro?.nombre,
              registro?.nombre_proyecto,
              "Registro de calidad",
            ),
          ),
          nombre_centro_gestor: String(
            pickFirst(
              registro?.nombre_centro_gestor,
              registro?.centro_gestor,
              registro?.organismo,
              "Centro no especificado",
            ),
          ),
          identificador: String(pickFirst(registro?.identificador, "")),
          total_issues: totalIssues,
          max_severity: maxSeverity,
          priority,
          issues,
          affected_fields: affectedFields,
          severity_counts: severityCounts,
          dimension_counts: dimensionCounts,
          source_record: registro,
        };
      });
    }

    const rulesArray = Array.isArray(source?.rules) ? source.rules : [];

    return rulesArray.map((rule: any, index: number) => {
      const affected = toNumber(rule?.scope?.affected_records);
      const evaluated = toNumber(rule?.scope?.evaluated_records);
      const priorityCode = mapPriorityCode(rule?.priority?.code);
      const severity = mapSeverityCode(rule?.severity?.code);

      return {
        id: rule?.rule_id || `rule-${index}`,
        upid: rule?.rule_id || `RULE-${index + 1}`,
        nombre_up: rule?.name || "Regla de calidad",
        nombre_centro_gestor: rule?.collection || "Colección no especificada",
        total_issues: affected,
        max_severity: severity,
        priority: priorityCode,
        issues: [
          {
            rule_id: rule?.rule_id || `RULE-${index + 1}`,
            rule_name: rule?.name || "Regla",
            dimension: rule?.dimension || "no_clasificado",
            severity,
            field_name: rule?.collection || "coleccion",
            current_value: {
              affected_records: affected,
              evaluated_records: evaluated,
              compliance_pct: toNumber(rule?.result?.compliance_pct),
            },
            expected_value: {
              affected_records: 0,
              compliance_pct: 100,
            },
            suggestion: rule?.description || "Revisar cumplimiento de la regla",
            details: rule?.description || "Sin detalles",
          },
        ],
        affected_fields: [rule?.collection || "coleccion"],
        severity_counts: { [severity]: affected },
        dimension_counts: { [rule?.dimension || "no_clasificado"]: affected },
      };
    });
  };

  const buildCentrosFromCalidadDatos = (source: any) => {
    const root =
      pickFirst(
        source.por_centro_gestor,
        source.by_centro_gestor,
        source.byCentroGestor,
        source["by-centro-gestor"],
      ) || {};
    const centros = Array.isArray(root.centros)
      ? root.centros
      : Array.isArray(root)
        ? root
        : [];

    if (centros.length === 0) {
      const records = buildRecordsFromCalidadDatos(source);
      if (records.length === 0) return [];

      const grouped = new Map<string, any[]>();
      records.forEach((record: any) => {
        const centro = String(
          record?.nombre_centro_gestor || "Centro no especificado",
        );
        const current = grouped.get(centro) || [];
        current.push(record);
        grouped.set(centro, current);
      });

      return Array.from(grouped.entries()).map(
        ([nombreCentro, centroRecords], index) => {
          const totalRecords = centroRecords.length;
          const recordsWithIssues = centroRecords.filter(
            (record) => toNumber(record.total_issues) > 0,
          ).length;
          const totalIssues = centroRecords.reduce(
            (acc, record) => acc + toNumber(record.total_issues),
            0,
          );
          const qualityScore =
            totalRecords > 0
              ? Number(
                  ((1 - recordsWithIssues / totalRecords) * 100).toFixed(2),
                )
              : 100;

          const severityCounts: Record<string, number> = {};
          const dimensionCounts: Record<string, number> = {};
          const fieldCounts: Record<string, number> = {};

          centroRecords.forEach((record) => {
            Object.entries(record?.severity_counts || {}).forEach(
              ([severity, count]) => {
                severityCounts[severity] =
                  (severityCounts[severity] || 0) + toNumber(count);
              },
            );
            Object.entries(record?.dimension_counts || {}).forEach(
              ([dimension, count]) => {
                dimensionCounts[dimension] =
                  (dimensionCounts[dimension] || 0) + toNumber(count);
              },
            );
            (record?.affected_fields || []).forEach((field: string) => {
              fieldCounts[field] = (fieldCounts[field] || 0) + 1;
            });
          });

          const topProblematicFields = Object.entries(fieldCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([field, count]) => ({ field, count }));

          return {
            id: `${nombreCentro}-${index}`,
            nombre_centro_gestor: nombreCentro,
            total_records: totalRecords,
            records_with_issues: recordsWithIssues,
            records_without_issues: Math.max(
              0,
              totalRecords - recordsWithIssues,
            ),
            total_issues: totalIssues,
            quality_score: qualityScore,
            error_rate:
              totalRecords > 0
                ? Number(((recordsWithIssues / totalRecords) * 100).toFixed(2))
                : 0,
            status:
              qualityScore >= 95
                ? "OPTIMO"
                : qualityScore >= 85
                  ? "ACEPTABLE"
                  : "CRITICAL",
            requires_attention: qualityScore < 85,
            severity_counts: severityCounts,
            dimension_counts: dimensionCounts,
            top_violated_rules: [],
            top_problematic_fields: topProblematicFields,
            affected_records_sample: centroRecords
              .slice(0, 10)
              .map((record) => String(record.upid)),
          };
        },
      );
    }

    return centros.map((centro: any, index: number) => {
      const totalRecords = toNumber(centro?.total_intervenciones);
      const issuesObj = centro?.issues || {};
      const invalidRanges = issuesObj?.invalid_ranges || {};
      const totalIssues =
        toNumber(issuesObj?.missing_required_fields) +
        toNumber(issuesObj?.estado_vs_avance_inconsistente) +
        toNumber(issuesObj?.intervencion_id_duplicates) +
        toNumber(issuesObj?.without_fecha_inicio) +
        toNumber(issuesObj?.without_fecha_fin) +
        toNumber(invalidRanges?.avance_obra) +
        toNumber(invalidRanges?.presupuesto_base);

      const recordsWithIssues = Math.min(totalRecords, totalIssues);
      const score = toNumber(centro?.dqs?.score);
      const status = (centro?.dqs?.classification?.status || "").toUpperCase();

      const severityCounts: Record<string, number> = {};
      const bySeverity = centro?.dqs?.by_severity || {};
      Object.entries(bySeverity).forEach(([sevCode, data]: [string, any]) => {
        severityCounts[mapSeverityCode(sevCode)] = toNumber(data?.rules);
      });

      const topProblematicFields = [
        {
          field: "missing_required_fields",
          count: toNumber(issuesObj?.missing_required_fields),
        },
        {
          field: "estado_vs_avance_inconsistente",
          count: toNumber(issuesObj?.estado_vs_avance_inconsistente),
        },
        {
          field: "intervencion_id_duplicates",
          count: toNumber(issuesObj?.intervencion_id_duplicates),
        },
        {
          field: "without_fecha_inicio",
          count: toNumber(issuesObj?.without_fecha_inicio),
        },
        {
          field: "without_fecha_fin",
          count: toNumber(issuesObj?.without_fecha_fin),
        },
      ].filter((item) => item.count > 0);

      return {
        id: `${centro?.nombre_centro_gestor || "centro"}-${index}`,
        nombre_centro_gestor:
          centro?.nombre_centro_gestor || "Centro no especificado",
        total_records: totalRecords,
        records_with_issues: recordsWithIssues,
        records_without_issues: Math.max(0, totalRecords - recordsWithIssues),
        total_issues: totalIssues,
        quality_score: score,
        error_rate:
          totalRecords > 0
            ? Number(((recordsWithIssues / totalRecords) * 100).toFixed(2))
            : 0,
        status,
        requires_attention: status === "CRITICAL" || score < 95,
        severity_counts: severityCounts,
        dimension_counts: {
          completitud: toNumber(issuesObj?.missing_required_fields),
          validez_conformidad:
            toNumber(invalidRanges?.avance_obra) +
            toNumber(invalidRanges?.presupuesto_base),
          consistencia: toNumber(issuesObj?.estado_vs_avance_inconsistente),
          unicidad: toNumber(issuesObj?.intervencion_id_duplicates),
          oportunidad_actualidad:
            toNumber(issuesObj?.without_fecha_inicio) +
            toNumber(issuesObj?.without_fecha_fin),
        },
        top_violated_rules: [],
        top_problematic_fields: topProblematicFields,
        affected_records_sample: [],
      };
    });
  };

  const buildMetadataFromCalidadDatos = (source: any) => {
    const metadatos =
      pickFirst(
        source.metadatos,
        source.metadata,
        source.meta,
        source.configuracion,
      ) || {};
    const overall = source.overall || {};
    const centrosRoot = source.por_centro_gestor || {};
    const totalCentros = toNumber(centrosRoot.total_centros);
    const records = buildRecordsFromCalidadDatos(source);
    const recordsWithIssues = records.filter(
      (record: any) => toNumber(record.total_issues) > 0,
    ).length;

    return {
      id: source.report_id || "calidad-datos-metadata",
      report_id: source.report_id || "N/A",
      version: source.framework || "ISO/DAMA",
      generated_at: source.generated_at || new Date().toISOString(),
      counts: {
        total_records: toNumber(overall.total_records, records.length),
        total_centros:
          totalCentros ||
          new Set(
            records
              .map((record: any) => record.nombre_centro_gestor)
              .filter(Boolean),
          ).size,
        total_issues: toNumber(overall.total_issues),
        records_with_issues: recordsWithIssues,
        centros_require_attention: 0,
      },
      filters: {
        centros_gestores: [],
        severities: ["S1", "S2", "S3", "S4"],
        priorities: Object.keys(source.priorities || {}).map((key) =>
          key.toUpperCase(),
        ),
        dimensions: Array.isArray(metadatos.dimensions)
          ? metadatos.dimensions
          : [],
        statuses: ["OPTIMO", "ACEPTABLE", "CRITICAL"],
      },
      standards: metadatos.standards,
      dimensions: metadatos.dimensions,
      collections_evaluadas: metadatos.collections_evaluadas,
      cache_ttl_seconds: metadatos.cache_ttl_seconds,
      history_limit: metadatos.history_limit,
      colors: {},
      charts: {},
    };
  };

  const buildStatsFromCalidadDatos = (source: any) => {
    const stats =
      pickFirst(
        source.estadisticas_globales,
        source.stats,
        source.estadisticas,
        source.metrics,
        source.metricas,
        source.kpis,
      ) || {};
    const overall = stats.overall || {};
    const byDimension = Array.isArray(stats.by_dimension)
      ? stats.by_dimension
      : [];
    const byCollection = stats.by_collection || {};

    const byCollectionTotal = Object.values(byCollection).reduce(
      (acc: number, entry: any) => acc + toNumber(entry?.total),
      0,
    );
    const records = buildRecordsFromCalidadDatos(source);
    const recordsWithIssues = records.filter(
      (record: any) => toNumber(record.total_issues) > 0,
    ).length;

    return {
      timestamp: source.generated_at || new Date().toISOString(),
      data: {
        overall: {
          collection: "overall",
          count: toNumber(overall.total_records, records.length),
        },
        by_dimension: {
          collection: "by_dimension",
          count: byDimension.length,
        },
        by_collection: {
          collection: "by_collection",
          count: byCollectionTotal || records.length,
        },
        registros_con_problemas: {
          collection: "records_with_issues",
          count: recordsWithIssues,
        },
        total_hallazgos: {
          collection: "total_issues",
          count: records.reduce(
            (acc: number, record: any) => acc + toNumber(record.total_issues),
            0,
          ),
        },
      },
      raw: stats,
    };
  };

  const buildChangelogFromCalidadDatos = (source: any) => {
    const historialRoot =
      pickFirst(
        source.historial,
        source.changelog,
        source.cambios,
        source.change_log,
      ) || {};
    const items = Array.isArray(historialRoot.items)
      ? historialRoot.items
      : Array.isArray(historialRoot)
        ? historialRoot
        : [];

    if (items.length > 0) {
      return items.map((item: any, index: number) => {
        const next = items[index + 1];
        return {
          id: item?.report_id || `history-${index}`,
          upid: item?.report_id || `history-${index}`,
          document_id: item?.report_id || `history-${index}`,
          action: "updated",
          timestamp: item?.generated_at || source.generated_at,
          old_report_id: next?.report_id || item?.report_id || "N/A",
          new_report_id: item?.report_id || "N/A",
          changes: {
            dqs_score: {
              old: next?.dqs_score ?? item?.dqs_score,
              new: item?.dqs_score,
            },
            total_issues: {
              old: next?.total_issues ?? item?.total_issues,
              new: item?.total_issues,
            },
          },
        };
      });
    }

    const records = buildRecordsFromCalidadDatos(source);
    return records
      .filter((record: any) => toNumber(record.total_issues) > 0)
      .slice(0, 100)
      .map((record: any, index: number) => ({
        id: `record-change-${record.id || index}`,
        upid: record.upid,
        document_id: record.id || record.upid,
        action: "updated",
        timestamp: source.generated_at || new Date().toISOString(),
        old_report_id: source.report_id || "N/A",
        new_report_id: source.report_id || "N/A",
        changes: {
          diagnostico_total_issues: {
            old: 0,
            new: toNumber(record.total_issues),
          },
          severidad_maxima: {
            old: "N/A",
            new: record.max_severity || "LOW",
          },
        },
      }));
  };

  const extractTabDataFromCalidadDatos = (result: any, tab: TabType) => {
    const source =
      result?.data && typeof result.data === "object" ? result.data : result;

    if (!source || typeof source !== "object") {
      return { found: false, payload: null };
    }

    const summaries = [
      source.summary,
      source.resumen,
      source.resumen_ejecutivo,
      source.metricas_generales,
      source.quality_summary,
      source.latest_summary,
    ];

    const records = [
      source.records,
      source.registros,
      source.data_records,
      source.detalle_registros,
      source.issues,
      source.data,
    ];

    const changelog = [
      source.changelog,
      source.historial,
      source.cambios,
      source.change_log,
    ];

    const byCentro = [
      source.by_centro_gestor,
      source.byCentroGestor,
      source.por_centro_gestor,
      source["by-centro-gestor"],
    ];

    const metadata = [
      source.metadata,
      source.metadatos,
      source.meta,
      source.configuracion,
    ];

    const stats = [
      source.stats,
      source.estadisticas_globales,
      source.estadisticas,
      source.metrics,
      source.metricas,
      source.kpis,
      pickFromSourceByAliases(source, [
        "Estadisticas",
        "Estadísticas",
        "estadisticas_globales",
        "estadísticas_globales",
      ]),
    ];

    if (tab === "summary") {
      const hasSummary = Boolean(pickFirst(...summaries, source.overall));
      if (!hasSummary) return { found: false, payload: null };
      return {
        found: true,
        payload: { success: true, data: buildSummaryFromCalidadDatos(source) },
      };
    }

    if (tab === "records") {
      const payload = pickFirst(...records);
      const hasRules = Array.isArray(source?.rules) && source.rules.length > 0;
      if (!payload && !hasRules) return { found: false, payload: null };
      return {
        found: true,
        payload: { success: true, data: buildRecordsFromCalidadDatos(source) },
      };
    }

    if (tab === "changelog") {
      const payload = pickFirst(...changelog);
      const hasRecords = getRecordsArrayFromCalidadDatos(source).length > 0;
      if (!payload && !hasRecords) return { found: false, payload: null };
      return {
        found: true,
        payload: {
          success: true,
          data: buildChangelogFromCalidadDatos(source),
        },
      };
    }

    if (tab === "by-centro-gestor") {
      const payload = pickFirst(...byCentro);
      const hasRecords = getRecordsArrayFromCalidadDatos(source).length > 0;
      if (!payload && !hasRecords) return { found: false, payload: null };
      return {
        found: true,
        payload: { success: true, data: buildCentrosFromCalidadDatos(source) },
      };
    }

    if (tab === "stats") {
      const payload = pickFirst(...stats);
      const hasRecords = getRecordsArrayFromCalidadDatos(source).length > 0;
      if ((!payload || typeof payload !== "object") && !hasRecords)
        return { found: false, payload: null };
      return { found: true, payload: buildStatsFromCalidadDatos(source) };
    }

    return { found: false, payload: null };
  };

  const fetchJson = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      // Obtener token Firebase para autenticar el request en el backend.
      const headers: Record<string, string> = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      };
      try {
        // Esperar a que Firebase restaure la sesión persistida antes de leer currentUser.
        if (
          firebaseAuth &&
          typeof (firebaseAuth as any).authStateReady === "function"
        ) {
          await (firebaseAuth as any).authStateReady();
        }
        const currentUser = firebaseAuth?.currentUser;
        if (currentUser) {
          // forceRefresh=true para traer los custom claims más recientes (rol/centro).
          const token = await currentUser.getIdToken(true);
          if (token) headers["Authorization"] = `Bearer ${token}`;
        } else {
          const err: any = new Error(
            "No autenticado: inicia sesión para acceder a esta sección.",
          );
          err.status = 401;
          throw err;
        }
      } catch (tokenErr: any) {
        if (tokenErr?.status === 401) throw tokenErr;
        // Si falla obtener token, dejamos que el backend responda 401 y se maneje abajo.
      }

      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        // Intentar extraer detail/error del backend para un mensaje más útil.
        let backendDetail = "";
        try {
          const payload = await response.clone().json();
          backendDetail =
            payload?.detail || payload?.error || payload?.message || "";
        } catch {
          /* ignore */
        }
        const err: any = new Error(
          backendDetail || `Error ${response.status}: ${response.statusText}`,
        );
        err.status = response.status;
        throw err;
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Función para cargar datos según el tab activo
  const loadData = async () => {
    // Los tabs con componentes autónomos no necesitan cargar datos aquí
    const autonomousTabs: TabType[] = [
      "gestionar-registros",
      "avances-up",
      "solicitudes-pendientes",
      "historial-solicitudes",
      "analisis-procesos",
    ];
    if (autonomousTabs.includes(activeTab)) return;

    setLoading(true);
    setError(null);

    try {
      const currentTab = tabs.find((t) => t.id === activeTab);
      if (!currentTab) {
        throw new Error("Tab no válido");
      }

      // Fuente única: /unidades-proyecto/calidad-datos
      const calidadDatosUrl = `${API_BASE_URL}${CALIDAD_DATOS_ENDPOINT}`;
      const calidadDatosResult: any = await fetchJson(calidadDatosUrl);
      const adapted = extractTabDataFromCalidadDatos(
        calidadDatosResult,
        activeTab,
      );

      if (!adapted.found || !adapted.payload) {
        throw new Error(
          `No se encontraron datos de "${currentTab.label}" en calidad-datos`,
        );
      }

      const result: any = adapted.payload;
      console.log(
        "✅ Datos adaptados desde /unidades-proyecto/calidad-datos para tab:",
        activeTab,
      );

      // Manejar diferentes estructuras según el endpoint
      if (activeTab === "stats") {
        // Stats devuelve un objeto directo (no wrapped en success/data)
        console.log("✅ Cargando datos de stats");
        setData(result);
      } else if (activeTab === "summary") {
        // Summary devuelve {success, data, trends_summary, etc}
        if (result.success && result.data) {
          const summaryData = {
            ...result.data,
            overall_trend: result.overall_trend,
            trends_summary: result.trends_summary,
            trends_count: result.trends_count,
            has_comparison_data: result.has_comparison_data,
          };
          console.log("✅ Datos de summary procesados:", summaryData);
          setData([summaryData]); // Envolver en array para mantener consistencia
        } else {
          throw new Error(
            result.message || "No se recibieron datos de summary",
          );
        }
      } else if (result.success && result.data) {
        // Otros endpoints (records, changelog, by-centro-gestor) devuelven arrays
        const dataArray = Array.isArray(result.data) ? result.data : [];
        console.log("✅ Cargando datos:", dataArray.length, "registros");
        setData(dataArray);

        // Cargar opciones para dropdowns desde variables globales de Gestionar UP.
        // Si no existen, generarlas desde los registros cargados y publicarlas globalmente.
        const globalOptions = readGlobalFilterOptions();

        const fallbackCentros = normalizeOptions(
          dataArray.map(
            (item: any) => item.nombre_centro_gestor || item.centro_gestor,
          ),
        );
        const fallbackEstados = normalizeOptions(
          dataArray.map(
            (item: any) => item.estado || item.max_severity || item.severity,
          ),
        );
        const fallbackTipos = normalizeOptions(
          dataArray.map((item: any) => item.tipo_intervencion || item.priority),
        );

        const fallbackIdentificadores = normalizeOptions(
          dataArray.map((item: any) => item.identificador),
        );

        const finalOptions: GlobalFilterOptions = {
          centros_gestores:
            globalOptions.centros_gestores.length > 0
              ? globalOptions.centros_gestores
              : fallbackCentros,
          estados:
            globalOptions.estados.length > 0
              ? globalOptions.estados
              : fallbackEstados,
          tipos_intervencion:
            globalOptions.tipos_intervencion.length > 0
              ? globalOptions.tipos_intervencion
              : fallbackTipos,
          identificadores:
            globalOptions.identificadores.length > 0
              ? globalOptions.identificadores
              : fallbackIdentificadores,
        };

        setAvailableCentrosGestores(finalOptions.centros_gestores);
        setAvailableSeverities(finalOptions.estados);
        setAvailablePriorities(finalOptions.tipos_intervencion);
        setAvailableIdentificadores(finalOptions.identificadores);
        publishGlobalFilterOptions(finalOptions);
      } else {
        throw new Error(result.message || "No se pudieron cargar los datos");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Timeout al cargar datos (20s)"
            : err.message
          : "Error desconocido";
      console.error("❌ Error cargando datos:", errorMessage);
      setError(`Error al cargar datos: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros cuando cambien los datos o filtros seleccionados
  useEffect(() => {
    // Si data no es un array o está vacío, no filtrar
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data];

    // Filtro obligatorio por centro gestor del usuario (para usuarios restringidos)
    if (!canViewAll && userCentroGestor) {
      filtered = filtered.filter((item) =>
        itemMatchesCentroGestor(item, centroGestorAccess),
      );
    }

    // Filtro por centros gestores (selección múltiple del usuario)
    if (selectedCentrosGestores.length > 0) {
      filtered = filtered.filter(
        (item) =>
          selectedCentrosGestores.includes(item.nombre_centro_gestor) ||
          selectedCentrosGestores.includes(item.centro_gestor),
      );
    }

    // Filtro por severidad (selección múltiple)
    if (selectedSeverities.length > 0) {
      filtered = filtered.filter(
        (item) =>
          selectedSeverities.includes(item.max_severity) ||
          selectedSeverities.includes(item.severity) ||
          selectedSeverities.includes(item.estado),
      );
    }

    // Filtro por prioridad (selección múltiple)
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(
        (item) =>
          selectedPriorities.includes(item.priority) ||
          selectedPriorities.includes(item.tipo_intervencion),
      );
    }

    // Filtro por identificador (selección múltiple)
    if (selectedIdentificadores.length > 0) {
      filtered = filtered.filter((item) =>
        selectedIdentificadores.includes(item.identificador),
      );
    }

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(term),
        ),
      );
    }

    setFilteredData(filtered);
  }, [
    data,
    selectedCentrosGestores,
    selectedSeverities,
    selectedPriorities,
    selectedIdentificadores,
    searchTerm,
    canViewAll,
    userCentroGestor,
    centroGestorAccess,
  ]);

  // Cargar datos cuando cambie el tab activo
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header - Compacto */}
      <div
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex-shrink-0"
        data-tour-id="mgmt-unidades-header"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Gestionar Unidades de Proyecto
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Control de Calidad de Unidades de Proyecto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ManagementFeatureTour moduleKey="unidades" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              {showFilters ? (
                <FilterX className="w-4 h-4" />
              ) : (
                <Filter className="w-4 h-4" />
              )}
              Filtros
              {selectedCentrosGestores.length +
                selectedSeverities.length +
                selectedPriorities.length +
                (searchTerm ? 1 : 0) >
                0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  {selectedCentrosGestores.length +
                    selectedSeverities.length +
                    selectedPriorities.length +
                    (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros - Collapsible */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 flex-shrink-0"
          data-tour-id="mgmt-unidades-filters"
        >
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Multi-Select Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MultiSelect
                label="Centro Gestor"
                options={
                  !canViewAll && userCentroGestor
                    ? [userCentroGestor]
                    : availableCentrosGestores
                }
                selected={
                  !canViewAll && userCentroGestor
                    ? [userCentroGestor]
                    : selectedCentrosGestores
                }
                onChange={canViewAll ? setSelectedCentrosGestores : () => {}}
                placeholder={
                  !canViewAll && userCentroGestor
                    ? userCentroGestor
                    : "Todos los centros"
                }
              />
              <MultiSelect
                label="Estado"
                options={Array.from(
                  new Set([...availableSeverities, "Varios estados"]),
                )}
                selected={selectedSeverities}
                onChange={setSelectedSeverities}
                placeholder="Todos los estados"
              />
              <MultiSelect
                label="Tipo de Intervención"
                options={availablePriorities}
                selected={selectedPriorities}
                onChange={setSelectedPriorities}
                placeholder="Todos los tipos"
              />
              <MultiSelect
                label="Identificador"
                options={availableIdentificadores}
                selected={selectedIdentificadores}
                onChange={setSelectedIdentificadores}
                placeholder="Todos los identificadores"
              />
            </div>

            {/* Clear All Filters Button */}
            {selectedCentrosGestores.length +
              selectedSeverities.length +
              selectedPriorities.length +
              selectedIdentificadores.length +
              (searchTerm ? 1 : 0) >
              0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCentrosGestores([]);
                    setSelectedSeverities([]);
                    setSelectedPriorities([]);
                    setSelectedIdentificadores([]);
                    setSearchTerm("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs - Horizontal Scroll en móvil */}
      <div
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0"
        data-tour-id="mgmt-unidades-tabs"
      >
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido Principal - Usa TODO el espacio disponible */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        data-tour-id="mgmt-unidades-content"
      >
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col p-4"
        >
          {/* Error Message - distingue 401 (sesion) / 403 (permisos) / otros */}
          {error &&
            (() => {
              const isUnauth = /401|Unauthorized|No autenticado|Token/i.test(
                error,
              );
              const isForbidden =
                /403|Forbidden|Permiso denegado|denegado/i.test(error);
              const title = isUnauth
                ? "Sesión expirada o no autenticado"
                : isForbidden
                  ? "No tienes permisos para esta sección"
                  : "Error al cargar datos";
              const help = isUnauth
                ? "Cierra sesión e inicia de nuevo para refrescar tu token."
                : isForbidden
                  ? "Tu rol actual no incluye permisos sobre 'Unidades de Proyecto'. Contacta a un administrador para que actualice tu rol."
                  : error;
              return (
                <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex-shrink-0">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                        {title}
                      </h3>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        {help}
                      </p>
                      {!isForbidden && (
                        <button
                          onClick={loadData}
                          className="mt-2 text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-center">
                <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cargando datos...
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <div className="flex-1 overflow-auto">
              {activeTab === "summary" && (
                <>
                  {Array.isArray(data) && data.length > 0 ? (
                    <SummaryView data={data[0]} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay datos de resumen disponibles
                    </div>
                  )}
                </>
              )}

              {activeTab === "records" && (
                <>
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={async () => {
                        try {
                          const { exportarIntervencionesXLSX } =
                            await import("@/services/unidades-proyecto.service");
                          const blob = await exportarIntervencionesXLSX();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `intervenciones_${new Date().toISOString().slice(0, 10)}.xlsx`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error("Error al exportar XLSX:", err);
                          alert(
                            "No se pudo descargar el archivo XLSX. Intenta de nuevo.",
                          );
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors ring-1 ring-green-300/70 dark:ring-green-700/70"
                    >
                      <FileText className="w-4 h-4" />
                      Exportar XLSX
                    </button>
                  </div>
                  {paginatedData.length > 0 ? (
                    <RecordsView records={paginatedData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No se encontraron registros
                    </div>
                  )}
                </>
              )}

              {activeTab === "changelog" && (
                <>
                  {filteredData.length > 0 ? (
                    <ChangelogView changes={filteredData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay cambios registrados
                    </div>
                  )}
                </>
              )}

              {activeTab === "by-centro-gestor" && (
                <>
                  {filteredData.length > 0 ? (
                    <ByCentroGestorView centros={filteredData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay datos por centro gestor
                    </div>
                  )}
                </>
              )}

              {activeTab === "stats" && (
                <>
                  {data && typeof data === "object" ? (
                    <StatsView data={data} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay estadísticas disponibles
                    </div>
                  )}
                </>
              )}

              {canViewAnalisisProcesos && activeTab === "analisis-procesos" && (
                <AnalisisProcesosTab />
              )}

              {activeTab === "gestionar-registros" && <GestionRegistrosTab />}

              {activeTab === "avances-up" && <AvancesUPCentroGestor />}

              {canViewSolicitudesTabs &&
                activeTab === "solicitudes-pendientes" && (
                  <SolicitudesPendientesTab />
                )}

              {canViewSolicitudesTabs &&
                activeTab === "historial-solicitudes" && (
                  <HistorialSolicitudesTab
                    filterCentrosGestores={selectedCentrosGestores}
                    filterEstados={selectedSeverities}
                    filterTiposIntervencion={selectedPriorities}
                    filterIdentificadores={selectedIdentificadores}
                  />
                )}

              {/* Paginación solo para records */}
              {activeTab === "records" &&
                filteredData.length > itemsPerPage && (
                  <div className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        Mostrando{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {startIndex + 1}
                        </span>{" "}
                        a{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {Math.min(endIndex, filteredData.length)}
                        </span>{" "}
                        de{" "}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {filteredData.length}
                        </span>{" "}
                        registros
                      </div>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                        <option value={100}>100 por página</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(totalPages, 7) },
                          (_, i) => {
                            let pageNumber: number;
                            if (totalPages <= 7) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 4) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                              pageNumber = totalPages - 6 + i;
                            } else {
                              pageNumber = currentPage - 3 + i;
                            }

                            return (
                              <button
                                key={pageNumber}
                                onClick={() => goToPage(pageNumber)}
                                className={`min-w-[28px] h-7 px-2 text-xs font-medium rounded transition-colors ${
                                  currentPage === pageNumber
                                    ? "bg-blue-600 text-white"
                                    : "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GestionUnidadesProyecto;
