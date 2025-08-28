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
        console.log('🌟 CLIENT-ONLY: Fetching equipamientos...')
        const equipResponse = await fetch('/data/unidades_proyecto/equipamientos.geojson')
        const equipData = await equipResponse.json()
        
        console.log('🌟 CLIENT-ONLY: Fetching infraestructura...')
        const infraResponse = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
        const infraData = await infraResponse.json()

        console.log('🌟 CLIENT-ONLY: Success! Equipamientos:', equipData.features?.length)
        console.log('🌟 CLIENT-ONLY: Success! Infraestructura:', infraData.features?.length)

        const allFeatures = [
          ...(equipData.features || []),
          ...(infraData.features || [])
        ]

        setData({
          loading: false,
          error: null,
          unidadesProyecto: allFeatures.map((feature: any, index: number) => ({
            id: feature.properties?.id || `feature_${index}`,
            name: feature.properties?.name || feature.properties?.NOMBRE || `Objeto ${index}`,
            description: 'Cargado con éxito',
            geometry: feature.geometry,
            properties: feature.properties
          })),
          message: `Datos cargados: ${allFeatures.length} objetos`
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
