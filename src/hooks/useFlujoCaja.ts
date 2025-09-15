'use client'

import { useState, useEffect } from 'react'

export interface FlujoCajaItem {
  banco: string
  centro_gestor: string
  [key: string]: string // Los meses están como claves dinámicas con fechas en formato string
}

export interface FlujoCajaState {
  data: FlujoCajaItem[]
  loading: boolean
  error: string | null
}

export const useFlujoCaja = (): FlujoCajaState => {
  const [state, setState] = useState<FlujoCajaState>({
    data: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        const response = await fetch('/data/emprestito/flujo_caja.json')
        
        if (!response.ok) {
          throw new Error('Error al cargar archivo de flujo de caja')
        }

        const flujoCajaData = await response.json()
        
        // Los datos están bajo la clave "Hoja1"
        const data: FlujoCajaItem[] = flujoCajaData.Hoja1 || []

        setState({
          data,
          loading: false,
          error: null
        })

        console.log('✅ Datos de flujo de caja cargados:', {
          registros: data.length,
          bancos: Array.from(new Set(data.map(item => item.banco)))
        })

      } catch (error) {
        console.error('❌ Error cargando datos de flujo de caja:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    fetchData()
  }, [])

  return state
}