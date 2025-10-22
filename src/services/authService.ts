import { initializeApp, FirebaseOptions } from 'firebase/app'
import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut
} from 'firebase/auth'
import { AuthConfig, LoginCredentials, RegisterCredentials, User } from '@/types/auth'
import { API_CONFIG, FIREBASE_CONFIG, AUTH_CONFIG } from '@/config/app'

class AuthService {
  private static instance: AuthService
  private auth: any = null
  private googleProvider: GoogleAuthProvider | null = null
  private config: AuthConfig | null = null
  private isInitialized = false

  // Determinar la URL correcta basada en el entorno
  private getApiUrl(): string {
    // SIEMPRE usar el proxy para consistencia entre entornos
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/proxy`
    }
    
    // En el servidor (SSR), usar el proxy relativo
    return '/api/proxy'
  }

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Configuración simple y directa
      this.config = {
        projectId: 'unidad-cumplimiento-aa245',
        authDomain: 'unidad-cumplimiento-aa245.firebaseapp.com',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        allowRegistration: true,
        rememberMeEnabled: AUTH_CONFIG.REMEMBER_ME_ENABLED,
        sessionTimeout: AUTH_CONFIG.SESSION_TIMEOUT,
        passwordRequirements: {
          minLength: AUTH_CONFIG.PASSWORD_REQUIREMENTS.MIN_LENGTH,
          requireUppercase: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE,
          requireLowercase: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE,
          requireNumbers: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS,
          requireSpecial: AUTH_CONFIG.PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL
        }
      }

      // Firebase solo si hay credenciales
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'fake-key-for-development') {
        try {
          const app = initializeApp({
            projectId: this.config.projectId,
            authDomain: this.config.authDomain,
            apiKey: this.config.apiKey,
          })
          this.auth = getAuth(app)
          this.googleProvider = new GoogleAuthProvider()
        } catch (error) {
          console.warn('Firebase disabled:', error)
        }
      }

      this.isInitialized = true
    } catch (error) {
      console.error('Auth init error:', error)
    }
  }



  getAuth() {
    return this.auth
  }

  getConfig(): AuthConfig | null {
    return this.config
  }

  // Convertir respuesta de API a nuestro tipo User
  private mapApiUser(apiUser: any): User {
    return {
      uid: apiUser.uid || apiUser.id,
      email: apiUser.email,
      displayName: apiUser.display_name || apiUser.name || apiUser.displayName || apiUser.fullname,
      photoURL: apiUser.photoURL || apiUser.photo_url,
      emailVerified: apiUser.emailVerified || apiUser.email_verified || false,
      provider: apiUser.provider || 'email',
      createdAt: apiUser.created_at || apiUser.createdAt || (apiUser.custom_claims?.created_at),
      lastLoginAt: apiUser.last_login_at || apiUser.lastLoginAt || apiUser.last_sign_in
    }
  }

  // Login con email y contraseña usando API
  async signInWithEmail({ email, password, remember = true }: LoginCredentials): Promise<User> {
    try {
      console.log('🔐 Attempting login with email:', email)
      console.log('🌐 Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side')
      console.log('🌐 NODE_ENV:', process.env.NODE_ENV)
      console.log('🌐 APP_ENV:', process.env.NEXT_PUBLIC_APP_ENV)
      
      // Agregar timeout y manejo robusto de errores de red
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 segundos timeout
      
      const apiUrl = this.getApiUrl()
      console.log('🌐 Using API URL:', apiUrl)
      
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      // Manejar respuesta
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError)
        throw new Error('Error de comunicación con el servidor - respuesta inválida')
      }

      console.log('📄 Response data:', { success: data?.success, hasUser: !!data?.user })

      if (!response.ok) {
        // Manejar diferentes tipos de respuestas de error de la API
        let errorMessage = 'Error al iniciar sesión'
        
        if (response.status === 500) {
          // Error interno del servidor - mensaje más informativo
          errorMessage = 'Error interno del servidor. Su usuario puede tener problemas de configuración. Contacte al administrador del sistema.'
        } else if (response.status === 401) {
          // Error de autenticación
          errorMessage = data.error || data.message || 'Credenciales inválidas'
        } else if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          // Error de validación (422) - Extraer el primer mensaje de validación
          const firstError = data.detail[0]
          errorMessage = firstError?.msg || 'Error de validación'
        } else if (response.status === 0 || !response.status) {
          errorMessage = 'Error de conexión con el servidor. Verifique su conexión a internet.'
        } else if (data.error) {
          // Error estándar con campo 'error'
          errorMessage = data.error
        } else if (data.detail && typeof data.detail === 'string') {
          // Error con campo 'detail' como string
          errorMessage = data.detail
        } else if (data.message) {
          // Error con campo 'message'
          errorMessage = data.message
        }
        
        console.error('❌ Login failed:', errorMessage)
        throw new Error(errorMessage)
      }

      // Verificar si el login fue exitoso
      if (data.success === false) {
        // Manejar tanto data.error como data.message
        const errorMessage = data.error || data.message || 'Credenciales inválidas'
        throw new Error(errorMessage)
      }
      
      // Si no hay campo success pero tampoco hay user, es un error
      if (!data.user && data.success !== true) {
        const errorMessage = data.error || data.message || 'No se pudo autenticar el usuario'
        throw new Error(errorMessage)
      }

      const user = this.mapApiUser(data.user)
      
      // Guardar sesión localmente
      this.saveSession(user, remember)
      
      console.log('✅ Login successful for:', user.email)
      return user
    } catch (error) {
      console.error('❌ Login error:', error)
      
      // Manejar errores específicos de red
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado. Verifique su conexión a internet.')
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          throw new Error('Error de conexión. Verifique su conexión a internet y que el servidor esté disponible.')
        } else if (error.message?.includes('NetworkError') || error.message?.includes('network')) {
          throw new Error('Error de red. Verifique su conexión a internet.')
        }
        throw error
      }
      
      throw new Error('Error desconocido durante el login')
    }
  }

  // Registro con email y contraseña usando API
  async registerWithEmail({ name, email, password, confirmPassword, cellphone, nombre_centro_gestor }: RegisterCredentials): Promise<User> {
    try {
      const response = await fetch(`${this.getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          password,
          confirmPassword,
          name,
          cellphone,
          nombre_centro_gestor
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar diferentes tipos de respuestas de error de la API
        let errorMessage = 'Error en el registro'
        
        if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          // Error de validación (422) - Extraer el primer mensaje de validación
          const firstError = data.detail[0]
          errorMessage = firstError?.msg || 'Error de validación en los datos enviados'
        } else if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (data.detail.error) {
            errorMessage = data.detail.error
          } else if (data.detail.message) {
            errorMessage = data.detail.message
          }
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        }
        
