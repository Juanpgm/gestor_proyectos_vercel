'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react'

interface AgregarOrdenCompraModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedData?: any) => void
  editingData?: any // Datos para modo edición
  onEdit?: (data: any) => void // Callback para edición
}

const AgregarOrdenCompraModal: React.FC<AgregarOrdenCompraModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingData,
  onEdit
}) => {
  const isEditMode = !!editingData
  const [formData, setFormData] = useState({
    numero_orden: '',
    nombre_centro_gestor: '',
    nombre_banco: '',
    nombre_resumido_proceso: '',
    valor_proyectado: '',
    bp: '',
    // Campos adicionales disponibles en la API
    ano_orden: '',
    bpin: '',
    estado: '',
    estado_orden: '',
    fecha_publicacion_orden: '',
    fecha_vencimiento_orden: '',
    modalidad_contratacion: '',
    nit_entidad: '',
    nit_proveedor: '',
    nombre_proveedor: '',
    objeto_orden: '',
    observaciones: '',
    ordenador_gasto: '',
    plataforma_origen: '',
    valor_orden: ''
  })

  const [bancos, setBancos] = useState<string[]>([])
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Cargar lista de bancos y centros gestores disponibles
  useEffect(() => {
    if (isOpen) {
      fetchBancosYCentros()
      // Pre-llenar formulario en modo edición
      if (editingData) {
        setFormData({
          numero_orden: String(editingData.numero_orden || ''),
          nombre_centro_gestor: String(editingData.nombre_centro_gestor || ''),
          nombre_banco: String(editingData.nombre_banco || ''),
          nombre_resumido_proceso: String(editingData.nombre_resumido_proceso || ''),
          valor_proyectado: String(editingData.valor_proyectado || editingData.valor_orden || ''),
          bp: String(editingData.bp || ''),
          // Campos adicionales
          ano_orden: String(editingData.ano_orden || ''),
          bpin: String(editingData.bpin || ''),
          estado: String(editingData.estado || ''),
          estado_orden: String(editingData.estado_orden || ''),
          fecha_publicacion_orden: String(editingData.fecha_publicacion_orden || ''),
          fecha_vencimiento_orden: String(editingData.fecha_vencimiento_orden || ''),
          modalidad_contratacion: String(editingData.modalidad_contratacion || ''),
          nit_entidad: String(editingData.nit_entidad || ''),
          nit_proveedor: String(editingData.nit_proveedor || ''),
          nombre_proveedor: String(editingData.nombre_proveedor || ''),
          objeto_orden: String(editingData.objeto_orden || ''),
          observaciones: String(editingData.observaciones || ''),
          ordenador_gasto: String(editingData.ordenador_gasto || ''),
          plataforma_origen: String(editingData.plataforma_origen || ''),
          valor_orden: String(editingData.valor_orden || '')
        })
      } else {
        // Resetear en modo creación
        setFormData({
          numero_orden: '',
          nombre_centro_gestor: '',
          nombre_banco: '',
          nombre_resumido_proceso: '',
          valor_proyectado: '',
          bp: '',
          ano_orden: '',
          bpin: '',
          estado: '',
          estado_orden: '',
          fecha_publicacion_orden: '',
          fecha_vencimiento_orden: '',
          modalidad_contratacion: '',
          nit_entidad: '',
          nit_proveedor: '',
          nombre_proveedor: '',
          objeto_orden: '',
          observaciones: '',
          ordenador_gasto: '',
          plataforma_origen: '',
          valor_orden: ''
        })
      }
    }
  }, [isOpen, editingData])

  const fetchBancosYCentros = async () => {
    setLoadingData(true)
    try {
      const response = await fetch('/api/proxy/asignaciones-emprestito-banco-centro-gestor', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Error al cargar datos')
      }

      const data = await response.json()
      
      if (Array.isArray(data.data)) {
        // Extraer nombres únicos de bancos
        const nombresBancos = Array.from(
          new Set(data.data.map((asig: any) => asig.nombre_banco).filter(Boolean))
        ) as string[]
        
        // Extraer nombres únicos de centros gestores
        const nombresCentros = Array.from(
          new Set(data.data.map((asig: any) => asig.nombre_centro_gestor).filter(Boolean))
        ) as string[]
        
        setBancos(nombresBancos)
        setCentrosGestores(nombresCentros)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar la lista de bancos y centros gestores')
    } finally {
      setLoadingData(false)
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // numero_orden siempre es obligatorio
    if (!formData.numero_orden.trim()) {
      newErrors.numero_orden = 'El número de orden es obligatorio'
    }

    // En modo CREACIÓN, estos campos son obligatorios
    // En modo EDICIÓN, son opcionales (solo se actualizan si se envían)
    if (!isEditMode) {
      if (!formData.nombre_centro_gestor.trim()) {
        newErrors.nombre_centro_gestor = 'El centro gestor es obligatorio'
      }

      if (!formData.nombre_banco.trim()) {
        newErrors.nombre_banco = 'El banco es obligatorio'
      }

      if (!formData.nombre_resumido_proceso.trim()) {
        newErrors.nombre_resumido_proceso = 'El nombre del proceso es obligatorio'
      }

      if (!formData.valor_proyectado || parseFloat(formData.valor_proyectado) <= 0) {
        newErrors.valor_proyectado = 'El valor proyectado debe ser mayor a 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditMode) {
        // MODO EDICIÓN: usar PUT con query parameters
        console.log('📝 Iniciando edición de orden de compra')
        console.log('📝 FormData actual:', formData)
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
        if (!apiUrl) {
          throw new Error('URL de API no configurada')
        }

        const params = new URLSearchParams()
        // numero_orden es siempre requerido
        params.append('numero_orden', formData.numero_orden)
        
        // Solo enviar campos que tienen valor (actualización parcial)
        if (formData.nombre_centro_gestor && typeof formData.nombre_centro_gestor === 'string' && formData.nombre_centro_gestor.trim()) {
          params.append('nombre_centro_gestor', formData.nombre_centro_gestor.trim())
        }
        if (formData.nombre_banco && typeof formData.nombre_banco === 'string' && formData.nombre_banco.trim()) {
          params.append('nombre_banco', formData.nombre_banco.trim())
        }
        if (formData.nombre_resumido_proceso && typeof formData.nombre_resumido_proceso === 'string' && formData.nombre_resumido_proceso.trim()) {
          params.append('nombre_resumido_proceso', formData.nombre_resumido_proceso.trim())
        }
        if (formData.valor_proyectado && String(formData.valor_proyectado).trim()) {
          params.append('valor_proyectado', String(formData.valor_proyectado))
        }
        if (formData.bp && typeof formData.bp === 'string' && formData.bp.trim()) {
          params.append('bp', formData.bp.trim())
        }
        
        // Campos adicionales
        if (formData.ano_orden && String(formData.ano_orden).trim()) {
          params.append('ano_orden', String(formData.ano_orden))
        }
        if (formData.bpin && typeof formData.bpin === 'string' && formData.bpin.trim()) {
          params.append('bpin', formData.bpin.trim())
        }
        if (formData.estado && typeof formData.estado === 'string' && formData.estado.trim()) {
          params.append('estado', formData.estado.trim())
        }
        if (formData.estado_orden && typeof formData.estado_orden === 'string' && formData.estado_orden.trim()) {
          params.append('estado_orden', formData.estado_orden.trim())
        }
        if (formData.fecha_publicacion_orden && typeof formData.fecha_publicacion_orden === 'string' && formData.fecha_publicacion_orden.trim()) {
          params.append('fecha_publicacion_orden', formData.fecha_publicacion_orden.trim())
        }
        if (formData.fecha_vencimiento_orden && typeof formData.fecha_vencimiento_orden === 'string' && formData.fecha_vencimiento_orden.trim()) {
          params.append('fecha_vencimiento_orden', formData.fecha_vencimiento_orden.trim())
        }
        if (formData.modalidad_contratacion && typeof formData.modalidad_contratacion === 'string' && formData.modalidad_contratacion.trim()) {
          params.append('modalidad_contratacion', formData.modalidad_contratacion.trim())
        }
        if (formData.nit_entidad && typeof formData.nit_entidad === 'string' && formData.nit_entidad.trim()) {
          params.append('nit_entidad', formData.nit_entidad.trim())
        }
        if (formData.nit_proveedor && typeof formData.nit_proveedor === 'string' && formData.nit_proveedor.trim()) {
          params.append('nit_proveedor', formData.nit_proveedor.trim())
        }
        if (formData.nombre_proveedor && typeof formData.nombre_proveedor === 'string' && formData.nombre_proveedor.trim()) {
          params.append('nombre_proveedor', formData.nombre_proveedor.trim())
        }
        if (formData.objeto_orden && typeof formData.objeto_orden === 'string' && formData.objeto_orden.trim()) {
          params.append('objeto_orden', formData.objeto_orden.trim())
        }
        if (formData.observaciones && typeof formData.observaciones === 'string' && formData.observaciones.trim()) {
          params.append('observaciones', formData.observaciones.trim())
        }
        if (formData.ordenador_gasto && typeof formData.ordenador_gasto === 'string' && formData.ordenador_gasto.trim()) {
          params.append('ordenador_gasto', formData.ordenador_gasto.trim())
        }
        if (formData.plataforma_origen && typeof formData.plataforma_origen === 'string' && formData.plataforma_origen.trim()) {
          params.append('plataforma_origen', formData.plataforma_origen.trim())
        }
        if (formData.valor_orden && String(formData.valor_orden).trim()) {
          params.append('valor_orden', String(formData.valor_orden))
        }

        console.log('📤 URL completa:', `${apiUrl}/emprestito/modificar-orden-compra?${params.toString()}`)
        console.log('📤 Parámetros a enviar:', Object.fromEntries(params))

        const response = await fetch(`${apiUrl}/emprestito/modificar-orden-compra?${params.toString()}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        const result = await response.json()
        console.log('✅ Respuesta del servidor:', result)
        console.log('✅ Success?', result.success)
        console.log('✅ Message:', result.message)
        console.log('✅ Campos actualizados:', result.campos_actualizados)

        if (!response.ok) {
          console.error('❌ Error en respuesta:', response.status, result)
          if (response.status === 404) {
            alert('Orden de compra no encontrada')
          } else {
            alert(result.error || result.detail || 'Error al actualizar la orden de compra')
          }
          return
        }

        if (!result.success) {
          throw new Error(result.error || 'El servidor indicó que la actualización falló')
        }

        // Preparar datos actualizados para actualización optimista
        const updatedData = {
          ...editingData,
          numero_orden: formData.numero_orden,
          nombre_centro_gestor: formData.nombre_centro_gestor,
          nombre_banco: formData.nombre_banco,
          nombre_resumido_proceso: formData.nombre_resumido_proceso,
          valor_proyectado: parseFloat(formData.valor_proyectado) || editingData.valor_proyectado || 0,
          valor_orden: parseFloat(formData.valor_orden || formData.valor_proyectado) || editingData.valor_orden || 0,
          bp: formData.bp,
          // Campos adicionales
          ano_orden: parseInt(formData.ano_orden) || editingData.ano_orden,
          bpin: formData.bpin || editingData.bpin,
          estado: formData.estado || editingData.estado,
          estado_orden: formData.estado_orden || editingData.estado_orden,
          fecha_publicacion_orden: formData.fecha_publicacion_orden || editingData.fecha_publicacion_orden,
          fecha_vencimiento_orden: formData.fecha_vencimiento_orden || editingData.fecha_vencimiento_orden,
          modalidad_contratacion: formData.modalidad_contratacion || editingData.modalidad_contratacion,
          nit_entidad: formData.nit_entidad || editingData.nit_entidad,
          nit_proveedor: formData.nit_proveedor || editingData.nit_proveedor,
          nombre_proveedor: formData.nombre_proveedor || editingData.nombre_proveedor,
          objeto_orden: formData.objeto_orden || editingData.objeto_orden,
          observaciones: formData.observaciones || editingData.observaciones,
          ordenador_gasto: formData.ordenador_gasto || editingData.ordenador_gasto,
          plataforma_origen: formData.plataforma_origen || editingData.plataforma_origen
        }
        console.log('📦 Datos actualizados para UI:', updatedData)

        alert('Orden de compra actualizada exitosamente')
        
        // Cerrar modal y notificar con datos actualizados
        onClose()
        await onSuccess(updatedData)
        return
      } else {
        // MODO CREACIÓN: usar POST
        const payload = new URLSearchParams()
        payload.append('numero_orden', formData.numero_orden)
        payload.append('nombre_centro_gestor', formData.nombre_centro_gestor)
        payload.append('nombre_banco', formData.nombre_banco)
        payload.append('nombre_resumido_proceso', formData.nombre_resumido_proceso)
        payload.append('valor_proyectado', formData.valor_proyectado)
        if (formData.bp) {
          payload.append('bp', formData.bp)
        }

        const response = await fetch('/api/proxy/emprestito/cargar-orden-compra', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: payload.toString()
        })

        const result = await response.json()

        if (!response.ok) {
          // Manejo de duplicados
          if (response.status === 409) {
            alert(`Ya existe una orden de compra con número: ${formData.numero_orden}`)
          } else {
            alert(result.error || result.detail || 'Error al crear la orden de compra')
          }
          return
        }

        alert('Orden de compra creada exitosamente')
      }
      
      // Resetear formulario
      setFormData({
        numero_orden: '',
        nombre_centro_gestor: '',
        nombre_banco: '',
        nombre_resumido_proceso: '',
        valor_proyectado: '',
        bp: '',
        ano_orden: '',
        bpin: '',
        estado: '',
        estado_orden: '',
        fecha_publicacion_orden: '',
        fecha_vencimiento_orden: '',
        modalidad_contratacion: '',
        nit_entidad: '',
        nit_proveedor: '',
        nombre_proveedor: '',
        objeto_orden: '',
        observaciones: '',
        ordenador_gasto: '',
        plataforma_origen: '',
        valor_orden: ''
      })
      setErrors({})
      
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error:', error)
      alert(isEditMode ? 'Error al actualizar la orden de compra' : 'Error al crear la orden de compra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar error del campo al editar
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
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
                  <h2 className="text-2xl font-bold">
                    {isEditMode ? 'Editar Orden de Compra TVEC' : 'Agregar Orden de Compra TVEC'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isEditMode ? 'Modificar datos de la orden de compra' : 'Registrar nueva orden de compra de Tienda Virtual'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
                    errors.numero_orden ? 'border-red-500' : ''
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
                  Centro Gestor {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="nombre_centro_gestor"
                  value={formData.nombre_centro_gestor}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_centro_gestor ? 'border-red-500' : ''
                  }`}
                  disabled={isSubmitting || loadingData}
                >
                  <option value="">Seleccione un centro gestor</option>
                  {centrosGestores.map(centro => (
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
                  Banco {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="nombre_banco"
                  value={formData.nombre_banco}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_banco ? 'border-red-500' : ''
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
                  Nombre Resumido del Proceso {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  name="nombre_resumido_proceso"
                  value={formData.nombre_resumido_proceso}
                  onChange={handleChange}
                  placeholder="Suministro de equipos médicos..."
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.nombre_resumido_proceso ? 'border-red-500' : ''
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
                  Valor Proyectado (COP) {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  name="valor_proyectado"
                  value={formData.valor_proyectado}
                  onChange={handleChange}
                  placeholder="1500000000"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_proyectado ? 'border-red-500' : ''
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

              {/* BP (Opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código BP (Opcional)
                </label>
                <input
                  type="text"
                  name="bp"
                  value={formData.bp}
                  onChange={handleChange}
                  placeholder="BP-2024-001"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={isSubmitting}
                />
              </div>

              {/* Sección de Campos Adicionales - Solo visible en modo edición */}
              {isEditMode && (
                <div className="col-span-full">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Campos Adicionales (Opcionales)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Año de Orden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Año de Orden
                        </label>
                        <input
                          type="number"
                          name="ano_orden"
                          value={formData.ano_orden}
                          onChange={handleChange}
                          placeholder="2024"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* BPIN */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          BPIN
                        </label>
                        <input
                          type="text"
                          name="bpin"
                          value={formData.bpin}
                          onChange={handleChange}
                          placeholder="BPIN-123456"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Estado */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado
                        </label>
                        <input
                          type="text"
                          name="estado"
                          value={formData.estado}
                          onChange={handleChange}
                          placeholder="Activa, Cerrada, Anulada..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Estado Orden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estado Orden
                        </label>
                        <input
                          type="text"
                          name="estado_orden"
                          value={formData.estado_orden}
                          onChange={handleChange}
                          placeholder="En proceso, Finalizada..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Modalidad de Contratación */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Modalidad de Contratación
                        </label>
                        <input
                          type="text"
                          name="modalidad_contratacion"
                          value={formData.modalidad_contratacion}
                          onChange={handleChange}
                          placeholder="Licitación, Contratación Directa..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Plataforma Origen */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Plataforma Origen
                        </label>
                        <input
                          type="text"
                          name="plataforma_origen"
                          value={formData.plataforma_origen}
                          onChange={handleChange}
                          placeholder="TVEC, SECOP..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* NIT Entidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          NIT Entidad
                        </label>
                        <input
                          type="text"
                          name="nit_entidad"
                          value={formData.nit_entidad}
                          onChange={handleChange}
                          placeholder="890.123.456-7"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* NIT Proveedor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          NIT Proveedor
                        </label>
                        <input
                          type="text"
                          name="nit_proveedor"
                          value={formData.nit_proveedor}
                          onChange={handleChange}
                          placeholder="890.987.654-3"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Nombre Proveedor */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nombre Proveedor
                        </label>
                        <input
                          type="text"
                          name="nombre_proveedor"
                          value={formData.nombre_proveedor}
                          onChange={handleChange}
                          placeholder="Nombre completo del proveedor"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Ordenador de Gasto */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Ordenador de Gasto
                        </label>
                        <input
                          type="text"
                          name="ordenador_gasto"
                          value={formData.ordenador_gasto}
                          onChange={handleChange}
                          placeholder="Nombre del ordenador de gasto"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Valor Orden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Valor Orden
                        </label>
                        <input
                          type="number"
                          name="valor_orden"
                          value={formData.valor_orden}
                          onChange={handleChange}
                          placeholder="1500000000"
                          step="0.01"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Fecha Publicación Orden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Publicación Orden
                        </label>
                        <input
                          type="date"
                          name="fecha_publicacion_orden"
                          value={formData.fecha_publicacion_orden}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Fecha Vencimiento Orden */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fecha Vencimiento Orden
                        </label>
                        <input
                          type="date"
                          name="fecha_vencimiento_orden"
                          value={formData.fecha_vencimiento_orden}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Objeto de la Orden */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Objeto de la Orden
                        </label>
                        <textarea
                          name="objeto_orden"
                          value={formData.objeto_orden}
                          onChange={handleChange}
                          placeholder="Descripción detallada del objeto de la orden..."
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Observaciones */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Observaciones
                        </label>
                        <textarea
                          name="observaciones"
                          value={formData.observaciones}
                          onChange={handleChange}
                          placeholder="Observaciones adicionales..."
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    {isEditMode ? 'Actualizar Orden de Compra' : 'Guardar Orden de Compra'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AgregarOrdenCompraModal
