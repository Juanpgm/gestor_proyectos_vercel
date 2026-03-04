"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Calendar,
  Download,
  AlertCircle,
  Map,
  Filter as FilterIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  DollarSign,
  Settings,
  MapPin,
  Clock,
  FileText,
  ExternalLink,
  Layers,
  Award
} from 'lucide-react';
import { CSS_UTILS } from '@/lib/design-system';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Componentes dinámicos para evitar problemas de SSR
const UnidadesProyectoMapSimple = dynamic(() => import('./UnidadesProyectoMapSimple'), { ssr: false });
const UnidadesProyectoFilters = dynamic(() => import('./UnidadesProyectoFilters'), { ssr: false });
const UnidadesProyectoTabularView = dynamic(() => import('./UnidadesProyectoTabularView'), { ssr: false });

// Hooks mejorados
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyectoEnhanced';

// Tipos
import { type FilterParams, exportIntervencionesXlsx } from '@/services/unidades-proyecto.service';
import { type AttributeData } from '@/hooks/useUnidadesProyecto';
import { formatDate, formatDateRange } from '@/types/unidades-proyecto';


// Estados de vista
type ViewMode = 'map' | 'split';

// Componente de Loading
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center h-64 space-y-4"
  >
    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
    <p className="text-gray-600 dark:text-gray-400">{message}</p>
  </motion.div>
);

// Componente de Error
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center h-64 space-y-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800"
  >
    <AlertCircle className="w-12 h-12 text-red-500" />
    <div className="text-center">
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
        Error al cargar los datos
      </h3>
      <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  </motion.div>
);

