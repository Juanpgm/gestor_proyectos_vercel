/**
 * Servicio para la gestión de Unidades de Proyecto
 * Implementa programación funcional con manejo de errores robusto
 */

import { z } from "zod";
import {
  parseGeometry,
  createGeoJSONFeatureCollection,
} from "@/utils/geometryParser";
import { deriveEstadoUP } from "@/utils/estadoUP";

// Schemas de validación usando Zod para garantizar tipo de datos
const GeometrySchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.enum([
          "Point",
          "LineString",
          "Polygon",
          "MultiPoint",
          "MultiLineString",
          "MultiPolygon",
          "GeometryCollection",
        ]),
        coordinates: z
          .union([
            // Point: [lon, lat]
            z.tuple([z.number(), z.number()]),
            // LineString: [[lon, lat], [lon, lat], ...]
            z.array(z.tuple([z.number(), z.number()])),
            // Polygon: [[[lon, lat], [lon, lat], ...]]
            z.array(z.array(z.tuple([z.number(), z.number()]))),
            // Casos más complejos
            z.array(z.any()),
          ])
          .optional(), // Hacer opcional porque GeometryCollection no tiene coordinates directas
        geometries: z.array(z.any()).optional(), // Para GeometryCollection
      }),
      properties: z.record(z.any()),
    }),
  ),
});

const AttributeSchema = z.object({
  upid: z.string(),
  nombre_up: z.string(),
  nombre_up_detalle: z.string().optional(),
  identificador: z.string().optional(),
  n_intervenciones: z.number().optional(),
  estado: z.string(),
  tipo_intervencion: z.string(),
  tipo_equipamiento: z.string().optional(),
  clase_up: z.string().optional(),
  frente_activo: z.string().optional(),
  nombre_centro_gestor: z.string().optional(),
  comuna_corregimiento: z.string(),
  barrio_vereda: z.string(),
  direccion: z.string().optional(),
  presupuesto_base: z.number(),
  avance_obra: z.number(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  fecha_inauguracion: z.string().optional(),
  duracion_proyecto: z.string().optional(),
  descripcion_intervencion: z.string(),
  fuente_financiacion: z.string(),
  referencia_contrato: z.string().optional(),
  referencia_proceso: z.string().optional(),
  url_proceso: z.string().optional(),
  ano: z.number(),
  proyectos_estrategicos: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string" && val.trim() !== "")
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    }), // Ahora es lista, con compatibilidad legacy string
  unidad: z.string().optional(),
  cantidad: z.union([z.string(), z.number()]).optional(),
});

const FilterSchema = z.object({
  estados: z.array(z.string()),
  tipos_intervencion: z.array(z.string()),
  tipos_equipamiento: z.array(z.string()),
  frentes_activos: z.array(z.string()),
  centros_gestores: z.array(z.string()),
  comunas: z.array(z.string()), // La API devuelve 'comunas' no 'comunas_corregimientos'
  barrios_veredas: z.array(z.string()),
  fuentes_financiacion: z.array(z.string()),
  anos: z.array(z.string()), // La API devuelve años como strings
  proyectos_estrategicos: z.array(z.string()).optional(), // Nuevos proyectos estratégicos
});

// Tipos derivados de los schemas
export type GeometryData = z.infer<typeof GeometrySchema>;
export type AttributeData = z.infer<typeof AttributeSchema>;
export type FilterData = z.infer<typeof FilterSchema>;

// Tipo para parámetros de filtrado
export interface FilterParams {
  estado?: string;
  tipo_intervencion?: string;
  tipo_equipamiento?: string;
  clase_up?: string;
  frente_activo?: string;
  centro_gestor?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  fuente_financiacion?: string;
  ano?: string; // Cambiar a string para consistencia con la API
  proyectos_estrategicos?: string; // Para filtro singular (valor a buscar)
  search?: string;
  nombre_up?: string;
  presupuesto_base?: number;
  avance_obra?: number;
  presupuesto_min?: number;
  presupuesto_max?: number;
  avance_min?: number;
  avance_max?: number;
  // Campos para filtros múltiples
  estado_multiple?: string[];
  tipo_intervencion_multiple?: string[];
  tipo_equipamiento_multiple?: string[];
  clase_up_multiple?: string[];
  frente_activo_multiple?: string[];
  centro_gestor_multiple?: string[];
  comuna_corregimiento_multiple?: string[];
  barrio_vereda_multiple?: string[];
  fuente_financiacion_multiple?: string[];
  ano_multiple?: string[];
  proyectos_estrategicos_multiple?: string[]; // Múltiples proyectos estratégicos
}

// Tipo para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  filters?: any;
  dashboard?: any;
}

// Configuración de la API
// IMPORTANTE: Usamos siempre /api/proxy (Next.js route handler) en lugar de
// http://localhost:8000 directamente. El proxy reenvía el header
// Authorization al backend y resuelve CORS en producción.
const API_CONFIG = {
  BASE_URL: "/api/proxy",
  ENDPOINT: "/unidades-proyecto", // Endpoint unificado simplificado
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// ── Reglas de negocio: derivación de estado y "Frente activo" ──────────────
// Centralizadas en un solo lugar para que fetchAttributeData y
// consolidateAttributeData usen EXACTAMENTE los mismos umbrales. Antes estaban
// duplicadas en cada función y podían divergir silenciosamente.
// IMPORTANTE: estos valores son reglas de negocio — no cambiar sin validación.
/** Avance (%) por debajo del cual la intervención se considera "En alistamiento". */
const AVANCE_MIN_EN_EJECUCION = 0.5;
/** Avance (%) en o por encima del cual la intervención se considera "Terminado". */
const AVANCE_MAX_EN_EJECUCION = 99.5;
/** Presupuesto mínimo (COP) para que una intervención cuente como frente activo. */
const MIN_PRESUPUESTO_FRENTE_ACTIVO = 150000000;
/** Centro gestor excluido del conteo de frentes activos (comparar normalizado sin acentos). */
const EXCLUDED_CENTRO_GESTOR_FRENTE_ACTIVO =
  "secretaria de vivienda social y habitat";
/** Tipos de intervención excluidos del conteo de frentes activos (comparar normalizados). */
const EXCLUDED_TIPOS_FRENTE_ACTIVO = new Set([
  "mantenimiento",
  "estudios y disenos",
  "demarcacion vial",
]);

// Utilidad para manejar errores de manera funcional
const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error("API Error: Unknown error occurred");
};

// Utilidad para delay en reintentos
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Cache en memoria para datos inmutables (opcional)
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_UNIDADES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const parsedUnidadesCacheTtl = Number(
  process.env.NEXT_PUBLIC_UNIDADES_CACHE_TTL_MS,
);
const CACHE_TTL =
  Number.isFinite(parsedUnidadesCacheTtl) && parsedUnidadesCacheTtl > 0
    ? parsedUnidadesCacheTtl
    : DEFAULT_UNIDADES_CACHE_TTL_MS;

const DEBUG_LOGS = process.env.NEXT_PUBLIC_DEBUG === "true";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_LOGS) console.log(...args);
};

// In-flight deduplication: si dos consumidores piden la misma URL simultáneamente,
// comparten la misma Promise en lugar de disparar dos requests idénticos.
const _inFlightRequests = new Map<string, Promise<any>>();

/** Invalida el cache en memoria. Si se pasa un patrón, solo borra entradas que lo contengan. */
export const invalidateUnidadesProyectoCache = (pattern?: string): void => {
  if (!pattern) {
    memoryCache.clear();
    _inFlightRequests.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.includes(pattern)) memoryCache.delete(key);
  }
  for (const key of Array.from(_inFlightRequests.keys())) {
    if (key.includes(pattern)) _inFlightRequests.delete(key);
  }
};

