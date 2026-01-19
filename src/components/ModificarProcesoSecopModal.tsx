'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, AlertCircle, CheckCircle, Upload } from 'lucide-react'

interface ModificarProcesoSecopModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  procesoData: {
    id?: string
    referencia_proceso?: string
    nombre_resumido_proceso?: string
    valor_publicacion?: number
    [key: string]: any
  } | null
}

const ModificarProcesoSecopModal: React.FC<ModificarProcesoSecopModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  procesoData
}) => {
  const [valor_publicacion, setValorPublicacion] = useState<string>('')
  const [change_motivo, setChangeMotivo] = useState<string>('')
  const [change_support_file, setChangeSupportFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Reset form cuando se cierra
  React.useEffect(() => {
    if (isOpen && procesoData) {
      setValorPublicacion(procesoData.valor_publicacion?.toString() || '')
      setChangeMotivo('')
      setChangeSupportFile(null)
      setErrors({})
    }
  }, [isOpen, procesoData])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!valor_publicacion || parseFloat(valor_publicacion) <= 0) {
      newErrors.valor_publicacion = 'El valor de publicación debe ser mayor a 0'
    }

    if (!change_motivo.trim()) {
      newErrors.change_motivo = 'La justificación del cambio es obligatoria'
    }

    if (!change_support_file) {
      newErrors.change_support_file = 'El documento soporte es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          change_support_file: 'Formato no permitido. Use PDF, XLSX, DOCX'
        }))
        return
      }

      setChangeSupportFile(file)
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.change_support_file
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!procesoData?.referencia_proceso) {
      alert('No se encontró la referencia del proceso')
      return
    }

    if (!validateForm()) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('valor_publicacion', valor_publicacion)
      formData.append('change_motivo', change_motivo)
      formData.append('change_support_file', change_support_file!)

      const response = await fetch(
        `/api/proxy/emprestito/modificar-valores/proceso/${encodeURIComponent(procesoData.referencia_proceso)}`,
        {
          method: 'PUT',
          body: formData
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          alert(`No se encontró el proceso con referencia: ${procesoData.referencia_proceso}`)
        } else {
          alert(result.error || result.detail || 'Error al modificar el proceso')
        }
        return
      }

      alert('Proceso SECOP actualizado exitosamente')
      
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error al modificar proceso:', error)
      alert('Error al modificar el proceso')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !procesoData) return null

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
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Edit2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Modificar Valor - SECOP</h2>
                  <p className="text-orange-100 text-sm mt-1">
                    {procesoData.referencia_proceso}
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
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-250px)]">
            <div className="space-y-3">
              {/* Referencia y Valor Actual */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Referencia:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{procesoData.referencia_proceso || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Valor Actual:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {procesoData.valor_publicacion ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(procesoData.valor_publicacion) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Nuevo Valor de Publicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo Valor (COP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={valor_publicacion}
                  onChange={(e) => {
                    setValorPublicacion(e.target.value)
                    if (errors.valor_publicacion) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.valor_publicacion
                        return newErrors
                      })
                    }
                  }}
                  placeholder="1500000000"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_publicacion ? 'border-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.valor_publicacion && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valor_publicacion}
                  </p>
                )}
              </div>

              {/* Justificación del Cambio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Justificación <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={change_motivo}
                  onChange={(e) => {
                    setChangeMotivo(e.target.value)
                    if (errors.change_motivo) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.change_motivo
                        return newErrors
                      })
                    }
                  }}
                  placeholder="Describa el motivo del cambio..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.change_motivo ? 'border-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.change_motivo && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.change_motivo}
                  </p>
                )}
              </div>

              {/* Documento Soporte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Documento Soporte <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.xlsx,.xls,.docx,.doc"
                    className="hidden"
                    id="file-upload"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.change_support_file
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 bg-gray-50 dark:bg-gray-800'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {change_support_file ? change_support_file.name : 'PDF, XLSX, DOCX'}
                    </span>
                  </label>
                </div>
                {errors.change_support_file && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.change_support_file}
                  </p>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Guardar
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

export default ModificarProcesoSecopModal
