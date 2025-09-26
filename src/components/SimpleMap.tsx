'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { UnidadProyectoGeo } from '@/services/unidadesProyectoApi'

interface SimpleMapProps {
  data: UnidadProyectoGeo[]
  onFeatureClick?: (feature: UnidadProyectoGeo) => void
  height?: number
  className?: string
}

const MapUpdater: React.FC<{ data: UnidadProyectoGeo[] }> = ({ data }) => {
  const map = useMap()
  
  useEffect(() => {
    if (data.length > 0) {
      const bounds = data.map(item => [
        item.coordinates?.lat || 3.4516,
        item.coordinates?.lng || -76.5320
      ] as [number, number])
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [data, map])
  
  return null
}

const SimpleMap: React.FC<SimpleMapProps> = ({
  data,
  onFeatureClick,
  height = 600,
  className = 'w-full'
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-gray-500 dark:text-gray-400">Cargando mapa...</div>
      </div>
    )
  }

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={[3.4516, -76.5320]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapUpdater data={data} />
        
        {data.map((item) => {
          if (!item.coordinates?.lat || !item.coordinates?.lng) return null
          
          // Determinar color basado en estado
          const getColor = () => {
            if (!item.estado) return '#6b7280' // gris para sin estado
            
            switch (item.estado.toLowerCase()) {
              case 'terminado':
              case 'ejecutado':
              case 'finalizado':
                return '#10b981' // verde
              case 'en_ejecucion':
              case 'en ejecución':
              case 'ejecucion':
                return '#f59e0b' // amarillo
              case 'contratado':
              case 'adjudicado':
                return '#3b82f6' // azul
              case 'suspendido':
              case 'cancelado':
                return '#ef4444' // rojo
              default:
                return '#6b7280' // gris por defecto
            }
          }
          
          return (
            <CircleMarker
              key={`${item.id || item.bpin}`}
              center={[item.coordinates.lat, item.coordinates.lng]}
              radius={6}
              pathOptions={{
                fillColor: getColor(),
                color: '#ffffff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              }}
              eventHandlers={{
                click: () => onFeatureClick?.(item)
              }}
            >
              <Popup>
                <div className="min-w-[250px]">
                  <h3 className="font-semibold text-sm mb-2">{item.nombre}</h3>
                  <div className="space-y-1 text-xs">
                    <p><strong>BPIN:</strong> {item.bpin}</p>
                    <p><strong>Estado:</strong> {item.estado}</p>
                    <p><strong>Comuna:</strong> {item.comuna}</p>
                    <p><strong>Barrio:</strong> {item.barrio}</p>
                    {item.presupuesto_base && (
                      <p><strong>Presupuesto:</strong> ${item.presupuesto_base.toLocaleString()}</p>
                    )}
                    {item.avance_obra && (
                      <p><strong>Avance:</strong> {(item.avance_obra * 100).toFixed(1)}%</p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default SimpleMap