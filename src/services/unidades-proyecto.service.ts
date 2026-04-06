/**
 * Servicio para la gestión de Unidades de Proyecto
 * Implementa programación funcional con manejo de errores robusto
 */

import { z } from 'zod';
import { parseGeometry, createGeoJSONFeatureCollection } from '@/utils/geometryParser';

// Schemas de validación usando Zod para garantizar tipo de datos
const GeometrySchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.object({
    type: z.literal('Feature'),
    geometry: z.object({
      type: z.enum(['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection']),
      coordinates: z.union([
        // Point: [lon, lat]
        z.tuple([z.number(), z.number()]),
        // LineString: [[lon, lat], [lon, lat], ...]
        z.array(z.tuple([z.number(), z.number()])),
        // Polygon: [[[lon, lat], [lon, lat], ...]]
        z.array(z.array(z.tuple([z.number(), z.number()]))),
        // Casos más complejos
        z.array(z.any())
      ]).optional(), // Hacer opcional porque GeometryCollection no tiene coordinates directas
      geometries: z.array(z.any()).optional() // Para GeometryCollection
    }),
    properties: z.record(z.any())
  }))
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
  proyectos_estrategicos: z.union([z.array(z.string()), z.string()]).optional().transform(val => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  }), // Ahora es lista, con compatibilidad legacy string
  unidad: z.string().optional(),
  cantidad: z.union([z.string(), z.number()]).optional()
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
  proyectos_estrategicos: z.array(z.string()).optional() // Nuevos proyectos estratégicos
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
const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://gestorproyectoapi-production.up.railway.app',
  ENDPOINT: '/unidades-proyecto', // Endpoint unificado simplificado
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
} as const;

// Utilidad para manejar errores de manera funcional
const handleApiError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new Error(`API Error: ${error.message}`);
  }
  throw new Error('API Error: Unknown error occurred');
};

// Utilidad para delay en reintentos
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Cache en memoria para datos inmutables (opcional)
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_UNIDADES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora
const parsedUnidadesCacheTtl = Number(process.env.NEXT_PUBLIC_UNIDADES_CACHE_TTL_MS);
const CACHE_TTL = Number.isFinite(parsedUnidadesCacheTtl) && parsedUnidadesCacheTtl > 0
  ? parsedUnidadesCacheTtl
  : DEFAULT_UNIDADES_CACHE_TTL_MS;

// Utilidad para hacer fetch con retry optimizado
const fetchWithRetry = async (
  url: string, 
  options: RequestInit = {}, 
  attempts: number = API_CONFIG.RETRY_ATTEMPTS,
  useCache: boolean = false
): Promise<Response> => {
  // Verificar cache si está habilitado
  if (useCache) {
    const cached = memoryCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('💾 Using cached data for:', url.split('?')[0]);
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
    
    // Solo agregar cache-busting si NO estamos usando cache
    const finalUrl = useCache ? url : `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    
    const response = await fetch(finalUrl, {
      ...options,
      signal: controller.signal,
      cache: useCache ? 'default' : 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(useCache ? {} : {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }),
        ...options.headers
      }
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
  'centro_gestor': 'nombre_centro_gestor',
  'centro_gestor_multiple': 'nombre_centro_gestor',
  'comuna_corregimiento': 'comuna_corregimiento',
  'comuna_corregimiento_multiple': 'comuna_corregimiento',
  'presupuesto_min': 'presupuesto_base',
  'avance_min': 'avance_obra'
};

// Función optimizada para construir query string de filtros
const buildFilterQuery = (filters: FilterParams, verbose: boolean = false): string => {
  const params = new URLSearchParams();
  
  if (verbose) console.log('🔍 BuildFilterQuery: Input filters:', filters);

  // Determinar qué claves base tienen una versión _multiple con valores,
  // para evitar duplicar parámetros cuando ambas variantes (simple y múltiple) están presentes.
  const baseKeysWithMultipleValues = new Set(
    Object.entries(filters)
      .filter(([key, value]) => key.endsWith('_multiple') && Array.isArray(value) && (value as string[]).length > 0)
      .map(([key]) => key.replace('_multiple', ''))
  );
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    
    // Determinar la clave del parámetro para la API
    const apiKey = FILTER_KEY_MAP[key] || key.replace('_multiple', '');
    
    // Manejar arrays (_multiple keys)
    if (Array.isArray(value) && value.length > 0) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          params.append(apiKey, String(item));
        }
      });
    } 
    // Manejar valores simples — omitir si ya existe una versión _multiple con valores
    else if (!key.endsWith('_multiple') && !baseKeysWithMultipleValues.has(key)) {
      params.append(apiKey, String(value));
    }
  });
  
  const queryString = params.toString();
  if (verbose && queryString) {
    console.log(`🔍 BuildFilterQuery: ${queryString}`);
  }
  
  return queryString;
};

export const exportIntervencionesXlsx = async (filters: FilterParams = {}): Promise<Blob> => {
  const queryString = buildFilterQuery(filters, false);
  const url = `${API_CONFIG.BASE_URL}/unidades-proyecto/intervenciones/export-xlsx${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream'
    }
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

const fetchUnidadesProyectoRaw = async (filters: FilterParams = {}): Promise<any> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;
    const queryString = buildFilterQuery(filters, false);

    // Primera página: limit + offset=0
    const firstPageQuery = queryString
      ? `${queryString}&limit=${FETCH_PAGE_SIZE}&offset=0`
      : `limit=${FETCH_PAGE_SIZE}&offset=0`;

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}?${firstPageQuery}`;

    console.log(`🌐 fetchUnidadesProyectoRaw: Fetching page 1 (limit=${FETCH_PAGE_SIZE})`);
    console.log(`🔗 fetchUnidadesProyectoRaw: URL = ${url}`);

    // Usar cache para peticiones sin filtros (solo primera página)
    const response = await fetchWithRetry(url, {}, API_CONFIG.RETRY_ATTEMPTS, !hasFilters);
    const rawData = await response.json();

    console.log(`📦 fetchUnidadesProyectoRaw: Response keys =`, Object.keys(rawData));

    if (!rawData.success || !Array.isArray(rawData.data)) {
      console.error('❌ Invalid API response structure:', rawData);
      throw new Error('Respuesta inválida: se esperaba { success: true, data: [...] }');
    }

    const totalCount = Number(rawData.count ?? rawData.total ?? rawData.data.length);
    let allData = [...rawData.data];

    // Paginar si hay más registros que los recibidos en la primera página
    if (allData.length < totalCount) {
      const totalPages = Math.ceil(totalCount / FETCH_PAGE_SIZE);
      console.log(`📄 fetchUnidadesProyectoRaw: Paginando — total ${totalCount} registros, ${totalPages} páginas`);

      for (let page = 1; page < totalPages && allData.length < totalCount; page++) {
        const offset = page * FETCH_PAGE_SIZE;
        const pageQuery = queryString
          ? `${queryString}&limit=${FETCH_PAGE_SIZE}&offset=${offset}`
          : `limit=${FETCH_PAGE_SIZE}&offset=${offset}`;

        const pageUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINT}?${pageQuery}`;

        console.log(`📄 fetchUnidadesProyectoRaw: Fetching page ${page + 1}/${totalPages} (offset=${offset})`);

        const pageResponse = await fetchWithRetry(pageUrl, {}, API_CONFIG.RETRY_ATTEMPTS, false);
        const pageData = await pageResponse.json();

        if (pageData.success && Array.isArray(pageData.data) && pageData.data.length > 0) {
          allData = allData.concat(pageData.data);
        } else {
          console.log(`📄 fetchUnidadesProyectoRaw: Page ${page + 1} returned no data, stopping pagination`);
          break;
        }
      }
    }

    console.log(`📊 fetchUnidadesProyectoRaw: Total ${allData.length} registros obtenidos (API reportó ${totalCount})`);

    // Convertir cada item del array "data" a un Feature GeoJSON
    const features = allData.map((item: any) => {
      const { geometry, ...properties } = item;
      return {
        type: 'Feature',
        geometry: geometry || null,
        properties: properties
      };
    });

    // Crear GeoJSON FeatureCollection
    const geoJsonData = {
      type: 'FeatureCollection',
      features: features
    };

    console.log(`✅ fetchUnidadesProyectoRaw: ${geoJsonData.features.length} features in GeoJSON FeatureCollection`);

    return geoJsonData;
  } catch (error) {
    console.error('❌ fetchUnidadesProyectoRaw error:', error);
    throw error;
  }
};

