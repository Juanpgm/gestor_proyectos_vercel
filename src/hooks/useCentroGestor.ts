'use client'

import { useState, useEffect } from 'react'

export interface CentroGestorData {
  centros_gestores: string[]
}

export function useCentroGestor() {
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCentrosGestores = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/ejecucion_presupuestal/centro_gestor.json')
        
        if (!response.ok) {
          throw new Error('Error al cargar los centros gestores')
        }
        
        const data: CentroGestorData = await response.json()
        
        // Extraer el array de centros gestores
        const centros = data.centros_gestores || []
        setCentrosGestores(centros)
        
      } catch (error) {
        console.error('Error cargando centros gestores:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
        // En caso de error, usar valores por defecto basados en el archivo actual
        setCentrosGestores([
          "Secretaría de Gobierno",
          "Secretaría de Infraestructura", 
          "Secretaría de Bienestar Social",
          "EMCALI",
          "Secretaría de Salud"
        ])
      } finally {
        setLoading(false)
      }
    }

    loadCentrosGestores()
  }, [])

  return {
    centrosGestores,
    loading,
    error
  }
}
