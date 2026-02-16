"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Table, 
  Search, 
  MapPin, 
  DollarSign, 
  Activity,
  Building2,
  Calendar,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight as ChevronRightPagination,
  ChevronsLeft,
  ChevronsRight,
  User,
  FileText,
  Clock,
  Target,
  Hash,
  X
} from 'lucide-react';
import { type AttributeData } from '@/services/unidades-proyecto.service';
import { formatCurrency } from '@/utils/formatCurrency';

// Tipo para intervenciones
interface IntervencionData {
  intervencion_id: string;
  upid: string;
  estado: string;
  tipo_intervencion: string;
  avance_obra: number;
  presupuesto_base: number;
  fecha_inicio: string;
  fecha_fin: string;
  nombre_centro_gestor: string;
  fuente_financiacion?: string;
  identificador?: string;
  clase_up?: string;
  bpin?: number;
  referencia_contrato?: string;
  referencia_proceso?: string;
  url_proceso?: string;
}

// Tipo para el grupo de monumentos
interface MonumentosGroupData {
  id: string;
  nombre: string;
  count: number;
  items: AttributeData[];
  presupuesto_total: number;
  avance_promedio: number;
  isGroup: true;
}

// Tipo union para manejar tanto datos individuales como grupos
type TableRowData = AttributeData | MonumentosGroupData;

// Helper para verificar si es un grupo
function isGroupRow(item: TableRowData): item is MonumentosGroupData {
  return 'isGroup' in item && item.isGroup === true;
}

interface UnidadesProyectoAttributesTableProps {
  data: AttributeData[];
  className?: string;
  maxHeight?: string;
  pageSize?: number;
  onRowClick?: (upid: string) => void; // Callback para cuando se hace clic en una fila
  focusedItem?: string | null; // UPID del elemento enfocado
  onShowDetails?: (upid: string) => void; // Callback para mostrar detalles en modal
}

// Componente de barra de progreso
const ProgressBar: React.FC<{ value: number; max: number; className?: string }> = ({ 
  value, 
  max = 100, 
  className = '' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColorClass = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getColorClass(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
};

// Función para truncar texto
const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Función para calcular duración del proyecto
const calculateProjectDuration = (fechaInicio: string, fechaFin: string): {
  duracion: string;
  estado: 'en-curso' | 'finalizado' | 'no-iniciado' | 'sin-fechas';
  fechas: string;
} => {
  if (!fechaInicio || !fechaFin) {
    return {
      duracion: 'N/A',
      estado: 'sin-fechas',
      fechas: fechaInicio || fechaFin || 'Sin fechas'
    };
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const hoy = new Date();
  
  const duracionMs = fin.getTime() - inicio.getTime();
  const duracionDias = Math.ceil(duracionMs / (1000 * 60 * 60 * 24));
  const duracionMeses = Math.round(duracionDias / 30);
  
  let estado: 'en-curso' | 'finalizado' | 'no-iniciado' | 'sin-fechas';
  if (hoy < inicio) estado = 'no-iniciado';
  else if (hoy > fin) estado = 'finalizado';
  else estado = 'en-curso';
  
  let duracionTexto: string;
  if (duracionMeses >= 12) {
    const años = Math.round(duracionMeses / 12);
    duracionTexto = `${años} año${años > 1 ? 's' : ''}`;
  } else if (duracionMeses > 0) {
    duracionTexto = `${duracionMeses} mes${duracionMeses > 1 ? 'es' : ''}`;
  } else {
    duracionTexto = `${duracionDias} día${duracionDias > 1 ? 's' : ''}`;
  }
  
  const fechasFormateadas = `${inicio.toLocaleDateString('es-CO')} - ${fin.toLocaleDateString('es-CO')}`;
  
  return {
    duracion: duracionTexto,
    estado,
    fechas: fechasFormateadas
  };
};

// Función para formatear fechas
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString; // Retorna la fecha original si no se puede parsear
  }
};

// Función para calcular duración del proyecto
const calculateDuration = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return 'N/A';
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} días`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} meses`;
    return `${Math.round(diffDays / 365)} años`;
  } catch {
    return 'N/A';
  }
};

// Función para obtener estado de avance
const getProgressStatus = (progress: number): { color: string; label: string } => {
  if (progress >= 100) return { color: 'text-green-600 dark:text-green-400', label: 'Completado' };
  if (progress >= 80) return { color: 'text-blue-600 dark:text-blue-400', label: 'Avanzado' };
  if (progress >= 60) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'En progreso' };
  if (progress >= 40) return { color: 'text-orange-600 dark:text-orange-400', label: 'Intermedio' };
  if (progress > 0) return { color: 'text-red-600 dark:text-red-400', label: 'Inicial' };
  return { color: 'text-gray-600 dark:text-gray-400', label: 'Sin iniciar' };
};

