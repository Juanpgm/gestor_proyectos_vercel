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
  EyeOff
} from 'lucide-react';
import { type AttributeData } from '@/services/unidades-proyecto.service';

interface UnidadesProyectoAttributesTableProps {
  data: AttributeData[];
  className?: string;
  maxHeight?: string;
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

const UnidadesProyectoAttributesTable: React.FC<UnidadesProyectoAttributesTableProps> = ({
  data,
  className = '',
  maxHeight = '500px'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AttributeData;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    upid: true,
    nombre_up: true,
    avance_obra: true,
    presupuesto_base: true,
    barrio_vereda: true,
    comuna_corregimiento: true,
    estado: false,
    tipo_intervencion: false
  });

  // Datos filtrados y ordenados
  const processedData = useMemo(() => {
    let filtered = data;

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(item =>
        item.upid.toLowerCase().includes(term) ||
        item.nombre_up.toLowerCase().includes(term) ||
        item.barrio_vereda.toLowerCase().includes(term) ||
        item.comuna_corregimiento.toLowerCase().includes(term) ||
        item.estado.toLowerCase().includes(term)
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

    return filtered;
  }, [data, searchTerm, sortConfig]);

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
  };

  // Alternar visibilidad de columnas
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
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
              {processedData.length} de {data.length}
            </span>
          </div>

          {/* Buscador */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por UPID, nombre, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                {visibleColumns.barrio_vereda && (
                  <ColumnHeader 
                    label="Barrio" 
                    sortKey="barrio_vereda" 
                    icon={<MapPin className="w-3 h-3" />} 
                  />
                )}
                {visibleColumns.comuna_corregimiento && (
                  <ColumnHeader 
                    label="Comuna" 
                    sortKey="comuna_corregimiento" 
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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.map((item, index) => (
                <motion.tr
                  key={item.upid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
                      <ProgressBar value={item.avance_obra || 0} max={100} />
                    </td>
                  )}
                  {visibleColumns.presupuesto_base && (
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(item.presupuesto_base || 0)}
                    </td>
                  )}
                  {visibleColumns.barrio_vereda && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div title={item.barrio_vereda}>
                        {truncateText(item.barrio_vereda, 20)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.comuna_corregimiento && (
                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                      <div title={item.comuna_corregimiento}>
                        {truncateText(item.comuna_corregimiento, 20)}
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer con información */}
      {processedData.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Mostrando <span className="font-medium">{processedData.length}</span> de{' '}
              <span className="font-medium">{data.length}</span> unidades de proyecto
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