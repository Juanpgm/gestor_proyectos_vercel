'use client'

import { useState, useEffect, useCallback } from 'react';

export interface CentroGestorData {
  centros_gestores: string[]
}

export function useCentroGestor() {
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/ejecucion_presupuestal/centro_gestor.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: CentroGestorData = await response.json();
      setCentrosGestores(data.centros_gestores || []);
    } catch (err) {
      console.error('Error loading centros gestores:', err);
      setError(err instanceof Error ? err.message : 'Error loading centros gestores');
      setCentrosGestores([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData])

  return {
    centrosGestores,
    loading,
    error
  }
}
