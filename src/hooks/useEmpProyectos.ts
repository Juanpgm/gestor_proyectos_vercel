import { useState, useEffect } from 'react'

interface EmpProyecto {
  bp: string
  banco: string
  bpin: number | null
  fecha_procesamiento: string
}

export const useEmpProyectos = () => {
  const [data, setData] = useState<EmpProyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validBpins, setValidBpins] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/data/emprestito/emp_proyectos.json')
        
        if (!response.ok) {
          throw new Error(`Error al cargar emp_proyectos.json: ${response.status}`)
        }

        const result: EmpProyecto[] = await response.json()
        setData(result)

        // Extraer BPINs válidos (no nulos y mayor a 0)
        const bpins = Array.from(new Set(
          result
            .filter(item => item.bpin !== null && item.bpin > 0)
            .map(item => item.bpin as number)
        )).sort((a, b) => a - b)
        
        console.log('EMP_PROYECTOS: Total records:', result.length)
        console.log('EMP_PROYECTOS: Valid BPINs found:', bpins.length)
        console.log('EMP_PROYECTOS: First 10 BPINs:', bpins.slice(0, 10))
        
        setValidBpins(bpins)
        setError(null)
      } catch (err) {
        console.error('Error al cargar emp_proyectos.json:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setData([])
        setValidBpins([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    data,
    validBpins,
    loading,
    error,
    isValidBpin: (bpin: number) => validBpins.includes(bpin),
    // Crear un mapa para búsquedas rápidas
    bpinMap: data.reduce((acc, item) => {
      if (item.bpin) {
        acc[item.bpin] = item
      }
      return acc
    }, {} as Record<number, EmpProyecto>)
  }
}
