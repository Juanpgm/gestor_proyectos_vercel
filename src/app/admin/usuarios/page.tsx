'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import UserManagementPage from '@/components/admin/UserManagementPage'
import { Loader } from 'lucide-react'

export default function UsuariosPage() {
  const router = useRouter()
  const { state, isSuperAdmin, getHighestRole } = useAuth()

  useEffect(() => {
    // Verificar autenticación y permisos
    if (!state.isAuthenticated) {
      router.push('/') // Redirigir al login
      return
    }

    // Verificar si es super_admin
    if (!isSuperAdmin()) {
      router.push('/') // Redirigir si no es super_admin
      return
    }
  }, [state.isAuthenticated, isSuperAdmin, router])

  // Mostrar loading mientras se verifica la autenticación
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Cargando módulo de administración...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado o no es super_admin, no renderizar nada (se redirige)
  if (!state.isAuthenticated || !isSuperAdmin()) {
    return null
  }

  const userRole = getHighestRole()
  const centroCestor = state.user?.centro_gestor_assigned

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserManagementPage
        currentUserRole={userRole as any}
        currentUserCentroGestor={centroCestor || undefined}
      />
    </div>
  )
}
