'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Configurar iconos de Leaflet una sola vez
const configureLeafletIcons = () => {
  try {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    })
    console.log('✅ Iconos de Leaflet configurados')
  } catch (e) {
    console.warn('⚠️ Error configurando iconos Leaflet:', e)
  }
}

// Configurar una sola vez al importar el módulo
configureLeafletIcons()

// Tipos
interface FeatureCollection {
  type: 'FeatureCollection'
  features: any[]
}

interface UnidadesProyectoMapProps {
  center?: [number, number]
  zoom?: number
  tileLayerUrl: string
  tileLayerAttribution: string
  equipamientos?: FeatureCollection | null
  infraestructura?: FeatureCollection | null
}

// Componente para configurar panes
const MapPaneSetup: React.FC = () => {
  const map = useMap()
  
  useEffect(() => {
    if (!map.getPane('vectorLayers')) {
      map.createPane('vectorLayers')
      const pane = map.getPane('vectorLayers')
      if (pane) {
        pane.style.zIndex = '650'
        pane.style.pointerEvents = 'auto'
      }
    }
  }, [map])
  
  return null
}

// Normalizar coordenadas [lat, lng] a [lng, lat] para GeoJSON
function normalizeCoordinates(coords: any): [number, number] | null {
  if (!Array.isArray(coords) || coords.length < 2) return null
  
  const [first, second] = coords
  const lat = parseFloat(first)
  const lng = parseFloat(second)
  
  if (isNaN(lat) || isNaN(lng)) return null
  
  // Para Cali: lat ~3.x, lng ~-76.x
  // Si tenemos [lat, lng], convertir a [lng, lat] para Leaflet
  if (lat > 2 && lat < 5 && lng > -78 && lng < -75) {
    return [lng, lat] // [lng, lat] para Leaflet
  }
  
  // Si ya está en [lng, lat]
  if (first > -78 && first < -75 && second > 2 && second < 5) {
    return [first, second]
  }
  
  // Fallback: asumir [lat, lng] y convertir
  return [lng, lat]
}

// Colores por tipo
function getFeatureColor(claseObra?: string, tipoIntervencion?: string): string {
  // Por clase de obra
  if (claseObra) {
    const clase = claseObra.toLowerCase()
    if (clase.includes('educativa')) return '#10B981' // Verde
    if (clase.includes('deportiva')) return '#3B82F6' // Azul
    if (clase.includes('vial')) return '#F59E0B' // Amarillo
    if (clase.includes('social')) return '#8B5CF6' // Púrpura
  }
  
  // Por tipo de intervención
  if (tipoIntervencion) {
    const tipo = tipoIntervencion.toLowerCase()
    if (tipo.includes('construcción') || tipo.includes('construccion')) return '#10B981'
    if (tipo.includes('mejoramiento')) return '#3B82F6'
    if (tipo.includes('rehabilitación') || tipo.includes('rehabilitacion')) return '#F59E0B'
    if (tipo.includes('mantenimiento')) return '#EF4444'
    if (tipo.includes('adecuación') || tipo.includes('adecuacion')) return '#8B5CF6'
  }
  
  return '#6B7280' // Gris por defecto
}

const UnidadesProyectoMap: React.FC<UnidadesProyectoMapProps> = ({
  center = [3.4516, -76.5320],
  zoom = 11,
  tileLayerUrl,
  tileLayerAttribution,
  equipamientos,
  infraestructura
}) => {
  const [isClient, setIsClient] = useState(false)
  const [processedEquipamientos, setProcessedEquipamientos] = useState<FeatureCollection | null>(null)
  const [processedInfraestructura, setProcessedInfraestructura] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    setIsClient(true)
    console.log('🗺️ UnidadesProyectoMap montado')
  }, [])

  // Procesar equipamientos
  useEffect(() => {
    if (equipamientos) {
      const processed = {
        ...equipamientos,
        features: equipamientos.features
          .map(feature => {
            if (feature?.geometry?.type === 'Point') {
              const normalizedCoords = normalizeCoordinates(feature.geometry.coordinates)
              if (normalizedCoords) {
                return {
                  ...feature,
                  geometry: {
                    ...feature.geometry,
                    coordinates: normalizedCoords
                  }
                }
              }
            }
            return null
          })
          .filter(Boolean)
      }
      
      console.log(`✅ Equipamientos procesados: ${processed.features.length}/${equipamientos.features.length}`)
      setProcessedEquipamientos(processed)
    }
  }, [equipamientos])

  // Procesar infraestructura
  useEffect(() => {
    if (infraestructura) {
      console.log(`🛣️ Infraestructura recibida: ${infraestructura.features.length} features`)
      setProcessedInfraestructura(infraestructura)
    }
  }, [infraestructura])

  // Estilos para puntos
  const pointToLayer = (feature: any, latlng: L.LatLng) => {
    const color = getFeatureColor(
      feature.properties?.clase_obra,
      feature.properties?.tipo_intervencion
    )
    
    return L.circleMarker(latlng, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.8,
      pane: 'vectorLayers'
    })
  }

  // Estilos para líneas
  const lineStyle = (feature: any) => {
    const color = getFeatureColor(
      feature?.properties?.clase_obra,
      feature?.properties?.tipo_intervencion
    )
    
    return {
      color: color,
      weight: 3,
      opacity: 0.8,
      pane: 'vectorLayers'
    }
  }

  // Popups
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature?.properties) {
      const p = feature.properties
      const name = p.nickname || p.id_via || p.nombre || 'Sin nombre'
      const claseObra = p.clase_obra || 'N/A'
      const tipoIntervencion = p.tipo_intervencion || 'N/A'
      const estado = p.estado_unidad_proyecto || 'N/A'
      const presupuesto = p.ppto_base ? 
        `$${p.ppto_base.toLocaleString('es-CO')} COP` : 'N/A'
      
      const popupContent = `
        <div style="min-width: 250px; font-family: system-ui;">
          <h4 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">
            ${name}
          </h4>
          <div style="font-size: 13px; line-height: 1.4;">
            <p style="margin: 4px 0;"><strong>Clase:</strong> ${claseObra}</p>
            <p style="margin: 4px 0;"><strong>Intervención:</strong> ${tipoIntervencion}</p>
            <p style="margin: 4px 0;"><strong>Estado:</strong> ${estado}</p>
            <p style="margin: 4px 0;"><strong>Presupuesto:</strong> ${presupuesto}</p>
            ${p.comuna_corregimiento ? `<p style="margin: 4px 0;"><strong>Comuna:</strong> ${p.comuna_corregimiento}</p>` : ''}
            ${p.barrio_vereda ? `<p style="margin: 4px 0;"><strong>Barrio:</strong> ${p.barrio_vereda}</p>` : ''}
          </div>
        </div>
      `
      
      layer.bindPopup(popupContent)
    }
  }

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Inicializando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <MapPaneSetup />
      
      <TileLayer
        url={tileLayerUrl}
        attribution={tileLayerAttribution}
        maxZoom={18}
      />

      {/* Equipamientos (puntos) */}
      {processedEquipamientos && processedEquipamientos.features.length > 0 && (
        <GeoJSON
          key={`equipamientos-${processedEquipamientos.features.length}`}
          data={processedEquipamientos}
          pointToLayer={pointToLayer}
          onEachFeature={onEachFeature}
        />
      )}

      {/* Infraestructura (líneas) */}
      {processedInfraestructura && processedInfraestructura.features.length > 0 && (
        <GeoJSON
          key={`infraestructura-${processedInfraestructura.features.length}`}
          data={processedInfraestructura}
          style={lineStyle}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  )
}

export default UnidadesProyectoMap
