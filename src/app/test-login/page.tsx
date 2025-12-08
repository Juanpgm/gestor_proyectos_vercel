'use client'

import { useState } from 'react'
import authService from '@/services/authService'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔐 Intentando login...')
      const user = await authService.signInWithEmail({ email, password, remember: true })
      console.log('✅ Login exitoso:', user)
      setResult(user)
    } catch (err: any) {
      console.error('❌ Error en login:', err)
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          🧪 Test de Login Directo
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ❌ Error:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                ✅ Login exitoso
              </p>
              <pre className="text-xs text-green-700 dark:text-green-300 overflow-auto bg-white dark:bg-gray-900 p-2 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
            📝 Instrucciones
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-sm">
            <li>Ingresa tus credenciales arriba</li>
            <li>Haz clic en "Iniciar Sesión"</li>
            <li>Abre la consola del navegador (F12) para ver logs detallados</li>
            <li>Si hay error, aparecerá el mensaje exacto</li>
            <li>Si es exitoso, verás el objeto User completo</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
