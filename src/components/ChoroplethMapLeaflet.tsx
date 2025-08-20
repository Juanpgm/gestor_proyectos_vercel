'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Map, Layers, BarChart3, Eye, Settings, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { processGeoJSONCoordinates, CALI_COORDINATES } from '@/utils/coordinateUtils'
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'
import 'leaflet/dist/leaflet.css'

// Dynamic import of Leaflet components to prevent SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false })
const MapPopup = dynamic(() => import('./MapPopup'), { ssr: false })

// Datos separados para comunas y barrios
const generateComunasData = (comunas: any[]) => {
  const data: Record<string, any> = {};
  comunas.forEach((comuna, index) => {
    const comunaNumber = comuna.properties?.comuna || index + 1;
    data[comunaNumber] = {
      population: Math.floor(Math.random() * 80000) + 20000,
      projects: Math.floor(Math.random() * 25) + 5,
      budget: Math.floor(Math.random() * 15000000000) + 5000000000,
      completed: Math.floor(Math.random() * 20) + 2,
      socialIndex: Math.floor(Math.random() * 100) + 1
    };
  });
  return data;
};

const generateBarriosData = (barrios: any[]) => {
  const data: Record<string, any> = {};
  barrios.forEach((barrio, index) => {
    const barrioId = barrio.properties?.id_barrio || `barrio_${index}`;
    data[barrioId] = {
      population: Math.floor(Math.random() * 15000) + 1000,
      projects: Math.floor(Math.random() * 8) + 1,
      budget: Math.floor(Math.random() * 3000000000) + 500000000,
      completed: Math.floor(Math.random() * 5) + 1,
      socialIndex: Math.floor(Math.random() * 100) + 1
    };
  });
  return data;
};

const generateCorregimientosData = (corregimientos: any[]) => {
  const data: Record<string, any> = {};
  corregimientos.forEach((corregimiento, index) => {
    const corregimientoId = corregimiento.properties?.id_corregimiento || corregimiento.properties?.nombre || `corregimiento_${index}`;
    data[corregimientoId] = {
      population: Math.floor(Math.random() * 25000) + 5000,
      projects: Math.floor(Math.random() * 12) + 2,
      budget: Math.floor(Math.random() * 5000000000) + 1000000000,
      completed: Math.floor(Math.random() * 8) + 1,
      socialIndex: Math.floor(Math.random() * 100) + 1
    };
  });
  return data;
};

const generateVeredasData = (veredas: any[]) => {
  const data: Record<string, any> = {};
  veredas.forEach((vereda, index) => {
    const veredaId = vereda.properties?.id_vereda || vereda.properties?.nombre || `vereda_${index}`;
    data[veredaId] = {
      population: Math.floor(Math.random() * 8000) + 500,
      projects: Math.floor(Math.random() * 5) + 1,
      budget: Math.floor(Math.random() * 1500000000) + 200000000,
      completed: Math.floor(Math.random() * 3) + 1,
      socialIndex: Math.floor(Math.random() * 100) + 1
    };
  });
  return data;
};

type ViewMode = 'comunas_corregimientos' | 'barrios_veredas';
type MetricType = 'population' | 'projects' | 'budget' | 'completed' | 'socialIndex';

type TileLayer = {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
};

interface ChoroplethMapProps {
  className?: string;
}

