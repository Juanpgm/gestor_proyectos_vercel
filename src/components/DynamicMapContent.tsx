'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Configurar iconos (aunque para puntos usaremos CircleMarker)
try {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  })
} catch {}

type FeatureCollection = {
  type: 'FeatureCollection'
  features: any[]
}

interface DynamicMapContentProps {
  center: [number, number]
  zoom: number
  selectedMarker?: string | null
  onMarkerClick?: (id: string) => void
  tileLayerUrl: string
  tileLayerAttribution: string
  equipamientos?: FeatureCollection | null
  infraestructura?: FeatureCollection | null
}

// Pane para poner capas vectoriales sobre los tiles
const SetupVectorPane: React.FC = () => {
  const map = useMap()
  useEffect(() => {
    if (!map.getPane('vectorLayers')) {
      map.createPane('vectorLayers')
      const pane = map.getPane('vectorLayers')!
      pane.style.zIndex = '650'
    }
  }, [map])
  return null
}

// Normaliza diferentes formatos de coordenadas a [lng, lat] para GeoJSON
function normalizePointCoords(coords: any): [number, number] | null {
  if (!coords || !Array.isArray(coords)) return null
  
  // Filtrar coordenadas vacías o nulas
  if (coords.length === 0) return null
  
  if (coords.length === 2) {
    const [a, b] = coords.map((v: any) => (typeof v === 'string' ? parseFloat(v) : v))
    
    // Validar que sean números válidos
    if (isNaN(a) || isNaN(b)) return null
    
    // Para Cali: lat ~ 3.x, lng ~ -76.x
    // El GeoJSON de equipamientos viene en formato [lat, lng], necesitamos [lng, lat]
    if (a > 2 && a < 5 && b > -78 && b < -75) {
      // Es formato [lat, lng], convertir a [lng, lat]
      return [b, a]
    }
    
    // Si ya está en formato [lng, lat]
    if (a > -78 && a < -75 && b > 2 && b < 5) {
      return [a, b]
    }
    
    // Fallback: asumir formato [lat, lng] y convertir
    return [b, a]
  }
  
  if (coords.length === 4) {
    const lat = parseFloat(`${coords[0]}.${coords[1]}`)
    const lng = parseFloat(`${coords[2]}.${coords[3]}`)
    
    if (isNaN(lat) || isNaN(lng)) return null
    return [lng, lat] // GeoJSON format [lng, lat]
  }
  
  return null
}