// Utilidad para hacer fetch con retry optimizado
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  attempts: number = API_CONFIG.RETRY_ATTEMPTS,
  useCache: boolean = false,
): Promise<Response> => {
  // Verificar cache si está habilitado
  if (useCache) {
    const cached = memoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      debugLog("💾 Using cached data for:", url.split("?")[0]);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Solo agregar cache-busting si NO estamos usando cache
    const finalUrl = useCache
      ? url
      : `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`;

    // Adjuntar Firebase ID token si no viene en options.headers.
    // Usamos lazy import para evitar circular deps con @/lib/firebase.
    let authHeader: Record<string, string> = {};
    const incomingAuth =
      (options.headers as Record<string, string> | undefined)?.[
        "Authorization"
      ] ||
      (options.headers as Record<string, string> | undefined)?.[
        "authorization"
      ];
    if (!incomingAuth && typeof window !== "undefined") {
      try {
        const { auth: firebaseAuth } = await import("@/lib/firebase");
        if (!firebaseAuth) throw new Error("firebaseAuth unavailable");
        await firebaseAuth.authStateReady();
        const user = firebaseAuth.currentUser;
        if (user) {
          const token = await user.getIdToken(false);
          authHeader = { Authorization: `Bearer ${token}` };
        }
      } catch {
        // Sin token disponible — dejar que el backend devuelva 401.
      }
    }

    const response = await fetch(finalUrl, {
      ...options,
      signal: controller.signal,
      cache: useCache ? "default" : "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(useCache
          ? {}
          : {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            }),
        ...authHeader,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Guardar en cache si está habilitado
    if (useCache) {
      const data = await response.clone().json();
      memoryCache.set(url, { data, timestamp: Date.now() });
    }

    return response;
  } catch (error) {
    if (attempts > 1) {
      await delay(API_CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, attempts - 1, useCache);
    }
    throw error;
  }
};

// Mapeo de claves de filtros frontend a backend
const FILTER_KEY_MAP: Record<string, string> = {
  centro_gestor: "nombre_centro_gestor",
  centro_gestor_multiple: "nombre_centro_gestor",
  comuna_corregimiento: "comuna_corregimiento",
  comuna_corregimiento_multiple: "comuna_corregimiento",
};

// Claves de rango (filtrado real `>=`/`<=`) que NO deben enviarse como equality
// al backend; se procesan client-side en filterAttributeData.
const RANGE_FILTER_KEYS = new Set([
  "presupuesto_min",
  "presupuesto_max",
  "avance_min",
  "avance_max",
]);

// Función optimizada para construir query string de filtros
const buildFilterQuery = (
  filters: FilterParams,
  verbose: boolean = false,
): string => {
  const params = new URLSearchParams();

  if (verbose) console.log("🔍 BuildFilterQuery: Input filters:", filters);

  // Determinar qué claves base tienen una versión _multiple con valores,
  // para evitar duplicar parámetros cuando ambas variantes (simple y múltiple) están presentes.
  const baseKeysWithMultipleValues = new Set(
    Object.entries(filters)
      .filter(
        ([key, value]) =>
          key.endsWith("_multiple") &&
          Array.isArray(value) &&
          (value as string[]).length > 0,
      )
      .map(([key]) => key.replace("_multiple", "")),
  );

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    // Los filtros de rango (presupuesto_min/max, avance_min/max) se aplican
    // client-side; no enviarlos al backend como equality.
    if (RANGE_FILTER_KEYS.has(key)) return;

    // Determinar la clave del parámetro para la API
    const apiKey = FILTER_KEY_MAP[key] || key.replace("_multiple", "");

    // Manejar arrays (_multiple keys)
    if (Array.isArray(value) && value.length > 0) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== "") {
          params.append(apiKey, String(item));
        }
      });
    }
    // Manejar valores simples — omitir si ya existe una versión _multiple con valores
    else if (
      !key.endsWith("_multiple") &&
      !baseKeysWithMultipleValues.has(key)
    ) {
      params.append(apiKey, String(value));
    }
  });

  const queryString = params.toString();
  if (verbose && queryString) {
    console.log(`🔍 BuildFilterQuery: ${queryString}`);
  }

  return queryString;
};

