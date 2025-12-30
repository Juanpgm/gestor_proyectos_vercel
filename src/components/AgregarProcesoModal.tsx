'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface AgregarProcesoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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

interface CentroGestor {
  value: string
  label: string
}

interface Banco {
  id?: string
  nombre_banco: string
}

const AgregarProcesoModal: React.FC<AgregarProcesoModalProps> = ({
  isOpen,
  onClose,
  onSuccess
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

  const [centrosGestores, setCentrosGestores] = useState<CentroGestor[]>([])
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Opciones de plataforma predefinidas
  const plataformasOptions = [
    { value: 'SECOP', label: 'SECOP' },
    { value: 'SECOP II', label: 'SECOP II' },
    { value: 'SECOP I', label: 'SECOP I' },
    { value: 'SECOP 2', label: 'SECOP 2' },
    { value: 'SECOP 1', label: 'SECOP 1' },
    { value: 'TVEC', label: 'TVEC' }
  ]

  // Cargar centros gestores y bancos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
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
          setError(null)
          setSuccess(null)
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, loading, onClose])

  const loadInitialData = async () => {
    setLoadingData(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Cargar centros gestores y bancos en paralelo
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

      // Procesar centros gestores
      if (centrosData.success && Array.isArray(centrosData.data)) {
        const centrosFormatted = centrosData.data.map((nombre: string) => ({
          value: nombre,
          label: nombre
        }))
        setCentrosGestores(centrosFormatted)
      } else {
        throw new Error('Formato inválido de datos de centros gestores')
      }

      // Procesar bancos - extraer bancos únicos de las asignaciones
      if (bancosData.success && Array.isArray(bancosData.data)) {
        // Obtener bancos únicos
        const bancosUnicos = Array.from(
          new Set(bancosData.data.map((asig: any) => asig.banco).filter(Boolean))
        ).map((nombreBanco: any) => ({
          nombre_banco: nombreBanco
        }))
        setBancos(bancosUnicos)
      } else {
        throw new Error('Formato inválido de datos de bancos')
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar errores al empezar a escribir
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar campos obligatorios
    const requiredFields = ['referencia_proceso', 'nombre_centro_gestor', 'nombre_banco', 'plataforma']
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormData])
    
    if (missingFields.length > 0) {
      setError(`Los siguientes campos son obligatorios: ${missingFields.join(', ')}`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Preparar datos para envío
      const dataToSend = {
        referencia_proceso: formData.referencia_proceso,
        nombre_centro_gestor: formData.nombre_centro_gestor,
        nombre_banco: formData.nombre_banco,
        plataforma: formData.plataforma,
        ...(formData.bp && { bp: formData.bp }),
        ...(formData.nombre_resumido_proceso && { nombre_resumido_proceso: formData.nombre_resumido_proceso }),
        ...(formData.id_paa && { id_paa: formData.id_paa }),
        ...(formData.valor_proyectado && { valor_proyectado: parseFloat(formData.valor_proyectado) })
      }

      const response = await fetch(`${apiUrl}/emprestito/cargar-proceso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      setSuccess('Proceso agregado exitosamente')
      
      // Limpiar formulario
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

      // Notificar éxito y cerrar modal después de un momento
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Error creating proceso:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al crear el proceso')
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
      setError(null)
      setSuccess(null)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            style={{ zIndex: 9998 }}
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div 
            className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 relative"
            style={{ zIndex: 10000 }}
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 relative"
              style={{ zIndex: 10001 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Agregar Nuevo Proceso
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Complete los datos del proceso de empréstito
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loading inicial */}
              {loadingData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Cargando datos...</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Campos obligatorios */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                      Campos Obligatorios
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Referencia del Proceso */}
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

                      {/* Centro Gestor */}
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

                      {/* Banco */}
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

                      {/* Plataforma */}
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
                      {/* BP */}
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

                      {/* ID PAA */}
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

                      {/* Nombre Resumido */}
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

                      {/* Valor Proyectado */}
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

                  {/* Mensajes de error y éxito */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-700 dark:text-green-300">{success}</span>
                    </motion.div>
                  )}

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Agregar Proceso</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AgregarProcesoModal