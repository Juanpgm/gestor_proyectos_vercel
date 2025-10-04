'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/components/LoginPage'
import { motion } from 'framer-motion'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { state } = useAuth()

  // Si no está autenticado, mostrar login
  if (!state.isAuthenticated) {
    return <LoginPage />
  }

  // Si está autenticado, mostrar la aplicación
  return <>{children}</>
}

// Componente para mostrar información del usuario autenticado
export function UserProfile() {
  const { state, signOut } = useAuth()
  
  if (!state.user) return null

  return (
    <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 px-2 py-1 md:px-3 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-center space-x-2">
        {state.user.photoURL ? (
          <img
            src={state.user.photoURL}
            alt={state.user.displayName || 'Usuario'}
            className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white text-xs md:text-sm font-medium">
              {(state.user.displayName || state.user.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="hidden md:block min-w-0">
          <p className="text-xs md:text-sm font-medium text-white truncate">
            {state.user.displayName || state.user.email?.split('@')[0]}
          </p>
          <p className="text-xs text-blue-100 truncate">
            {state.user.email}
          </p>
        </div>
      </div>
      <button
        onClick={signOut}
        className="ml-1 md:ml-2 px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
        title="Cerrar sesión"
      >
        Salir
      </button>
    </div>
  )
}