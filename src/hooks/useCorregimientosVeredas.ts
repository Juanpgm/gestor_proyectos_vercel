import { useState, useEffect } from 'react'

// Interfaces para tipar los datos
interface CorregimientoFeature {
  type: string
  properties: {
    corregimie: string
    [key: string]: any
  }
  geometry: any
}

interface VeredaFeature {
  type: string
  properties: {
    vereda: string
    corregimie?: string
    [key: string]: any
  }
  geometry: any
}

interface CorregimientosGeoJSON {
  type: string
  features: CorregimientoFeature[]
}

interface VeredasGeoJSON {
  type: string
  features: VeredaFeature[]
}

interface CorregimientoVereda {
  corregimiento: string
  veredas: string[]
}

export function useCorregimientosVeredas() {
  const [corregimientosVeredas, setCorregimientosVeredas] = useState<CorregimientoVereda[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCorregimientosVeredas = async () => {
      try {
        console.log('🔄 Iniciando carga de corregimientos y veredas...')
        setLoading(true)
        setError(null)
        
        // Cargar corregimientos
        const corregimientosResponse = await fetch('/data/geodata/cartografia_base/corregimientos.geojson')
        console.log('📡 Respuesta corregimientos:', corregimientosResponse.status, corregimientosResponse.ok)
        
        if (!corregimientosResponse.ok) {
          throw new Error('Error al cargar los datos de corregimientos')
        }
        
        const corregimientosData: CorregimientosGeoJSON = await corregimientosResponse.json()
        console.log('📊 Corregimientos cargados:', corregimientosData.features.length, 'features')
        
        // Cargar veredas
        const veredasResponse = await fetch('/data/geodata/cartografia_base/veredas.geojson')
        console.log('📡 Respuesta veredas:', veredasResponse.status, veredasResponse.ok)
        
        if (!veredasResponse.ok) {
          throw new Error('Error al cargar los datos de veredas')
        }
        
        const veredasData: VeredasGeoJSON = await veredasResponse.json()
        console.log('📊 Veredas cargadas:', veredasData.features.length, 'features')
        
        // Obtener lista única de corregimientos
        const corregimientosSet = new Set<string>()
        corregimientosData.features.forEach(feature => {
          if (feature.properties.corregimie) {
            corregimientosSet.add(feature.properties.corregimie)
          }
        })
        
        // Crear un mapa para agrupar veredas por corregimiento
        const corregimientoMap = new Map<string, Set<string>>()
        
        // Inicializar mapa con todos los corregimientos
        corregimientosSet.forEach(corregimiento => {
          corregimientoMap.set(corregimiento, new Set<string>())
        })
        
        // Agregar veredas a sus corregimientos correspondientes
        veredasData.features.forEach(feature => {
          const vereda = feature.properties.vereda
          const corregimiento = feature.properties.corregimie
          
          if (vereda && corregimiento && corregimientosSet.has(corregimiento)) {
            corregimientoMap.get(corregimiento)!.add(vereda)
          }
        })
        
        // Convertir el mapa a array y ordenar
        const corregimientosVeredasArray: CorregimientoVereda[] = Array.from(corregimientoMap.entries())
          .map(([corregimiento, veredasSet]) => ({
            corregimiento,
            veredas: Array.from(veredasSet).sort()
          }))
          .sort((a, b) => a.corregimiento.localeCompare(b.corregimiento))
        
        console.log('🏞️ Corregimientos procesados:', corregimientosVeredasArray.length)
        console.log('📍 Primeros 3 corregimientos:', corregimientosVeredasArray.slice(0, 3).map(c => `${c.corregimiento} (${c.veredas.length} veredas)`))
        
        setCorregimientosVeredas(corregimientosVeredasArray)
        
      } catch (err) {
        console.error('❌ Error loading corregimientos y veredas:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
        console.log('✅ Carga de corregimientos y veredas completada')
      }
    }

    loadCorregimientosVeredas()
  }, [])

  // Función helper para obtener solo los corregimientos
  const getCorregimientos = (): string[] => {
    const corregimientos = corregimientosVeredas.map(item => item.corregimiento)
    console.log('🏞️ getCorregimientos llamada, retornando:', corregimientos.length, 'corregimientos')
    return corregimientos
  }

  // Función helper para obtener veredas de corregimientos específicos
  const getVeredasPorCorregimientos = (corregimientosSeleccionados: string[]): string[] => {
    console.log('📍 getVeredasPorCorregimientos llamada con:', corregimientosSeleccionados)
    if (corregimientosSeleccionados.length === 0) {
      console.log('📍 No hay corregimientos seleccionados, retornando array vacío')
      return []
    }
    
    const veredasSet = new Set<string>()
    corregimientosSeleccionados.forEach(corregimiento => {
      const corregimientoData = corregimientosVeredas.find(item => item.corregimiento === corregimiento)
      if (corregimientoData) {
        console.log(`📍 Corregimiento ${corregimiento}: ${corregimientoData.veredas.length} veredas encontradas`)
        corregimientoData.veredas.forEach(vereda => veredasSet.add(vereda))
      } else {
        console.log(`⚠️ Corregimiento ${corregimiento} no encontrado`)
      }
    })
    
    const resultado = Array.from(veredasSet).sort()
    console.log('📍 Total veredas únicas encontradas:', resultado.length)
    return resultado
  }

  return {
    corregimientosVeredas,
    loading,
    error,
    getCorregimientos,
    getVeredasPorCorregimientos
  }
}
