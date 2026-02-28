'use client'

import { useState, useEffect } from 'react'
import { fetchWithErrorHandling } from '@/utils/errorHandler'
import {
  getCentroGestorAccessFromSession,
  filterByCentroGestor
} from '@/utils/centroGestorAccess'

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

        const flujoCajaData = await fetchWithErrorHandling<any>(
          '/data/emprestito/flujo_caja.json',
          {},
          120000 // 2 minutos de timeout
        )
        
        // Los datos están bajo la clave "Hoja1"
        const data: FlujoCajaItem[] = flujoCajaData.Hoja1 || []
        const centroGestorAccess = getCentroGestorAccessFromSession()
        const dataFiltrada = filterByCentroGestor(data, centroGestorAccess, ['centro_gestor'])

        setState({
          data: dataFiltrada,
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