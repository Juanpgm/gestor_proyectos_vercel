'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Settings, ChevronDown, MapPin, BarChart3, Activity, Layers } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme } from '@/context/ThemeContext'
import { useUnidadesProyecto, UnidadProyecto } from '@/hooks/useUnidadesProyecto'
import { useDashboardFilters } from '@/context/DashboardContext'
import LayerManagementPanel from './LayerManagementPanel'
import PropertiesPanel from './PropertiesPanel'
import UnifiedFilters from './UnifiedFilters'
import ProgressGaugeChart from './ProgressGaugeChart'
import InterventionMetrics from './InterventionMetrics'

// Dynamic imports para optimización
const DynamicProjectMap = dynamic(
  () => import('./ProjectMapCore').catch(err => {
    console.error('❌ Error importando ProjectMapCore:', err)
    throw err
  }),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
  }
)

interface ProjectMapWithPanelsProps {
  className?: string
  height?: string
  selectedProjectUnitFromTable?: UnidadProyecto | null
  optimizedGeoJSONData?: Record<string, any> // Datos GeoJSON pre-cargados
}

// Base maps configuration
const baseMaps = {
  light: {
    name: 'Carto Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  dark: {
    name: 'Carto Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
}

// Layer colors
const layerColors = {
  equipamientos: '#10B981', // Verde
  infraestructura_vial: '#F59E0B' // Amarillo/Naranja
}

// Layer icons
const layerIcons = {
  equipamientos: '🏢',
  infraestructura_vial: '🛣️'
}

const ProjectMapWithPanels: React.FC<ProjectMapWithPanelsProps> = ({
  className = '',
  height = '600px',
  selectedProjectUnitFromTable,
  optimizedGeoJSONData = {}
}) => {
  // Estados locales
  const [selectedBaseMap, setSelectedBaseMap] = useState('light')
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(false)
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [selectedLayerType, setSelectedLayerType] = useState<string>('')
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    equipamientos: true,
    infraestructura_vial: true
  })
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    equipamientos: 0.8,
    infraestructura_vial: 0.8
  })
  const [layerConfigs, setLayerConfigs] = useState([
    {
      id: 'equipamientos',
      name: 'Equipamientos',
      visible: true,
      color: '#10B981',
      opacity: 0.8,
      representationMode: 'clase_obra' as const
    },
    {
      id: 'infraestructura_vial',
      name: 'Infraestructura Vial',
      visible: true,
      color: '#F59E0B',
      opacity: 0.8,
      representationMode: 'tipo_intervencion' as const
    }
  ])
  const [activeChart, setActiveChart] = useState<'gauge' | 'interventions'>('gauge')

  // Hooks
  const { theme } = useTheme()
  const unidadesState = useUnidadesProyecto()
  const { filters } = useDashboardFilters()
  
  console.log('🗺️ ProjectMapWithPanels renderizado:', {
    loading: unidadesState.loading,
    error: unidadesState.error,
    dataKeys: Object.keys(unidadesState.allGeoJSONData || {})
  })
  
  // Sincronizar mapa base con el tema
  useEffect(() => {
    setSelectedBaseMap(theme === 'dark' ? 'dark' : 'light')
  }, [theme])
  
  // Procesar unidades de proyecto filtradas (mantenemos para compatibilidad)
  const unidadesProyecto = useMemo(() => {
    const rawUnidades = unidadesState.unidadesProyecto || []
    
    return rawUnidades.filter(unit => {
      // Filtros básicos
      if (filters.search && !unit.name?.toLowerCase().includes(filters.search.toLowerCase()) && 
          !(unit as any).proyecto?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(unit as any).nickname?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !(unit as any).titulo?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Otros filtros...
      if (filters.estado !== 'all' && unit.status !== filters.estado) {
        return false
      }

      return true
    })
  }, [unidadesState.unidadesProyecto, filters])

  // Calcular datos para métricas desde GeoJSON en lugar de unidadesProyecto
  const geoJSONMetrics = useMemo(() => {
    const allGeoJSONData = unidadesState.allGeoJSONData || {}
    const allFeatures: any[] = []
    
    // Extraer todas las features de todos los GeoJSON
    Object.values(allGeoJSONData).forEach((geoJSON: any) => {
      if (geoJSON?.features) {
        geoJSON.features.forEach((feature: any) => {
          if (feature.properties) {
            const props = feature.properties
            
            // Mapear los datos para que tengan la estructura esperada por los gráficos
            const mappedData = {
              ...props,
              // Asegurar que existe un campo progress
              progress: props.progress || 
                       props.porcentaje_avance || 
                       props.avance_fisico || 
                       props.porcentaje_ejecutado ||
                       (props.valor_ejecutado && props.valor_total ? 
                         Math.round((props.valor_ejecutado / props.valor_total) * 100) : 0),
              
              // Asegurar que existe un campo status
              status: props.status || 
                     props.estado || 
                     props.estado_proyecto ||
                     props.fase ||
                     'Sin especificar',
              
              // Campos adicionales útiles para métricas
              type: props.tipo_intervencion || 
                   props.tipo_proyecto || 
                   props.tipo ||
                   'General',
              
              // Para InterventionMetrics - campos específicos
              tipoIntervencion: props.tipo_intervencion || 
                              props.tipo_proyecto || 
                              props.tipo ||
                              'Sin especificar',
              
              claseObra: props.clase_obra || 
                        props.clase || 
                        props.categoria ||
                        'Sin especificar',
              
              // Campos financieros
              budget: props.valor_total || 
                     props.valor_contrato || 
                     props.presupuesto ||
                     0,
              
              value: props.valor_total || 
                    props.valor_contrato || 
                    props.presupuesto ||
                    0,
              
              // Identificadores
              id: props.id || props.codigo || feature.id || Math.random().toString(36),
              bpin: props.bpin || props.codigo_bpin || '',
              
              name: props.nombre || 
                   props.titulo || 
                   props.descripcion ||
                   'Proyecto sin nombre',
            }
            
            allFeatures.push(mappedData)
          }
        })
      }
    })
    
    console.log('🔍 GeoJSON Metrics calculados:', {
      totalFeatures: allFeatures.length,
      sampleData: allFeatures.slice(0, 3),
      progressFields: allFeatures.filter(f => f.progress > 0).length,
      statusFields: allFeatures.filter(f => f.status !== 'Sin especificar').length
    })
    
    return allFeatures
  }, [unidadesState.allGeoJSONData])

  // Debug logs
  useEffect(() => {
    console.log('🔍 ProjectMapWithPanels - Estado de datos:', {
      unidadesOriginales: unidadesState.unidadesProyecto?.length || 0,
      unidadesFiltradas: unidadesProyecto.length,
      geoJSONFeatures: geoJSONMetrics.length,
      loading: unidadesState.loading,
      error: unidadesState.error,
      muestraUnidades: unidadesState.unidadesProyecto?.slice(0, 2)
    })
  }, [unidadesProyecto, unidadesState, geoJSONMetrics])

  // Efecto para manejar la unidad seleccionada desde la tabla
  useEffect(() => {
    if (selectedProjectUnitFromTable) {
      console.log('👁️ Unidad seleccionada desde tabla, creando feature artificial:', selectedProjectUnitFromTable)
      
      // Crear un feature artificial para el panel de propiedades
      const artificialFeature = {
        properties: {
          // Datos básicos
          nickname: selectedProjectUnitFromTable.name,
          nombre_unidad_proyecto: selectedProjectUnitFromTable.name,
          BPIN: selectedProjectUnitFromTable.bpin,
          bpin: selectedProjectUnitFromTable.bpin,
          identificador: selectedProjectUnitFromTable.id,
          
          // Ubicación
          comuna_corregimiento: selectedProjectUnitFromTable.comuna || selectedProjectUnitFromTable.corregimiento,
          barrio_vereda: selectedProjectUnitFromTable.barrio || selectedProjectUnitFromTable.vereda,
          direccion: selectedProjectUnitFromTable.direccion || '',
          
          // Estado y progreso
          estado_unidad_proyecto: selectedProjectUnitFromTable.status,
          avance_físico_obra: selectedProjectUnitFromTable.progress / 100, // Convertir a decimal
          progress: selectedProjectUnitFromTable.progress,
          
          // Financiero
          ppto_base: selectedProjectUnitFromTable.budget,
          pagos_realizados: selectedProjectUnitFromTable.executed || selectedProjectUnitFromTable.pagado,
          valor_ejecutado: selectedProjectUnitFromTable.executed || selectedProjectUnitFromTable.pagado,
          ejecucion_financiera: selectedProjectUnitFromTable.budget > 0 
            ? ((selectedProjectUnitFromTable.executed || selectedProjectUnitFromTable.pagado || 0) / selectedProjectUnitFromTable.budget) * 100
            : 0,
          
          // Detalles del proyecto
          tipo_intervencion: selectedProjectUnitFromTable.tipoIntervencion,
          clase_obra: selectedProjectUnitFromTable.claseObra,
          descripcion_intervencion: selectedProjectUnitFromTable.descripcion,
          
          // Fechas y responsables
          fecha_inicio_planeado: selectedProjectUnitFromTable.startDate,
          fecha_fin_planeado: selectedProjectUnitFromTable.endDate,
          nombre_centro_gestor: selectedProjectUnitFromTable.responsible,
          usuarios_beneficiarios: selectedProjectUnitFromTable.beneficiaries,
        },
        geometry: {
          type: 'Point',
          coordinates: [0, 0] // Coordenadas dummy
        }
      }
      
      setSelectedFeature(artificialFeature)
      setSelectedLayerType('unidad_proyecto_desde_tabla')
      setPropertiesCollapsed(false) // Expandir el panel de propiedades
      
      console.log('✅ Feature artificial creado para el panel:', artificialFeature)
    }
  }, [selectedProjectUnitFromTable])

  // Inicializar configuración de capas cuando hay datos
  useEffect(() => {
    if (geoJSONMetrics.length > 0) {
      // Configuración inicial de visibilidad de capas
      setLayerVisibility({
        equipamientos: true,
        infraestructura_vial: true
      })
      setLayerOpacity({
        equipamientos: 0.8,
        infraestructura_vial: 0.8
      })
    }
  }, [geoJSONMetrics.length])

  // Funciones de manejo de capas
  const toggleLayer = (layerId: string) => {
    setLayerConfigs(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ))
    
    setLayerVisibility(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }))
  }

  const updateLayerConfig = (layerId: string, updates: any) => {
    setLayerConfigs(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
    
    if (updates.opacity !== undefined) {
      setLayerOpacity(prev => ({ ...prev, [layerId]: updates.opacity }))
    }
  }

  // Función para manejar click en features del mapa
  const handleFeatureClick = (feature: any, layer: any) => {
    console.log('🔍 Feature clicked en ProjectMapWithPanels:', { 
      feature, 
      layer,
      properties: feature?.properties,
      geometryType: feature?.geometry?.type
    })
    
    const layerType = layer?.id || layer?.type || 'unknown'
    
    // Determinar si es una unidad de proyecto basándose en las propiedades
    const isProjectUnit = feature?.properties && (
      feature.properties.bpin || 
      feature.properties.identificador || 
      feature.properties.nickname ||
      feature.properties.id_via ||
      feature.properties.clase_obra ||
      feature.properties.tipo_intervencion
    )

    if (isProjectUnit) {
      console.log('🎯 Es una unidad de proyecto, creando objeto UnidadProyecto...')
      
      // Crear objeto UnidadProyecto a partir del feature
      const projectUnit: UnidadProyecto = {
        id: feature.properties.identificador?.toString() || feature.properties.id_via?.toString() || `unit-${Math.random().toString(36).substr(2, 9)}`,
        bpin: feature.properties.bpin?.toString() || '0',
        name: feature.properties.nickname || feature.properties.nombre_unidad_proyecto || feature.properties.seccion_via || `Unidad ${feature.properties.identificador || feature.properties.id_via || 'Sin ID'}`,
        status: mapEstadoFromGeoJSON(feature.properties.estado_unidad_proyecto) || 'En Ejecución',
        comuna: feature.properties.comuna_corregimiento || feature.properties.comuna || undefined,
        barrio: feature.properties.barrio_vereda || feature.properties.barrio || undefined,
        corregimiento: feature.properties.comuna_corregimiento?.toLowerCase().includes('corregimiento') ? feature.properties.comuna_corregimiento : undefined,
        vereda: feature.properties.barrio_vereda?.toLowerCase().includes('vereda') ? feature.properties.barrio_vereda : undefined,
        budget: feature.properties.ppto_base || 0,
        executed: feature.properties.pagos_realizados || 0,
        pagado: feature.properties.pagos_realizados || 0,
        beneficiaries: feature.properties.usuarios_beneficiarios || 0,
        startDate: feature.properties.fecha_inicio_planeado || feature.properties.fecha_inicio_real || '2024-01-01',
        endDate: feature.properties.fecha_fin_planeado || feature.properties.fecha_fin_real || '2024-12-31',
        responsible: feature.properties.nombre_centro_gestor || 'No especificado',
        progress: (feature.properties.avance_físico_obra || 0) * 100, // Convertir decimal a porcentaje
        tipoIntervencion: feature.properties.tipo_intervencion || 'Sin especificar',
        claseObra: feature.properties.clase_obra || feature.properties.subclase_obra || 'Sin especificar',
        descripcion: feature.properties.descripcion_intervencion || undefined,
        direccion: feature.properties.direccion || undefined,
        lat: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[1] : undefined,
        lng: feature.geometry?.type === 'Point' ? feature.geometry.coordinates[0] : undefined,
        geometry: feature.geometry,
        source: layerType.includes('equipamientos') ? 'equipamientos' : 'infraestructura'
      }

      console.log('✅ Unidad de proyecto creada:', projectUnit)
      
      // Mostrar en panel de propiedades en lugar de modal
      setSelectedFeature(feature)
      setSelectedLayerType('unidad_proyecto_desde_mapa')
      setPropertiesCollapsed(false)
      
      // Expandir panel izquierdo si está colapsado
      if (leftPanelCollapsed) {
        console.log('📂 Expandiendo panel izquierdo para mostrar propiedades')
        setLeftPanelCollapsed(false)
      }
    } else {
      // Comportamiento normal para features que no son unidades de proyecto
      setSelectedFeature(feature)
      setSelectedLayerType(layerType)
      
      // Asegurar que los paneles estén visibles cuando se selecciona una feature
      if (leftPanelCollapsed) {
        console.log('📂 Expandiendo panel izquierdo para mostrar propiedades')
        setLeftPanelCollapsed(false)
      }
      
      // Mostrar propiedades automáticamente cuando se selecciona una feature
      if (propertiesCollapsed) {
        console.log('📋 Expandiendo panel de propiedades')
        setPropertiesCollapsed(false)
      }
    }
  }

  // Función helper para mapear estados del GeoJSON
  const mapEstadoFromGeoJSON = (estado?: string): UnidadProyecto['status'] => {
    if (!estado) return 'En Ejecución'
    
    const estadoLower = estado.toLowerCase().trim()
    if (estadoLower.includes('ejecución') || estadoLower.includes('ejecucion')) return 'En Ejecución'
    if (estadoLower.includes('completado') || estadoLower.includes('terminado') || estadoLower.includes('finalizado')) return 'Completado'
    if (estadoLower.includes('suspendido') || estadoLower.includes('pausado')) return 'Suspendido'
    if (estadoLower.includes('evaluación') || estadoLower.includes('evaluacion') || estadoLower.includes('revisión')) return 'En Evaluación'
    if (estadoLower.includes('planificación') || estadoLower.includes('planificacion') || estadoLower.includes('planeación')) return 'Planificación'
    
    return 'En Ejecución'
  }

  // Función para cerrar el panel de propiedades
  const handleCloseProperties = () => {
    setSelectedFeature(null)
    setSelectedLayerType('')
  }

  // Función para aplicar cambios de capas al mapa
  const handleApplyLayerChanges = () => {
    console.log('🎨 Aplicando cambios de capas al mapa')
    // Aquí podrías agregar lógica adicional si es necesaria
    // Por ejemplo, refrescar el mapa o notificar cambios
  }

  // Preparar datos para el control de capas
  const layerControlData = useMemo(() => {
    return ['equipamientos', 'infraestructura_vial'].map(fileName => {
      const displayName = fileName === 'infraestructura_vial' ? 'Infraestructura Vial' : 'Equipamientos'
      
      return {
        id: fileName,
        name: displayName,
        visible: layerVisibility[fileName] ?? true, // Por defecto visible
        opacity: layerOpacity[fileName] || 0.8,
        color: layerColors[fileName as keyof typeof layerColors] || '#6B7280',
        icon: layerIcons[fileName as keyof typeof layerIcons] || '📍',
        type: 'geojson' as const
      }
    })
  }, [layerVisibility, layerOpacity])

  // Mostrar loading si está cargando
  if (unidadesState.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Cargando datos del proyecto...</p>
        </div>
      </motion.div>
    )
  }

  // Mostrar error si hay error
  if (unidadesState.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`w-full rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 dark:text-red-400">Error: {unidadesState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Layout principal - Tres columnas sin panel inferior */}
      <div className="flex h-full">

        {/* Panel Izquierdo - Control de Capas + Propiedades debajo */}
        <motion.div
          initial={false}
          animate={{ 
            width: leftPanelCollapsed ? '40px' : '350px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-10"
        >
          {/* Header del panel izquierdo */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              {!leftPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">Controles</h3>
                </div>
              )}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={leftPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${leftPanelCollapsed ? 'rotate-90' : '-rotate-90'}`} />
              </button>
            </div>
          </div>

          {/* Contenido del panel izquierdo */}
          {!leftPanelCollapsed && (
            <div className="flex-1 flex flex-col overflow-y-auto">
              
              {/* Control de Capas - Parte superior con su propio colapso */}
              {!layerControlCollapsed && (
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Control de Capas
                    </h4>
                    <button
                      onClick={() => setLayerControlCollapsed(true)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Ocultar control de capas"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <LayerManagementPanel
                    layers={layerConfigs}
                    onLayerUpdate={updateLayerConfig}
                    onApplyChanges={handleApplyLayerChanges}
                    className="w-full"
                  />
                </div>
              )}

              {/* Botón para mostrar control de capas cuando está oculto */}
              {layerControlCollapsed && (
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setLayerControlCollapsed(false)}
                    className="w-full p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    title="Mostrar control de capas"
                  >
                    <Layers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar Control de Capas</span>
                  </button>
                </div>
              )}
              
              {/* Propiedades - Parte inferior con su propio colapso */}
              {selectedFeature && !propertiesCollapsed && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Propiedades
                    </h4>
                    <button
                      onClick={() => setPropertiesCollapsed(true)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Ocultar propiedades"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <PropertiesPanel
                    feature={selectedFeature}
                    layerType={selectedLayerType}
                    onClose={handleCloseProperties}
                    className="w-full"
                  />
                </div>
              )}

              {/* Botón para mostrar propiedades cuando está oculto */}
              {selectedFeature && propertiesCollapsed && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setPropertiesCollapsed(false)}
                    className="w-full p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    title="Mostrar propiedades"
                  >
                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar Propiedades</span>
                  </button>
                </div>
              )}
              
              {/* Estado vacío cuando no hay selección */}
              {!selectedFeature && (
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Selecciona un elemento del mapa para ver sus propiedades</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Sección Central - Mapa */}
        <div className="flex-1 relative bg-gray-50 dark:bg-gray-800">
          <DynamicProjectMap
            data={{
              allGeoJSONData: unidadesState.allGeoJSONData || {},
              // unidadesProyecto: unidadesProyecto // ⚠️ COMENTADO: Ya no necesario, datos vienen desde allGeoJSONData
            }}
            baseMapConfig={baseMaps[selectedBaseMap as keyof typeof baseMaps]}
            layerVisibility={layerVisibility}
            layerConfigs={layerConfigs}
            onFeatureClick={handleFeatureClick}
            height="100%"
            theme={theme}
          />
        </div>

        {/* Panel Derecho - Métricas */}
        <motion.div
          initial={false}
          animate={{ 
            width: rightPanelCollapsed ? '40px' : '300px'
          }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col"
        >
          {/* Header del panel derecho */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title={rightPanelCollapsed ? "Expandir panel" : "Contraer panel"}
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${rightPanelCollapsed ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {!rightPanelCollapsed && (
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-800 dark:text-white">Métricas</h3>
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
              )}
            </div>
          </div>

          {/* Contenido del panel derecho */}
          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">

              {/* Selector de tipo de gráfico */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Vista</h4>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setActiveChart('gauge')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      activeChart === 'gauge'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Activity className="w-3 h-3 mx-auto mb-0.5" />
                    Gauge
                  </button>
                  <button
                    onClick={() => setActiveChart('interventions')}
                    className={`p-1.5 rounded text-xs transition-colors ${
                      activeChart === 'interventions'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Settings className="w-3 h-3 mx-auto mb-0.5" />
                    Tipos
                  </button>
                </div>
              </div>

              {/* Área de gráficos */}
              <div className="space-y-3">
                {activeChart === 'gauge' && (
                  <ProgressGaugeChart 
                    data={geoJSONMetrics} 
                    showStates={true}
                    className="w-full"
                  />
                )}
                
                {activeChart === 'interventions' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                    <h3 className="text-sm font-medium mb-2">Intervenciones</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Total: {geoJSONMetrics.length} proyectos
                    </div>
                    <InterventionMetrics data={geoJSONMetrics} />
                  </div>
                )}
              </div>

              {/* Panel de información básica */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <h4 className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Estado</h4>
                <div className="space-y-0.5 text-xs text-blue-700 dark:text-blue-300">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{unidadesState.unidadesProyecto?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filtradas:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{geoJSONMetrics.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProjectMapWithPanels
