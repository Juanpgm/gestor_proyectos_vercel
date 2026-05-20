"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Info,
} from "lucide-react";
import type { ReporteContratoFormData } from "@/types/avances-emprestito";
import {
  TIPOS_ALERTA,
  ARCHIVOS_PERMITIDOS,
  MAX_FILE_SIZE_MB,
} from "@/types/avances-emprestito";

interface RegistrarReporteContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenciaContrato: string;
  nombreContrato?: string;
  onSubmit: (data: ReporteContratoFormData) => Promise<boolean>;
  submitting?: boolean;
}

const RegistrarReporteContratoModal: React.FC<
  RegistrarReporteContratoModalProps
> = ({
  isOpen,
  onClose,
  referenciaContrato,
  nombreContrato,
  onSubmit,
  submitting = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ReporteContratoFormData>({
    referencia_contrato: referenciaContrato,
    observaciones: "",
    avance_fisico: 0,
    avance_financiero: 0,
    alertas_descripcion: "Sin alertas",
    alertas_es_alerta: false,
    alertas_tipo_alerta: "",
    archivos_evidencia: [],
  });

  const [tiposAlertaSeleccionados, setTiposAlertaSeleccionados] = useState<
    string[]
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.observaciones.trim()) {
      newErrors.observaciones = "Las observaciones son obligatorias";
    }
    if (formData.avance_fisico < 0 || formData.avance_fisico > 100) {
      newErrors.avance_fisico = "Debe estar entre 0 y 100";
    }
    if (formData.avance_financiero < 0 || formData.avance_financiero > 100) {
      newErrors.avance_financiero = "Debe estar entre 0 y 100";
    }
    if (formData.alertas_es_alerta && !formData.alertas_descripcion.trim()) {
      newErrors.alertas_descripcion = "Debe describir la alerta";
    }
    if (formData.archivos_evidencia.length === 0) {
      newErrors.archivos = "Debe adjuntar al menos un archivo de evidencia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    files.forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ARCHIVOS_PERMITIDOS.includes(ext)) {
        fileErrors.push(`${file.name}: tipo no permitido`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        fileErrors.push(`${file.name}: excede ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
      validFiles.push(file);
    });

    if (fileErrors.length > 0) {
      setErrors((prev) => ({ ...prev, archivos: fileErrors.join(", ") }));
    } else {
      setErrors((prev) => {
        const { archivos, ...rest } = prev;
        return rest;
      });
    }

    setFormData((prev) => ({
      ...prev,
      archivos_evidencia: [...prev.archivos_evidencia, ...validFiles],
    }));

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      archivos_evidencia: prev.archivos_evidencia.filter((_, i) => i !== index),
    }));
  };

  const toggleTipoAlerta = (tipo: string) => {
    setTiposAlertaSeleccionados((prev) => {
      const updated = prev.includes(tipo)
        ? prev.filter((t) => t !== tipo)
        : [...prev, tipo];
      setFormData((f) => ({ ...f, alertas_tipo_alerta: updated.join(",") }));
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);

    try {
      const success = await onSubmit({
        ...formData,
        referencia_contrato: referenciaContrato,
        alertas_tipo_alerta: tiposAlertaSeleccionados.join(","),
      });

      if (success) {
        // Reset form
        setFormData({
          referencia_contrato: referenciaContrato,
          observaciones: "",
          avance_fisico: 0,
          avance_financiero: 0,
          alertas_descripcion: "Sin alertas",
          alertas_es_alerta: false,
          alertas_tipo_alerta: "",
          archivos_evidencia: [],
        });
        setTiposAlertaSeleccionados([]);
        setSubmitError(null);
        onClose();
      } else {
        setSubmitError(
          "No se pudo registrar el avance. Verifique su conexión y permisos e intente de nuevo.",
        );
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Error inesperado al registrar avance",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        role="presentation"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="registrar-reporte-contrato-title"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 flex items-center justify-between">
            <div>
              <h2
                id="registrar-reporte-contrato-title"
                className="text-lg font-bold text-white flex items-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Reportar Avance de Contrato
              </h2>
              <p className="text-teal-100 text-sm mt-1">
                {nombreContrato || referenciaContrato}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Body scrolleable */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Info del contrato */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
                <Info className="w-4 h-4" />
                <span>
                  Referencia: <strong>{referenciaContrato}</strong>
                </span>
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                Los archivos se subirán a Google Drive y el reporte se guardará
                en Firebase.
              </p>
            </div>

            {/* Avances */}
            <div className="grid grid-cols-2 gap-4">
              {/* Avance Físico */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Avance Físico (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.avance_fisico}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      avance_fisico: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white ${
                    errors.avance_fisico
                      ? "border-red-300"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.avance_fisico && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.avance_fisico}
                  </p>
                )}
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, formData.avance_fisico))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Avance Financiero */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Avance Financiero (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.avance_financiero}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      avance_financiero: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white ${
                    errors.avance_financiero
                      ? "border-red-300"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors.avance_financiero && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.avance_financiero}
                  </p>
                )}
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, formData.avance_financiero))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones *
              </label>
              <textarea
                rows={3}
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones: e.target.value,
                  }))
                }
                placeholder="Describa detalladamente el avance del contrato..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white ${
                  errors.observaciones
                    ? "border-red-300"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.observaciones && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.observaciones}
                </p>
              )}
            </div>

            {/* Alertas */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alertas_es_alerta}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        alertas_es_alerta: e.target.checked,
                        alertas_descripcion: e.target.checked
                          ? prev.alertas_descripcion
                          : "Sin alertas",
                      }))
                    }
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tiene alerta activa
                  </span>
                </label>
              </div>

              {formData.alertas_es_alerta && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <textarea
                    rows={2}
                    value={
                      formData.alertas_descripcion === "Sin alertas"
                        ? ""
                        : formData.alertas_descripcion
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        alertas_descripcion: e.target.value,
                      }))
                    }
                    placeholder="Describa la alerta..."
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white ${
                      errors.alertas_descripcion
                        ? "border-red-300"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.alertas_descripcion && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.alertas_descripcion}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {TIPOS_ALERTA.map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => toggleTipoAlerta(tipo)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          tiposAlertaSeleccionados.includes(tipo)
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Archivos de evidencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Archivos de Evidencia *
              </label>

              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-teal-400 transition-colors ${
                  errors.archivos
                    ? "border-red-300"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click para seleccionar archivos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOC, XLS, JPG, PNG • Máx {MAX_FILE_SIZE_MB}MB por archivo
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ARCHIVOS_PERMITIDOS.join(",")}
                onChange={handleFileAdd}
                className="hidden"
              />

              {errors.archivos && (
                <p className="text-red-500 text-xs mt-1">{errors.archivos}</p>
              )}

              {/* Lista de archivos adjuntos */}
              {formData.archivos_evidencia.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.archivos_evidencia.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error de envío */}
          {submitError && (
            <div className="mx-6 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </p>
            </div>
          )}

          {/* Footer con botones */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Registrar Avance
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrarReporteContratoModal;
