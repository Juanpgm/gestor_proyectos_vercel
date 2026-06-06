"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit2,
  AlertCircle,
  CheckCircle,
  Upload,
  ShoppingCart,
} from "lucide-react";
import { proxyFetch } from "@/utils/errorHandler";

interface ModificarOrdenCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ordenData: {
    id?: string;
    numero_orden?: string;
    nombre_resumido_proceso?: string;
    valor_orden?: number | string;
    valor_proyectado?: number;
    [key: string]: any;
  } | null;
}

const ModificarOrdenCompraModal: React.FC<ModificarOrdenCompraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ordenData,
}) => {
  const [valor_orden, setValorOrden] = useState<string>("");
  const [valor_proyectado, setValorProyectado] = useState<string>("");
  const [change_motivo, setChangeMotivo] = useState<string>("");
  const [change_support_file, setChangeSupportFile] = useState<File | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Reset form cuando se abre/cierra
  React.useEffect(() => {
    if (isOpen && ordenData) {
      setValorOrden(ordenData.valor_orden?.toString() || "");
      setValorProyectado(ordenData.valor_proyectado?.toString() || "");
      setChangeMotivo("");
      setChangeSupportFile(null);
      setErrors({});
    }
  }, [isOpen, ordenData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Al menos un valor debe ser proporcionado
    if (!valor_orden && !valor_proyectado) {
      newErrors.valores = "Debe proporcionar al menos un valor para actualizar";
    }

    if (valor_orden && parseFloat(valor_orden) <= 0) {
      newErrors.valor_orden = "El valor de la orden debe ser mayor a 0";
    }

    if (valor_proyectado && parseFloat(valor_proyectado) <= 0) {
      newErrors.valor_proyectado = "El valor proyectado debe ser mayor a 0";
    }

    if (!change_motivo.trim()) {
      newErrors.change_motivo = "La justificación del cambio es obligatoria";
    }

    if (!change_support_file) {
      newErrors.change_support_file = "El documento soporte es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          change_support_file: "Formato no permitido. Use PDF, XLSX, DOCX",
        }));
        return;
      }

      setChangeSupportFile(file);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.change_support_file;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ordenData?.numero_orden) {
      alert("No se encontró el número de orden");
      return;
    }

    if (!validateForm()) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Solo agregar los valores que fueron proporcionados
      if (valor_orden) {
        formData.append("valor_orden", valor_orden);
      }
      if (valor_proyectado) {
        formData.append("valor_proyectado", valor_proyectado);
      }

      formData.append("change_motivo", change_motivo);
      formData.append("change_support_file", change_support_file!);

      const response = await proxyFetch(
        `/api/proxy/emprestito/modificar-valores/orden-compra/${encodeURIComponent(ordenData.numero_orden)}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          alert(`No se encontró la orden de compra: ${ordenData.numero_orden}`);
        } else {
          alert(
            result.error ||
              result.detail ||
              "Error al modificar la orden de compra",
          );
        }
        return;
      }

      alert("Orden de compra actualizada exitosamente");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al modificar orden de compra:", error);
      alert("Error al modificar la orden de compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !ordenData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modificar-orden-compra-title"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h2
                    id="modificar-orden-compra-title"
                    className="text-2xl font-bold"
                  >
                    Modificar Valor - TVEC
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {ordenData.numero_orden}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]"
          >
            <div className="space-y-3">
              {/* Información compacta */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Orden:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ordenData.numero_orden || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Valor Orden:
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {ordenData.valor_orden
                      ? new Intl.NumberFormat("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0,
                        }).format(
                          typeof ordenData.valor_orden === "string"
                            ? parseFloat(ordenData.valor_orden)
                            : ordenData.valor_orden,
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Error general */}
              {errors.valores && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                  <p className="text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valores}
                  </p>
                </div>
              )}

              {/* Nuevo Valor de la Orden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo Valor Orden (COP){" "}
                  <span className="text-gray-400 text-xs">(Opcional)</span>
                </label>
                <input
                  type="number"
                  value={valor_orden}
                  onChange={(e) => {
                    setValorOrden(e.target.value);
                    if (errors.valor_orden || errors.valores) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.valor_orden;
                        delete newErrors.valores;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="1500000000"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_orden ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.valor_orden && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valor_orden}
                  </p>
                )}
              </div>

              {/* Nuevo Valor Proyectado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo Valor Proyectado (COP){" "}
                  <span className="text-gray-400 text-xs">(Opcional)</span>
                </label>
                <input
                  type="number"
                  value={valor_proyectado}
                  onChange={(e) => {
                    setValorProyectado(e.target.value);
                    if (errors.valor_proyectado || errors.valores) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.valor_proyectado;
                        delete newErrors.valores;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="1200000000"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_proyectado ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.valor_proyectado && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valor_proyectado}
                  </p>
                )}
              </div>

              {/* Justificación del Cambio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Justificación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={change_motivo}
                  onChange={(e) => {
                    setChangeMotivo(e.target.value);
                    if (errors.change_motivo) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.change_motivo;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="Describa el motivo del cambio..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.change_motivo ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.change_motivo && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.change_motivo}
                  </p>
                )}
              </div>

              {/* Documento Soporte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Documento Soporte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.docx,.doc"
                    className="hidden"
                    id="file-upload-tvec"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="file-upload-tvec"
                    className={`flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.change_support_file
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800"
                    } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {change_support_file
                        ? change_support_file.name
                        : "Seleccionar archivo (PDF, XLSX, DOCX)"}
                    </span>
                  </label>
                </div>
                {errors.change_support_file && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.change_support_file}
                  </p>
                )}
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Puede actualizar uno o ambos valores.
                  Los campos dejados en blanco mantendrán sus valores actuales.
                  Los cambios quedarán registrados en el historial del sistema.
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModificarOrdenCompraModal;
