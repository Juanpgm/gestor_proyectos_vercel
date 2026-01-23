'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface AgregarProcesoModalAltProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedData?: any) => void
  editingData?: any | null
  onEdit?: (referenciaProceso: string, data: FormData) => Promise<void>
}

interface FormData {
  referencia_proceso: string
  nombre_centro_gestor: string
  nombre_banco: string
  bp: string
  plataforma: string
  nombre_resumido_proceso: string
  id_paa: string
  valor_proyectado: string
}

interface OrdenCompraFormData {
  numero_orden: string
  nombre_centro_gestor: string
  nombre_banco: string
  nombre_resumido_proceso: string
  valor_proyectado: string
  bp: string
}

type TipoOperacion = 'proceso' | 'orden_compra'

interface CentroGestor {
  value: string
  label: string
}

interface Banco {
  id?: string
  nombre_banco: string
}

const AgregarProcesoModalAlt: React.FC<AgregarProcesoModalAltProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingData = null,
  onEdit
}) => {
  const [formData, setFormData] = useState<FormData>({
    referencia_proceso: '',
    nombre_centro_gestor: '',
    nombre_banco: '',
    bp: '',
    plataforma: '',
    nombre_resumido_proceso: '',
    id_paa: '',
    valor_proyectado: ''
  })

  const [ordenCompraData, setOrdenCompraData] = useState<OrdenCompraFormData>({
    numero_orden: '',
    nombre_centro_gestor: '',
    nombre_banco: '',
    nombre_resumido_proceso: '',
    valor_proyectado: '',
    bp: ''
  })

  const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>('proceso')

  const [centrosGestores, setCentrosGestores] = useState<CentroGestor[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Opciones de plataforma
  const plataformasOptions = [
    { value: 'SECOP I', label: 'SECOP I' },
    { value: 'SECOP II', label: 'SECOP II' },
    { value: 'TVEC', label: 'TVEC' }
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
      console.log('🔍 Pre-llenando formulario con:', editingData)
      console.log('🔍 Plataforma original:', editingData.plataforma)
      
      const newFormData = {
        referencia_proceso: editingData.referencia_proceso || '',
        nombre_centro_gestor: editingData.nombre_centro_gestor || '',
        nombre_banco: editingData.nombre_banco || editingData.banco || '', // Intentar ambos campos
        bp: editingData.bp || '',
        plataforma: editingData.plataforma || '',
        nombre_resumido_proceso: editingData.nombre_resumido_proceso || '',
        id_paa: editingData.id_paa || '',
        valor_proyectado: editingData.valor_proyectado?.toString() || editingData.valor_publicacion?.toString() || ''
      }
      
      console.log('🔍 Datos a establecer en formulario:', newFormData)
      console.log('🔍 Plataforma en newFormData:', newFormData.plataforma)
      
      setFormData(newFormData)
      setTipoOperacion('proceso')
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
        fetch(`${apiUrl}/asignaciones-emprestito-banco-centro-gestor`)
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
        // Extraer bancos únicos de las asignaciones del campo banco
        const bancosUnicos = Array.from(
          new Set(bancosData.data.map((asig: any) => asig.banco).filter(Boolean))
        ).map((nombreBanco: any) => ({
          nombre_banco: nombreBanco
        }))
        setBancos(bancosUnicos)
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      setError(error instanceof Error ? error.message : 'Error cargando datos iniciales')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    console.log(`🔄 Campo actualizado: ${name} = "${value}"`)
    
    if (tipoOperacion === 'proceso') {
      setFormData(prev => ({ ...prev, [name]: value }))
    } else {
      setOrdenCompraData(prev => ({ ...prev, [name]: value }))
    }
    
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (tipoOperacion === 'proceso') {
      await handleSubmitProceso()
    } else {
      await handleSubmitOrdenCompra()
    }
  }

  const handleSubmitProceso = async () => {
    // Debug: Mostrar los datos del formulario
    console.log('🔍 Datos del formulario (proceso):', formData)
    
    const requiredFields = ['referencia_proceso', 'nombre_centro_gestor', 'nombre_banco', 'plataforma']
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof FormData]
      console.log(`🔍 Campo ${field}:`, value, 'Vacío:', !value)
      return !value || value.trim() === ''
    })
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields)
      setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`)
      return
    }

    await submitToAPI('proceso')
  }

  const handleSubmitOrdenCompra = async () => {
    // Debug: Mostrar los datos del formulario
    console.log('🔍 Datos del formulario (orden compra):', ordenCompraData)
    
    const requiredFields = ['numero_orden', 'nombre_centro_gestor', 'nombre_banco', 'nombre_resumido_proceso', 'valor_proyectado']
    const missingFields = requiredFields.filter(field => {
      const value = ordenCompraData[field as keyof OrdenCompraFormData]
      console.log(`🔍 Campo ${field}:`, value, 'Vacío:', !value)
      return !value || value.trim() === ''
    })
    
    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields)
      setError(`Campos obligatorios faltantes: ${missingFields.join(', ')}`)
      return
    }

    await submitToAPI('orden_compra')
  }

  const submitToAPI = async (tipo: TipoOperacion) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // MODO EDICIÓN para proceso SECOP
      if (editingData && tipo === 'proceso') {
        try {
          console.log('📝 Iniciando edición de proceso')
          console.log('📝 FormData actual:', formData)
          console.log('📝 Valor proyectado a enviar:', formData.valor_proyectado)
          
          // Usar el nuevo endpoint PUT con query parameters
          const params = new URLSearchParams()
          params.append('referencia_proceso', formData.referencia_proceso)
          params.append('nombre_centro_gestor', formData.nombre_centro_gestor)
          params.append('nombre_banco', formData.nombre_banco)
          params.append('plataforma', formData.plataforma)
          
          // Campos opcionales
          if (formData.bp && formData.bp.trim()) {
            params.append('bp', formData.bp.trim())
          }
          if (formData.nombre_resumido_proceso && formData.nombre_resumido_proceso.trim()) {
            params.append('nombre_resumido_proceso', formData.nombre_resumido_proceso.trim())
          }
          if (formData.id_paa && formData.id_paa.trim()) {
            params.append('id_paa', formData.id_paa.trim())
          }
          if (formData.valor_proyectado) {
            params.append('valor_proyectado', formData.valor_proyectado.toString())
          }

          console.log('📤 URL completa:', `${apiUrl}/emprestito/modificar-proceso?${params.toString()}`)
          console.log('📤 Parámetros a enviar:', Object.fromEntries(params))

          const response = await fetch(`${apiUrl}/emprestito/modificar-proceso?${params.toString()}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error('❌ Error en respuesta:', response.status, errorData)
            if (response.status === 404) {
              throw new Error('Proceso no encontrado')
            }
            throw new Error(errorData.error || errorData.detail || 'Error al actualizar el proceso')
          }

          const responseData = await response.json()
          console.log('✅ Respuesta del servidor:', responseData)
          console.log('✅ Success?', responseData.success)
          console.log('✅ Message:', responseData.message)
          console.log('✅ Campos actualizados:', responseData.campos_actualizados)

          if (!responseData.success) {
            throw new Error(responseData.error || 'El servidor indicó que la actualización falló')
          }

          setSuccess('Proceso actualizado exitosamente')
          
          // Cerrar modal y pasar los datos actualizados para actualización optimista
          const updatedData = {
            ...editingData,
            referencia_proceso: formData.referencia_proceso,
            nombre_centro_gestor: formData.nombre_centro_gestor,
            nombre_banco: formData.nombre_banco,
            plataforma: formData.plataforma,
            bp: formData.bp,
            nombre_resumido_proceso: formData.nombre_resumido_proceso,
            id_paa: formData.id_paa,
            valor_proyectado: parseFloat(formData.valor_proyectado) || 0
          }
          console.log('📦 Datos actualizados para UI:', updatedData)
          onClose()
          await onSuccess(updatedData)
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
          console.error('Error en edición:', errorMessage)
          throw new Error(errorMessage)
        }
      }

      const formDataToSend = new URLSearchParams()
      let endpoint = ''

      if (tipo === 'proceso') {
        // Preparar datos para proceso
        formDataToSend.append('referencia_proceso', formData.referencia_proceso?.trim() || "")
        formDataToSend.append('nombre_centro_gestor', formData.nombre_centro_gestor?.trim() || "")
        formDataToSend.append('nombre_banco', formData.nombre_banco?.trim() || "")
        formDataToSend.append('plataforma', formData.plataforma?.trim() || "")
        
        // Campos opcionales - solo enviar si tienen valor
        if (formData.bp && formData.bp.trim()) {
          formDataToSend.append('bp', formData.bp.trim())
        }
        if (formData.nombre_resumido_proceso && formData.nombre_resumido_proceso.trim()) {
          formDataToSend.append('nombre_resumido_proceso', formData.nombre_resumido_proceso.trim())
        }
        if (formData.id_paa && formData.id_paa.trim()) {
          formDataToSend.append('id_paa', formData.id_paa.trim())
        }
        if (formData.valor_proyectado) {
          formDataToSend.append('valor_proyectado', formData.valor_proyectado.toString())
        }
        
        endpoint = '/emprestito/cargar-proceso'
      } else {
        // Preparar datos para orden de compra
        formDataToSend.append('numero_orden', ordenCompraData.numero_orden?.trim() || "")
        formDataToSend.append('nombre_centro_gestor', ordenCompraData.nombre_centro_gestor?.trim() || "")
        formDataToSend.append('nombre_banco', ordenCompraData.nombre_banco?.trim() || "")
        formDataToSend.append('nombre_resumido_proceso', ordenCompraData.nombre_resumido_proceso?.trim() || "")
        formDataToSend.append('valor_proyectado', ordenCompraData.valor_proyectado?.toString() || "")
        
        // Campo opcional
        if (ordenCompraData.bp && ordenCompraData.bp.trim()) {
          formDataToSend.append('bp', ordenCompraData.bp.trim())
        }
        
        endpoint = '/emprestito/cargar-orden-compra'
      }

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
          
          // Manejar diferentes tipos de errores de la API
          if (errorData?.detail) {
            if (Array.isArray(errorData.detail)) {
              // Si detail es un array de errores de validación (FastAPI/Pydantic)
              const errorMessages = errorData.detail.map((err: any) => {
                if (typeof err === 'string') {
                  return err
                }
                
                // Manejar errores de validación de Pydantic
                if (err?.loc && err?.msg) {
                  const field = err.loc[err.loc.length - 1] // Último elemento del location array
                  const fieldTranslations: Record<string, string> = {
                    'referencia_proceso': 'Referencia del Proceso',
                    'numero_orden': 'Número de Orden',
                    'nombre_centro_gestor': 'Centro Gestor',
                    'nombre_banco': 'Banco',
                    'plataforma': 'Plataforma',
                    'bp': 'Código BP',
                    'nombre_resumido_proceso': 'Nombre Resumido',
                    'id_paa': 'ID PAA',
                    'valor_proyectado': 'Valor Proyectado'
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
            // Manejar errores específicos de la API (como el de SECOP)
            errorMessage = errorData.error
            
            // Si es un error de proceso no encontrado, dar sugerencia
            if (errorMessage.includes('No se encontró el proceso') && errorMessage.includes('SECOP')) {
              errorMessage += '. Verifique que la referencia del proceso sea válida y esté registrada en SECOP.'
            }
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
      
      const successMessage = tipo === 'proceso' 
        ? 'Proceso agregado exitosamente' 
        : 'Orden de compra agregada exitosamente'
      setSuccess(successMessage)
      
      // Limpiar formulario correspondiente
      if (tipo === 'proceso') {
        setFormData({
          referencia_proceso: '',
          nombre_centro_gestor: '',
          nombre_banco: '',
          bp: '',
          plataforma: '',
          nombre_resumido_proceso: '',
          id_paa: '',
          valor_proyectado: ''
        })
      } else {
        setOrdenCompraData({
          numero_orden: '',
          nombre_centro_gestor: '',
          nombre_banco: '',
          nombre_resumido_proceso: '',
          valor_proyectado: '',
          bp: ''
        })
      }

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

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
      setFormData({
        referencia_proceso: '',
        nombre_centro_gestor: '',
        nombre_banco: '',
        bp: '',
        plataforma: '',
        nombre_resumido_proceso: '',
        id_paa: '',
        valor_proyectado: ''
      })
      setOrdenCompraData({
        numero_orden: '',
        nombre_centro_gestor: '',
        nombre_banco: '',
        nombre_resumido_proceso: '',
        valor_proyectado: '',
        bp: ''
      })
      setTipoOperacion('proceso')
      setError(null)
      setSuccess(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {tipoOperacion === 'proceso' ? 'Agregar Nuevo Proceso' : 'Agregar Orden de Compra'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tipoOperacion === 'proceso' 
                  ? 'Complete los datos del proceso de empréstito'
                  : 'Complete los datos de la orden de compra'
                }
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

        {/* Content */}
        <div className="p-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección del tipo de operación */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tipo de Operación
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoOperacion('proceso')}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      tipoOperacion === 'proceso'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📋 Cargar Proceso
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoOperacion('orden_compra')}
                    className={`px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
                      tipoOperacion === 'orden_compra'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    🛒 Cargar Orden de Compra
                  </button>
                </div>
              </div>

              {tipoOperacion === 'proceso' ? (
                // Formulario para Proceso
                <>
                  {/* Campos obligatorios */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                      Campos Obligatorios - Proceso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Referencia del Proceso *
                    </label>
                    <input
                      type="text"
                      name="referencia_proceso"
                      value={formData.referencia_proceso}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: 4171.010.32.1.576-2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Centro Gestor *
                    </label>
                    <select
                      name="nombre_centro_gestor"
                      value={formData.nombre_centro_gestor}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar centro gestor</option>
                      {centrosGestores.map((centro) => (
                        <option key={centro.value} value={centro.value}>
                          {centro.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco *
                    </label>
                    <select
                      name="nombre_banco"
                      value={formData.nombre_banco}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar banco</option>
                      {bancos.map((banco) => (
                        <option key={banco.id || banco.nombre_banco} value={banco.nombre_banco}>
                          {banco.nombre_banco}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plataforma *
                    </label>
                    <select
                      name="plataforma"
                      value={formData.plataforma}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar plataforma</option>
                      {plataformasOptions.map((plataforma) => (
                        <option key={plataforma.value} value={plataforma.value}>
                          {plataforma.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Campos opcionales */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Campos Opcionales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código BP
                    </label>
                    <input
                      type="text"
                      name="bp"
                      value={formData.bp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: BP-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ID PAA
                    </label>
                    <input
                      type="text"
                      name="id_paa"
                      value={formData.id_paa}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: PAA-2024-123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre Resumido del Proceso
                    </label>
                    <input
                      type="text"
                      name="nombre_resumido_proceso"
                      value={formData.nombre_resumido_proceso}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Suministro equipos médicos"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor Proyectado (COP)
                    </label>
                    <input
                      type="number"
                      name="valor_proyectado"
                      value={formData.valor_proyectado}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: 1500000000"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Formulario para Orden de Compra
            <>
              {/* Campos obligatorios para Orden de Compra */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">
                  Campos Obligatorios - Orden de Compra
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Orden *
                    </label>
                    <input
                      type="text"
                      name="numero_orden"
                      value={ordenCompraData.numero_orden}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: OC-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Centro Gestor *
                    </label>
                    <select
                      name="nombre_centro_gestor"
                      value={ordenCompraData.nombre_centro_gestor}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar centro gestor</option>
                      {centrosGestores.map((centro) => (
                        <option key={centro.value} value={centro.value}>
                          {centro.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco *
                    </label>
                    <select
                      name="nombre_banco"
                      value={ordenCompraData.nombre_banco}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Seleccionar banco</option>
                      {bancos.map((banco) => (
                        <option key={banco.id || banco.nombre_banco} value={banco.nombre_banco}>
                          {banco.nombre_banco}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre Resumido Proceso *
                    </label>
                    <input
                      type="text"
                      name="nombre_resumido_proceso"
                      value={ordenCompraData.nombre_resumido_proceso}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: Suministro equipos médicos"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valor Proyectado (COP) *
                    </label>
                    <input
                      type="number"
                      name="valor_proyectado"
                      value={ordenCompraData.valor_proyectado}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: 1500000000"
                    />
                  </div>
                </div>
              </div>

              {/* Campos opcionales para Orden de Compra */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Campos Opcionales
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código BP
                    </label>
                    <input
                      type="text"
                      name="bp"
                      value={ordenCompraData.bp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: BP-2024-001"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Mensajes */}
          {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Error al agregar {tipoOperacion === 'proceso' ? 'el proceso' : 'la orden de compra'}:
                      </p>
                      {error.includes(';') ? (
                        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                          {error.split(';').map((err, index) => (
                            <li key={index} className="flex items-start space-x-1">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{err.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    tipoOperacion === 'proceso' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      {editingData ? (
                        <>
                          <span>Modificar {tipoOperacion === 'proceso' ? 'Proceso' : 'Orden'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>
                            {tipoOperacion === 'proceso' ? 'Agregar Proceso' : 'Agregar Orden'}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgregarProcesoModalAlt