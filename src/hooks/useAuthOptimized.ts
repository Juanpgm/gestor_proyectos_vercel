'use client'

import { useAuth } from '@/context/AuthContext'
import { useMemo } from 'react'

// Hook optimizado para componentes que solo necesitan saber si está autenticado
export function useAuthStatus() {
  const { state } = useAuth()
  
  return useMemo(() => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    hasUser: !!state.user
  }), [state.isAuthenticated, state.isLoading, state.user])
}

// Hook optimizado para componentes que necesitan datos del usuario
export function useUser() {
  const { state } = useAuth()
  
  return useMemo(() => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated
  }), [state.user, state.isAuthenticated])
}

// Hook optimizado para acciones de autenticación
export function useAuthActions() {
  const { signIn, signUp, signInWithGoogle, signOut, clearError } = useAuth()
  
  return useMemo(() => ({
    signIn,
    signUp, 
    signInWithGoogle,
    signOut,
    clearError
  }), [signIn, signUp, signInWithGoogle, signOut, clearError])
}