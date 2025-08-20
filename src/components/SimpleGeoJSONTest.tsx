'use client'

import React, { useEffect, useState } from 'react'

const SimpleGeoJSONTest: React.FC = () => {
  const [equipamientos, setEquipamientos] = useState<any>(null)
  const [infraestructura, setInfraestructura] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    const testGeoJSON = async () => {
      const newErrors: string[] = []
      
      try {
        console.log('🔍 Iniciando test de GeoJSON...')
        
        // Test 1: Verificar acceso a equipamientos
        try {
          const equipRes = await fetch('/data/unidades_proyecto/equipamientos.geojson')
          console.log('📊 Response equipamientos:', equipRes.status, equipRes.statusText)
          
          if (!equipRes.ok) {
            newErrors.push(`Equipamientos: HTTP ${equipRes.status} - ${equipRes.statusText}`)
          } else {
            const equipData = await equipRes.json()
            console.log('📊 Equipamientos data:', {
              type: equipData.type,
              features: equipData.features?.length || 0,
              firstFeature: equipData.features?.[0]
            })
            setEquipamientos(equipData)
          }
        } catch (e: any) {
          newErrors.push(`Error equipamientos: ${e.message}`)
          console.error('❌ Error equipamientos:', e)
        }

        // Test 2: Verificar acceso a infraestructura
        try {
          const infraRes = await fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
          console.log('🛣️ Response infraestructura:', infraRes.status, infraRes.statusText)
          
          if (!infraRes.ok) {
            newErrors.push(`Infraestructura: HTTP ${infraRes.status} - ${infraRes.statusText}`)
          } else {
            const infraData = await infraRes.json()
            console.log('🛣️ Infraestructura data:', {
              type: infraData.type,
              features: infraData.features?.length || 0,
              firstFeature: infraData.features?.[0]
            })
            setInfraestructura(infraData)
          }
        } catch (e: any) {
          newErrors.push(`Error infraestructura: ${e.message}`)
          console.error('❌ Error infraestructura:', e)
        }

      } catch (e: any) {
        newErrors.push(`Error general: ${e.message}`)
        console.error('❌ Error general:', e)
      } finally {
        setErrors(newErrors)
        setLoading(false)
      }
    }

    testGeoJSON()
  }, [])

  if (loading) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🔍 Test de GeoJSON en progreso...
        </h3>
        <div className="animate-pulse">Cargando datos...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        🧪 Resultados del Test de GeoJSON
      </h3>

      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">❌ Errores encontrados:</h4>
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-sm text-red-700">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipamientos */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">📊 Equipamientos</h4>
          {equipamientos ? (
            <div className="space-y-2 text-sm">
              <div>✅ <strong>Status:</strong> Cargado correctamente</div>
              <div>📦 <strong>Type:</strong> {equipamientos.type}</div>
              <div>🎯 <strong>Features:</strong> {equipamientos.features?.length || 0}</div>
              {equipamientos.features?.[0] && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <strong>Primera feature:</strong>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(equipamientos.features[0], null, 2).substring(0, 300)}...
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">❌ No se pudo cargar</div>
          )}
        </div>

        {/* Infraestructura */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">🛣️ Infraestructura</h4>
          {infraestructura ? (
            <div className="space-y-2 text-sm">
              <div>✅ <strong>Status:</strong> Cargado correctamente</div>
              <div>📦 <strong>Type:</strong> {infraestructura.type}</div>
              <div>🎯 <strong>Features:</strong> {infraestructura.features?.length || 0}</div>
              {infraestructura.features?.[0] && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <strong>Primera feature:</strong>
                  <pre className="mt-1 overflow-x-auto">
                    {JSON.stringify(infraestructura.features[0], null, 2).substring(0, 300)}...
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">❌ No se pudo cargar</div>
          )}
        </div>
      </div>

      {/* Test de coordenadas */}
      {equipamientos?.features?.[0] && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">🗺️ Test de Coordenadas</h4>
          <div className="text-sm space-y-1">
            <div><strong>Geometría:</strong> {equipamientos.features[0].geometry?.type}</div>
            <div><strong>Coordenadas:</strong> {JSON.stringify(equipamientos.features[0].geometry?.coordinates)}</div>
            <div><strong>Propiedades:</strong> {Object.keys(equipamientos.features[0].properties || {}).join(', ')}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleGeoJSONTest
