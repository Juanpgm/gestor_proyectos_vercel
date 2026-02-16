"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  ChevronRight,
  MapPin,
  DollarSign,
  Building2,
  AlertCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight
} from 'lucide-react';
import { type AttributeData } from '@/services/unidades-proyecto.service';
import { formatCurrency } from '@/utils/formatCurrency';

interface IntervencionData {
  intervencion_id: string;
  upid: string;
  tipo_intervencion: string;
  avance_obra: number;
  presupuesto_base: number;
  nombre_centro_gestor: string;
  fuente_financiacion?: string;
  ano?: string | number;
  estado?: string;
  identificador?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  bpin?: string | number;
  referencia_contrato?: string;
  referencia_proceso?: string;
  url_proceso?: string;
  descripcion_intervencion?: string;
  clase_up?: string;
}

interface UnidadesProyectoTabularViewProps {
  data: AttributeData[];
  className?: string;
  onRowClick?: (upid: string) => void;
  focusedItem?: string | null;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
  const percentage = Math.min(value, 100);
  const getColor = (val: number) => {
    if (val >= 90) return 'from-green-500 to-emerald-600';
    if (val >= 70) return 'from-blue-500 to-cyan-600';
    if (val >= 50) return 'from-yellow-500 to-amber-600';
    if (val >= 30) return 'from-orange-500 to-red-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <span className="text-xs font-bold text-right text-gray-700 dark:text-gray-300">
        {percentage.toFixed(0)}%
      </span>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full bg-gradient-to-r ${getColor(percentage)}`}
        />
      </div>
    </div>
  );
};

// Componente de Ficha Resumen de Intervención
const IntervencionCard: React.FC<{ interv: IntervencionData }> = ({ interv }) => {
  // Calcular duración del proyecto
  const getDuration = () => {
    if (!interv.fecha_inicio || !interv.fecha_fin) return null;
    const start = new Date(interv.fecha_inicio);
    const end = new Date(interv.fecha_fin);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months;
  };

  const duration = getDuration();

  // Estado badge color
  const getEstadoBadgeColor = (estado: string) => {
    const lower = estado?.toLowerCase() || '';
    if (lower.includes('terminado') || lower.includes('completado')) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
    if (lower.includes('ejecución') || lower.includes('en ejecución')) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    if (lower.includes('alista')) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-700/40 text-gray-700 dark:text-gray-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 rounded-lg p-2.5 sm:p-3 space-y-2"
    >
      {/* Encabezado */}
      <div className="border-b border-blue-200 dark:border-blue-700 pb-2">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-blue-600 dark:text-blue-400 mb-0.5">
              {interv.intervencion_id}
            </p>
            <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
              {interv.tipo_intervencion}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {interv.ano && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded whitespace-nowrap">
                {interv.ano}
              </span>
            )}
            {interv.estado && (
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded whitespace-nowrap ${getEstadoBadgeColor(interv.estado)}`}>
                {interv.estado}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid responsivo con información */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
        {/* Avance */}
        <div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Avance</p>
          <div className="flex items-center gap-1">
            <div className="flex-1">
              <ProgressBar value={interv.avance_obra || 0} />
            </div>
          </div>
        </div>

        {/* Presupuesto */}
        <div>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Presupuesto</p>
          <p className="font-bold text-green-600 dark:text-green-400 text-xs">
            {formatCurrency(interv.presupuesto_base || 0)}
          </p>
        </div>

        {/* Centro Gestor */}
        {interv.nombre_centro_gestor && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Centro</p>
            <p className="text-gray-900 dark:text-white text-xs">{interv.nombre_centro_gestor}</p>
          </div>
        )}

        {/* Duración (solo en lg) */}
        {duration !== null && (
          <div className="hidden lg:block">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Duración</p>
            <p className="text-gray-900 dark:text-white text-xs font-medium">{duration} meses</p>
          </div>
        )}

        {/* Fuente Financiación */}
        {interv.fuente_financiacion && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Fuente</p>
            <p className="text-gray-900 dark:text-white text-xs">{interv.fuente_financiacion}</p>
          </div>
        )}

        {/* BPIN */}
        {interv.bpin && (
          <div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">BPIN</p>
            <p className="text-gray-900 dark:text-white text-xs font-mono">{interv.bpin}</p>
          </div>
        )}

        {/* Clase UP (solo en lg) */}
        {interv.clase_up && (
          <div className="hidden lg:block">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Clase</p>
            <p className="text-gray-900 dark:text-white text-xs">{interv.clase_up}</p>
          </div>
        )}

        {/* Período - Full width en mobile/tablet */}
        {(interv.fecha_inicio || interv.fecha_fin) && (
          <div className="col-span-1 sm:col-span-3 lg:col-span-1">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Período</p>
            <p className="text-gray-900 dark:text-white text-xs">
              {interv.fecha_inicio ? new Date(interv.fecha_inicio).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : '-'} {' '}
              {interv.fecha_fin ? new Date(interv.fecha_fin).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
            </p>
          </div>
        )}

        {/* Identificador - Full width */}
        {interv.identificador && (
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Identificador</p>
            <p className="text-gray-900 dark:text-white text-xs font-mono">{interv.identificador}</p>
          </div>
        )}

        {/* Referencias en fila */}
        {interv.referencia_contrato && (
          <div className="col-span-1 sm:col-span-1.5 lg:col-span-1">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Contrato</p>
            <p className="text-gray-900 dark:text-white text-xs font-mono truncate">{interv.referencia_contrato}</p>
          </div>
        )}

        {interv.referencia_proceso && (
          <div className="col-span-1 sm:col-span-1.5 lg:col-span-1">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Proceso</p>
            <p className="text-gray-900 dark:text-white text-xs font-mono truncate">{interv.referencia_proceso}</p>
          </div>
        )}
      </div>

      {/* Descripción */}
      {interv.descripcion_intervencion && (
        <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
          <p className="text-gray-600 dark:text-gray-400 font-medium text-xs mb-0.5">Descripción</p>
          <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
            {interv.descripcion_intervencion}
          </p>
        </div>
      )}
    </motion.div>
  );
};

