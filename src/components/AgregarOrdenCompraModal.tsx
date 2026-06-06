"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { proxyFetch } from "@/utils/errorHandler";

interface AgregarOrdenCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData?: any) => void;
  editingData?: any; // Datos para modo edición
  onEdit?: (data: any) => void; // Callback para edición
}

const AgregarOrdenCompraModal: React.FC<AgregarOrdenCompraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingData,
  onEdit,
}) => {
  const isEditMode = !!editingData;
  const [formData, setFormData] = useState({
    numero_orden: "",
    nombre_centro_gestor: "",
    nombre_banco: "",
    nombre_resumido_proceso: "",
    valor_proyectado: "",
  });

  const [bancos, setBancos] = useState<string[]>([]);
  const [centrosGestores, setCentrosGestores] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const isCreateFormReady =
    formData.numero_orden.trim().length > 0 &&
    formData.nombre_centro_gestor.trim().length > 0 &&
    formData.nombre_banco.trim().length > 0 &&
    formData.nombre_resumido_proceso.trim().length > 0 &&
    !!formData.valor_proyectado &&
    Number(formData.valor_proyectado) > 0;

  // Cargar lista de bancos y centros gestores disponibles
  useEffect(() => {
    if (isOpen) {
      fetchBancosYCentros();
      // Pre-llenar formulario en modo edición
      if (editingData) {
        setFormData({
          numero_orden: String(editingData.numero_orden || ""),
          nombre_centro_gestor: String(editingData.nombre_centro_gestor || ""),
          nombre_banco: String(editingData.nombre_banco || ""),
          nombre_resumido_proceso: String(
            editingData.nombre_resumido_proceso || "",
          ),
          valor_proyectado: String(
            editingData.valor_proyectado || editingData.valor_orden || "",
          ),
        });
      } else {
        // Resetear en modo creación
        setFormData({
          numero_orden: "",
          nombre_centro_gestor: "",
          nombre_banco: "",
          nombre_resumido_proceso: "",
          valor_proyectado: "",
        });
      }
    }
  }, [isOpen, editingData]);

  const fetchBancosYCentros = async () => {
    setLoadingData(true);
    try {
      const response = await proxyFetch(
        "/api/proxy/asignaciones-emprestito-banco-centro-gestor",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        throw new Error("Error al cargar datos");
      }

      const data = await response.json();

      if (Array.isArray(data.data)) {
        // Extraer nombres únicos de bancos del campo 'banco'
        const nombresBancos = Array.from(
          new Set(data.data.map((asig: any) => asig.banco).filter(Boolean)),
        ) as string[];

        // Extraer nombres únicos de centros gestores
        const nombresCentros = Array.from(
          new Set(
            data.data
              .map((asig: any) => asig.nombre_centro_gestor)
              .filter(Boolean),
          ),
        ) as string[];

        console.log("📊 [Tienda Virtual] Bancos cargados:", nombresBancos);
        console.log(
          "📊 [Tienda Virtual] Centros gestores cargados:",
          nombresCentros,
        );

        setBancos(nombresBancos);
        setCentrosGestores(nombresCentros);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar la lista de bancos y centros gestores");
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // numero_orden siempre es obligatorio
    if (!formData.numero_orden.trim()) {
      newErrors.numero_orden = "El número de orden es obligatorio";
    }

    if (!formData.nombre_centro_gestor.trim()) {
      newErrors.nombre_centro_gestor = "El centro gestor es obligatorio";
    }

    if (!formData.nombre_banco.trim()) {
      newErrors.nombre_banco = "El banco es obligatorio";
    }

    if (!formData.nombre_resumido_proceso.trim()) {
      newErrors.nombre_resumido_proceso =
        "El nombre del proceso es obligatorio";
    }

    if (
      !formData.valor_proyectado ||
      parseFloat(formData.valor_proyectado) <= 0
    ) {
      newErrors.valor_proyectado = "El valor proyectado debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // MODO EDICIÓN: usar PUT con query parameters
        console.log("📝 Iniciando edición de orden de compra");
        console.log("📝 FormData actual:", formData);

        const params = new URLSearchParams();
        params.append("numero_orden", formData.numero_orden.trim());
        params.append(
          "nombre_centro_gestor",
          formData.nombre_centro_gestor.trim(),
        );
        params.append("nombre_banco", formData.nombre_banco.trim());
        params.append(
          "nombre_resumido_proceso",
          formData.nombre_resumido_proceso.trim(),
        );
        params.append(
          "valor_proyectado",
          Number(formData.valor_proyectado).toString(),
        );

        console.log(
          "📤 URL completa:",
          `/api/proxy/emprestito/modificar-orden-compra?${params.toString()}`,
        );
        console.log("📤 Parámetros a enviar:", Object.fromEntries(params));

        const response = await proxyFetch(
          `/api/proxy/emprestito/modificar-orden-compra?${params.toString()}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const result = await response.json();
        console.log("✅ Respuesta del servidor:", result);
        console.log("✅ Success?", result.success);
        console.log("✅ Message:", result.message);
        console.log("✅ Campos actualizados:", result.campos_actualizados);

        if (!response.ok) {
          console.error("❌ Error en respuesta:", response.status, result);
          if (response.status === 404) {
            alert("Orden de compra no encontrada");
          } else {
            alert(
              result.error ||
                result.detail ||
                "Error al actualizar la orden de compra",
            );
          }
          return;
        }

        if (!result.success) {
          throw new Error(
            result.error || "El servidor indicó que la actualización falló",
          );
        }

        // Preparar datos actualizados para actualización optimista
        const updatedData = {
          ...editingData,
          numero_orden: formData.numero_orden,
          nombre_centro_gestor: formData.nombre_centro_gestor,
          nombre_banco: formData.nombre_banco,
          nombre_resumido_proceso: formData.nombre_resumido_proceso,
          valor_proyectado:
            parseFloat(formData.valor_proyectado) ||
            editingData.valor_proyectado ||
            0,
        };
        console.log("📦 Datos actualizados para UI:", updatedData);

        alert("Orden de compra actualizada exitosamente");

        // Cerrar modal y notificar con datos actualizados
        onClose();
        await onSuccess(updatedData);
        return;
      } else {
        // MODO CREACIÓN: usar POST
        const payload = new URLSearchParams();
        payload.append("numero_orden", formData.numero_orden.trim());
        payload.append(
          "nombre_centro_gestor",
          formData.nombre_centro_gestor.trim(),
        );
        payload.append("nombre_banco", formData.nombre_banco.trim());
        payload.append(
          "nombre_resumido_proceso",
          formData.nombre_resumido_proceso.trim(),
        );
        payload.append(
          "valor_proyectado",
          Number(formData.valor_proyectado).toString(),
        );

        const response = await proxyFetch(
          "/api/proxy/emprestito/cargar-orden-compra",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: payload.toString(),
          },
        );

        const result = await response.json();

        if (!response.ok) {
          // Manejo de duplicados
          if (response.status === 409) {
            alert(
              `Ya existe una orden de compra con número: ${formData.numero_orden}`,
            );
          } else {
            alert(
              result.error ||
                result.detail ||
                "Error al crear la orden de compra",
            );
          }
          return;
        }

        // Ejecutar sincronización TVEC inmediatamente después de crear la orden
        try {
          const syncResponse = await proxyFetch(
            "/api/proxy/emprestito/obtener-ordenes-compra-TVEC",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (!syncResponse.ok) {
            const syncResult = await syncResponse.json().catch(() => ({}));
            console.warn(
              "⚠️ Orden creada, pero falló la sincronización TVEC:",
              syncResult,
            );
            alert(
              "Orden creada exitosamente, pero falló la actualización inmediata de TVEC. Puedes intentarlo nuevamente desde actualizar.",
            );
          }
        } catch (syncError) {
          console.warn(
            "⚠️ Orden creada, pero ocurrió un error al sincronizar TVEC:",
            syncError,
          );
          alert(
            "Orden creada exitosamente, pero ocurrió un error al ejecutar la actualización de TVEC.",
          );
        }

        alert("Orden de compra creada exitosamente");
      }

      // Resetear formulario
      setFormData({
        numero_orden: "",
        nombre_centro_gestor: "",
        nombre_banco: "",
        nombre_resumido_proceso: "",
        valor_proyectado: "",
      });
      setErrors({});

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert(
        isEditMode
          ? "Error al actualizar la orden de compra"
          : "Error al crear la orden de compra",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="presentation"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
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
          aria-labelledby="agregar-orden-compra-title"
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
                    id="agregar-orden-compra-title"
                    className="text-2xl font-bold"
                  >
                    {isEditMode
                      ? "Editar Orden de Compra TVEC"
                      : "Agregar Orden de Compra TVEC"}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isEditMode
                      ? "Modificar datos de la orden de compra"
                      : "Registrar nueva orden de compra de Tienda Virtual"}
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
            className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]"
          >
            <div className="space-y-4">
              {/* Número de Orden */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de Orden <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="numero_orden"
                  value={formData.numero_orden}
                  onChange={handleChange}
                  placeholder="OC-2024-001"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.numero_orden ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting || isEditMode}
                />
                {errors.numero_orden && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.numero_orden}
                  </p>
                )}
              </div>

              {/* Centro Gestor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Centro Gestor <span className="text-red-500">*</span>
                </label>
                <select
                  name="nombre_centro_gestor"
                  value={formData.nombre_centro_gestor}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_centro_gestor ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting || loadingData}
                >
                  <option value="">Seleccione un centro gestor</option>
                  {centrosGestores.map((centro) => (
                    <option key={centro} value={centro}>
                      {centro}
                    </option>
                  ))}
                </select>
                {errors.nombre_centro_gestor && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nombre_centro_gestor}
                  </p>
                )}
              </div>

              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banco <span className="text-red-500">*</span>
                </label>
                <select
                  name="nombre_banco"
                  value={formData.nombre_banco}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_banco ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting || loadingData}
                >
                  <option value="">Seleccione un banco</option>
                  {bancos.map((banco) => (
                    <option key={banco} value={banco}>
                      {banco}
                    </option>
                  ))}
                </select>
                {errors.nombre_banco && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nombre_banco}
                  </p>
                )}
              </div>

              {/* Nombre Resumido del Proceso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Resumido del Proceso{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="nombre_resumido_proceso"
                  value={formData.nombre_resumido_proceso}
                  onChange={handleChange}
                  placeholder="Suministro de equipos médicos..."
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_resumido_proceso ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.nombre_resumido_proceso && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nombre_resumido_proceso}
                  </p>
                )}
              </div>

              {/* Valor Proyectado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Proyectado (COP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valor_proyectado"
                  value={formData.valor_proyectado}
                  onChange={handleChange}
                  placeholder="1500000000"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_proyectado ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.valor_proyectado && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.valor_proyectado}
                  </p>
                )}
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
                disabled={isSubmitting || !isCreateFormReady}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {isEditMode
                      ? "Actualizar Orden de Compra"
                      : "Guardar Orden de Compra"}
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

export default AgregarOrdenCompraModal;
