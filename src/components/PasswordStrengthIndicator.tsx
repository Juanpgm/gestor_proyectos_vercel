'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface PasswordStrengthIndicatorProps {
  password: string
  requirements?: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecial: boolean
  }
}

interface PasswordRequirement {
  id: string
  label: string
  test: (pwd: string) => boolean
  isRequired: boolean
}

export default function PasswordStrengthIndicator({ 
  password, 
  requirements = {
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecial: false
  }
}: PasswordStrengthIndicatorProps) {
  const passwordRequirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: `Al menos ${requirements.minLength} caracteres`,
      test: (pwd: string) => pwd.length >= requirements.minLength,
      isRequired: true
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula',
      test: (pwd: string) => /[A-Z]/.test(pwd),
      isRequired: requirements.requireUppercase
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula',
      test: (pwd: string) => /[a-z]/.test(pwd),
      isRequired: requirements.requireLowercase
    },
    {
      id: 'numbers',
      label: 'Al menos un número',
      test: (pwd: string) => /\d/.test(pwd),
      isRequired: requirements.requireNumbers
    },
    {
      id: 'special',
      label: 'Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)',
      test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      isRequired: requirements.requireSpecial
    }
  ].filter(req => req.isRequired || req.id === 'length')

  const metRequirements = passwordRequirements.filter(req => req.test(password))
  const strengthPercentage = password.length > 0 ? (metRequirements.length / passwordRequirements.length) * 100 : 0

  const getStrengthLevel = (): { level: string; color: string; bgColor: string } => {
    if (strengthPercentage === 0) return { level: '', color: '', bgColor: '' }
    if (strengthPercentage <= 25) return { level: 'Muy débil', color: 'text-red-600', bgColor: 'bg-red-500' }
    if (strengthPercentage <= 50) return { level: 'Débil', color: 'text-orange-600', bgColor: 'bg-orange-500' }
    if (strengthPercentage <= 75) return { level: 'Buena', color: 'text-yellow-600', bgColor: 'bg-yellow-500' }
    return { level: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-500' }
  }

  const strengthInfo = getStrengthLevel()

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
    >
      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Seguridad de la contraseña
          </span>
          {strengthInfo.level && (
            <span className={`text-xs font-semibold ${strengthInfo.color}`}>
              {strengthInfo.level}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strengthPercentage}%` }}
            transition={{ duration: 0.3 }}
            className={`h-2 rounded-full transition-colors duration-300 ${strengthInfo.bgColor}`}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="space-y-1.5">
        {passwordRequirements.map((requirement) => {
          const isMet = requirement.test(password)
          return (
            <motion.div
              key={requirement.id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                isMet 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {isMet ? (
                  <CheckIcon className="w-2.5 h-2.5 text-green-600 dark:text-green-400" />
                ) : (
                  <XMarkIcon className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <span className={`text-xs ${
                isMet 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {requirement.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}