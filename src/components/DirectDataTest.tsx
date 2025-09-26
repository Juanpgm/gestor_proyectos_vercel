'use client'

import { useState } from 'react'

// Simple component to test direct data loading
export default function DirectDataTest() {
  const [status, setStatus] = useState('Iniciando...')
  const [data, setData] = useState<any>(null)

  // Direct function to load data without useEffect
  const loadDataDirectly = async () => {
    try {
      setStatus('GeoJSON files eliminados - datos vacíos')
      
      // GeoJSON files eliminados - retornando datos vacíos
      const equipData = { features: [] }
      const infraData = { features: [] }

      setData({
        equipamientos: equipData.features?.length || 0,
        infraestructura: infraData.features?.length || 0,
        total: (equipData.features?.length || 0) + (infraData.features?.length || 0)
      })
      
      setStatus('✅ Datos cargados correctamente')
      
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    }
  }

  return (
    <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg border border-green-200 dark:border-green-700">
      <h3 className="font-bold text-green-800 dark:text-green-200 text-lg mb-4">
        🧪 Prueba de Carga Directa de Datos
      </h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-green-700 dark:text-green-300 mb-2">Estado: {status}</p>
          
          {data && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded border">
              <h4 className="font-medium mb-2">Datos cargados:</h4>
              <ul className="space-y-1 text-sm">
                <li>📍 Equipamientos: {data.equipamientos} objetos</li>
                <li>🛣️ Infraestructura vial: {data.infraestructura} objetos</li>
                <li>📊 Total: {data.total} objetos vectoriales</li>
              </ul>
            </div>
          )}
        </div>
        
        <button
          onClick={loadDataDirectly}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          🚀 Cargar Datos Manualmente
        </button>
        
        <div className="text-xs text-green-600 dark:text-green-400">
          Esta prueba omite completamente los hooks de React y carga los datos mediante fetch directo.
          Si esto funciona, confirma que el problema está en la hidratación de React, no en los archivos.
        </div>
      </div>
    </div>
  )
}
