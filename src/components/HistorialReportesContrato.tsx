"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type {
  ReporteContrato,
  ResumenReportesContrato,
} from "@/types/avances-emprestito";

interface HistorialReportesContratoProps {
  isOpen: boolean;
  onClose: () => void;
  referenciaContrato: string;
  nombreContrato?: string;
  reportes: ReporteContrato[];
  resumen: ResumenReportesContrato;
  loading?: boolean;
  onRefresh?: () => void;
  onDelete?: (id: string) => Promise<boolean>;
  canDelete?: boolean;
}

const TendenciaIcon: React.FC<{ tendencia: string }> = ({ tendencia }) => {
  switch (tendencia) {
    case "subiendo":
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "bajando":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    case "estable":
      return <Minus className="w-4 h-4 text-gray-400" />;
    default:
      return <Minus className="w-4 h-4 text-gray-300" />;
  }
};

const formatearFecha = (fecha: string) => {
  try {
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fecha;
  }
};

const HistorialReportesContrato: React.FC<HistorialReportesContratoProps> = ({
  isOpen,
  onClose,
  referenciaContrato,
  nombreContrato,
  reportes,
  resumen,
  loading = false,
  onRefresh,
  onDelete,
  canDelete = false,
}) => {
  const [expandedReporte, setExpandedReporte] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!onDelete || deletingId) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Historial de Reportes
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {nombreContrato || referenciaContrato}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw
                    className={`w-5 h-5 text-white ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Resumen */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Reportes
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {resumen.total_reportes}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Avance Físico{" "}
                  <TendenciaIcon tendencia={resumen.tendencia_fisica} />
                </p>
                <p className="text-xl font-bold text-teal-600">
                  {resumen.ultimo_avance_fisico.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Avance Financiero{" "}
                  <TendenciaIcon tendencia={resumen.tendencia_financiera} />
                </p>
                <p className="text-xl font-bold text-cyan-600">
                  {resumen.ultimo_avance_financiero.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Alertas
                </p>
                <p
                  className={`text-xl font-bold ${resumen.tiene_alertas_activas ? "text-orange-500" : "text-green-500"}`}
                >
                  {resumen.tiene_alertas_activas ? "Activa" : "Sin alertas"}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de reportes o loading */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Cargando reportes...
                </p>
              </div>
            ) : reportes.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Sin reportes
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  No se han registrado reportes de avance para este contrato.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportes.map((reporte, index) => {
                  const isExpanded = expandedReporte === reporte.id;
                  const prevReporte =
                    index < reportes.length - 1 ? reportes[index + 1] : null;
                  const diffFisico = prevReporte
                    ? reporte.avance_fisico - prevReporte.avance_fisico
                    : null;
                  const diffFinanciero = prevReporte
                    ? reporte.avance_financiero - prevReporte.avance_financiero
                    : null;

                  return (
                    <motion.div
                      key={reporte.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* Cabecera del reporte */}
                      <button
                        onClick={() =>
                          setExpandedReporte(isExpanded ? null : reporte.id)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              reporte.alertas?.es_alerta
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatearFecha(reporte.fecha_reporte)}
                            </p>
                            {index === 0 && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                Más reciente
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-sm font-medium text-teal-600">
                              F: {reporte.avance_fisico?.toFixed(1)}%
                            </span>
                            {diffFisico !== null && (
                              <span
                                className={`text-xs ml-1 ${diffFisico >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                ({diffFisico >= 0 ? "+" : ""}
                                {diffFisico.toFixed(1)})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-cyan-600">
                              $: {reporte.avance_financiero?.toFixed(1)}%
                            </span>
                            {diffFinanciero !== null && (
                              <span
                                className={`text-xs ml-1 ${diffFinanciero >= 0 ? "text-green-500" : "text-red-500"}`}
                              >
                                ({diffFinanciero >= 0 ? "+" : ""}
                                {diffFinanciero.toFixed(1)})
                              </span>
                            )}
                          </div>
                          {canDelete && onDelete && reporte.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(reporte.id);
                              }}
                              disabled={deletingId === reporte.id}
                              title="Eliminar reporte"
                              className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                            >
                              {deletingId === reporte.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Detalle expandido */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-200 dark:border-gray-700"
                          >
                            <div className="p-4 space-y-3">
                              {/* Barras de avance */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Avance Físico
                                  </p>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                    <div
                                      className="bg-teal-500 h-3 rounded-full transition-all"
                                      style={{
                                        width: `${reporte.avance_fisico || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="text-sm font-medium text-teal-600 mt-1">
                                    {reporte.avance_fisico?.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Avance Financiero
                                  </p>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                    <div
                                      className="bg-cyan-500 h-3 rounded-full transition-all"
                                      style={{
                                        width: `${reporte.avance_financiero || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="text-sm font-medium text-cyan-600 mt-1">
                                    {reporte.avance_financiero?.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              {/* Observaciones */}
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Observaciones
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                  {reporte.observaciones || "Sin observaciones"}
                                </p>
                              </div>

                              {/* Alertas */}
                              {reporte.alertas?.es_alerta && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-sm font-medium mb-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    Alerta Activa
                                  </div>
                                  <p className="text-sm text-orange-600 dark:text-orange-400">
                                    {reporte.alertas.descripcion}
                                  </p>
                                  {reporte.alertas.tipos?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {reporte.alertas.tipos.map((tipo) => (
                                        <span
                                          key={tipo}
                                          className="px-2 py-0.5 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 rounded-full text-xs"
                                        >
                                          {tipo}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Archivos de evidencia */}
                              {reporte.archivos_evidencia &&
                                reporte.archivos_evidencia.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                      Archivos de Evidencia (
                                      {reporte.archivos_evidencia.length})
                                    </p>
                                    <div className="space-y-1">
                                      {reporte.archivos_evidencia.map(
                                        (archivo, idx) => (
                                          <a
                                            key={idx}
                                            href={
                                              archivo.download_url ||
                                              archivo.url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-2 py-1 transition-colors"
                                          >
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">
                                              {archivo.name}
                                            </span>
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                          </a>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Link carpeta Drive */}
                              {reporte.url_carpeta_drive && (
                                <a
                                  href={reporte.url_carpeta_drive}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Ver carpeta en Google Drive
                                </a>
                              )}

                              {/* Centro gestor */}
                              {reporte.nombre_centro_gestor && (
                                <p className="text-xs text-gray-400">
                                  Centro Gestor: {reporte.nombre_centro_gestor}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HistorialReportesContrato;
