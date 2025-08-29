import { useState, useEffect } from 'react'

export interface MetricsDataItem {
  bpin?: number
  [key: string]: any
}

export interface MetricsResult {
  contratos: MetricsDataItem[]
  presupuesto: MetricsDataItem[]
  proyectos: MetricsDataItem[]
  actividades: MetricsDataItem[]
  loading: boolean
  error: string | null
}

/**
 * Hook para cargar y gestionar datos de métricas desde múltiples fuentes
 */
export const useMetricsData = (): MetricsResult => {
  const [data, setData] = useState<Omit<MetricsResult, 'loading' | 'error'>>({
    contratos: [],
    presupuesto: [],
    proyectos: [],
    actividades: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetricsData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Cargar datos en paralelo
        const [
          contractsResponse,
          budgetResponse,
          projectsResponse,
          activitiesResponse
        ] = await Promise.allSettled([
          fetch('/data/contratos/contratos.json'),
          fetch('/data/ejecucion_presupuestal/ejecucion_presupuestal.json'),
          fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json'),
          fetch('/data/seguimiento_pa/seguimiento_actividades_pa.json')
        ])

        const newData = {
          contratos: [],
          presupuesto: [],
          proyectos: [],
          actividades: []
        } as Omit<MetricsResult, 'loading' | 'error'>

        // Procesar contratos
        if (contractsResponse.status === 'fulfilled' && contractsResponse.value.ok) {
          newData.contratos = await contractsResponse.value.json()
        }

        // Procesar presupuesto
        if (budgetResponse.status === 'fulfilled' && budgetResponse.value.ok) {
          newData.presupuesto = await budgetResponse.value.json()
        }

        // Procesar proyectos
        if (projectsResponse.status === 'fulfilled' && projectsResponse.value.ok) {
          newData.proyectos = await projectsResponse.value.json()
        }

        // Procesar actividades
        if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.ok) {
          newData.actividades = await activitiesResponse.value.json()
        }

        setData(newData)
        
        console.log('✅ Datos de métricas cargados:', {
          contratos: newData.contratos.length,
          presupuesto: newData.presupuesto.length,
          proyectos: newData.proyectos.length,
          actividades: newData.actividades.length
        })

      } catch (err) {
        console.error('❌ Error cargando datos de métricas:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadMetricsData()
  }, [])

  return { ...data, loading, error }
}

export default useMetricsData