const UnidadesProyectoAttributesTable: React.FC<UnidadesProyectoAttributesTableProps> = ({
  data,
  className = '',
  maxHeight = '500px',
  pageSize = 20,
  onRowClick,
  focusedItem = null,
  onShowDetails
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AttributeData;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'complete'>('complete');
  
  // Estado para controlar la expansión de grupos
  const [isSubsidiosExpanded, setIsSubsidiosExpanded] = useState(false);
  const [isMonumentosExpanded, setIsMonumentosExpanded] = useState(false);
  const [isBanderasExpanded, setIsBanderasExpanded] = useState(false);
  
  // Estados para expansión de UPs individuales y sus intervenciones
  const [expandedUPs, setExpandedUPs] = useState<Set<string>>(new Set());
  const [intervencionesCache, setIntervencionesCache] = useState<Record<string, IntervencionData[]>>({});
  const [loadingIntervenciones, setLoadingIntervenciones] = useState<Set<string>>(new Set());
  
  // Variables sintéticas calculadas por UP (avance promedio e inversión total)
  const [syntheticMetrics, setSyntheticMetrics] = useState<Record<string, { avance: number; inversion: number }>>({});
  
  const [visibleColumns, setVisibleColumns] = useState({
    upid: true,
    intervencion_id: false, // ID único de la intervención
    nombre_up: true,
    nombre_up_detalle: false,
    identificador: false,
    estado: true, // Mostrar en intervenciones, ocultar en UP (lógica condicional)
    tipo_intervencion: true, // Mostrar en intervenciones, ocultar en UP (lógica condicional)
    tipo_equipamiento: false,
    clase_up: false,
    frente_activo: true, // Importante para intervenciones
    avance: true, // Variable sintética: promedio de avance_obra
    inversion: true, // Variable sintética: suma de presupuesto_base
    nombre_centro_gestor: true, // Mostrar en intervenciones, ocultar en UP (lógica condicional)
    ubicacion: true, // Barrio y comuna combinados
    fuente_financiacion: false,
    duracion_proyecto: false,
    fecha_inicio: false,
    fecha_fin: false,
    fecha_inauguracion: false,
    ano: true, // Año de la intervención, importante
    descripcion_intervencion: false,
    acciones: false // Oculto en ambos niveles
  });

  // Datos filtrados, ordenados y paginados con agrupación de monumentos
  const { filteredData, paginatedData, totalPages, totalItems, monumentosGroup } = useMemo(() => {
    let filtered = data;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(item =>
        item.upid.toLowerCase().includes(term) ||
        item.nombre_up.toLowerCase().includes(term) ||
        (item.nombre_up_detalle && item.nombre_up_detalle.toLowerCase().includes(term)) ||
        (item.identificador && item.identificador.toLowerCase().includes(term)) ||
        item.estado.toLowerCase().includes(term) ||
        item.tipo_intervencion.toLowerCase().includes(term) ||
        (item.tipo_equipamiento && item.tipo_equipamiento.toLowerCase().includes(term)) ||
        (item.frente_activo && item.frente_activo.toLowerCase().includes(term)) ||
        (item.nombre_centro_gestor && item.nombre_centro_gestor.toLowerCase().includes(term)) ||
        item.barrio_vereda.toLowerCase().includes(term) ||
        item.comuna_corregimiento.toLowerCase().includes(term) ||
        item.fuente_financiacion.toLowerCase().includes(term) ||
        item.descripcion_intervencion.toLowerCase().includes(term) ||
        item.ano.toString().includes(term)
      );
    }

    // Función auxiliar para crear grupo
    const createGroup = (id: string, nombre: string, items: AttributeData[]): MonumentosGroupData => ({
      id,
      nombre,
      count: items.length,
      items,
      presupuesto_total: items.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0),
      avance_promedio: items.length > 0 ? items.reduce((sum, item) => sum + (item.avance_obra || 0), 0) / items.length : 0,
      isGroup: true as const
    });

    // Separar grupos especiales del resto de datos
    const subsidios = filtered.filter(item => 
      item.clase_up && item.clase_up.toLowerCase() === 'subsidios'
    );
    
    const monumentos = filtered.filter(item => {
      const nombreLower = (item.nombre_up || '').toLowerCase();
      const detalleLower = (item.nombre_up_detalle || '').toLowerCase();
      return nombreLower.includes('monumentos') || detalleLower.includes('monumentos');
    });
    
    const banderas = filtered.filter(item => {
      const nombreLower = (item.nombre_up || '').toLowerCase();
      const detalleLower = (item.nombre_up_detalle || '').toLowerCase();
      return nombreLower.includes('banderas') || detalleLower.includes('banderas');
    });

    // Datos que no pertenecen a ningún grupo
    const noAgrupados = filtered.filter(item => {
      const nombreLower = (item.nombre_up || '').toLowerCase();
      const detalleLower = (item.nombre_up_detalle || '').toLowerCase();
      const claseUpLower = (item.clase_up || '').toLowerCase();
      
      const esSubsidio = claseUpLower === 'subsidios';
      const esMonumento = nombreLower.includes('monumentos') || detalleLower.includes('monumentos');
      const esBandera = nombreLower.includes('banderas') || detalleLower.includes('banderas');
      
      return !esSubsidio && !esMonumento && !esBandera;
    });

    // Crear grupos
    const subsidiosGroup: MonumentosGroupData | null = subsidios.length > 0 
      ? createGroup('subsidios-grupo', '💰 Subsidios Municipales', subsidios) 
      : null;
      
    const monumentosGroup: MonumentosGroupData | null = monumentos.length > 0 
      ? createGroup('monumentos-culturales', '🏛️ Monumentos Culturales', monumentos) 
      : null;
      
    const banderasGroup: MonumentosGroupData | null = banderas.length > 0 
      ? createGroup('banderas-grupo', '🚩 Banderas', banderas) 
      : null;

    // Ordenar datos no agrupados
    let sortedNoAgrupados = noAgrupados;
    if (sortConfig) {
      sortedNoAgrupados = [...noAgrupados].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      });
    }

    // Crear la lista final para mostrar: primero los datos individuales, luego los grupos colapsados
    let finalData: TableRowData[] = [...sortedNoAgrupados];
    
    // Agregar grupos AL FINAL para reducir ruido visual
    if (subsidiosGroup) {
      if (isSubsidiosExpanded) {
        finalData.push(...subsidios);
      } else {
        finalData.push(subsidiosGroup);
      }
    }
    
    if (monumentosGroup) {
      if (isMonumentosExpanded) {
        finalData.push(...monumentos);
      } else {
        finalData.push(monumentosGroup);
      }
    }
    
    if (banderasGroup) {
      if (isBanderasExpanded) {
        finalData.push(...banderas);
      } else {
        finalData.push(banderasGroup);
      }
    }

    // Calcular paginación
    const totalPages = Math.ceil(finalData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = finalData.slice(startIndex, endIndex);

    return {
      filteredData: finalData,
      paginatedData,
      totalPages,
      totalItems: finalData.length,
      monumentosGroup
    };
  }, [data, searchTerm, sortConfig, currentPage, itemsPerPage, isMonumentosExpanded, isBanderasExpanded, isSubsidiosExpanded]);

  // Función para manejar la expansión del grupo de monumentos
  // Funciones para manejar la expansión de cada grupo
  const handleToggleSubsidios = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSubsidiosExpanded(!isSubsidiosExpanded);
  };
  
  const handleToggleMonumentos = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMonumentosExpanded(!isMonumentosExpanded);
  };
  
  const handleToggleBanderas = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsBanderasExpanded(!isBanderasExpanded);
  };

  // Manejar ordenamiento
  const handleSort = (key: keyof AttributeData) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
    // Resetear a la primera página al ordenar
    setCurrentPage(1);
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Manejar cambio de elementos por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Manejar cambio de término de búsqueda
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  // Manejar navegación con teclado
  const handleKeyNavigation = (event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (currentPage > 1) handlePageChange(currentPage - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentPage < totalPages) handlePageChange(currentPage + 1);
          break;
        case 'Home':
          event.preventDefault();
          handlePageChange(1);
          break;
        case 'End':
          event.preventDefault();
          handlePageChange(totalPages);
          break;
      }
    }
  };

  // Función para toggle la expansión de una UP y cargar sus intervenciones
  const toggleUPExpansion = async (upid: string) => {
    const isCurrentlyExpanded = expandedUPs.has(upid);
    
    // Toggle expansión
    setExpandedUPs(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyExpanded) {
        newSet.delete(upid);
      } else {
        newSet.add(upid);
      }
      return newSet;
    });
    
    // Si se está expandiendo y no tenemos las intervenciones en cache, cargarlas
    if (!isCurrentlyExpanded && !intervencionesCache[upid]) {
      setLoadingIntervenciones(prev => new Set(prev).add(upid));
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/intervenciones?upid=${upid}&limit=10000`);
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        const intervenciones: IntervencionData[] = data.data || [];
        
        console.log(`✅ Loaded ${intervenciones.length} intervenciones for UP ${upid}`);
        
        // Calcular variables sintéticas
        const avance = intervenciones.length > 0
          ? intervenciones.reduce((sum, int) => sum + (int.avance_obra || 0), 0) / intervenciones.length
          : 0;
        const inversion = intervenciones.reduce((sum, int) => sum + (int.presupuesto_base || 0), 0);
        
        // Guardar variables sintéticas
        setSyntheticMetrics(prev => ({
          ...prev,
          [upid]: { avance, inversion }
        }));
        
        // Guardar en cache
        setIntervencionesCache(prev => ({
          ...prev,
          [upid]: intervenciones
        }));
        
      } catch (error) {
        console.error(`❌ Error loading intervenciones for UP ${upid}:`, error);
        // Guardar array vacío y métricas en 0 para evitar reintentos
        setIntervencionesCache(prev => ({
          ...prev,
          [upid]: []
        }));
        setSyntheticMetrics(prev => ({
          ...prev,
          [upid]: { avance: 0, inversion: 0 }
        }));
      } finally {
        setLoadingIntervenciones(prev => {
          const newSet = new Set(prev);
          newSet.delete(upid);
          return newSet;
        });
      }
    }
  };

  // Cargar métricas sintéticas para las UPs de la página actual
  React.useEffect(() => {
    const loadMetricsForVisibleUPs = async () => {
      if (!paginatedData || paginatedData.length === 0) return;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Cargar intervenciones para cada UP visible que no esté en cache
      for (const item of paginatedData) {
        if (isGroupRow(item)) {
          continue;
        }

        const upid = item.upid;
        
        // Si ya tenemos las métricas o están cargando, skip
        if (syntheticMetrics[upid] || loadingIntervenciones.has(upid)) continue;
        
        // Si ya están en cache, calcular métricas
        if (intervencionesCache[upid]) {
          const intervenciones = intervencionesCache[upid];
          const avance = intervenciones.length > 0
            ? intervenciones.reduce((sum, int) => sum + (int.avance_obra || 0), 0) / intervenciones.length
            : 0;
          const inversion = intervenciones.reduce((sum, int) => sum + (int.presupuesto_base || 0), 0);
          
          setSyntheticMetrics(prev => ({
            ...prev,
            [upid]: { avance, inversion }
          }));
          continue;
        }
        
        // Cargar intervenciones desde API
        setLoadingIntervenciones(prev => new Set(prev).add(upid));
        
        try {
          const response = await fetch(`${apiUrl}/intervenciones?upid=${upid}&limit=10000`);
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const data = await response.json();
          const intervenciones: IntervencionData[] = data.data || [];
          
          // Calcular variables sintéticas
          const avance = intervenciones.length > 0
            ? intervenciones.reduce((sum, int) => sum + (int.avance_obra || 0), 0) / intervenciones.length
            : 0;
          const inversion = intervenciones.reduce((sum, int) => sum + (int.presupuesto_base || 0), 0);
          
          // Guardar variables sintéticas
          setSyntheticMetrics(prev => ({
            ...prev,
            [upid]: { avance, inversion }
          }));
          
          // Guardar en cache
          setIntervencionesCache(prev => ({
            ...prev,
            [upid]: intervenciones
          }));
          
        } catch (error) {
          console.error(`❌ Error loading intervenciones for UP ${upid}:`, error);
          // Guardar métricas en 0 para evitar reintentos
          setSyntheticMetrics(prev => ({
            ...prev,
            [upid]: { avance: 0, inversion: 0 }
          }));
          setIntervencionesCache(prev => ({
            ...prev,
            [upid]: []
          }));
        } finally {
          setLoadingIntervenciones(prev => {
            const newSet = new Set(prev);
            newSet.delete(upid);
            return newSet;
          });
        }
      }
    };
    
    loadMetricsForVisibleUPs();
  }, [paginatedData, currentPage]); // Recargar cuando cambie la página

  // Alternar visibilidad de columnas
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  // Alternar entre vista compacta y completa
  const toggleViewMode = () => {
    const newMode = viewMode === 'compact' ? 'complete' : 'compact';
    setViewMode(newMode);
    
    if (newMode === 'compact') {
      // Vista compacta: mostrar solo campos esenciales
      setVisibleColumns({
        upid: true,
        nombre_up: true,
        identificador: false,
        estado: true,
        tipo_equipamiento: false,
        tipo_intervencion: false,
        frente_activo: false,
        clase_up: false,
        avance: true,
        inversion: true,
        ubicacion: true,
        nombre_centro_gestor: true, // Mantener visible incluso en vista compacta
        fuente_financiacion: false,
        duracion_proyecto: false,
        fecha_inicio: false,
        fecha_fin: false,
        fecha_inauguracion: false,
        ano: false,
        descripcion_intervencion: false,
        acciones: true
      });
    } else {
      // Vista completa: mostrar todos los campos relevantes
      setVisibleColumns({
        upid: true,
        nombre_up: true,
        identificador: false,
        estado: true,
        tipo_intervencion: true,
        tipo_equipamiento: true,
        frente_activo: true,
        clase_up: true,
        avance: true,
        inversion: true,
        nombre_centro_gestor: true,
        ubicacion: true,
        fuente_financiacion: true,
        duracion_proyecto: true,
        fecha_inicio: false,
        fecha_fin: false,
        fecha_inauguracion: false,
        ano: true,
        descripcion_intervencion: true, // Incluir descripción en vista completa
        acciones: true
      });
    }
  };

  // Componente de header de columna
  const ColumnHeader: React.FC<{
    label: string;
    sortKey: keyof AttributeData;
    icon?: React.ReactNode;
  }> = ({ label, sortKey, icon }) => (
    <th 
      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        {icon}
        <span>{label}</span>
        {sortConfig?.key === sortKey && (
          <span className="ml-1">
            {sortConfig.direction === 'asc' ? 
              <ChevronUp className="w-3 h-3" /> : 
              <ChevronDown className="w-3 h-3" />
            }
          </span>
        )}
      </div>
    </th>
  );

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <Table className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay datos de atributos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      onKeyDown={handleKeyNavigation}
      tabIndex={0}
    >
      {/* Header con controles - Mejorado para tablets */}
      <div className="px-4 tablet:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-3 tablet:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base tablet:text-lg font-semibold text-gray-900 dark:text-white">
              Intervenciones en el territorio
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalItems} de {data.length}
            </span>
          </div>

          {/* Controles adaptados para tablets */}
          <div className="flex flex-col tablet:flex-row items-stretch tablet:items-center space-y-2 tablet:space-y-0 tablet:space-x-3">
            {/* Buscador - Ancho completo en móvil, normal en tablet+ */}
            <div className="relative order-1 w-full tablet:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por UPID, nombre, centro gestor..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full tablet:w-64 lg:w-80"
              />
            </div>

            {/* Controles de vista - Flexibles en tablets */}
            <div className="flex items-center space-x-2 order-2">
              {/* Botón vista compacta/completa */}
              <button
                onClick={toggleViewMode}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'complete'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={viewMode === 'complete' ? 'Cambiar a vista compacta' : 'Cambiar a vista completa'}
              >
                <Table className="w-4 h-4" />
                <span className="hidden tablet:inline">{viewMode === 'complete' ? 'Completa' : 'Compacta'}</span>
              </button>

              {/* Control de columnas visibles - Solo icono en móvil */}
              <div className="relative group">
                <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="hidden tablet:inline">Columnas</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                    {Object.entries(visibleColumns).map(([key, visible]) => (
                      <label key={key} className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador de scroll horizontal en tablets */}
        <div className="mt-3 tablet:block lg:hidden">
          <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span>Desliza horizontalmente para ver más columnas</span>
          </div>
        </div>
      </div>

      {/* Tabla con scroll horizontal para tablets */}
      <div className="overflow-hidden">
        {/* Wrapper para scroll horizontal en tablets y móviles */}
        <div className="overflow-x-auto tablet:overflow-x-auto md:overflow-x-auto lg:overflow-x-visible">
          <div 
            className="overflow-y-auto min-w-full"
            style={{ maxHeight }}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 tablet:min-w-[1200px] md:min-w-[1200px] lg:min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                <tr>
                {visibleColumns.upid && (
                  <ColumnHeader 
                    label="UPID" 
                    sortKey="upid" 
                    icon={<Building2 className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.intervencion_id && (
                  <ColumnHeader 
                    label="ID Intervención" 
                    sortKey="intervencion_id" 
                    icon={<Hash className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.nombre_up && (
                  <ColumnHeader 
                    label="Nombre UP" 
                    sortKey="nombre_up" 
                    icon={<Activity className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.nombre_up_detalle && (
                  <ColumnHeader 
                    label="Detalle" 
                    sortKey="nombre_up_detalle" 
                    icon={<FileText className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.identificador && (
                  <ColumnHeader 
                    label="Identificador" 
                    sortKey="identificador" 
                    icon={<Hash className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.avance && (
                  <ColumnHeader 
                    label="Avance" 
                    sortKey="avance_obra" 
                    icon={<Activity className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.inversion && (
                  <ColumnHeader 
                    label="Inversión" 
                    sortKey="presupuesto_base" 
                    icon={<DollarSign className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.ubicacion && (
                  <ColumnHeader 
                    label="Ubicación" 
                    sortKey="barrio_vereda" 
                    icon={<MapPin className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.estado && (
                  <ColumnHeader 
                    label="Estado" 
                    sortKey="estado" 
                    icon={<Calendar className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.tipo_intervencion && (
                  <ColumnHeader 
                    label="Tipo" 
                    sortKey="tipo_intervencion" 
                    icon={<Building2 className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.tipo_equipamiento && (
                  <ColumnHeader 
                    label="Equipamiento" 
                    sortKey="tipo_equipamiento" 
                    icon={<Building2 className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.frente_activo && (
                  <ColumnHeader 
                    label="Frente Activo" 
                    sortKey="frente_activo" 
                    icon={<Target className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.clase_up && (
                  <ColumnHeader 
                    label="Clase UP" 
                    sortKey="clase_up" 
                    icon={<Target className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.nombre_centro_gestor && (
                  <ColumnHeader 
                    label="Centro Gestor" 
                    sortKey="nombre_centro_gestor" 
                    icon={<User className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.fuente_financiacion && (
                  <ColumnHeader 
                    label="Fuente Financiación" 
                    sortKey="fuente_financiacion" 
                    icon={<DollarSign className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.duracion_proyecto && (
                  <ColumnHeader 
                    label="Duración" 
                    sortKey="fecha_inicio" 
                    icon={<Calendar className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.fecha_inicio && (
                  <ColumnHeader 
                    label="Fecha Inicio" 
                    sortKey="fecha_inicio" 
                    icon={<Calendar className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.fecha_fin && (
                  <ColumnHeader 
                    label="Fecha Fin" 
                    sortKey="fecha_fin" 
                    icon={<Clock className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.fecha_inauguracion && (
                  <ColumnHeader 
                    label="Fecha Inauguración" 
                    sortKey="fecha_inauguracion" 
                    icon={<Target className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.acciones && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Acciones</span>
                    </div>
                  </th>
                )}
                {visibleColumns.ano && (
                  <ColumnHeader 
                    label="Año" 
                    sortKey="ano" 
                    icon={<Clock className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.descripcion_intervencion && (
                  <ColumnHeader 
                    label="Descripción" 
                    sortKey="descripcion_intervencion" 
                    icon={<FileText className="w-3 h-3" />} 
                  />
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.map((row: TableRowData, index: number) => {
                // Si es un grupo, renderizar fila especial
                if (isGroupRow(row)) {
                  // Determinar el tipo de grupo y su configuración basándose en el ID exacto
                  let groupConfig;
                  if (row.id === 'subsidios-grupo') {
                    groupConfig = { handler: handleToggleSubsidios, expanded: isSubsidiosExpanded, color: 'green', emoji: '💰' };
                  } else if (row.id === 'monumentos-culturales') {
                    groupConfig = { handler: handleToggleMonumentos, expanded: isMonumentosExpanded, color: 'purple', emoji: '🏛️' };
                  } else if (row.id === 'banderas-grupo') {
                    groupConfig = { handler: handleToggleBanderas, expanded: isBanderasExpanded, color: 'blue', emoji: '🚩' };
                  } else {
                    // Fallback por si acaso
                    groupConfig = { handler: () => {}, expanded: false, color: 'gray', emoji: '📁' };
                  }
                    
                  const borderColor = `border-${groupConfig.color}-500`;
                  const bgFrom = `from-${groupConfig.color}-50`;
                  const bgTo = `to-${groupConfig.color}-100`;
                  const textColor = `text-${groupConfig.color}-600`;
                  
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      onClick={() => groupConfig.handler()}
                      className={`bg-gradient-to-r ${bgFrom} ${bgTo} dark:from-${groupConfig.color}-900/20 dark:to-${groupConfig.color}-900/20 hover:from-${groupConfig.color}-100 hover:to-${groupConfig.color}-200 dark:hover:from-${groupConfig.color}-900/30 dark:hover:to-${groupConfig.color}-900/30 transition-all duration-200 cursor-pointer border-l-4 ${borderColor}`}
                      style={{ height: 'auto' }}
                    >
                      {visibleColumns.upid && (
                        <td className={`px-3 py-4 whitespace-nowrap text-sm font-medium ${textColor} dark:${textColor}`}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>GRUPO</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.nombre_up && (
                        <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {groupConfig.expanded ? (
                                <ChevronDown className={`w-5 h-5 ${textColor} dark:${textColor}`} />
                              ) : (
                                <ChevronRight className={`w-5 h-5 ${textColor} dark:${textColor}`} />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className={`font-bold text-${groupConfig.color}-900 dark:text-${groupConfig.color}-200 leading-tight break-words whitespace-normal`}>
                                {groupConfig.emoji} {row.nombre}
                              </div>
                              <div className={`text-xs ${textColor} dark:${textColor} leading-tight break-words whitespace-normal`}>
                                {row.count} elementos agrupados • Click para {groupConfig.expanded ? 'colapsar' : 'expandir'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.identificador && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Hash className="w-3 h-3" />
                            <span className="text-xs">Agrupación</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.avance_obra && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <ProgressBar value={row.avance_promedio || 0} max={100} />
                            <div className={`text-xs font-medium ${getProgressStatus(row.avance_promedio || 0).color}`}>
                              <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>Promedio del grupo</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.presupuesto_base && (
                        <td className={`px-3 py-4 whitespace-nowrap text-sm font-bold ${textColor} dark:${textColor}`}>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatCurrency(row.presupuesto_total || 0)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Total del grupo
                          </div>
                        </td>
                      )}
                      {visibleColumns.ubicacion && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">Múltiples ubicaciones</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.estado && (
                        <td className="px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-${groupConfig.color}-100 text-${groupConfig.color}-800 dark:bg-${groupConfig.color}-900 dark:text-${groupConfig.color}-200`}>
                            <Building2 className="w-3 h-3 mr-1" />
                            Grupo ({row.count})
                          </span>
                        </td>
                      )}
                      {visibleColumns.tipo_intervencion && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="text-xs">{row.nombre}</div>
                        </td>
                      )}
                      {visibleColumns.nombre_centro_gestor && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span className="text-xs">Múltiples centros</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.fuente_financiacion && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-xs">Múltiples fuentes</span>
                        </td>
                      )}
                      {visibleColumns.duracion_proyecto && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-xs">Ver individual</span>
                        </td>
                      )}
                      {visibleColumns.ano && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-xs">Múltiples años</span>
                        </td>
                      )}
                      {visibleColumns.descripcion_intervencion && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="text-xs">Ver individual</span>
                        </td>
                      )}
                      {visibleColumns.acciones && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleToggleMonumentos(e)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors"
                              title={isMonumentosExpanded ? 'Colapsar grupo' : 'Expandir grupo'}
                            >
                              {isMonumentosExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Colapsar
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Expandir
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  );
                }

                // Si es un elemento individual, renderizar normalmente
                const item = row as AttributeData;
                const isFocused = focusedItem === item.upid;
                const isExpanded = expandedUPs.has(item.upid);
                const intervenciones = intervencionesCache[item.upid] || [];
                const isLoadingIntervs = loadingIntervenciones.has(item.upid);
                
                return (
                  <React.Fragment key={item.upid}>
                    {/* Fila principal de la UP */}
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      onClick={() => onRowClick && onRowClick(item.upid)}
                      className={`transition-colors ${
                        isFocused 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      style={{ height: 'auto' }}
                    >
                      {visibleColumns.upid && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUPExpansion(item.upid);
                              }}
                              className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title={isExpanded ? 'Ocultar intervenciones' : 'Ver intervenciones'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {item.upid}
                            </span>
                            {intervenciones.length > 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {intervenciones.length}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                  {visibleColumns.nombre_up && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="font-medium leading-tight break-words whitespace-normal">
                          {item.nombre_up}
                        </div>
                        {item.nombre_up_detalle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight break-words whitespace-normal">
                            {item.nombre_up_detalle}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.identificador && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="font-mono text-xs" title={item.identificador}>
                        {item.identificador || 'N/A'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.avance && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {syntheticMetrics[item.upid] ? (
                        <div className="space-y-1">
                          <ProgressBar value={syntheticMetrics[item.upid].avance || 0} max={100} />
                          <div className={`text-xs font-medium ${getProgressStatus(syntheticMetrics[item.upid].avance || 0).color}`}>
                            <div className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>{getProgressStatus(syntheticMetrics[item.upid].avance || 0).label} (Promedio)</span>
                            </div>
                          </div>
                        </div>
                      ) : loadingIntervenciones.has(item.upid) ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Sin datos</div>
                      )}
                    </td>
                  )}
                  {visibleColumns.inversion && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {syntheticMetrics[item.upid] ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-base">{formatCurrency(syntheticMetrics[item.upid].inversion || 0)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Inversión total</div>
                        </div>
                      ) : loadingIntervenciones.has(item.upid) ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">Sin datos</div>
                      )}
                    </td>
                  )}
                  {visibleColumns.ubicacion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900 dark:text-white leading-tight break-words whitespace-normal">
                          {item.barrio_vereda || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight break-words whitespace-normal">
                          {item.comuna_corregimiento || 'N/A'}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.tipo_equipamiento && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="leading-tight break-words whitespace-normal">
                        {item.tipo_equipamiento || 'N/A'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.frente_activo && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="leading-tight break-words whitespace-normal">
                        {item.frente_activo || 'N/A'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.clase_up && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="leading-tight break-words whitespace-normal">
                        {item.clase_up || 'N/A'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.fuente_financiacion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-normal leading-tight break-words max-w-full ${
                          item.fuente_financiacion.toLowerCase().includes('nacional') 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : item.fuente_financiacion.toLowerCase().includes('departamental')
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : item.fuente_financiacion.toLowerCase().includes('municipal')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {item.fuente_financiacion}
                        </span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.duracion_proyecto && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const duracionInfo = calculateProjectDuration(item.fecha_inicio, item.fecha_fin);
                        return (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              <span className="font-medium">{duracionInfo.duracion}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {duracionInfo.fechas}
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  {visibleColumns.fecha_inicio && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span>{formatDate(item.fecha_inicio)}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.fecha_fin && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span>{formatDate(item.fecha_fin)}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.fecha_inauguracion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Target className="w-3 h-3 text-purple-500" />
                        <span>{formatDate(item.fecha_inauguracion)}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.ano && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.ano}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.descripcion_intervencion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                      <div className="flex items-start space-x-2">
                        <FileText className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed break-words whitespace-normal">
                          {item.descripcion_intervencion}
                        </span>
                      </div>
                    </td>
                  )}
                </motion.tr>
                
                {/* Filas de intervenciones expandidas */}
                {isExpanded && (
                  <>
                    {isLoadingIntervs && (
                      <tr className="bg-blue-50 dark:bg-blue-900/10">
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Cargando intervenciones...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {!isLoadingIntervs && intervenciones.length === 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-700/30">
                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No hay intervenciones registradas para esta unidad de proyecto
                        </td>
                      </tr>
                    )}
                    
                    {!isLoadingIntervs && intervenciones.map((intervencion: IntervencionData, idx: number) => (
                      <motion.tr
                        key={intervencion.intervencion_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-300 dark:border-blue-700"
                      >
                        {visibleColumns.upid && (
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2 pl-8">
                              <Activity className="w-3 h-3 text-blue-500" />
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                {intervencion.intervencion_id}
                              </span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.intervencion_id && (
                          <td className="px-3 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                            {intervencion.intervencion_id}
                          </td>
                        )}
                        {visibleColumns.nombre_up && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="text-xs italic">
                              {intervencion.identificador || 'Sin identificador'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.nombre_up_detalle && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                        {visibleColumns.identificador && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="font-mono text-xs">
                              {intervencion.identificador || 'N/A'}
                            </div>
                          </td>
                        )}
                        {visibleColumns.avance && (
                          <td className="px-3 py-4 whitespace-nowrap text-sm">
                            <div className="space-y-1">
                              <ProgressBar value={intervencion.avance_obra || 0} max={100} />
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {(intervencion.avance_obra || 0).toFixed(1)}%
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.inversion && (
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                            <div className="space-y-1">
                              <div>{formatCurrency(intervencion.presupuesto_base || 0)}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Presupuesto</div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.ubicacion && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                        {visibleColumns.estado && (
                          <td className="px-3 py-4 text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              intervencion.estado.toLowerCase().includes('terminado') || intervencion.estado.toLowerCase().includes('inaugurado')
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : intervencion.estado.toLowerCase().includes('ejecución')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : intervencion.estado.toLowerCase().includes('alistamiento')
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {intervencion.estado}
                            </span>
                          </td>
                        )}
                        {visibleColumns.tipo_intervencion && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {intervencion.tipo_intervencion}
                          </td>
                        )}
                        {visibleColumns.tipo_equipamiento && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {intervencion.clase_up || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.frente_activo && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                        {visibleColumns.clase_up && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {intervencion.clase_up || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.nombre_centro_gestor && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-start space-x-2">
                              <User className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                              <span className="text-xs">{intervencion.nombre_centro_gestor}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.fuente_financiacion && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {intervencion.fuente_financiacion || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.duracion_proyecto && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {calculateDuration(intervencion.fecha_inicio, intervencion.fecha_fin)}
                          </td>
                        )}
                        {visibleColumns.fecha_inicio && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              <span className="text-xs">{formatDate(intervencion.fecha_inicio)}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.fecha_fin && (
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-orange-500" />
                              <span className="text-xs">{formatDate(intervencion.fecha_fin)}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.fecha_inauguracion && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                        {visibleColumns.ano && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                        {visibleColumns.descripcion_intervencion && (
                          <td className="px-3 py-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-xs">—</span>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </>
                )}
              </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            {/* Selector de elementos por página */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">por página</span>
            </div>

            {/* Información de paginación y navegación rápida */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
                {' '}({totalItems} registros)
              </span>
              
              {/* Ir a página específica */}
              {totalPages > 10 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ir a:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                      handlePageChange(page);
                    }}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Escriba el número de página y presione Enter"
                  />
                </div>
              )}
              
              {/* Ayuda de navegación con teclado */}
              <div className="hidden lg:block">
                <span 
                  className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
                  title="Ctrl+← Página anterior | Ctrl+→ Página siguiente | Ctrl+Home Primera página | Ctrl+End Última página"
                >
                  ⌨️ Atajos
                </span>
              </div>

              {/* Controles de navegación */}
              <div className="flex items-center space-x-1">
                {/* Primera página */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Primera página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Página anterior */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pageNumbers = [];
                    const maxVisiblePages = 5;
                    const halfVisible = Math.floor(maxVisiblePages / 2);
                    
                    let startPage = Math.max(1, currentPage - halfVisible);
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            i === currentPage
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    return pageNumbers;
                  })()}
                </div>

                {/* Página siguiente */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRightPagination className="w-4 h-4" />
                </button>

                {/* Última página */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer con información - Responsivo para tablets */}
      {paginatedData.length > 0 && (
        <div className="px-4 tablet:px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col tablet:flex-row tablet:items-center tablet:justify-between space-y-2 tablet:space-y-0 text-sm text-gray-600 dark:text-gray-400">
            <div className="text-center tablet:text-left">
              Mostrando{' '}
              <span className="font-medium">
                {((currentPage - 1) * itemsPerPage) + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>
              {' '}de{' '}
              <span className="font-medium">{totalItems}</span> unidades de proyecto
              {totalItems !== data.length && (
                <span className="block tablet:inline text-gray-400 text-xs tablet:text-sm mt-1 tablet:mt-0">
                  <span className="hidden tablet:inline"> (</span>
                  filtradas de {data.length} totales
                  <span className="hidden tablet:inline">)</span>
                </span>
              )}
            </div>
            {searchTerm && (
              <div className="text-center tablet:text-right">
                <span className="text-xs tablet:text-sm">
                  Filtrados por: <span className="font-medium text-blue-600 dark:text-blue-400">&quot;{searchTerm}&quot;</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UnidadesProyectoAttributesTable;