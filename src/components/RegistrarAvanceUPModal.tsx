"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2
} from 'lucide-react';
import { useAvancesUP } from '@/hooks/useAvancesUP';
import type { AvanceUPFormData } from '@/types/avances-up';
import { formatCurrency } from '@/utils/formatCurrency';

interface RegistrarAvanceUPModalProps {
  upid: string;
  nombreUP: string;
  avanceActual: number;
  presupuesto: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const RegistrarAvanceUPModal: React.FC<RegistrarAvanceUPModalProps> = ({
  upid,
  nombreUP,
  avanceActual,
  presupuesto,
  onClose,
  onSuccess
}) => {
  const { addAvance, error: hookError, clearError } = useAvancesUP(upid);
  
  const [formData, setFormData] = useState<AvanceUPFormData>({
    fecha_reporte: new Date().toISOString().split('T')[0],
    avance_fisico: avanceActual,
    avance_financiero: 0,
    valor_ejecutado: 0,
    observaciones: '',
    archivos: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fecha_reporte) {
      newErrors.fecha_reporte = 'La fecha es obligatoria';
    }
    if (formData.avance_fisico < 0 || formData.avance_fisico > 100) {
      newErrors.avance_fisico = 'Debe estar entre 0% y 100%';
    }
    if (formData.avance_financiero < 0 || formData.avance_financiero > 100) {
      newErrors.avance_financiero = 'Debe estar entre 0% y 100%';
    }
    if (formData.valor_ejecutado < 0) {
      newErrors.valor_ejecutado = 'No puede ser negativo';
    }
    if (presupuesto > 0 && formData.valor_ejecutado > presupuesto) {
      newErrors.valor_ejecutado = 'No puede superar el presupuesto total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const result = addAvance({
      ...formData,
      archivos: selectedFiles
    });

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
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrar Avance</h2>
              <p className="text-emerald-100 text-sm truncate max-w-md">
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

        {/* Indicador de avance actual */}
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700 dark:text-emerald-300">Avance actual de obra:</span>
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
              <span className="text-emerald-700 dark:text-emerald-300">Presupuesto total:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(presupuesto)}
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

        {/* Error state */}
        {hookError && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{hookError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Fecha del reporte */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Calendar className="w-4 h-4" />
              Fecha del Reporte *
            </label>
            <input
              type="date"
              value={formData.fecha_reporte}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_reporte: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.fecha_reporte ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.fecha_reporte && (
              <p className="text-xs text-red-500 mt-1">{errors.fecha_reporte}</p>
            )}
          </div>

          {/* Avances - Grid 2 columnas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Avance Físico */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Avance Físico (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.avance_fisico}
                  onChange={(e) => setFormData(prev => ({ ...prev, avance_fisico: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.avance_fisico ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              {errors.avance_fisico && (
                <p className="text-xs text-red-500 mt-1">{errors.avance_fisico}</p>
              )}
              {/* Barra visual */}
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    formData.avance_fisico >= 70 ? 'bg-green-500' :
                    formData.avance_fisico >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(formData.avance_fisico, 100)}%` }}
                />
              </div>
            </div>

            {/* Avance Financiero */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="w-4 h-4 text-green-500" />
                Avance Financiero (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.avance_financiero}
                  onChange={(e) => setFormData(prev => ({ ...prev, avance_financiero: parseFloat(e.target.value) || 0 }))}
                  className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.avance_financiero ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
              {errors.avance_financiero && (
                <p className="text-xs text-red-500 mt-1">{errors.avance_financiero}</p>
              )}
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    formData.avance_financiero >= 70 ? 'bg-green-500' :
                    formData.avance_financiero >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(formData.avance_financiero, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Valor Ejecutado */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <DollarSign className="w-4 h-4 text-amber-500" />
              Valor Ejecutado (COP)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={formData.valor_ejecutado}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_ejecutado: parseFloat(e.target.value) || 0 }))}
                className={`w-full pl-7 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.valor_ejecutado ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {errors.valor_ejecutado && (
              <p className="text-xs text-red-500 mt-1">{errors.valor_ejecutado}</p>
            )}
            {formData.valor_ejecutado > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(formData.valor_ejecutado)}
                {presupuesto > 0 && (
                  <span> ({((formData.valor_ejecutado / presupuesto) * 100).toFixed(1)}% del presupuesto)</span>
                )}
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
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              placeholder="Describe el progreso, hitos alcanzados, dificultades encontradas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Archivos */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Upload className="w-4 h-4 text-indigo-500" />
              Evidencia (Archivos)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Haz clic para subir archivos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Imágenes, PDF, Word, Excel
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
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={success}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Save className="w-4 h-4" />
            Guardar Avance
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RegistrarAvanceUPModal;
