/**
 * Hook para gestión de avances de Unidades de Proyecto
 * Fase inicial: datos almacenados en localStorage (sin endpoints)
 * Preparado para migrar a API cuando los endpoints estén disponibles
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  AvanceUP, 
  AvanceUPFormData, 
  EditInfoUPFormData,
  ResumenAvancesUP,
  AvancesUPState 
} from '@/types/avances-up';

const STORAGE_KEY = 'avances-up-data';
const REGISTRAR_AVANCE_ENDPOINT = '/api/registrar-avance-up';
const AVANCES_UNIDADES_PROYECTO_ENDPOINT = '/api/proxy/avances_unidades_proyecto';

// Helpers para localStorage
const loadFromStorage = (): Record<string, AvanceUP[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveToStorage = (data: Record<string, AvanceUP[]>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error guardando avances en localStorage:', error);
  }
};

const generateId = () => `avance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const mapApiAvanceToAvanceUP = (apiAvance: Record<string, any>, upid: string): AvanceUP => {
  const createdAt = typeof apiAvance?.created_at === 'string'
    ? apiAvance.created_at
    : new Date().toISOString();
  const avanceObra = Number(apiAvance?.avance_obra ?? 0);
  const observaciones = typeof apiAvance?.observaciones === 'string'
    ? apiAvance.observaciones
    : '';

  const urls = Array.isArray(apiAvance?.registro_fotografico_urls)
    ? apiAvance.registro_fotografico_urls
    : [];

  const archivos = urls
    .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
    .map((url: string, index: number) => {
      const filename = url.split('/').pop() || `foto-${index + 1}`;
      return {
        id: `${apiAvance?.id || 'avance'}-file-${index + 1}`,
        nombre: decodeURIComponent(filename),
        tipo: 'image/*',
        tamaño: 0,
        url,
      };
    });

  return {
    id: String(apiAvance?.id || generateId()),
    upid,
    fecha_reporte: createdAt,
    avance_fisico: Number.isFinite(avanceObra) ? avanceObra : 0,
    avance_financiero: Number.isFinite(avanceObra) ? avanceObra : 0,
    valor_ejecutado: 0,
    observaciones,
    estado_reporte: 'enviado',
    reportado_por: 'Sistema',
    archivos,
    created_at: createdAt,
    updated_at: typeof apiAvance?.updated_at === 'string' ? apiAvance.updated_at : createdAt,
  };
};

// Calcular resumen de avances
const calcularResumen = (avances: AvanceUP[], upid: string): ResumenAvancesUP | null => {
  if (avances.length === 0) return null;

  const sorted = [...avances].sort(
    (a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime()
  );

  const ultimo = sorted[0];
  const penultimo = sorted[1];

  let tendencia: 'subiendo' | 'estable' | 'bajando' = 'estable';
  if (penultimo) {
    const diff = ultimo.avance_fisico - penultimo.avance_fisico;
    if (diff > 2) tendencia = 'subiendo';
    else if (diff < -2) tendencia = 'bajando';
  }

  return {
    upid,
    total_reportes: avances.length,
    ultimo_avance_fisico: ultimo.avance_fisico,
    ultimo_avance_financiero: ultimo.avance_financiero,
    fecha_ultimo_reporte: ultimo.fecha_reporte,
    tendencia
  };
};

/**
 * Hook principal para gestionar avances de una UP específica
 */
