'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Shield, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function TestModuloUsuarios() {
  const { state, isSuperAdmin, getHighestRole, hasRole } = useAuth()
  const [backendTest, setBackendTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkBackendAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/proxy/admin/users?page=1&limit=5')
      const data = await response.json()
      setBackendTest({
        success: response.ok,
        status: response.status,
        data: data
      })
    } catch (error: any) {
      setBackendTest({
        success: false,
        error: error.message
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (state.isAuthenticated) {
      checkBackendAPI()
    }
  }, [state.isAuthenticated])

  const TestItem = ({ title, pass, message, details }: any) => (
    <div className={`p-4 rounded-lg border-l-4 ${
      pass ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 
      pass === false ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
    }`}>
      <div className="flex items-start gap-3">
        {pass ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> :
         pass === false ? <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" /> :
         <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
          {details && (
            <pre className="mt-2 p-2 bg-gray-800 text-gray-100 rounded text-xs overflow-x-auto">
              {details}
            </pre>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Diagnóstico: Módulo Gestionar Usuarios
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Verificación completa del sistema de autenticación y permisos
          </p>
        </div>

        {/* Estado de Autenticación */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Estado de Autenticación
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</div>
              <div className={`text-lg font-bold ${state.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                {state.isAuthenticated ? '✓ Autenticado' : '✗ No Autenticado'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {state.user?.email || 'N/A'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rol Principal</div>
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {getHighestRole() || 'Sin rol'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Super Admin</div>
              <div className={`text-lg font-bold ${isSuperAdmin() ? 'text-green-600' : 'text-red-600'}`}>
                {isSuperAdmin() ? '✓ SÍ' : '✗ NO'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Roles asignados:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {state.user?.roles?.length || 0}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {state.user?.roles && state.user.roles.length > 0 ? (
                state.user.roles.map(role => (
                  <span key={role} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-sm text-red-600">⚠️ No hay roles asignados</span>
              )}
            </div>
          </div>
        </div>

        {/* Tests */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              🔍 Tests del Sistema
            </h2>
            <button
              onClick={checkBackendAPI}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          <div className="space-y-4">
            <TestItem
              title="1. Usuario Autenticado"
              pass={state.isAuthenticated}
              message={state.isAuthenticated ? 'Usuario autenticado correctamente' : 'No hay usuario autenticado'}
              details={state.isAuthenticated ? `Email: ${state.user?.email}\nUID: ${state.user?.uid}` : null}
            />

            <TestItem
              title="2. Roles en Sesión"
              pass={state.user?.roles && state.user.roles.length > 0}
              message={
                state.user?.roles && state.user.roles.length > 0
                  ? `Usuario tiene ${state.user.roles.length} rol(es) asignado(s)`
                  : 'Usuario no tiene roles asignados'
              }
              details={state.user?.roles ? JSON.stringify(state.user.roles, null, 2) : null}
            />

            <TestItem
              title="3. Rol Super Admin"
              pass={isSuperAdmin()}
              message={
                isSuperAdmin()
                  ? '✓ Usuario tiene rol super_admin'
                  : `✗ Usuario NO es super_admin (Rol actual: ${getHighestRole() || 'ninguno'})`
              }
              details={
                !isSuperAdmin() && state.user?.roles
                  ? `Roles actuales: ${state.user.roles.join(', ')}\n\nPara acceder a "Gestionar Usuarios" necesitas el rol "super_admin"`
                  : null
              }
            />

            <TestItem
              title="4. Backend API /admin/users"
              pass={backendTest?.success}
              message={
                backendTest?.success
                  ? `✓ Backend responde correctamente (${backendTest.data?.users?.length || 0} usuarios)`
                  : backendTest?.error
                  ? `✗ Error: ${backendTest.error}`
                  : '⏳ Verificando conexión...'
              }
              details={backendTest?.data ? JSON.stringify(backendTest.data, null, 2) : null}
            />

            <TestItem
              title="5. Acceso al Módulo"
              pass={isSuperAdmin() ? true : false}
              message={
                isSuperAdmin()
                  ? '✓ Tienes acceso a "Gestionar Usuarios" - Deberías verlo en el sidebar'
                  : '✗ No tienes acceso - Solo super_admin puede ver este módulo'
              }
              details={
                isSuperAdmin()
                  ? 'Si no ves el módulo en el sidebar, intenta recargar la página o cerrar/abrir el sidebar.'
                  : 'Necesitas que un super_admin te asigne el rol "super_admin" para acceder.'
              }
            />
          </div>
        </div>

        {/* Información Detallada */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📋 Información Detallada
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Usuario Completo:</h3>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(state.user, null, 2)}
              </pre>
            </div>

            {state.isAuthenticated && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">localStorage:</h3>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(
                    JSON.parse(localStorage.getItem('auth_session') || '{}'),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⚡ Acciones
          </h2>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              Ir al Dashboard
            </button>
            
            {isSuperAdmin() && (
              <button
                onClick={() => window.location.href = '/admin/usuarios'}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                Abrir Gestionar Usuarios
              </button>
            )}
            
            <button
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
            >
              Limpiar Sesión y Recargar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