// Componente Modal de Detalles del Proyecto
const ProjectDetailsModal: React.FC<{
  item: AttributeData | undefined;
  onClose: () => void;
}> = ({ item, onClose }) => {
  if (!item) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProjectDuration = (fechaInicio: string | null | undefined, fechaFin: string | null | undefined) => {
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

  const projectDuration = calculateProjectDuration(item.fecha_inicio, item.fecha_fin);
  const progress = Math.round(item.avance_obra || 0);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header moderno con gradiente */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 px-6 py-5">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm transition-all duration-200"
          title="Cerrar"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="pr-12">
          <h2 className="text-xl font-bold text-white mb-3 leading-tight line-clamp-2 drop-shadow-md">
            {item.nombre_up}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 bg-white/90 dark:bg-white/20 backdrop-blur-sm rounded-lg text-gray-800 dark:text-white font-mono text-sm font-semibold shadow-sm">
              {item.upid}
            </span>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold backdrop-blur-sm shadow-sm ${
              item.estado.toLowerCase().includes('ejecución') || item.estado.toLowerCase().includes('activ')
                ? 'bg-green-100 dark:bg-green-900/60 text-green-800 dark:text-green-200'
                : item.estado.toLowerCase().includes('finaliz')
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
            }`}>
              {item.estado}
            </span>
            {item.tipo_equipamiento && (
              <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/60 backdrop-blur-sm rounded-lg text-purple-800 dark:text-purple-200 text-sm font-semibold shadow-sm">
                {item.tipo_equipamiento}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content con scroll mejorado - Layout de 2 columnas */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            {/* Barra de progreso destacada */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Avance de Obra</span>
                <span className={`text-2xl font-bold ${
                  progress >= 70 ? 'text-green-600 dark:text-green-400' : 
                  progress >= 40 ? 'text-amber-600 dark:text-amber-400' : 
                  'text-red-600 dark:text-red-400'
                }`}>
                  {progress}%
                </span>
              </div>
              <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 shadow-md ${
                    progress >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                    progress >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                    'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20"></div>
                </div>
              </div>
            </div>

            {/* Información General */}
            <div className="grid grid-cols-1 gap-4">
              {/* Centro Gestor */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Centro Gestor</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {item.nombre_centro_gestor || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tipo de Intervención */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                    <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo Intervención</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {item.tipo_intervencion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clase UP - NUEVO CAMPO */}
              {item.clase_up && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg">
                      <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Clase de UP</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {item.clase_up}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Año */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Año</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.ano}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación destacada */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-5 shadow-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">Ubicación</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Barrio/Vereda</p>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">{item.barrio_vereda || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Comuna/Corregimiento</p>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">{item.comuna_corregimiento || 'N/A'}</p>
                </div>
                {item.direccion && (
                  <div>
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">Dirección</p>
                    <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">{item.direccion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información contractual */}
            {(item.referencia_contrato || item.referencia_proceso || item.url_proceso) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Información Contractual</p>
                {item.referencia_contrato && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Ref. Contrato</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{item.referencia_contrato}</span>
                  </div>
                )}
                {item.referencia_proceso && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Ref. Proceso</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">{item.referencia_proceso}</span>
                  </div>
                )}
                {item.url_proceso && (
                  <a 
                    href={item.url_proceso} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Proceso en SECOP
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            {/* Presupuesto */}
            {item.presupuesto_base && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 shadow-md border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Presupuesto</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400 leading-tight">
                      {formatCurrency(item.presupuesto_base)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Duración del proyecto */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Duración del Proyecto</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duración estimada</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{projectDuration.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estado temporal</span>
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    projectDuration.status === 'en-curso' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : projectDuration.status === 'finalizado'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {projectDuration.status === 'en-curso' ? '🟢 En Curso' : 
                     projectDuration.status === 'finalizado' ? '🔵 Finalizado' : '🟡 Planificado'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Período</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{projectDuration.dateRange}</p>
                </div>
                {/* Fecha de Inauguración - NUEVO CAMPO */}
                {item.fecha_inauguracion && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Fecha de Inauguración</p>
                    </div>
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{formatDate(item.fecha_inauguracion)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Fuente de financiación */}
            {item.fuente_financiacion && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 shadow-md border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">Fuente de Financiación</p>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{item.fuente_financiacion}</p>
              </div>
            )}

            {/* Información adicional */}
            {item.nombre_up_detalle && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Detalle de UP</p>
                <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{item.nombre_up_detalle}</p>
              </div>
            )}
            
            {item.identificador && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Identificador</p>
                <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">{item.identificador}</p>
              </div>
            )}

            {/* Descripción de la intervención */}
            {item.descripcion_intervencion && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Descripción de la Intervención</h3>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {item.descripcion_intervencion}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de métricas compactas
const CompactMetrics: React.FC<{
  metrics: {
    total: number;
    totalUnidadesProyecto: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    avgProgress: number;
    totalBudget: number;
    activeFronts: number;
  };
}> = ({ metrics }) => {
  const formatCurrency = (amount: number, compact: boolean = false): string => {
    // Solo usar formato compacto si se especifica explícitamente
    if (compact) {
      if (amount >= 1000000000000) return `$${(amount / 1000000000000).toFixed(1).replace('.', ',')} B`; // Billones
      if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1).replace('.', ',')} MM`; // Miles de millones
      if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1).replace('.', ',')} M`; // Millones
      if (amount >= 1000) return `$${(amount / 1000).toFixed(1).replace('.', ',')} K`; // Miles
    }
    
    // Formato completo con notación colombiana (por defecto)
    return `$${amount.toLocaleString('es-CO', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="text-center">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total}</div>
        <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Total Intervenciones</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.totalUnidadesProyecto}</div>
        <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Total Unidades de Proyecto</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.activeFronts || 0}</div>
        <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Frentes de Obra Activos</div>
      </div>
      <div className="text-center">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">{metrics.avgProgress.toFixed(1)}%</div>
        <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Avance Promedio</div>
      </div>
      <div className="text-center">
        <div className="text-base sm:text-lg lg:text-xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(metrics.totalBudget)}</div>
        <div className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">Presupuesto Total</div>
      </div>
    </div>
  );
};