/**
 * Obtiene datos de geometría con filtros opcionales
 * Ahora usa el endpoint unificado internamente
 */
export const fetchGeometryData = async (filters: FilterParams = {}): Promise<GeometryData> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;
    
    if (hasFilters) {
      console.log(`🌐 fetchGeometryData: Fetching with filters`);
    }
    
    // Obtener datos desde el endpoint unificado
    const rawData = await fetchUnidadesProyectoRaw(filters);
    
    // El endpoint unificado ya devuelve un GeoJSON FeatureCollection válido
    let geoJsonData = {
      type: rawData.type,
      features: rawData.features
    };
    
    if (hasFilters) {
      console.log(`📊 fetchGeometryData: ${geoJsonData.features.length} features loaded`);
    }
    
    // Procesar geometrías con el parser para manejar strings JSON
    console.log(`🔧 fetchGeometryData: Parsing geometries...`);
    const parsedFeatures = geoJsonData.features.map((feature: any) => {
      const parsedGeometry = parseGeometry(feature.geometry);
      
      if (!parsedGeometry) {
        console.warn(`⚠️ Failed to parse geometry for feature:`, feature.properties?.upid);
        return null;
      }
      
      return {
        type: 'Feature',
        geometry: parsedGeometry,
        properties: feature.properties
      };
    }).filter((f: any) => f !== null);
    
    const parsedGeoJsonData = {
      type: 'FeatureCollection' as const,
      features: parsedFeatures
    };
    
    console.log(`✅ fetchGeometryData: Parsed ${parsedFeatures.length} of ${geoJsonData.features.length} features`);
    
    // Validar estructura de datos con el schema
    const validatedData = GeometrySchema.parse(parsedGeoJsonData);
    
    console.log(`✅ fetchGeometryData: Successfully validated ${validatedData.features.length} features`);
    
    return validatedData;
  } catch (error) {
    console.error('❌ fetchGeometryData error:', error);
    return handleApiError(error);
  }
};

/**
 * Obtiene datos de atributos con filtros opcionales
 * Ahora usa el endpoint unificado internamente
 */
