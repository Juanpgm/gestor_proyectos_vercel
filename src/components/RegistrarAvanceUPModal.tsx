"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
} from "lucide-react";
import { useAvancesUP } from "@/hooks/useAvancesUP";
import type { AvanceUPFormData } from "@/types/avances-up";
import { formatCurrencyFull } from "@/utils/formatCurrency";
import {
  getCentroGestorAccessFromSession,
  normalizeCentroGestor,
  type CentroGestorAccess,
} from "@/utils/centroGestorAccess";

interface RegistrarAvanceUPModalProps {
  upid: string;
  intervencionId?: string;
  nombreUP: string;
  avanceActual: number;
  presupuesto: number;
  onClose: () => void;
  onSuccess?: () => void;
  /** Centro gestor del item (defensa en profundidad). */
  itemCentroGestor?: string | null;
  /** Acceso pre-calculado; si no se pasa, se lee de la sesión. */
  centroGestorAccess?: CentroGestorAccess;
}

const RegistrarAvanceUPModal: React.FC<RegistrarAvanceUPModalProps> = ({
  upid,
  intervencionId,
  nombreUP,
  avanceActual,
  presupuesto,
  onClose,
  onSuccess,
  itemCentroGestor,
  centroGestorAccess,
}) => {
  const {
    addAvance,
    error: hookError,
    clearError,
  } = useAvancesUP(upid, intervencionId);

  const [formData, setFormData] = useState<AvanceUPFormData>({
    fecha_reporte: new Date().toISOString().split("T")[0],
    avance_fisico: avanceActual,
    avance_financiero: 0,
    valor_ejecutado: 0,
    observaciones: "",
    archivos: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.avance_fisico < 0 || formData.avance_fisico > 100) {
      newErrors.avance_fisico = "Debe estar entre 0% y 100%";
    }
    if (formData.avance_financiero < 0 || formData.avance_financiero > 100) {
      newErrors.avance_financiero = "Debe estar entre 0% y 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Defensa en profundidad: bloquear si la UP no pertenece al centro gestor
    // del usuario (a menos que sea privilegiado / centro abierto).
    const effectiveAccess =
      centroGestorAccess ?? getCentroGestorAccessFromSession();
    if (!effectiveAccess.canViewAll && itemCentroGestor) {
      const itemNorm = normalizeCentroGestor(itemCentroGestor);
      const userNorm = normalizeCentroGestor(effectiveAccess.userCentroGestor);
      if (itemNorm && userNorm && itemNorm !== userNorm) {
        setErrors({
          form: "No tienes permiso para registrar avance en una UP de otro centro gestor.",
        });
        return;
      }
    }

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await addAvance({
      ...formData,
      archivos: selectedFiles,
    });
    setIsSubmitting(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registrar-avance-up-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="registrar-avance-up-title"
                className="text-lg font-bold text-white"
              >
                Registrar Avance
              </h2>
              <p className="text-emerald-100 text-sm truncate max-w-md">
                {upid} - {nombreUP}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Indicador de avance actual */}
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700 dark:text-emerald-300">
              Avance actual de obra:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(avanceActual, 100)}%` }}
                />
              </div>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {avanceActual.toFixed(1)}%
              </span>
            </div>
          </div>
          {presupuesto > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-emerald-700 dark:text-emerald-300">
                Presupuesto total:
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrencyFull(presupuesto)}
              </span>
            </div>
          )}
        </div>

        {/* Success state */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                Avance registrado exitosamente
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de progreso de carga */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Registrando avance
                  {selectedFiles.length > 0
                    ? ` y subiendo ${selectedFiles.length} archivo${selectedFiles.length > 1 ? "s" : ""}`
                    : ""}
                  ...
                </span>
              </div>
              <div className="w-full h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                  style={{
                    width: "45%",
                    animation: "slideProgress 1.4s ease-in-out infinite",
                  }}
                />
              </div>
              <style>{`
                @keyframes slideProgress {
                  0% { left: -45%; }
                  100% { left: 100%; }
                }
              `}</style>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                Por favor espera y no cierres esta ventana
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {hookError && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">
              {hookError}
            </span>
          </div>
        )}
        {errors.form && (
          <div
            className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2"
            data-testid="modal-form-error"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">
              {errors.form}
            </span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`flex-1 overflow-y-auto p-6 space-y-5 ${isSubmitting ? "pointer-events-none select-none opacity-60" : ""}`}
        >
          {/* Avance de Intervención */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Avance de Intervención (%) *
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-28 flex-shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.avance_fisico}
                  onChange={(e) => {
                    const val = Math.min(
                      100,
                      Math.max(0, parseFloat(e.target.value) || 0),
                    );
                    setFormData((prev) => ({
                      ...prev,
                      avance_fisico: val,
                      avance_financiero: val,
                    }));
                  }}
                  className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.avance_fisico
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  %
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={formData.avance_fisico}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    avance_fisico: val,
                    avance_financiero: val,
                  }));
                }}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: (() => {
                    const pct = formData.avance_fisico;
                    const color =
                      pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
                    return `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`;
                  })(),
                }}
              />
            </div>
            {errors.avance_fisico && (
              <p className="text-xs text-red-500 mt-1">
                {errors.avance_fisico}
              </p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FileText className="w-4 h-4 text-purple-500" />
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
              placeholder="Describe el progreso, hitos alcanzados, dificultades encontradas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Archivos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Upload className="w-4 h-4 text-indigo-500" />
              Evidencia (Archivos)
              <span className="text-xs font-normal text-gray-400">
                (Opcional)
              </span>
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Haz clic para subir archivos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Cualquier tipo de archivo
                </p>
              </label>
            </div>

            {/* Lista de archivos seleccionados */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={success || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Avance
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RegistrarAvanceUPModal;
