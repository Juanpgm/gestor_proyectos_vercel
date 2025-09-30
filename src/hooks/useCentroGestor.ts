'use client'

import { useState, useEffect, useCallback } from 'react';
import { loadCentrosGestores, CentroGestor } from '@/utils/simpleDataLoader';

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
      const data = await loadCentrosGestores();
      setCentrosGestores(data.centros_gestores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading centros gestores');
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
