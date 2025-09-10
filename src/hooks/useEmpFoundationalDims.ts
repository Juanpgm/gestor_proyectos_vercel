import { useState, useEffect } from 'react'

interface EmpFoundationalData {
  bpin: number
  id: number
}

interface EmpFoundationalResponse {
  metadata: {
    title: string
    description: string
    total_records: number
    filter_applied: string
    columns_included: string[]
    columns: string[]
    data_types: Record<string, string>
    export_date: string
    source: string
    generated_by: string
  }
  data: EmpFoundationalData[]
}

export const useEmpFoundationalDims = () => {
  const [data, setData] = useState<EmpFoundationalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uniqueBpins, setUniqueBpins] = useState<number[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/data/emprestito/emp_foundational_dims.json')
        
        if (!response.ok) {
          throw new Error(`Error al cargar datos: ${response.status}`)
        }

        const result: EmpFoundationalResponse = await response.json()
        setData(result.data)

        // Extraer BPINs únicos (excluyendo 0)
        const bpins = Array.from(new Set(
          result.data
            .map(item => item.bpin)
            .filter(bpin => bpin > 0)
        )).sort((a, b) => a - b)
        
        console.log('EMP FOUNDATIONAL: Total records:', result.data.length)
        console.log('EMP FOUNDATIONAL: Unique BPINs found:', bpins.length)
        console.log('EMP FOUNDATIONAL: First 10 BPINs:', bpins.slice(0, 10))
        
        setUniqueBpins(bpins)
        setError(null)
      } catch (err) {
        console.error('Error al cargar emp_foundational_dims:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setData([])
        setUniqueBpins([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    data,
    uniqueBpins,
    loading,
    error,
    isEmprestito: (bpin: number) => uniqueBpins.includes(bpin)
  }
}
