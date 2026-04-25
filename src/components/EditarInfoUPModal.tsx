"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Edit3,
  Building2,
  Calendar,
  Activity,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { AttributeData } from '@/services/unidades-proyecto.service';

interface EditarInfoUPModalProps {
  item: AttributeData;
  onClose: () => void;
  onSave?: (upid: string, data: Partial<AttributeData>) => void;
}

const EditarInfoUPModal: React.FC<EditarInfoUPModalProps> = ({
  item,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    estado: item.estado || '',
    avance_obra: item.avance_obra || 0,
    frente_activo: item.frente_activo || '',
    fecha_inicio: item.fecha_inicio || '',
    fecha_fin: item.fecha_fin || '',
    descripcion_intervencion: item.descripcion_intervencion || '',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (formData.avance_obra < 0 || formData.avance_obra > 100) {
      setError('El avance de obra debe estar entre 0 y 100');
      return;
    }

    try {
      // Guardar en localStorage como edición local (fase sin endpoints)
      const EDIT_STORAGE_KEY = 'ediciones-up-data';
      const existingEdits = JSON.parse(localStorage.getItem(EDIT_STORAGE_KEY) || '{}');
      existingEdits[item.upid] = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(existingEdits));

      onSave?.(item.upid, formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Error al guardar los cambios');
    }
  };

  const estadoOptions = [
    'En ejecución',
    'En alistamiento',
    'Terminado',
    'Inaugurado',
    'Suspendido',
    'Por iniciar',
    'Cancelado'
  ];

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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar Información UP</h2>
              <p className="text-blue-100 text-sm truncate max-w-md">
                {item.upid} - {item.nombre_up}
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

        {/* Información no editable */}
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Centro Gestor:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {item.nombre_centro_gestor || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Ubicación:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {item.barrio_vereda || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 dark:text-green-300 font-medium">
                Información actualizada correctamente
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Estado */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Activity className="w-4 h-4 text-blue-500" />
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar estado...</option>
              {estadoOptions.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          {/* Avance de Obra */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              Avance de Obra (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={formData.avance_obra}
                onChange={(e) => setFormData(prev => ({ ...prev, avance_obra: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  formData.avance_obra >= 70 ? 'bg-green-500' :
                  formData.avance_obra >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(formData.avance_obra, 100)}%` }}
              />
            </div>
          </div>

          {/* Frente Activo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              Frente Activo
            </label>
            <input
              type="text"
              value={formData.frente_activo}
              onChange={(e) => setFormData(prev => ({ ...prev, frente_activo: e.target.value }))}
              placeholder="Nombre del frente activo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-4 h-4 text-green-500" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={formData.fecha_inicio ? formData.fecha_inicio.split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="w-4 h-4 text-red-500" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={formData.fecha_fin ? formData.fecha_fin.split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <FileText className="w-4 h-4 text-purple-500" />
              Descripción de la Intervención
            </label>
            <textarea
              rows={3}
              value={formData.descripcion_intervencion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion_intervencion: e.target.value }))}
              placeholder="Describe los detalles de la intervención..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Los cambios se guardan localmente hasta la integración con el backend
          </p>
          <div className="flex items-center gap-3">
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
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditarInfoUPModal;
