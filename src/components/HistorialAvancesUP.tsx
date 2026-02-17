"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BarChart3,
  User
} from 'lucide-react';
import { useAvancesUP } from '@/hooks/useAvancesUP';
import { formatCurrency } from '@/utils/formatCurrency';
import type { AvanceUP } from '@/types/avances-up';

interface HistorialAvancesUPProps {
  upid: string;
  nombreUP: string;
  onClose: () => void;
  onRegistrarAvance?: () => void;
}

const TendenciaIcon: React.FC<{ tendencia: 'subiendo' | 'estable' | 'bajando' }> = ({ tendencia }) => {
  switch (tendencia) {
    case 'subiendo':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'bajando':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

const AvanceCard: React.FC<{
  avance: AvanceUP;
  isLatest: boolean;
  prevAvance?: AvanceUP;
  onDelete: (id: string) => void;
}> = ({ avance, isLatest, prevAvance, onDelete }) => {
  const [expanded, setExpanded] = useState(isLatest);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const diffFisico = prevAvance ? avance.avance_fisico - prevAvance.avance_fisico : 0;
  const diffFinanciero = prevAvance ? avance.avance_financiero - prevAvance.avance_financiero : 0;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden ${
        isLatest
          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {/* Header del avance */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(avance.fecha_reporte)}
              </span>
              {isLatest && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                  Más reciente
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                avance.estado_reporte === 'aprobado'
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : avance.estado_reporte === 'enviado'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  : avance.estado_reporte === 'rechazado'
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {avance.estado_reporte}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {avance.avance_fisico.toFixed(1)}%
              </span>
              {prevAvance && diffFisico !== 0 && (
                <span className={`text-xs font-medium ${diffFisico > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {diffFisico > 0 ? '+' : ''}{diffFisico.toFixed(1)}%
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Físico</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {avance.avance_financiero.toFixed(1)}%
              </span>
              {prevAvance && diffFinanciero !== 0 && (
                <span className={`text-xs font-medium ${diffFinanciero > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {diffFinanciero > 0 ? '+' : ''}{diffFinanciero.toFixed(1)}%
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Financiero</span>
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Barras de progreso */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Avance Físico</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {avance.avance_fisico.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(avance.avance_fisico, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Avance Financiero</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {avance.avance_financiero.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(avance.avance_financiero, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Valor ejecutado */}
              {avance.valor_ejecutado > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600 dark:text-gray-400">Valor ejecutado:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(avance.valor_ejecutado)}
                  </span>
                </div>
              )}

              {/* Observaciones */}
              {avance.observaciones && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Observaciones
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {avance.observaciones}
                  </p>
                </div>
              )}

              {/* Archivos adjuntos */}
              {avance.archivos.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Archivos adjuntos ({avance.archivos.length})
                  </span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {avance.archivos.map(archivo => (
                      <span
                        key={archivo.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300"
                      >
                        <FileText className="w-3 h-3" />
                        {archivo.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span>{avance.reportado_por}</span>
                  <span>•</span>
                  <span>{formatDate(avance.created_at)}</span>
                </div>
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">¿Eliminar?</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(avance.id); }}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                      >
                        Sí
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      title="Eliminar avance"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const HistorialAvancesUP: React.FC<HistorialAvancesUPProps> = ({
  upid,
  nombreUP,
  onClose,
  onRegistrarAvance
}) => {
  const { avances, loading, error, resumen, deleteAvance } = useAvancesUP(upid);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Historial de Avances</h2>
              <p className="text-purple-100 text-sm truncate max-w-md">
                {upid} - {nombreUP}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Resumen */}
        {resumen && (
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {resumen.total_reportes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Reportes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {resumen.ultimo_avance_fisico.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Últ. Físico</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {resumen.ultimo_avance_financiero.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Últ. Financiero</p>
              </div>
              <div className="flex flex-col items-center">
                <TendenciaIcon tendencia={resumen.tendencia} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                  {resumen.tendencia}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
            </div>
          ) : avances.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No hay avances registrados
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Registra el primer avance para esta unidad de proyecto
                </p>
              </div>
              {onRegistrarAvance && (
                <button
                  onClick={onRegistrarAvance}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Registrar Primer Avance
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {avances.map((avance, index) => (
                <AvanceCard
                  key={avance.id}
                  avance={avance}
                  isLatest={index === 0}
                  prevAvance={avances[index + 1]}
                  onDelete={deleteAvance}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {avances.length} reporte{avances.length !== 1 ? 's' : ''} registrado{avances.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
            {onRegistrarAvance && avances.length > 0 && (
              <button
                onClick={onRegistrarAvance}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Nuevo Avance
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HistorialAvancesUP;
