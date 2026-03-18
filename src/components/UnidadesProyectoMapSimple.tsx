"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON, useMap, Marker } from 'react-leaflet';
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
  X,
  Map as MapIcon
} from 'lucide-react';
import { type GeometryData, type AttributeData } from '@/services/unidades-proyecto.service';
import MapMeasureTool from './MapMeasureTool';

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
  | 'frente_activo'
  | 'avance_obra' 
  | 'nombre_centro_gestor' 
  | 'presupuesto_base'
  | 'fuente_financiacion'
  | 'comuna_corregimiento'
  | 'barrio_vereda';

// Tipo para capas base
type BaseLayerType = 'none' | 'comunas' | 'barrios' | 'pulmon';

// Tipo para el modo de color de capas base
type BaseLayerColorMode = 'monotone' | 'multitone-vibrant' | 'multitone-pastel' | 'multitone-earth';

// Colores disponibles para modo monotono
const MONOTONE_COLORS = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Naranja' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Cian' },
];

// Colores para diferentes modos multitono
const MULTITONE_VIBRANT = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];
const MULTITONE_PASTEL = ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD', '#67E8F9', '#BEF264', '#FDBA74', '#F9A8D4', '#A5B4FC'];
const MULTITONE_EARTH = ['#92400E', '#065F46', '#1E40AF', '#701A75', '#78350F', '#064E3B', '#1E3A8A', '#581C87', '#7C2D12', '#134E4A'];

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

