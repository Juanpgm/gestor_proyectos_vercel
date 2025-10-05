"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import * as L from 'leaflet';
import { 
  Layers, 
  Satellite, 
  Palette, 
  ChevronDown,
  Info,
  Eye
} from 'lucide-react';
import { type GeometryData, type AttributeData } from '@/services/unidades-proyecto.service';

// Configurar iconos de Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

// Props del componente
interface UnidadesProyectoMapSimpleProps {
  geometryData?: GeometryData | null;
  filteredData?: AttributeData[];
  className?: string;
}

// Tipos de coloración disponibles
type ColoringType = 
  | 'estado' 
  | 'tipo_intervencion' 
  | 'avance_obra' 
  | 'nombre_centro_gestor' 
  | 'presupuesto_base'
  | 'comuna_corregimiento'
  | 'barrio_vereda';

// Esquemas de colores
const COLOR_SCHEMES = {
  estados: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  avance: ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981'],
  presupuesto: ['#FEE2E2', '#FECACA', '#FCA5A5', '#F87171', '#EF4444', '#DC2626'],
  categorical: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1']
};

// Configuración de mapas base
const MAP_CONFIGS = {
  streets: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  },
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Componente de control de coloración
const ColoringControl: React.FC<{
  coloringType: ColoringType;
  onColoringChange: (type: ColoringType) => void;
  legend: Array<{ color: string; label: string; count?: number }>;
}> = ({ coloringType, onColoringChange, legend }) => {
  const [isOpen, setIsOpen] = useState(false);

  const coloringOptions: Array<{ value: ColoringType; label: string }> = [
    { value: 'estado', label: 'Estado' },
    { value: 'tipo_intervencion', label: 'Tipo de Intervención' },
    { value: 'avance_obra', label: 'Avance de Obra' },
    { value: 'nombre_centro_gestor', label: 'Centro Gestor' },
    { value: 'presupuesto_base', label: 'Presupuesto Base' },
    { value: 'comuna_corregimiento', label: 'Comuna/Corregimiento' },
    { value: 'barrio_vereda', label: 'Barrio/Vereda' }
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] space-y-2">
      {/* Control de coloración */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-2">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors w-full"
            >
              <Palette className="w-4 h-4" />
              <span>Colorear por</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10"
              >
                {coloringOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onColoringChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      coloringType === option.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Leyenda</span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {legend.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {item.label}
                {item.count !== undefined && ` (${item.count})`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente simple del mapa (ahora funcional con Leaflet)
const UnidadesProyectoMapSimple: React.FC<UnidadesProyectoMapSimpleProps> = ({
  geometryData = null,
  filteredData = [],
  className = ''
}) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isDark, setIsDark] = useState(false);
  const [coloringType, setColoringType] = useState<ColoringType>('estado');

  // Detectar tema
  React.useEffect(() => {
    const checkTheme = () => {
      const htmlElement = document.documentElement;
      setIsDark(htmlElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Generar esquema de colores y leyenda basado en el tipo de coloración
  const { colorMap, legend } = useMemo(() => {
    const data = filteredData;
    
    switch (coloringType) {
      case 'avance_obra': {
        const ranges = [
          { min: 0, max: 0.2, color: COLOR_SCHEMES.avance[0], label: '0-20%' },
          { min: 0.2, max: 0.4, color: COLOR_SCHEMES.avance[1], label: '20-40%' },
          { min: 0.4, max: 0.6, color: COLOR_SCHEMES.avance[2], label: '40-60%' },
          { min: 0.6, max: 0.8, color: COLOR_SCHEMES.avance[3], label: '60-80%' },
          { min: 0.8, max: 1, color: COLOR_SCHEMES.avance[4], label: '80-100%' }
        ];
        
        const colorMap = new Map<string, string>();
        data.forEach(item => {
          const avance = item.avance_obra || 0;
          const range = ranges.find(r => avance >= r.min && avance <= r.max) || ranges[0];
          colorMap.set(item.upid, range.color);
        });
        
        const legend = ranges.map(range => ({
          color: range.color,
          label: range.label,
          count: data.filter(item => {
            const avance = item.avance_obra || 0;
            return avance >= range.min && avance <= range.max;
          }).length
        }));
        
        return { colorMap, legend };
      }
      
      case 'presupuesto_base': {
        const amounts = data.map(item => item.presupuesto_base || 0).filter(x => x > 0).sort((a, b) => a - b);
        if (amounts.length === 0) {
          return { 
            colorMap: new Map<string, string>(), 
            legend: [{ color: '#6B7280', label: 'Sin datos' }] 
          };
        }
        
        const quartiles = [
          amounts[Math.floor(amounts.length * 0.25)],
          amounts[Math.floor(amounts.length * 0.5)],
          amounts[Math.floor(amounts.length * 0.75)]
        ];
        
        const ranges = [
          { min: 0, max: quartiles[0], color: COLOR_SCHEMES.presupuesto[0], label: `$0 - $${(quartiles[0]/1000000).toFixed(1)}M` },
          { min: quartiles[0], max: quartiles[1], color: COLOR_SCHEMES.presupuesto[2], label: `$${(quartiles[0]/1000000).toFixed(1)}M - $${(quartiles[1]/1000000).toFixed(1)}M` },
          { min: quartiles[1], max: quartiles[2], color: COLOR_SCHEMES.presupuesto[4], label: `$${(quartiles[1]/1000000).toFixed(1)}M - $${(quartiles[2]/1000000).toFixed(1)}M` },
          { min: quartiles[2], max: Infinity, color: COLOR_SCHEMES.presupuesto[5], label: `> $${(quartiles[2]/1000000).toFixed(1)}M` }
        ];
        
        const colorMap = new Map<string, string>();
        data.forEach(item => {
          const amount = item.presupuesto_base || 0;
          const range = ranges.find(r => amount >= r.min && amount < r.max) || ranges[0];
          colorMap.set(item.upid, range.color);
        });
        
        const legend = ranges.map(range => ({
          color: range.color,
          label: range.label,
          count: data.filter(item => {
            const amount = item.presupuesto_base || 0;
            return amount >= range.min && (range.max === Infinity ? true : amount < range.max);
          }).length
        }));
        
        return { colorMap, legend };
      }
      
      default: {
        // Para variables categóricas
        let field: keyof AttributeData;
        switch (coloringType) {
          case 'nombre_centro_gestor':
            field = 'nombre_centro_gestor';
            break;
          case 'estado':
            field = 'estado';
            break;
          case 'tipo_intervencion':
            field = 'tipo_intervencion';
            break;
          case 'comuna_corregimiento':
            field = 'comuna_corregimiento';
            break;
          case 'barrio_vereda':
            field = 'barrio_vereda';
            break;
          default:
            field = 'estado';
            break;
        }
        
        const uniqueValues = Array.from(new Set(data.map(item => String(item[field])).filter(Boolean)));
        
        const colorMap = new Map<string, string>();
        const valueCounts = new Map<string, number>();
        
        uniqueValues.forEach((value, index) => {
          const color = COLOR_SCHEMES.categorical[index % COLOR_SCHEMES.categorical.length];
          
          data
            .filter(item => String(item[field]) === value)
            .forEach(item => colorMap.set(item.upid, color));
          
          valueCounts.set(value, data.filter(item => String(item[field]) === value).length);
        });
        
        const legend = uniqueValues.slice(0, 20).map((value, index) => ({
          color: COLOR_SCHEMES.categorical[index % COLOR_SCHEMES.categorical.length],
          label: value.length > 25 ? `${value.substring(0, 25)}...` : value,
          count: valueCounts.get(value)
        }));
        
        return { colorMap, legend };
      }
    }
  }, [filteredData, coloringType]);

  // Función para obtener color de feature
  const getFeatureColor = (properties: any): string => {
    return colorMap.get(properties.upid) || '#6B7280';
  };

  // Función para obtener estilo de feature
  const getFeatureStyle = (feature: any) => {
    const color = getFeatureColor(feature.properties);
    
    return {
      color: color,
      weight: 3,
      opacity: 0.8,
      fillColor: color,
      fillOpacity: 0.4
    };
  };

  // Función específica para marcadores circulares
  const getCircleMarkerStyle = (feature: any): L.CircleMarkerOptions => {
    const color = getFeatureColor(feature.properties);
    
    return {
      color: '#ffffff',
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2,
      radius: 6
    };
  };

  // Obtener URL de tiles
  const getTileUrl = () => {
    if (mapType === 'satellite') {
      return MAP_CONFIGS.satellite;
    }
    return isDark ? MAP_CONFIGS.streets.dark : MAP_CONFIGS.streets.light;
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
    <div className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}>
      {/* Controles del mapa */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className={`p-2 rounded transition-colors ${
              mapType === 'satellite' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={mapType === 'streets' ? 'Vista satelital' : 'Vista de calles'}
          >
            {mapType === 'streets' ? <Satellite className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Control de coloración y leyenda */}
      <ColoringControl
        coloringType={coloringType}
        onColoringChange={setColoringType}
        legend={legend}
      />

      {/* Indicador de cantidad de elementos */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {filteredData.length} elementos ({geometryData?.features?.length || 0} con ubicación)
          </span>
        </div>
      </div>

      {/* Mapa de Leaflet */}
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

        {geometryData && geometryData.features && (
          <GeoJSON
            key={`${mapType}-${isDark}-${coloringType}-${geometryData.features.length}`}
            data={geometryData as any}
            style={getFeatureStyle}
            pointToLayer={(feature: any, latlng: any) => {
              const style = getCircleMarkerStyle(feature);
              return L.circleMarker(latlng, style);
            }}
            onEachFeature={(feature: any, layer: any) => {
              const attributeItem = filteredData.find(item => item.upid === feature.properties.upid);
              
              if (attributeItem) {
                const avanceDecimal = attributeItem.avance_obra || 0;
                const avance = Math.round(avanceDecimal * 100);
                
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
                  </div>
                `;
                
                layer.bindPopup(popupContent, {
                  maxWidth: 320,
                  className: 'custom-popup'
                });
              }
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default UnidadesProyectoMapSimple;