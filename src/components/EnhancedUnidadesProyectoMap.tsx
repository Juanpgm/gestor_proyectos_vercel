/**
 * Componente del mapa con controles de coloración
 * Permite clasificar por diferentes variables con colores
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON, Marker } from 'react-leaflet';
import * as L from 'leaflet';
import { 
  Layers, 
  Satellite, 
  Palette, 
  ChevronDown,
  Info,
  Eye,
  Map as MapIcon
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

interface UnidadesProyectoMapProps {
  geometryData: GeometryData | null;
  filteredData: AttributeData[];
  className?: string;
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

// Tipo para capas base
type BaseLayerType = 'none' | 'comunas' | 'barrios';

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

// Configuración de mapas base
const MAP_CONFIGS = {
  streets: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  },
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
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
    // Usar las propiedades correctas según el tipo de capa
    const name = layerType === 'comunas' 
      ? properties?.comuna_corregimiento 
      : properties?.barrio_vereda;
    
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

    // Crear icono de texto con z-index alto
    const textIcon = L.divIcon({
      className: 'base-layer-label',
      html: `<div style="
        position: relative;
        font-size: 12px;
        font-weight: 700;
        color: #111827;
        background-color: rgba(255, 255, 255, 0.95);
        padding: 3px 8px;
        border-radius: 4px;
        border: 1.5px solid rgba(55, 65, 81, 0.4);
        white-space: nowrap;
        pointer-events: none;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        z-index: 1000;
      ">${name}</div>`,
      iconSize: [100, 30],
      iconAnchor: [50, 15]
    });

    return (
      <Marker
        key={`label-${layerType}-${index}-${name}`}
        position={[lat, lng]}
        icon={textIcon}
        interactive={false}
        zIndexOffset={1000}
      />
    );
  }).filter(Boolean);

  return <>{labels}</>;
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
            {activeLayer === 'none' ? 'Capas Base' : activeLayer === 'comunas' ? 'Comunas' : 'Barrios'}
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
            className="border-t border-gray-200 dark:border-gray-700 px-3 py-2"
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

                  {/* Toggle para mostrar etiquetas */}
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
                </>
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

// Componente principal del mapa
const UnidadesProyectoMap: React.FC<UnidadesProyectoMapProps> = ({
  geometryData,
  filteredData,
  className = ''
}) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isDark, setIsDark] = useState(false);
  const [coloringType, setColoringType] = useState<ColoringType>('estado');
  const [baseLayer, setBaseLayer] = useState<BaseLayerType>('none');
  const [baseLayerColorMode, setBaseLayerColorMode] = useState<BaseLayerColorMode>('monotone');
  const [baseLayerMonotoneColor, setBaseLayerMonotoneColor] = useState<string>('#3B82F6');
  const [showBaseLayerLabels, setShowBaseLayerLabels] = useState<boolean>(true);
  const [comunasData, setComunasData] = useState<any>(null);
  const [barriosData, setBarriosData] = useState<any>(null);

  // Cargar archivos GeoJSON de capas base
  useEffect(() => {
    const loadBaseLayerData = async () => {
      try {
        const [comunasResponse, barriosResponse] = await Promise.all([
          fetch('/data/geodata/cartografia_base/comunas_corregimientos.geojson'),
          fetch('/data/geodata/cartografia_base/barrios_veredas.geojson')
        ]);
        
        if (comunasResponse.ok) {
          const comunasJson = await comunasResponse.json();
          setComunasData(comunasJson);
        }
        
        if (barriosResponse.ok) {
          const barriosJson = await barriosResponse.json();
          setBarriosData(barriosJson);
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

  // Función para obtener el estilo de las capas base según la configuración
  const getBaseLayerStyle = (feature: any) => {
    if (baseLayerColorMode === 'monotone') {
      return {
        color: baseLayerMonotoneColor,
        weight: 2,
        opacity: 0.7,
        fillColor: baseLayerMonotoneColor,
        fillOpacity: 0.15
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
      
      // Obtener el nombre del feature
      const featureName = feature.properties?.comuna_corregimiento || feature.properties?.barrio_vereda || '';
      
      // Función de hash mejorada (DJB2) - solo usar el nombre para consistencia
      let hash = 5381;
      for (let i = 0; i < featureName.length; i++) {
        hash = ((hash << 5) + hash) + featureName.charCodeAt(i);
      }
      
      // Asegurar distribución uniforme en la paleta
      const colorIndex = Math.abs(hash) % colorPalette.length;
      const color = colorPalette[colorIndex];
      
      console.log(`Feature: ${featureName}, Hash: ${hash}, Index: ${colorIndex}, Color: ${color}`);
      
      return {
        color: color,
        weight: 2,
        opacity: 0.7,
        fillColor: color,
        fillOpacity: 0.15
      };
    }
  };

  // Generar esquema de colores y leyenda basado en el tipo de coloración
  const { colorMap, legend } = useMemo(() => {
    const data = filteredData;
    
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

      {/* Indicador de cantidad de elementos */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {geometryData?.features?.length || 0} elementos
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

        {/* Geometrías de la API - se renderizan después para quedar por encima */}
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
                const popupContent = `
                  <div style="min-width: 250px; max-width: 300px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                      ${attributeItem.nombre_up || feature.properties.upid}
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                      <div><strong>UPID:</strong> ${attributeItem.upid}</div>
                      <div><strong>Estado:</strong> ${attributeItem.estado}</div>
                      <div><strong>Tipo:</strong> ${attributeItem.tipo_intervencion}</div>
                      ${attributeItem.tipo_equipamiento ? `<div><strong>Equipamiento:</strong> ${attributeItem.tipo_equipamiento}</div>` : ''}
                      <div><strong>Avance:</strong> ${Math.round(attributeItem.avance_obra || 0)}%</div>
                      <div style="grid-column: span 2; word-wrap: break-word; overflow-wrap: break-word;"><strong>Centro Gestor:</strong> ${attributeItem.nombre_centro_gestor}</div>
                      <div style="grid-column: span 2;"><strong>Ubicación:</strong> ${attributeItem.barrio_vereda}, ${attributeItem.comuna_corregimiento}</div>
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

export default UnidadesProyectoMap;