export const fetchAttributeData = async (filters: FilterParams = {}): Promise<AttributeData[]> => {
  try {
    const hasFilters = Object.keys(filters).length > 0;
    
    // Obtener datos desde el endpoint unificado
    const rawData = await fetchUnidadesProyectoRaw(filters);
    
    // Procesar features del GeoJSON: cada feature es una unidad con properties + (opcional) intervenciones
    const dataArray = rawData.features;
    
    console.log(`📊 fetchAttributeData: Processing ${dataArray.length} raw items`);
    
    // Detectar si el endpoint de unidades trae campos de intervención
    const hasInterventionFields = dataArray.some((item: any) => {
      const properties = item.properties || item;
      return Boolean(
        properties?.intervenciones?.length ||
        properties?.estado ||
        properties?.tipo_intervencion ||
        properties?.presupuesto_base ||
        properties?.avance_obra
      );
    });

    // Si el endpoint de unidades NO trae campos de intervención, usar fallback con /intervenciones
    let intervencionesByUpid = new Map<string, any[]>();
    if (!hasInterventionFields) {
      console.warn('⚠️ fetchAttributeData: Datos de unidades sin intervenciones. Usando fallback /intervenciones.');
      try {
        let allIntervenciones: any[] = [];
        let intervOffset = 0;
        const intervPageSize = FETCH_PAGE_SIZE;

        // Paginar /intervenciones hasta obtener todos los registros
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const intervencionesUrl = `${API_CONFIG.BASE_URL}/intervenciones?limit=${intervPageSize}&offset=${intervOffset}`;
          const intervencionesResponse = await fetchWithRetry(intervencionesUrl, {}, API_CONFIG.RETRY_ATTEMPTS, !hasFilters && intervOffset === 0);
          const intervencionesPayload = await intervencionesResponse.json();
          const pageData = Array.isArray(intervencionesPayload?.data) ? intervencionesPayload.data : [];

          if (pageData.length === 0) break;
          allIntervenciones = allIntervenciones.concat(pageData);

          const intervTotal = Number(intervencionesPayload?.count ?? intervencionesPayload?.total ?? 0);
          if (allIntervenciones.length >= intervTotal || pageData.length < intervPageSize) break;
          intervOffset += intervPageSize;
        }

        allIntervenciones.forEach((interv: any) => {
          const key = String(interv?.upid || '').trim().toLowerCase();
          if (!key) return;
          const bucket = intervencionesByUpid.get(key);
          if (bucket) {
            bucket.push(interv);
          } else {
            intervencionesByUpid.set(key, [interv]);
          }
        });

        console.log(`✅ fetchAttributeData: ${allIntervenciones.length} intervenciones agrupadas por UPID`);
      } catch (intervencionesError) {
        console.error('❌ fetchAttributeData: Error cargando /intervenciones', intervencionesError);
      }
    }

    const inferFrenteActivo = (estados: string[]): string => {
      const normalized = estados.map(val => String(val || '').toLowerCase());
      if (normalized.some(val => val.includes('ejecucion') || val.includes('ejecución') || val.includes('activ') || val.includes('proceso'))) {
        return 'Frente activo';
      }
      if (normalized.some(val => val.includes('terminad') || val.includes('finaliz') || val.includes('complet'))) {
        return 'No aplica';
      }
      return 'No aplica';
    };

    // Procesar y validar cada elemento con manejo de errores individuales
    const validatedData: AttributeData[] = [];
    
    dataArray.forEach((item: any, index: number) => {
      try {
        const properties = item.properties || item;
        
        // ==========================================
        // MANEJO DE MÚLTIPLES ESTRUCTURAS DE DATOS
        // ==========================================
        // La API puede devolver dos estructuras diferentes:
        // 1) Estructura NUEVA con campo 'intervenciones' (array de intervenciones)
        // 2) Estructura ANTIGUA sin 'intervenciones' (datos directos en el objeto)
        
        const upidKey = String(properties.upid || '').trim().toLowerCase();
        const intervenciones = properties.intervenciones || intervencionesByUpid.get(upidKey) || [];
        const esEstructuraNueva = intervenciones.length > 0;
        const primeraIntervencion = esEstructuraNueva ? intervenciones[0] : {};
        
        // 💰 CORRECCIÓN: Sumar presupuestos de TODAS las intervenciones, no solo la primera
        let presupuesto_base = 0;
        if (esEstructuraNueva) {
          presupuesto_base = intervenciones.reduce((sum: number, interv: any) => {
            const presupuesto = parseFloat(interv.presupuesto_base || 0);
            return sum + presupuesto;
          }, 0);
        } else {
          // Estructura antigua: presupuesto directo
          presupuesto_base = parseFloat(properties.presupuesto_base || 0);
        }
        
        // 📊 CORRECCIÓN: Calcular avance promedio ponderado por presupuesto
        let avance_obra = 0;
        if (esEstructuraNueva && intervenciones.length > 0 && presupuesto_base > 0) {
          // Promedio ponderado: (suma de avance * presupuesto) / presupuesto total
          const avancePonderado = intervenciones.reduce((sum: number, interv: any) => {
            const avance = parseFloat(interv.avance_obra || 0);
            const presupuesto = parseFloat(interv.presupuesto_base || 0);
            return sum + (avance * presupuesto);
          }, 0);
          avance_obra = avancePonderado / presupuesto_base;
        } else {
          // Estructura antigua: avance directo
          avance_obra = parseFloat(properties.avance_obra || 0);
        }
        
        // 🔢 CORRECCIÓN: n_intervenciones
        // En estructura nueva: viene en properties
        // En estructura antigua: NO EXISTE, usar 1 como valor por defecto (cada registro = 1 intervención)
        const n_intervenciones = esEstructuraNueva 
          ? (parseInt(properties.n_intervenciones) || intervenciones.length)
          : 1; // Cada registro sin 'intervenciones' representa 1 intervención
        
        // 🚧 CORRECCIÓN: frente_activo
        // En estructura nueva: viene dentro de cada intervención
        // En estructura antigua: NO EXISTE, calcular basándose en el estado
        let frente_activo = 'No aplica';
        if (esEstructuraNueva) {
          const estados = intervenciones.map((interv: any) => interv?.estado).filter(Boolean);
          frente_activo = estados.length > 0 ? inferFrenteActivo(estados) : (primeraIntervencion.frente_activo || 'No aplica');
        } else {
          const estado = (properties.estado || '').toLowerCase();
          frente_activo = inferFrenteActivo([estado]);
        }
        
        // El campo nombre_centro_gestor puede venir de diferentes lugares
        const centroGestor = properties.nombre_centro_gestor || 
                           primeraIntervencion.nombre_centro_gestor ||
                           undefined;
        
        // Extraer unidad/cantidad/identificador con cuidado (pueden ser 0, "", etc.)
        const extractField = (field: string): any => {
          const fromInterv = primeraIntervencion?.[field];
          const fromProps = properties?.[field];
          return fromInterv != null && fromInterv !== '' ? fromInterv
               : fromProps != null && fromProps !== '' ? fromProps
               : undefined;
        };

        const validatedItem = AttributeSchema.parse({
          upid: properties.upid || '',
          nombre_up: properties.nombre_up || '',
          nombre_up_detalle: properties.nombre_up_detalle || undefined,
          identificador: extractField('identificador'),
          n_intervenciones: n_intervenciones,
          // Campos que pueden venir de la intervención o de properties
          estado: primeraIntervencion.estado || properties.estado || 'Sin estado',
          tipo_intervencion: primeraIntervencion.tipo_intervencion || properties.tipo_intervencion || 'Sin especificar',
          tipo_equipamiento: properties.tipo_equipamiento || undefined,
          clase_up: properties.clase_up || primeraIntervencion.clase_up || undefined,
          frente_activo: frente_activo,
          nombre_centro_gestor: centroGestor,
          comuna_corregimiento: properties.comuna_corregimiento || '',
          barrio_vereda: properties.barrio_vereda || '',
          direccion: properties.direccion || undefined,
          presupuesto_base: presupuesto_base,
          avance_obra: avance_obra,
          fecha_inicio: primeraIntervencion.fecha_inicio || properties.fecha_inicio || '',
          fecha_fin: primeraIntervencion.fecha_fin || properties.fecha_fin || '',
          fecha_inauguracion: primeraIntervencion.fecha_inauguracion || properties.fecha_inauguracion || undefined,
          duracion_proyecto: primeraIntervencion.duracion_proyecto || properties.duracion_proyecto || undefined,
          descripcion_intervencion: primeraIntervencion.descripcion_intervencion || properties.descripcion_intervencion || '',
          fuente_financiacion: primeraIntervencion.fuente_financiacion || properties.fuente_financiacion || '',
          referencia_contrato: primeraIntervencion.referencia_contrato || properties.referencia_contrato || undefined,
          referencia_proceso: primeraIntervencion.referencia_proceso || properties.referencia_proceso || undefined,
          url_proceso: primeraIntervencion.url_proceso || properties.url_proceso || undefined,
          ano: parseInt(primeraIntervencion.ano || properties.ano || properties.anio || 0),
          proyectos_estrategicos: normalizeProyectosEstrategicos(properties.proyectos_estrategicos),
          unidad: extractField('unidad'),
          cantidad: extractField('cantidad')
        });
        
        validatedData.push(validatedItem);
      } catch (validationError) {
        console.warn(`⚠️ Validation failed for item ${index}:`, validationError);
        console.warn('Item data:', item);
        // Continuar con el siguiente elemento sin interrumpir el proceso
      }
    });
    
    // Log conciso del resultado
    if (hasFilters) {
      console.log(`✅ fetchAttributeData: ${validatedData.length} items loaded with filters`);
    }
    
    return validatedData;
  } catch (error) {
    console.error('❌ fetchAttributeData error:', error);
    return handleApiError(error);
  }
};