        throw new Error(errorMessage)
      }

      // Verificar si el registro fue exitoso
      let success = data.success
      let userData = data.user

      // Si la respuesta está anidada en detail
      if (data.detail) {
        success = data.detail.success
        userData = data.detail.user
      }

      if (!success) {
        const errorMessage = userData?.error || data.error || data.message || 'Error en el registro'
        throw new Error(errorMessage)
      }

      const user = this.mapApiUser(userData)
      
      // Guardar sesión localmente después del registro exitoso
      this.saveSession(user, true)
      
      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login con Google usando API
  async signInWithGoogle(remember: boolean = true): Promise<User> {
    try {
      if (!this.auth || !this.googleProvider) {
        throw new Error('Google Authentication no está disponible. Verifica la configuración de Firebase.')
      }

      console.log('Iniciando Google Auth...')

      // Obtener credential de Google usando Firebase
      const result = await signInWithPopup(this.auth, this.googleProvider)
      console.log('Google popup completed:', result.user?.email)
      
      // Obtener el token de ID directamente del usuario
      const idToken = await result.user.getIdToken()
      
      if (!idToken) {
        throw new Error('No se pudo obtener el token de Google')
      }

      console.log('Token obtenido, enviando a API...')

      // Enviar token a nuestra API
      const apiUrl = this.getApiUrl()
      console.log('🌐 Using API URL for Google:', apiUrl)
      
      const response = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          google_token: idToken 
        })
      })

      const data = await response.json()
      console.log('API response:', data)

      if (!response.ok) {
        throw new Error(data.detail || 'Error al autenticar con Google')
      }

      if (!data.success) {
        throw new Error(data.message || 'Error en la autenticación con Google')
      }

      const user = this.mapApiUser(data.user)
      
      // Guardar sesión localmente
      this.saveSession(user, remember)
      
      console.log('Google Auth successful for:', user.email)
      return user
    } catch (error: any) {
      console.error('Google login error:', error)
      
      // Manejar errores específicos de Google Auth
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Autenticación cancelada por el usuario')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup bloqueado por el navegador. Permite popups para este sitio.')
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu conexión a internet.')
      }
      
      throw error
    }
  }

  // Validar sesión actual
  async validateSession(idToken?: string): Promise<User | null> {
    try {
      const token = idToken || this.getStoredToken()
      if (!token) return null

      const response = await fetch(`${this.getApiUrl()}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_token: token })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        this.clearSession()
        return null
      }

      const user = this.mapApiUser(data.user)
      
      // Actualizar sesión local
      this.saveSession(user, true)
      
      return user
    } catch (error) {
      console.error('Session validation error:', error)
      this.clearSession()
      return null
    }
  }

  // Cerrar sesión
  async signOut(): Promise<void> {
    try {
      // Cerrar sesión en Firebase si está activa
      if (this.auth?.currentUser) {
        await signOut(this.auth)
      }
      
      // Limpiar sesión local
      this.clearSession()
    } catch (error) {
      console.error('Sign out error:', error)
      // Limpiar sesión local aunque haya error
      this.clearSession()
    }
  }

  // Guardar sesión en localStorage/sessionStorage
  private saveSession(user: User, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage
    const sessionData = {
      user,
      timestamp: Date.now(),
      remember
    }
    
    storage.setItem('auth_session', JSON.stringify(sessionData))
    
    // Limpiar del otro storage
    const otherStorage = remember ? sessionStorage : localStorage
    otherStorage.removeItem('auth_session')
  }

  // Obtener sesión guardada (versión simplificada)
  getStoredSession(): { user: User; remember: boolean } | null {
    try {
      const data = localStorage.getItem('auth_session') || sessionStorage.getItem('auth_session')
      if (!data) return null

      const parsed = JSON.parse(data)
      return {
        user: parsed.user,
        remember: parsed.remember || false
      }
    } catch (error) {
      this.clearSession()
      return null
    }
  }

  // Obtener token almacenado
  private getStoredToken(): string | null {
    const session = this.getStoredSession()
    return session?.user?.uid || null
  }

  // Limpiar sesión
  private clearSession(): void {
    localStorage.removeItem('auth_session')
    sessionStorage.removeItem('auth_session')
  }

  // Observador de cambios de autenticación (simplificado)
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Escuchar cambios en storage (solo para cambios entre pestañas)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_session') {
        const session = this.getStoredSession()
        callback(session?.user || null)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Retornar función de cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  // Solicitar restablecimiento de contraseña
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getApiUrl()}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar errores de la misma manera que en login
        let errorMessage = 'Error al solicitar el restablecimiento'
        
        if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          const firstError = data.detail[0]
          errorMessage = firstError?.msg || 'Error de validación'
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.detail && typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (data.message) {
          errorMessage = data.message
        }
        
        throw new Error(errorMessage)
      }

      return {
        success: data.success || false,
        message: data.message || 'Se ha enviado un enlace de restablecimiento a tu correo'
      }
    } catch (error: any) {
      console.error('Password reset request error:', error)
      throw error
    }
  }

  // Cambiar contraseña
  async changePassword(email: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getApiUrl()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar errores de la misma manera que en login
        let errorMessage = 'Error al cambiar la contraseña'
        
        if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          const firstError = data.detail[0]
          errorMessage = firstError?.msg || 'Error de validación'
        } else if (data.error) {
          errorMessage = data.error
        } else if (data.detail && typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (data.message) {
          errorMessage = data.message
        }
        
        throw new Error(errorMessage)
      }

      return {
        success: data.success || false,
        message: data.message || 'Contraseña actualizada exitosamente'
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      throw error
    }
  }

  // Validar requerimientos de contraseña
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const requirements = this.config?.passwordRequirements

    if (!requirements) {
      return { isValid: true, errors: [] }
    }

    if (password.length < requirements.minLength) {
      errors.push(`La contraseña debe tener al menos ${requirements.minLength} caracteres`)
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula')
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula')
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('La contraseña debe contener al menos un número')
    }

    if (requirements.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default AuthService.getInstance()