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
  
  // Estado para controlar la expansión del grupo de monumentos
  const [isMonumentosExpanded, setIsMonumentosExpanded] = useState(false);
  
  const [visibleColumns, setVisibleColumns] = useState({
    upid: true,
    nombre_up: true,
    identificador: false, // Nueva columna de identificador (oculta por defecto)
    estado: true,
    tipo_intervencion: false,
    tipo_equipamiento: false,
    clase_up: false, // ⬅️ NUEVA COLUMNA
    avance_obra: true,
    presupuesto_base: true,
    nombre_centro_gestor: true, // Mostrar por defecto ya que el usuario lo necesita completo
    ubicacion: true, // Nueva columna unificada de barrio y comuna
    fuente_financiacion: false,
    duracion_proyecto: false, // Nueva columna combinada de fechas
    fecha_inicio: false, // ⬅️ NUEVA COLUMNA
    fecha_fin: false, // ⬅️ NUEVA COLUMNA
    fecha_inauguracion: false, // ⬅️ NUEVA COLUMNA
    ano: false,
    descripcion_intervencion: false,
    acciones: true // Nueva columna de acciones
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
        item.nombre_centro_gestor.toLowerCase().includes(term) ||
        item.barrio_vereda.toLowerCase().includes(term) ||
        item.comuna_corregimiento.toLowerCase().includes(term) ||
        item.fuente_financiacion.toLowerCase().includes(term) ||
        item.descripcion_intervencion.toLowerCase().includes(term) ||
        item.ano.toString().includes(term)
      );
    }

    // Separar monumentos del resto de datos
    const monumentos = filtered.filter(item => 
      item.nombre_up.toLowerCase().includes('monumentos')
    );
    const noMonumentos = filtered.filter(item => 
      !item.nombre_up.toLowerCase().includes('monumentos')
    );

    // Crear grupo de monumentos si hay elementos
    const monumentosGroup: MonumentosGroupData | null = monumentos.length > 0 ? {
      id: 'monumentos-culturales',
      nombre: 'Monumentos Culturales de la Ciudad',
      count: monumentos.length,
      items: monumentos,
      presupuesto_total: monumentos.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0),
      avance_promedio: monumentos.reduce((sum, item) => sum + (item.avance_obra || 0), 0) / monumentos.length,
      isGroup: true as const
    } : null;

    // Ordenar datos no agrupados
    let sortedNoMonumentos = noMonumentos;
    if (sortConfig) {
      sortedNoMonumentos = [...noMonumentos].sort((a, b) => {
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

    // Crear la lista final para mostrar
    let finalData: TableRowData[] = [...sortedNoMonumentos];
    
    // Agregar el grupo de monumentos AL FINAL si existe
    if (monumentosGroup) {
      // Si está expandido, agregar los monumentos individuales al final
      if (isMonumentosExpanded) {
        let sortedMonumentos = monumentos;
        if (sortConfig) {
          sortedMonumentos = [...monumentos].sort((a, b) => {
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
        // Grupo + monumentos individuales al final
        finalData = [...sortedNoMonumentos, monumentosGroup, ...sortedMonumentos];
      } else {
        // Solo mostrar el grupo colapsado al final
        finalData = [...sortedNoMonumentos, monumentosGroup];
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
  }, [data, searchTerm, sortConfig, currentPage, itemsPerPage, isMonumentosExpanded]);

  // Función para manejar la expansión del grupo de monumentos
  const handleToggleMonumentos = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setIsMonumentosExpanded(!isMonumentosExpanded);
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
        clase_up: false,
        avance_obra: true,
        presupuesto_base: true,
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
        clase_up: true,
        avance_obra: true,
        presupuesto_base: true,
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
              Atributos de Unidades de Proyecto
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
                {visibleColumns.nombre_up && (
                  <ColumnHeader 
                    label="Nombre UP" 
                    sortKey="nombre_up" 
                    icon={<Activity className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.identificador && (
                  <ColumnHeader 
                    label="Identificador" 
                    sortKey="identificador" 
                    icon={<Hash className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.avance_obra && (
                  <ColumnHeader 
                    label="Avance Obra" 
                    sortKey="avance_obra" 
                    icon={<Activity className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.presupuesto_base && (
                  <ColumnHeader 
                    label="Presupuesto" 
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
                // Si es un grupo de monumentos, renderizar fila especial
                if (isGroupRow(row)) {
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.01 }}
                      onClick={() => handleToggleMonumentos()}
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200 cursor-pointer border-l-4 border-purple-500"
                      style={{ height: 'auto' }}
                    >
                      {visibleColumns.upid && (
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">
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
                              {isMonumentosExpanded ? (
                                <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="font-bold text-purple-900 dark:text-purple-200 leading-tight break-words whitespace-normal">
                                {row.nombre}
                              </div>
                              <div className="text-xs text-purple-600 dark:text-purple-400 leading-tight break-words whitespace-normal">
                                {row.count} monumentos agrupados • Click para {isMonumentosExpanded ? 'colapsar' : 'expandir'}
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
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-purple-600 dark:text-purple-400">
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            <Building2 className="w-3 h-3 mr-1" />
                            Grupo ({row.count})
                          </span>
                        </td>
                      )}
                      {visibleColumns.tipo_intervencion && (
                        <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="text-xs">Monumentos culturales</div>
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
                return (
                <motion.tr
                  key={item.upid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  onClick={() => onRowClick && onRowClick(item.upid)}
                  className={`transition-colors cursor-pointer ${
                    isFocused 
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  style={{ height: 'auto' }}
                >
                  {visibleColumns.upid && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.upid}
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
                  {visibleColumns.avance_obra && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="space-y-1">
                        <ProgressBar value={item.avance_obra || 0} max={100} />
                        <div className={`text-xs font-medium ${getProgressStatus(item.avance_obra || 0).color}`}>
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{getProgressStatus(item.avance_obra || 0).label}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.presupuesto_base && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(item.presupuesto_base || 0)}
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
                  {visibleColumns.estado && (
                    <td className="px-3 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-normal leading-tight break-words max-w-full ${
                        item.estado.toLowerCase().includes('activ') 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : item.estado.toLowerCase().includes('finaliz')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                  )}
                  {visibleColumns.tipo_intervencion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="leading-tight break-words whitespace-normal">
                        {item.tipo_intervencion}
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
                  {visibleColumns.clase_up && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="leading-tight break-words whitespace-normal">
                        {item.clase_up || 'N/A'}
                      </div>
                    </td>
                  )}
                  {visibleColumns.nombre_centro_gestor && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-start space-x-2">
                        <User className="w-3 h-3 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight break-words whitespace-normal">
                          {item.nombre_centro_gestor}
                        </span>
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
                  {visibleColumns.acciones && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowDetails && onShowDetails(item.upid);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
                  Filtrados por: <span className="font-medium text-blue-600 dark:text-blue-400">"{searchTerm}"</span>
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