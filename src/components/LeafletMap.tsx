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
        weight: 1,
        radius: 3
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
      weight: 1,
      radius: 3
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
            const attributeItem = filteredData.find(item => item.upid === feature.properties.upid);
            const avance = Math.round(attributeItem?.avance_obra || 0);
            
            // Función para formatear valores monetarios
            const formatCurrency = (amount: number) => {
              if (!amount) return '0';
              if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}MM`;
              if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
              if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
              return amount.toLocaleString('es-CO');
            };

            const popupContent = document.createElement('div');
            
            // Estilos basados en el tema
            const bgGradient = isDark 
              ? 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
            
            const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            const textColor = isDark ? '#f9fafb' : '#1e293b';
            const labelColor = isDark ? '#9ca3af' : '#64748b';
            const cardBg = isDark ? '#374151' : '#f1f5f9';
            const cardBorder = isDark ? '#4b5563' : '#e2e8f0';
            
            popupContent.innerHTML = `
              <div style="
                min-width: 280px;
                background: ${bgGradient};
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                border: 1px solid ${borderColor};
                color: ${textColor};
              ">
                <!-- Header -->
                <div style="
                  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                  color: white;
                  padding: 12px 16px;
                  margin: -16px -16px 16px -16px;
                  border-radius: 12px 12px 0 0;
                  font-weight: 700;
                  font-size: 14px;
                  line-height: 1.4;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                ">
                  ${attributeItem?.nombre_up || feature.properties.upid}
                </div>
                
                <!-- UPID Badge -->
                <div style="margin-bottom: 16px;">
                  <span style="
                    background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  ">
                    ${feature.properties.upid}
                  </span>
                </div>
                
                ${attributeItem ? `
                  <!-- Avance Progress Bar -->
                  <div style="margin-bottom: 16px;">
                    <div style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 8px;
                    ">
                      <span style="
                        font-weight: 600;
                        color: ${labelColor};
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                      ">Avance de Obra</span>
                      <span style="
                        font-weight: 700;
                        color: ${avance >= 80 ? '#10b981' : avance >= 60 ? '#3b82f6' : avance >= 40 ? '#f59e0b' : avance >= 20 ? '#ef4444' : '#6b7280'};
                        font-size: 14px;
                      ">${avance}%</span>
                    </div>
                    <div style="
                      background: ${isDark ? '#374151' : '#e5e7eb'};
                      border-radius: 10px;
                      height: 8px;
                      overflow: hidden;
                      box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
                    ">
                      <div style="
                        background: ${avance >= 80 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 
                                    avance >= 60 ? 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' : 
                                    avance >= 40 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 
                                    avance >= 20 ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)'};
                        height: 100%;
                        width: ${Math.min(avance, 100)}%;
                        border-radius: 10px;
                        transition: width 0.3s ease;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                      "></div>
                    </div>
                  </div>
                  
                  <!-- Info Grid -->
                  <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                  ">
                    <div style="
                      background: ${cardBg};
                      padding: 8px 12px;
                      border-radius: 8px;
                      border-left: 3px solid #3b82f6;
                      border: 1px solid ${cardBorder};
                    ">
                      <div style="
                        font-size: 10px;
                        font-weight: 600;
                        color: ${labelColor};
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                      ">Estado</div>
                      <div style="
                        font-size: 12px;
                        font-weight: 600;
                        color: ${textColor};
                      ">${attributeItem.estado}</div>
                    </div>
                    
                    <div style="
                      background: ${cardBg};
                      padding: 8px 12px;
                      border-radius: 8px;
                      border-left: 3px solid #059669;
                      border: 1px solid ${cardBorder};
                    ">
                      <div style="
                        font-size: 10px;
                        font-weight: 600;
                        color: ${labelColor};
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 2px;
                      ">Tipo</div>
                      <div style="
                        font-size: 12px;
                        font-weight: 600;
                        color: ${textColor};
                        line-height: 1.2;
                      ">${attributeItem.tipo_intervencion}</div>
                    </div>
                  </div>
                  
                  <!-- Presupuesto -->
                  ${attributeItem.presupuesto_base ? `
                    <div style="
                      background: ${isDark ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'};
                      padding: 12px;
                      border-radius: 8px;
                      border: 1px solid ${isDark ? '#059669' : '#a7f3d0'};
                      margin-bottom: 12px;
                    ">
                      <div style="
                        font-size: 10px;
                        font-weight: 600;
                        color: ${isDark ? '#6ee7b7' : '#059669'};
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 4px;
                      ">Presupuesto Base</div>
                      <div style="
                        font-size: 16px;
                        font-weight: 700;
                        color: ${isDark ? '#d1fae5' : '#065f46'};
                        display: flex;
                        align-items: baseline;
                        gap: 4px;
                      ">
                        <span style="font-size: 12px;">$</span>
                        ${formatCurrency(attributeItem.presupuesto_base)}
                      </div>
                    </div>
                  ` : ''}
                  
                  <!-- Ubicación -->
                  <div style="
                    background: ${isDark ? 'linear-gradient(135deg, #92400e 0%, #b45309 100%)' : '#fefbea'};
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid ${isDark ? '#d97706' : '#fbbf24'};
                  ">
                    <div style="
                      font-size: 10px;
                      font-weight: 600;
                      color: ${isDark ? '#fcd34d' : '#d97706'};
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      margin-bottom: 4px;
                    ">Ubicación</div>
                    <div style="
                      font-size: 12px;
                      font-weight: 600;
                      color: ${isDark ? '#fef3c7' : '#92400e'};
                      margin-bottom: 2px;
                    ">${attributeItem.barrio_vereda || 'N/A'}</div>
                    <div style="
                      font-size: 11px;
                      color: ${isDark ? '#fed7aa' : '#a16207'};
                    ">${attributeItem.comuna_corregimiento || 'N/A'}</div>
                  </div>
                ` : `
                  <!-- Solo info básica para features sin datos de atributos -->
                  <div style="
                    background: ${cardBg};
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid ${cardBorder};
                    text-align: center;
                  ">
                    <div style="
                      font-size: 12px;
                      color: ${labelColor};
                      font-weight: 500;
                    ">
                      Tipo de geometría: <strong style="color: ${textColor};">${feature.geometry.type}</strong>
                    </div>
                  </div>
                `}
              </div>
            `;
            
            layer.bindPopup(popupContent, {
              maxWidth: 320,
              className: 'custom-popup'
            });
          }}
        />
      )}
    </MapContainer>
  );
};

export default LeafletMap;