export const exportIntervencionesXlsx = async (
  filters: FilterParams = {},
): Promise<Blob> => {
  const queryString = buildFilterQuery(filters, false);
  const url = `${API_CONFIG.BASE_URL}/unidades-proyecto/intervenciones/export-xlsx${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
    },
  });

  if (!response.ok) {
    throw new Error(`Error al exportar XLSX (${response.status})`);
  }

  return response.blob();
};

// Funciones del servicio usando programación funcional

/**
 * ✨ NUEVA FUNCIÓN MAESTRA: Obtiene datos completos desde el endpoint unificado
 * Este endpoint reemplaza los anteriores /geometry, /attributes, /filters
 *
 * La API devuelve estructura:
 * {
 *   "success": true,
 *   "data": [{ upid, nombre_up, geometry: {...}, ...demás propiedades }],
 *   "count": number,
 *   "filters": {...}
 * }
 *
 * Esta función convierte la respuesta a GeoJSON FeatureCollection estándar
 */
const FETCH_PAGE_SIZE = 10000;

const fetchUnidadesProyectoRaw = async (
  filters: FilterParams = {},
): Promise<any> => {
  const hasFilters = Object.keys(filters).length > 0;
  const queryString = buildFilterQuery(filters, false);

  // Primera página: limit + offset=0
  const firstPageQuery = queryString
    ? `${queryString}&limit=${FETCH_PAGE_SIZE}&offset=0`
    : `limit=${FETCH_PAGE_SIZE}&offset=0`;

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}?${firstPageQuery}`;

  // In-flight deduplication: si dos consumidores piden la misma URL antes de
  // que la primera respuesta llegue, comparten la Promise y se hace un solo fetch.
  const inFlightKey = url;
  const existingPromise = _inFlightRequests.get(inFlightKey);
  if (existingPromise) {
    debugLog(
      `[dedupe] fetchUnidadesProyectoRaw: reutilizando request en vuelo para`,
      url.split("?")[0],
    );
    return existingPromise;
  }

  const requestPromise = (async () => {
    try {
      debugLog(
        `fetchUnidadesProyectoRaw: Fetching page 1 (limit=${FETCH_PAGE_SIZE})`,
      );

      // Usar cache para peticiones sin filtros (solo primera página)
      const response = await fetchWithRetry(
        url,
        {},
        API_CONFIG.RETRY_ATTEMPTS,
        !hasFilters,
      );
      const rawResponse = await response.json();

      // El proxy de Next.js (`/api/proxy/[...path]`) desempaqueta automáticamente
      // las respuestas `{success: true, data: [...]}` para endpoints
      // `unidades-proyecto`. Si llega un array plano, lo envolvemos aquí
      // manualmente para mantener compatibilidad con la lógica de paginación.
      const rawData = Array.isArray(rawResponse)
        ? {
            success: true,
            data: rawResponse,
            count: rawResponse.length,
          }
        : rawResponse;

      if (!rawData.success || !Array.isArray(rawData.data)) {
        throw new Error(
          "Respuesta inválida: se esperaba { success: true, data: [...] }",
        );
      }

      const totalCount = Number(
        rawData.count ?? rawData.total ?? rawData.data.length,
      );
      let allData = [...rawData.data];

      // Paginar si hay más registros que los recibidos en la primera página
      if (allData.length < totalCount) {
        const totalPages = Math.ceil(totalCount / FETCH_PAGE_SIZE);
        debugLog(
          `fetchUnidadesProyectoRaw: Paginando — total ${totalCount} registros, ${totalPages} páginas`,
        );

        for (
          let page = 1;
          page < totalPages && allData.length < totalCount;
          page++
        ) {
          const offset = page * FETCH_PAGE_SIZE;
          const pageQuery = queryString
            ? `${queryString}&limit=${FETCH_PAGE_SIZE}&offset=${offset}`
            : `limit=${FETCH_PAGE_SIZE}&offset=${offset}`;

          const pageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}?${pageQuery}`;

          const pageResponse = await fetchWithRetry(
            pageUrl,
            {},
            API_CONFIG.RETRY_ATTEMPTS,
            false,
          );
          const pageRaw = await pageResponse.json();
          // Aceptar tanto array plano (desempaquetado por el proxy) como
          // estructura envuelta `{success, data}`.
          const pageData = Array.isArray(pageRaw)
            ? { success: true, data: pageRaw }
            : pageRaw;

          if (
            pageData.success &&
            Array.isArray(pageData.data) &&
            pageData.data.length > 0
          ) {
            allData = allData.concat(pageData.data);
          } else {
            break;
          }
        }
      }

      // Convertir cada item del array "data" a un Feature GeoJSON
      const features = allData.map((item: any) => {
        const { geometry, ...properties } = item;
        return {
          type: "Feature",
          geometry: geometry || null,
          properties: properties,
        };
      });

      return {
        type: "FeatureCollection",
        features: features,
      };
    } finally {
      _inFlightRequests.delete(inFlightKey);
    }
  })();

  _inFlightRequests.set(inFlightKey, requestPromise);
  return requestPromise;
};

/**
 * Obtiene datos de geometría con filtros opcionales
 * Ahora usa el endpoint unificado internamente
 */
export const fetchGeometryData = async (
  filters: FilterParams = {},
): Promise<GeometryData> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;

    if (hasFilters) {
      debugLog(`fetchGeometryData: Fetching with filters`);
    }

    // Obtener datos desde el endpoint unificado
    const rawData = await fetchUnidadesProyectoRaw(filters);

    // El endpoint unificado ya devuelve un GeoJSON FeatureCollection válido
    const geoJsonData = {
      type: rawData.type,
      features: rawData.features,
    };

    // Procesar geometrías con el parser para manejar strings JSON
    const parsedFeatures = geoJsonData.features
      .map((feature: any) => {
        const parsedGeometry = parseGeometry(feature.geometry);
        if (!parsedGeometry) return null;
        return {
          type: "Feature",
          geometry: parsedGeometry,
          properties: feature.properties,
        };
      })
      .filter((f: any) => f !== null);

    const parsedGeoJsonData = {
      type: "FeatureCollection" as const,
      features: parsedFeatures,
    };

    // Validar estructura de datos con el schema
    const validatedData = GeometrySchema.parse(parsedGeoJsonData);
    debugLog(`fetchGeometryData: ${validatedData.features.length} features`);
    return validatedData;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Estadísticas de la última ejecución de fetchAttributeData.
 * Permite que la UI advierta (sin bloquear) cuando se descartan registros por
 * fallos de validación, en vez de perderlos en silencio.
 */
export interface AttributeValidationStats {
  /** Total de items recibidos del backend en la última ejecución */
  received: number;
  /** Items que pasaron la validación y se devolvieron */
  valid: number;
  /** Items descartados por fallar la validación de esquema */
  failed: number;
  /** Muestra de upids descartados (limitada para no crecer sin control) */
  failedUpids: string[];
}

export const lastAttributeValidationStats: AttributeValidationStats = {
  received: 0,
  valid: 0,
  failed: 0,
  failedUpids: [],
};

/**
 * Obtiene datos de atributos con filtros opcionales
 * Ahora usa el endpoint unificado internamente
 */
export const fetchAttributeData = async (
  filters: FilterParams = {},
): Promise<AttributeData[]> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;

    // Obtener datos desde el endpoint unificado
    const rawData = await fetchUnidadesProyectoRaw(filters);

    // Procesar features del GeoJSON: cada feature es una unidad con properties + (opcional) intervenciones
    const dataArray = rawData.features;

    debugLog(`fetchAttributeData: Processing ${dataArray.length} raw items`);

    // Detectar si el endpoint de unidades trae campos de intervención
    const hasInterventionFields = dataArray.some((item: any) => {
      const properties = item.properties || item;
      return Boolean(
        properties?.intervenciones?.length ||
        properties?.estado ||
        properties?.tipo_intervencion ||
        properties?.presupuesto_base ||
        properties?.avance_obra,
      );
    });

    // Si el endpoint de unidades NO trae campos de intervención, usar fallback con /intervenciones
    let intervencionesByUpid = new Map<string, any[]>();
    if (!hasInterventionFields) {
      debugLog(
        "fetchAttributeData: Datos de unidades sin intervenciones. Usando fallback /intervenciones.",
      );
      try {
        let allIntervenciones: any[] = [];
        let intervOffset = 0;
        const intervPageSize = FETCH_PAGE_SIZE;

        // Paginar /intervenciones hasta obtener todos los registros
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const intervencionesUrl = `${API_CONFIG.BASE_URL}/intervenciones?limit=${intervPageSize}&offset=${intervOffset}`;
          const intervencionesResponse = await fetchWithRetry(
            intervencionesUrl,
            {},
            API_CONFIG.RETRY_ATTEMPTS,
            !hasFilters && intervOffset === 0,
          );
          const intervencionesPayload = await intervencionesResponse.json();
          const pageData = Array.isArray(intervencionesPayload?.data)
            ? intervencionesPayload.data
            : [];

          if (pageData.length === 0) break;
          allIntervenciones = allIntervenciones.concat(pageData);

          const intervTotal = Number(
            intervencionesPayload?.count ?? intervencionesPayload?.total ?? 0,
          );
          if (
            allIntervenciones.length >= intervTotal ||
            pageData.length < intervPageSize
          )
            break;
          intervOffset += intervPageSize;
        }

        allIntervenciones.forEach((interv: any) => {
          const key = String(interv?.upid || "")
            .trim()
            .toLowerCase();
          if (!key) return;
          const bucket = intervencionesByUpid.get(key);
          if (bucket) {
            bucket.push(interv);
          } else {
            intervencionesByUpid.set(key, [interv]);
          }
        });

        debugLog(
          `fetchAttributeData: ${allIntervenciones.length} intervenciones agrupadas por UPID`,
        );
      } catch (intervencionesError) {
        // Visible (no solo en debug): si el fallback falla, las unidades quedan
        // sin intervenciones y los avances/reportes saldrían incompletos.
        console.warn(
          "⚠️ fetchAttributeData: Error cargando /intervenciones (fallback). " +
            "Las unidades pueden quedar sin datos de intervención.",
          intervencionesError,
        );
      }
    }

    // Derivar estado a partir de avance_obra, respetando valores especiales imputados por el usuario
    const normalizeAccents = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    // Derivación centralizada: respeta solo los estados manuales explícitos
    // (Suspendido, Inaugurado) y re-deriva todo lo demás desde avance_obra.
    const deriveEstado = deriveEstadoUP;

    // Determinar frente activo usando estados derivados Y avances —
    // una intervención al 100% con estado "En ejecución" NO es frente activo (debe ser Terminado).
    // Excluir ciertos centros gestores y tipos de intervención del conteo de frentes activos.
    // (Umbrales/exclusiones centralizados a nivel módulo — ver constantes arriba.)

    const inferFrenteActivo = (
      estados: string[],
      avances?: (number | null | undefined)[],
      tiposIntervencion?: (string | null | undefined)[],
      centrosGestor?: (string | null | undefined)[],
      presupuestos?: (number | null | undefined)[],
    ): string => {
      for (let i = 0; i < estados.length; i++) {
        const norm = normalizeAccents(estados[i] || "");
        if (norm === "en ejecucion") {
          // Si tenemos dato de avance, excluir los que se muestran como 0% o 100%
          if (avances && avances[i] != null) {
            const av =
              typeof avances[i] === "number"
                ? avances[i]!
                : parseFloat(String(avances[i] || "0"));
            if (av < AVANCE_MIN_EN_EJECUCION || av >= AVANCE_MAX_EN_EJECUCION)
              continue; // avance que redondea a 0% o 100% → no es frente activo
          }
          // Excluir tipos de intervención no aplicables
          if (tiposIntervencion && tiposIntervencion[i]) {
            const tipoNorm = normalizeAccents(tiposIntervencion[i] || "");
            if (EXCLUDED_TIPOS_FRENTE_ACTIVO.has(tipoNorm)) continue;
          }
          // Excluir centros gestores no aplicables
          if (centrosGestor && centrosGestor[i]) {
            const centroNorm = normalizeAccents(centrosGestor[i] || "");
            if (centroNorm === EXCLUDED_CENTRO_GESTOR_FRENTE_ACTIVO) continue;
          }
          // Excluir intervenciones con presupuesto por debajo del mínimo
          if (presupuestos && presupuestos[i] != null) {
            const pres =
              typeof presupuestos[i] === "number"
                ? presupuestos[i]!
                : parseFloat(String(presupuestos[i] || "0"));
            if (pres < MIN_PRESUPUESTO_FRENTE_ACTIVO) continue;
          }
          return "Frente activo";
        }
      }
      return "No aplica";
    };

    // Procesar y validar cada elemento con manejo de errores individuales
    const validatedData: AttributeData[] = [];
    let failedValidationCount = 0;
    const failedUpids: string[] = [];
    const MAX_FAILED_UPIDS_TRACKED = 50;

    dataArray.forEach((item: any, index: number) => {
      try {
        const properties = item.properties || item;

        // ==========================================
        // MANEJO DE MÚLTIPLES ESTRUCTURAS DE DATOS
        // ==========================================
        // La API puede devolver dos estructuras diferentes:
        // 1) Estructura NUEVA con campo 'intervenciones' (array de intervenciones)
        // 2) Estructura ANTIGUA sin 'intervenciones' (datos directos en el objeto)

        const upidKey = String(properties.upid || "")
          .trim()
          .toLowerCase();
        const intervenciones =
          properties.intervenciones || intervencionesByUpid.get(upidKey) || [];
        const esEstructuraNueva = intervenciones.length > 0;
        const primeraIntervencion = esEstructuraNueva ? intervenciones[0] : {};

        // 💰 CORRECCIÓN: Sumar presupuestos de TODAS las intervenciones, no solo la primera
        let presupuesto_base = 0;
        if (esEstructuraNueva) {
          presupuesto_base = intervenciones.reduce(
            (sum: number, interv: any) => {
              const presupuesto = parseFloat(interv.presupuesto_base || 0);
              return sum + presupuesto;
            },
            0,
          );
        } else {
          // Estructura antigua: presupuesto directo
          presupuesto_base = parseFloat(properties.presupuesto_base || 0);
        }

        // 📊 CORRECCIÓN: Calcular avance promedio ponderado por presupuesto
        let avance_obra = 0;
        if (esEstructuraNueva && intervenciones.length > 0) {
          if (presupuesto_base > 0) {
            // Promedio ponderado: (suma de avance * presupuesto) / presupuesto total
            const avancePonderado = intervenciones.reduce(
              (sum: number, interv: any) => {
                const avance = parseFloat(interv.avance_obra || 0);
                const presupuesto = parseFloat(interv.presupuesto_base || 0);
                return sum + avance * presupuesto;
              },
              0,
            );
            avance_obra = avancePonderado / presupuesto_base;
          } else {
            // Presupuesto total 0: el promedio ponderado daría 0 y borraría el
            // avance real de las intervenciones. Fallback a promedio aritmético
            // simple para no reportar avance 0 cuando sí hay progreso.
            const sumaAvances = intervenciones.reduce(
              (sum: number, interv: any) =>
                sum + parseFloat(interv.avance_obra || 0),
              0,
            );
            avance_obra = sumaAvances / intervenciones.length;
          }
        } else {
          // Estructura antigua: avance directo
          avance_obra = parseFloat(properties.avance_obra || 0);
        }

        // Blindaje numérico: nunca propagar NaN/Infinity al esquema (que los
        // rechazaría) ni a la UI; cualquier valor no finito cae a 0.
        if (!Number.isFinite(avance_obra)) {
          avance_obra = 0;
        }

        // 🔢 CORRECCIÓN: n_intervenciones
        // En estructura nueva: viene en properties
        // En estructura antigua: NO EXISTE, usar 1 como valor por defecto (cada registro = 1 intervención)
        const n_intervenciones = esEstructuraNueva
          ? parseInt(properties.n_intervenciones) || intervenciones.length
          : 1; // Cada registro sin 'intervenciones' representa 1 intervención

        // 🚧 CORRECCIÓN: frente_activo — derivar estado de cada intervención a partir de avance_obra
        // No contemplar intervenciones al 100% con estado "En ejecución" → deben ser "Terminado"
        // Excluir ciertos tipos de intervención y centros gestores
        let frente_activo = "No aplica";
        if (esEstructuraNueva) {
          const estadosDerivados = intervenciones.map((interv: any) =>
            deriveEstado(interv?.avance_obra, interv?.estado),
          );
          const avancesRaw = intervenciones.map((interv: any) => {
            const v = interv?.avance_obra;
            return typeof v === "number" ? v : parseFloat(String(v || "0"));
          });
          const tiposRaw = intervenciones.map(
            (interv: any) => interv?.tipo_intervencion || "",
          );
          const centrosRaw = intervenciones.map(
            (interv: any) => interv?.nombre_centro_gestor || "",
          );
          const presupuestosRaw = intervenciones.map((interv: any) =>
            parseFloat(interv?.presupuesto_base || 0),
          );
          frente_activo =
            estadosDerivados.length > 0
              ? inferFrenteActivo(
                  estadosDerivados,
                  avancesRaw,
                  tiposRaw,
                  centrosRaw,
                  presupuestosRaw,
                )
              : "No aplica";
        } else {
          const estadoDerivado = deriveEstado(
            properties.avance_obra,
            properties.estado,
          );
          const avanceRaw =
            typeof properties.avance_obra === "number"
              ? properties.avance_obra
              : parseFloat(String(properties.avance_obra || "0"));
          const tipoRaw =
            primeraIntervencion.tipo_intervencion ||
            properties.tipo_intervencion ||
            "";
          const centroRaw =
            properties.nombre_centro_gestor ||
            primeraIntervencion.nombre_centro_gestor ||
            "";
          const presupuestoRaw = parseFloat(
            primeraIntervencion.presupuesto_base ||
              properties.presupuesto_base ||
              0,
          );
          frente_activo = inferFrenteActivo(
            [estadoDerivado],
            [avanceRaw],
            [tipoRaw],
            [centroRaw],
            [presupuestoRaw],
          );
        }

        // El campo nombre_centro_gestor puede venir de diferentes lugares
        const centroGestor =
          properties.nombre_centro_gestor ||
          primeraIntervencion.nombre_centro_gestor ||
          undefined;

        // Extraer unidad/cantidad/identificador con cuidado (pueden ser 0, "", etc.)
        const extractField = (field: string): any => {
          const fromInterv = primeraIntervencion?.[field];
          const fromProps = properties?.[field];
          return fromInterv != null && fromInterv !== ""
            ? fromInterv
            : fromProps != null && fromProps !== ""
              ? fromProps
              : undefined;
        };

        const validatedItem = AttributeSchema.parse({
          upid: properties.upid || "",
          nombre_up: properties.nombre_up || "",
          nombre_up_detalle: properties.nombre_up_detalle || undefined,
          identificador: extractField("identificador"),
          n_intervenciones: n_intervenciones,
          // Campos que pueden venir de la intervención o de properties — derivar estado desde avance_obra COMPUTADO
          // Usar avance_obra ya calculado (promedio ponderado) para que coincida con lo que se muestra
          estado: deriveEstado(
            avance_obra,
            primeraIntervencion.estado || properties.estado,
          ),
          tipo_intervencion:
            primeraIntervencion.tipo_intervencion ||
            properties.tipo_intervencion ||
            "Sin especificar",
          tipo_equipamiento: properties.tipo_equipamiento || undefined,
          clase_up:
            properties.clase_up || primeraIntervencion.clase_up || undefined,
          frente_activo: frente_activo,
          nombre_centro_gestor: centroGestor,
          comuna_corregimiento: properties.comuna_corregimiento || "",
          barrio_vereda: properties.barrio_vereda || "",
          direccion: properties.direccion || undefined,
          presupuesto_base: presupuesto_base,
          avance_obra: avance_obra,
          fecha_inicio:
            primeraIntervencion.fecha_inicio || properties.fecha_inicio || "",
          fecha_fin:
            primeraIntervencion.fecha_fin || properties.fecha_fin || "",
          fecha_inauguracion:
            primeraIntervencion.fecha_inauguracion ||
            properties.fecha_inauguracion ||
            undefined,
          duracion_proyecto:
            primeraIntervencion.duracion_proyecto ||
            properties.duracion_proyecto ||
            undefined,
          descripcion_intervencion:
            primeraIntervencion.descripcion_intervencion ||
            properties.descripcion_intervencion ||
            "",
          fuente_financiacion:
            primeraIntervencion.fuente_financiacion ||
            properties.fuente_financiacion ||
            "",
          referencia_contrato:
            primeraIntervencion.referencia_contrato ||
            properties.referencia_contrato ||
            undefined,
          referencia_proceso:
            primeraIntervencion.referencia_proceso ||
            properties.referencia_proceso ||
            undefined,
          url_proceso:
            primeraIntervencion.url_proceso ||
            properties.url_proceso ||
            undefined,
          ano: parseInt(
            primeraIntervencion.ano || properties.ano || properties.anio || 0,
          ),
          proyectos_estrategicos: normalizeProyectosEstrategicos(
            properties.proyectos_estrategicos,
          ),
          unidad: extractField("unidad"),
          cantidad: extractField("cantidad"),
        });

        validatedData.push(validatedItem);
      } catch (validationError) {
        // No interrumpir el proceso, pero NO descartar en silencio: contar y
        // recordar el upid para poder advertir al usuario que faltan registros.
        failedValidationCount += 1;
        const upidFallido = String(
          (item?.properties?.upid ?? item?.upid ?? `index_${index}`) || `index_${index}`,
        );
        if (failedUpids.length < MAX_FAILED_UPIDS_TRACKED) {
          failedUpids.push(upidFallido);
        }
        debugLog(
          `⚠️ Validation failed for item ${index} (upid=${upidFallido})`,
          validationError,
        );
      }
    });

    // Publicar estadísticas de validación de esta ejecución
    lastAttributeValidationStats.received = dataArray.length;
    lastAttributeValidationStats.valid = validatedData.length;
    lastAttributeValidationStats.failed = failedValidationCount;
    lastAttributeValidationStats.failedUpids = failedUpids;

    if (failedValidationCount > 0) {
      console.warn(
        `⚠️ fetchAttributeData: ${failedValidationCount} de ${dataArray.length} registros descartados por fallo de validación. ` +
          `upids (muestra): ${failedUpids.join(", ")}`,
      );
    }

    // Log conciso del resultado
    if (hasFilters) {
      console.log(
        `✅ fetchAttributeData: ${validatedData.length} items loaded with filters`,
      );
    }

    return validatedData;
  } catch (error) {
    console.error("❌ fetchAttributeData error:", error);
    return handleApiError(error);
  }
};

/**
 * Obtiene opciones de filtros disponibles
 * Siempre genera filtros desde los datos reales de attributes para garantizar consistencia
 */
export const fetchFilterData = async (): Promise<FilterData> => {
  try {
    console.log(
      `🌐 fetchFilterData: Obteniendo filtros desde datos de attributes`,
    );

    // SIEMPRE obtener filtros desde los datos reales de attributes
    const attributeData = await fetchAttributeData();

    if (!attributeData || attributeData.length === 0) {
      console.warn(
        "⚠️ No hay datos de attributes disponibles para generar filtros",
      );
      return FilterSchema.parse({
        estados: [],
        tipos_intervencion: [],
        tipos_equipamiento: [],
        centros_gestores: [],
        comunas_corregimientos: [],
        barrios_veredas: [],
        fuentes_financiacion: [],
        anos: [],
      });
    }

    console.log(
      `📊 fetchFilterData: Generando filtros desde ${attributeData.length} registros`,
    );

    // Generar filtros desde los datos reales
    const generatedFilters = generateFiltersFromData(attributeData);

    console.log(`✅ fetchFilterData: Filtros generados exitosamente:`, {
      estados: generatedFilters.estados.length,
      tipos_intervencion: generatedFilters.tipos_intervencion.length,
      tipos_equipamiento: generatedFilters.tipos_equipamiento.length,
      centros_gestores: generatedFilters.centros_gestores.length,
      comunas: generatedFilters.comunas.length,
      barrios_veredas: generatedFilters.barrios_veredas.length,
      fuentes_financiacion: generatedFilters.fuentes_financiacion.length,
      anos: generatedFilters.anos.length,
    });

    // Log de muestra de valores
    console.log(`📋 fetchFilterData: Muestra de valores únicos:`, {
      estados: generatedFilters.estados.slice(0, 3),
      tipos_intervencion: generatedFilters.tipos_intervencion.slice(0, 3),
      tipos_equipamiento: generatedFilters.tipos_equipamiento.slice(0, 3),
      centros_gestores: generatedFilters.centros_gestores.slice(0, 3),
      comunas: generatedFilters.comunas.slice(0, 3),
      anos: generatedFilters.anos,
    });

    return generatedFilters;
  } catch (error) {
    console.error("❌ fetchFilterData error:", error);
    return handleApiError(error);
  }
};

/**
 * Función utilitaria para generar filtros desde datos existentes
 * Extrae valores únicos de cada campo, filtrando vacíos y undefined
 */
export const consolidateAttributeData = (
  data: AttributeData[],
): AttributeData[] => {
  const grouped = new Map<string, AttributeData[]>();

  data.forEach((item) => {
    const key = String(item.upid || "")
      .trim()
      .toLowerCase();
    if (!key) return;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  });

  // (derivaci\u00f3n centralizada \u2014 sin helpers locales)
  // Derivación centralizada en @/utils/estadoUP (whitelist de estados manuales).
  const deriveEstadoLocal = deriveEstadoUP;

  return Array.from(grouped.values()).map((group) => {
    const base = group[0];
    // Derivar estados reales a partir de avance_obra (ej: avance=100 + estado="En ejecución" → "Terminado")
    const estadosDerivados = group.map((i) =>
      deriveEstadoLocal(i.avance_obra, i.estado),
    );
    const estados = new Set(estadosDerivados.filter(Boolean));
    const tipos = new Set(
      group.map((i) => i.tipo_intervencion).filter(Boolean),
    );
    const centros = new Set(
      group.map((i) => i.nombre_centro_gestor).filter(Boolean),
    );
    const avances = group
      .map((i) => i.avance_obra)
      .filter(
        (val): val is number => typeof val === "number" && !Number.isNaN(val),
      );
    const presupuestos = group
      .map((i) => i.presupuesto_base)
      .filter(
        (val): val is number => typeof val === "number" && !Number.isNaN(val),
      );

    const estadoConsolidado =
      estados.size === 1
        ? Array.from(estados)[0]!
        : estados.size > 1
          ? "Varios estados"
          : "Sin estado";

    const tipoConsolidado =
      tipos.size === 1
        ? Array.from(tipos)[0]!
        : tipos.size > 1
          ? "Varios tipos"
          : "Sin tipo";

    const centroConsolidado =
      centros.size === 1
        ? Array.from(centros)[0]!
        : centros.size > 1
          ? "Intervenido por varios organismos"
          : "Sin centro";

    const avancePromedio =
      avances.length > 0
        ? avances.reduce((sum, val) => sum + val, 0) / avances.length
        : 0;

    const presupuestoTotal =
      presupuestos.length > 0
        ? presupuestos.reduce((sum, val) => sum + val, 0)
        : 0;

    // Preservar identificador/unidad/cantidad del primer item que los tenga
    const identificador =
      group.find((i) => i.identificador != null && i.identificador !== "")
        ?.identificador ?? base.identificador;
    const unidad =
      group.find((i) => i.unidad != null && i.unidad !== "")?.unidad ??
      base.unidad;
    const cantidad =
      group.find((i) => i.cantidad != null && i.cantidad !== "")?.cantidad ??
      base.cantidad;

    // Consolidar proyectos_estrategicos de TODOS los items del grupo (unión de valores únicos)
    const allProyectosEstrategicos = new Set<string>();
    group.forEach((i) => {
      const normalized = normalizeProyectosEstrategicos(
        i.proyectos_estrategicos,
      );
      normalized.forEach((pe) => allProyectosEstrategicos.add(pe));
    });
    const proyectosEstrategicosConsolidados = Array.from(
      allProyectosEstrategicos,
    );

    // Recalcular frente_activo basándose en los estados, avances, tipo y centro del grupo
    // Una UP al 100% con estado "En ejecución" NO es frente activo → es Terminado
    // Excluir ciertos tipos de intervención y centros gestores
    const normalizeAccentsLocal = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    // Umbrales/exclusiones centralizados a nivel módulo — ver constantes arriba.
    const hasActiveExecution = group.some((item, idx) => {
      const estadoNorm = normalizeAccentsLocal(estadosDerivados[idx] || "");
      const av = typeof item.avance_obra === "number" ? item.avance_obra : 0;
      const pres =
        typeof item.presupuesto_base === "number" ? item.presupuesto_base : 0;
      const tipoNorm = normalizeAccentsLocal(item.tipo_intervencion || "");
      const centroNorm = normalizeAccentsLocal(item.nombre_centro_gestor || "");
      return (
        estadoNorm === "en ejecucion" &&
        av >= AVANCE_MIN_EN_EJECUCION &&
        av < AVANCE_MAX_EN_EJECUCION &&
        !EXCLUDED_TIPOS_FRENTE_ACTIVO.has(tipoNorm) &&
        centroNorm !== EXCLUDED_CENTRO_GESTOR_FRENTE_ACTIVO &&
        pres >= MIN_PRESUPUESTO_FRENTE_ACTIVO
      );
    });
    const frenteActivoConsolidado = hasActiveExecution
      ? "Frente activo"
      : "No aplica";

    return {
      ...base,
      estado: estadoConsolidado,
      tipo_intervencion: tipoConsolidado,
      nombre_centro_gestor: centroConsolidado,
      avance_obra: avancePromedio,
      presupuesto_base: presupuestoTotal,
      frente_activo: frenteActivoConsolidado,
      proyectos_estrategicos: proyectosEstrategicosConsolidados,
      identificador,
      unidad,
      cantidad,
    };
  });
};

export const generateFiltersFromData = (data: AttributeData[]): FilterData => {
  const consolidatedData = consolidateAttributeData(data);
  const extractUniqueValues = <T>(items: T[], key: keyof T): string[] => {
    const values: string[] = [];
    items.forEach((item) => {
      const val = item[key];
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach((v) => {
          const s = String(v).trim();
          if (s) values.push(s);
        });
      } else {
        const s = String(val).trim();
        if (s) values.push(s);
      }
    });

    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "es"));
  };

  const extractUniqueYears = <T>(items: T[], key: keyof T): string[] => {
    const years = items
      .map((item) => String(item[key]).replace(".0", "")) // Remover .0 de los años
      .filter(
        (year) =>
          year &&
          year !== "undefined" &&
          year !== "null" &&
          !isNaN(Number(year)),
      );

    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  };

  const filters = {
    estados: extractUniqueValues(consolidatedData, "estado"),
    tipos_intervencion: extractUniqueValues(
      consolidatedData,
      "tipo_intervencion",
    ),
    tipos_equipamiento: extractUniqueValues(
      consolidatedData,
      "tipo_equipamiento",
    ),
    frentes_activos: extractUniqueValues(consolidatedData, "frente_activo"),
    centros_gestores: extractUniqueValues(
      consolidatedData,
      "nombre_centro_gestor",
    ),
    comunas: extractUniqueValues(consolidatedData, "comuna_corregimiento"), // Mapear comuna_corregimiento a comunas
    barrios_veredas: extractUniqueValues(consolidatedData, "barrio_vereda"),
    fuentes_financiacion: extractUniqueValues(
      consolidatedData,
      "fuente_financiacion",
    ),
    anos: extractUniqueYears(consolidatedData, "ano"),
    proyectos_estrategicos: extractUniqueValues(
      consolidatedData,
      "proyectos_estrategicos",
    ), // Extraídos desde los datos reales de la API
  };

  console.log("🔍 generateFiltersFromData: Filtros extraídos:", {
    totalData: data.length,
    estados: filters.estados.length,
    tipos_intervencion: filters.tipos_intervencion.length,
    tipos_equipamiento: filters.tipos_equipamiento.length,
    frentes_activos: filters.frentes_activos.length,
    centros_gestores: filters.centros_gestores.length,
    comunas: filters.comunas.length,
    barrios_veredas: filters.barrios_veredas.length,
    fuentes_financiacion: filters.fuentes_financiacion.length,
    anos: filters.anos.length,
    proyectos_estrategicos: filters.proyectos_estrategicos?.length ?? 0,
  });

  return filters;
};

// Helper para normalizar proyectos_estrategicos: siempre retorna string[]
const normalizeProyectosEstrategicos = (value: unknown): string[] => {
  if (Array.isArray(value))
    return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim() !== "")
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

// Helper para verificar si un array de valores del item tiene al menos un match con los filtros seleccionados
const arrayHasAnyMatch = (
  itemValues: string[] | null | undefined,
  filterValues: string[],
): boolean => {
  if (!itemValues || !Array.isArray(itemValues) || itemValues.length === 0)
    return false;
  const normalizedItemValues = itemValues.map((v) =>
    String(v)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase(),
  );
  return filterValues.some((fv) =>
    normalizedItemValues.includes(
      String(fv)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase(),
    ),
  );
};

/**
 * Función para filtrar datos localmente (útil para filtrado en tiempo real)
 */

// Helper para normalizar strings para comparación (trim, lowercase y sin acentos)
const normalizeString = (str: string | null | undefined): string => {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

// Helper para comparar strings de forma segura (case-insensitive y trimmed)
const stringsMatch = (
  a: string | null | undefined,
  b: string | null | undefined,
): boolean => {
  return normalizeString(a) === normalizeString(b);
};

// Helper para verificar si un valor está en un array de valores (case-insensitive)
const valueInArray = (
  value: string | null | undefined,
  arr: string[],
): boolean => {
  const normalizedValue = normalizeString(value);
  return arr.some((item) => normalizeString(item) === normalizedValue);
};

export const filterAttributeData = (
  data: AttributeData[],
  filters: FilterParams & { searchTerm?: string },
): AttributeData[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const consolidatedData = consolidateAttributeData(data);

  // Mapear UPIDs a filas crudas para búsquedas en cascada eficientes
  const rawRowsByUpid = new Map<string, AttributeData[]>();
  data.forEach((row) => {
    const upid = normalizeString(row.upid);
    if (!upid) return;
    const list = rawRowsByUpid.get(upid) || [];
    list.push(row);
    rawRowsByUpid.set(upid, list);
  });

  // Log único al inicio con resumen de filtros
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && key !== "searchTerm")
    .map(([key]) => key);

  if (activeFilters.length > 0) {
    console.log(
      "📊 Filtering consolidated data:",
      consolidatedData.length,
      "consolidated items | raw rows:",
      data.length,
      "| filters:",
      activeFilters.join(", "),
    );
  }

  const filtered = consolidatedData.filter((item) => {
    try {
      // 1. Filtro de búsqueda por texto (searchTerm)
      if (filters.searchTerm && filters.searchTerm.trim() !== "") {
        const searchTermLower = filters.searchTerm.toLowerCase();
        
        // Comprobar coincidencia en el item consolidado primero
        let matchesSearch =
          (item.nombre_up && item.nombre_up.toLowerCase().includes(searchTermLower)) ||
          (item.descripcion_intervencion && item.descripcion_intervencion.toLowerCase().includes(searchTermLower)) ||
          (item.upid && item.upid.toLowerCase().includes(searchTermLower)) ||
          (item.identificador && item.identificador.toLowerCase().includes(searchTermLower)) ||
          (item.unidad && item.unidad.toLowerCase().includes(searchTermLower)) ||
          (item.cantidad != null && String(item.cantidad).toLowerCase().includes(searchTermLower));

        // Si no coincide, comprobar en las filas crudas de ese UPID
        if (!matchesSearch) {
          const rawRows = rawRowsByUpid.get(normalizeString(item.upid)) || [];
          matchesSearch = rawRows.some((row) =>
            (row.nombre_up && row.nombre_up.toLowerCase().includes(searchTermLower)) ||
            (row.descripcion_intervencion && row.descripcion_intervencion.toLowerCase().includes(searchTermLower)) ||
            (row.upid && row.upid.toLowerCase().includes(searchTermLower)) ||
            (row.identificador && row.identificador.toLowerCase().includes(searchTermLower)) ||
            (row.unidad && row.unidad.toLowerCase().includes(searchTermLower)) ||
            (row.cantidad != null && String(row.cantidad).toLowerCase().includes(searchTermLower))
          );
        }

        if (!matchesSearch) {
          return false;
        }
      }

      // 2. Filtros de rango numérico (avance y presupuesto)
      const avanceMin = typeof filters.avance_min === "number" ? filters.avance_min : undefined;
      const avanceMax = typeof filters.avance_max === "number" ? filters.avance_max : undefined;
      if (avanceMin !== undefined || avanceMax !== undefined) {
        const val = Number(item.avance_obra || 0);
        if (avanceMin !== undefined && val < avanceMin) return false;
        if (avanceMax !== undefined && val > avanceMax) return false;
      }

      const presupuestoMin = typeof filters.presupuesto_min === "number" ? filters.presupuesto_min : undefined;
      const presupuestoMax = typeof filters.presupuesto_max === "number" ? filters.presupuesto_max : undefined;
      if (presupuestoMin !== undefined || presupuestoMax !== undefined) {
        const val = Number(item.presupuesto_base || 0);
        if (presupuestoMin !== undefined && val < presupuestoMin) return false;
        if (presupuestoMax !== undefined && val > presupuestoMax) return false;
      }

      // 3. Filtros por categorías (incluyendo múltiples)
      const rangeKeys = new Set([
        "avance_min",
        "avance_max",
        "presupuesto_min",
        "presupuesto_max",
      ]);
      const allFilterKeys = new Set<string>();
      Object.keys(filters).forEach((key) => {
        if (key === "searchTerm") return;
        if (rangeKeys.has(key)) return; // Ya procesados arriba
        if (key.endsWith("_multiple")) {
          allFilterKeys.add(key.replace("_multiple", ""));
        } else {
          allFilterKeys.add(key);
        }
      });

      const matchesFilters = Array.from(allFilterKeys).every((baseKey) => {
        const multipleKey = `${baseKey}_multiple`;
        const multipleValues = (filters as any)[multipleKey];
        const singleValue = (filters as any)[baseKey];

        const hasMulti = multipleValues && Array.isArray(multipleValues) && multipleValues.length > 0;
        const hasSingle = singleValue !== undefined && singleValue !== null && String(singleValue).trim() !== "";

        if (!hasMulti && !hasSingle) {
          return true; // Filtro no activo para esta clave
        }

        const checkMatch = (obj: AttributeData): boolean => {
          if (hasMulti) {
            switch (baseKey) {
              case "estado":
                return valueInArray(obj.estado, multipleValues);
              case "tipo_intervencion":
                return valueInArray(obj.tipo_intervencion, multipleValues);
              case "tipo_equipamiento":
                return valueInArray(obj.tipo_equipamiento, multipleValues);
              case "frente_activo":
                return valueInArray(obj.frente_activo, multipleValues);
              case "centro_gestor":
                return valueInArray(obj.nombre_centro_gestor, multipleValues);
              case "comuna_corregimiento":
                return valueInArray(obj.comuna_corregimiento, multipleValues);
              case "barrio_vereda":
                return valueInArray(obj.barrio_vereda, multipleValues);
              case "fuente_financiacion":
                return valueInArray(obj.fuente_financiacion, multipleValues);
              case "proyectos_estrategicos":
                return arrayHasAnyMatch(obj.proyectos_estrategicos, multipleValues);
              case "clase_up":
                return valueInArray(obj.clase_up, multipleValues);
              case "ano":
                return multipleValues
                  .map((v: any) => String(v).replace(".0", ""))
                  .includes(String(obj.ano).replace(".0", ""));
              default:
                return true;
            }
          } else {
            switch (baseKey) {
              case "estado":
                return stringsMatch(obj.estado, singleValue);
              case "tipo_intervencion":
                return stringsMatch(obj.tipo_intervencion, singleValue);
              case "tipo_equipamiento":
                return stringsMatch(obj.tipo_equipamiento, singleValue);
              case "frente_activo":
                return stringsMatch(obj.frente_activo, singleValue);
              case "centro_gestor":
                return stringsMatch(obj.nombre_centro_gestor, singleValue);
              case "comuna_corregimiento":
                return stringsMatch(obj.comuna_corregimiento, singleValue);
              case "barrio_vereda":
                return stringsMatch(obj.barrio_vereda, singleValue);
              case "fuente_financiacion":
                return stringsMatch(obj.fuente_financiacion, singleValue);
              case "proyectos_estrategicos":
                return arrayHasAnyMatch(obj.proyectos_estrategicos, [singleValue]);
              case "clase_up":
                return stringsMatch(obj.clase_up, singleValue);
              case "ano":
                return String(obj.ano).replace(".0", "") === String(singleValue).replace(".0", "");
              default:
                return true;
            }
          }
        };

        // Comprobar si el item consolidado coincide directamente
        if (checkMatch(item)) {
          return true;
        }

        // Si no coincide, y NO es estado ni frente_activo (que son exclusivamente del consolidado),
        // comprobar si alguna de las filas crudas originales coincide
        if (baseKey !== "estado" && baseKey !== "frente_activo") {
          const rawRows = rawRowsByUpid.get(normalizeString(item.upid)) || [];
          if (rawRows.some(row => checkMatch(row))) {
            return true;
          }
        }

        return false;
      });

      return matchesFilters;
    } catch (err) {
      console.warn("⚠️ Error filtering consolidated item:", err, item);
      return true;
    }
  });

  // Log del resultado final
  if (activeFilters.length > 0) {
    console.log(
      "✅ filterAttributeData:",
      filtered.length,
      "items after filtering",
    );
  }

  return filtered;
};

// ────────────────────────────────────────────────────────────────
// CRUD y Solicitudes de Cambio – usan el proxy de Next.js
// ────────────────────────────────────────────────────────────────

const PROXY_BASE = "/api/proxy";

/** Devuelve el header `Authorization: Bearer <id_token>` si hay sesión Firebase. */
async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const { auth: firebaseAuth } = await import("@/lib/firebase");
    if (!firebaseAuth) return {};
    await firebaseAuth.authStateReady();
    const user = firebaseAuth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken(false);
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

/** Tipo genérico para la respuesta de mutaciones del backend */
export interface MutationResponse {
  success?: boolean;
  message?: string;
  detail?: string;
  error?: string;
  [key: string]: any;
}

/** Datos para crear una Unidad de Proyecto */
export interface CrearUnidadProyectoPayload {
  nombre_up?: string;
  nombre_up_detalle?: string;
  estado?: string;
  tipo_intervencion?: string;
  tipo_equipamiento?: string;
  clase_up?: string;
  nombre_centro_gestor?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  frente_activo?: string;
  fuente_financiacion?: string;
  direccion?: string;
  ano?: number;
  avance_obra?: number;
  presupuesto_base?: number;
  geometry?: any;
}

const CREAR_UP_ALLOWED_KEYS: Array<keyof CrearUnidadProyectoPayload> = [
  "nombre_up",
  "nombre_up_detalle",
  "estado",
  "tipo_intervencion",
  "tipo_equipamiento",
  "clase_up",
  "nombre_centro_gestor",
  "comuna_corregimiento",
  "barrio_vereda",
  "frente_activo",
  "fuente_financiacion",
  "direccion",
  "ano",
  "avance_obra",
  "presupuesto_base",
  "geometry",
];

function sanitizeCrearUnidadProyectoPayload(
  data: CrearUnidadProyectoPayload,
): CrearUnidadProyectoPayload {
  const payload: CrearUnidadProyectoPayload = {};

  for (const key of CREAR_UP_ALLOWED_KEYS) {
    const rawValue = data[key];

    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (!trimmed) continue;
      (payload as any)[key] = trimmed;
      continue;
    }

    if (typeof rawValue === "number") {
      if (!Number.isFinite(rawValue)) continue;
      (payload as any)[key] = rawValue;
      continue;
    }

    (payload as any)[key] = rawValue;
  }

  return payload;
}

/** Datos para crear una Intervención */
export interface CrearIntervencionPayload {
  upid: string;
  bpin?: number;
  cantidad?: number;
  clase_up?: string;
  fecha_fin?: string;
  fecha_inicio?: string;
  fuente_financiacion?: string;
  identificador?: string;
  nombre_centro_gestor?: string;
  presupuesto_base?: number;
  referencia_contrato?: string;
  referencia_proceso?: string;
  tipo_intervencion?: string;
  unidad?: string;
  url_proceso?: string;
  descripcion_intervencion?: string;
}

const CREAR_INTERVENCION_ALLOWED_KEYS: Array<keyof CrearIntervencionPayload> = [
  "upid",
  "bpin",
  "cantidad",
  "clase_up",
  "fecha_fin",
  "fecha_inicio",
  "fuente_financiacion",
  "identificador",
  "nombre_centro_gestor",
  "presupuesto_base",
  "referencia_contrato",
  "referencia_proceso",
  "tipo_intervencion",
  "unidad",
  "url_proceso",
  "descripcion_intervencion",
];

function sanitizeCrearIntervencionPayload(
  data: CrearIntervencionPayload,
): CrearIntervencionPayload {
  const payload: CrearIntervencionPayload = { upid: "" };

  for (const key of CREAR_INTERVENCION_ALLOWED_KEYS) {
    const rawValue = data[key];

    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (!trimmed) continue;
      (payload as any)[key] = trimmed;
      continue;
    }

    if (typeof rawValue === "number") {
      if (!Number.isFinite(rawValue)) continue;
      (payload as any)[key] = rawValue;
      continue;
    }

    (payload as any)[key] = rawValue;
  }

  return payload;
}

/** Datos para solicitud de cambio de UP */
export interface SolicitudCambioUPPayload {
  upid: string;
  aprobado?: boolean;
  nombre_centro_gestor?: string;
  tipo_intervencion?: string;
  estado?: string;
  clase_up?: string;
  tipo_equipamiento?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  frente_activo?: string;
  fuente_financiacion?: string;
  direccion?: string;
  ano?: number;
  avance_obra?: number;
  presupuesto_base?: number;
  nombre_up?: string;
  nombre_up_detalle?: string;
  geometry?: any;
}

/** Datos para solicitud de cambio de Intervención */
export interface SolicitudCambioIntervencionPayload {
  intervencion_id: string;
  upid?: string;
  bpin?: string | number;
  cantidad?: number;
  clase_up?: string;
  fecha_fin?: string;
  fecha_inicio?: string;
  fuente_financiacion?: string;
  identificador?: string;
  nombre_centro_gestor?: string;
  presupuesto_base?: number;
  referencia_contrato?: string;
  referencia_proceso?: string;
  tipo_intervencion?: string;
  unidad?: string;
  url_proceso?: string;
  descripcion_intervencion?: string;
}

/** Datos para modificar una Intervención (validador aprueba) */
export interface ModificarIntervencionPayload {
  intervencion_id: string;
  [key: string]: any;
}

/** Interfaz de una solicitud de cambio (devuelta por GET) */
export interface SolicitudCambio {
  id: string;
  tipo?: "unidad_proyecto" | "intervencion";
  upid?: string;
  intervencion_id?: string;
  created_at?: string;
  updated_at?: string;
  // Todos los demás campos vienen planos según lo que se solicitó cambiar
  [key: string]: any;
}

// ── helpers internos ─────────────────────────────────────────────

async function proxyPost<T = MutationResponse>(
  path: string,
  body: Record<string, any>,
): Promise<T> {
  const authHeader = await getAuthHeaders();
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  invalidateUnidadesProyectoCache();
  return json as T;
}

async function proxyPut<T = MutationResponse>(
  path: string,
  body: Record<string, any>,
): Promise<T> {
  const authHeader = await getAuthHeaders();
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  invalidateUnidadesProyectoCache();
  return json as T;
}

/** PUT con query params (para /modificar/unidad_proyecto que usa query) */
async function proxyPutParams<T = MutationResponse>(
  path: string,
  params: Record<string, string>,
  body?: Record<string, any>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const authHeader = await getAuthHeaders();
  const res = await fetch(`${PROXY_BASE}/${path}?${qs}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  invalidateUnidadesProyectoCache();
  return json as T;
}

async function proxyDelete<T = MutationResponse>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const authHeader = await getAuthHeaders();
  const res = await fetch(`${PROXY_BASE}/${path}?${qs}`, {
    method: "DELETE",
    headers: { ...authHeader },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

async function proxyGet<T = any>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  const authHeader = await getAuthHeaders();
  const res = await fetch(`${PROXY_BASE}/${path}${qs}`, {
    headers: { ...authHeader },
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

// ── CRUD: Unidades de Proyecto ───────────────────────────────────

/** POST /crear_unidad_proyecto */
export const crearUnidadProyecto = (data: CrearUnidadProyectoPayload) =>
  proxyPost("crear_unidad_proyecto", sanitizeCrearUnidadProyectoPayload(data));

/** DELETE /eliminar_unidad_proyecto?upid=... */
export const eliminarUnidadProyecto = (upid: string) =>
  proxyDelete("eliminar_unidad_proyecto", { upid });

// ── CRUD: Intervenciones ─────────────────────────────────────────

/** POST /crear_intervencion */
export const crearIntervencion = (data: CrearIntervencionPayload) =>
  proxyPost("crear_intervencion", sanitizeCrearIntervencionPayload(data));

/** DELETE /eliminar_intervencion?intervencion_id=... */
export const eliminarIntervencion = (intervencionId: string) =>
  proxyDelete("eliminar_intervencion", { intervencion_id: intervencionId });

/** GET /intervenciones (con filtros opcionales) */
export const fetchIntervenciones = (params?: Record<string, string>) =>
  proxyGet<any[]>("intervenciones", params);

// ── Solicitudes de Cambio ────────────────────────────────────────

/** POST /solicitudes_cambios_unidad_proyecto */
export const crearSolicitudCambioUP = (data: SolicitudCambioUPPayload) => {
  const allowedKeys: Array<keyof SolicitudCambioUPPayload> = [
    "upid",
    "aprobado",
    "nombre_up",
    "nombre_up_detalle",
    "tipo_equipamiento",
    "clase_up",
    "direccion",
    "geometry",
  ];

  const payload: Record<string, any> = {
    aprobado: data.aprobado ?? true,
  };

  for (const key of allowedKeys) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      payload[key] = trimmed;
      continue;
    }
    payload[key] = value;
  }

  return proxyPost("solicitudes_cambios_unidad_proyecto", payload);
};

/** POST /solicitudes_cambios_intervencion */
export const crearSolicitudCambioIntervencion = (
  data: SolicitudCambioIntervencionPayload,
) => proxyPost("solicitudes_cambios_intervencion", data);

/** GET /solicitudes_cambios_unidades_proyecto (listado para validadores) */
export const fetchSolicitudesCambiosUP = async (
  params?: Record<string, string>,
): Promise<SolicitudCambio[]> => {
  const res = await proxyGet<any>("solicitudes_cambios_unidades_proyecto", {
    limit: "10000",
    ...params,
  });
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

/** GET /solicitudes_cambios_intervenciones (listado para validadores) */
export const fetchSolicitudesCambiosIntervencion = async (
  params?: Record<string, string>,
): Promise<SolicitudCambio[]> => {
  const res = await proxyGet<any>("solicitudes_cambios_intervenciones", {
    limit: "10000",
    ...params,
  });
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
};

// ── Aprobación / Rechazo (Validador) ─────────────────────────────

/** PUT /modificar/unidad_proyecto con aprobado=false — rechazar solicitud UP */
export const rechazarUnidadProyecto = (upid: string) =>
  proxyPutParams("modificar/unidad_proyecto", {
    upid,
    aprobado: "false",
    extra_data_: "{}",
  });

/** PUT /modificar/unidad_proyecto — aplicar edición directa de UP */
export interface ModificarUnidadProyectoPayload {
  upid: string;
  [key: string]: any;
}
export const modificarUnidadProyecto = (data: ModificarUnidadProyectoPayload) =>
  proxyPut("modificar/unidad_proyecto", { ...data, aprobado: true });

/** PUT /modificar/intervencion — aprobar: aplica cambios + aprobado=true (body) */
export const modificarIntervencion = (data: ModificarIntervencionPayload) =>
  proxyPut("modificar/intervencion", { ...data, aprobado: true });

/** PUT /modificar/intervencion con aprobado=false — rechazar solicitud intervención */
export const rechazarIntervencion = (intervencion_id: string) =>
  proxyPut("modificar/intervencion", { intervencion_id, aprobado: false });

// ── Export XLSX ──────────────────────────────────────────────────

/** GET /unidades-proyecto/intervenciones/export-xlsx — descarga un blob XLSX */
export const exportarIntervencionesXLSX = async (
  filters?: Record<string, string>,
): Promise<Blob> => {
  const qs = filters ? `?${new URLSearchParams(filters).toString()}` : "";
  const authHeader = await getAuthHeaders();
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/unidades-proyecto/intervenciones/export-xlsx${qs}`,
    { headers: { ...authHeader } },
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => "Error desconocido");
    throw new Error(`Error al exportar XLSX: ${errText}`);
  }
  return res.blob();
};

// Exportar configuración para uso en otros lugares
export { API_CONFIG };
