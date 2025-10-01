'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configurar iconos de Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

interface LeafletMapProps {
  geometryData: any;
  filteredData: any[];
  mapType: 'streets' | 'satellite';
  isDark: boolean;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  geometryData, 
  filteredData, 
  mapType, 
  isDark 
}) => {
  // Función para obtener color según avance de obra
  const getFeatureColor = (properties: any) => {
    const attributeItem = filteredData.find(item => item.upid === properties.upid);
    const avance = attributeItem?.avance_obra || properties.avance_obra || 0;
    
    if (avance >= 80) return '#10B981'; // Verde
    if (avance >= 60) return '#F59E0B'; // Amarillo
    if (avance >= 40) return '#F97316'; // Naranja
    if (avance >= 20) return '#EF4444'; // Rojo
    return '#6B7280'; // Gris
  };

  // Función para obtener el estilo de cada feature
  const getFeatureStyle = (feature: any) => {
    const color = getFeatureColor(feature.properties);
    
    if (feature.geometry.type === 'Point') {
      return {
        color: '#ffffff',
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2,
        radius: 8
      };
    } else {
      return {
        color: color,
        weight: 3,
        opacity: 0.8,
        fillColor: color,
        fillOpacity: 0.3
      };
    }
  };

  // Función para obtener el estilo específico para circleMarker
  const getCircleMarkerStyle = (feature: any): L.CircleMarkerOptions => {
    const color = getFeatureColor(feature.properties);
    return {
      color: '#ffffff',
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2,
      radius: 8
    };
  };

  // URLs de tiles según el tema y tipo de mapa
  const getTileUrl = () => {
    if (mapType === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    
    if (isDark) {
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
    
    return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  const getTileAttribution = () => {
    if (mapType === 'satellite') {
      return '&copy; <a href="https://www.esri.com/">Esri</a>';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  };

  // Coordenadas por defecto (Cali, Colombia)
  const defaultCenter: [number, number] = [3.4516, -76.5320];
  const defaultZoom = 11;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        url={getTileUrl()}
        attribution={getTileAttribution()}
      />

      {/* Renderizar datos de geometry como GeoJSON */}
      {geometryData && geometryData.features && (
        <GeoJSON
          key={`${mapType}-${isDark}-${geometryData.features.length}`}
          data={geometryData}
          style={getFeatureStyle}
          pointToLayer={(feature: any, latlng: any) => {
            return L.circleMarker(latlng, getCircleMarkerStyle(feature));
          }}
          onEachFeature={(feature: any, layer: any) => {
            const popupContent = document.createElement('div');
            popupContent.innerHTML = `
              <div class="p-2 min-w-[200px]">
                <div class="font-bold text-sm mb-2 text-gray-900">
                  ${filteredData.find(item => item.upid === feature.properties.upid)?.nombre_up || feature.properties.upid}
                </div>
                
                <div class="space-y-1 text-xs">
                  <div>
                    <span class="font-medium text-gray-700">UPID:</span>
                    <span class="ml-1 font-mono text-gray-600">${feature.properties.upid}</span>
                  </div>
                  
                  ${filteredData.find(item => item.upid === feature.properties.upid) ? `
                    <div>
                      <span class="font-medium text-gray-700">Avance:</span>
                      <span class="ml-1 text-gray-600">${filteredData.find(item => item.upid === feature.properties.upid)?.avance_obra}%</span>
                    </div>
                    
                    <div>
                      <span class="font-medium text-gray-700">Estado:</span>
                      <span class="ml-1 text-gray-600">${filteredData.find(item => item.upid === feature.properties.upid)?.estado}</span>
                    </div>
                    
                    <div>
                      <span class="font-medium text-gray-700">Tipo:</span>
                      <span class="ml-1 text-gray-600">${filteredData.find(item => item.upid === feature.properties.upid)?.tipo_intervencion}</span>
                    </div>
                    
                    <div>
                      <span class="font-medium text-gray-700">Centro:</span>
                      <span class="ml-1 text-gray-600">${filteredData.find(item => item.upid === feature.properties.upid)?.nombre_centro_gestor}</span>
                    </div>
                    
                    ${filteredData.find(item => item.upid === feature.properties.upid)?.presupuesto_base ? `
                      <div>
                        <span class="font-medium text-gray-700">Presupuesto:</span>
                        <span class="ml-1 text-gray-600">
                          $${filteredData.find(item => item.upid === feature.properties.upid)?.presupuesto_base?.toLocaleString('es-CO')}
                        </span>
                      </div>
                    ` : ''}
                  ` : ''}
                  
                  <div>
                    <span class="font-medium text-gray-700">Tipo Geom:</span>
                    <span class="ml-1 text-gray-600">${feature.geometry.type}</span>
                  </div>
                </div>
              </div>
            `;
            layer.bindPopup(popupContent);
          }}
        />
      )}
    </MapContainer>
  );
};

export default LeafletMap;