// Leaflet choropleth map component
const LeafletChoroplethMap: React.FC<{
  geoData: any;
  mockData: Record<string, any>;
  viewMode: ViewMode;
  selectedMetrics: MetricType[];
  isDarkMode: boolean;
  selectedBaseMap: string;
  baseMaps: Record<string, any>;
}> = ({ geoData, mockData, viewMode, selectedMetrics, isDarkMode, selectedBaseMap, baseMaps }) => {
  const [map, setMap] = useState<any>(null);

  // Color scales for different metrics
  const getColor = (value: number, metric: MetricType) => {
    const colors = {
      population: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'],
      projects: ['#f7fcf5', '#c7e9c0', '#74c476', '#31a354', '#006d2c'],
      budget: ['#fff7ec', '#fee8c8', '#fdd49e', '#fd8d3c', '#d94701'],
      completed: ['#f7f4f9', '#e7e1ef', '#c994c7', '#dd1c77', '#91003f'],
      socialIndex: ['#feedde', '#fdd0a2', '#fdae6b', '#fd8d3c', '#e6550d']
    };

    // Get min/max values for normalization
    const values = Object.values(mockData).map((data: any) => data[metric] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Normalize value to 0-1 range
    const normalized = (value - min) / (max - min);
    
    // Get color index (0-4)
    const colorIndex = Math.floor(normalized * 4);
    return colors[metric][Math.max(0, Math.min(4, colorIndex))];
  };

  // Get data for different view modes
  const getFeatureData = (feature: any) => {
    if (viewMode === 'comunas_corregimientos') {
      // Check if it's a comuna or corregimiento
      const comunaId = feature.properties?.comuna;
      const corregimientoId = feature.properties?.id_corregimiento || feature.properties?.nombre;
      
      if (comunaId && mockData.comunas) {
        return mockData.comunas[comunaId] || {};
      } else if (corregimientoId && mockData.corregimientos) {
        return mockData.corregimientos[corregimientoId] || {};
      }
    } else {
      // barrios_veredas mode
      const barrioId = feature.properties?.id_barrio;
      const veredaId = feature.properties?.id_vereda || feature.properties?.nombre;
      
      if (barrioId && mockData.barrios) {
        return mockData.barrios[barrioId] || {};
      } else if (veredaId && mockData.veredas) {
        return mockData.veredas[veredaId] || {};
      }
    }
    return {};
  };

  const getFeatureName = (feature: any) => {
    if (viewMode === 'comunas_corregimientos') {
      return feature.properties?.nombre || 
             `Comuna ${feature.properties?.comuna}` || 
             'Área';
    } else {
      return feature.properties?.barrio || 
             feature.properties?.nombre || 
             'Área';
    }
  };

  const style = (feature: any) => {
    const featureData = getFeatureData(feature);
    const metric = selectedMetrics[0] || 'projects';
    const value = featureData[metric] || 0;

    return {
      fillColor: getColor(value, metric),
      weight: 2,
      opacity: 1,
      color: isDarkMode ? '#ffffff' : '#333333',
      dashArray: '',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const featureData = getFeatureData(feature);
    const featureName = getFeatureName(feature);

    // Crear datos para el popup usando el componente MapPopup
    const popupData = {
      title: featureName,
      subtitle: viewMode === 'comunas_corregimientos' ? 'Comuna de Cali' : 'Barrio de Cali',
      items: [
        {
          label: 'Población',
          value: featureData.population || 0,
          format: 'number' as const
        },
        {
          label: 'Proyectos',
          value: featureData.projects || 0,
          format: 'number' as const
        },
        {
          label: 'Presupuesto',
          value: featureData.budget || 0,
          format: 'currency' as const
        },
        {
          label: 'Completados',
          value: featureData.completed || 0,
          format: 'number' as const
        },
        {
          label: 'Índice Social',
          value: `${featureData.socialIndex || 0}/100`,
          format: 'text' as const
        }
      ]
    };

    // Crear el contenido HTML del popup usando ReactDOMServer (solo en cliente)
    if (typeof window !== 'undefined') {
      import('react-dom/server').then(({ renderToStaticMarkup }) => {
        const popupContent = renderToStaticMarkup(
          React.createElement(MapPopup, { 
            title: featureName,
            data: feature.properties,
            excludeFields: ['geometry', 'type', 'OBJECTID', 'FID']
          })
        );
        layer.bindPopup(popupContent, {
          maxWidth: 350,
          className: 'custom-leaflet-popup'
        });
      });
    } else {
      // Fallback para SSR con mejor soporte UTF-8
      const normalizeText = (text: string) => text.normalize('NFC');
      const popupContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 280px; max-width: 320px;">
          <div style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 600;">${normalizeText(featureName)}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${viewMode === 'comunas_corregimientos' ? 'Comuna de Cali' : 
                                                                       viewMode === 'barrios_veredas' ? 'Barrio de Cali' : 
                                                                       'Unidad de Proyecto'}</p>
          </div>
          <div style="padding: 16px;">
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Población:</span>
                <span style="font-weight: 500; font-size: 14px; color: #111827;">${(featureData.population || 0).toLocaleString('es-CO')} hab.</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Proyectos:</span>
                <span style="font-weight: 500; font-size: 14px; color: #111827;">${featureData.projects || 0}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Presupuesto:</span>
                <span style="font-weight: 500; font-size: 14px; color: #111827;">$${((featureData.budget || 0) / 1000000000).toFixed(1)}B</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Completados:</span>
                <span style="font-weight: 500; font-size: 14px; color: #111827;">${featureData.completed || 0}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">Índice Social:</span>
                <span style="font-weight: 500; font-size: 14px; color: #111827;">${featureData.socialIndex || 0}/100</span>
              </div>
            </div>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'custom-leaflet-popup'
      });
    }

    layer.on({
      mouseover: function (e: any) {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
        layer.bringToFront();
      },
      mouseout: function (e: any) {
        const layer = e.target;
        layer.setStyle(style(feature));
      }
    });
  };

  useEffect(() => {
    if (map && geoData && typeof window !== 'undefined') {
      // Dynamically import leaflet only on client side
      import('leaflet').then((L) => {
        // Fix Leaflet's default icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
        });

        let allFeatures: any[] = [];
        
        if (viewMode === 'comunas_corregimientos') {
          if (geoData.comunas?.features) allFeatures = allFeatures.concat(geoData.comunas.features);
        } else {
          if (geoData.barrios?.features) allFeatures = allFeatures.concat(geoData.barrios.features);
        }
        
        if (allFeatures.length > 0) {
          const featureCollection = {
            type: 'FeatureCollection' as const,
            features: allFeatures
          };
          const bounds = L.geoJSON(featureCollection as any).getBounds();
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      });
    }
  }, [map, geoData, viewMode]);

  // Force map invalidateSize when container changes
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map, selectedBaseMap]);

  if (typeof window === 'undefined') {
    return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-cali-green mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapContainer
        center={[3.4516, -76.5320]}
        zoom={11}
        minZoom={9}
        maxZoom={baseMaps[selectedBaseMap]?.maxZoom || 18}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container"
        ref={setMap}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={true}
        preferCanvas={false}
        touchZoom={true}
        zoomSnap={1}
        zoomDelta={1}
        trackResize={true}
        worldCopyJump={false}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          url={baseMaps[selectedBaseMap]?.url || baseMaps.openstreet.url}
          attribution={baseMaps[selectedBaseMap]?.attribution || baseMaps.openstreet.attribution}
          maxZoom={baseMaps[selectedBaseMap]?.maxZoom || 18}
          minZoom={9}
          tileSize={256}
          zoomOffset={0}
          detectRetina={true}
          crossOrigin={true}
        />
        {geoData && (
          <>
            {/* Render only valid geometries */}
            {viewMode === 'comunas_corregimientos' ? (
              <>
                {geoData.comunas && (
                  <GeoJSON
                    key={`comunas-${selectedMetrics.join(',')}`}
                    data={geoData.comunas}
                    style={style}
                    onEachFeature={onEachFeature}
                  />
                )}
              </>
            ) : (
              <>
                {geoData.barrios && (
                  <GeoJSON
                    key={`barrios-${selectedMetrics.join(',')}`}
                    data={geoData.barrios}
                    style={style}
                    onEachFeature={onEachFeature}
                  />
                )}
              </>
            )}
          </>
        )}
      </MapContainer>
      
      {/* Legend */}
      {selectedMetrics.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
            {selectedMetrics[0] === 'population' && 'Población'}
            {selectedMetrics[0] === 'projects' && 'Proyectos'}
            {selectedMetrics[0] === 'budget' && 'Presupuesto'}
            {selectedMetrics[0] === 'completed' && 'Completados'}
            {selectedMetrics[0] === 'socialIndex' && 'Índice Social'}
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Intensidad del color representa mayor valor
          </div>
        </div>
      )}
    </div>
  );
};

