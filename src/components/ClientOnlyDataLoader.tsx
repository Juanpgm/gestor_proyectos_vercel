'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Component that only renders on client
function ClientOnlyDataLoader() {
  const [data, setData] = useState({
    loading: true,
    error: null,
    unidadesProyecto: [] as any[],
    message: 'Inicializando...'
  })

  useEffect(() => {
    console.log('🌟 CLIENT-ONLY: useEffect running!')
    
    const loadData = async () => {
      try {
        // Eliminar carga de archivos GeoJSON que no existen
        console.log('🌟 CLIENT-ONLY: Simulando carga exitosa sin archivos GeoJSON')

        setData({
          loading: false,
          error: null,
          unidadesProyecto: [],
          message: `Componente deshabilitado - GeoJSON eliminados`
        })
      } catch (error: any) {
        console.error('🌟 CLIENT-ONLY: Error:', error)
        setData({
          loading: false,
          error: error.message,
          unidadesProyecto: [],
          message: `Error: ${error.message}`
        })
      }
    }

    loadData()
  }, [])

  return (
    <div className="bg-green-100 p-4 rounded-lg">
      <h3 className="font-bold text-green-800">🌟 Cliente-Only Data Loader</h3>
      <p className="text-green-700">Status: {data.message}</p>
      <p className="text-green-700">Loading: {data.loading ? 'Sí' : 'No'}</p>
      <p className="text-green-700">Error: {data.error || 'Ninguno'}</p>
      <p className="text-green-700">Objetos cargados: {data.unidadesProyecto.length}</p>
    </div>
  )
}

// Export with dynamic import to ensure it only runs on client
export default dynamic(() => Promise.resolve(ClientOnlyDataLoader), {
  ssr: false,
  loading: () => <div className="bg-yellow-100 p-4 rounded-lg">🌟 Preparando carga de datos en cliente...</div>
})
