import { useState, useEffect } from 'react'

// Interfaces para tipar los datos
export interface MovimientoPresupuestal {
  bpin: number
  vigencia: number
  periodo: string
  vr_cdp: number
  vr_crp: number
  vr_obligaciones: number
  vr_pagos: number
  archivo_origen: string
}

export function useMovimientosPresupuestales() {
  const [movimientos, setMovimientos] = useState<MovimientoPresupuestal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMovimientos = async () => {
      try {
        console.log('🔄 Iniciando carga de movimientos presupuestales...')
        setLoading(true)
        setError(null)
        
        const response = await fetch('/data/ejecucion_presupuestal/movimientos_presupuestales.json')
        console.log('📡 Respuesta del fetch movimientos:', response.status, response.ok)
        
        if (!response.ok) {
          throw new Error('Error al cargar los movimientos presupuestales')
        }
        
        const data: MovimientoPresupuestal[] = await response.json()
        console.log('📊 Movimientos presupuestales cargados:', data.length, 'registros')
        
        setMovimientos(data)
        
      } catch (err) {
        console.error('❌ Error loading movimientos presupuestales:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
        console.log('✅ Carga de movimientos presupuestales completada')
      }
    }

    loadMovimientos()
  }, [])

  // Función helper para obtener períodos únicos
  const getPeriodos = (): string[] => {
    const periodos = new Set<string>()
    movimientos.forEach(movimiento => {
      if (movimiento.periodo) {
        periodos.add(movimiento.periodo)
      }
    })
    return Array.from(periodos).sort()
  }

  // Función helper para obtener el movimiento más reciente por BPIN
  const getUltimoMovimientoPorBpin = (bpin: number): MovimientoPresupuestal | undefined => {
    const movimientosBpin = movimientos.filter(mov => mov.bpin === bpin)
    if (movimientosBpin.length === 0) return undefined
    
    // Ordenar por período descendente y tomar el primero (más reciente)
    return movimientosBpin.sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  }

  // Función helper para obtener movimientos por BPIN y períodos específicos
  const getMovimientosPorBpinYPeriodos = (bpin: number, periodos: string[]): MovimientoPresupuestal[] => {
    if (periodos.length === 0) {
      // Si no hay períodos seleccionados, retornar el más reciente
      const ultimo = getUltimoMovimientoPorBpin(bpin)
      return ultimo ? [ultimo] : []
    }
    
    return movimientos.filter(mov => 
      mov.bpin === bpin && periodos.includes(mov.periodo)
    )
  }

  // Función helper para obtener movimientos filtrados por períodos
  const getMovimientosPorPeriodos = (periodos: string[]): MovimientoPresupuestal[] => {
    if (periodos.length === 0) {
      // Si no hay períodos seleccionados, retornar los más recientes por BPIN
      const ultimosPorBpin = new Map<number, MovimientoPresupuestal>()
      
      movimientos.forEach(mov => {
        const actual = ultimosPorBpin.get(mov.bpin)
        if (!actual || mov.periodo > actual.periodo) {
          ultimosPorBpin.set(mov.bpin, mov)
        }
      })
      
      return Array.from(ultimosPorBpin.values())
    }
    
    return movimientos.filter(mov => periodos.includes(mov.periodo))
  }

  return {
    movimientos,
    loading,
    error,
    getPeriodos,
    getUltimoMovimientoPorBpin,
    getMovimientosPorBpinYPeriodos,
    getMovimientosPorPeriodos
  }
}
