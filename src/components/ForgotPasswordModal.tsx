'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string
}

export default function ForgotPasswordModal({ isOpen, onClose, userEmail = '' }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(userEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (userEmail) setEmail(userEmail)
  }, [userEmail])

  const handleClose = () => {
    setEmail(userEmail)
    setEmailSent(false)
    setMessage(null)
    onClose()
  }

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No existe una cuenta registrada con este correo electrónico.'
      case 'auth/invalid-email':
        return 'El correo electrónico ingresado no es válido.'
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.'
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.'
      default:
        return 'Ocurrió un error al enviar el correo de recuperación. Intenta nuevamente.'
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setMessage(null)

    try {
      if (!auth) {
        setMessage({ type: 'error', text: 'Firebase no está configurado. Contacta al administrador del sistema.' })
        setIsLoading(false)
        return
      }
      await sendPasswordResetEmail(auth, email)
      setEmailSent(true)
      setMessage({
        type: 'success',
        text: 'Se ha enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y la carpeta de spam.'
      })
    } catch (error: any) {
      const errorCode = error?.code || ''
      setMessage({
        type: 'error',
        text: getFirebaseErrorMessage(errorCode)
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${emailSent ? 'bg-green-100 dark:bg-green-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
                {emailSent ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <KeyIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {emailSent ? 'Correo Enviado' : 'Recuperar Contraseña'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {emailSent
                    ? 'Revisa tu bandeja de entrada'
                    : 'Ingresa tu correo para recibir instrucciones'
                  }
                </p>
              </div>
            </div>

            {!emailSent ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu.email@cali.gov.co"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      required
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Te enviaremos un enlace para que puedas crear una nueva contraseña. El enlace expira en 1 hora.
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!email || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </motion.button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Hemos enviado un correo a <strong>{email}</strong> con un enlace para restablecer tu contraseña.
                  </p>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>1. Abre el correo y haz clic en el enlace de recuperación</p>
                  <p>2. Crea tu nueva contraseña en la página que se abre</p>
                  <p>3. Regresa aquí e inicia sesión con tu nueva contraseña</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ¿No recibiste el correo? Revisa tu carpeta de spam o
                  <button
                    type="button"
                    onClick={() => { setEmailSent(false); setMessage(null) }}
                    className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                  >
                    intenta nuevamente
                  </button>
                </p>
              </div>
            )}

            {/* Message */}
            <AnimatePresence>
              {message && !emailSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`mt-4 p-3 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <p className={`text-sm ${
                    message.type === 'success' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {message.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                {emailSent ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}