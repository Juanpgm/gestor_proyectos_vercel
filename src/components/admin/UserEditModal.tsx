'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Building, Power, Key, Loader, User, Phone, Mail } from 'lucide-react'
import { AdminUser } from '@/types/admin'
import adminService from '@/services/admin.service'

interface UserEditModalProps {
  user: AdminUser
  onClose: () => void
  onSuccess: () => void
  centrosGestores: string[]
}

export default function UserEditModal({
  user,
  onClose,
  onSuccess,
  centrosGestores
}: UserEditModalProps) {
  // Estados para todos los campos editables
  const [fullName, setFullName] = useState(user.full_name || '')
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || '')
  const [centroGestor, setCentroGestor] = useState(user.centro_gestor_assigned || '')
  const [isActive, setIsActive] = useState(user.is_active)
  const [emailVerified, setEmailVerified] = useState(user.email_verified)
  const [newPassword, setNewPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Handler unificado para actualizar información general del usuario
  const handleUpdateUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Preparar objeto con solo los campos que han cambiado
      const updates: any = {}
      
      if (fullName !== (user.full_name || '')) {
        updates.full_name = fullName.trim()
      }
      
      if (phoneNumber !== (user.phone_number || '')) {
        updates.phone_number = phoneNumber.trim()
      }
      
      if (centroGestor !== (user.centro_gestor_assigned || '')) {
        updates.centro_gestor_assigned = centroGestor
      }
      
      if (isActive !== user.is_active) {
        updates.is_active = isActive
      }
      
      if (emailVerified !== user.email_verified) {
        updates.email_verified = emailVerified
      }
      
      // Si no hay cambios, mostrar mensaje
      if (Object.keys(updates).length === 0) {
        setError('No hay cambios para guardar')
        setLoading(false)
        return
      }
      
      // Actualizar usuario usando el endpoint PUT /auth/admin/users/{uid}
      await adminService.updateUser(user.uid, updates)
      
      setSuccessMessage('Usuario actualizado exitosamente')
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  // Handler separado para cambio de contraseña (usa endpoint diferente)
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await adminService.changePassword({
        uid: user.uid,
        new_password: newPassword
      })
      setSuccessMessage('Contraseña actualizada exitosamente')
      setNewPassword('')
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Editar Usuario
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-900 dark:text-green-100">{successMessage}</p>
              </div>
            )}

            {/* Información Personal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Información Personal
                </h3>
              </div>
              
              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nombre completo del usuario"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Número de Teléfono
                  </div>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+57 300 123 4567"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Correo Electrónico
                  </div>
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El email no puede ser modificado
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Centro Gestor */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Centro Gestor
                </h3>
              </div>
              <select
                value={centroGestor}
                onChange={(e) => setCentroGestor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar centro gestor</option>
                {centrosGestores.map(centro => (
                  <option key={centro} value={centro}>{centro}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Estados y Verificaciones */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Power className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Estado y Verificaciones
                </h3>
              </div>

              {/* Estado Activo/Inactivo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Estado de la Cuenta
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {isActive ? 'Usuario activo en el sistema' : 'Usuario desactivado'}
                  </p>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Email Verificado */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Email Verificado
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {emailVerified ? 'Email confirmado por el usuario' : 'Email pendiente de verificación'}
                  </p>
                </div>
                <button
                  onClick={() => setEmailVerified(!emailVerified)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    emailVerified
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  {emailVerified ? 'Verificado' : 'No Verificado'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Botón principal para guardar cambios */}
            <button
              onClick={handleUpdateUser}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2 font-medium text-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Cambiar Contraseña (sección separada) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Cambiar Contraseña
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta acción se ejecuta de forma independiente y requiere confirmación separada.
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleChangePassword}
                disabled={loading || !newPassword}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Cambiando contraseña...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
