'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getCentroGestorAccessFromSession,
  buildAllowedBpinsSet,
  filterByAllowedBpins
} from '@/utils/centroGestorAccess'

export interface Actividad {
  bpin: number
  cod_actividad: number
  cod_centro_gestor: number
  nombre_actividad: string
  descripcion_actividad: string | null
  periodo_corte: string
  fecha_inicio_actividad: string | null
  fecha_fin_actividad: string | null
  ppto_inicial_actividad: number
  ppto_modificado_actividad: number
  ejecucion_actividad: number
  obligado_actividad: number
  pagos_actividad: number
  avance_actividad: number
  avance_real_actividad: number
  avance_actividad_acumulado: number
  ponderacion_actividad: number
  archivo_origen: string
}

interface UseActividadesReturn {
  actividades: Actividad[]
  loading: boolean
  error: string | null
  totalActividades: number
  totalBudget: number
  completedActivities: number
  inProgressActivities: number
  notStartedActivities: number
  activitiesWithoutDates: number  // Nueva métrica
  averageProgress: number
}

/**
 * Hook para cargar y manejar datos de actividades del plan de acción
 */
export function useActividades(): UseActividadesReturn {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActividades = async () => {
      try {
        setLoading(true)
        setError(null)

        const [actividadesResponse, proyectosResponse] = await Promise.all([
          fetch('/data/seguimiento_pa/seguimiento_actividades_pa.json'),
          fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        ])
        
        if (!actividadesResponse.ok) {
          throw new Error(`Error ${actividadesResponse.status}: ${actividadesResponse.statusText}`)
        }

        if (!proyectosResponse.ok) {
          throw new Error(`Error ${proyectosResponse.status}: ${proyectosResponse.statusText}`)
        }

        const [data, proyectosData]: [Actividad[], Record<string, any>[]] = await Promise.all([
          actividadesResponse.json(),
          proyectosResponse.json()
        ])
        
        if (!Array.isArray(data)) {
          throw new Error('Los datos de actividades no tienen el formato esperado')
        }

        console.log('🎯 Actividades cargadas:', {
          total: data.length,
          sample: data.slice(0, 3)
        })

        const centroGestorAccess = getCentroGestorAccessFromSession()
        const allowedBpins = buildAllowedBpinsSet(
          proyectosData || [],
          centroGestorAccess,
          ['nombre_centro_gestor', 'responsible', 'centro_gestor']
        )

        const actividadesFiltradas = filterByAllowedBpins(data, allowedBpins)

        setActividades(actividadesFiltradas)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido cargando actividades'
        console.error('❌ Error cargando actividades:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadActividades()
  }, [])

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (actividades.length === 0) {
      return {
        totalBudget: 0,
        completedActivities: 0,
        inProgressActivities: 0,
        notStartedActivities: 0,
        activitiesWithoutDates: 0,
        averageProgress: 0
      }
    }

    const totalBudget = actividades.reduce((sum, actividad) => sum + actividad.ppto_modificado_actividad, 0)
    
    // Separar actividades sin fechas
    const activitiesWithoutDates = actividades.filter(a => 
      !a.fecha_inicio_actividad || !a.fecha_fin_actividad
    ).length
    
    // Para el resto de métricas, considerar solo actividades con fechas
    const activitiesWithDates = actividades.filter(a => 
      a.fecha_inicio_actividad && a.fecha_fin_actividad
    )
    
    const completedActivities = activitiesWithDates.filter(a => a.avance_actividad === 1).length
    const inProgressActivities = activitiesWithDates.filter(a => a.avance_actividad > 0 && a.avance_actividad < 1).length
    const notStartedActivities = activitiesWithDates.filter(a => a.avance_actividad === 0).length
    
    const averageProgress = actividades.reduce((sum, a) => sum + a.avance_actividad, 0) / actividades.length

    return {
      totalBudget,
      completedActivities,
      inProgressActivities,
      notStartedActivities,
      activitiesWithoutDates,
      averageProgress
    }
  }, [actividades])

  return {
    actividades,
    loading,
    error,
    totalActividades: actividades.length,
    ...metrics
  }
}

export default useActividades
