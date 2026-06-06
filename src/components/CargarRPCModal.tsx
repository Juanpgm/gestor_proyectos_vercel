"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  FileText,
  ChevronDown,
} from "lucide-react";
import FileUploadZone from "./FileUploadZone";
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
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  estado?: string;
  tipo?: string;
}

interface CargarRPCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contratoData?: ContratoData | null;
  rpcsExistentes?: RPC[];
  onEditRPC?: (rpc: RPC) => void;
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

const CargarRPCModal: React.FC<CargarRPCModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contratoData,
  rpcsExistentes = [],
  onEditRPC,
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showNuevoRPCForm, setShowNuevoRPCForm] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Pre-llenar formulario en modo creación
  useEffect(() => {
    if (isOpen && contratoData) {
      setFormData({
        numero_rpc: "",
        beneficiario_id: "",
        beneficiario_nombre: "",
        descripcion_rpc: "",
        fecha_contabilizacion: "",
        fecha_impresion: "",
        estado_liberacion: "Contabilizado",
        bp: "",
        valor_rpc: "",
        nombre_centro_gestor: contratoData.nombre_centro_gestor || "",
        referencia_contrato: contratoData.referencia_contrato || "",
      });
      setCdps([]);
      setPagosProgramados([]);
      setUploadedFiles([]);
    }
  }, [isOpen, contratoData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Funciones para manejar CDPs
  const agregarCDP = () => {
    setCdps([...cdps, { id: Date.now().toString(), numero: "" }]);
  };

  const actualizarCDP = (id: string, numero: string) => {
    setCdps(cdps.map((cdp) => (cdp.id === id ? { ...cdp, numero } : cdp)));
  };

  const eliminarCDP = (id: string) => {
    setCdps(cdps.filter((cdp) => cdp.id !== id));
  };

  // Funciones para manejar Pagos Programados
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

      // Preparar los datos para enviar con FormData (multipart/form-data)
      const dataToSend = new FormData();

      // Campos obligatorios
      dataToSend.append("numero_rpc", formData.numero_rpc);
      dataToSend.append("beneficiario_id", formData.beneficiario_id);
      dataToSend.append("beneficiario_nombre", formData.beneficiario_nombre);
      dataToSend.append("descripcion_rpc", formData.descripcion_rpc);
      dataToSend.append(
        "fecha_contabilizacion",
        formData.fecha_contabilizacion,
      );
      dataToSend.append("fecha_impresion", formData.fecha_impresion);
      dataToSend.append("estado_liberacion", formData.estado_liberacion);
      dataToSend.append("bp", formData.bp);
      dataToSend.append("valor_rpc", formData.valor_rpc);
      dataToSend.append("nombre_centro_gestor", formData.nombre_centro_gestor);
      dataToSend.append("referencia_contrato", formData.referencia_contrato);

      if (cdpsValidos.length > 0) {
        dataToSend.append("cdp_asociados", JSON.stringify(cdpsValidos));
        console.log("CDPs a enviar:", cdpsValidos);
      }

      if (Object.keys(programacionObj).length > 0) {
        dataToSend.append("programacion_pac", JSON.stringify(programacionObj));
        console.log("Programación PAC a enviar:", programacionObj);
      }

      // En modo creación: Validar que haya al menos un documento (OBLIGATORIO)
      if (uploadedFiles.length === 0) {
        throw new Error("Debes cargar al menos un documento de soporte");
      }

      uploadedFiles.forEach((file, index) => {
        dataToSend.append("documentos", file);
        console.log(`Documento ${index + 1}:`, file.name, file.size, file.type);
      });
      console.log(
        "Enviando POST request a:",
        `${apiUrl}/emprestito/cargar-rpc`,
      );
      console.log("Total archivos nuevos:", uploadedFiles.length);

      const response = await proxyFetch(`${apiUrl}/emprestito/cargar-rpc`, {
        method: "POST",
        // NO incluir Content-Type header - el navegador lo establece automáticamente con boundary
        body: dataToSend,
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      const result = await response.json();
      console.log("Response data:", result);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            `RPC duplicado: ${result.error || "Ya existe un RPC con este número"}`,
          );
        }
        throw new Error(
          result.error || `Error al cargar RPC: ${response.status}`,
        );
      }

      if (!result.success) {
        throw new Error(result.error || "Error al cargar el RPC");
      }

      setSuccess(true);

      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
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
        setCdps([]);
        setPagosProgramados([]);
        setUploadedFiles([]);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error al cargar RPC:", err);
      setError(
        err instanceof Error ? err.message : "Error desconocido al cargar RPC",
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        role="presentation"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cargar-rpc-title"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload className="w-6 h-6 text-white" />
              <div>
                <h2
                  id="cargar-rpc-title"
                  className="text-xl font-bold text-white"
                >
                  Cargar RPC
                </h2>
                {contratoData?.referencia_contrato && (
                  <p className="text-indigo-100 text-sm">
                    Contrato: {contratoData.referencia_contrato}
                  </p>
                )}
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
                  RPC cargado exitosamente
                </p>
              </div>
            )}

            {/* Sección: Historial de RPCs cargados */}
            {rpcsExistentes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  RPCs Cargados ({rpcsExistentes.length})
                </h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          N° RPC
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Beneficiario
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Valor
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Estado
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Fecha
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {rpcsExistentes.map((rpc) => (
                        <tr
                          key={rpc.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {rpc.numero_rpc}
                          </td>
                          <td
                            className="px-3 py-2 text-gray-600 dark:text-gray-300 truncate max-w-[160px]"
                            title={rpc.beneficiario_nombre}
                          >
                            {rpc.beneficiario_nombre || "-"}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900 dark:text-white whitespace-nowrap">
                            {rpc.valor_rpc
                              ? `$${Number(rpc.valor_rpc).toLocaleString("es-CO")}`
                              : "-"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                rpc.estado_liberacion === "Liberado"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : rpc.estado_liberacion === "Contabilizado"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {rpc.estado_liberacion || "-"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            {rpc.fecha_contabilizacion || "-"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (onEditRPC) {
                                  onEditRPC(rpc);
                                  onClose();
                                }
                              }}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar este RPC"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Toggle para mostrar formulario de nuevo RPC */}
            {rpcsExistentes.length > 0 && (
              <button
                type="button"
                onClick={() => setShowNuevoRPCForm(!showNuevoRPCForm)}
                className="w-full mb-4 flex items-center gap-3 group cursor-pointer"
              >
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-colors"></div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-4 h-4" />
                  Nuevo RPC
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showNuevoRPCForm ? "rotate-180" : ""}`}
                  />
                </span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-600 transition-colors"></div>
              </button>
            )}

            {(rpcsExistentes.length === 0 || showNuevoRPCForm) && (
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
                        onChange={handleChange}
                        required
                        placeholder="Ej: RPC-2024-001"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        onChange={handleChange}
                        required
                        readOnly
                        placeholder="Ej: Secretaría de Salud"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        title="Este campo se llena automáticamente del contrato seleccionado"
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
                        onChange={handleChange}
                        required
                        readOnly
                        placeholder="Ej: CONT-SALUD-003-2024"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                        title="Este campo se llena automáticamente del contrato seleccionado"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Cargar Archivos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Documentos de Soporte{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </h3>

                  <FileUploadZone
                    onFilesSelected={setUploadedFiles}
                    acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    maxFiles={5}
                    maxSizeMB={10}
                    label="Documentos de Soporte *"
                    description="Arrastra archivos aquí o haz clic para explorar (Obligatorio)"
                    required={true}
                  />
                </div>

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
                                        <option
                                          key={mes.value}
                                          value={mes.value}
                                        >
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
                                  onClick={() =>
                                    eliminarPagoProgramado(pago.id)
                                  }
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Cargando...</span>
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Cargado</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Cargar RPC</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CargarRPCModal;
