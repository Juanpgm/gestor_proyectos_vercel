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
import { formatCurrency, formatCurrencyFull } from '@/utils/formatCurrency';
import dynamic from 'next/dynamic';

// Componentes dinámicos para modales de avances
const RegistrarAvanceUPModal = dynamic(() => import('./RegistrarAvanceUPModal'), { ssr: false });
const HistorialAvancesUP = dynamic(() => import('./HistorialAvancesUP'), { ssr: false });

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
      <span className="text-xs font-bold text-center text-gray-700 dark:text-gray-300 leading-none">
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
const IntervencionCard: React.FC<{
  interv: IntervencionData;
  onRegistrarAvance: (interv: IntervencionData) => void;
  onVerHistorial: (interv: IntervencionData) => void;
}> = ({ interv, onRegistrarAvance, onVerHistorial }) => {
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
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">
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
            {formatCurrencyFull(interv.presupuesto_base || 0)}
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
            <p className="text-gray-900 dark:text-white text-xs">{interv.bpin}</p>
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
            <p className="text-gray-900 dark:text-white text-xs">{interv.identificador}</p>
          </div>
        )}

        {/* Referencias en fila */}
        {interv.referencia_contrato && (
          <div className="col-span-1 sm:col-span-1.5 lg:col-span-1">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Contrato</p>
            <p className="text-gray-900 dark:text-white text-xs truncate">{interv.referencia_contrato}</p>
          </div>
        )}

        {interv.referencia_proceso && (
          <div className="col-span-1 sm:col-span-1.5 lg:col-span-1">
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-0.5 text-xs">Proceso</p>
            <p className="text-gray-900 dark:text-white text-xs truncate">{interv.referencia_proceso}</p>
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

      <div className="border-t border-blue-200 dark:border-blue-700 pt-2 flex items-center justify-end gap-2">
        <button
          onClick={() => onRegistrarAvance(interv)}
          className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors shadow-sm ring-1 ring-emerald-300/70 dark:ring-emerald-700/70"
          title={`Registrar avance en intervención ${interv.intervencion_id}`}
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          Avance
        </button>
        <button
          onClick={() => onVerHistorial(interv)}
          className="inline-flex items-center px-2 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 rounded hover:bg-purple-200 dark:hover:bg-purple-900/70 transition-colors shadow-sm ring-1 ring-purple-300/70 dark:ring-purple-700/70"
          title={`Ver historial de intervención ${interv.intervencion_id}`}
        >
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Historial
        </button>
      </div>
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

  // Estado para modales de avances y edición
  const [modalAvance, setModalAvance] = useState<{ upid: string; intervencionId: string; nombre: string; avance: number; presupuesto: number } | null>(null);
  const [modalHistorial, setModalHistorial] = useState<{ upid: string; intervencionId: string; nombre: string; avance: number; presupuesto: number } | null>(null);

  const extractArrayPayload = (payload: any): any[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const toTimestamp = (record: Record<string, any>): number => {
    const candidates = [record.updated_at, record.fecha_reporte, record.created_at, record.fecha, record.timestamp];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string' || candidate.trim() === '') continue;
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const toValidNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const getLatestAvanceForIntervencion = async (
    apiUrl: string,
    intervencionId: string
  ): Promise<number | null> => {
    const cleanApiUrl = (apiUrl || '').replace(/\/+$/, '');
    const query = `intervencion_id=${encodeURIComponent(intervencionId)}`;
    const candidates = [
      cleanApiUrl ? `${cleanApiUrl}/avances_unidades_proyecto?${query}` : `/avances_unidades_proyecto?${query}`,
      `/api/proxy/avances_unidades_proyecto?${query}`
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!response.ok) continue;

        const payload = await response.json();
        const rows = extractArrayPayload(payload);

        let bestValue: number | null = null;
        let bestTimestamp = Number.NEGATIVE_INFINITY;

        rows.forEach((row) => {
          const current = toValidNumber(row?.avance_obra);
          if (current === null) return;

          const ts = toTimestamp(row);
          if (ts > bestTimestamp) {
            bestTimestamp = ts;
            bestValue = current;
          }
        });

        return bestValue;
      } catch {
        continue;
      }
    }

    return null;
  };

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

  const getVisiblePages = () => {
    const pages: Array<number | 'ellipsis'> = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const siblings = 1;
    const startPage = Math.max(2, currentPage - siblings);
    const endPage = Math.min(totalPages - 1, currentPage + siblings);

    pages.push(1);

    if (startPage > 2) {
      pages.push('ellipsis');
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    if (endPage < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);

    return pages;
  };

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

      const payload = await res.json();
      const intervenciones = extractArrayPayload(payload);
      let intList: IntervencionData[] = intervenciones || [];

      const uniqueIntervencionIds = Array.from(new Set(
        intList
          .map((interv) => String(interv.intervencion_id || '').trim())
          .filter(Boolean)
      ));

      if (uniqueIntervencionIds.length > 0) {
        const latestEntries = await Promise.all(
          uniqueIntervencionIds.map(async (intervencionId) => {
            const latest = await getLatestAvanceForIntervencion(apiUrl, intervencionId);
            return [intervencionId, latest] as const;
          })
        );

        const latestAvanceMap = new Map<string, number>();
        latestEntries.forEach(([intervencionId, latest]) => {
          if (typeof latest === 'number') {
            latestAvanceMap.set(intervencionId, latest);
          }
        });

        intList = intList.map((interv) => {
          const intervencionId = String(interv.intervencion_id || '').trim();
          const latest = latestAvanceMap.get(intervencionId);
          if (typeof latest === 'number') {
            return { ...interv, avance_obra: latest };
          }
          return interv;
        });
      }

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
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[68px] sm:w-[78px]">UPID</th>
                {/* Nombre / Ubicación - siempre visible */}
                <th className="px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[128px] sm:w-[260px] md:w-[296px] lg:w-[346px]">Nombre</th>
                {/* Centro Gestor - oculto en móvil, visible desde tablet */}
                <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 md:w-24 lg:w-28">Centro</th>
                {/* Estado - oculto en móvil, visible desde tablet */}
                <th className="hidden sm:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Estado</th>
                {/* Tipo - oculto en móvil y tablet, visible desde desktop */}
                <th className="hidden lg:table-cell px-1 sm:px-1.5 py-2 sm:py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 md:w-20 lg:w-24">Tipo</th>
                {/* Avance - siempre visible */}
                <th className="px-0 sm:px-0.5 py-2 sm:py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-[52px] sm:w-[58px] md:w-[64px] lg:w-[72px]">Avance</th>
                {/* Presupuesto - oculto en móvil y tablet, visible desde desktop */}
                <th className="hidden md:table-cell px-2 sm:px-3 py-2 sm:py-2.5 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-24 md:w-28 lg:w-32">Presupuesto</th>

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
                          <td className="px-1 sm:px-1.5 py-2 sm:py-2.5 whitespace-nowrap">
                            <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs sm:text-sm lg:text-base leading-none">
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
                          <td className="px-0 sm:px-0.5 py-2 sm:py-2.5">
                            <ProgressBar value={itemMetrics.avance} />
                          </td>

                          {/* Presupuesto - oculto en móvil y tablet */}
                          <td className="hidden md:table-cell px-2 sm:px-3 py-2 sm:py-2.5 text-center">
                            <span className="inline-block font-bold text-green-600 dark:text-green-400 text-xs sm:text-sm whitespace-nowrap tabular-nums">
                              {formatCurrencyFull(itemMetrics.presupuesto)}
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
                                      <IntervencionCard
                                        key={interv.intervencion_id}
                                        interv={interv}
                                        onRegistrarAvance={(intervencion) => {
                                          setModalAvance({
                                            upid: item.upid,
                                            intervencionId: intervencion.intervencion_id,
                                            nombre: `${item.nombre_up} · ${intervencion.intervencion_id}`,
                                            avance: intervencion.avance_obra || 0,
                                            presupuesto: intervencion.presupuesto_base || 0
                                          });
                                        }}
                                        onVerHistorial={(intervencion) => {
                                          setModalHistorial({
                                            upid: item.upid,
                                            intervencionId: intervencion.intervencion_id,
                                            nombre: `${item.nombre_up} · ${intervencion.intervencion_id}`,
                                            avance: intervencion.avance_obra || 0,
                                            presupuesto: intervencion.presupuesto_base || 0
                                          });
                                        }}
                                      />
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
              {getVisiblePages().map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                    >
                      ...
                    </span>
                  );
                }

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

      {/* Modales de avances y edición */}
      <AnimatePresence>
        {modalAvance && (
          <RegistrarAvanceUPModal
            upid={modalAvance.upid}
            intervencionId={modalAvance.intervencionId}
            nombreUP={modalAvance.nombre}
            avanceActual={modalAvance.avance}
            presupuesto={modalAvance.presupuesto}
            onClose={() => setModalAvance(null)}
            onSuccess={() => {
              // Limpiar cache de esa UP para que se recarguen las intervenciones
              // con el avance_obra actualizado y se recalculen las métricas de la tabla
              const upid = modalAvance!.upid;
              setIntervencionesCache(prev => {
                const copy = { ...prev };
                delete copy[upid];
                return copy;
              });
              setMetrics(prev => {
                const copy = { ...prev };
                delete copy[upid];
                return copy;
              });
              // Recargar intervenciones para recalcular la barra de avance
              void loadIntervenciones(upid);
              setModalAvance(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalHistorial && (
          <HistorialAvancesUP
            upid={modalHistorial.upid}
            intervencionId={modalHistorial.intervencionId}
            nombreUP={modalHistorial.nombre}
            presupuesto={modalHistorial.presupuesto}
            onClose={() => setModalHistorial(null)}
            onRegistrarAvance={() => {
              setModalHistorial(null);
              setModalAvance({
                upid: modalHistorial.upid,
                intervencionId: modalHistorial.intervencionId,
                nombre: modalHistorial.nombre,
                avance: modalHistorial.avance,
                presupuesto: modalHistorial.presupuesto
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UnidadesProyectoTabularView;
