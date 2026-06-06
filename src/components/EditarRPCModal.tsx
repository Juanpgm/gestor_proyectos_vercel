"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  FileText,
} from "lucide-react";
import { proxyFetch } from "@/utils/errorHandler";

interface ContratoData {
  referencia_contrato?: string;
  numero_contrato?: string;
  objeto_contrato?: string;
  valor_contrato?: number;
  nombre_centro_gestor?: string;
  contratista?: string;
  nit_contratista?: string;
  entidad_contratante?: string;
  [key: string]: any;
}

interface RPC {
  id: string;
  numero_rpc: string;
  referencia_contrato: string;
  beneficiario_id?: string;
  beneficiario_nombre?: string;
  descripcion_rpc?: string;
  fecha_contabilizacion?: string;
  fecha_impresion?: string;
  estado_liberacion?: string;
  bp?: string;
  valor_rpc?: number;
  cdp_asociados?: string[];
  programacion_pac?: { [key: string]: string };
  nombre_centro_gestor?: string;
  documentos_urls?: string[];
  documentos_s3?: Array<{
    s3_url: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  estado?: string;
  tipo?: string;
}

interface EditarRPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rpcData: RPC | null;
  contratoData?: ContratoData | null;
}

interface FormData {
  numero_rpc: string;
  beneficiario_id: string;
  beneficiario_nombre: string;
  descripcion_rpc: string;
  fecha_contabilizacion: string;
  fecha_impresion: string;
  estado_liberacion: string;
  bp: string;
  valor_rpc: string;
  nombre_centro_gestor: string;
  referencia_contrato: string;
}

interface CDP {
  id: string;
  numero: string;
}

interface PagoProgramado {
  id: string;
  mes: string;
  anio: string;
  valor: string;
}

