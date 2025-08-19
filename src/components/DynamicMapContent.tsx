'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import MapPopup from './MapPopup'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Configurar iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
})

interface ProjectMarker {
  id: string
  name: string
  lat: number
  lng: number
  status: string
  budget: number
  progress: number
  community: string
  neighborhood: string
}

interface DynamicMapContentProps {
  markers?: ProjectMarker[]
  center?: [number, number]
  zoom?: number
  selectedMarker?: string | null
  onMarkerClick?: (markerId: string) => void
  tileLayerUrl?: string
  tileLayerAttribution?: string
}

const DynamicMapContent: React.FC<DynamicMapContentProps> = ({
  markers = [],
  center = [3.4516, -76.5320], // Cali, Colombia
  zoom = 12,
  selectedMarker = null,
  onMarkerClick = () => {},
  tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution = '© OpenStreetMap contributors'
}) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#3B82F6'
      case 'completed': return '#10B981'
      case 'planned': return '#F59E0B'
      case 'suspended': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En Ejecución'
      case 'completed': return 'Completado'
      case 'planned': return 'Planificado'
      case 'suspended': return 'Suspendido'
      default: return 'Desconocido'
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1).replace('.', ',')}B`
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`
    }
    return `$${value.toLocaleString('de-DE')}`
  }

  const createCustomIcon = (color: string, isSelected: boolean = false) => {
    const size = isSelected ? 35 : 25
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ${isSelected ? 'transform: scale(1.2);' : ''}
      "></div>
    `
    
    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    })
  }

  if (!isClient) {
    return null
  }

  // Datos de ejemplo para los marcadores
  const defaultMarkers: ProjectMarker[] = [
    {
      id: '1',
      name: 'Mejoramiento de Vías Comuna 15',
      lat: 3.4516,
      lng: -76.5320,
      status: 'active',
      budget: 2500000000,
      progress: 65,
      community: 'Comuna 15',
      neighborhood: 'Aguablanca'
    },
    {
      id: '2',
      name: 'Construcción Parque Infantil',
      lat: 3.4580,
      lng: -76.5180,
      status: 'completed',
      budget: 850000000,
      progress: 100,
      community: 'Comuna 8',
      neighborhood: 'Villa del Lago'
    },
    {
      id: '3',
      name: 'Centro de Salud Comunitario',
      lat: 3.4420,
      lng: -76.5420,
      status: 'planned',
      budget: 4200000000,
      progress: 15,
      community: 'Comuna 12',
      neighborhood: 'Llano Verde'
    },
    {
      id: '4',
      name: 'Biblioteca Pública Digital',
      lat: 3.4650,
      lng: -76.5250,
      status: 'active',
      budget: 1800000000,
      progress: 40,
      community: 'Comuna 5',
      neighborhood: 'Centro'
    },
    {
      id: '5',
      name: 'Polideportivo Municipal',
      lat: 3.4380,
      lng: -76.5480,
      status: 'suspended',
      budget: 3200000000,
      progress: 25,
      community: 'Comuna 18',
      neighborhood: 'Cañaveralejo'
    }
  ]

  const displayMarkers = markers.length > 0 ? markers : defaultMarkers

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution={tileLayerAttribution}
        url={tileLayerUrl}
      />
      
      {displayMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createCustomIcon(getMarkerColor(marker.status), selectedMarker === marker.id)}
          eventHandlers={{
            click: () => onMarkerClick(marker.id)
          }}
        >
          <Popup className="custom-popup" maxWidth={350}>
            <MapPopup 
              data={{
                title: marker.name,
                status: {
                  label: getStatusLabel(marker.status),
                  color: marker.status === 'active' ? 'text-blue-800' :
                         marker.status === 'completed' ? 'text-green-800' :
                         marker.status === 'planned' ? 'text-yellow-800' : 'text-red-800',
                  bgColor: marker.status === 'active' ? 'bg-blue-100' :
                           marker.status === 'completed' ? 'bg-green-100' :
                           marker.status === 'planned' ? 'bg-yellow-100' : 'bg-red-100'
                },
                items: [
                  {
                    label: 'Presupuesto',
                    value: marker.budget,
                    format: 'currency'
                  }
                ],
                progress: {
                  value: marker.progress,
                  color: marker.status === 'completed' ? 'bg-green-500' :
                         marker.status === 'active' ? 'bg-blue-500' :
                         marker.status === 'planned' ? 'bg-yellow-500' : 'bg-red-500'
                },
                location: {
                  community: marker.community,
                  neighborhood: marker.neighborhood
                }
              }}
            />
          </Popup>
        </Marker>
      ))}
      
      {displayMarkers.map((marker) => (
        <Circle
          key={`circle-${marker.id}`}
          center={[marker.lat, marker.lng]}
          radius={200}
          pathOptions={{
            color: getMarkerColor(marker.status),
            fillColor: getMarkerColor(marker.status),
            fillOpacity: 0.1,
            weight: 2
          }}
        />
      ))}
    </MapContainer>
  )
}

export default DynamicMapContent
