'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { AuthState, User } from '@/types/auth'
import authService from '@/services/authService'

// Estado inicial optimizado - comenzar con isLoading false para mostrar UI más rápido
const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: false, // Cambiado a false para mostrar login inmediatamente
  error: null
}

// Tipos de acciones
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SIGN_OUT' }

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    case 'SIGN_OUT':
      return {
        ...initialState,
        isLoading: false
      }
    default:
      return state
  }
}

// Contexto
interface AuthContextType {
  state: AuthState
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>
  signUp: (name: string, email: string, password: string, confirmPassword: string, cellphone: string, nombre_centro_gestor: string) => Promise<void>
  signInWithGoogle: (remember?: boolean) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  validateSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Inicialización simplificada
  useEffect(() => {
    const initAuth = () => {
      try {
        // Solo verificar sesión almacenada
        const storedSession = authService.getStoredSession()
        dispatch({ type: 'SET_USER', payload: storedSession?.user || null })
        
        // Inicializar servicio sin bloquear
        authService.initialize()
      } catch (error) {
        console.error('Auth init error:', error)
      }
    }

    initAuth()
  }, [])

  // Funciones de autenticación
  const signIn = async (email: string, password: string, remember: boolean = true) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' })
      const user = await authService.signInWithEmail({ email, password, remember })
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al iniciar sesión' })
      throw error
    }
  }

  const signUp = async (name: string, email: string, password: string, confirmPassword: string, cellphone: string, nombre_centro_gestor: string) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' })
      
      const user = await authService.registerWithEmail({ 
        name, 
        email, 
        password, 
        confirmPassword,
        cellphone,
        nombre_centro_gestor
      })
      
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al registrar usuario' })
      throw error
    }
  }

  const signInWithGoogle = async (remember: boolean = true) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' })
      
      const user = await authService.signInWithGoogle(remember)
      dispatch({ type: 'SET_USER', payload: user })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al iniciar sesión con Google' })
      throw error
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      dispatch({ type: 'SIGN_OUT' })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Error al cerrar sesión' })
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const validateSession = async () => {
    try {
      const storedSession = authService.getStoredSession()
      dispatch({ type: 'SET_USER', payload: storedSession?.user || null })
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Error validando sesión' })
    }
  }

  const contextValue: AuthContextType = {
    state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
    validateSession
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext