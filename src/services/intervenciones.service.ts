/**
 * Servicio para la gestión de Intervenciones
 * Integrado con el endpoint GET /intervenciones
 */

import { z } from 'zod';

// Schema de validación para una intervención individual
const IntervencionSchema = z.object({
  intervencion_id: z.string(),
  upid: z.string(),
  ano: z.union([z.string(), z.number()]).optional(),
  estado: z.string().optional(),
  tipo_intervencion: z.string().optional(),
  presupuesto_base: z.number().optional(),
  avance_obra: z.number().optional(),
  frente_activo: z.string().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  nombre_centro_gestor: z.string().optional(),
  comuna_corregimiento: z.string().optional(),
  barrio_vereda: z.string().optional()
});

// Schema para una unidad con sus intervenciones
const UnidadConIntervencionesSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.string(),
    coordinates: z.any()
  }).optional(),
  properties: z.object({
    upid: z.string(),
    nombre_up: z.string().optional(),
    direccion: z.string().optional(),
    tipo_equipamiento: z.string().optional(),
    clase_up: z.string().optional(),
    nombre_centro_gestor: z.string().optional(),
    comuna_corregimiento: z.string().optional(),
    barrio_vereda: z.string().optional(),
    intervenciones: z.array(IntervencionSchema),
    n_intervenciones: z.number()
  })
});

// Schema de respuesta del endpoint
const IntervencionesResponseSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(UnidadConIntervencionesSchema),
  properties: z.object({
    total_unidades: z.number(),
    total_intervenciones: z.number(),
    filtros_aplicados: z.record(z.any()).optional()
  }).optional()
});

// Tipos exportados
export type Intervencion = z.infer<typeof IntervencionSchema>;
export type UnidadConIntervenciones = z.infer<typeof UnidadConIntervencionesSchema>;
export type IntervencionesResponse = z.infer<typeof IntervencionesResponseSchema>;

// Parámetros de filtrado
export interface IntervencionesFilterParams {
  estado?: string;
  ano?: string | number;
  frente_activo?: string;
  tipo_intervencion?: string;
  nombre_centro_gestor?: string;
  comuna_corregimiento?: string;
  barrio_vereda?: string;
  presupuesto_min?: number;
  presupuesto_max?: number;
  avance_min?: number;
  avance_max?: number;
}

/**
 * Construye query string desde los parámetros de filtro
 */
const buildQueryString = (filters: IntervencionesFilterParams): string => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  return params.toString();
};

/**
 * Obtiene intervenciones desde el endpoint con filtros opcionales
 */
export async function fetchIntervenciones(
  filters: IntervencionesFilterParams = {}
): Promise<IntervencionesResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const queryString = buildQueryString(filters);
    
    // ✨ AJUSTE: Agregar limit=10000 para obtener todos los datos
    const limitParam = 'limit=10000';
    const fullQueryString = queryString 
      ? `${queryString}&${limitParam}` 
      : limitParam;
    
    const url = `${baseUrl}/intervenciones?${fullQueryString}`;

    console.log('📡 Fetching intervenciones desde:', url);
    console.log('🔍 Filtros aplicados:', filters);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Validar la respuesta con Zod
    const validated = IntervencionesResponseSchema.parse(data);

    console.log('✅ Intervenciones obtenidas:', {
      total_unidades: validated.features.length,
      total_intervenciones: validated.features.reduce(
        (sum, f) => sum + f.properties.n_intervenciones, 
        0
      )
    });

    return validated;

  } catch (error) {
    console.error('❌ Error al obtener intervenciones:', error);
    throw error;
  }
}

/**
 * Obtiene valores únicos de un campo específico de las intervenciones
 * Útil para poblar filtros dinámicos
 */
export function getUniqueValues<K extends keyof Intervencion>(
  data: IntervencionesResponse,
  field: K
): Array<Intervencion[K]> {
  const values = new Set<Intervencion[K]>();

  data.features.forEach(feature => {
    feature.properties.intervenciones.forEach(intervencion => {
      const value = intervencion[field];
      if (value !== undefined && value !== null && value !== '') {
        values.add(value);
      }
    });
  });

  return Array.from(values).sort();
}

/**
 * Calcula métricas agregadas de las intervenciones
 */
export interface IntervencionesMetrics {
  total_intervenciones: number;
  total_unidades: number;
  por_estado: Record<string, number>;
  por_ano: Record<string, number>;
  por_tipo: Record<string, number>;
  por_frente_activo: Record<string, number>;
  presupuesto_total: number;
  avance_promedio: number;
}

