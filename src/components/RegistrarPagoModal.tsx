"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  DollarSign,
  Calendar,
  FileText,
  Building,
  Save,
  AlertCircle,
} from "lucide-react";
import FileUploadZone from "./FileUploadZone";

interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  rpcData: {
    numero_rpc: string;
    referencia_contrato?: string;
    nombre_centro_gestor?: string;
  };
  onSuccess: () => void;
}

const RegistrarPagoModal: React.FC<RegistrarPagoModalProps> = ({
  isOpen,
  onClose,
  rpcData,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    numero_rpc: rpcData.numero_rpc,
    valor_pago: "",
    fecha_transaccion: "",
    referencia_contrato: rpcData.referencia_contrato || "",
    nombre_centro_gestor: rpcData.nombre_centro_gestor || "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, loading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si no hay documentos, mostrar diálogo de confirmación
    if (uploadedFiles.length === 0 && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }

    // Continuar con el registro
    await procesarRegistroPago();
  };

  const procesarRegistroPago = async () => {
    setLoading(true);
    setError(null);
    setShowConfirmDialog(false);

    try {
      // Validaciones
      if (!formData.numero_rpc.trim()) {
        throw new Error("El número de RPC es obligatorio");
      }
      if (!formData.valor_pago || Number(formData.valor_pago) <= 0) {
        throw new Error("El valor del pago debe ser mayor a 0");
      }
      if (!formData.fecha_transaccion) {
        throw new Error("La fecha de transacción es obligatoria");
      }
      if (
        !formData.referencia_contrato ||
        !formData.referencia_contrato.trim()
      ) {
        throw new Error("La referencia del contrato es obligatoria");
      }
      if (
        !formData.nombre_centro_gestor ||
        !formData.nombre_centro_gestor.trim()
      ) {
        throw new Error("El nombre del centro gestor es obligatorio");
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiUrl) throw new Error("URL de API no configurada");

      // Preparar datos para el POST como multipart/form-data (para incluir archivos)
      const formDataToSend = new FormData();
      formDataToSend.append("numero_rpc", formData.numero_rpc.trim());
      formDataToSend.append("valor_pago", formData.valor_pago.toString());
      formDataToSend.append("fecha_transaccion", formData.fecha_transaccion);
      formDataToSend.append(
        "referencia_contrato",
        formData.referencia_contrato.trim(),
      );
      formDataToSend.append(
        "nombre_centro_gestor",
        formData.nombre_centro_gestor.trim(),
      );

      // Agregar archivos de documentos si hay (nombre del campo según API: 'documentos')
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach((file, index) => {
          formDataToSend.append("documentos", file);
          console.log(
            `Documento ${index + 1}:`,
            file.name,
            file.size,
            file.type,
          );
        });
      }

      console.log("Enviando datos:", {
        numero_rpc: formData.numero_rpc.trim(),
        valor_pago: formData.valor_pago,
        fecha_transaccion: formData.fecha_transaccion,
        referencia_contrato: formData.referencia_contrato.trim(),
        nombre_centro_gestor: formData.nombre_centro_gestor.trim(),
        archivos_count: uploadedFiles.length,
      });

      console.log("Enviando request a:", "/api/proxy/emprestito/cargar-pago");

      const response = await fetch("/api/proxy/emprestito/cargar-pago", {
        method: "POST",
        // NO incluir Content-Type header - el navegador lo establecerá automáticamente con el boundary correcto
        body: formDataToSend,
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      const data = await response.json();

      if (!response.ok) {
        // Manejo especial para error 422 (validación)
        if (response.status === 422 && data.detail) {
          const errors = Array.isArray(data.detail)
            ? data.detail
                .map((err: any) => `${err.loc?.join(" -> ")}: ${err.msg}`)
                .join(", ")
            : JSON.stringify(data.detail);
          throw new Error(`Error de validación: ${errors}`);
        }
        throw new Error(
          data.error || data.message || `Error ${response.status}`,
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1500);
    } catch (error) {
      console.error("Error al registrar pago:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_rpc: rpcData.numero_rpc,
      valor_pago: "",
      fecha_transaccion: "",
      referencia_contrato: rpcData.referencia_contrato || "",
      nombre_centro_gestor: rpcData.nombre_centro_gestor || "",
    });
    setUploadedFiles([]);
    setError(null);
    setSuccess(false);
    setShowConfirmDialog(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmDialog(false);
  };

  const handleConfirmWithoutDocument = () => {
    procesarRegistroPago();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registrar-pago-title"
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-t-xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 id="registrar-pago-title" className="text-xl font-bold">
                      Registrar Pago
                    </h2>
                    <p className="text-green-100 text-sm">
                      RPC: {rpcData.numero_rpc}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  aria-label="Cerrar modal"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    ¡Pago registrado exitosamente!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    El pago ha sido registrado en el sistema
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          Error al registrar el pago
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número RPC */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText className="w-4 h-4" />
                        <span>Número RPC *</span>
                      </label>
                      <input
                        type="text"
                        name="numero_rpc"
                        value={formData.numero_rpc}
                        onChange={handleChange}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                      />
                    </div>

                    {/* Valor Pago */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Valor del Pago *</span>
                      </label>
                      <input
                        type="number"
                        name="valor_pago"
                        value={formData.valor_pago}
                        onChange={handleChange}
                        placeholder="Ej: 10000000"
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Fecha Transacción */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>Fecha de Transacción *</span>
                      </label>
                      <input
                        type="date"
                        name="fecha_transaccion"
                        value={formData.fecha_transaccion}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Referencia Contrato */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <FileText className="w-4 h-4" />
                        <span>Referencia Contrato *</span>
                      </label>
                      <input
                        type="text"
                        name="referencia_contrato"
                        value={formData.referencia_contrato}
                        onChange={handleChange}
                        placeholder="Ej: CONT-SALUD-003-2024"
                        required
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                      />
                    </div>

                    {/* Centro Gestor */}
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Building className="w-4 h-4" />
                        <span>Centro Gestor *</span>
                      </label>
                      <input
                        type="text"
                        name="nombre_centro_gestor"
                        value={formData.nombre_centro_gestor}
                        onChange={handleChange}
                        placeholder="Ej: Secretaría de Salud"
                        required
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="pt-2">
                    <FileUploadZone
                      onFilesSelected={setUploadedFiles}
                      acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      maxFiles={5}
                      maxSizeMB={10}
                      label="Documentos de Soporte"
                      description="Arrastra archivos aquí o haz clic para explorar (Opcional)"
                      required={false}
                    />
                  </div>

                  {/* Info Note */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-medium mb-1">
                          Información importante:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                          <li>
                            Los campos{" "}
                            <strong>
                              Número RPC, Referencia Contrato y Centro Gestor
                            </strong>{" "}
                            están prellenados y bloqueados
                          </li>
                          <li>
                            El campo <strong>fecha_registro</strong> se genera
                            automáticamente en el servidor
                          </li>
                          <li>
                            El <strong>valor_pago</strong> debe ser un número
                            positivo mayor a 0
                          </li>
                          <li>
                            Los{" "}
                            <strong>
                              documentos de soporte son opcionales
                            </strong>
                            , pero se recomienda cargarlos
                          </li>
                          <li>
                            Todos los campos marcados con * son obligatorios
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      disabled={loading}
                      className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Registrando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Registrar Pago</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirmDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center p-4"
              >
                {/* Backdrop for dialog */}
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={handleCancelConfirmation}
                />

                {/* Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-20"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Registrar Pago sin Documento Soporte?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        No has cargado ningún documento de soporte. Se
                        recomienda cargar al menos un documento para respaldar
                        este pago. ¿Deseas continuar sin documento?
                      </p>
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={handleCancelConfirmation}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleConfirmWithoutDocument}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                        >
                          Sí, Continuar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RegistrarPagoModal;
