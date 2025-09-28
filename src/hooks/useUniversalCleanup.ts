import { useEffect, useRef } from 'react'

/**
 * Hook universal para limpieza de estado y prevención de memory leaks
 * Especialmente útil para la sección Unidades de Proyecto
 */
export function useUniversalCleanup() {
  const cleanupFunctions = useRef<(() => void)[]>([])
  
  // Registrar función de limpieza
  const registerCleanup = (cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn)
  }
  
  // Ejecutar limpieza al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Ejecutando limpieza universal...')
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Error en cleanup:', error)
        }
      })
      cleanupFunctions.current = []
    }
  }, [])
  
  return { registerCleanup }
}

/**
 * Hook específico para limpiar estado de Unidades de Proyecto
 */
export function useUnidadesProyectoCleanup() {
  const { registerCleanup } = useUniversalCleanup()
  
  // Limpiar estado global de unidades de proyecto
  const cleanupUnidadesState = () => {
    // Resetear estado global si existe
    if (typeof window !== 'undefined' && (window as any).globalUnidadesState) {
      (window as any).globalUnidadesState = null
    }
    
    // Limpiar listeners
    if (typeof window !== 'undefined' && (window as any).globalUnidadesListeners) {
      (window as any).globalUnidadesListeners.clear()
    }
    
    console.log('🗑️ Estado de Unidades de Proyecto limpiado')
  }
  
  useEffect(() => {
    registerCleanup(cleanupUnidadesState)
  }, [registerCleanup])
  
  return { cleanupUnidadesState }
}
