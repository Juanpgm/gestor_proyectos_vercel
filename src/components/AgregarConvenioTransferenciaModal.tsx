'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface AgregarConvenioTransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingData?: any | null
  onEdit?: (numeroContrato: string, data: FormData) => Promise<void>
}

interface FormData {
  // Campos obligatorios
  referencia_contrato: string
  nombre_centro_gestor: string
  banco: string
  objeto_contrato: string
  valor_contrato: string
  nombre_resumido_proceso: string
  
  // Campos opcionales
  bp?: string
  bpin?: string
  valor_convenio?: string
  urlproceso?: string
  fecha_inicio_contrato?: string
  fecha_fin_contrato?: string
  modalidad_contrato?: string
  ordenador_gastor?: string
  tipo_contrato?: string
  estado_contrato?: string
  sector?: string
  
  // Campos heredados del sistema anterior
  tipo_documento?: string
  contratista?: string
  nit_contratista?: string
  supervisor?: string
}

interface CentroGestor {
  value: string
  label: string
}

interface Banco {
  id?: string
  nombre_banco: string
}

const AgregarConvenioTransferenciaModal: React.FC<AgregarConvenioTransferenciaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingData = null,
  onEdit
}) => {
  const [formData, setFormData] = useState<FormData>({
    // Campos obligatorios
    referencia_contrato: '',
    nombre_centro_gestor: '',
    banco: '',
    objeto_contrato: '',
    valor_contrato: '',
    nombre_resumido_proceso: '',
    
    // Campos opcionales
    bp: '',
    bpin: '',
    valor_convenio: '',
    urlproceso: '',
    fecha_inicio_contrato: '',
    fecha_fin_contrato: '',
    modalidad_contrato: '',
    ordenador_gastor: '',
    tipo_contrato: '',
    estado_contrato: '',
    sector: '',
    
    // Campos adicionales del sistema
    tipo_documento: 'Convenio',
    contratista: '',
    nit_contratista: '',
    supervisor: ''
  })

  const [centrosGestores, setCentrosGestores] = useState<CentroGestor[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Opciones de tipo de documento
  const tipoDocumentoOptions = [
    { value: 'Convenio', label: 'Convenio' },
    { value: 'Transferencia', label: 'Transferencia' }
  ]

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  // Cargar datos cuando se está editando
  useEffect(() => {
    if (editingData && isOpen) {
      setFormData({
        // Campos obligatorios
        referencia_contrato: editingData.referencia_contrato || editingData.numero_contrato || '',
        nombre_centro_gestor: editingData.nombre_centro_gestor || '',
        banco: editingData.banco || editingData.nombre_banco || '',
        objeto_contrato: editingData.objeto_contrato || '',
        valor_contrato: editingData.valor_contrato?.toString() || '',
        nombre_resumido_proceso: editingData.nombre_resumido_proceso || '',
        
        // Campos opcionales
        bp: editingData.bp || '',
        bpin: editingData.bpin || '',
        valor_convenio: editingData.valor_convenio?.toString() || '',
        urlproceso: editingData.urlproceso || '',
        fecha_inicio_contrato: editingData.fecha_inicio_contrato || editingData.fecha_inicio || '',
        fecha_fin_contrato: editingData.fecha_fin_contrato || editingData.fecha_fin || '',
        modalidad_contrato: editingData.modalidad_contrato || '',
        ordenador_gastor: editingData.ordenador_gastor || '',
        tipo_contrato: editingData.tipo_contrato || editingData.tipo_documento || '',
        estado_contrato: editingData.estado_contrato || '',
        sector: editingData.sector || '',
        
        // Campos adicionales
        tipo_documento: editingData.tipo_documento || 'Convenio',
        contratista: editingData.contratista || '',
        nit_contratista: editingData.nit_contratista || '',
        supervisor: editingData.supervisor || ''
      })
    }
  }, [editingData, isOpen])

  const loadInitialData = async () => {
    setLoadingData(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      const [centrosResponse, bancosResponse] = await Promise.all([
        fetch(`${apiUrl}/centros-gestores/nombres-unicos`),
        fetch(`${apiUrl}/bancos_emprestito_all`)
      ])

      if (!centrosResponse.ok) {
        throw new Error(`Error cargando centros gestores: ${centrosResponse.statusText}`)
      }

      if (!bancosResponse.ok) {
        throw new Error(`Error cargando bancos: ${bancosResponse.statusText}`)
      }

      const centrosData = await centrosResponse.json()
      const bancosData = await bancosResponse.json()

      if (centrosData.success && Array.isArray(centrosData.data)) {
        const centrosFormatted = centrosData.data.map((nombre: string) => ({
          value: nombre,
          label: nombre
        }))
        setCentrosGestores(centrosFormatted)
      }

      if (bancosData.success && Array.isArray(bancosData.data)) {
        setBancos(bancosData.data)
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      setError(error instanceof Error ? error.message : 'Error cargando datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log(`🔄 Campo actualizado: ${name} = "${value}"`)
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 Datos del formulario (convenio/transferencia):', formData)
    
    // Campos obligatorios según el endpoint
    const requiredFields = ['referencia_contrato', 'nombre_centro_gestor', 'banco', 'objeto_contrato', 'valor_contrato', 'nombre_resumido_proceso']
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData]
      console.log(`🔍 Campo ${field}:`, value, 'Vacío:', !value)
      return !value || value.toString().trim() === ''
    })
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields)
      const fieldNames: Record<string, string> = {
        'referencia_contrato': 'Referencia del Contrato',
        'nombre_centro_gestor': 'Centro Gestor',
        'banco': 'Banco',
        'objeto_contrato': 'Objeto del Contrato',
        'valor_contrato': 'Valor del Contrato',
        'nombre_resumido_proceso': 'Nombre del Proceso'
      }
      const friendlyNames = missingFields.map(f => fieldNames[f] || f)
      setError(`Campos obligatorios faltantes: ${friendlyNames.join(', ')}`)
      return
    }

    await submitToAPI()
  }

  const submitToAPI = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Si estamos editando, usar función especial
      if (editingData && onEdit) {
        try {
          // Usar el ID del documento (doc_id) que es el campo 'id' en Firestore
          const docId = editingData.id || editingData.doc_id
          if (!docId) {
            throw new Error('No se encontró el ID del documento para actualizar')
          }
          await onEdit(docId, formData)
          setSuccess('Convenio/Transferencia actualizado exitosamente')
          setTimeout(() => {
            onClose()
          }, 1500)
          return
        } catch (editError) {
          let errorMessage = 'Error desconocido al actualizar'
          if (editError instanceof Error) {
            errorMessage = editError.message
          } else if (typeof editError === 'string') {
            errorMessage = editError
          } else {
            errorMessage = JSON.stringify(editError)
          }
          console.error('Error en onEdit:', errorMessage)
          throw new Error(errorMessage)
        }
      }

      const formDataToSend = new URLSearchParams()
      
      // Campos obligatorios
      formDataToSend.append('referencia_contrato', formData.referencia_contrato?.trim() || "")
      formDataToSend.append('nombre_centro_gestor', formData.nombre_centro_gestor?.trim() || "")
      formDataToSend.append('banco', formData.banco?.trim() || "")
      formDataToSend.append('objeto_contrato', formData.objeto_contrato?.trim() || "")
      formDataToSend.append('valor_contrato', formData.valor_contrato?.toString() || "")
      formDataToSend.append('nombre_resumido_proceso', formData.nombre_resumido_proceso?.trim() || "")
      
      // Campos opcionales - solo enviar si tienen valor
      if (formData.bp && formData.bp.trim()) {
        formDataToSend.append('bp', formData.bp.trim())
      }
      if (formData.bpin && formData.bpin.trim()) {
        formDataToSend.append('bpin', formData.bpin.trim())
      }
      if (formData.valor_convenio && formData.valor_convenio.trim()) {
        formDataToSend.append('valor_convenio', formData.valor_convenio.trim())
      }
      if (formData.urlproceso && formData.urlproceso.trim()) {
        formDataToSend.append('urlproceso', formData.urlproceso.trim())
      }
      if (formData.fecha_inicio_contrato && formData.fecha_inicio_contrato.trim()) {
        formDataToSend.append('fecha_inicio_contrato', formData.fecha_inicio_contrato.trim())
      }
      if (formData.fecha_fin_contrato && formData.fecha_fin_contrato.trim()) {
        formDataToSend.append('fecha_fin_contrato', formData.fecha_fin_contrato.trim())
      }
      if (formData.modalidad_contrato && formData.modalidad_contrato.trim()) {
        formDataToSend.append('modalidad_contrato', formData.modalidad_contrato.trim())
      }
      if (formData.ordenador_gastor && formData.ordenador_gastor.trim()) {
        formDataToSend.append('ordenador_gastor', formData.ordenador_gastor.trim())
      }
      if (formData.tipo_contrato && formData.tipo_contrato.trim()) {
        formDataToSend.append('tipo_contrato', formData.tipo_contrato.trim())
      }
      if (formData.estado_contrato && formData.estado_contrato.trim()) {
        formDataToSend.append('estado_contrato', formData.estado_contrato.trim())
      }
      if (formData.sector && formData.sector.trim()) {
        formDataToSend.append('sector', formData.sector.trim())
      }
      if (formData.contratista && formData.contratista.trim()) {
        formDataToSend.append('contratista', formData.contratista.trim())
      }
      if (formData.nit_contratista && formData.nit_contratista.trim()) {
        formDataToSend.append('nit_contratista', formData.nit_contratista.trim())
      }
      if (formData.supervisor && formData.supervisor.trim()) {
        formDataToSend.append('supervisor', formData.supervisor.trim())
      }

      const endpoint = '/emprestito/cargar-convenio-transferencia'

      console.log('📤 Enviando datos como FormData:', Object.fromEntries(formDataToSend))
      console.log('🔗 URL de API:', `${apiUrl}${endpoint}`)

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formDataToSend
      })

      console.log('📡 Respuesta status:', response.status)

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          console.log('❌ Error data:', errorData)
          
          if (errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              const errorMessages = errorData.detail.map((err: any) => {
                if (typeof err === 'string') {
                  return err
                }
                
                if (err?.loc && err?.msg) {
                  const field = err.loc[err.loc.length - 1]
                  const fieldTranslations: Record<string, string> = {
                    'numero_contrato': 'Número de Contrato',
                    'tipo_documento': 'Tipo de Documento',
                    'objeto_contrato': 'Objeto del Contrato',
                    'nombre_centro_gestor': 'Centro Gestor',
                    'nombre_banco': 'Banco',
                    'banco': 'Banco',
                    'valor_contrato': 'Valor del Contrato',
                    'nombre_resumido_proceso': 'Nombre del Proceso',
                    'fecha_inicio': 'Fecha de Inicio',
                    'fecha_fin': 'Fecha de Fin',
                    'contratista': 'Contratista',
                    'nit_contratista': 'NIT Contratista',
                    'supervisor': 'Supervisor'
                  }
                  
                  const friendlyField = fieldTranslations[field] || field
                  const msgTranslations: Record<string, string> = {
                    'Field required': 'es requerido',
                    'Input should be a valid number': 'debe ser un número válido',
                    'String should have at least 1 character': 'no puede estar vacío'
                  }
                  
                  const friendlyMsg = msgTranslations[err.msg] || err.msg
                  return `${friendlyField} ${friendlyMsg}`
                }
                
                if (err?.msg) {
                  return err.msg
                }
                
                return 'Error de validación desconocido'
              })
              
              errorMessage = errorMessages.join('; ')
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail
            } else {
              errorMessage = 'Error de validación en el servidor'
            }
          } else if (errorData?.error) {
            errorMessage = errorData.error
          } else if (errorData?.message) {
            errorMessage = errorData.message
          } else {
            errorMessage = 'Error desconocido del servidor'
          }
        } catch (parseError) {
          console.log('❌ Error parsing response:', parseError)
          errorMessage = `Error ${response.status}: No se pudo procesar la respuesta del servidor`
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Respuesta exitosa:', result)
      
      setSuccess(editingData 
        ? 'Convenio/Transferencia actualizado exitosamente' 
        : 'Convenio/Transferencia agregado exitosamente')
      
      // Limpiar formulario
      setFormData({
        referencia_contrato: '',
        nombre_centro_gestor: '',
        banco: '',
        objeto_contrato: '',
        valor_contrato: '',
        nombre_resumido_proceso: '',
        bp: '',
        bpin: '',
        valor_convenio: '',
        urlproceso: '',
        fecha_inicio_contrato: '',
        fecha_fin_contrato: '',
        modalidad_contrato: '',
        ordenador_gastor: '',
        tipo_contrato: '',
        estado_contrato: '',
        sector: '',
        tipo_documento: 'Convenio',
        contratista: '',
        nit_contratista: '',
        supervisor: ''
      })

      // NO cerrar automáticamente, dejar que el usuario vea el mensaje y cierre manualmente

    } catch (error) {
      console.error('❌ Error completo:', error)
      
      let errorMessage = 'Error desconocido'
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        errorMessage = `Error: ${JSON.stringify(error)}`
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      // Si hubo éxito, llamar onSuccess para recargar solo la tabla
      const hadSuccess = !!success
      
      setFormData({
        referencia_contrato: '',
        nombre_centro_gestor: '',
        banco: '',
        objeto_contrato: '',
        valor_contrato: '',
        nombre_resumido_proceso: '',
        bp: '',
        bpin: '',
        valor_convenio: '',
        urlproceso: '',
        fecha_inicio_contrato: '',
        fecha_fin_contrato: '',
        modalidad_contrato: '',
        ordenador_gastor: '',
        tipo_contrato: '',
        estado_contrato: '',
        sector: '',
        tipo_documento: 'Convenio',
        contratista: '',
        nit_contratista: '',
        supervisor: ''
      })
      setError(null)
      setSuccess(null)
      onClose()
      
      // Recargar la tabla solo si fue exitoso
      if (hadSuccess) {
        onSuccess()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingData ? 'Editar Convenio/Transferencia' : 'Añadir Convenio o Transferencia'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete los datos del convenio o transferencia del empréstito
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-3 p-5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl shadow-lg"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="w-14 h-14 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-800 dark:text-red-200 mb-1">
                    Error en la Operación
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Cerrar e Intentar de Nuevo
                </button>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl shadow-lg"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-800 dark:text-green-200 mb-1">
                    ¡Operación Exitosa!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  Cerrar y Actualizar Tabla
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator */}
          {loadingData && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando datos...</span>
            </div>
          )}

          {/* Form Fields */}
          {!loadingData && !success && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* === CAMPOS OBLIGATORIOS === */}
              
              {/* Referencia del Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referencia del Contrato <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="referencia_contrato"
                  value={formData.referencia_contrato}
                  onChange={handleInputChange}
                  disabled={!!editingData}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Ej: CNV-2024-001"
                />
              </div>

              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banco <span className="text-red-500">*</span>
                </label>
                <select
                  name="banco"
                  value={formData.banco}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccione un banco</option>
                  {bancos.map(banco => (
                    <option key={banco.id || banco.nombre_banco} value={banco.nombre_banco}>
                      {banco.nombre_banco}
                    </option>
                  ))}
                </select>
              </div>

              {/* Objeto del Contrato - Ocupa toda la fila */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objeto del Contrato <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="objeto_contrato"
                  value={formData.objeto_contrato}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describa el objeto del contrato"
                />
              </div>

              {/* Centro Gestor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Centro Gestor <span className="text-red-500">*</span>
                </label>
                <select
                  name="nombre_centro_gestor"
                  value={formData.nombre_centro_gestor}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccione un centro gestor</option>
                  {centrosGestores.map(centro => (
                    <option key={centro.value} value={centro.value}>
                      {centro.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor del Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor del Contrato <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valor_contrato"
                  value={formData.valor_contrato}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: 1000000000"
                />
              </div>

              {/* Nombre Resumido del Proceso */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Proceso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_resumido_proceso"
                  value={formData.nombre_resumido_proceso}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nombre resumido del proceso contractual"
                />
              </div>

              {/* === CAMPOS OPCIONALES === */}
              
              {/* BP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BP (Código)
                </label>
                <input
                  type="text"
                  name="bp"
                  value={formData.bp}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Código BP"
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
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Código BPIN"
                />
              </div>

              {/* Valor Convenio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor del Convenio
                </label>
                <input
                  type="number"
                  name="valor_convenio"
                  value={formData.valor_convenio}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Valor específico del convenio"
                />
              </div>

              {/* URL Proceso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL del Proceso
                </label>
                <input
                  type="url"
                  name="urlproceso"
                  value={formData.urlproceso}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              {/* Fecha Inicio Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio del Contrato
                </label>
                <input
                  type="date"
                  name="fecha_inicio_contrato"
                  value={formData.fecha_inicio_contrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Fecha Fin Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin del Contrato
                </label>
                <input
                  type="date"
                  name="fecha_fin_contrato"
                  value={formData.fecha_fin_contrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Modalidad Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modalidad del Contrato
                </label>
                <input
                  type="text"
                  name="modalidad_contrato"
                  value={formData.modalidad_contrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Licitación Pública"
                />
              </div>

              {/* Ordenador Gastor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenador del Gasto
                </label>
                <input
                  type="text"
                  name="ordenador_gastor"
                  value={formData.ordenador_gastor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nombre del ordenador"
                />
              </div>

              {/* Tipo Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Contrato
                </label>
                <input
                  type="text"
                  name="tipo_contrato"
                  value={formData.tipo_contrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Obra, Consultoría, Suministro"
                />
              </div>

              {/* Estado Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado del Contrato
                </label>
                <select
                  name="estado_contrato"
                  value={formData.estado_contrato}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Seleccione un estado</option>
                  <option value="En ejecución">En ejecución</option>
                  <option value="Terminado">Terminado</option>
                  <option value="Suspendido">Suspendido</option>
                  <option value="Liquidado">Liquidado</option>
                </select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sector
                </label>
                <input
                  type="text"
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: Educación, Salud, Infraestructura"
                />
              </div>

              {/* Contratista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contratista
                </label>
                <input
                  type="text"
                  name="contratista"
                  value={formData.contratista}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nombre del contratista"
                />
              </div>

              {/* NIT Contratista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NIT Contratista
                </label>
                <input
                  type="text"
                  name="nit_contratista"
                  value={formData.nit_contratista}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: 900123456-7"
                />
              </div>

              {/* Supervisor */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supervisor
                </label>
                <input
                  type="text"
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Nombre del supervisor"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          {!success && !error && (
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || loadingData}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{editingData ? 'Actualizar' : 'Agregar'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default AgregarConvenioTransferenciaModal
