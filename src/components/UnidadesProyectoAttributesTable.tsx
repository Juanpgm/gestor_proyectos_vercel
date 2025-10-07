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
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  FileText,
  Clock,
  Target,
  X
} from 'lucide-react';
import { type AttributeData } from '@/services/unidades-proyecto.service';

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

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toLocaleString('es-CO')}`;
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
const formatDate = (dateString: string): string => {
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
  const [visibleColumns, setVisibleColumns] = useState({
    upid: true,
    nombre_up: true,
    estado: true,
    tipo_intervencion: false,
    avance_obra: true,
    presupuesto_base: true,
    nombre_centro_gestor: false,
    ubicacion: true, // Nueva columna unificada de barrio y comuna
    fuente_financiacion: false,
    duracion_proyecto: true, // Nueva columna combinada de fechas
    ano: false,
    descripcion_intervencion: false,
    acciones: true // Nueva columna de acciones
  });

  // Datos filtrados, ordenados y paginados
  const { filteredData, paginatedData, totalPages, totalItems } = useMemo(() => {
    let filtered = data;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(item =>
        item.upid.toLowerCase().includes(term) ||
        item.nombre_up.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term) ||
        item.tipo_intervencion.toLowerCase().includes(term) ||
        item.nombre_centro_gestor.toLowerCase().includes(term) ||
        item.barrio_vereda.toLowerCase().includes(term) ||
        item.comuna_corregimiento.toLowerCase().includes(term) ||
        item.fuente_financiacion.toLowerCase().includes(term) ||
        item.descripcion_intervencion.toLowerCase().includes(term) ||
        item.ano.toString().includes(term)
      );
    }

    // Ordenar
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
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

    // Calcular paginación
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      filteredData: filtered,
      paginatedData,
      totalPages,
      totalItems: filtered.length
    };
  }, [data, searchTerm, sortConfig, currentPage, itemsPerPage]);

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
        estado: true,
        avance_obra: true,
        presupuesto_base: true,
        ubicacion: true,
        tipo_intervencion: false,
        nombre_centro_gestor: false,
        fuente_financiacion: false,
        duracion_proyecto: false,
        ano: false,
        descripcion_intervencion: false,
        acciones: true
      });
    } else {
      // Vista completa: mostrar todos los campos relevantes
      setVisibleColumns({
        upid: true,
        nombre_up: true,
        estado: true,
        tipo_intervencion: true,
        avance_obra: true,
        presupuesto_base: true,
        nombre_centro_gestor: true,
        ubicacion: true,
        fuente_financiacion: true,
        duracion_proyecto: true,
        ano: true,
        descripcion_intervencion: false,
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
      {/* Header con controles */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div className="flex items-center space-x-2">
            <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atributos de Unidades de Proyecto
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {totalItems} de {data.length}
            </span>
          </div>

          {/* Buscador */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por UPID, nombre, centro gestor, ubicación, año..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
              <span>{viewMode === 'complete' ? 'Completa' : 'Compacta'}</span>
            </button>

            {/* Control de columnas visibles */}
            <div className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <Eye className="w-4 h-4" />
                <span>Columnas</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="p-2 space-y-1">
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

      {/* Tabla */}
      <div className="overflow-hidden">
        <div 
          className="overflow-y-auto"
          style={{ maxHeight }}
        >
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
              {paginatedData.map((item: AttributeData, index: number) => {
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
                >
                  {visibleColumns.upid && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {item.upid}
                    </td>
                  )}
                  {visibleColumns.nombre_up && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div title={item.nombre_up}>
                        {truncateText(item.nombre_up, 40)}
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
                        <div className="font-medium text-gray-900 dark:text-white" title={item.barrio_vereda}>
                          {truncateText(item.barrio_vereda || 'N/A', 25)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400" title={item.comuna_corregimiento}>
                          {truncateText(item.comuna_corregimiento || 'N/A', 25)}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.estado && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.estado.toLowerCase().includes('activ') 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : item.estado.toLowerCase().includes('finaliz')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {truncateText(item.estado, 15)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.tipo_intervencion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div title={item.tipo_intervencion}>
                        {truncateText(item.tipo_intervencion, 20)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.nombre_centro_gestor && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div 
                        title={item.nombre_centro_gestor}
                        className="flex items-center space-x-2"
                      >
                        <User className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        <span>{truncateText(item.nombre_centro_gestor, 25)}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.fuente_financiacion && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div title={item.fuente_financiacion}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.fuente_financiacion.toLowerCase().includes('nacional') 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : item.fuente_financiacion.toLowerCase().includes('departamental')
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : item.fuente_financiacion.toLowerCase().includes('municipal')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {truncateText(item.fuente_financiacion, 15)}
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
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                duracionInfo.estado === 'en-curso' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : duracionInfo.estado === 'finalizado'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : duracionInfo.estado === 'no-iniciado'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {duracionInfo.estado === 'en-curso' ? 'En curso' :
                                 duracionInfo.estado === 'finalizado' ? 'Finalizado' :
                                 duracionInfo.estado === 'no-iniciado' ? 'No iniciado' : 'Sin fechas'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {duracionInfo.fechas}
                            </div>
                          </div>
                        );
                      })()}
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
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                      <div 
                        title={item.descripcion_intervencion}
                        className="flex items-start space-x-2"
                      >
                        <FileText className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span 
                          className="leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {truncateText(item.descripcion_intervencion, 120)}
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
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Última página */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer con información */}
      {paginatedData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
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
                <span className="text-gray-400"> (filtradas de {data.length} totales)</span>
              )}
            </div>
            {searchTerm && (
              <div>
                Filtrados por: <span className="font-medium">"{searchTerm}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UnidadesProyectoAttributesTable;