const UnidadesProyectoTabularView: React.FC<UnidadesProyectoTabularViewProps> = ({
  data,
  className = '',
  onRowClick,
  focusedItem = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUPs, setExpandedUPs] = useState<Set<string>>(new Set());
  const [intervencionesCache, setIntervencionesCache] = useState<Record<string, IntervencionData[]>>({});
  const [loadingInterv, setLoadingInterv] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Record<string, { avance: number; presupuesto: number }>>({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 12;

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      item.upid.toLowerCase().includes(term) ||
      item.nombre_up.toLowerCase().includes(term) ||
      item.barrio_vereda?.toLowerCase().includes(term) ||
      item.comuna_corregimiento?.toLowerCase().includes(term) ||
      item.nombre_centro_gestor?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Paginar
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  // Métricas globales
  const globalMetrics = useMemo(() => {
    let totalPresupuesto = 0;
    let totalAvance = 0;
    let countedItems = 0;

    filteredData.forEach(item => {
      if (metrics[item.upid]) {
        totalPresupuesto += metrics[item.upid].presupuesto;
        totalAvance += metrics[item.upid].avance;
        countedItems++;
      }
    });

    return {
      total: filteredData.length,
      presupuesto: totalPresupuesto,
      avancePromedio: countedItems > 0 ? totalAvance / countedItems : 0
    };
  }, [filteredData, metrics]);

  // Cargar intervenciones
  const loadIntervenciones = async (upid: string) => {
    if (intervencionesCache[upid] || loadingInterv.has(upid)) return;

    setLoadingInterv(prev => new Set(prev).add(upid));
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    try {
      const res = await fetch(`${apiUrl}/intervenciones?upid=${upid}&limit=10000`);
      if (!res.ok) throw new Error('Error loading intervenciones');

      const { data: intervenciones } = await res.json();
      const intList: IntervencionData[] = intervenciones || [];

      // Calcular métricas
      const avance = intList.length > 0
        ? intList.reduce((sum, i) => sum + (i.avance_obra || 0), 0) / intList.length
        : 0;
      const presupuesto = intList.reduce((sum, i) => sum + (i.presupuesto_base || 0), 0);

      setMetrics(prev => ({ ...prev, [upid]: { avance, presupuesto } }));
      setIntervencionesCache(prev => ({ ...prev, [upid]: intList }));
    } catch (error) {
      console.error(`Error loading intervenciones for ${upid}:`, error);
      setMetrics(prev => ({ ...prev, [upid]: { avance: 0, presupuesto: 0 } }));
    } finally {
      setLoadingInterv(prev => {
        const newSet = new Set(prev);
        newSet.delete(upid);
        return newSet;
      });
    }
  };

  // Helper para obtener estado consolidado
  const getEstadoConsolidado = (intervenciones: IntervencionData[]): string => {
    if (intervenciones.length === 0) return '-';
    if (intervenciones.length === 1) return intervenciones[0].estado || '-';
    
    const estados = new Set(intervenciones.map(i => i.estado).filter(Boolean));
    return estados.size === 1 ? Array.from(estados)[0]! : 'Varios estados';
  };

  // Helper para obtener tipo consolidado
  const getTipoConsolidado = (intervenciones: IntervencionData[]): string => {
    if (intervenciones.length === 0) return '-';
    if (intervenciones.length === 1) return intervenciones[0].tipo_intervencion || '-';
    
    const tipos = new Set(intervenciones.map(i => i.tipo_intervencion).filter(Boolean));
    return tipos.size === 1 ? Array.from(tipos)[0]! : 'Varios tipos';
  };

  // Helper para obtener centro gestor consolidado
  const getCentroGestorConsolidado = (intervenciones: IntervencionData[]): string => {
    if (intervenciones.length === 0) return '-';
    if (intervenciones.length === 1) return intervenciones[0].nombre_centro_gestor || '-';
    
    const centros = new Set(intervenciones.map(i => i.nombre_centro_gestor).filter(Boolean));
    return centros.size === 1 ? Array.from(centros)[0]! : 'Intervenido por varios organismos';
  };

  // Toggle expansión
  const toggleExpand = (upid: string) => {
    const isExpanded = expandedUPs.has(upid);
    const newExpanded = new Set(expandedUPs);
    
    if (isExpanded) {
      newExpanded.delete(upid);
    } else {
      newExpanded.clear();
      newExpanded.add(upid);
      loadIntervenciones(upid);
    }
    
    setExpandedUPs(newExpanded);
  };

  // Cargar métricas iniciales
  useEffect(() => {
    paginatedData.forEach(item => {
      if (!metrics[item.upid] && !loadingInterv.has(item.upid)) {
        loadIntervenciones(item.upid);
      }
    });
  }, [paginatedData]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-1.5 sm:px-2 py-1.5 sm:py-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por UPID, nombre, ubicación, centro..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <span className="text-xs text-gray-500">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm table-fixed">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                {/* Expandir - siempre visible */}
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-5 sm:w-6"></th>
                {/* UPID - siempre visible */}
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-12 sm:w-16">UPID</th>
                {/* Nombre / Ubicación - siempre visible */}
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-24 sm:w-28 md:w-32">Nombre</th>
                {/* Centro Gestor - oculto en móvil, visible desde tablet */}
                <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 md:w-24 lg:w-28">Centro</th>
                {/* Estado - oculto en móvil, visible desde tablet */}
                <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Estado</th>
                {/* Tipo - oculto en móvil y tablet, visible desde desktop */}
                <th className="hidden lg:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Tipo</th>
                {/* Avance - siempre visible */}
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 sm:w-24 md:w-28">Avance</th>
                {/* Presupuesto - oculto en móvil y tablet, visible desde desktop */}
                <th className="hidden md:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 lg:w-20">Presupuesto</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence mode="popLayout">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-1 sm:px-1.5 py-4 sm:py-6 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-xs sm:text-sm">No hay resultados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => {
                    const isExpanded = expandedUPs.has(item.upid);
                    const intervenciones = intervencionesCache[item.upid] || [];
                    const isLoading = loadingInterv.has(item.upid);
                    const itemMetrics = metrics[item.upid] || { avance: 0, presupuesto: 0 };

                    return (
                      <React.Fragment key={item.upid}>
                        {/* Fila Principal - UP */}
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`transition-colors cursor-pointer ${
                            focusedItem === item.upid
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          onClick={() => {
                            onRowClick?.(item.upid);
                            toggleExpand(item.upid);
                          }}
                        >
                          {/* Botón expandir */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(item.upid);
                              }}
                              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              title={isExpanded ? 'Colapsar' : 'Expandir intervenciones'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              )}
                            </button>
                          </td>

                          {/* UPID */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                              {item.upid}
                            </span>
                          </td>

                          {/* Nombre y Ubicación */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <div className="space-y-0.5">
                              <p className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                {item.nombre_up}
                              </p>
                              {item.nombre_up_detalle && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                                  {item.nombre_up_detalle}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hidden sm:flex">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                <span>
                                  {item.barrio_vereda && item.comuna_corregimiento
                                    ? `${item.barrio_vereda} • ${item.comuna_corregimiento}`
                                    : item.barrio_vereda || item.comuna_corregimiento || '-'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Centro Gestor - oculto en móvil */}
                          <td className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">
                              {getCentroGestorConsolidado(intervenciones)}
                            </span>
                          </td>

                          {/* Estado - oculto en móvil */}
                          <td className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">
                              {getEstadoConsolidado(intervenciones)}
                            </span>
                          </td>

                          {/* Tipo - oculto en móvil y tablet */}
                          <td className="hidden lg:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 break-words">
                            <span className="text-xs text-gray-700 dark:text-gray-300 block">
                              {getTipoConsolidado(intervenciones)}
                            </span>
                          </td>

                          {/* Avance */}
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5">
                            <ProgressBar value={itemMetrics.avance} />
                          </td>

                          {/* Presupuesto - oculto en móvil y tablet */}
                          <td className="hidden md:table-cell pl-1 sm:pl-1.5 pr-2 sm:pr-3 py-2 sm:py-2.5 text-right">
                            <span className="font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm">
                              {formatCurrency(itemMetrics.presupuesto)}
                            </span>
                          </td>
                        </motion.tr>

                        {/* Intervenciones Expandidas - Fichas Resumen */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr className="bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/5 dark:to-blue-900/0">
                              <td colSpan={8} className="px-1 sm:px-1.5 py-2 sm:py-3">
                                {isLoading ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Cargando intervenciones...
                                    </span>
                                  </div>
                                ) : intervenciones.length === 0 ? (
                                  <div className="text-center text-xs sm:text-sm text-gray-500">
                                    Sin intervenciones
                                  </div>
                                ) : (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-2 sm:space-y-3"
                                  >
                                    {intervenciones.map((interv) => (
                                      <IntervencionCard key={interv.intervencion_id} interv={interv} />
                                    ))}
                                  </motion.div>
                                )}
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 px-1.5 sm:px-2 py-1.5 sm:py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Primera página"
            >
              <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Página anterior"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Página siguiente"
            >
              <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Última página"
            >
              <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadesProyectoTabularView;
