'use client'

import React, { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = [number, number]

interface UpLocationPickerMapProps {
  position: LatLng | null
  onPositionChange: (position: LatLng) => void
  isDark: boolean
  readOnly?: boolean
}

const DEFAULT_CENTER: LatLng = [3.4516, -76.5320] // Cali, CO

// Ensure default marker icons resolve correctly in Next.js builds.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

const MapClickHandler: React.FC<{ onSelect: (position: LatLng) => void }> = ({ onSelect }) => {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })

  return null
}

const RecenterMap: React.FC<{ center: LatLng }> = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [map, center])

  return null
}

const UpLocationPickerMap: React.FC<UpLocationPickerMapProps> = ({
  position,
  onPositionChange,
  isDark,
  readOnly = false,
}) => {
  const center = position || DEFAULT_CENTER

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <RecenterMap center={center} />

        <TileLayer
          url={isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {!readOnly && <MapClickHandler onSelect={onPositionChange} />}

        {position && (
          <Marker
            position={position}
            draggable={!readOnly}
            eventHandlers={readOnly ? undefined : {
              dragend: (event) => {
                const marker = event.target as L.Marker
                const p = marker.getLatLng()
                onPositionChange([p.lat, p.lng])
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}

export default UpLocationPickerMap
