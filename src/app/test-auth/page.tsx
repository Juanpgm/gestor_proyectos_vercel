'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function TestAuthPage() {
  const { state, isSuperAdmin, hasRole, getHighestRole } = useAuth()

  useEffect(() => {
    console.log('=== TEST AUTH PAGE ===')
    console.log('Estado completo:', state)
    console.log('Usuario:', state.user)
    console.log('Roles:', state.user?.roles)
    console.log('Permisos:', state.user?.permissions)
    console.log('isSuperAdmin():', isSuperAdmin())
    console.log('getHighestRole():', getHighestRole())
    
    // Verificar localStorage
    const session = localStorage.getItem('auth_session')
    if (session) {
      console.log('Session en localStorage:', JSON.parse(session))
    }
  }, [state, isSuperAdmin, getHighestRole])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🔍 Test de Autenticación y Roles
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              Estado de Autenticación
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Autenticado:</strong> {state.isAuthenticated ? '✅ Sí' : '❌ No'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Cargando:</strong> {state.isLoading ? '⏳ Sí' : '✅ No'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Error:</strong> {state.error || '✅ Ninguno'}
              </p>
            </div>
          </div>

          {state.user && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Información del Usuario
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>UID:</strong> {state.user.uid}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Email:</strong> {state.user.email}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Nombre:</strong> {state.user.displayName || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Roles y Permisos
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Roles:</strong>{' '}
                    {state.user.roles && state.user.roles.length > 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {state.user.roles.join(', ')}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        ❌ No hay roles asignados
                      </span>
                    )}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Rol Principal:</strong>{' '}
                    {getHighestRole() ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {getHighestRole()}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">N/A</span>
                    )}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Es Super Admin:</strong>{' '}
                    {isSuperAdmin() ? (
                      <span className="text-purple-600 dark:text-purple-400">✅ Sí</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">❌ No</span>
                    )}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Permisos:</strong>{' '}
                    {state.user.permissions && state.user.permissions.length > 0 ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400 block mt-1">
                        {state.user.permissions.join(', ')}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        ❌ No hay permisos asignados
                      </span>
                    )}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Centro Gestor:</strong>{' '}
                    {state.user.centro_gestor_assigned || 'N/A'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Activo:</strong>{' '}
                    {state.user.is_active !== undefined
                      ? state.user.is_active
                        ? '✅ Sí'
                        : '❌ No'
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                  Objeto User Completo (JSON)
                </h2>
                <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto text-xs">
                  {JSON.stringify(state.user, null, 2)}
                </pre>
              </div>
            </>
          )}

          {!state.user && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-red-600 dark:text-red-400">
                ❌ No hay usuario autenticado. Por favor, inicia sesión primero.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            📝 Instrucciones
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
            <li>Abre la consola del navegador (F12)</li>
            <li>Revisa los logs que comienzan con "=== TEST AUTH PAGE ==="</li>
            <li>Verifica que los roles estén presentes</li>
            <li>
              Si no hay roles, verifica que el backend esté retornando los datos correctamente
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
