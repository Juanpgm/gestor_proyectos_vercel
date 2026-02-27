'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, AlertCircle, CheckCircle, Search, ChevronDown } from 'lucide-react'

interface AgregarProcesoModalProps {
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

interface CentroGestor {
  value: string
  label: string
}

interface Banco {
  id?: string
  nombre_banco: string
}

interface SearchableCentroGestorSelectProps {
  value: string
  onChange: (value: string) => void
  options: CentroGestor[]
  required?: boolean
  accent: 'blue' | 'green'
}

const DEFAULT_CENTROS_GESTORES = [
  'Secretaría de Gobierno',
  'Departamento Administrativo de Gestión Jurídica Pública',
  'Departamento Administrativo de Control Interno',
  'Departamento Administrativo de Control Disciplinario Interno de Instrucción',
  'Departamento Administrativo de Hacienda',
  'Departamento Administrativo de Planeación',
  'Departamento Administrativo de Gestión del Medio Ambiente',
  'Departamento Administrativo de Tecnologías de la Información y las Comunicaciones',
  'Departamento Administrativo de Contratación Pública',
  'Departamento Administrativo de Desarrollo e Innovación Institucional',
  'Secretaría de Educación',
  'Secretaría de Salud Pública',
  'Secretaría de Bienestar Social',
  'Secretaría de Vivienda Social y Hábitat',
  'Secretaría de Cultura',
  'Secretaría de Infraestructura',
  'Secretaría de Movilidad',
  'Secretaría de Seguridad y Justicia',
  'Secretaría del Deporte y la Recreación',
  'Secretaría de Gestión del Riesgo de Emergencias y Desastres',
  'Secretaría de Paz y Cultura Ciudadana',
  'Secretaría de Desarrollo Económico',
  'Secretaría de Turismo',
  'Secretaría de Desarrollo Territorial y Participación Ciudadana',
  'Unidad Administrativa Especial de Gestión de Bienes y Servicios',
  'Unidad Administrativa Especial de Servicios Públicos',
  'Unidad Administrativa Especial de Protección Animal'
]

const toCentroOptions = (centros: string[]): CentroGestor[] => {
  const unique = Array.from(new Set(centros.filter(Boolean)))
  return unique.map((nombre) => ({
    value: nombre,
    label: nombre
  }))
}

const SearchableCentroGestorSelect: React.FC<SearchableCentroGestorSelectProps> = ({
  value,
  onChange,
  options,
  required = false,
  accent
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredOptions = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return options
    return options.filter(option => option.label.toLowerCase().includes(normalized))
  }, [options, searchTerm])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const focusClass = accent === 'blue'
    ? 'focus-within:ring-blue-500/25 focus-within:border-blue-500'
    : 'focus-within:ring-green-500/25 focus-within:border-green-500'

  return (
    <div className="relative" ref={containerRef}>
      <input type="hidden" value={value} required={required} />

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left shadow-sm transition-all hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 ${focusClass} flex items-center justify-between gap-2`}
      >
        <span className={`truncate ${value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
          {value || 'Seleccionar centro gestor'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar centro gestor..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Seleccionar centro gestor
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((centro) => (
                <button
                  key={centro.value}
                  type="button"
                  onClick={() => {
                    onChange(centro.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    value === centro.value
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {centro.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No se encontraron resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AgregarProcesoModal: React.FC<AgregarProcesoModalProps> = ({
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

  const [centrosGestores, setCentrosGestores] = useState<CentroGestor[]>(() =>
    toCentroOptions(DEFAULT_CENTROS_GESTORES)
  )
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
    }
  }, [editingData, isOpen])

  const loadInitialData = async () => {
    setLoadingData(true)
    setError(null)

    try {
      const [centrosResponse, bancosResponse] = await Promise.all([
        fetch('/api/proxy/centros-gestores/nombres-unicos'),
        fetch('/api/proxy/asignaciones-emprestito-banco-centro-gestor')
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
        const centrosCombinados = [
          ...DEFAULT_CENTROS_GESTORES,
          ...centrosData.data
        ]
        setCentrosGestores(toCentroOptions(centrosCombinados))
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
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleCentroGestorChange = (selectedValue: string) => {
    setFormData(prev => ({ ...prev, nombre_centro_gestor: selectedValue }))

    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSubmitProceso()
  }

  const handleSubmitProceso = async () => {
    // Debug: Mostrar los datos del formulario
    console.log('🔍 Datos del formulario (proceso):', formData)
    
    const requiredFields = [
      'referencia_proceso',
      'nombre_centro_gestor',
      'nombre_banco',
      'plataforma',
      'bp',
      'id_paa',
      'nombre_resumido_proceso',
      'valor_proyectado'
    ]
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

    await submitToAPI()
  }

  const submitToAPI = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // MODO EDICIÓN para proceso SECOP
      if (editingData) {
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
          params.append('bp', formData.bp.trim())
          params.append('nombre_resumido_proceso', formData.nombre_resumido_proceso.trim())
          params.append('id_paa', formData.id_paa.trim())
          params.append('valor_proyectado', formData.valor_proyectado.toString())

          console.log('📤 URL completa:', `/api/proxy/emprestito/modificar-proceso?${params.toString()}`)
          console.log('📤 Parámetros a enviar:', Object.fromEntries(params))

          const response = await fetch(`/api/proxy/emprestito/modificar-proceso?${params.toString()}`, {
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
      const endpoint = '/emprestito/cargar-proceso'

      // Preparar datos para proceso
      formDataToSend.append('referencia_proceso', formData.referencia_proceso?.trim() || "")
      formDataToSend.append('nombre_centro_gestor', formData.nombre_centro_gestor?.trim() || "")
      formDataToSend.append('nombre_banco', formData.nombre_banco?.trim() || "")
      formDataToSend.append('plataforma', formData.plataforma?.trim() || "")
      formDataToSend.append('bp', formData.bp.trim())
      formDataToSend.append('nombre_resumido_proceso', formData.nombre_resumido_proceso.trim())
      formDataToSend.append('id_paa', formData.id_paa.trim())
      formDataToSend.append('valor_proyectado', formData.valor_proyectado.toString())

      console.log('📤 Enviando datos como FormData:', Object.fromEntries(formDataToSend))
      console.log('🔗 URL de API:', `/api/proxy${endpoint}`)

      const response = await fetch(`/api/proxy${endpoint}`, {
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
      
      setSuccess('Proceso agregado exitosamente')
      
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
              {/* Formulario para Proceso */}
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
                    <SearchableCentroGestorSelect
                      value={formData.nombre_centro_gestor}
                      onChange={handleCentroGestorChange}
                      options={centrosGestores}
                      required
                      accent="blue"
                    />
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

              {/* Campos obligatorios adicionales */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Campos Obligatorios Adicionales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Código BP *
                    </label>
                    <input
                      type="text"
                      name="bp"
                      value={formData.bp}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: BP-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ID PAA *
                    </label>
                    <input
                      type="text"
                      name="id_paa"
                      value={formData.id_paa}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: PAA-2024-123"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre Resumido del Proceso *
                    </label>
                    <input
                      type="text"
                      name="nombre_resumido_proceso"
                      value={formData.nombre_resumido_proceso}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      value={formData.valor_proyectado}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ej: 1500000000"
                    />
                  </div>
                </div>
              </div>
            </>

          {/* Mensajes */}
          {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                        Error al agregar el proceso:
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
                  className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
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
                          <span>Modificar Proceso</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Agregar Proceso</span>
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

export default AgregarProcesoModal