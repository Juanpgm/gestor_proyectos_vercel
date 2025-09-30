import { useState, useEffect, useCallback } from 'react';

// Simplified interface based on what we expect from the JSON file
interface MovimientoPresupuestal {
  bpin: number;
  periodo_corte: string;
  [key: string]: any;
}

export function useMovimientosPresupuestales() {
  const [movimientos, setMovimientos] = useState<MovimientoPresupuestal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/movimientos_presupuestales/movimientos_presupuestales.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data: MovimientoPresupuestal[] = await response.json();
      setMovimientos(data || []);
    } catch (err) {
      console.error('Error loading movimientos presupuestales:', err);
      setError(err instanceof Error ? err.message : 'Error loading data');
      setMovimientos([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData])

  // Función helper para obtener períodos únicos
  const getPeriodos = (): string[] => {
    const periodos = new Set<string>()
    movimientos.forEach(movimiento => {
      if (movimiento.periodo_corte) {
        periodos.add(movimiento.periodo_corte)
      }
    })
    return Array.from(periodos).sort()
  }

  // Función helper para obtener el movimiento más reciente por BPIN
  const getUltimoMovimientoPorBpin = (bpin: number): MovimientoPresupuestal | undefined => {
    const movimientosBpin = movimientos.filter(mov => mov.bpin === bpin)
    if (movimientosBpin.length === 0) return undefined
    
    // Ordenar por período descendente y tomar el primero (más reciente)
    return movimientosBpin.sort((a, b) => b.periodo_corte.localeCompare(a.periodo_corte))[0]
  }

  // Función helper para obtener movimientos por BPIN y períodos específicos
  const getMovimientosPorBpinYPeriodos = (bpin: number, periodos: string[]): MovimientoPresupuestal[] => {
    if (periodos.length === 0) {
      // Si no hay períodos seleccionados, retornar el más reciente
      const ultimo = getUltimoMovimientoPorBpin(bpin)
      return ultimo ? [ultimo] : []
    }
    
    return movimientos.filter(mov => 
      mov.bpin === bpin && periodos.includes(mov.periodo_corte)
    )
  }

  // Función helper para obtener movimientos filtrados por períodos
  const getMovimientosPorPeriodos = (periodos: string[]): MovimientoPresupuestal[] => {
    if (periodos.length === 0) {
      // Si no hay períodos seleccionados, retornar los más recientes por BPIN
      const ultimosPorBpin = new Map<number, MovimientoPresupuestal>()
      
      movimientos.forEach(mov => {
        const actual = ultimosPorBpin.get(mov.bpin)
        if (!actual || mov.periodo_corte > actual.periodo_corte) {
          ultimosPorBpin.set(mov.bpin, mov)
        }
      })
      
      return Array.from(ultimosPorBpin.values())
    }
    
    return movimientos.filter(mov => periodos.includes(mov.periodo_corte))
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