export const useAvancesUP = (upid: string, intervencionId?: string) => {
  const [state, setState] = useState<AvancesUPState>({
    avances: [],
    loading: true,
    error: null,
    resumen: null
  });

  const getIntervencionIdByUpid = useCallback(async (): Promise<string | null> => {
    if (intervencionId && intervencionId.trim().length > 0) {
      return intervencionId;
    }

    try {
      const response = await fetch(`/api/proxy/intervenciones?upid=${encodeURIComponent(upid)}&limit=1`, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const intervenciones = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      const firstIntervencion = intervenciones[0];
      if (firstIntervencion?.intervencion_id) {
        return String(firstIntervencion.intervencion_id);
      }

      return null;
    } catch {
      return null;
    }
  }, [intervencionId, upid]);

  // Cargar avances del endpoint de API filtrado por intervencion_id
  const loadAvances = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const intervencionId = await getIntervencionIdByUpid();

      if (!intervencionId) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'No se pudo determinar la intervención asociada a esta UP'
        }));
        return;
      }

      const response = await fetch(
        `${AVANCES_UNIDADES_PROYECTO_ENDPOINT}?intervencion_id=${encodeURIComponent(intervencionId)}`,
        {
          method: 'GET',
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status} al consultar historial de avances`);
      }

      const data = await response.json();
      const apiAvances = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const avances = apiAvances.map((apiAvance: Record<string, any>) =>
        mapApiAvanceToAvanceUP(apiAvance, upid)
      );

      const allData = loadFromStorage();
      allData[upid] = avances;
      saveToStorage(allData);

      const resumen = calcularResumen(avances, upid);
      setState({ avances, loading: false, error: null, resumen });
    } catch (error) {
      try {
        const allData = loadFromStorage();
        const fallbackAvances = allData[upid] || [];
        const resumen = calcularResumen(fallbackAvances, upid);
        setState({
          avances: fallbackAvances,
          loading: false,
          error: fallbackAvances.length === 0
            ? (error instanceof Error ? error.message : 'Error al cargar avances')
            : null,
          resumen
        });
      } catch {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error al cargar avances'
        }));
      }
    }
  }, [getIntervencionIdByUpid, upid]);

  useEffect(() => {
    if (upid) {
      void loadAvances();
    }
  }, [upid, loadAvances]);

  // Agregar nuevo avance
  const addAvance = useCallback(async (formData: AvanceUPFormData): Promise<boolean> => {
    try {
      // Validaciones
      if (formData.avance_fisico < 0 || formData.avance_fisico > 100) {
        setState(prev => ({ ...prev, error: 'El avance físico debe estar entre 0 y 100' }));
        return false;
      }
      if (formData.avance_financiero < 0 || formData.avance_financiero > 100) {
        setState(prev => ({ ...prev, error: 'El avance financiero debe estar entre 0 y 100' }));
        return false;
      }
      if (!formData.observaciones?.trim()) {
        setState(prev => ({ ...prev, error: 'Las observaciones son obligatorias' }));
        return false;
      }
      if (!formData.archivos || formData.archivos.length === 0) {
        setState(prev => ({ ...prev, error: 'Debes adjuntar al menos una evidencia fotográfica' }));
        return false;
      }

      const intervencionId = await getIntervencionIdByUpid();
      if (!intervencionId) {
        setState(prev => ({ ...prev, error: 'No se pudo determinar la intervención asociada a esta UP' }));
        return false;
      }

      const payload = new FormData();
      payload.append('intervencion_id', intervencionId);
      payload.append('avance_obra', String(formData.avance_fisico));
      payload.append('observaciones', formData.observaciones.trim());
      formData.archivos.forEach((file) => {
        payload.append('registro_fotografico', file);
      });

      const apiResponse = await fetch(REGISTRAR_AVANCE_ENDPOINT, {
        method: 'POST',
        body: payload,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData?.detail || errorData?.error || `Error ${apiResponse.status} al registrar avance`);
      }

      // Recargar avances desde la API para reflejar el estado real
      await loadAvances();
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error al guardar el avance' 
      }));
      return false;
    }
  }, [getIntervencionIdByUpid, upid, loadAvances]);

  // Editar avance existente
  const editAvance = useCallback((avanceId: string, formData: Partial<AvanceUPFormData>): boolean => {
    try {
      const allData = loadFromStorage();
      const avancesUP = allData[upid] || [];
      const index = avancesUP.findIndex(a => a.id === avanceId);
      
      if (index === -1) {
        setState(prev => ({ ...prev, error: 'Avance no encontrado' }));
        return false;
      }

      avancesUP[index] = {
        ...avancesUP[index],
        ...(formData.fecha_reporte && { fecha_reporte: formData.fecha_reporte }),
        ...(formData.avance_fisico !== undefined && { avance_fisico: formData.avance_fisico }),
        ...(formData.avance_financiero !== undefined && { avance_financiero: formData.avance_financiero }),
        ...(formData.valor_ejecutado !== undefined && { valor_ejecutado: formData.valor_ejecutado }),
        ...(formData.observaciones !== undefined && { observaciones: formData.observaciones }),
        updated_at: new Date().toISOString()
      };

      allData[upid] = avancesUP;
      saveToStorage(allData);

      const resumen = calcularResumen(avancesUP, upid);
      setState({ avances: avancesUP, loading: false, error: null, resumen });
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al editar el avance' }));
      return false;
    }
  }, [upid]);

  // Eliminar avance
  const deleteAvance = useCallback((avanceId: string): boolean => {
    try {
      const allData = loadFromStorage();
      const avancesUP = allData[upid] || [];
      const filtered = avancesUP.filter(a => a.id !== avanceId);
      allData[upid] = filtered;
      saveToStorage(allData);

      const resumen = calcularResumen(filtered, upid);
      setState({ avances: filtered, loading: false, error: null, resumen });
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al eliminar el avance' }));
      return false;
    }
  }, [upid]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Avances ordenados por fecha (más reciente primero)
  const avancesOrdenados = useMemo(() => {
    return [...state.avances].sort(
      (a, b) => new Date(b.fecha_reporte).getTime() - new Date(a.fecha_reporte).getTime()
    );
  }, [state.avances]);

  return {
    ...state,
    avances: avancesOrdenados,
    addAvance,
    editAvance,
    deleteAvance,
    clearError,
    refresh: loadAvances
  };
};

/**
 * Hook para obtener resúmenes de avances de múltiples UPs
 */
export const useAvancesUPResumen = (upids: string[]) => {
  const [resumenes, setResumenes] = useState<Record<string, ResumenAvancesUP>>({});

  useEffect(() => {
    const allData = loadFromStorage();
    const newResumenes: Record<string, ResumenAvancesUP> = {};

    upids.forEach(upid => {
      const avances = allData[upid] || [];
      const resumen = calcularResumen(avances, upid);
      if (resumen) {
        newResumenes[upid] = resumen;
      }
    });

    setResumenes(newResumenes);
  }, [upids]);

  return resumenes;
};
