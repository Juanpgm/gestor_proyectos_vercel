'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LoginPage from '@/components/LoginPage'
import { ROLES_CONFIG } from '@/types/admin'

/** Routes that bypass auth in development — never reaches production */
const DEV_PUBLIC_ROUTES = ['/test-design-system']

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname()
  const { state, validateSession } = useAuth()
  const sessionCheckRef = useRef<string | null>(null)
  const [isRevalidatingSession, setIsRevalidatingSession] = useState(false)

  const isDevBypassRoute =
    process.env.NODE_ENV === 'development' &&
    DEV_PUBLIC_ROUTES.some(r => pathname?.startsWith(r))

  useEffect(() => {
    if (isDevBypassRoute) return

    const shouldHydrate =
      state.isAuthenticated &&
      !!state.user &&
      state.user.session_valid !== true

    if (!shouldHydrate) {
      sessionCheckRef.current = null
      setIsRevalidatingSession(false)
      return
    }

    const userId = state.user?.uid || '__unknown__'
    if (sessionCheckRef.current === userId) {
      return
    }

    sessionCheckRef.current = userId
    setIsRevalidatingSession(true)
    validateSession().finally(() => {
      setIsRevalidatingSession(false)
    })
  }, [isDevBypassRoute, state.isAuthenticated, state.user?.uid, state.user?.session_valid, validateSession])

  // Dev-only showcase bypass — no auth needed
  if (isDevBypassRoute) {
    return <>{children}</>
  }

  // Si está cargando, mostrar loading
  if (state.isLoading || isRevalidatingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6f9]">
        <div className="w-7 h-7 rounded-md bg-[#1d4ed8] flex items-center justify-center mb-5">
          <span className="text-white text-[11px] font-bold tracking-tight">CT</span>
        </div>
        <div className="w-5 h-5 rounded-full border-2 border-[#1d4ed8]/20 border-t-[#1d4ed8] animate-spin" />
        <p className="mt-4 text-[13px] text-gray-500 tracking-wide">Validando sesión...</p>
      </div>
    )
  }

  // Si no está autenticado, mostrar login
  if (!state.isAuthenticated) {
    return <LoginPage />
  }

  // Si no se confirmó la sesión luego de revalidar, volver a login para evitar loop
  if (state.user?.session_valid !== true) {
    return <LoginPage />
  }

  // Si está autenticado, mostrar la aplicación
  return <>{children}</>
}

// Componente para mostrar información del usuario autenticado
export function UserProfile() {
  const { state, signOut, getHighestRole } = useAuth()
  
  if (!state.user) return null

  const highestRole = getHighestRole()
  const nombreCentroGestor = state.user.nombre_centro_gestor || state.user.centro_gestor_assigned
  const roleAliasMap: Record<string, string> = {
    admin: 'admin_general',
    gestor_master: 'admin_centro_gestor',
    gestor: 'editor_datos',
    consultor_master: 'analista',
    consultor: 'visualizador'
  }

  const normalizedRole = roleAliasMap[highestRole || ''] || highestRole || ''
  const profileColor = ROLES_CONFIG[normalizedRole as keyof typeof ROLES_CONFIG]?.color || '#2563EB'
  const isPublicRole = normalizedRole === 'publico'

  return (
    <div
      className="flex items-center space-x-2 px-2 py-1 md:px-3 md:py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 max-w-full"
      style={isPublicRole
        ? { backgroundColor: '#374151', border: `1px solid ${profileColor}33` }
        : { backgroundColor: profileColor }}
    >
      <div className="flex items-center space-x-2 min-w-0">
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
          {nombreCentroGestor && (
            <p className="text-xs text-blue-100 truncate">
              {nombreCentroGestor}
            </p>
          )}
        </div>

        <div className="md:hidden min-w-0 max-w-[130px]">
          <p className="text-[10px] text-white font-medium truncate">
            {state.user.displayName || state.user.email?.split('@')[0]}
          </p>
          {nombreCentroGestor && (
            <p className="text-[10px] text-blue-100 truncate">
              {nombreCentroGestor}
            </p>
          )}
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