/**
 * Obtiene opciones de filtros disponibles
 * Siempre genera filtros desde los datos reales de attributes para garantizar consistencia
 */
export const fetchFilterData = async (): Promise<FilterData> => {
  try {
    console.log(`🌐 fetchFilterData: Obteniendo filtros desde datos de attributes`);
    
    // SIEMPRE obtener filtros desde los datos reales de attributes
    const attributeData = await fetchAttributeData();
    
    if (!attributeData || attributeData.length === 0) {
      console.warn('⚠️ No hay datos de attributes disponibles para generar filtros');
      return FilterSchema.parse({
        estados: [],
        tipos_intervencion: [],
        tipos_equipamiento: [],
        centros_gestores: [],
        comunas_corregimientos: [],
        barrios_veredas: [],
        fuentes_financiacion: [],
        anos: []
      });
    }
    
    console.log(`📊 fetchFilterData: Generando filtros desde ${attributeData.length} registros`);
    
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
      anos: generatedFilters.anos.length
    });
    
    // Log de muestra de valores
    console.log(`📋 fetchFilterData: Muestra de valores únicos:`, {
      estados: generatedFilters.estados.slice(0, 3),
      tipos_intervencion: generatedFilters.tipos_intervencion.slice(0, 3),
      tipos_equipamiento: generatedFilters.tipos_equipamiento.slice(0, 3),
      centros_gestores: generatedFilters.centros_gestores.slice(0, 3),
      comunas: generatedFilters.comunas.slice(0, 3),
      anos: generatedFilters.anos
    });
    
    return generatedFilters;
  } catch (error) {
    console.error('❌ fetchFilterData error:', error);
    return handleApiError(error);
  }
};