const EditarRPCModal: React.FC<EditarRPCModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rpcData,
  contratoData,
}) => {
  const [formData, setFormData] = useState<FormData>({
    numero_rpc: "",
    beneficiario_id: "",
    beneficiario_nombre: "",
    descripcion_rpc: "",
    fecha_contabilizacion: "",
    fecha_impresion: "",
    estado_liberacion: "Contabilizado",
    bp: "",
    valor_rpc: "",
    nombre_centro_gestor: "",
    referencia_contrato: "",
  });

  const [cdps, setCdps] = useState<CDP[]>([]);
  const [pagosProgramados, setPagosProgramados] = useState<PagoProgramado[]>(
    [],
  );
  const [archivosExistentes, setArchivosExistentes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && rpcData) {
      setFormData({
        numero_rpc: rpcData.numero_rpc || "",
        beneficiario_id: rpcData.beneficiario_id || "",
        beneficiario_nombre: rpcData.beneficiario_nombre || "",
        descripcion_rpc: rpcData.descripcion_rpc || "",
        fecha_contabilizacion: rpcData.fecha_contabilizacion || "",
        fecha_impresion: rpcData.fecha_impresion || "",
        estado_liberacion: rpcData.estado_liberacion || "Contabilizado",
        bp: rpcData.bp || "",
        valor_rpc: rpcData.valor_rpc ? String(rpcData.valor_rpc) : "",
        nombre_centro_gestor:
          rpcData.nombre_centro_gestor ||
          contratoData?.nombre_centro_gestor ||
          "",
        referencia_contrato:
          rpcData.referencia_contrato ||
          contratoData?.referencia_contrato ||
          "",
      });

      if (rpcData.cdp_asociados && Array.isArray(rpcData.cdp_asociados)) {
        setCdps(
          rpcData.cdp_asociados.map((cdp, index) => ({
            id: `cdp-${Date.now()}-${index}`,
            numero: cdp,
          })),
        );
      } else {
        setCdps([]);
      }

      if (
        rpcData.programacion_pac &&
        typeof rpcData.programacion_pac === "object"
      ) {
        const pagos = Object.entries(rpcData.programacion_pac).map(
          ([key, valor], index) => {
            const [mes, anio] = key.split("-");
            return {
              id: `pago-${Date.now()}-${index}`,
              mes: mes || "",
              anio: anio || new Date().getFullYear().toString(),
              valor: String(valor),
            };
          },
        );
        setPagosProgramados(pagos);
      } else {
        setPagosProgramados([]);
      }

      if (rpcData.documentos_urls && Array.isArray(rpcData.documentos_urls)) {
        setArchivosExistentes(rpcData.documentos_urls);
      } else {
        setArchivosExistentes([]);
      }

      setError(null);
      setSuccess(false);
    }
  }, [isOpen, rpcData, contratoData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const agregarCDP = () => {
    setCdps([...cdps, { id: Date.now().toString(), numero: "" }]);
  };

  const actualizarCDP = (id: string, numero: string) => {
    setCdps(cdps.map((cdp) => (cdp.id === id ? { ...cdp, numero } : cdp)));
  };

  const eliminarCDP = (id: string) => {
    setCdps(cdps.filter((cdp) => cdp.id !== id));
  };

  const agregarPagoProgramado = () => {
    setPagosProgramados([
      ...pagosProgramados,
      {
        id: Date.now().toString(),
        mes: "",
        anio: new Date().getFullYear().toString(),
        valor: "",
      },
    ]);
  };

  const actualizarPagoProgramado = (
    id: string,
    campo: keyof PagoProgramado,
    valor: string,
  ) => {
    setPagosProgramados(
      pagosProgramados.map((pago) =>
        pago.id === id ? { ...pago, [campo]: valor } : pago,
      ),
    );
  };

  const eliminarPagoProgramado = (id: string) => {
    setPagosProgramados(pagosProgramados.filter((pago) => pago.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = "/api/proxy";

      const cdpsValidos = cdps
        .map((cdp) => cdp.numero?.trim())
        .filter(Boolean) as string[];

      const pagosValidos = pagosProgramados.filter(
        (p) => p.mes && p.anio && p.valor,
      );
      const programacionObj: { [key: string]: string } = {};
      pagosValidos.forEach((pago) => {
        const key = `${pago.mes}-${pago.anio}`;
        programacionObj[key] = pago.valor;
      });

      const numeroRpc =
        formData.numero_rpc?.trim() || rpcData?.numero_rpc?.trim();

      if (!numeroRpc) {
        throw new Error("No se encontró el número RPC para actualizar");
      }

      const valorRpcNumerico = Number(formData.valor_rpc);
      const datosActualizacion: Record<string, any> = {
        beneficiario_id: formData.beneficiario_id,
        beneficiario_nombre: formData.beneficiario_nombre,
        descripcion_rpc: formData.descripcion_rpc,
        fecha_contabilizacion: formData.fecha_contabilizacion,
        fecha_impresion: formData.fecha_impresion,
        estado_liberacion: formData.estado_liberacion,
        bp: formData.bp,
        nombre_centro_gestor: formData.nombre_centro_gestor,
        referencia_contrato: formData.referencia_contrato,
        ...(Number.isFinite(valorRpcNumerico)
          ? { valor_rpc: valorRpcNumerico }
          : {}),
        ...(cdpsValidos.length > 0 ? { cdp_asociados: cdpsValidos } : {}),
        ...(Object.keys(programacionObj).length > 0
          ? { programacion_pac: programacionObj }
          : {}),
      };

      const payload = new URLSearchParams();
      payload.append("numero_rpc", numeroRpc);
      payload.append("datos_actualizacion", JSON.stringify(datosActualizacion));

      const response = await proxyFetch(`${apiUrl}/emprestito/modificar-rpc`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Error al actualizar RPC: ${response.status}`,
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar el RPC");
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error al actualizar RPC:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al actualizar RPC",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError(null);
      setSuccess(false);
    }
  };

  const meses = [
    { value: "enero", label: "Enero" },
    { value: "febrero", label: "Febrero" },
    { value: "marzo", label: "Marzo" },
    { value: "abril", label: "Abril" },
    { value: "mayo", label: "Mayo" },
    { value: "junio", label: "Junio" },
    { value: "julio", label: "Julio" },
    { value: "agosto", label: "Agosto" },
    { value: "septiembre", label: "Septiembre" },
    { value: "octubre", label: "Octubre" },
    { value: "noviembre", label: "Noviembre" },
    { value: "diciembre", label: "Diciembre" },
  ];

  const anioMinimoProgramacion = 2024;
  const anioMaximoProgramacion = new Date().getFullYear() + 9;
  const aniosDisponibles = Array.from(
    { length: anioMaximoProgramacion - anioMinimoProgramacion + 1 },
    (_, i) => (anioMinimoProgramacion + i).toString(),
  );

  if (!isOpen || !rpcData) return null;

  return (
    <AnimatePresence>
      <div
        role="presentation"
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-rpc-title"
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Edit2 className="w-6 h-6 text-white" />
              <div>
                <h2
                  id="editar-rpc-title"
                  className="text-xl font-bold text-white"
                >
                  Editar RPC
                </h2>
                <p className="text-blue-100 text-sm">{rpcData.numero_rpc}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              aria-label="Cerrar modal"
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  RPC actualizado exitosamente
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sección: Información del RPC */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Información del RPC
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Número RPC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="numero_rpc"
                      value={formData.numero_rpc}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      title="El número RPC no se puede modificar"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estado de Liberación{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="estado_liberacion"
                      value={formData.estado_liberacion}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Contabilizado">Contabilizado</option>
                      <option value="Liberado">Liberado</option>
                      <option value="No Liberado">No Liberado</option>
                      <option value="Parcialmente Liberado">
                        Parcialmente Liberado
                      </option>
                      <option value="Bloqueado">Bloqueado</option>
                      <option value="Pendiente de Liberación">
                        Pendiente de Liberación
                      </option>
                      <option value="En Proceso de Liberación">
                        En Proceso de Liberación
                      </option>
                      <option value="Anulado">Anulado</option>
                      <option value="Suspendido">Suspendido</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción RPC <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="descripcion_rpc"
                      value={formData.descripcion_rpc}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Descripción detallada del compromiso"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Beneficiario */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Información del Beneficiario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID Beneficiario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="beneficiario_id"
                      value={formData.beneficiario_id}
                      onChange={handleChange}
                      required
                      placeholder="Ej: 890123456"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre Beneficiario{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="beneficiario_nombre"
                      value={formData.beneficiario_nombre}
                      onChange={handleChange}
                      required
                      placeholder="Nombre completo del beneficiario"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Fechas y Valores */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Fechas y Valores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Contabilización{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fecha_contabilizacion"
                      value={formData.fecha_contabilizacion}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha Impresión <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="fecha_impresion"
                      value={formData.fecha_impresion}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor RPC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="valor_rpc"
                      value={formData.valor_rpc}
                      onChange={handleChange}
                      required
                      step="0.01"
                      placeholder="Ej: 50000000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código BP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bp"
                      value={formData.bp}
                      onChange={handleChange}
                      required
                      placeholder="Ej: BP-2024-001"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Contrato y Centro Gestor */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Contrato y Centro Gestor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Centro Gestor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombre_centro_gestor"
                      value={formData.nombre_centro_gestor}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Referencia Contrato{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="referencia_contrato"
                      value={formData.referencia_contrato}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Documentos existentes (solo lectura) */}
              {archivosExistentes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Documentos de Soporte
                  </h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Archivos actuales ({archivosExistentes.length})
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                      Los documentos no se pueden modificar desde este
                      formulario.
                    </p>
                    <div className="space-y-2">
                      {archivosExistentes.map((url, index) => {
                        const filename =
                          url.split("/").pop() || `Documento ${index + 1}`;
                        let fixedUrl = url;
                        if (fixedUrl.includes(".s3.us-east-1.amazonaws.com")) {
                          fixedUrl = fixedUrl.replace(
                            ".s3.us-east-1.amazonaws.com",
                            ".s3.us-east-2.amazonaws.com",
                          );
                        }
                        if (
                          fixedUrl.includes(".s3.amazonaws.com") &&
                          !fixedUrl.includes(".s3.us-east-2.amazonaws.com")
                        ) {
                          fixedUrl = fixedUrl.replace(
                            ".s3.amazonaws.com",
                            ".s3.us-east-2.amazonaws.com",
                          );
                        }
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700"
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span
                                className="text-sm text-gray-700 dark:text-gray-300 truncate"
                                title={filename}
                              >
                                {filename}
                              </span>
                            </div>
                            <a
                              href={fixedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex-shrink-0"
                            >
                              Ver
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección: Información Adicional (Opcional) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Información Adicional (Opcional)
                </h3>
                <div className="space-y-4">
                  {/* CDPs Asociados */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        CDPs Asociados
                      </label>
                      <button
                        type="button"
                        onClick={agregarCDP}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar CDP</span>
                      </button>
                    </div>

                    {cdps.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No hay CDPs asociados. Haga clic en &quot;Agregar
                        CDP&quot; para añadir uno.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {cdps.map((cdp, index) => (
                          <div
                            key={cdp.id}
                            className="flex items-center space-x-2"
                          >
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                              {index + 1}.
                            </span>
                            <input
                              type="text"
                              value={cdp.numero}
                              onChange={(e) =>
                                actualizarCDP(cdp.id, e.target.value)
                              }
                              placeholder="Ej: CDP-2024-100"
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => eliminarCDP(cdp.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar CDP"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Programación PAC */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Programación PAC
                      </label>
                      <button
                        type="button"
                        onClick={agregarPagoProgramado}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar Pago</span>
                      </button>
                    </div>

                    {pagosProgramados.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No hay pagos programados. Haga clic en &quot;Agregar
                        Pago&quot; para añadir uno.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {pagosProgramados.map((pago, index) => (
                          <div
                            key={pago.id}
                            className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
                          >
                            <div className="flex items-start space-x-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-2">
                                {index + 1}.
                              </span>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Mes
                                  </label>
                                  <select
                                    value={pago.mes}
                                    onChange={(e) =>
                                      actualizarPagoProgramado(
                                        pago.id,
                                        "mes",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                  >
                                    <option value="">Seleccione...</option>
                                    {meses.map((mes) => (
                                      <option key={mes.value} value={mes.value}>
                                        {mes.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Año
                                  </label>
                                  <select
                                    value={pago.anio}
                                    onChange={(e) =>
                                      actualizarPagoProgramado(
                                        pago.id,
                                        "anio",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                  >
                                    {aniosDisponibles.map((anio) => (
                                      <option key={anio} value={anio}>
                                        {anio}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Valor
                                  </label>
                                  <input
                                    type="number"
                                    value={pago.valor}
                                    onChange={(e) =>
                                      actualizarPagoProgramado(
                                        pago.id,
                                        "valor",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ej: 10000000"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarPagoProgramado(pago.id)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-5"
                                title="Eliminar pago"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Actualizado</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      <span>Actualizar RPC</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditarRPCModal;
