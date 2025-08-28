'use client'

import { useState, useEffect, useMemo } from 'react'

// Tipos específicos para Centros de Gravedad
export interface CentroGravedad {
  type: 'Feature'
  properties: {
    marca_temporal: string
    cod: string
    descripción: string
    novedad: string
    imagen: string
    sitio: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface CentrosGravedadData {
  type: 'FeatureCollection'
  features: CentroGravedad[]
}

export interface CentrosGravedadMetrics {
  total: number
  novedadesPorTipo: Record<string, number>
  sitiosPorZona: Record<string, number>
  registrosPorMes: Record<string, number>
  topNovedades: Array<{ tipo: string; cantidad: number; porcentaje: number }>
  promedioRegistrosPorDia: number
  tiempoPromedioPorRegistro: number
}

interface CentrosGravedadState {
  data: CentrosGravedadData | null
  loading: boolean
  error: string | null
  metrics: CentrosGravedadMetrics | null
}

export function useCentrosGravedad(): CentrosGravedadState {
  const [state, setState] = useState<CentrosGravedadState>({
    data: null,
    loading: true,
    error: null,
    metrics: null
  })

  useEffect(() => {
    let mounted = true

    const loadCentrosGravedad = async () => {
      try {
        console.log('🎯 Cargando Centros de Gravedad...')
        
        const response = await fetch('/data/geodata/centros_gravedad/centros_gravedad_unificado.geojson', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const data: CentrosGravedadData = await response.json()
        
        if (!mounted) return

        console.log('✅ Centros de Gravedad cargados:', data.features.length, 'registros')

        // Calcular métricas
        const metrics = calculateMetrics(data)

        setState({
          data,
          loading: false,
          error: null,
          metrics
        })

      } catch (error: any) {
        console.error('❌ Error cargando Centros de Gravedad:', error)
        if (mounted) {
          setState({
            data: null,
            loading: false,
            error: error.message || 'Error desconocido',
            metrics: null
          })
        }
      }
    }

    loadCentrosGravedad()

    return () => {
      mounted = false
    }
  }, [])

  return state
}

// Función para calcular métricas
function calculateMetrics(data: CentrosGravedadData): CentrosGravedadMetrics {
  const features = data.features
  const total = features.length

  // Contar novedades por tipo
  const novedadesPorTipo: Record<string, number> = {}
  const sitiosPorZona: Record<string, number> = {}
  const registrosPorMes: Record<string, number> = {}

  // Fechas para calcular promedios
  const fechas: Date[] = []

  features.forEach(feature => {
    const { novedad, sitio, marca_temporal } = feature.properties

    // Contar novedades
    novedadesPorTipo[novedad] = (novedadesPorTipo[novedad] || 0) + 1

    // Contar sitios
    sitiosPorZona[sitio] = (sitiosPorZona[sitio] || 0) + 1

    // Contar por mes
    const fecha = new Date(marca_temporal)
    fechas.push(fecha)
    const mes = fecha.toISOString().substring(0, 7) // YYYY-MM
    registrosPorMes[mes] = (registrosPorMes[mes] || 0) + 1
  })

  // Top novedades (ordenadas por cantidad)
  const topNovedades = Object.entries(novedadesPorTipo)
    .map(([tipo, cantidad]) => ({
      tipo,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    }))
    .sort((a, b) => b.cantidad - a.cantidad)

  // Calcular promedio de registros por día
  const fechasSet = new Set(fechas.map(f => f.toDateString()))
  const fechasUnicas = Array.from(fechasSet).length
  const promedioRegistrosPorDia = fechasUnicas > 0 ? total / fechasUnicas : 0

  // Calcular tiempo promedio entre registros (en horas)
  let tiempoPromedioPorRegistro = 0
  if (fechas.length > 1) {
    fechas.sort((a, b) => a.getTime() - b.getTime())
    const tiempoTotal = fechas[fechas.length - 1].getTime() - fechas[0].getTime()
    tiempoPromedioPorRegistro = tiempoTotal / (fechas.length - 1) / (1000 * 60 * 60) // en horas
  }

  return {
    total,
    novedadesPorTipo,
    sitiosPorZona,
    registrosPorMes,
    topNovedades,
    promedioRegistrosPorDia,
    tiempoPromedioPorRegistro
  }
}

// Función helper para obtener color por tipo de novedad
export function getColorByNovedad(novedad: string): string {
  const colorMap: Record<string, string> = {
    'bache': '#EF4444', // Rojo
    'sumidero': '#3B82F6', // Azul
    'pavimentación inicio': '#10B981', // Verde
    'pavimentación fin': '#059669', // Verde oscuro
    'demarcación vial inicio': '#F59E0B', // Naranja
    'demarcación vial fin': '#D97706', // Naranja oscuro
    'tapa anden': '#8B5CF6', // Púrpura
    'tapa via': '#7C3AED', // Púrpura oscuro
    'luminaria y/o poste en mal estado': '#FCD34D', // Amarillo
    'poda arboles': '#84CC16', // Verde lima
    'punto de recoleccion y aseo': '#6B7280', // Gris
    default: '#6366F1' // Índigo por defecto
  }

  return colorMap[novedad] || colorMap.default
}
