'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit2, AlertCircle, CheckCircle, Upload, Handshake } from 'lucide-react'

interface ModificarConvenioModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  convenioData: {
    id?: string
    referencia_contrato?: string
    objeto_contrato?: string
    valor_contrato?: number
    [key: string]: any
  } | null
}

const ModificarConvenioModal: React.FC<ModificarConvenioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  convenioData
}) => {
  const [valor_contrato, setValorContrato] = useState<string>('')
  const [change_motivo, setChangeMotivo] = useState<string>('')
  const [change_support_file, setChangeSupportFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Reset form cuando se abre/cierra
  React.useEffect(() => {
    if (isOpen && convenioData) {
      setValorContrato(convenioData.valor_contrato?.toString() || '')
      setChangeMotivo('')
      setChangeSupportFile(null)
      setErrors({})
    }
  }, [isOpen, convenioData])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!valor_contrato || parseFloat(valor_contrato) <= 0) {
      newErrors.valor_contrato = 'El valor del contrato debe ser mayor a 0'
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

    if (!convenioData?.referencia_contrato) {
      alert('No se encontró la referencia del contrato')
      return
    }

    if (!validateForm()) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('valor_contrato', valor_contrato)
      formData.append('change_motivo', change_motivo)
      formData.append('change_support_file', change_support_file!)

      const response = await fetch(
        `/api/proxy/emprestito/modificar-valores/convenio/${encodeURIComponent(convenioData.referencia_contrato)}`,
        {
          method: 'PUT',
          body: formData
        }
      )

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          alert(`No se encontró el convenio con referencia: ${convenioData.referencia_contrato}`)
        } else {
          alert(result.error || result.detail || 'Error al modificar el convenio')
        }
        return
      }

      alert('Convenio de transferencia actualizado exitosamente')
      
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error al modificar convenio:', error)
      alert('Error al modificar el convenio')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !convenioData) return null

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
          <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Handshake className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Modificar Valor - Convenio</h2>
                  <p className="text-green-100 text-sm mt-1">
                    {convenioData.referencia_contrato}
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
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-3">
              {/* Información compacta */}
              <div className="grid grid-cols-1 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Referencia:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{convenioData.referencia_contrato || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Valor Actual:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {convenioData.valor_contrato ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(convenioData.valor_contrato) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Nuevo Valor del Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nuevo Valor (COP) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={valor_contrato}
                  onChange={(e) => {
                    setValorContrato(e.target.value)
                    if (errors.valor_contrato) {
                      setErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.valor_contrato
                        return newErrors
                      })
                    }
                  }}
                  placeholder="1500000000"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                    errors.valor_contrato ? 'border-red-500' : ''
                  }`}
                  disabled={isSubmitting}
                />
                {errors.valor_contrato && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.valor_contrato}
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
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
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
                    id="file-upload-convenio"
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="file-upload-convenio"
                    className={`flex items-center justify-center gap-2 w-full px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      errors.change_support_file
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 bg-gray-50 dark:bg-gray-800'
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
                className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center gap-2"
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

export default ModificarConvenioModal