export function calculateMetrics(data: IntervencionesResponse): IntervencionesMetrics {
  const metrics: IntervencionesMetrics = {
    total_intervenciones: 0,
    total_unidades: data.features.length,
    por_estado: {},
    por_ano: {},
    por_tipo: {},
    por_frente_activo: {},
    presupuesto_total: 0,
    avance_promedio: 0
  };

  let totalAvance = 0;
  let countAvance = 0;

  data.features.forEach(feature => {
    feature.properties.intervenciones.forEach(intervencion => {
      metrics.total_intervenciones++;

      // Contar por estado
      if (intervencion.estado) {
        metrics.por_estado[intervencion.estado] = 
          (metrics.por_estado[intervencion.estado] || 0) + 1;
      }

      // Contar por año
      if (intervencion.ano) {
        const ano = String(intervencion.ano);
        metrics.por_ano[ano] = (metrics.por_ano[ano] || 0) + 1;
      }

      // Contar por tipo
      if (intervencion.tipo_intervencion) {
        metrics.por_tipo[intervencion.tipo_intervencion] = 
          (metrics.por_tipo[intervencion.tipo_intervencion] || 0) + 1;
      }

      // Contar por frente activo
      if (intervencion.frente_activo) {
        metrics.por_frente_activo[intervencion.frente_activo] = 
          (metrics.por_frente_activo[intervencion.frente_activo] || 0) + 1;
      }

      // Sumar presupuesto
      if (intervencion.presupuesto_base) {
        metrics.presupuesto_total += intervencion.presupuesto_base;
      }

      // Calcular promedio de avance
      if (typeof intervencion.avance_obra === 'number') {
        totalAvance += intervencion.avance_obra;
        countAvance++;
      }
    });
  });

  // Calcular avance promedio
  metrics.avance_promedio = countAvance > 0 ? totalAvance / countAvance : 0;

  return metrics;
}

/**
 * Filtra intervenciones localmente (client-side)
 * Útil cuando ya se tienen todos los datos cargados
 */
export function filterIntervencionesLocally(
  data: IntervencionesResponse,
  filters: IntervencionesFilterParams
): IntervencionesResponse {
  const filteredFeatures = data.features
    .map(feature => {
      // Filtrar intervenciones de esta unidad
      const filteredIntervenciones = feature.properties.intervenciones.filter(
        intervencion => {
          // Filtro por estado
          if (filters.estado && intervencion.estado !== filters.estado) {
            return false;
          }

          // Filtro por año
          if (filters.ano && String(intervencion.ano) !== String(filters.ano)) {
            return false;
          }

          // Filtro por frente activo
          if (filters.frente_activo && intervencion.frente_activo !== filters.frente_activo) {
            return false;
          }

          // Filtro por tipo de intervención
          if (filters.tipo_intervencion && intervencion.tipo_intervencion !== filters.tipo_intervencion) {
            return false;
          }

          // Filtro por centro gestor
          if (filters.nombre_centro_gestor && intervencion.nombre_centro_gestor !== filters.nombre_centro_gestor) {
            return false;
          }

          // Filtro por presupuesto
          if (filters.presupuesto_min && intervencion.presupuesto_base && 
              intervencion.presupuesto_base < filters.presupuesto_min) {
            return false;
          }
          if (filters.presupuesto_max && intervencion.presupuesto_base && 
              intervencion.presupuesto_base > filters.presupuesto_max) {
            return false;
          }

          // Filtro por avance
          if (filters.avance_min !== undefined && intervencion.avance_obra !== undefined && 
              intervencion.avance_obra < filters.avance_min) {
            return false;
          }
          if (filters.avance_max !== undefined && intervencion.avance_obra !== undefined && 
              intervencion.avance_obra > filters.avance_max) {
            return false;
          }

          return true;
        }
      );

      // Solo incluir unidades que tengan al menos una intervención después del filtro
      if (filteredIntervenciones.length > 0) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            intervenciones: filteredIntervenciones,
            n_intervenciones: filteredIntervenciones.length
          }
        };
      }

      return null;
    })
    .filter((f): f is UnidadConIntervenciones => f !== null);

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
    properties: {
      total_unidades: filteredFeatures.length,
      total_intervenciones: filteredFeatures.reduce(
        (sum, f) => sum + f.properties.n_intervenciones,
        0
      ),
      filtros_aplicados: filters
    }
  };
}
