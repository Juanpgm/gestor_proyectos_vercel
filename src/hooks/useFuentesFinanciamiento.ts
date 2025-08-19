import { useState, useEffect } from 'react'

export function useFuentesFinanciamiento() {
  const [fuentesFinanciamiento, setFuentesFinanciamiento] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFuentesFinanciamiento = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/atributos/nombre_fondo.json')
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos de fuentes de financiamiento')
        }
        
        const data: string[] = await response.json()
        
        // Filtrar valores únicos y ordenar alfabéticamente
        const uniqueSorted = Array.from(new Set(data))
          .filter(item => item && item.trim() !== '') // Eliminar valores vacíos
          .sort()
        
        setFuentesFinanciamiento(uniqueSorted)
      } catch (err) {
        console.error('Error loading fuentes de financiamiento:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setFuentesFinanciamiento([])
      } finally {
        setLoading(false)
      }
    }

    loadFuentesFinanciamiento()
  }, [])

  return {
    fuentesFinanciamiento,
    loading,
    error
  }
}

export default useFuentesFinanciamiento