const DynamicMapContent: React.FC<DynamicMapContentProps> = ({
  center,
  zoom,
  tileLayerUrl,
  tileLayerAttribution,
  equipamientos: equipamientosProp,
  infraestructura: infraestructuraProp,
}) => {
  const [isClient, setIsClient] = useState(false)
  const [equipamientos, setEquipamientos] = useState<FeatureCollection | null>(null)
  const [infraestructura, setInfraestructura] = useState<FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setIsClient(true), [])

  // Usar datos pasados como props si están disponibles, sino cargar desde API
  useEffect(() => {
    if (equipamientosProp && infraestructuraProp) {
      setEquipamientos(equipamientosProp)
      setInfraestructura(infraestructuraProp)
      setLoading(false)
      setError(null)
      return
    }

    if (!isClient) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // Cargar ambas capas desde public/data/unidades_proyecto
        const [eqRes, ivRes] = await Promise.all([
          fetch('/data/unidades_proyecto/equipamientos.geojson'),
          fetch('/data/unidades_proyecto/infraestructura_vial.geojson'),
        ])
        if (!eqRes.ok) throw new Error(`Equipamientos HTTP ${eqRes.status}`)
        if (!ivRes.ok) throw new Error(`Infraestructura HTTP ${ivRes.status}`)

        const rawEq = (await eqRes.json()) as FeatureCollection
        const rawIv = (await ivRes.json()) as FeatureCollection

        // Normalizar puntos de equipamientos a [lng, lat]
        const eq = {
          ...rawEq,
          features: (rawEq.features || []).map((f: any) => {
            if (f?.geometry?.type === 'Point') {
              const n = normalizePointCoords(f.geometry.coordinates)
              if (n) {
                return {
                  ...f,
                  geometry: { ...f.geometry, coordinates: n },
                }
              } else {
                // Omitir features sin coordenadas válidas
                console.warn('Feature omitido por coordenadas inválidas:', f.properties?.nickname || 'sin nombre', f.geometry.coordinates)
                return null
              }
            }
            return f
          }).filter(Boolean), // Filtrar features nulos
        }

        // También normalizar infraestructura si tiene LineString
        const iv = {
          ...rawIv,
          features: (rawIv.features || []).map((f: any) => {
            if (f?.geometry?.type === 'LineString') {
              // Para LineString, normalizar cada punto de la línea
              const normalizedCoords = f.geometry.coordinates.map((coord: any) => normalizePointCoords(coord)).filter(Boolean)
              if (normalizedCoords.length > 1) {
                return {
                  ...f,
                  geometry: { ...f.geometry, coordinates: normalizedCoords },
                }
              } else {
                console.warn('LineString omitida por coordenadas insuficientes:', f.properties?.id_via || 'sin nombre')
                return null
              }
            }
            return f
          }).filter(Boolean),
        }

        if (!cancelled) {
          console.log('✅ Equipamientos cargados:', eq.features.length, 'de', rawEq.features.length, 'features originales')
          if (eq.features.length > 0) {
            console.log('📍 Muestra de coordenadas normalizadas:', eq.features.slice(0, 3).map(f => ({
              name: f.properties?.nickname || 'sin nombre',
              coords: f.geometry?.coordinates
            })))
          }
          console.log('🛣️ Infraestructura cargada:', iv.features.length, 'de', rawIv.features.length, 'features originales')
          setEquipamientos(eq)
          setInfraestructura(iv)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Error cargando datos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isClient, equipamientosProp, infraestructuraProp])

  // Estilos mejorados basados en los datos reales
  const getClaseObraColor = (claseObra?: string, tipoIntervencion?: string) => {
    // Primero intentar por clase_obra
    if (claseObra) {
      const clase = claseObra.toLowerCase()
      if (clase.includes('infraestructura educativa') || clase.includes('educativa')) return '#10B981' // Verde
      if (clase.includes('infraestructura deportiva') || clase.includes('deportiva')) return '#3B82F6' // Azul
      if (clase.includes('infraestructura vial') || clase.includes('vial')) return '#F59E0B' // Amarillo
      if (clase.includes('infraestructura social') || clase.includes('social')) return '#8B5CF6' // Púrpura
    }
    
    // Fallback a tipo_intervencion
    if (tipoIntervencion) {
      const tipo = tipoIntervencion.toLowerCase()
      if (tipo.includes('construcción') || tipo.includes('construccion')) return '#10B981' // Verde
      if (tipo.includes('mejoramiento')) return '#3B82F6' // Azul
      if (tipo.includes('rehabilitación') || tipo.includes('rehabilitacion')) return '#F59E0B' // Amarillo
      if (tipo.includes('mantenimiento')) return '#EF4444' // Rojo
      if (tipo.includes('adecuación') || tipo.includes('adecuacion')) return '#8B5CF6' // Púrpura
    }
    
    return '#6B7280' // Gris por defecto
  }

  const pointToLayer = (_feature: any, latlng: L.LatLng) => {
    const props = _feature.properties
    const color = getClaseObraColor(props?.clase_obra, props?.tipo_intervencion)
    
    return L.circleMarker(latlng, {
      radius: 8,
      color: '#ffffff',
      weight: 1.5,
      fillColor: color,
      fillOpacity: 0.85,
      pane: 'vectorLayers',
    })
  }

  const lineStyle = (_feature: any) => {
    const props = _feature.properties
    const color = getClaseObraColor(props?.clase_obra, props?.tipo_intervencion)
    
    return {
      color: color,
      weight: 4,
      opacity: 0.9,
      pane: 'vectorLayers',
    }
  }

  const onEach = (feature: any, layer: L.Layer) => {
    if (feature?.properties) {
      const p = feature.properties
      const name = p.nickname || p.id_via || p.nombre || 'Detalle'
      const claseObra = p.clase_obra || 'N/A'
      const tipoIntervencion = p.tipo_intervencion || 'N/A'
      const estado = p.estado_unidad_proyecto || 'N/A'
      const presupuesto = p.ppto_base ? `$${p.ppto_base.toLocaleString('es-CO')} COP` : 'N/A'
      const avanceFisico = p.avance_físico_obra ? `${(p.avance_físico_obra * 100).toFixed(1)}%` : 'N/A'
      const centroGestor = p.nombre_centro_gestor || 'N/A'
      
      const html = `
        <div style="min-width:280px; max-width:400px;">
          <h4 style="margin:0 0 8px 0; font-weight:bold; color:#1f2937;">${name}</h4>
          <div style="font-size:12px; line-height:1.4;">
            <p><strong>Clase de Obra:</strong> ${claseObra}</p>
            <p><strong>Tipo Intervención:</strong> ${tipoIntervencion}</p>
            <p><strong>Estado:</strong> ${estado}</p>
            <p><strong>Centro Gestor:</strong> ${centroGestor}</p>
            <p><strong>Presupuesto:</strong> ${presupuesto}</p>
            <p><strong>Avance Físico:</strong> ${avanceFisico}</p>
            ${p.comuna_corregimiento ? `<p><strong>Comuna:</strong> ${p.comuna_corregimiento}</p>` : ''}
            ${p.barrio_vereda ? `<p><strong>Barrio:</strong> ${p.barrio_vereda}</p>` : ''}
            ${p.direccion ? `<p><strong>Dirección:</strong> ${p.direccion}</p>` : ''}
          </div>
        </div>
      `
      ;(layer as any).bindPopup(html)
    }
  }

  if (!isClient) return null

  // Debug: Log de estado de datos
  useEffect(() => {
    console.log('DynamicMapContent - Estado de datos:', {
      loading,
      error,
      equipamientos: equipamientos ? `${equipamientos.features.length} features` : 'null',
      infraestructura: infraestructura ? `${infraestructura.features.length} features` : 'null'
    })
  }, [loading, error, equipamientos, infraestructura])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      attributionControl={true}
    >
      <SetupVectorPane />
      <TileLayer attribution={tileLayerAttribution} url={tileLayerUrl} />

      {!loading && equipamientos && equipamientos.features.length > 0 && (
        <GeoJSON
          key={`eq-${equipamientos.features.length}`}
          data={equipamientos as any}
          pointToLayer={pointToLayer as any}
          onEachFeature={onEach as any}
          pane="vectorLayers"
        />
      )}

      {!loading && infraestructura && infraestructura.features.length > 0 && (
        <GeoJSON
          key={`iv-${infraestructura.features.length}`}
          data={infraestructura as any}
          style={lineStyle as any}
          onEachFeature={onEach as any}
          pane="vectorLayers"
        />
      )}

      {loading && (
        <div className="leaflet-top leaflet-center">
          <div className="leaflet-control leaflet-bar">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded px-3 py-2 text-sm">
              Cargando datos GeoJSON...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="leaflet-top leaflet-left">
          <div className="leaflet-control leaflet-bar">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded px-2 py-1 text-xs">{error}</div>
          </div>
        </div>
      )}
    </MapContainer>
  )
}

export default DynamicMapContent