/**
 * Función utilitaria para generar filtros desde datos existentes
 * Extrae valores únicos de cada campo, filtrando vacíos y undefined
 */
export const consolidateAttributeData = (data: AttributeData[]): AttributeData[] => {
  const grouped = new Map<string, AttributeData[]>();

  data.forEach(item => {
    const key = String(item.upid || '').trim().toLowerCase();
    if (!key) return;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  });

  return Array.from(grouped.values()).map(group => {
    const base = group[0];
    const estados = new Set(group.map(i => i.estado).filter(Boolean));
    const tipos = new Set(group.map(i => i.tipo_intervencion).filter(Boolean));
    const centros = new Set(group.map(i => i.nombre_centro_gestor).filter(Boolean));
    const avances = group
      .map(i => i.avance_obra)
      .filter((val): val is number => typeof val === 'number' && !Number.isNaN(val));
    const presupuestos = group
      .map(i => i.presupuesto_base)
      .filter((val): val is number => typeof val === 'number' && !Number.isNaN(val));

    const estadoConsolidado = estados.size === 1
      ? Array.from(estados)[0]!
      : (estados.size > 1 ? 'Varios estados' : 'Sin estado');

    const tipoConsolidado = tipos.size === 1
      ? Array.from(tipos)[0]!
      : (tipos.size > 1 ? 'Varios tipos' : 'Sin tipo');

    const centroConsolidado = centros.size === 1
      ? Array.from(centros)[0]!
      : (centros.size > 1 ? 'Intervenido por varios organismos' : 'Sin centro');

    const avancePromedio = avances.length > 0
      ? avances.reduce((sum, val) => sum + val, 0) / avances.length
      : 0;

    const presupuestoTotal = presupuestos.length > 0
      ? presupuestos.reduce((sum, val) => sum + val, 0)
      : 0;

    // Preservar identificador/unidad/cantidad del primer item que los tenga
    const identificador = group.find(i => i.identificador != null && i.identificador !== '')?.identificador ?? base.identificador;
    const unidad = group.find(i => i.unidad != null && i.unidad !== '')?.unidad ?? base.unidad;
    const cantidad = group.find(i => i.cantidad != null && i.cantidad !== '')?.cantidad ?? base.cantidad;

    return {
      ...base,
      estado: estadoConsolidado,
      tipo_intervencion: tipoConsolidado,
      nombre_centro_gestor: centroConsolidado,
      avance_obra: avancePromedio,
      presupuesto_base: presupuestoTotal,
      proyectos_estrategicos: normalizeProyectosEstrategicos(base.proyectos_estrategicos),
      identificador,
      unidad,
      cantidad
    };
  });
};

export const generateFiltersFromData = (data: AttributeData[]): FilterData => {
  const consolidatedData = consolidateAttributeData(data);
  const extractUniqueValues = <T>(items: T[], key: keyof T): string[] => {
    const values: string[] = [];
    items.forEach(item => {
      const val = item[key];
      if (val === undefined || val === null) return;
      if (Array.isArray(val)) {
        val.forEach(v => {
          const s = String(v).trim();
          if (s) values.push(s);
        });
      } else {
        const s = String(val).trim();
        if (s) values.push(s);
      }
    });
    
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'es'));
  };

  const extractUniqueYears = <T>(items: T[], key: keyof T): string[] => {
    const years = items
      .map(item => String(item[key]).replace('.0', '')) // Remover .0 de los años
      .filter(year => year && year !== 'undefined' && year !== 'null' && !isNaN(Number(year)));
    
    return Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a));
  };

  const filters = {
    estados: extractUniqueValues(consolidatedData, 'estado'),
    tipos_intervencion: extractUniqueValues(consolidatedData, 'tipo_intervencion'),
    tipos_equipamiento: extractUniqueValues(consolidatedData, 'tipo_equipamiento'),
    frentes_activos: extractUniqueValues(consolidatedData, 'frente_activo'),
    centros_gestores: extractUniqueValues(consolidatedData, 'nombre_centro_gestor'),
    comunas: extractUniqueValues(consolidatedData, 'comuna_corregimiento'), // Mapear comuna_corregimiento a comunas
    barrios_veredas: extractUniqueValues(consolidatedData, 'barrio_vereda'),
    fuentes_financiacion: extractUniqueValues(consolidatedData, 'fuente_financiacion'),
    anos: extractUniqueYears(consolidatedData, 'ano'),
    proyectos_estrategicos: extractUniqueValues(consolidatedData, 'proyectos_estrategicos') // Extraídos desde los datos reales de la API
  };
  
  console.log('🔍 generateFiltersFromData: Filtros extraídos:', {
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
    proyectos_estrategicos: filters.proyectos_estrategicos?.length ?? 0
  });
  
  return filters;
};

