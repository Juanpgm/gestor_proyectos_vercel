'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import { API_CONFIG, AUTH_CONFIG } from '@/config/app'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'
import ForgotPasswordModal from '@/components/ForgotPasswordModal'
import SearchableSelect from '@/components/SearchableSelect'
import { CENTROS_GESTORES } from '@/utils/centrosCatalog'

type AuthMode = 'login' | 'register'

// Fallback local del picklist de centros: catálogo canónico (fuente única).
// Si el endpoint /centros-gestores/nombres-unicos falla, se usa esta lista.
const CENTROS_GESTORES_EXACTOS: string[] = CENTROS_GESTORES

export default function LoginPage() {
  const { state, signIn, signUp, signInWithGoogle, clearError } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    cellphone: '',
    nombre_centro_gestor: '',
    remember: true
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])
  const [loadingCentros, setLoadingCentros] = useState(false)
  const [apiDataLoaded, setApiDataLoaded] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)

  const normalizeCentro = (value: string): string =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()

  // Función para obtener los centros gestores
  const fetchCentrosGestores = async () => {
    try {
      setLoadingCentros(true)
      const response = await fetch('/api/proxy/centros-gestores/nombres-unicos', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`status:${response.status}`)
      }

      const payload = await response.json().catch(() => ({}))
      const apiCentros =
        (Array.isArray(payload) && payload) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.centros_gestores) && payload.centros_gestores) ||
        (Array.isArray(payload?.nombres_centros_gestores) && payload.nombres_centros_gestores) ||
        []

      const normalizedApiCentros = apiCentros
        .map((item: any) => String(item || '').trim())
        .filter(Boolean)

      setCentrosGestores(
        normalizedApiCentros.length > 0
          ? normalizedApiCentros.sort((a: string, b: string) => a.localeCompare(b, 'es'))
          : CENTROS_GESTORES_EXACTOS
      )
      setApiDataLoaded(true)
    } catch (error: any) {
      if (!error?.message?.startsWith('status:')) {
        console.warn('Error fetching centros gestores:', error)
      }
      setCentrosGestores(CENTROS_GESTORES_EXACTOS)
    } finally {
      setLoadingCentros(false)
    }
  }

  // Cargar centros gestores al montar el componente (solo una vez)
  useEffect(() => {
    if (centrosGestores.length === 0 && !loadingCentros) {
      fetchCentrosGestores()
    }
  }, []) // Sin dependencias para evitar bucles

  // Limpiar errores cuando cambie el modo
  useEffect(() => {
    clearError()
    if (mode === 'login') {
      setFormData(prev => ({ 
        ...prev, 
        name: '', 
        confirmPassword: '', 
        cellphone: '', 
        nombre_centro_gestor: '' 
      }))
    }
  }, [mode]) // Eliminar clearError de las dependencias

  // Manejar cambios en los inputs y selects
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false
    
    // Limpiar errores visibles cuando el usuario modifica cualquier campo
    if (state.error) {
      clearError()
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Manejar submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading || !isFormValid) return
    
    setIsLoading(true)

    const normalizedEmail = formData.email.trim().toLowerCase()
    const selectedCentroNormalized = normalizeCentro(formData.nombre_centro_gestor)
    const canonicalCentroGestor =
      centrosGestores.find((centro) => normalizeCentro(centro) === selectedCentroNormalized) ||
      formData.nombre_centro_gestor.trim()

    try {
      if (mode === 'login') {
        await signIn(normalizedEmail, formData.password, formData.remember)
        setLoginAttempts(0) // Reset attempts on successful login
      } else {
        await signUp(formData.name, normalizedEmail, formData.password, formData.confirmPassword, formData.cellphone, canonicalCentroGestor)
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      if (mode === 'login') {
        setLoginAttempts(prev => prev + 1)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar login con Google
  const handleGoogleLogin = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      await signInWithGoogle(formData.remember)
    } catch (error) {
      console.error('Google auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para validar contraseña según requisitos de la API
  const validatePassword = (password: string): boolean => {
    const requirements = AUTH_CONFIG.PASSWORD_REQUIREMENTS
    
    if (password.length < requirements.MIN_LENGTH) return false
    if (requirements.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) return false
    if (requirements.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) return false
    if (requirements.REQUIRE_NUMBERS && !/\d/.test(password)) return false
    if (requirements.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false
    
    return true
  }

  // Validaciones del formulario
  const passwordsMatch = formData.password === formData.confirmPassword
  const isPasswordValid = validatePassword(formData.password)
  const isCellphoneValid = /^\d{10}$/.test(formData.cellphone)

  const isFormValid = mode === 'login' 
    ? formData.email.length > 0 && formData.password.length > 0
    : formData.email.length > 0 && 
      formData.password.length > 0 && 
      formData.name.length > 0 && 
      formData.cellphone.length > 0 && 
      formData.nombre_centro_gestor.length > 0 &&
      formData.confirmPassword.length > 0 &&
      passwordsMatch &&
      isPasswordValid &&
      isCellphoneValid



  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#0d1f36] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-6"
        >
          <div className="mx-auto w-12 h-12 bg-[#1e3a5f] rounded-md flex items-center justify-center mb-4">
            <span className="text-white text-lg font-bold tracking-tight">CT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Gestión de Proyectos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Alcaldía Distrital de Santiago de Cali
          </p>
        </motion.div>

        {/* Formulario principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Pestañas */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                mode === 'login' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                mode === 'register' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Registrarse
            </button>
          </div>

          <div className="p-6">
            {/* Botón de Google */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full mb-6 flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Continuar con Google
              </span>
            </motion.button>

            {/* Separador */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  o continúa con email
                </span>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tu nombre completo"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        required={mode === 'register'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Teléfono celular
                      </label>
                      <input
                        type="tel"
                        name="cellphone"
                        value={formData.cellphone}
                        onChange={handleInputChange}
                        placeholder="Ej: 3001234567"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        required={mode === 'register'}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formato: 10 dígitos sin espacios ni guiones
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Centro gestor
                      </label>
                      <SearchableSelect
                        name="nombre_centro_gestor"
                        value={formData.nombre_centro_gestor}
                        onChange={handleInputChange}
                        options={centrosGestores}
                        placeholder="Seleccione su Centro Gestor | Organismo"
                        loading={loadingCentros}
                        required={mode === 'register'}
                        className="w-full"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu.email@cali.gov.co"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

                {/* Password Strength Indicator for Register Mode */}
              {mode === 'register' && (
                <PasswordStrengthIndicator 
                  password={formData.password}
                  requirements={{
                    minLength: AUTH_CONFIG.PASSWORD_REQUIREMENTS.MIN_LENGTH,
                    requireUppercase: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE,
                    requireLowercase: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE,
                    requireNumbers: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS,
                    requireSpecial: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL
                  }}
                />
              )}              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                        required={mode === 'register'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} strokeWidth={1.5} />
                          ) : (
                          <Eye size={16} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mensajes de validación inline para registro */}
              {mode === 'register' && formData.confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  Las contraseñas no coinciden
                </p>
              )}
              {mode === 'register' && formData.cellphone.length > 0 && !isCellphoneValid && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  El celular debe tener exactamente 10 dígitos numéricos
                </p>
              )}

              {/* Checkbox recordar y enlace olvidé contraseña */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    checked={formData.remember}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Recordar mi sesión
                  </label>
                </div>
                
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                )}
              </div>
              
              {/* Show forgot password link after failed login attempts */}
              {mode === 'login' && loginAttempts >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                    ¿Problemas para iniciar sesión?
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
                  >
                    Recuperar contraseña
                  </button>
                </motion.div>
              )}

              {/* Error */}
              <AnimatePresence>
                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                          {mode === 'login' && (state.error.includes('Usuario no encontrado') || state.error.includes('not found'))
                            ? 'Usuario no encontrado'
                            : mode === 'login' && (state.error.includes('Contraseña incorrecta') || state.error.includes('invalid password') || state.error.includes('incorrect password'))
                            ? 'Contraseña incorrecta'
                            : mode === 'register' && (state.error.toLowerCase().includes('ya existe un usuario con este email') || state.error.toLowerCase().includes('email already exists') || state.error.toLowerCase().includes('email-already-in-use'))
                            ? 'Correo ya registrado'
                            : 'Error de autenticación'
                          }
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {mode === 'login' && (state.error.includes('Usuario no encontrado') || state.error.includes('not found'))
                            ? 'El correo electrónico ingresado no está registrado en el sistema.'
                            : mode === 'login' && (state.error.includes('Contraseña incorrecta') || state.error.includes('invalid password') || state.error.includes('incorrect password'))
                            ? 'La contraseña ingresada es incorrecta. Verifique e intente nuevamente.'
                            : mode === 'register' && (state.error.toLowerCase().includes('ya existe un usuario con este email') || state.error.toLowerCase().includes('email already exists') || state.error.toLowerCase().includes('email-already-in-use'))
                            ? 'Ese correo ya tiene una cuenta. Inicia sesión o recupera la contraseña.'
                            : state.error
                          }
                        </p>
                        {/* Mostrar botón de registro para usuario no encontrado */}
                        {mode === 'login' && (state.error.includes('Usuario no encontrado') || state.error.includes('not found')) && (
                          <div className="mt-3 flex items-center space-x-2">
                            <span className="text-sm text-red-600 dark:text-red-400">¿No tienes cuenta?</span>
                            <button
                              type="button"
                              onClick={() => setMode('register')}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
                            >
                              Regístrate aquí
                            </button>
                          </div>
                        )}
                        
                        {/* Mostrar enlace de contraseña olvidada para errores de contraseña */}
                        {mode === 'login' && (state.error.includes('Contraseña incorrecta') || state.error.includes('invalid password') || state.error.includes('incorrect password')) && (
                          <div className="mt-3 flex items-center space-x-2">
                            <span className="text-sm text-red-600 dark:text-red-400">¿Olvidaste tu contraseña?</span>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
                            >
                              Recupérala aquí
                            </button>
                          </div>
                        )}

                        {mode === 'register' && (state.error.toLowerCase().includes('ya existe un usuario con este email') || state.error.toLowerCase().includes('email already exists') || state.error.toLowerCase().includes('email-already-in-use')) && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-red-600 dark:text-red-400">¿Ya tienes cuenta?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  // Conservar el email para que no tenga que re-escribirlo
                                  setMode('login')
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
                              >
                                Inicia sesión
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-red-600 dark:text-red-400">¿No recuerdas la clave?</span>
                              <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
                              >
                                Recupérala aquí
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botón submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!isFormValid || isLoading}

                className="w-full bg-[#1e3a5f] hover:bg-[#163355] text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>
                      {mode === 'login' ? 'Iniciando sesión...' : 'Registrando...'}
                    </span>
                  </div>
                ) : (
                  <span>
                    {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  </span>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 Alcaldía de Santiago de Cali
          </p>
        </motion.div>

        {/* Forgot Password Modal */}
        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
          userEmail={formData.email}
        />
      </div>
    </div>
  )
}