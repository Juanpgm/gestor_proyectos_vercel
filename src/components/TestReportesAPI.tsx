'use client'

import React, { useState, useEffect } from 'react'

const TestReportesAPI = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/reportes_contratos_all')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-4">Cargando...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test API /api/reportes_contratos_all</h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Respuesta del API:</h2>
        <pre className="text-sm overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {data?.data && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Análisis de datos:</h2>
          <div className="space-y-2">
            <p><strong>Total de reportes:</strong> {data.data.length}</p>
            <p><strong>Campos del primer reporte:</strong></p>
            <ul className="ml-4 list-disc">
              {data.data.length > 0 && Object.keys(data.data[0]).map(key => (
                <li key={key}>{key}: {JSON.stringify(data.data[0][key])}</li>
              ))}
            </ul>

            <div className="mt-4">
              <h3 className="font-semibold">Referencias de contrato únicas:</h3>
              <div className="max-h-32 overflow-auto bg-white dark:bg-gray-700 p-2 rounded text-sm">
                {Array.from(new Set(data.data.map((r: any) => r.referencia_contrato))).map((ref, index) => (
                  <div key={index} className="mb-1">
                    {String(ref)} ({data.data.filter((r: any) => r.referencia_contrato === ref).length} reportes)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestReportesAPI