"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { 
  Layers, 
  Satellite, 
  Palette, 
  ChevronDown,
  Info,
  Eye,
  EyeOff,
  Target,
  X
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
  focusedItem?: string | null; // UPID del elemento a enfocar
  showOnlyFocused?: boolean; // Si mostrar solo el elemento enfocado
  onItemClick?: (upid: string) => void; // Callback cuando se hace clic en un elemento
}

// Tipos de coloración disponibles
type ColoringType = 
  | 'estado' 
  | 'tipo_intervencion' 
  | 'tipo_equipamiento'
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

// Componente helper para manejar el enfoque del mapa
const MapFocusController: React.FC<{
  focusedItem: string | null;
  geometryData: GeometryData | null;
}> = ({ focusedItem, geometryData }) => {
  const map = useMap();

  useEffect(() => {
    if (focusedItem && geometryData?.features) {
      // Buscar el feature correspondiente al UPID enfocado
      const targetFeature = geometryData.features.find(
        feature => feature.properties?.upid === focusedItem
      );

      if (targetFeature) {
        const geomType = targetFeature.geometry.type;
        
        // Calcular centro de la geometría según su tipo
        let latLng: [number, number] | null = null;
        
        try {
          if (geomType === 'Point') {
            const coords = targetFeature.geometry.coordinates as [number, number];
            latLng = [coords[1], coords[0]]; // [lat, lng]
          } else if (geomType === 'LineString') {
            const coords = targetFeature.geometry.coordinates as [number, number][];
            // Calcular el punto medio de la línea
            const midIndex = Math.floor(coords.length / 2);
            latLng = [coords[midIndex][1], coords[midIndex][0]];
          } else if (geomType === 'Polygon') {
            const coords = targetFeature.geometry.coordinates as [number, number][][];
            // Calcular el centroide del polígono (primer anillo)
            const ring = coords[0];
            const latSum = ring.reduce((sum, coord) => sum + coord[1], 0);
            const lngSum = ring.reduce((sum, coord) => sum + coord[0], 0);
            latLng = [latSum / ring.length, lngSum / ring.length];
          } else if (geomType === 'MultiPoint') {
            const coords = targetFeature.geometry.coordinates as [number, number][];
            // Usar el primer punto
            if (coords.length > 0) {
              latLng = [coords[0][1], coords[0][0]];
            }
          } else if (geomType === 'MultiLineString') {
            const coords = targetFeature.geometry.coordinates as [number, number][][];
            // Usar el punto medio de la primera línea
            if (coords.length > 0 && coords[0].length > 0) {
              const midIndex = Math.floor(coords[0].length / 2);
              latLng = [coords[0][midIndex][1], coords[0][midIndex][0]];
            }
          } else if (geomType === 'MultiPolygon') {
            const coords = targetFeature.geometry.coordinates as [number, number][][][];
            // Usar el centroide del primer polígono
            if (coords.length > 0 && coords[0].length > 0) {
              const ring = coords[0][0];
              const latSum = ring.reduce((sum, coord) => sum + coord[1], 0);
              const lngSum = ring.reduce((sum, coord) => sum + coord[0], 0);
              latLng = [latSum / ring.length, lngSum / ring.length];
            }
          } else if (geomType === 'GeometryCollection') {
            // Para GeometryCollection, usar la primera geometría
            const geometries = (targetFeature.geometry as any).geometries;
            if (geometries && geometries.length > 0) {
              const firstGeom = geometries[0];
              if (firstGeom.type === 'Point') {
                latLng = [firstGeom.coordinates[1], firstGeom.coordinates[0]];
              } else if (firstGeom.type === 'LineString' && firstGeom.coordinates.length > 0) {
                const midIndex = Math.floor(firstGeom.coordinates.length / 2);
                latLng = [firstGeom.coordinates[midIndex][1], firstGeom.coordinates[midIndex][0]];
              }
            }
          }
        } catch (error) {
          console.warn('Error al calcular centro de geometría:', error);
        }
        
        // Enfocar en el elemento con zoom y animación
        if (latLng) {
          map.setView(latLng, 16, {
            animate: true,
            duration: 1
          });
        }
      }
    }
  }, [focusedItem, geometryData, map]);

  return null;
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
    { value: 'tipo_equipamiento', label: 'Tipo de Equipamiento' },
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">Leyenda</span>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {legend.map((item, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-tight break-words">
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
  className = '',
  focusedItem = null,
  showOnlyFocused = false,
  onItemClick
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

  // Filtrar datos según el item enfocado
  const displayData = useMemo(() => {
    if (showOnlyFocused && focusedItem) {
      return filteredData.filter(item => item.upid === focusedItem);
    }
    return filteredData;
  }, [filteredData, showOnlyFocused, focusedItem]);

  // Generar esquema de colores y leyenda basado en el tipo de coloración
  const { colorMap, legend } = useMemo(() => {
    const data = displayData;
    
    switch (coloringType) {
      case 'avance_obra': {
        const ranges = [
          { min: 0, max: 20, color: COLOR_SCHEMES.avance[0], label: '0-20%' },
          { min: 20, max: 40, color: COLOR_SCHEMES.avance[1], label: '20-40%' },
          { min: 40, max: 60, color: COLOR_SCHEMES.avance[2], label: '40-60%' },
          { min: 60, max: 80, color: COLOR_SCHEMES.avance[3], label: '60-80%' },
          { min: 80, max: 100, color: COLOR_SCHEMES.avance[4], label: '80-100%' }
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
          case 'tipo_equipamiento':
            field = 'tipo_equipamiento';
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
          label: value, // Mostrar texto completo sin truncar
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
    const isFocused = focusedItem === feature.properties?.upid;
    const isDimmed = showOnlyFocused && focusedItem && !isFocused;
    const geomType = feature.geometry?.type;
    
    // Estilos base según el tipo de geometría
    const baseStyle: any = {
      color: isFocused ? '#FF6B35' : color,
      fillColor: isFocused ? '#FF6B35' : color,
      opacity: isDimmed ? 0.2 : (isFocused ? 1 : 0.8),
      fillOpacity: isDimmed ? 0.1 : (isFocused ? 0.7 : 0.4)
    };
    
    // Ajustar peso según el tipo de geometría
    if (geomType === 'LineString' || geomType === 'MultiLineString') {
      // Líneas más gruesas para mejor visibilidad
      baseStyle.weight = isFocused ? 6 : 4;
      baseStyle.opacity = isDimmed ? 0.3 : (isFocused ? 1 : 0.9);
    } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      // Polígonos con borde visible
      baseStyle.weight = isFocused ? 4 : 2;
    } else if (geomType === 'GeometryCollection') {
      // GeometryCollection usa estilo por defecto
      baseStyle.weight = isFocused ? 4 : 3;
    } else {
      // Puntos y otros
      baseStyle.weight = isFocused ? 4 : 3;
    }
    
    return baseStyle;
  };

  // Función específica para marcadores circulares
  const getCircleMarkerStyle = (feature: any): L.CircleMarkerOptions => {
    const color = getFeatureColor(feature.properties);
    const isFocused = focusedItem === feature.properties?.upid;
    const isDimmed = showOnlyFocused && focusedItem && !isFocused;
    
    return {
      color: isFocused ? '#FF6B35' : '#ffffff',
      fillColor: isFocused ? '#FF6B35' : color,
      fillOpacity: isDimmed ? 0.2 : (isFocused ? 1 : 0.8),
      weight: isFocused ? 3 : 2,
      radius: isFocused ? 8 : 6
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

      {/* Controles de enfoque */}
      {focusedItem && (
        <div className="absolute top-4 right-4 z-[1000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Enfocado: {focusedItem}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onItemClick && onItemClick('')}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  title="Limpiar enfoque"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

        {/* Controlador de enfoque */}
        <MapFocusController 
          focusedItem={focusedItem} 
          geometryData={geometryData} 
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
                const avance = Math.round(attributeItem.avance_obra || 0);
                
                // Función para formatear valores monetarios
                const formatCurrency = (amount: number) => {
                  if (!amount) return '0';
                  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}MM`;
                  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
                  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
                  return amount.toLocaleString('es-CO');
                };

                // Función para calcular duración del proyecto
                const calculateProjectDuration = (fechaInicio: string, fechaFin: string) => {
                  if (!fechaInicio || !fechaFin) {
                    return {
                      duration: 'N/A',
                      status: 'sin-fecha',
                      dateRange: 'Fechas no disponibles'
                    };
                  }

                  try {
                    const startDate = new Date(fechaInicio);
                    const endDate = new Date(fechaFin);
                    const today = new Date();

                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                      return {
                        duration: 'Fecha inválida',
                        status: 'error',
                        dateRange: 'Formato de fecha incorrecto'
                      };
                    }

                    const diffTime = endDate.getTime() - startDate.getTime();
                    const daysTotal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const monthsTotal = Math.ceil(daysTotal / 30);

                    let status = 'planificado';
                    if (today >= startDate && today <= endDate) {
                      status = 'en-curso';
                    } else if (today > endDate) {
                      status = 'finalizado';
                    }

                    const formatDate = (date: Date) => {
                      return date.toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                    };

                    let duration = '';
                    if (monthsTotal > 12) {
                      const years = Math.floor(monthsTotal / 12);
                      const remainingMonths = monthsTotal % 12;
                      duration = `${years} año${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}` : ''}`;
                    } else if (monthsTotal >= 1) {
                      duration = `${monthsTotal} mes${monthsTotal > 1 ? 'es' : ''}`;
                    } else {
                      duration = `${daysTotal} día${daysTotal > 1 ? 's' : ''}`;
                    }

                    return {
                      duration,
                      status,
                      dateRange: `${formatDate(startDate)} - ${formatDate(endDate)}`
                    };
                  } catch (error) {
                    return {
                      duration: 'Error',
                      status: 'error',
                      dateRange: 'Error al calcular fechas'
                    };
                  }
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
                
                // Calcular duración del proyecto
                const projectDuration = calculateProjectDuration(attributeItem.fecha_inicio, attributeItem.fecha_fin);
                
                // Determinar colores del estado de duración
                const getDurationStatusColor = (status: string) => {
                  switch (status) {
                    case 'en-curso':
                      return isDark ? { bg: '#065f46', border: '#059669', text: '#6ee7b7' } : { bg: '#dcfce7', border: '#22c55e', text: '#15803d' };
                    case 'finalizado':
                      return isDark ? { bg: '#1e40af', border: '#2563eb', text: '#93c5fd' } : { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' };
                    case 'planificado':
                      return isDark ? { bg: '#92400e', border: '#d97706', text: '#fcd34d' } : { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' };
                    default:
                      return isDark ? { bg: '#374151', border: '#6b7280', text: '#d1d5db' } : { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
                  }
                };

                const durationColors = getDurationStatusColor(projectDuration.status);

                // Popup minimalista y elegante
                popupContent.innerHTML = `
                  <div style="
                    background: ${isDark ? '#1f2937' : '#ffffff'};
                    border-radius: 12px;
                    padding: 16px;
                    min-width: 320px;
                    max-width: 400px;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                    border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  ">
                    <!-- Header elegante -->
                    <div style="
                      border-bottom: 1px solid ${isDark ? '#374151' : '#f3f4f6'};
                      padding-bottom: 12px;
                      margin-bottom: 12px;
                    ">
                      <div style="
                        font-weight: 700;
                        font-size: 16px;
                        color: ${isDark ? '#ffffff' : '#1f2937'};
                        margin-bottom: 4px;
                        line-height: 1.3;
                      ">
                        ${attributeItem?.nombre_up || feature.properties.upid}
                      </div>
                      <div style="
                        font-size: 12px;
                        color: ${isDark ? '#9ca3af' : '#6b7280'};
                        font-weight: 500;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        line-height: 1.3;
                      ">
                        ${attributeItem.nombre_centro_gestor || 'Centro gestor no especificado'}
                      </div>
                    </div>
                    
                    <!-- Info badges -->
                    <div style="
                      display: flex;
                      gap: 8px;
                      margin-bottom: 12px;
                      flex-wrap: wrap;
                    ">
                      <span style="
                        background: ${isDark ? '#374151' : '#f3f4f6'};
                        color: ${isDark ? '#d1d5db' : '#374151'};
                        padding: 4px 10px;
                        border-radius: 16px;
                        font-weight: 600;
                        font-size: 11px;
                        font-family: 'Courier New', monospace;
                      ">${feature.properties.upid}</span>
                      <span style="
                        background: ${isDark ? '#1e40af' : '#dbeafe'};
                        color: ${isDark ? '#93c5fd' : '#1e40af'};
                        padding: 4px 10px;
                        border-radius: 16px;
                        font-weight: 600;
                        font-size: 11px;
                      ">${attributeItem.estado}</span>
                    </div>
                    
                    <!-- Avance con estilo -->
                    <div style="margin-bottom: 12px;">
                      <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 6px;
                      ">
                        <span style="
                          font-size: 12px;
                          color: ${isDark ? '#9ca3af' : '#6b7280'};
                          font-weight: 600;
                        ">Progreso del proyecto</span>
                        <span style="
                          font-size: 14px;
                          font-weight: 700;
                          color: ${avance >= 70 ? '#10b981' : avance >= 40 ? '#f59e0b' : '#ef4444'};
                        ">${avance}%</span>
                      </div>
                      <div style="
                        background: ${isDark ? '#374151' : '#f3f4f6'};
                        border-radius: 8px;
                        height: 6px;
                        overflow: hidden;
                      ">
                        <div style="
                          background: linear-gradient(90deg, ${avance >= 70 ? '#10b981, #059669' : avance >= 40 ? '#f59e0b, #d97706' : '#ef4444, #dc2626'});
                          height: 100%;
                          width: ${Math.min(avance, 100)}%;
                          border-radius: 8px;
                          transition: width 0.4s ease;
                        "></div>
                      </div>
                    </div>
                    
                    <!-- Información contextual -->
                    <div style="
                      display: grid;
                      gap: 8px;
                      font-size: 12px;
                      color: ${isDark ? '#9ca3af' : '#6b7280'};
                    ">
                      ${attributeItem.tipo_intervencion ? `
                        <div style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                        ">
                          <span style="opacity: 0.7;">🔧</span>
                          <span style="font-weight: 500; color: ${isDark ? '#d1d5db' : '#374151'};">
                            ${attributeItem.tipo_intervencion}
                          </span>
                        </div>
                      ` : ''}
                      ${attributeItem.tipo_equipamiento ? `
                        <div style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                        ">
                          <span style="opacity: 0.7;">🏢</span>
                          <span style="font-weight: 500; color: ${isDark ? '#d1d5db' : '#374151'};">
                            ${attributeItem.tipo_equipamiento}
                          </span>
                        </div>
                      ` : ''}
                      <div style="
                        display: flex;
                        align-items: center;
                        gap: 6px;
                      ">
                        <span style="opacity: 0.7;">📍</span>
                        <div>
                          <div style="font-weight: 500; color: ${isDark ? '#d1d5db' : '#374151'};">
                            ${attributeItem.barrio_vereda || 'Barrio no especificado'}
                          </div>
                          <div style="font-size: 11px; opacity: 0.8;">
                            ${attributeItem.comuna_corregimiento || 'Comuna no especificada'}
                          </div>
                        </div>
                      </div>
                      ${attributeItem.presupuesto_base ? `
                        <div style="
                          display: flex;
                          align-items: center;
                          gap: 6px;
                        ">
                          <span style="opacity: 0.7;">💰</span>
                          <span style="font-weight: 600; color: ${isDark ? '#d1d5db' : '#374151'};">
                            $${formatCurrency(attributeItem.presupuesto_base)}
                          </span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `;
                
                layer.bindPopup(popupContent, {
                  maxWidth: 400,
                  className: 'custom-popup',
                  zIndexOffset: 10000
                });

                // Añadir click handler para enfocar el elemento
                layer.on('click', () => {
                  if (onItemClick && attributeItem) {
                    onItemClick(attributeItem.upid);
                  }
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