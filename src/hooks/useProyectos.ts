import { useState, useEffect } from 'react'

// Interfaces para tipar los datos
export interface ProyectoCaracteristicas {
  bpin: number
  bp?: string | null
  nombre_proyecto?: string
  nombre_actividad?: string
  programa_presupuestal?: string
  nombre_centro_gestor?: string
  nombre_area_funcional?: string
  nombre_fondo?: string
  clasificacion_fondo?: string
  nombre_pospre?: string
  nombre_dimension?: string
  nombre_linea_estrategica?: string
  nombre_programa?: string
  comuna?: string
  origen?: string
  anio?: number
  tipo_gasto?: string
  cod_sector?: number
  cod_producto?: number
  validador_cuipo?: string | null
}

export function useProyectos() {
  const [proyectos, setProyectos] = useState<ProyectoCaracteristicas[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProyectos = async () => {
      try {
        console.log('🔄 Iniciando carga de datos de proyectos...')
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        console.log('📡 Respuesta del fetch proyectos:', response.status, response.ok)
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos de proyectos')
        }
        
        const data: ProyectoCaracteristicas[] = await response.json()
        console.log('📊 Datos de proyectos cargados:', data.length, 'proyectos')
        
        // Filtrar proyectos válidos (que tienen bpin y nombre_proyecto)
        const proyectosValidos = data.filter(proyecto => 
          proyecto.bpin && proyecto.nombre_proyecto
        )
        
        console.log('✅ Proyectos válidos:', proyectosValidos.length)
        setProyectos(proyectosValidos)
        
      } catch (err) {
        console.error('❌ Error loading proyectos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
        console.log('✅ Carga de proyectos completada')
      }
    }

    loadProyectos()
  }, [])

  // Función helper para obtener proyecto por BPIN
  const getProyectoPorBpin = (bpin: number): ProyectoCaracteristicas | undefined => {
    return proyectos.find(proyecto => proyecto.bpin === bpin)
  }

  // Función helper para obtener comunas únicas
  const getComunasProyectos = (): string[] => {
    const comunas = new Set<string>()
    proyectos.forEach(proyecto => {
      if (proyecto.comuna) {
        comunas.add(proyecto.comuna)
      }
    })
    return Array.from(comunas).sort()
  }

  return {
    proyectos,
    loading,
    error,
    getProyectoPorBpin,
    getComunasProyectos
  }
}
