'use client'

import React, { useState, useCallback } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string
  maxFiles?: number
  maxSizeMB?: number
  label?: string
  description?: string
  required?: boolean
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  acceptedTypes = '*/*',
  maxFiles = 5,
  maxSizeMB = 10,
  label = 'Cargar Archivos',
  description = 'Arrastra archivos aquí o haz clic para explorar',
  required = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFiles = (files: File[]): { valid: File[], errors: string[] } => {
    const errors: string[] = []
    const valid: File[] = []

    if (selectedFiles.length + files.length > maxFiles) {
      errors.push(`Máximo ${maxFiles} archivo(s) permitido(s)`)
      return { valid: [], errors }
    }

    files.forEach(file => {
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: Tamaño máximo ${maxSizeMB}MB`)
      } else {
        valid.push(file)
      }
    })

    return { valid, errors }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const { valid, errors } = validateFiles(fileArray)

    if (errors.length > 0) {
      setError(errors.join(', '))
      setTimeout(() => setError(null), 5000)
      return
    }

    const newFiles = [...selectedFiles, ...valid]
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
    setError(null)
  }, [selectedFiles, onFilesSelected])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200
          ${dragActive 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <div className={`
            p-3 rounded-full transition-colors
            ${dragActive 
              ? 'bg-indigo-100 dark:bg-indigo-800' 
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}>
            <Upload className={`
              w-6 h-6 transition-colors
              ${dragActive 
                ? 'text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-400 dark:text-gray-500'
              }
            `} />
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Máximo {maxFiles} archivo(s), {maxSizeMB}MB cada uno
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Archivos seleccionados ({selectedFiles.length})
            </p>
            {selectedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded">
                    <File className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Eliminar archivo"
                >
                  <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUploadZone
