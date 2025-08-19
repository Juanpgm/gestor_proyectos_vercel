import { useState, useEffect } from 'react'

// Interfaces para tipar los datos
interface BarrioFeature {
  type: string
  properties: {
    barrio: string
    comuna: string
    [key: string]: any
  }
  geometry: any
}

interface BarriosGeoJSON {
  type: string
  features: BarrioFeature[]
}

interface ComunaBarrio {
  comuna: string
  barrios: string[]
}

export function useComunasBarrios() {
  const [comunasBarrios, setComunasBarrios] = useState<ComunaBarrio[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadComunasBarrios = async () => {
      try {
        console.log('🔄 Iniciando carga de comunas y barrios...')
        setLoading(true)
        setError(null)
        
        const response = await fetch('/geodata/barrios.geojson')
        console.log('📡 Respuesta del fetch:', response.status, response.ok)
        
        if (!response.ok) {
          throw new Error('Error al cargar los datos de barrios')
        }
        
        const data: BarriosGeoJSON = await response.json()
        console.log('📊 Datos cargados:', data.features.length, 'features')
        
        // Crear un mapa para agrupar barrios por comuna
        const comunaMap = new Map<string, Set<string>>()
        
        data.features.forEach(feature => {
          const comuna = feature.properties.comuna
          const barrio = feature.properties.barrio
          
          if (comuna && barrio) {
            if (!comunaMap.has(comuna)) {
              comunaMap.set(comuna, new Set<string>())
            }
            comunaMap.get(comuna)!.add(barrio)
          }
        })
        
        // Convertir el mapa a array y ordenar
        const comunasBarriosArray: ComunaBarrio[] = Array.from(comunaMap.entries())
          .map(([comuna, barriosSet]) => ({
            comuna,
            barrios: Array.from(barriosSet).sort()
          }))
          .sort((a, b) => a.comuna.localeCompare(b.comuna))
        
        console.log('🏘️ Comunas procesadas:', comunasBarriosArray.length)
        console.log('📍 Primeras 3 comunas:', comunasBarriosArray.slice(0, 3).map(c => `${c.comuna} (${c.barrios.length} barrios)`))
        
        setComunasBarrios(comunasBarriosArray)
        
      } catch (err) {
        console.error('❌ Error loading comunas y barrios:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
        console.log('✅ Carga de comunas y barrios completada')
      }
    }

    loadComunasBarrios()
  }, [])

  // Función helper para obtener solo las comunas
  const getComunas = (): string[] => {
    const comunas = comunasBarrios.map(item => item.comuna)
    // Agregar "Santiago de Cali" como primera opción si no está ya incluida
    const comunasConSantiago = ['Santiago de Cali', ...comunas.filter(comuna => comuna !== 'Santiago de Cali')]
    console.log('🏘️ getComunas llamada, retornando:', comunasConSantiago.length, 'comunas')
    return comunasConSantiago
  }

  // Función helper para obtener barrios de comunas específicas
  const getBarriosPorComunas = (comunasSeleccionadas: string[]): string[] => {
    console.log('📍 getBarriosPorComunas llamada con:', comunasSeleccionadas)
    if (comunasSeleccionadas.length === 0) {
      console.log('📍 No hay comunas seleccionadas, retornando array vacío')
      return []
    }
    
    // Si "Santiago de Cali" está seleccionado, retornar todos los barrios
    if (comunasSeleccionadas.includes('Santiago de Cali')) {
      const todosLosBarrios = new Set<string>()
      comunasBarrios.forEach(comunaData => {
        comunaData.barrios.forEach(barrio => todosLosBarrios.add(barrio))
      })
      const resultado = Array.from(todosLosBarrios).sort()
      console.log('📍 "Santiago de Cali" seleccionado, retornando todos los barrios:', resultado.length)
      return resultado
    }
    
    const barriosSet = new Set<string>()
    comunasSeleccionadas.forEach(comuna => {
      const comunaData = comunasBarrios.find(item => item.comuna === comuna)
      if (comunaData) {
        console.log(`📍 Comuna ${comuna}: ${comunaData.barrios.length} barrios encontrados`)
        comunaData.barrios.forEach(barrio => barriosSet.add(barrio))
      } else {
        console.log(`⚠️ Comuna ${comuna} no encontrada`)
      }
    })
    
    const resultado = Array.from(barriosSet).sort()
    console.log('📍 Total barrios únicos encontrados:', resultado.length)
    return resultado
  }

  return {
    comunasBarrios,
    loading,
    error,
    getComunas,
    getBarriosPorComunas
  }
}
