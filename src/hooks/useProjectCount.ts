'use client'

import { useState, useEffect } from 'react'

export function useProjectCount() {
  const [count, setCount] = useState<number>(1253) // Valor por defecto mientras carga
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProjectCount = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos de proyectos')
        }
        
        const data = await response.json()
        
        // Contar los elementos del array
        const projectCount = Array.isArray(data) ? data.length : 0
        setCount(projectCount)
        
      } catch (error) {
        console.error('Error cargando el conteo de proyectos:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
        // Mantener el valor por defecto en caso de error
      } finally {
        setLoading(false)
      }
    }

    loadProjectCount()
  }, [])

  return {
    count,
    loading,
    error
  }
}