// Helper para normalizar proyectos_estrategicos: siempre retorna string[]
const normalizeProyectosEstrategicos = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim() !== '') return value.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// Helper para verificar si un array de valores del item tiene al menos un match con los filtros seleccionados
const arrayHasAnyMatch = (itemValues: string[] | null | undefined, filterValues: string[]): boolean => {
  if (!itemValues || !Array.isArray(itemValues) || itemValues.length === 0) return false;
  const normalizedItemValues = itemValues.map(v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
  return filterValues.some(fv => normalizedItemValues.includes(String(fv).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()));
};

/**
 * Función para filtrar datos localmente (útil para filtrado en tiempo real)
 */

// Helper para normalizar strings para comparación (trim, lowercase y sin acentos)
const normalizeString = (str: string | null | undefined): string => {
  if (!str) return '';
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
};

// Helper para comparar strings de forma segura (case-insensitive y trimmed)
const stringsMatch = (a: string | null | undefined, b: string | null | undefined): boolean => {
  return normalizeString(a) === normalizeString(b);
};

// Helper para verificar si un valor está en un array de valores (case-insensitive)
const valueInArray = (value: string | null | undefined, arr: string[]): boolean => {
  const normalizedValue = normalizeString(value);
  return arr.some(item => normalizeString(item) === normalizedValue);
};

export const filterAttributeData = (
  data: AttributeData[], 
  filters: FilterParams & { searchTerm?: string }
): AttributeData[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const consolidatedData = consolidateAttributeData(data);

  // Log único al inicio con resumen de filtros
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && key !== 'searchTerm')
    .map(([key]) => key);
  
  if (activeFilters.length > 0) {
    console.log('📊 Filtering:', data.length, 'items |', activeFilters.join(', '));
  }

  const matchesAllFiltersForRow = (item: AttributeData): boolean => {
    try {
      // Filtro de búsqueda por texto
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          (item.nombre_up && item.nombre_up.toLowerCase().includes(searchTermLower)) ||
          (item.descripcion_intervencion && item.descripcion_intervencion.toLowerCase().includes(searchTermLower)) ||
          (item.upid && item.upid.toLowerCase().includes(searchTermLower)) ||
          (item.identificador && item.identificador.toLowerCase().includes(searchTermLower)) ||
          (item.unidad && item.unidad.toLowerCase().includes(searchTermLower)) ||
          (item.cantidad != null && String(item.cantidad).toLowerCase().includes(searchTermLower));
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Filtros específicos - primero recopilar todos los filtros únicos (tanto simples como múltiples)
      // Filtros de rango (avance/presupuesto) - procesar ANTES del loop general
      const avanceMin = typeof filters.avance_min === 'number' ? filters.avance_min : undefined;
      const avanceMax = typeof filters.avance_max === 'number' ? filters.avance_max : undefined;
      if (avanceMin !== undefined || avanceMax !== undefined) {
        const val = Number(item.avance_obra || 0);
        if (avanceMin !== undefined && val < avanceMin) return false;
        if (avanceMax !== undefined && val > avanceMax) return false;
      }

      const presupuestoMin = typeof filters.presupuesto_min === 'number' ? filters.presupuesto_min : undefined;
      const presupuestoMax = typeof filters.presupuesto_max === 'number' ? filters.presupuesto_max : undefined;
      if (presupuestoMin !== undefined || presupuestoMax !== undefined) {
        const val = Number(item.presupuesto_base || 0);
        if (presupuestoMin !== undefined && val < presupuestoMin) return false;
        if (presupuestoMax !== undefined && val > presupuestoMax) return false;
      }

      const rangeKeys = new Set(['avance_min', 'avance_max', 'presupuesto_min', 'presupuesto_max']);
      const allFilterKeys = new Set<string>();
      Object.keys(filters).forEach(key => {
        if (key === 'searchTerm') return;
        if (rangeKeys.has(key)) return; // Ya procesados arriba
        if (key.endsWith('_multiple')) {
          allFilterKeys.add(key.replace('_multiple', ''));
        } else {
          allFilterKeys.add(key);
        }
      });

      const matchesFilters = Array.from(allFilterKeys).every(baseKey => {
        try {
          const multipleKey = `${baseKey}_multiple`;
          const multipleValues = (filters as any)[multipleKey];
          const singleValue = (filters as any)[baseKey];
          
          // Si hay filtros múltiples, usarlos (tienen prioridad sobre el filtro singular)
          if (multipleValues && Array.isArray(multipleValues) && multipleValues.length > 0) {
            switch (baseKey) {
              case 'estado':
                return valueInArray(item.estado, multipleValues);
              case 'tipo_intervencion':
                return valueInArray(item.tipo_intervencion, multipleValues);
              case 'tipo_equipamiento':
                return valueInArray(item.tipo_equipamiento, multipleValues);
              case 'frente_activo':
                return valueInArray(item.frente_activo, multipleValues);
              case 'centro_gestor':
              case 'centro_gestor_multiple':
                return valueInArray(item.nombre_centro_gestor, multipleValues);
              case 'comuna_corregimiento':
                return valueInArray(item.comuna_corregimiento, multipleValues);
              case 'barrio_vereda':
                return valueInArray(item.barrio_vereda, multipleValues);
              case 'fuente_financiacion':
                return valueInArray(item.fuente_financiacion, multipleValues);
              case 'proyectos_estrategicos':
                return arrayHasAnyMatch(item.proyectos_estrategicos, multipleValues);
              case 'ano':
                return multipleValues.map((v: any) => String(v).replace('.0', '')).includes(String(item.ano).replace('.0', ''));
              case 'presupuesto':
              case 'presupuesto_base': {
                const budgetMin = typeof (filters as any).presupuesto_min === 'number' ? (filters as any).presupuesto_min : undefined;
                const budgetMax = typeof (filters as any).presupuesto_max === 'number' ? (filters as any).presupuesto_max : undefined;
                const value = Number(item.presupuesto_base || 0);
                if (budgetMin !== undefined && value < budgetMin) return false;
                if (budgetMax !== undefined && value > budgetMax) return false;
                return true;
              }
              case 'avance':
              case 'avance_obra': {
                const progressMin = typeof (filters as any).avance_min === 'number' ? (filters as any).avance_min : undefined;
                const progressMax = typeof (filters as any).avance_max === 'number' ? (filters as any).avance_max : undefined;
                const value = Number(item.avance_obra || 0);
                if (progressMin !== undefined && value < progressMin) return false;
                if (progressMax !== undefined && value > progressMax) return false;
                return true;
              }
              default:
                return true;
            }
          }
          
          // Si no hay filtros múltiples pero hay un valor singular, usarlo
          if (singleValue && singleValue !== '') {
            switch (baseKey) {
              case 'estado':
                return stringsMatch(item.estado, singleValue);
              case 'tipo_intervencion':
                return stringsMatch(item.tipo_intervencion, singleValue);
              case 'tipo_equipamiento':
                return stringsMatch(item.tipo_equipamiento, singleValue);
              case 'frente_activo':
                return stringsMatch(item.frente_activo, singleValue);
              case 'centro_gestor':
              case 'centro_gestor_multiple':
                return stringsMatch(item.nombre_centro_gestor, singleValue);
              case 'comuna_corregimiento':
                return stringsMatch(item.comuna_corregimiento, singleValue);
              case 'barrio_vereda':
                return stringsMatch(item.barrio_vereda, singleValue);
              case 'fuente_financiacion':
                return stringsMatch(item.fuente_financiacion, singleValue);
              case 'ano':
                return String(item.ano).replace('.0', '') === String(singleValue).replace('.0', '');
              case 'proyectos_estrategicos':
                return arrayHasAnyMatch(item.proyectos_estrategicos, [singleValue]);
              case 'presupuesto':
              case 'presupuesto_base': {
                const budgetMin = typeof (filters as any).presupuesto_min === 'number' ? (filters as any).presupuesto_min : undefined;
                const budgetMax = typeof (filters as any).presupuesto_max === 'number' ? (filters as any).presupuesto_max : undefined;
                const value = Number(item.presupuesto_base || 0);
                if (budgetMin !== undefined && value < budgetMin) return false;
                if (budgetMax !== undefined && value > budgetMax) return false;
                return true;
              }
              case 'avance':
              case 'avance_obra': {
                const progressMin = typeof (filters as any).avance_min === 'number' ? (filters as any).avance_min : undefined;
                const progressMax = typeof (filters as any).avance_max === 'number' ? (filters as any).avance_max : undefined;
                const value = Number(item.avance_obra || 0);
                if (progressMin !== undefined && value < progressMin) return false;
                if (progressMax !== undefined && value > progressMax) return false;
                return true;
              }
              default:
                return true;
            }
          }
          
          // Si no hay ni filtros múltiples ni valor singular, no filtrar por este campo
          return true;
        } catch (filterError) {
          console.warn(`⚠️ Filter error for ${baseKey}:`, filterError);
          return true; // En caso de error, no filtrar este item
        }
      });
      
      return matchesFilters;
    } catch (itemError) {
      console.warn('⚠️ Error filtering item:', itemError, item);
      return true; // En caso de error, incluir el item
    }
  };

  // Aplicar filtros sobre filas reales (intervenciones) para no perder coincidencias
  // cuando una UP tiene valores heterogéneos y luego consolidar a nivel UPID.
  const matchingUpids = new Set(
    data
      .filter(matchesAllFiltersForRow)
      .map((row) => normalizeString(row.upid))
      .filter(Boolean)
  );

  const filtered = consolidatedData.filter(item => matchingUpids.has(normalizeString(item.upid)));
  
  // Log del resultado final
  if (activeFilters.length > 0) {
    console.log('✅ filterAttributeData:', filtered.length, 'items after filtering');
  }
  
  return filtered;
};