const ChoroplethMap: React.FC<ChoroplethMapProps> = ({ className = '' }) => {
  const [isClient, setIsClient] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('comunas_corregimientos')
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['projects'])
  const [isMetricsDropdownOpen, setIsMetricsDropdownOpen] = useState(false)
  const [selectedBaseMap, setSelectedBaseMap] = useState<string>('light')
  const [isBaseMapDropdownOpen, setIsBaseMapDropdownOpen] = useState(false)
  const [geoData, setGeoData] = useState<any>(null)
  const [mockData, setMockData] = useState<Record<string, any>>({})
  const { theme } = useTheme()
  const metricsDropdownRef = useRef<HTMLDivElement>(null)
  const baseMapDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricsDropdownRef.current && !metricsDropdownRef.current.contains(event.target as Node)) {
        setIsMetricsDropdownOpen(false)
      }
      if (baseMapDropdownRef.current && !baseMapDropdownRef.current.contains(event.target as Node)) {
        setIsBaseMapDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Available base map tiles
  const baseMaps = {
    openstreet: {
      name: 'OpenStreetMap',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    },
    satellite: {
      name: 'Satélite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      maxZoom: 18
    },
    dark: {
      name: 'Oscuro',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    light: {
      name: 'Claro',
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    positron: {
      name: 'Positron',
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    },
    voyager: {
      name: 'Voyager',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18
    },
    outdoors: {
      name: 'Exterior',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      maxZoom: 17
    }
  }

  // Calculate if dark mode is active
  const isDarkMode = theme === 'dark' || (theme === 'system' && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  // Efecto para cambiar el mapa base según el tema
  useEffect(() => {
    if (isDarkMode) {
      setSelectedBaseMap('dark')
    } else {
      setSelectedBaseMap('light') // Mapa claro específico
    }
  }, [isDarkMode])

  // Configuración de métricas
  const metrics = {
    population: {
      label: 'Población',
      color: '#3B82F6',
      format: (value: number) => `${(value / 1000).toFixed(1)}K hab.`,
      icon: <Eye className="w-4 h-4" />
    },
    projects: {
      label: 'Proyectos',
      color: '#10B981',
      format: (value: number) => `${value} proyectos`,
      icon: <Layers className="w-4 h-4" />
    },
    budget: {
      label: 'Presupuesto',
      color: '#F59E0B',
      format: (value: number) => `$${(value / 1000000000).toFixed(1)}B`,
      icon: <BarChart3 className="w-4 h-4" />
    },
    completed: {
      label: 'Completados',
      color: '#8B5CF6',
      format: (value: number) => `${value} terminados`,
      icon: <Settings className="w-4 h-4" />
    },
    socialIndex: {
      label: 'Índice Social',
      color: '#EF4444',
      format: (value: number) => `${value}/100`,
      icon: <BarChart3 className="w-4 h-4" />
    }
  };

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    loadGeoData()
  }, [viewMode])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMetricsDropdownOpen) {
        const target = event.target as Element
        if (!target.closest('.metrics-dropdown-container')) {
          setIsMetricsDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMetricsDropdownOpen])

  const loadGeoData = async () => {
    try {
      let comunasData, barriosData;
      
      if (viewMode === 'comunas_corregimientos') {
        // Solo cargar comunas reales, no corregimientos simulados
        const comunasResponse = await fetch('/geodata/comunas.geojson');
        
        if (comunasResponse.ok) {
          comunasData = await comunasResponse.json();
        }
        
        setGeoData({ comunas: comunasData });
        setMockData({
          comunas: comunasData ? generateComunasData(comunasData.features) : {}
        });
        
      } else {
        // Solo cargar barrios reales, no veredas simuladas
        const barriosResponse = await fetch('/geodata/barrios.geojson');
        
        if (barriosResponse.ok) {
          barriosData = await barriosResponse.json();
        }
        
        setGeoData({ barrios: barriosData });
        setMockData({
          barrios: barriosData ? generateBarriosData(barriosData.features) : {}
        });
      }
    } catch (error) {
      console.error('Error loading geodata:', error)
      setGeoData(null)
    }
  }

  // Función para toggle de métricas
  const toggleMetric = (metric: MetricType) => {
    setSelectedMetrics([metric]) // Only allow one metric at a time for choropleth
    setIsMetricsDropdownOpen(false) // Close dropdown after selection
  }

  if (!isClient) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                Mapa Coroplético
              </h3>
              <Map className="text-cali-green w-5 h-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Visualización por {viewMode === 'comunas_corregimientos' ? 'comunas' : 
                                  viewMode === 'barrios_veredas' ? 'barrios' : 
                                  'unidades de proyecto'}
              </span>
            </div>
          </div>
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cali-green mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Cargando mapa...</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
            Mapa Coroplético Interactivo
          </h3>
          <Map className="text-cali-green w-5 h-5" />
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {viewMode === 'comunas_corregimientos' 
            ? `${geoData?.comunas?.features?.length || 0} comunas disponibles`
            : `${geoData?.barrios?.features?.length || 0} barrios disponibles`
          }
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vista:</span>
          <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            {([
              { key: 'comunas_corregimientos' as const, label: 'Comunas' },
              { key: 'barrios_veredas' as const, label: 'Barrios' }
            ]).map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  viewMode === mode.key
                    ? 'bg-cali-green text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Métrica:</span>
          <div className="relative metrics-dropdown-container" ref={metricsDropdownRef}>
            <button
              onClick={() => setIsMetricsDropdownOpen(!isMetricsDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 min-w-[140px]"
            >
              <span className="text-sm">
                {selectedMetrics.length === 0 
                  ? 'Seleccionar'
                  : metrics[selectedMetrics[0]].label
                }
              </span>
              <ChevronDown 
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isMetricsDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isMetricsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[9999]"
              >
                <div className="p-2 space-y-1">
                  {(Object.keys(metrics) as MetricType[]).map((metric) => (
                    <button
                      key={metric}
                      onClick={() => toggleMetric(metric)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: metrics[metric].color }}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {metrics[metric].label}
                        </span>
                      </div>
                      {selectedMetrics.includes(metric) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Base Map Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mapa Base:</span>
          <div className="relative basemap-dropdown-container" ref={baseMapDropdownRef}>
            <button
              onClick={() => setIsBaseMapDropdownOpen(!isBaseMapDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 min-w-[140px]"
            >
              <span className="text-sm">
                {baseMaps[selectedBaseMap as keyof typeof baseMaps]?.name || 'Seleccionar'}
              </span>
              <ChevronDown 
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                  isBaseMapDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {isBaseMapDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-[9999]"
              >
                <div className="p-2 space-y-1">
                  {Object.entries(baseMaps).map(([key, baseMap]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedBaseMap(key)
                        setIsBaseMapDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-left"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {baseMap.name}
                      </span>
                      {selectedBaseMap === key && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 transition-colors duration-300 shadow-inner relative ${
        className.includes('h-') ? 'h-96' : 'h-[600px]'
      }`}>
        <style jsx global>{`
          .leaflet-container {
            height: 100% !important;
            width: 100% !important;
            z-index: 1;
            background: transparent;
          }
          
          .leaflet-tile-container {
            pointer-events: auto;
          }
          
          .leaflet-tile {
            max-width: none !important;
            max-height: none !important;
          }
          
          .leaflet-control-container {
            pointer-events: none;
          }
          
          .leaflet-control {
            pointer-events: auto;
          }
          
          .custom-leaflet-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            padding: 0;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
          }
          
          .custom-leaflet-popup .leaflet-popup-content {
            margin: 0;
            padding: 0;
            width: auto !important;
            border-radius: 8px;
          }
          
          .custom-leaflet-popup .leaflet-popup-tip {
            background: white;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
          
          .leaflet-control-zoom a {
            border-radius: 4px !important;
            color: #374151 !important;
            background-color: white !important;
            border: 1px solid #d1d5db !important;
          }
          
          .leaflet-control-zoom a:hover {
            background-color: #f3f4f6 !important;
            border-color: #9ca3af !important;
          }
          
          .leaflet-control-attribution {
            background-color: rgba(255, 255, 255, 0.8) !important;
            border-radius: 4px !important;
            font-size: 10px !important;
            padding: 2px 5px !important;
          }
          
          /* Dark mode styles */
          .dark .leaflet-control-zoom a {
            background-color: #374151 !important;
            color: white !important;
            border-color: #4b5563 !important;
          }
          
          .dark .leaflet-control-zoom a:hover {
            background-color: #4b5563 !important;
            border-color: #6b7280 !important;
          }
          
          .dark .leaflet-control-attribution {
            background-color: rgba(55, 65, 81, 0.8) !important;
            color: white !important;
          }
          
          .dark .custom-leaflet-popup .leaflet-popup-content-wrapper {
            background-color: #1f2937;
            border-color: #374151;
            color: white;
          }
          
          .dark .custom-leaflet-popup .leaflet-popup-tip {
            background: #1f2937;
            border-color: #374151;
          }
        `}</style>
        {geoData && Object.keys(mockData).length > 0 ? (
          <LeafletChoroplethMap
            geoData={geoData}
            mockData={mockData}
            viewMode={viewMode}
            selectedMetrics={selectedMetrics}
            isDarkMode={isDarkMode}
            selectedBaseMap={selectedBaseMap}
            baseMaps={baseMaps}
          />
        ) : (
          <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="animate-spin h-8 w-8 text-cali-green mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Cargando datos del mapa...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ChoroplethMap
