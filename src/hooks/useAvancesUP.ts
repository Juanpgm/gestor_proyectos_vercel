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
export const useAvancesUP = (upid: string) => {
  const [state, setState] = useState<AvancesUPState>({
    avances: [],
    loading: true,
    error: null,
    resumen: null
  });

  // Cargar avances del localStorage
  const loadAvances = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const allData = loadFromStorage();
      const avances = allData[upid] || [];
      const resumen = calcularResumen(avances, upid);
      setState({ avances, loading: false, error: null, resumen });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error al cargar avances' 
      }));
    }
  }, [upid]);

  useEffect(() => {
    if (upid) {
      loadAvances();
    }
  }, [upid, loadAvances]);

  // Agregar nuevo avance
  const addAvance = useCallback((formData: AvanceUPFormData): boolean => {
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

      const nuevoAvance: AvanceUP = {
        id: generateId(),
        upid,
        fecha_reporte: formData.fecha_reporte,
        avance_fisico: formData.avance_fisico,
        avance_financiero: formData.avance_financiero,
        valor_ejecutado: formData.valor_ejecutado,
        observaciones: formData.observaciones,
        estado_reporte: 'enviado',
        reportado_por: 'Usuario actual', // TODO: Integrar con auth
        archivos: formData.archivos.map(f => ({
          id: generateId(),
          nombre: f.name,
          tipo: f.type,
          tamaño: f.size
        })),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const allData = loadFromStorage();
      const avancesUP = allData[upid] || [];
      avancesUP.push(nuevoAvance);
      allData[upid] = avancesUP;
      saveToStorage(allData);

      const resumen = calcularResumen(avancesUP, upid);
      setState({ avances: avancesUP, loading: false, error: null, resumen });
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error al guardar el avance' }));
      return false;
    }
  }, [upid]);

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
