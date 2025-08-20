'use client'

import { useState, useEffect } from 'react'

// Hook simple para debug
export function useUnidadesProyectoSimple() {
  const [equipamientos, setEquipamientos] = useState(null)
  const [infraestructura, setInfraestructura] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        console.log('🔄 Iniciando carga simple de datos...')
        setLoading(true)
        setError(null)

        // Cargar equipamientos
        console.log('📡 Fetching equipamientos...')
        const equipamientosRes = await fetch('/data/unidades_proyecto/equipamientos.geojson')
        console.log('📡 Equipamientos response:', equipamientosRes.status)
        
        if (!equipamientosRes.ok) {
          throw new Error(`Error equipamientos: ${equipamientosRes.status}`)
        }

        const equipamientosData = await equipamientosRes.json()
        console.log('✅ Equipamientos cargados:', equipamientosData.features?.length || 0)

        if (cancelled) return

        // Cargar infraestructura
        console.log('📡 Fetching infraestructura...')
        const infraestructuraRes = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
        console.log('📡 Infraestructura response:', infraestructuraRes.status)
        
        if (!infraestructuraRes.ok) {
          throw new Error(`Error infraestructura: ${infraestructuraRes.status}`)
        }

        const infraestructuraData = await infraestructuraRes.json()
        console.log('✅ Infraestructura cargada:', infraestructuraData.features?.length || 0)

        if (cancelled) return

        setEquipamientos(equipamientosData)
        setInfraestructura(infraestructuraData)
        setLoading(false)
        console.log('🎉 Carga completa!')

      } catch (error: any) {
        if (!cancelled) {
          console.error('❌ Error cargando datos:', error)
          setError(error.message || 'Error desconocido')
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    equipamientos,
    infraestructura,
    loading,
    error
  }
}
