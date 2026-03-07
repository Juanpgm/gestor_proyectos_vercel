/**
 * Hook para gestión de avances de Unidades de Proyecto
 * Fase inicial: datos almacenados en localStorage (sin endpoints)
 * Preparado para migrar a API cuando los endpoints estén disponibles
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  AvanceUP,
  ArchivoAvance,
  SoporteUP,
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

  // New schema: soportes[] with tipo: "imagen" | "documento"
  const soportes: SoporteUP[] = Array.isArray(apiAvance?.soportes)
    ? apiAvance.soportes
        .filter((s: unknown): s is Record<string, any> => typeof s === 'object' && s !== null)
        .map((s: Record<string, any>) => {
          // Prefer presigned URL (direct S3 access) over raw URL
          const effectiveUrl: string =
            (typeof s.url_presigned === 'string' && s.url_presigned.trim() ? s.url_presigned.trim() : '') ||
            (typeof s.presigned_url === 'string' && s.presigned_url.trim() ? s.presigned_url.trim() : '') ||
            String(s.url ?? '');
          // Extract s3_key from s3_key field or derive from url_directa
          const urlDirecta: string | undefined = typeof s.url_directa === 'string' && s.url_directa.trim() ? s.url_directa.trim() : undefined;
          const derivedKey = typeof s.s3_key === 'string' && s.s3_key.trim()
            ? s.s3_key.trim()
            : urlDirecta
              ? urlDirecta.replace(/^https?:\/\/[^/]+\//, '')
              : undefined;
          return {
            indice: Number(s.indice ?? 0),
            tipo: s.tipo === 'imagen' ? 'imagen' : 'documento',
            nombre_original: String(s.nombre_original ?? ''),
            extension: String(s.extension ?? ''),
            content_type: String(s.content_type ?? ''),
            s3_key: derivedKey,
            url: effectiveUrl,
            url_directa: urlDirecta,
            url_presigned: typeof s.url_presigned === 'string' ? s.url_presigned : undefined,
            presigned_url: typeof s.presigned_url === 'string' ? s.presigned_url : undefined,
            uploaded_at: String(s.uploaded_at ?? createdAt),
          };
        })
    : [];

  // imagenes_urls: prefer new field, fall back to legacy
  // If soportes have presigned URLs, derive imagenes_urls from them
  const imagenes_urls: string[] = (() => {
    if (soportes.length > 0) {
      const fromSoportes = soportes
        .filter(s => s.tipo === 'imagen' && s.url)
        .map(s => s.url);
      if (fromSoportes.length > 0) return fromSoportes;
    }
    if (Array.isArray(apiAvance?.imagenes_urls))
      return apiAvance.imagenes_urls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
    if (Array.isArray(apiAvance?.registro_fotografico_urls))
      return apiAvance.registro_fotografico_urls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
    return [];
  })();

  // documentos_urls: prefer new field, fall back to legacy
  // If soportes have presigned URLs, derive documentos_urls from them
  const documentos_urls: string[] = (() => {
    if (soportes.length > 0) {
      const fromSoportes = soportes
        .filter(s => s.tipo === 'documento' && s.url)
        .map(s => s.url);
      if (fromSoportes.length > 0) return fromSoportes;
    }
    if (Array.isArray(apiAvance?.documentos_urls))
      return apiAvance.documentos_urls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
    if (Array.isArray(apiAvance?.documentos_soporte_urls))
      return apiAvance.documentos_soporte_urls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
    return [];
  })();

  // Build archivos from soportes (preferred) or flat URL lists (fallback)
  const archivos: ArchivoAvance[] = soportes.length > 0
    ? soportes.map(s => ({
        id: `${apiAvance?.id || 'avance'}-soporte-${s.indice}`,
        nombre: s.nombre_original,
        tipo: s.content_type || s.tipo,
        tamaño: 0,
        url: s.url,
      }))
    : [...imagenes_urls, ...documentos_urls].map((url, index) => {
        const filename = url.split('/').pop() || `archivo-${index + 1}`;
        return {
          id: `${apiAvance?.id || 'avance'}-file-${index + 1}`,
          nombre: decodeURIComponent(filename),
          tipo: imagenes_urls.includes(url) ? 'image/*' : 'application/octet-stream',
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
    reportado_por: typeof apiAvance?.registrado_por === 'string' ? apiAvance.registrado_por : 'Sistema',
    archivos,
    soportes,
    imagenes_urls,
    documentos_urls,
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
      const intervencionId = await getIntervencionIdByUpid();
      if (!intervencionId) {
        setState(prev => ({ ...prev, error: 'No se pudo determinar la intervención asociada a esta UP' }));
        return false;
      }

      const payload = new FormData();
      payload.append('intervencion_id', intervencionId);
      payload.append('avance_obra', String(formData.avance_fisico));
      payload.append('observaciones', formData.observaciones.trim());
      if (formData.archivos && formData.archivos.length > 0) {
        formData.archivos.forEach((file) => {
          payload.append('soportes', file);
        });
      }

      const apiResponse = await fetch(REGISTRAR_AVANCE_ENDPOINT, {
        method: 'POST',
        body: payload,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData?.detail || errorData?.error || `Error ${apiResponse.status} al registrar avance`);
      }

      // Actualizar avance_obra oficial de la intervención con el nuevo valor reportado
      try {
        await fetch('/api/proxy/modificar/intervencion', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intervencion_id: intervencionId,
            avance_obra: formData.avance_fisico,
          }),
        });
      } catch (updateError) {
        console.warn('⚠️ No se pudo actualizar avance_obra en la intervención:', updateError);
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

  // Eliminar avance (API + fallback local para registros legacy)
  const deleteAvance = useCallback(async (avanceId: string): Promise<boolean> => {
    const normalizedId = String(avanceId || '').trim();
    if (!normalizedId) {
      setState(prev => ({ ...prev, error: 'ID de avance inválido para eliminar' }));
      return false;
    }

    const deleteFromLocalStorage = (): boolean => {
      try {
        const allData = loadFromStorage();
        const avancesUP = allData[upid] || [];
        const filtered = avancesUP.filter(a => a.id !== normalizedId);
        allData[upid] = filtered;
        saveToStorage(allData);

        const resumen = calcularResumen(filtered, upid);
        setState({ avances: filtered, loading: false, error: null, resumen });
        return true;
      } catch {
        setState(prev => ({ ...prev, error: 'Error al eliminar el avance localmente' }));
        return false;
      }
    };

    try {
      setState(prev => ({ ...prev, error: null }));

      const resolvedIntervencionId = await getIntervencionIdByUpid();
      const queryCandidates = new Set<string>([
        `id=${encodeURIComponent(normalizedId)}`,
        `avance_id=${encodeURIComponent(normalizedId)}`,
      ]);

      if (resolvedIntervencionId) {
        queryCandidates.add(`id=${encodeURIComponent(normalizedId)}&intervencion_id=${encodeURIComponent(resolvedIntervencionId)}`);
        queryCandidates.add(`avance_id=${encodeURIComponent(normalizedId)}&intervencion_id=${encodeURIComponent(resolvedIntervencionId)}`);
      }

      let lastError = 'No se pudo eliminar el avance';

      for (const query of queryCandidates) {
        const response = await fetch(`${AVANCES_UNIDADES_PROYECTO_ENDPOINT}?${query}`, {
          method: 'DELETE',
          cache: 'no-store',
        });

        if (response.ok) {
          await loadAvances();
          return true;
        }

        const rawError = await response.text().catch(() => '');
        lastError = rawError?.trim() || `Error ${response.status} al eliminar avance`;

        // 400/404/422 suelen indicar parámetro no reconocido o registro no encontrado;
        // intentamos el siguiente candidato antes de fallar.
        if (![400, 404, 422].includes(response.status)) {
          break;
        }
      }

      // Compatibilidad con implementaciones que esperan JSON en el body de DELETE.
      const bodyResponse = await fetch(AVANCES_UNIDADES_PROYECTO_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: normalizedId,
          avance_id: normalizedId,
          intervencion_id: resolvedIntervencionId || undefined,
        }),
        cache: 'no-store',
      });

      if (bodyResponse.ok) {
        await loadAvances();
        return true;
      }

      const rawBodyError = await bodyResponse.text().catch(() => '');
      lastError = rawBodyError?.trim() || `Error ${bodyResponse.status} al eliminar avance`;

      // Fallback local: solo para IDs legacy generados en cliente.
      if (normalizedId.startsWith('avance-')) {
        return deleteFromLocalStorage();
      }

      setState(prev => ({
        ...prev,
        error: lastError,
      }));
      return false;
    } catch (error) {
      if (normalizedId.startsWith('avance-')) {
        return deleteFromLocalStorage();
      }

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al eliminar el avance',
      }));
      return false;
    }
  }, [getIntervencionIdByUpid, loadAvances, upid]);

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