// ────────────────────────────────────────────────────────────────
// CRUD y Solicitudes de Cambio – usan el proxy de Next.js
// ────────────────────────────────────────────────────────────────

const PROXY_BASE = '/api/proxy';

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
  'nombre_up',
  'nombre_up_detalle',
  'estado',
  'tipo_intervencion',
  'tipo_equipamiento',
  'clase_up',
  'nombre_centro_gestor',
  'comuna_corregimiento',
  'barrio_vereda',
  'frente_activo',
  'fuente_financiacion',
  'direccion',
  'ano',
  'avance_obra',
  'presupuesto_base',
  'geometry',
];

function sanitizeCrearUnidadProyectoPayload(
  data: CrearUnidadProyectoPayload,
): CrearUnidadProyectoPayload {
  const payload: CrearUnidadProyectoPayload = {};

  for (const key of CREAR_UP_ALLOWED_KEYS) {
    const rawValue = data[key];

    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) continue;
      (payload as any)[key] = trimmed;
      continue;
    }

    if (typeof rawValue === 'number') {
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
  avance_obra?: number;
  bpin?: number;
  cantidad?: number;
  clase_up?: string;
  estado?: string;
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
  'upid',
  'avance_obra',
  'bpin',
  'cantidad',
  'clase_up',
  'estado',
  'fecha_fin',
  'fecha_inicio',
  'fuente_financiacion',
  'identificador',
  'nombre_centro_gestor',
  'presupuesto_base',
  'referencia_contrato',
  'referencia_proceso',
  'tipo_intervencion',
  'unidad',
  'url_proceso',
  'descripcion_intervencion',
];