// Componente para añadir etiquetas de texto a las capas base
const BaseLayerLabels: React.FC<{
  data: any;
  layerType: 'comunas' | 'barrios';
}> = ({ data, layerType }) => {
  if (!data || !data.features) return null;

  // Calcular el centroide de cada polígono para posicionar la etiqueta
  const labels = data.features.map((feature: any, index: number) => {
    const properties = feature.properties;
    const name = properties?.NOMBRE || properties?.nombre || properties?.name || '';
    
    if (!name) return null;

    // Calcular centroide
    let lat = 0, lng = 0;
    try {
      const geomType = feature.geometry?.type;
      
      if (geomType === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        const lngSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        lat = latSum / coords.length;
        lng = lngSum / coords.length;
      } else if (geomType === 'MultiPolygon') {
        const coords = feature.geometry.coordinates[0][0];
        const latSum = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
        const lngSum = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
        lat = latSum / coords.length;
        lng = lngSum / coords.length;
      }
    } catch (error) {
      console.warn('Error calculando centroide:', error);
      return null;
    }

    if (lat === 0 && lng === 0) return null;

    // Crear icono de texto
    const textIcon = L.divIcon({
      className: 'base-layer-label',
      html: `<div style="
        position: absolute;
        transform: translate(-50%, -50%);
        font-size: 11px;
        font-weight: 700;
        color: #1f2937;
        background-color: rgba(255, 255, 255, 0.85);
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid rgba(55, 65, 81, 0.3);
        white-space: nowrap;
        pointer-events: none;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      ">${name}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    return (
      <Marker
        key={`label-${layerType}-${index}`}
        position={[lat, lng]}
        icon={textIcon}
        interactive={false}
      />
    );
  }).filter(Boolean);

  return <>{labels}</>;
};

// Configuración de mapas base
const MAP_CONFIGS = {
  streets: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  },
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};

// Componente de control de capas base
const BaseLayerControl: React.FC<{
  activeLayer: BaseLayerType;
  onLayerChange: (layer: BaseLayerType) => void;
  colorMode: BaseLayerColorMode;
  onColorModeChange: (mode: BaseLayerColorMode) => void;
  monotoneColor: string;
  onMonotoneColorChange: (color: string) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
}> = ({ activeLayer, onLayerChange, colorMode, onColorModeChange, monotoneColor, onMonotoneColorChange, showLabels, onShowLabelsChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Botón colapsable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 px-3 py-2 w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Capas de referencia"
        >
          <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {activeLayer === 'none' ? 'Capas Base' : activeLayer === 'comunas' ? 'Comunas' : activeLayer === 'barrios' ? 'Barrios' : 'Pulmón de Oriente'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Panel expandible */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 overflow-y-auto max-h-72"
          >
            <div className="space-y-3">
              {/* Selección de capa */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Capa</div>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="baseLayer"
                    value="none"
                    checked={activeLayer === 'none'}
                    onChange={() => onLayerChange('none')}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Ninguna
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="baseLayer"
                    value="comunas"
                    checked={activeLayer === 'comunas'}
                    onChange={() => onLayerChange('comunas')}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Comunas y Corregimientos
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="baseLayer"
                    value="barrios"
                    checked={activeLayer === 'barrios'}
                    onChange={() => onLayerChange('barrios')}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Barrios y Veredas
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="baseLayer"
                    value="pulmon"
                    checked={activeLayer === 'pulmon'}
                    onChange={() => onLayerChange('pulmon')}
                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Pulmón de Oriente
                  </span>
                </label>
              </div>

              {/* Opciones de color (solo si hay una capa activa) */}
              {activeLayer !== 'none' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Modo de color</div>
                    <div className="space-y-1.5">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="colorMode"
                          value="monotone"
                          checked={colorMode === 'monotone'}
                          onChange={() => onColorModeChange('monotone')}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          Monotono
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="colorMode"
                          value="multitone-vibrant"
                          checked={colorMode === 'multitone-vibrant'}
                          onChange={() => onColorModeChange('multitone-vibrant')}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          Multitono Vibrante
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="colorMode"
                          value="multitone-pastel"
                          checked={colorMode === 'multitone-pastel'}
                          onChange={() => onColorModeChange('multitone-pastel')}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          Multitono Pastel
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="radio"
                          name="colorMode"
                          value="multitone-earth"
                          checked={colorMode === 'multitone-earth'}
                          onChange={() => onColorModeChange('multitone-earth')}
                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                          Multitono Tierra
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Selector de color (solo en modo monotono) */}
                  {colorMode === 'monotone' && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Color</div>
                      <div className="flex flex-wrap gap-1.5">
                        {MONOTONE_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => onMonotoneColorChange(color.value)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              monotoneColor === color.value
                                ? 'border-gray-900 dark:border-white scale-110'
                                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Toggle para mostrar etiquetas (solo si hay una capa activa) */}
              {activeLayer !== 'none' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => onShowLabelsChange(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      Mostrar etiquetas
                    </span>
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Componente de control de coloración
const ColoringControl: React.FC<{
  coloringType: ColoringType;
  onColoringChange: (type: ColoringType) => void;
  legend: Array<{ color: string; label: string; count?: number }>;
  availableData: AttributeData[]; // Datos disponibles para determinar opciones
}> = ({ coloringType, onColoringChange, legend, availableData }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generar opciones dinámicamente basadas en valores únicos de los datos
  const coloringOptions = useMemo(() => {
    // Función helper para extraer valores únicos
    const hasUniqueValues = (field: keyof AttributeData): boolean => {
      const uniqueValues = new Set(
        availableData
          .map(item => item[field])
          .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
      );
      return uniqueValues.size > 0;
    };

    const options: Array<{ value: ColoringType; label: string }> = [];

    // Siempre incluir estas opciones base si tienen datos
    if (hasUniqueValues('estado')) {
      options.push({ value: 'estado', label: 'Estado' });
    }
    if (hasUniqueValues('tipo_intervencion')) {
      options.push({ value: 'tipo_intervencion', label: 'Tipo de Intervención' });
    }
    if (hasUniqueValues('tipo_equipamiento')) {
      options.push({ value: 'tipo_equipamiento', label: 'Tipo de Equipamiento' });
    }
    if (hasUniqueValues('frente_activo')) {
      options.push({ value: 'frente_activo', label: 'Frente Activo' });
    }
    if (hasUniqueValues('avance_obra')) {
      options.push({ value: 'avance_obra', label: 'Avance de Obra' });
    }
    if (hasUniqueValues('nombre_centro_gestor')) {
      options.push({ value: 'nombre_centro_gestor', label: 'Centro Gestor' });
    }
    if (hasUniqueValues('presupuesto_base')) {
      options.push({ value: 'presupuesto_base', label: 'Presupuesto Base' });
    }
    if (hasUniqueValues('fuente_financiacion')) {
      options.push({ value: 'fuente_financiacion', label: 'Fuente de Financiación' });
    }
    if (hasUniqueValues('comuna_corregimiento')) {
      options.push({ value: 'comuna_corregimiento', label: 'Comuna/Corregimiento' });
    }
    if (hasUniqueValues('barrio_vereda')) {
      options.push({ value: 'barrio_vereda', label: 'Barrio/Vereda' });
    }

    return options;
  }, [availableData]);

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
  // Log para verificar datos recibidos
  useEffect(() => {
    const validGeometries = geometryData?.features?.filter(f => 
      f.properties.has_valid_geometry !== false &&
      f.geometry?.coordinates &&
      !(f.geometry.coordinates[0] === 0 && f.geometry.coordinates[1] === 0)
    ).length || 0;
    
    console.log('🗺️ UnidadesProyectoMapSimple: Received data:', {
      geometryFeatures: geometryData?.features?.length || 0,
      validGeometries,
      filteredDataItems: filteredData.length,
      hasGeometry: !!geometryData,
      hasFocusedItem: !!focusedItem,
      showOnlyFocused
    });
    
    if (geometryData && geometryData.features) {
      if (geometryData.features.length === 0) {
        console.warn('⚠️ Map has 0 features to display!');
      } else if (validGeometries === 0) {
        console.warn('⚠️ All features have invalid coordinates [0,0] - cannot display on map!');
      }
    }
  }, [geometryData, filteredData, focusedItem, showOnlyFocused]);
  
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isDark, setIsDark] = useState(false);
  const [coloringType, setColoringType] = useState<ColoringType>('estado');
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('none');
  const [baseLayerColorMode, setBaseLayerColorMode] = useState<BaseLayerColorMode>('monotone');
  const [baseLayerMonotoneColor, setBaseLayerMonotoneColor] = useState<string>('#3B82F6');
  const [showBaseLayerLabels, setShowBaseLayerLabels] = useState<boolean>(true);
  const [comunasData, setComunasData] = useState<any>(null);
  const [barriosData, setBarriosData] = useState<any>(null);
  const [pulmonData, setPulmonData] = useState<any>(null);

  // Cargar archivos GeoJSON de capas base
  useEffect(() => {
    const loadBaseLayerData = async () => {
      try {
        const [comunasResponse, barriosResponse, pulmonResponse] = await Promise.all([
          fetch('/data/geodata/cartografia_base/comunas_corregimientos.geojson'),
          fetch('/data/geodata/cartografia_base/barrios_veredas.geojson'),
          fetch('/data/geodata/cartografia_base/PoligonoPropuestoPulmonDeOriente.geojson')
        ]);
        
        if (comunasResponse.ok) {
          const comunasJson = await comunasResponse.json();
          setComunasData(comunasJson);
        }
        
        if (barriosResponse.ok) {
          const barriosJson = await barriosResponse.json();
          setBarriosData(barriosJson);
        }

        if (pulmonResponse.ok) {
          const pulmonJson = await pulmonResponse.json();
          setPulmonData(pulmonJson);
        }
      } catch (error) {
        console.error('Error al cargar capas base:', error);
      }
    };

    loadBaseLayerData();
  }, []);

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

  // Estilo para capas base (semitransparente, sin relleno)
  const baseLayerStyle = {
    color: '#3B82F6',
    weight: 1.5,
    opacity: 0.6,
    fillOpacity: 0,
    fillColor: 'transparent'
  };

  // Función para obtener el estilo de las capas base según la configuración
  const getBaseLayerStyle = (feature: any) => {
    if (baseLayerColorMode === 'monotone') {
      return {
        color: baseLayerMonotoneColor,
        weight: 1.5,
        opacity: 0.5,
        fillColor: baseLayerMonotoneColor,
        fillOpacity: 0.08
      };
    } else {
      // Seleccionar la paleta según el modo
      let colorPalette: string[];
      switch (baseLayerColorMode) {
        case 'multitone-vibrant':
          colorPalette = MULTITONE_VIBRANT;
          break;
        case 'multitone-pastel':
          colorPalette = MULTITONE_PASTEL;
          break;
        case 'multitone-earth':
          colorPalette = MULTITONE_EARTH;
          break;
        default:
          colorPalette = MULTITONE_VIBRANT;
      }
      
      // Generar un índice basado en el ID y nombre del feature para tener colores consistentes
      // Usar múltiples propiedades para maximizar la variación de colores
      const featureId = feature.id || '';
      const featureName = feature.properties?.NOMBRE || feature.properties?.nombre || feature.properties?.name || '';
      const featureCode = feature.properties?.CODIGO || feature.properties?.codigo || feature.properties?.code || '';
      
      // Crear una cadena única combinando todas las propiedades disponibles
      const uniqueString = `${featureId}-${featureName}-${featureCode}`;
      
      // Función de hash mejorada (DJB2)
      let hash = 5381;
      for (let i = 0; i < uniqueString.length; i++) {
        hash = ((hash << 5) + hash) + uniqueString.charCodeAt(i);
      }
      
      const colorIndex = Math.abs(hash) % colorPalette.length;
      const color = colorPalette[colorIndex];
      
      return {
        color: color,
        weight: 1.5,
        opacity: 0.5,
        fillColor: color,
        fillOpacity: 0.08
      };
    }
  };

  // Helper para normalizar UPIDs para comparación case-insensitive
  const normalizeUpid = (upid: string | null | undefined): string => {
    if (!upid) return '';
    return String(upid).trim().toLowerCase();
  };

  // Filtrar datos según el item enfocado
  const displayData = useMemo(() => {
    if (showOnlyFocused && focusedItem) {
      const normalizedFocused = normalizeUpid(focusedItem);
      return filteredData.filter(item => normalizeUpid(item.upid) === normalizedFocused);
    }
    return filteredData;
  }, [filteredData, showOnlyFocused, focusedItem]);

  // Consolidar datos por UPID para coloración (tipo, avance, centro, inversión)
  const consolidatedColorData = useMemo(() => {
    const grouped = new Map<string, AttributeData[]>();

    displayData.forEach(item => {
      const key = normalizeUpid(item.upid);
      if (!key) return;
      const bucket = grouped.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        grouped.set(key, [item]);
      }
    });

    return Array.from(grouped.values()).map(group => {
      const base = group[0];
      const estados = new Set(group.map(i => i.estado).filter(Boolean));
      const tipos = new Set(group.map(i => i.tipo_intervencion).filter(Boolean));
      const centros = new Set(group.map(i => i.nombre_centro_gestor).filter(Boolean));
      const fuentes = new Set(group.map(i => i.fuente_financiacion).filter(Boolean));
      const avances = group
        .map(i => i.avance_obra)
        .filter((val): val is number => typeof val === 'number' && !Number.isNaN(val));
      const presupuestos = group
        .map(i => i.presupuesto_base)
        .filter((val): val is number => typeof val === 'number' && !Number.isNaN(val));

      const estadoConsolidado = estados.size === 1
        ? Array.from(estados)[0]!
        : (estados.size > 1 ? 'Varios estados' : '-');

      const tipoConsolidado = tipos.size === 1
        ? Array.from(tipos)[0]!
        : (tipos.size > 1 ? 'Varios tipos' : '-');

      const centroConsolidado = centros.size === 1
        ? Array.from(centros)[0]!
        : (centros.size > 1 ? 'Intervenido por varios organismos' : '-');

      const fuenteConsolidada = fuentes.size === 1
        ? Array.from(fuentes)[0]!
        : (fuentes.size > 1 ? 'Varias fuentes' : '-');

      const avancePromedio = avances.length > 0
        ? avances.reduce((sum, val) => sum + val, 0) / avances.length
        : 0;

      const presupuestoTotal = presupuestos.length > 0
        ? presupuestos.reduce((sum, val) => sum + val, 0)
        : 0;

      return {
        ...base,
        estado: estadoConsolidado,
        tipo_intervencion: tipoConsolidado,
        nombre_centro_gestor: centroConsolidado,
        fuente_financiacion: fuenteConsolidada,
        avance_obra: avancePromedio,
        presupuesto_base: presupuestoTotal
      };
    });
  }, [displayData]);

  // Generar esquema de colores y leyenda basado en el tipo de coloración
  const { colorMap, legend } = useMemo(() => {
    const data = consolidatedColorData;
    
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
          colorMap.set(normalizeUpid(item.upid), range.color);
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
          colorMap.set(normalizeUpid(item.upid), range.color);
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
        const isEstadoColoring = coloringType === 'estado';
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
          case 'frente_activo':
            field = 'frente_activo';
            break;
          case 'fuente_financiacion':
            field = 'fuente_financiacion';
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
        
        const normalizeEstadoValue = (value: string): string =>
          value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        const normalizeFrenteActivoValue = (value: string): string => {
          const normalized = normalizeEstadoValue(value);
          if (!normalized) return 'No aplica';
          if (normalized.includes('terminad') || normalized.includes('finaliz') || normalized.includes('complet')) {
            return 'No aplica';
          }
          if (normalized.includes('frente activo') || normalized === 'activo') {
            return 'Frente activo';
          }
          if (normalized.includes('no aplica')) {
            return 'No aplica';
          }
          return value;
        };

        const normalizeCategoricalValue = (value: string): string => {
          if (field === 'frente_activo') {
            return normalizeFrenteActivoValue(value);
          }
          return value;
        };

        const uniqueValues = Array.from(new Set(
          data
            .map(item => normalizeCategoricalValue(String(item[field] || '')))
            .filter(Boolean)
        ));

        const isEstadoSinDato = (value: string): boolean => {
          const normalized = normalizeEstadoValue(value);
          return normalized === '-' || normalized.includes('sin estado') || normalized.includes('sin dato') || normalized.includes('n/a');
        };

        const getEstadoColor = (value: string): string => {
          const normalized = normalizeEstadoValue(value);
          if (!normalized || isEstadoSinDato(value)) {
            return '#6B7280';
          }
          if (normalized.includes('varios')) return '#6B7280';
          if (normalized.includes('terminad') || normalized.includes('finaliz') || normalized.includes('complet')) return '#10B981';
          if (normalized.includes('ejecucion') || normalized.includes('en curso') || normalized.includes('activo')) return '#3B82F6';
          if (normalized.includes('alist') || normalized.includes('planific') || normalized.includes('program')) return '#F59E0B';
          if (normalized.includes('suspend') || normalized.includes('cancel') || normalized.includes('deten') || normalized.includes('paraliz')) return '#EF4444';
          return '#8B5CF6';
        };

        const getEstadoLabel = (value: string): string => {
          if (isEstadoSinDato(value)) return 'Sin datos';
          return value;
        };
        
        const colorMap = new Map<string, string>();
        const valueCounts = new Map<string, number>();
        
        uniqueValues.forEach((value, index) => {
          const color = isEstadoColoring
            ? getEstadoColor(value)
            : COLOR_SCHEMES.categorical[index % COLOR_SCHEMES.categorical.length];
          
          data
            .filter(item => normalizeCategoricalValue(String(item[field] || '')) === value)
            .forEach(item => colorMap.set(normalizeUpid(item.upid), color));
          
          valueCounts.set(
            value,
            data.filter(item => normalizeCategoricalValue(String(item[field] || '')) === value).length
          );
        });

        const orderedValues = isEstadoColoring
          ? uniqueValues.sort((a, b) => {
              const aNorm = normalizeEstadoValue(a);
              const bNorm = normalizeEstadoValue(b);
              const aIsOther = aNorm.includes('varios') || isEstadoSinDato(a);
              const bIsOther = bNorm.includes('varios') || isEstadoSinDato(b);
              if (aIsOther && !bIsOther) return 1;
              if (!aIsOther && bIsOther) return -1;
              return a.localeCompare(b, 'es');
            })
          : uniqueValues;
        
        const legend = orderedValues.slice(0, 20).map((value, index) => ({
          color: isEstadoColoring
            ? getEstadoColor(value)
            : COLOR_SCHEMES.categorical[index % COLOR_SCHEMES.categorical.length],
          label: isEstadoColoring ? getEstadoLabel(value) : value, // Mostrar texto completo sin truncar
          count: valueCounts.get(value)
        }));
        
        return { colorMap, legend };
      }
    }
  }, [consolidatedColorData, coloringType]);

  // Función para obtener color de feature
  const getFeatureColor = (properties: any): string => {
    return colorMap.get(normalizeUpid(properties.upid)) || '#6B7280';
  };

  // Función para obtener estilo de feature
  const getFeatureStyle = (feature: any) => {
    const color = getFeatureColor(feature.properties);
    const isFocused = normalizeUpid(focusedItem) === normalizeUpid(feature.properties?.upid);
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
    const isFocused = normalizeUpid(focusedItem) === normalizeUpid(feature.properties?.upid);
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

  // Función para validar si una geometría tiene coordenadas válidas
  const hasValidCoordinates = (geometry: any): boolean => {
    if (!geometry || !geometry.coordinates) return false;
    
    const geomType = geometry.type;
    const coords = geometry.coordinates;
    
    try {
      switch (geomType) {
        case 'Point':
          // Point: [lng, lat]
          return Array.isArray(coords) && coords.length >= 2 &&
            typeof coords[0] === 'number' && typeof coords[1] === 'number' &&
            !(coords[0] === 0 && coords[1] === 0);
        
        case 'LineString':
        case 'MultiPoint':
          // LineString/MultiPoint: [[lng, lat], ...]
          return Array.isArray(coords) && coords.length > 0 &&
            coords.some((c: any) => Array.isArray(c) && c.length >= 2 &&
              typeof c[0] === 'number' && typeof c[1] === 'number');
        
        case 'Polygon':
        case 'MultiLineString':
          // Polygon/MultiLineString: [[[lng, lat], ...], ...]
          return Array.isArray(coords) && coords.length > 0 &&
            coords.some((ring: any) => Array.isArray(ring) && ring.length > 0 &&
              ring.some((c: any) => Array.isArray(c) && c.length >= 2 &&
                typeof c[0] === 'number' && typeof c[1] === 'number'));
        
        case 'MultiPolygon':
          // MultiPolygon: [[[[lng, lat], ...], ...], ...]
          return Array.isArray(coords) && coords.length > 0 &&
            coords.some((poly: any) => Array.isArray(poly) && poly.length > 0 &&
              poly.some((ring: any) => Array.isArray(ring) && ring.length > 0 &&
                ring.some((c: any) => Array.isArray(c) && c.length >= 2 &&
                  typeof c[0] === 'number' && typeof c[1] === 'number')));
        
        case 'GeometryCollection':
          // GeometryCollection: { geometries: [...] }
          const geometries = (geometry as any).geometries;
          return Array.isArray(geometries) && geometries.length > 0 &&
            geometries.some((g: any) => hasValidCoordinates(g));
        
        default:
          // Para tipos desconocidos, asumir válido si tiene coordenadas
          return coords != null;
      }
    } catch (error) {
      console.warn('Error validating geometry coordinates:', error);
      return false;
    }
  };

  // Verificar si hay features con geometrías válidas
  const validFeatures = geometryData?.features?.filter(f => 
    f.properties.has_valid_geometry !== false &&
    f.geometry &&
    hasValidCoordinates(f.geometry)
  ) || [];
  
  const hasValidGeometries = validFeatures.length > 0;
  const totalFeatures = geometryData?.features?.length || 0;

  return (
    <div className={`relative w-full h-full rounded-lg overflow-hidden ${className}`}>
      {/* Alerta cuando no hay geometrías válidas */}
      {totalFeatures > 0 && !hasValidGeometries && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1001] max-w-md">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200 font-medium">
                  Sin coordenadas geográficas
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  {totalFeatures} {totalFeatures === 1 ? 'registro encontrado' : 'registros encontrados'} pero sin ubicación en el mapa. 
                  Verifica la tabla para ver los datos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        availableData={consolidatedColorData}
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

      {/* Control de capas base */}
      <BaseLayerControl
        activeLayer={baseLayer}
        onLayerChange={setBaseLayer}
        colorMode={baseLayerColorMode}
        onColorModeChange={setBaseLayerColorMode}
        monotoneColor={baseLayerMonotoneColor}
        onMonotoneColorChange={setBaseLayerMonotoneColor}
        showLabels={showBaseLayerLabels}
        onShowLabelsChange={setShowBaseLayerLabels}
      />

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

        {/* Capas base - se renderizan primero para quedar por debajo */}
        {baseLayer === 'comunas' && comunasData && (
          <>
            <GeoJSON
              key={`comunas-${mapType}-${isDark}-${baseLayerColorMode}-${baseLayerMonotoneColor}`}
              data={comunasData}
              style={getBaseLayerStyle}
              pane="tilePane"
            />
            {showBaseLayerLabels && <BaseLayerLabels data={comunasData} layerType="comunas" />}
          </>
        )}

        {baseLayer === 'barrios' && barriosData && (
          <>
            <GeoJSON
              key={`barrios-${mapType}-${isDark}-${baseLayerColorMode}-${baseLayerMonotoneColor}`}
              data={barriosData}
              style={getBaseLayerStyle}
              pane="tilePane"
            />
            {showBaseLayerLabels && <BaseLayerLabels data={barriosData} layerType="barrios" />}
          </>
        )}

        {baseLayer === 'pulmon' && pulmonData && (
          <GeoJSON
            key={`pulmon-${mapType}-${isDark}-${baseLayerColorMode}-${baseLayerMonotoneColor}`}
            data={pulmonData}
            style={getBaseLayerStyle}
            pane="tilePane"
          />
        )}

        {/* Geometrías de la API - se renderizan después para quedar por encima */}
        {geometryData && geometryData.features && (() => {
          console.log('🎨 Rendering GeoJSON layer with', geometryData.features.length, 'features');
          return true;
        })() && (
          <GeoJSON
            key={`${mapType}-${isDark}-${coloringType}-${geometryData.features.length}`}
            data={geometryData as any}
            style={getFeatureStyle}
            pointToLayer={(feature: any, latlng: any) => {
              const style = getCircleMarkerStyle(feature);
              return L.circleMarker(latlng, style);
            }}
            onEachFeature={(feature: any, layer: any) => {
              // Normalizar UPID para comparación case-insensitive
              const featureUpid = String(feature.properties.upid || '').trim().toLowerCase();
              const attributeItem = filteredData.find(item => 
                String(item.upid || '').trim().toLowerCase() === featureUpid
              );
              
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

        {/* Herramienta de medición */}
        <MapMeasureTool />
      </MapContainer>
    </div>
  );
};

export default UnidadesProyectoMapSimple;