// Componente principal
const UnidadesProyecto: React.FC = () => {
  const { hasRole } = useAuth();

  // Estados locales
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showFilters, setShowFilters] = useState(true);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [showOnlyFocused, setShowOnlyFocused] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const canExportFilteredData =
    hasRole('admin_centro_gestor') ||
    hasRole('analista') ||
    hasRole('admin_general') ||
    hasRole('super_admin');

  // Hook principal con configuración mejorada
  const {
    state,
    filteredData,
    filteredGeometry,
    metrics,
    actions,
    filters
  } = useUnidadesProyecto({
    enableLocalFiltering: true, // Filtrado local - carga una vez y filtra en cliente
    autoRefresh: false,
    initialFilters: {}
  });

  // Hook específico para dashboard - TEMPORALMENTE DESHABILITADO
  const dashboardData = null;
  const dashboardLoading = false;
  const dashboardError = null;
  const refetchDashboard = () => console.log('Dashboard refetch disabled');
  
  // const {
  //   data: dashboardData,
  //   loading: dashboardLoading,
  //   error: dashboardError,
  //   refetch: refetchDashboard


  // 🔍 DIAGNÓSTICO: Monitorear el presupuesto total mostrado
  useEffect(() => {
    if (metrics.totalBudget > 0) {
      console.log('');
      console.log('🔍 ================================');
      console.log('💰 PRESUPUESTO TOTAL MOSTRADO EN UI');
      console.log('🔍 ================================');
      console.log(`Valor mostrado: $${metrics.totalBudget.toLocaleString('es-CO')}`);
      console.log(`Total de registros: ${filteredData.length}`);
      console.log(`Total de registros cargados: ${state.attributeData.length}`);
      console.log(`¿Hay filtros activos?: ${filteredData.length !== state.attributeData.length ? 'SÍ' : 'NO'}`);
      
      if (filteredData.length !== state.attributeData.length) {
        const totalSinFiltros = state.attributeData.reduce((sum, item) => sum + (item.presupuesto_base || 0), 0);
        console.log(`💰 Presupuesto SIN filtros: $${totalSinFiltros.toLocaleString('es-CO')}`);
        console.log(`📉 Diferencia: $${(totalSinFiltros - metrics.totalBudget).toLocaleString('es-CO')}`);
      }
      
      // Mostrar muestra de presupuestos
      console.log('📋 Muestra de presupuestos (primeros 5):');
      filteredData.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.nombre_up}: $${(item.presupuesto_base || 0).toLocaleString('es-CO')}`);
      });
      console.log('================================\n');
    }
  }, [metrics.totalBudget, filteredData.length, state.attributeData.length]);

  // Verificar centro_gestor cuando cambian los datos
  useEffect(() => {
    if (state.attributeData.length > 0) {
      const withCentro = state.attributeData.filter(item => 
        item.nombre_centro_gestor && item.nombre_centro_gestor.trim() !== ''
      );
      const withoutCentro = state.attributeData.filter(item => 
        !item.nombre_centro_gestor || item.nombre_centro_gestor.trim() === ''
      );
      
      const centrosUnicos = new Set(
        withCentro.map(item => item.nombre_centro_gestor).filter(Boolean)
      );
      
      console.log('📊 Centro Gestor Verification:');
      console.log(`  Total UPs: ${state.attributeData.length}`);
      console.log(`  ✅ Con Centro Gestor: ${withCentro.length} (${(withCentro.length/state.attributeData.length*100).toFixed(1)}%)`);
      console.log(`  ❌ Sin Centro Gestor: ${withoutCentro.length} (${(withoutCentro.length/state.attributeData.length*100).toFixed(1)}%)`);
      console.log(`  📋 Centros Únicos: ${centrosUnicos.size}`);
      
      if (withoutCentro.length > 0) {
        console.warn('⚠️ UPs sin Centro Gestor (muestra):', 
          withoutCentro.slice(0, 3).map(i => ({ upid: i.upid, nombre: i.nombre_up }))
        );
      }
    }
  }, [state.attributeData]);

  // Handlers de eventos
  const handleFiltersChange = (newFilters: FilterParams) => {
    actions.setFilters(newFilters);
  };

  const handleSearchChange = (term: string) => {
    actions.setSearchTerm(term);
  };

  const handleClearFilters = () => {
    console.log('🧹 Limpiando filtros desde componente principal...');
    actions.clearFilters();
    // Forzar un refresh adicional para asegurar que se recarguen los datos
    setTimeout(() => {
      actions.refetch();
    }, 100);
  };

  const handleRefresh = () => {
    actions.refetch();
    refetchDashboard();
  };

  const handleExportFilteredData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      const { searchTerm, ...currentFilters } = filters;
      const exportFilters: FilterParams = { ...currentFilters };

      if (searchTerm && searchTerm.trim() !== '') {
        const normalizedSearch = searchTerm.trim();
        exportFilters.search = normalizedSearch;
        exportFilters.nombre_up = normalizedSearch;
      }

      const blob = await exportIntervencionesXlsx(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `intervenciones_filtradas_${dateTag}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error al descargar XLSX filtrado:', error);
      window.alert('No se pudo descargar el archivo XLSX. Inténtalo nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handlers para enfoque
  const handleItemFocus = (upid: string) => {
    if (upid === '') {
      // Limpiar enfoque
      setFocusedItem(null);
      setShowOnlyFocused(false);
    } else {
      setFocusedItem(upid);
      // Si no hay item enfocado previamente, no cambiar showOnlyFocused
      // Si ya había un item enfocado, mantener el estado actual
    }
  };

  const handleToggleShowOnlyFocused = () => {
    setShowOnlyFocused(!showOnlyFocused);
  };

  const handleShowDetails = (upid: string) => {
    setSelectedItemForModal(upid);
  };

  const handleCloseModal = () => {
    setSelectedItemForModal(null);
  };

  // Memorizar componentes pesados
  const memoizedMap = useMemo(() => {
    console.log('🎯 Creating memoized map with:', {
      filteredGeometryFeatures: filteredGeometry?.features?.length || 0,
      filteredDataCount: filteredData.length,
      hasFocusedItem: !!focusedItem,
      showOnlyFocused
    });
    
    return (
      <UnidadesProyectoMapSimple
        geometryData={filteredGeometry}
        filteredData={filteredData}
        className="h-full"
        focusedItem={focusedItem}
        showOnlyFocused={showOnlyFocused}
        onItemClick={handleItemFocus}
      />
    );
  }, [filteredGeometry, filteredData, focusedItem, showOnlyFocused]);

  // Renderizar loading principal
  if (state.loading) {
    return (
      <main className="space-y-6">
        <section className={`${CSS_UTILS.card} p-6`}>
          <LoadingSpinner message="Cargando datos de unidades de proyecto..." />
        </section>
      </main>
    );
  }

  // Renderizar error principal
  if (state.error) {
    return (
      <main className="space-y-6">
        <section className={`${CSS_UTILS.card} p-6`}>
          <ErrorDisplay error={state.error} onRetry={handleRefresh} />
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6 overflow-x-auto pb-4">
      {/* Header con controles - Responsive con scroll horizontal en tablets */}
      <section className={`${CSS_UTILS.card} p-4 md:p-6`}>
        <div className="min-w-[640px] md:min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 gap-3">
            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Unidades de Proyecto
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 whitespace-nowrap">
                  {filteredData.length} de {state.attributeData.length}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Sistema integrado de seguimiento y análisis de proyectos
              </p>
            </div>

            {/* Controles de vista y acciones */}
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {canExportFilteredData && (
                <button
                  onClick={handleExportFilteredData}
                  disabled={isExporting}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Descargar datos filtrados"
                >
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{isExporting ? 'Descargando...' : 'Descargar datos filtrados'}</span>
                  <span className="inline sm:hidden">{isExporting ? '...' : 'XLSX'}</span>
                </button>
              )}

              {/* Selector de vista */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    viewMode === 'split' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="w-3 h-3 md:w-4 md:h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                  <span className="hidden sm:inline">Mixto</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Map className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </button>
              </div>

              {/* Botón limpiar filtros - más visible */}
              {(Object.values(filters).some(value => value && value !== '') || filters.searchTerm) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors whitespace-nowrap"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                  <span className="inline sm:hidden">({Object.values(filters).filter(v => v && v !== '').length + (filters.searchTerm ? 1 : 0)})</span>
                  <span className="hidden sm:inline">({Object.values(filters).filter(v => v && v !== '').length + (filters.searchTerm ? 1 : 0)})</span>
                </button>
              )}
            </div>

            {/* Timestamp - Oculto en móvil, visible en tablet+ */}
            {state.lastUpdate && (
              <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="whitespace-nowrap">Actualizado: {state.lastUpdate.toLocaleString('es-CO')}</span>
              </div>
            )}
          </div>

          {/* Métricas compactas */}
          <div className="mt-4 md:mt-6">
            <CompactMetrics metrics={metrics} />
          </div>
        </div>
      </section>

      {/* Filtros solamente para vista de mapa (excluimos dashboard) */}
      <AnimatePresence>
        {showFilters && viewMode === 'map' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UnidadesProyectoFilters
              filterData={state.filterData}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onSearchChange={handleSearchChange}
              onClearFilters={handleClearFilters}
              isLoading={state.loading}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Contenido principal basado en vista */}
      <section className="space-y-6 overflow-x-auto">
        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${CSS_UTILS.card} p-4`}
          >
            <div className="h-[600px] rounded-lg overflow-hidden">
              {memoizedMap}
            </div>
          </motion.div>
        )}

        {viewMode === 'split' && (
          <div className="space-y-6">
            {/* Layout horizontal: Mapa + Filtros - Responsive con scroll */}
            <motion.div
              key="split-map-filters"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-x-auto"
            >
              <div className="min-w-[768px] md:min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                {/* Mapa - 3 columnas en tablet+ */}
                <div className={`${CSS_UTILS.card} p-4 md:col-span-3`}>
                  <div className="h-[500px] md:h-[650px] rounded-lg overflow-hidden">
                    {memoizedMap}
                  </div>
                </div>

                {/* Filtros - 1 columna, colapsable en móvil */}
                <div className="md:col-span-1 relative z-40">
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="h-[400px] md:h-[650px] overflow-y-auto relative z-40"
                        style={{ zIndex: 40 }}
                      >
                        <UnidadesProyectoFilters
                          filterData={state.filterData}
                          filters={filters}
                          onFiltersChange={handleFiltersChange}
                          onSearchChange={handleSearchChange}
                          onClearFilters={handleClearFilters}
                          isLoading={state.loading}
                          compact={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Tabla de Intervenciones en el Territorio */}
            <motion.div
              key="split-attributes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${CSS_UTILS.card} p-5`}
            >
              <UnidadesProyectoTabularView
                data={filteredData}
                onRowClick={handleItemFocus}
                focusedItem={focusedItem}
              />
            </motion.div>
          </div>
        )}
      </section>

      {/* Indicador de elemento enfocado - Esquina inferior derecha (más abajo para no tapar controles) */}
      {focusedItem && (
        <motion.div
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 20, y: 20 }}
          className="fixed bottom-16 right-4 z-30 bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium"
        >
          Enfocado: {focusedItem}
        </motion.div>
      )}

      {/* Modal de detalles */}
      <AnimatePresence>
        {selectedItemForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4"
            onClick={handleCloseModal}
            style={{ zIndex: 9998 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <ProjectDetailsModal
                item={filteredData.find(item => item.upid === selectedItemForModal)}
                onClose={handleCloseModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default UnidadesProyecto;