function sanitizeCrearIntervencionPayload(
  data: CrearIntervencionPayload,
): CrearIntervencionPayload {
  const payload: CrearIntervencionPayload = { upid: '' };

  for (const key of CREAR_INTERVENCION_ALLOWED_KEYS) {
    const rawValue = data[key];

    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) continue;
      (payload as any)[key] = trimmed;
      continue;
    }

    if (typeof rawValue === 'number') {
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
  avance_obra?: number;
  bpin?: string | number;
  cantidad?: number;
  clase_up?: string;
  estado?: string;
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
  tipo?: 'unidad_proyecto' | 'intervencion';
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
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

async function proxyPut<T = MutationResponse>(
  path: string,
  body: Record<string, any>,
): Promise<T> {
  const res = await fetch(`${PROXY_BASE}/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

/** PUT con query params (para /modificar/unidad_proyecto que usa query) */
async function proxyPutParams<T = MutationResponse>(
  path: string,
  params: Record<string, string>,
  body?: Record<string, any>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${PROXY_BASE}/${path}?${qs}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

async function proxyDelete<T = MutationResponse>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${PROXY_BASE}/${path}?${qs}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

async function proxyGet<T = any>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  const res = await fetch(`${PROXY_BASE}/${path}${qs}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
  return json as T;
}

// ── CRUD: Unidades de Proyecto ───────────────────────────────────

/** POST /crear_unidad_proyecto */
export const crearUnidadProyecto = (data: CrearUnidadProyectoPayload) =>
  proxyPost('crear_unidad_proyecto', sanitizeCrearUnidadProyectoPayload(data));

/** DELETE /eliminar_unidad_proyecto?upid=... */
export const eliminarUnidadProyecto = (upid: string) =>
  proxyDelete('eliminar_unidad_proyecto', { upid });

// ── CRUD: Intervenciones ─────────────────────────────────────────

/** POST /crear_intervencion */
export const crearIntervencion = (data: CrearIntervencionPayload) =>
  proxyPost('crear_intervencion', sanitizeCrearIntervencionPayload(data));

/** DELETE /eliminar_intervencion?intervencion_id=... */
export const eliminarIntervencion = (intervencionId: string) =>
  proxyDelete('eliminar_intervencion', { intervencion_id: intervencionId });

/** GET /intervenciones (con filtros opcionales) */
export const fetchIntervenciones = (params?: Record<string, string>) =>
  proxyGet<any[]>('intervenciones', params);

// ── Solicitudes de Cambio ────────────────────────────────────────

/** POST /solicitudes_cambios_unidad_proyecto */
export const crearSolicitudCambioUP = (data: SolicitudCambioUPPayload) => {
  const allowedKeys: Array<keyof SolicitudCambioUPPayload> = [
    'upid',
    'aprobado',
    'nombre_up',
    'nombre_up_detalle',
    'tipo_equipamiento',
    'clase_up',
    'direccion',
    'geometry',
  ];

  const payload: Record<string, any> = {
    aprobado: data.aprobado ?? true,
  };

  for (const key of allowedKeys) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      payload[key] = trimmed;
      continue;
    }
    payload[key] = value;
  }

  return proxyPost('solicitudes_cambios_unidad_proyecto', payload);
};

/** POST /solicitudes_cambios_intervencion */
export const crearSolicitudCambioIntervencion = (data: SolicitudCambioIntervencionPayload) =>
  proxyPost('solicitudes_cambios_intervencion', data);

/** GET /solicitudes_cambios_unidades_proyecto (listado para validadores) */
export const fetchSolicitudesCambiosUP = async (params?: Record<string, string>): Promise<SolicitudCambio[]> => {
  const res = await proxyGet<any>('solicitudes_cambios_unidades_proyecto', { limit: '10000', ...params });
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
}

/** GET /solicitudes_cambios_intervenciones (listado para validadores) */
export const fetchSolicitudesCambiosIntervencion = async (params?: Record<string, string>): Promise<SolicitudCambio[]> => {
  const res = await proxyGet<any>('solicitudes_cambios_intervenciones', { limit: '10000', ...params });
  return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
}

// ── Aprobación / Rechazo (Validador) ─────────────────────────────

/** PUT /modificar/unidad_proyecto con aprobado=false — rechazar solicitud UP */
export const rechazarUnidadProyecto = (upid: string) =>
  proxyPutParams('modificar/unidad_proyecto', { upid, aprobado: 'false', extra_data_: '{}' });

/** PUT /modificar/intervencion — aprobar: aplica cambios + aprobado=true (body) */
export const modificarIntervencion = (data: ModificarIntervencionPayload) =>
  proxyPut('modificar/intervencion', { ...data, aprobado: true });

/** PUT /modificar/intervencion con aprobado=false — rechazar solicitud intervención */
export const rechazarIntervencion = (intervencion_id: string) =>
  proxyPut('modificar/intervencion', { intervencion_id, aprobado: false });

// ── Export XLSX ──────────────────────────────────────────────────

/** GET /unidades-proyecto/intervenciones/export-xlsx — descarga un blob XLSX */
export const exportarIntervencionesXLSX = async (
  filters?: Record<string, string>,
): Promise<Blob> => {
  const qs = filters ? `?${new URLSearchParams(filters).toString()}` : '';
  const res = await fetch(
    `${API_CONFIG.BASE_URL}/unidades-proyecto/intervenciones/export-xlsx${qs}`,
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Error desconocido');
    throw new Error(`Error al exportar XLSX: ${errText}`);
  }
  return res.blob();
};

// Exportar configuración para uso en otros lugares
export { API_CONFIG };