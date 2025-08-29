'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle } from 'lucide-react'

interface PDFLoadingIndicatorProps {
  isVisible: boolean
  progress: number
  stage: 'preparing' | 'capturing' | 'generating' | 'downloading' | 'completed'
}

const PDFLoadingIndicator: React.FC<PDFLoadingIndicatorProps> = ({ 
  isVisible, 
  progress, 
  stage 
}) => {
  if (!isVisible) return null

  const getStageText = () => {
    switch (stage) {
      case 'preparing': return 'Preparando exportación...'
      case 'capturing': return 'Capturando contenido...'
      case 'generating': return 'Generando PDF...'
      case 'downloading': return 'Descargando archivo...'
      case 'completed': return '¡PDF generado exitosamente!'
      default: return 'Procesando...'
    }
  }

  const getStageIcon = () => {
    switch (stage) {
      case 'preparing': 
        return <FileText className="w-6 h-6 text-blue-500 animate-pulse" />
      case 'capturing': 
        return <FileText className="w-6 h-6 text-orange-500 animate-bounce" />
      case 'generating': 
        return <FileText className="w-6 h-6 text-purple-500 animate-spin" />
      case 'downloading': 
        return <Download className="w-6 h-6 text-green-500 animate-pulse" />
      case 'completed': 
        return <CheckCircle className="w-6 h-6 text-green-600" />
      default: 
        return <FileText className="w-6 h-6 text-gray-500 animate-pulse" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4"
      >
        <div className="flex flex-col items-center space-y-6">
          {/* Icono animado */}
          <div className="flex items-center justify-center">
            {getStageIcon()}
          </div>

          {/* Texto del estado */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Exportando PDF
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getStageText()}
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="w-full">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              />
            </div>
          </div>

          {/* Puntos de progreso */}
          <div className="flex space-x-3">
            {['preparing', 'capturing', 'generating', 'downloading'].map((stepStage, index) => (
              <div
                key={stepStage}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  stage === stepStage
                    ? 'bg-blue-500 animate-pulse'
                    : progress > (index + 1) * 25
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Mensaje de progreso detallado */}
          {stage === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-green-600 dark:text-green-400"
            >
              <p className="text-sm font-medium">
                El archivo PDF se ha descargado correctamente
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PDFLoadingIndicator
