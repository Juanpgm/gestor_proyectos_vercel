"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  AlertCircle,
  Calendar,
  DollarSign,
  BarChart3,
  Building2,
  User,
  Info,
  Shield,
  ExternalLink,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { formatNumber } from "@/lib/design-system";
import {
  getContractStateColors,
  getMetricColors,
  getInfoColors,
} from "@/lib/contract-colors";
import ContractMetricsRings from "./ContractMetricsRings";
import ContractGantt from "./ContractGantt";
import ContractFinancialVisuals from "./ContractFinancialVisuals";
import ContractTimeSeries from "./ContractTimeSeries";
import {
  fetchPagosEmprestito,
  PagoEmprestito,
  formatCurrency,
  formatDate,
} from "@/services/pagos.service";
import { proxyFetch } from "@/utils/errorHandler";
import { downloadContratoFichaPdf } from "@/utils/contratoFichaPdf";

interface ReporteEmprestito {
  id: string;
  referencia_contrato: string;
  avance_fisico: number;
  avance_financiero: number;
  fecha_reporte: string;
  observaciones: string;
  nombre_centro_gestor: string;
  nombre_centro_gestor_source: string;
  estado_reporte: string;
  alertas: {
    descripcion: string;
    es_alerta: boolean;
    tipos: string[];
  };
  archivos_evidencia?: Array<{
    url: string;
    drive_id: string;
    name: string;
    type: string;
    size: number;
    status: string;
    download_url: string;
  }>;
  url_carpeta_drive?: string;
}

interface ContratosModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenciaContrato?: string;
  contratoData?: any;
  proyectoData?: any;
  reportes?: ReporteEmprestito[];
  pagos?: PagoEmprestito[];
}

// Componente para secciones colapsables minimalistas
// Removido - ya no se usa

// Función para formatear moneda
const formatearMoneda = (valor: any) => {
  if (!valor || valor === 0) return "No disponible";
  const numero =
    typeof valor === "string"
      ? parseFloat(valor.replace(/[^0-9.-]/g, ""))
      : valor;
  if (isNaN(numero)) return "No disponible";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(numero);
};

// Función para formatear fecha
const formatearFecha = (fecha: any) => {
  if (!fecha) return "No disponible";
  try {
    return new Date(fecha).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return fecha;
  }
};

const ContratosModal: React.FC<ContratosModalProps> = ({
  isOpen,
  onClose,
  referenciaContrato,
  contratoData,
  proyectoData,
  reportes = [],
  pagos = [],
}) => {
  const [contrato, setContrato] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandReportes, setExpandReportes] = useState(true);
  const [expandPagos, setExpandPagos] = useState(true);
  const [pagosList, setPagosList] = useState<PagoEmprestito[]>(pagos);
  const [descargandoFicha, setDescargandoFicha] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const loadContratoData = useCallback(async () => {
    if (!referenciaContrato) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar contratos
      const contratosResponse = await fetch("/api/contratos");
      if (!contratosResponse.ok) {
        throw new Error("Error al cargar datos de contratos");
      }

      const contratos: any[] = await contratosResponse.json();
      const contratoEncontrado = contratos.find(
        (c) => c.referencia_contrato === referenciaContrato,
      );

      if (!contratoEncontrado) {
        throw new Error(
          `No se encontró el contrato con referencia: ${referenciaContrato}`,
        );
      }

      // Cargar reportes asociados al contrato directamente del endpoint externo
      const reportesResponse = await proxyFetch(
        "/api/proxy/reportes_contratos/",
      );
      let reportesContrato = [];
      if (reportesResponse.ok) {
        const reportesData = await reportesResponse.json();

        const allReportes = reportesData.data || [];
        reportesContrato = allReportes.filter(
          (reporte: any) =>
            reporte.referencia_contrato?.trim() === referenciaContrato?.trim(),
        );
      } else {
        console.error(
          "Error en respuesta del API:",
          reportesResponse.status,
          reportesResponse.statusText,
        );
      }

      // Cargar pagos si no fueron proporcionados
      if (pagos.length === 0) {
        try {
          const pagosData = await fetchPagosEmprestito();
          const pagosContrato = pagosData.data.filter(
            (p) => p.referencia_contrato?.trim() === referenciaContrato?.trim(),
          );
          setPagosList(pagosContrato);
        } catch (err) {
          console.error("Error cargando pagos:", err);
        }
      }

      // Agregar reportes al contrato
      const contratoConReportes = {
        ...contratoEncontrado,
        reportes: reportesContrato,
      };

      setContrato(contratoConReportes);
    } catch (err) {
      console.error("Error cargando contrato:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [referenciaContrato, pagos]);

  useEffect(() => {
    if (isOpen && !contratoData) {
      loadContratoData();
    }
  }, [isOpen, contratoData, loadContratoData]);

  // Update pagosList when pagos prop changes
  useEffect(() => {
    if (pagos.length > 0) {
      setPagosList(
        pagos.filter(
          (p) =>
            p.referencia_contrato?.trim() === referenciaContrato?.trim() ||
            p.referencia_contrato?.trim() ===
              contratoData?.referencia_contrato?.trim(),
        ),
      );
    }
  }, [pagos, referenciaContrato, contratoData]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Issue #14: descargar la ficha del contrato como PDF
  const handleDescargarFicha = useCallback(async () => {
    const data: any = contratoData || contrato;
    if (!data) return;
    try {
      setDescargandoFicha(true);
      const reps =
        (Array.isArray(data.reportes) && data.reportes) || reportes || [];
      await downloadContratoFichaPdf(data, reps as any);
    } catch (err) {
      console.error("Error generando ficha PDF del contrato:", err);
      alert("No se pudo generar la ficha del contrato.");
    } finally {
      setDescargandoFicha(false);
    }
  }, [contratoData, contrato, reportes]);

  if (!isOpen) return null;
  if (!mounted || typeof document === "undefined") return null;

  // Usar contratoData si está disponible, sino cargar desde API
  const contractDataToShow = contratoData || contrato;

  // Obtener colores de estado para el header
  const headerColors = contractDataToShow?.estado_contrato
    ? getContractStateColors(contractDataToShow.estado_contrato)
    : getContractStateColors("Vigente");

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="presentation"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contratos-modal-title"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full h-[95vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con colores sólidos */}
          <div
            className={`bg-blue-600 border-blue-700 border-b p-4 flex-shrink-0`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    id="contratos-modal-title"
                    className="text-lg font-bold text-white mb-0.5 leading-tight"
                  >
                    {contractDataToShow?.descripcion_proceso ||
                      contractDataToShow?.objeto_del_contrato ||
                      contractDataToShow?.objeto_contrato ||
                      "Detalle del Contrato"}
                  </h2>
                  <div className="text-xs text-blue-100 opacity-90">
                    {contractDataToShow?.referencia_contrato ||
                      referenciaContrato}
                    {contractDataToShow?.proceso_compra && (
                      <span className="ml-2">
                        • Proceso: {contractDataToShow.proceso_compra}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => void handleDescargarFicha()}
                disabled={descargandoFicha}
                aria-label="Descargar ficha del contrato en PDF"
                title="Descargar ficha (PDF)"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 mr-1"
              >
                <Download className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                aria-label="Cerrar modal"
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable completo */}
          <div className="overflow-y-auto flex-grow min-h-0">
            <div className="p-4 space-y-4 pb-8">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    Cargando información...
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error al cargar datos</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                </div>
              )}

              {contractDataToShow && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 space-y-0 items-stretch min-h-0">
                  {/* Columna Izquierda */}
                  <div className="space-y-4 flex flex-col min-h-0 flex-1">
                    {/* Métricas visuales compactas */}
                    <div
                      className={`${getInfoColors("temporal").bg} ${getInfoColors("temporal").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3
                          className={`w-4 h-4 ${getInfoColors("temporal").icon}`}
                        />
                        Métricas de Ejecución
                      </h3>
                      <ContractMetricsRings
                        contrato={contractDataToShow}
                        pagosContrato={pagosList.reduce(
                          (sum, p) => sum + (Number(p.valor_pago) || 0),
                          0,
                        )}
                      />
                    </div>

                    {/* Serie de Tiempo del Contrato */}
                    <div
                      className={`${getInfoColors("temporal").bg} ${getInfoColors("temporal").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <TrendingUp
                          className={`w-4 h-4 ${getInfoColors("temporal").icon}`}
                        />
                        Evolución Temporal
                      </h3>
                      <ContractTimeSeries contrato={contractDataToShow} />
                    </div>

                    {/* Información Financiera Compacta */}
                    <div
                      className={`${getMetricColors("valor").bg} ${getMetricColors("valor").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <DollarSign
                          className={`w-4 h-4 ${getMetricColors("valor").icon}`}
                        />
                        Información Financiera
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">
                            Valor Contrato
                          </div>
                          <div
                            className={`font-semibold ${getMetricColors("valor").text} truncate`}
                          >
                            {formatearMoneda(
                              contractDataToShow.valor_contrato ||
                                contractDataToShow.valor_del_contrato,
                            )}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">
                            Valor Pagado
                          </div>
                          <div
                            className={`font-semibold ${getMetricColors("pagado").text} truncate`}
                          >
                            {formatCurrency(
                              pagosList.reduce(
                                (sum, p) => sum + (Number(p.valor_pago) || 0),
                                0,
                              ),
                            )}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">
                            Pendiente Pago
                          </div>
                          <div
                            className={`font-semibold ${getMetricColors("facturado").text} truncate`}
                          >
                            {formatearMoneda(
                              contractDataToShow.valor_pendiente_pago ||
                                contractDataToShow.valor_facturado,
                            )}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">
                            Estado
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${getContractStateColors(contractDataToShow.estado_contrato || "Vigente").badge} font-medium`}
                          >
                            {contractDataToShow.estado_contrato || "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del Contratista */}
                    <div
                      className={`${getInfoColors("contratista").bg} ${getInfoColors("contratista").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <User
                          className={`w-4 h-4 ${getInfoColors("contratista").icon}`}
                        />
                        Contratista
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Nombre:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.proveedor_adjudicado ||
                                contractDataToShow.contratista ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Documento:
                            </span>
                            <div className="font-mono text-gray-900 dark:text-white">
                              {contractDataToShow.documento_proveedor ||
                                contractDataToShow.numero_de_documento_del_contratista ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Tipo:
                          </span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {contractDataToShow.tipo_identificacion_representante_legal ||
                              contractDataToShow.tipo_de_documento_del_contratista ||
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información de Entidad Compacta */}
                    <div
                      className={`${getInfoColors("entidad").bg} ${getInfoColors("entidad").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Building2
                          className={`w-4 h-4 ${getInfoColors("entidad").icon}`}
                        />
                        Entidad
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Entidad:
                          </span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {contractDataToShow.nombre_entidad || "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Centro Gestor:
                          </span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {proyectoData?.nombre_centro_gestor ||
                              contractDataToShow.nombre_centro_gestor ||
                              "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            BPIN:
                          </span>
                          <div className="font-mono text-blue-600 dark:text-blue-400">
                            {contractDataToShow.bpin ||
                              proyectoData?.bpin ||
                              "N/A"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Ubicación:
                          </span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {contractDataToShow.ciudad ||
                              contractDataToShow.departamento ||
                              "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-4 flex flex-col min-h-0 flex-1">
                    {/* Cronograma Gantt Compacto */}
                    <div
                      className={`${getInfoColors("cronograma").bg} ${getInfoColors("cronograma").border} border rounded-lg p-3`}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar
                          className={`w-4 h-4 ${getInfoColors("cronograma").icon}`}
                        />
                        Cronograma
                      </h3>
                      <ContractGantt contrato={contractDataToShow} />
                    </div>

                    {/* Detalles Contractuales Compactos */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        Detalles Contractuales
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              ID Contrato:
                            </span>
                            <div className="font-mono text-gray-900 dark:text-white truncate">
                              {contractDataToShow.id_contrato ||
                                contractDataToShow.numero_del_contrato ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Tipo:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.tipo_contrato ||
                                contractDataToShow.tipo_de_contrato ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Modalidad:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.modalidad_contratacion ||
                                contractDataToShow.modalidad_de_selecci_n ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Sector:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contractDataToShow.sector ||
                                contractDataToShow.duración_contrato ||
                                contractDataToShow.duraci_n_del_contrato ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Código Categoría:
                            </span>
                            <div className="font-mono text-blue-600 dark:text-blue-400 truncate">
                              {contractDataToShow.codigo_categoria_principal ||
                                contractDataToShow.codigo_secop ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Supervisor:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.nombre_supervisor || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fechas Importantes Compactas */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Fechas Clave
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Firma:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow.fecha_de_firma ||
                                  contractDataToShow.fecha_firma,
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Inicio:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow.fecha_inicio_contrato ||
                                  contractDataToShow.fecha_de_inicio_contrato,
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Fin:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow.fecha_de_fin_del_contrato ||
                                  contractDataToShow.fecha_fin_contrato,
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Inicio Ejec.:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow.fecha_inicio_ejecucion,
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Fin Ejec.:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow.fecha_fin_ejecucion,
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Extracción:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(
                                contractDataToShow._registro_origen
                                  ?.fecha_extraccion,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aspectos Legales Compactos */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Aspectos Legales
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Recursos:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.origen_recursos ||
                                contractDataToShow.fuente_de_recursos ||
                                "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Ubicación:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.localizaci_n ||
                                contractDataToShow.ciudad ||
                                contractDataToShow.departamento ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Postconflicto:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contractDataToShow.espostconflicto || "N/A"}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Ambiental:
                            </span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.obligación_ambiental || "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pagos Realizados - Ancho Completo - Colapsable */}
                  {pagosList.length > 0 && (
                    <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <button
                        onClick={() => setExpandPagos(!expandPagos)}
                        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                      >
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          Historial de Pagos Realizados ({pagosList.length})
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-green-600 transition-transform ${expandPagos ? "rotate-180" : ""}`}
                        />
                      </button>

                      {expandPagos && (
                        <>
                          {/* Resumen de Pagos */}
                          <div className="grid grid-cols-2 gap-2 mb-3 mt-3">
                            <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Total Pagado
                              </div>
                              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(
                                  pagosList.reduce(
                                    (sum, p) =>
                                      sum + (Number(p.valor_pago) || 0),
                                    0,
                                  ),
                                )}
                              </div>
                            </div>
                            <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                % del Contrato
                              </div>
                              <div className="text-sm font-bold text-green-600 dark:text-green-400">
                                {contractDataToShow?.valor_contrato
                                  ? (
                                      (pagosList.reduce(
                                        (sum, p) =>
                                          sum + (Number(p.valor_pago) || 0),
                                        0,
                                      ) /
                                        Number(
                                          contractDataToShow.valor_contrato,
                                        )) *
                                      100
                                    ).toFixed(2)
                                  : "0.00"}
                                %
                              </div>
                            </div>
                          </div>

                          {/* Lista de Pagos */}
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {pagosList
                              .sort(
                                (a, b) =>
                                  new Date(b.fecha_transaccion).getTime() -
                                  new Date(a.fecha_transaccion).getTime(),
                              )
                              .map((pago, idx) => (
                                <div
                                  key={`${pago.id}-${idx}`}
                                  className="bg-white/60 dark:bg-gray-700/40 rounded p-2 text-xs border border-green-200 dark:border-green-800"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-green-700 dark:text-green-300 truncate">
                                          RPC: {pago.numero_rpc}
                                        </span>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                            pago.estado === "registrado"
                                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                          }`}
                                        >
                                          {pago.estado}
                                        </span>
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400">
                                        Fecha:{" "}
                                        {formatDate(pago.fecha_transaccion)}
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(pago.valor_pago)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Observaciones y Alertas de Reportes - Ancho Completo - Colapsable */}
                  {(reportes.length > 0 ||
                    contractDataToShow?.reportes?.length > 0) && (
                    <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3">
                      <button
                        onClick={() => setExpandReportes(!expandReportes)}
                        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                      >
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          Historial de Reportes (
                          {
                            (
                              reportes.filter(
                                (r) =>
                                  r.referencia_contrato ===
                                  contractDataToShow?.referencia_contrato,
                              ) ||
                              contractDataToShow?.reportes ||
                              []
                            ).length
                          }
                          )
                        </h3>
                        <ChevronDown
                          className={`w-4 h-4 text-purple-600 transition-transform ${expandReportes ? "rotate-180" : ""}`}
                        />
                      </button>

                      {expandReportes && (
                        <div className="space-y-2 mt-3 max-h-[500px] overflow-y-auto">
                          {(
                            reportes.filter(
                              (r) =>
                                r.referencia_contrato ===
                                contractDataToShow?.referencia_contrato,
                            ) ||
                            contractDataToShow?.reportes ||
                            []
                          )
                            .sort(
                              (a, b) =>
                                new Date(b.fecha_reporte).getTime() -
                                new Date(a.fecha_reporte).getTime(),
                            )
                            .map((reporte, idx) => (
                              <div
                                key={`${reporte.id}-${idx}`}
                                className="bg-white/60 dark:bg-gray-700/40 rounded-lg p-2 border border-purple-200 dark:border-purple-800"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1">
                                    <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                      {formatearFecha(reporte.fecha_reporte)}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {reporte.nombre_centro_gestor ||
                                        "Centro gestor no especificado"}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                      Físico:{" "}
                                      {(reporte.avance_fisico || 0).toFixed(1)}%
                                    </div>
                                    <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                                      Financiero:{" "}
                                      {(reporte.avance_financiero || 0).toFixed(
                                        1,
                                      )}
                                      %
                                    </div>
                                  </div>
                                </div>
                                {reporte.observaciones && (
                                  <div className="text-xs text-gray-700 dark:text-gray-300 bg-white/40 dark:bg-gray-800/40 rounded px-2 py-1 mb-1">
                                    <span className="font-medium">
                                      Observaciones:{" "}
                                    </span>
                                    {reporte.observaciones}
                                  </div>
                                )}
                                {reporte.alertas?.es_alerta && (
                                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 mb-1 flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span>
                                      <span className="font-medium">
                                        Alerta:{" "}
                                      </span>
                                      {reporte.alertas.descripcion}
                                    </span>
                                  </div>
                                )}
                                {reporte.url_carpeta_drive && (
                                  <a
                                    href={reporte.url_carpeta_drive}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Ver Evidencia en Drive
                                  </a>
                                )}
                              </div>
                            ))}
                          {(
                            reportes.filter(
                              (r) =>
                                r.referencia_contrato ===
                                contractDataToShow?.referencia_contrato,
                            ) ||
                            contractDataToShow?.reportes ||
                            []
                          ).length === 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 italic py-4 text-center">
                              No hay reportes disponibles para este contrato
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Objeto del Contrato - Ancho Completo */}
                  <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600" />
                      Objeto del Contrato
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {contractDataToShow.descripcion_proceso ||
                        contractDataToShow.objeto_contrato ||
                        contractDataToShow.objeto_del_contrato ||
                        "No se ha proporcionado una descripción del objeto del contrato."}
                    </p>
                  </div>

                  {/* Enlaces y acciones - Ancho Completo y Mejorada Visibilidad */}
                  {(contractDataToShow.urlproceso?.url ||
                    contractDataToShow.urlproceso) && (
                    <div className="col-span-1 lg:col-span-2 pt-4 mt-4 border-t-2 border-gray-300 dark:border-gray-600">
                      <div className="space-y-3">
                        <div className="text-center">
                          <button
                            onClick={() => {
                              const url =
                                contractDataToShow.urlproceso?.url ||
                                contractDataToShow.urlproceso;
                              if (typeof url === "string" && url.trim()) {
                                window.open(
                                  url.trim(),
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-sm transform hover:scale-105 duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Ver en SECOP
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default ContratosModal;
