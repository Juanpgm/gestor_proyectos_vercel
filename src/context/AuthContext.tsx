'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthState, User } from '@/types/auth'
import authService from '@/services/authService'

// Estado inicial optimizado - comenzar con isLoading false para mostrar UI más rápido
const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true, // Mostrar loading mientras se verifica la sesión
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
      console.log('📦 AuthReducer SET_USER:', {
        hasUser: !!action.payload,
        email: action.payload?.email,
        roles: action.payload?.roles,
        rolesLength: action.payload?.roles?.length
      })
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
  // Helpers para roles y permisos
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  getHighestRole: () => string | null
  isSuperAdmin: () => boolean
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
    const initAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // Inicializar servicio primero para configurar persistencia
        await authService.initialize()
        
        // Verificar sesión almacenada
        const storedSession = authService.getStoredSession()
        
        if (storedSession?.user) {
          // Verificar si la sesión tiene roles
          const hasRoles = storedSession.user.roles && storedSession.user.roles.length > 0
          
          if (!hasRoles) {
            console.warn('⚠️ Sesión antigua sin roles detectada - Actualizando desde backend...')
            
            // Intentar actualizar sesión desde el backend
            try {
              const updatedUser = await authService.validateSession()
              if (updatedUser && updatedUser.roles && updatedUser.roles.length > 0) {
                console.log('✅ Sesión actualizada con roles desde backend:', updatedUser.roles)
                dispatch({ type: 'SET_USER', payload: updatedUser })
                return
              }
            } catch (error) {
              console.error('❌ Error actualizando sesión:', error)
            }
            
            // Si llegamos aquí, no pudimos actualizar los roles
            console.error('❌ No se pudieron obtener roles - Cerrando sesión')
            await authService.signOut()
            dispatch({ type: 'SIGN_OUT' })
            return
          }
          
          // Sesión válida con roles
          dispatch({ type: 'SET_USER', payload: storedSession.user })
        }
        
        // Si no hay sesión almacenada, terminar loading
        dispatch({ type: 'SET_LOADING', payload: false })
        
      } catch (error) {
        console.error('Auth init error:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initAuth()
  }, [])

  // Funciones de autenticación
  const signIn = async (email: string, password: string, remember: boolean = true) => {
    try {
      dispatch({ type: 'CLEAR_ERROR' })
      const user = await authService.signInWithEmail({ email, password, remember })
      
      console.log('🎯 AuthContext - User received from authService:', {
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        hasRoles: user.roles && user.roles.length > 0
      })
      
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
      dispatch({ type: 'SET_LOADING', payload: true })
      // Intentar validar con el backend para obtener roles actualizados
      const user = await authService.validateSession()
      if (user) {
        dispatch({ type: 'SET_USER', payload: user })
      } else {
        // Si falla, usar sesión almacenada
        const storedSession = authService.getStoredSession()
        dispatch({ type: 'SET_USER', payload: storedSession?.user || null })
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Error validando sesión' })
    }
  }

  // Helper: Verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    return state.user?.roles?.includes(role) || false
  }

  // Helper: Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    return state.user?.permissions?.includes(permission) || state.user?.permissions?.includes('*') || false
  }

  // Helper: Obtener el rol con mayor jerarquía del usuario
  const getHighestRole = (): string | null => {
    const roles = state.user?.roles || []
    if (roles.length === 0) return null
    
    // Orden jerárquico de roles (de mayor a menor)
    const roleHierarchy = [
      'super_admin',
      'admin',
      'gestor_master',
      'gestor',
      'consultor_master',
      'consultor',
      'publico'
    ]
    
    for (const role of roleHierarchy) {
      if (roles.includes(role)) return role
    }
    
    return roles[0] // Devolver el primero si no coincide ninguno
  }

  // Helper: Verificar si es super admin
  const isSuperAdmin = (): boolean => {
    const result = hasRole('super_admin')
    console.log('🔐 isSuperAdmin() called:', {
      result,
      userRoles: state.user?.roles,
      hasUser: !!state.user,
      isAuthenticated: state.isAuthenticated
    })
    return result
  }

  const contextValue: AuthContextType = {
    state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
    validateSession,
    hasRole,
    hasPermission,
    getHighestRole,
    isSuperAdmin
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