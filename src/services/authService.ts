import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuthConfig, LoginCredentials, RegisterCredentials, User } from '@/types/auth'
import { AUTH_CONFIG } from '@/config/app'

class AuthService {
  private static instance: AuthService
  private googleProvider: GoogleAuthProvider | null = null
  private config: AuthConfig | null = null
  private isInitialized = false

  // Determinar la URL correcta basada en el entorno
  private getApiUrl(): string {
    // Log de debug para producción
    if (typeof window !== 'undefined') {
      console.log('🔧 AuthService API Config:', {
        windowOrigin: window.location.origin,
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        environment: process.env.NODE_ENV
      });
    }
    
    // SIEMPRE usar el proxy para consistencia entre entornos
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/proxy`
    }
    
    // En el servidor (SSR), usar el proxy relativo
    return '/api/proxy'
  }

  private parseApiErrorMessage(data: any, fallback: string): string {
    if (data?.detail && Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail[0]?.msg || fallback
    }

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }

    if (typeof data?.error === 'string' && data.error.trim()) {
      return data.error
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }

    return fallback
  }

  async getRegisterHealthCheck(): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/auth/register/health-check`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(this.parseApiErrorMessage(data, 'No se pudo consultar /auth/register/health-check'))
    }

    return data
  }

  async getWorkloadIdentityStatus(): Promise<any> {
    const response = await fetch(`${this.getApiUrl()}/auth/workload-identity/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(this.parseApiErrorMessage(data, 'No se pudo consultar /auth/workload-identity/status'))
    }

    return data
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
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'calitrack-44403',
        authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'calitrack-44403'}.firebaseapp.com`,
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

      // Firebase ya está inicializado en lib/firebase.ts
      // Solo inicializar Google Provider
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'fake-key-for-development') {
        try {
          this.googleProvider = new GoogleAuthProvider()
        } catch (error) {
          console.warn('Google provider disabled:', error)
        }
      }

      this.isInitialized = true
      
      // Configurar persistencia local para mantener sesión por 15 días
      if (auth) {
        try {
          await setPersistence(auth, browserLocalPersistence);
          console.log('✅ Firebase Auth persistence set to local');
        } catch (error) {
          console.warn('⚠️ Error setting persistence:', error);
        }
      }
      
      console.log('✅ AuthService initialized')
    } catch (error) {
      console.error('❌ Auth init error:', error)
    }
  }



  getAuth() {
    return auth
  }

  getConfig(): AuthConfig | null {
    return this.config
  }

  // Convertir respuesta de API a nuestro tipo User
  private mapApiUser(apiUser: any, idToken?: string): User {
    const toArray = (value: any): string[] => {
      if (Array.isArray(value)) {
        return value.filter(Boolean).map(String)
      }

      if (value && typeof value === 'object') {
        const objectEntries = Object.entries(value as Record<string, any>)
          .filter(([key, enabled]) => Boolean(key) && (enabled === true || enabled === 1 || enabled === 'true'))
          .map(([key]) => key)

        if (objectEntries.length > 0) {
          return objectEntries
        }
      }

      if (typeof value === 'string' && value.trim()) {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }

      return []
    }

    const pickFirstArray = (...candidates: any[]): string[] => {
      for (const candidate of candidates) {
        const parsed = toArray(candidate)
        if (parsed.length > 0) return parsed
      }
      return []
    }

    const normalizeRole = (role: string): string => {
      const normalized = role.trim().toLowerCase().replace(/-/g, '_')
      const aliases: Record<string, string> = {
        admin: 'admin_general',
        administrador: 'admin_general',
        admin_master: 'admin_general',
        superadmin: 'super_admin',
        super_administrador: 'super_admin',
        viewer: 'visualizador'
      }
      return aliases[normalized] || normalized
    }

    const dedupe = (items: string[]) => Array.from(new Set(items))

    const rawRoleCandidates = [
      apiUser.roles,
      apiUser.role,
      apiUser.user_role,
      apiUser.firestore_data?.roles,
      apiUser.firestore_data?.role,
      apiUser.custom_claims?.roles,
      apiUser.custom_claims?.role,
      apiUser.claims?.roles,
      apiUser.claims?.role,
      apiUser.profile?.roles,
      apiUser.profile?.role,
      apiUser.data?.roles,
      apiUser.data?.role
    ]

    const parsedRoles = pickFirstArray(...rawRoleCandidates)
    const roles = dedupe(parsedRoles.map(normalizeRole))

    const permissions = dedupe(pickFirstArray(
      apiUser.permissions,
      apiUser.permisos,
      apiUser.effective_permissions,
      apiUser.permissions_effective,
      apiUser.permission,
      apiUser.permiso,
      apiUser.firestore_data?.permissions,
      apiUser.firestore_data?.permisos,
      apiUser.firestore_data?.effective_permissions,
      apiUser.firestore_data?.permissions_effective,
      apiUser.custom_claims?.permissions,
      apiUser.custom_claims?.permisos,
      apiUser.custom_claims?.effective_permissions,
      apiUser.custom_claims?.permissions_effective,
      apiUser.claims?.permissions,
      apiUser.claims?.permisos,
      apiUser.claims?.effective_permissions,
      apiUser.claims?.permissions_effective,
      apiUser.profile?.permissions,
      apiUser.profile?.permisos,
      apiUser.profile?.effective_permissions,
      apiUser.profile?.permissions_effective,
      apiUser.data?.permissions,
      apiUser.data?.permisos,
      apiUser.data?.effective_permissions,
      apiUser.data?.permissions_effective,
      apiUser.authz?.permissions,
      apiUser.authz?.effective_permissions,
      apiUser.authorization?.permissions,
      apiUser.authorization?.effective_permissions
    ))
    
    // Extraer centro_gestor desde firestore_data o custom_claims
    const nombre_centro_gestor =
      apiUser.nombre_centro_gestor ||
      apiUser.firestore_data?.nombre_centro_gestor ||
      apiUser.custom_claims?.centro_gestor ||
      null

    const centro_gestor_assigned = 
      apiUser.centro_gestor_assigned || 
      apiUser.firestore_data?.nombre_centro_gestor ||
      apiUser.custom_claims?.centro_gestor || 
      null
    
    // Extraer is_active desde firestore_data
    const is_active = apiUser.firestore_data?.is_active !== undefined 
      ? apiUser.firestore_data.is_active 
      : (apiUser.is_active !== undefined ? apiUser.is_active : true)
    
    // Extraer teléfono
    const phone = apiUser.phone || apiUser.phone_number || apiUser.firestore_data?.cellphone || apiUser.cellphone || null
    
    console.log('🔄 Mapping API user:', {
      email: apiUser.email,
      rolesFound: roles,
      rolesSource: roles.length > 0 ? 'multi-source-normalized' : 'none',
      permissionsFound: permissions,
      hasCustomClaims: !!apiUser.custom_claims,
      hasFirestoreData: !!apiUser.firestore_data,
      apiUserKeys: Object.keys(apiUser)
    })
    
    const mappedUser = {
      uid: apiUser.uid || apiUser.id,
      email: apiUser.email,
      displayName: apiUser.display_name || apiUser.firestore_data?.full_name || apiUser.firestore_data?.fullname || apiUser.name || apiUser.displayName,
      photoURL: apiUser.photoURL || apiUser.photo_url,
      emailVerified: apiUser.email_verified || apiUser.emailVerified || false,
      provider: apiUser.provider || 'email',
      createdAt: apiUser.created_at || apiUser.createdAt || apiUser.firestore_data?.created_at || (apiUser.custom_claims?.created_at),
      lastLoginAt: apiUser.last_login_at || apiUser.lastLoginAt || apiUser.firestore_data?.last_login || apiUser.last_sign_in,
      // Roles y permisos extraídos de firestore_data
      roles: roles,
      permissions: permissions,
      nombre_centro_gestor: nombre_centro_gestor,
      centro_gestor_assigned: centro_gestor_assigned,
      is_active: is_active,
      phone: phone,
      // Token de autenticación (puede venir de la API o ser pasado explícitamente)
      idToken: idToken || apiUser.id_token || apiUser.idToken || null
    }
    
    console.log('✅ User mapped successfully:', {
      email: mappedUser.email,
      roles: mappedUser.roles,
      permissions: mappedUser.permissions,
      isSuperAdmin: mappedUser.roles.includes('super_admin'),
      hasManageUsers: mappedUser.permissions.includes('manage:users') || mappedUser.permissions.includes('*')
    })
    
    return mappedUser
  }

  // Login con email y contraseña usando Firebase Auth SDK
  async signInWithEmail({ email, password, remember = true }: LoginCredentials): Promise<User> {
    try {
      console.log('🔐 Attempting login with Firebase Auth SDK:', email)
      
      // Verificar que auth esté disponible
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado. Verifique la configuración de Firebase.')
      }
      
      // PASO 1: Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Firebase authentication successful')

      // PASO 2: Obtener ID token
      const idToken = await userCredential.user.getIdToken()
      console.log('✅ ID token obtained:', idToken.substring(0, 20) + '...')

      // PASO 3: Validar con backend y obtener roles/permisos
      const apiUrl = this.getApiUrl()
      console.log('🌐 Validating session with backend:', apiUrl)
      
      const response = await fetch(`${apiUrl}/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Validation failed')
      }

      const backendData = await response.json()
      console.log('✅ Backend validation successful:', {
        roles: backendData.user?.roles,
        permissions: backendData.user?.permissions
      })

      // PASO 4: Mapear usuario con roles y permisos del backend
      const user = this.mapApiUser(backendData.user, idToken)
      
      // Guardar sesión localmente
      this.saveSession(user, remember)
      
      console.log('✅ Login complete:', {
        email: user.email,
        roles: user.roles,
        hasToken: !!user.idToken
      })
      
      return user
    } catch (error: any) {
      console.error('❌ Login error:', error)
      
      // Mapear errores de Firebase a mensajes en español
      const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'Correo electrónico inválido',
        'auth/user-disabled': 'Usuario deshabilitado',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión',
        'auth/invalid-credential': 'Credenciales inválidas',
        'auth/api-key-not-valid': '🔧 Firebase API key inválida. Ver PROBLEMA_PANEL_ADMIN.md para configurar'
      }

      throw new Error(
        errorMessages[error.code] || error.message || 'Error de autenticación'
      )
    }
  }

  // Autenticación con WIF (Workload Identity Federation)
  private async signInWithEmailFallback({ email, password, remember = true }: LoginCredentials): Promise<User> {
    try {
      console.log('🔐 WIF: Iniciando autenticación automática...')
      
      const apiUrl = this.getApiUrl()
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Login failed')
      }

      const data = await response.json()
      
      if (!data.success || !data.user) {
        throw new Error(data.message || 'Login failed')
      }

      // WIF: El backend retorna custom_token que se convierte automáticamente a id_token
      const customToken = data.custom_token
      let idToken: string | null = null

      if (customToken && auth) {
        // WIF: Autenticación automática con renovación de token
        try {
          console.log('🔄 WIF: Convirtiendo custom_token a id_token (automático)...')
          const { authenticateWithWIF } = await import('@/lib/firebase')
          idToken = await authenticateWithWIF(customToken)
          console.log('✅ WIF: Token obtenido y configurado automáticamente')
        } catch (conversionError: any) {
          console.error('❌ WIF: Error en autenticación automática:', conversionError.message)
          throw new Error('No se pudo autenticar con Firebase. Verifica la configuración.')
        }
      } else if (!auth) {
        throw new Error('Firebase no está configurado correctamente')
      } else {
        throw new Error('El backend no retornó un custom_token válido')
      }

      const user = this.mapApiUser(data.user, idToken)
      
      // Guardar sesión localmente
      this.saveSession(user, remember)
      
      console.log('✅ WIF: Login exitoso con autenticación automática:', user.email)
      return user
    } catch (error: any) {
      console.error('❌ WIF: Error en login:', error)
      throw error
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

      // Extraer el token de la respuesta si está disponible
      const idToken = data.id_token || data.idToken || data.token || userData?.id_token
      const user = this.mapApiUser(userData, idToken)
      
      // Guardar sesión localmente después del registro exitoso
      this.saveSession(user, true)
      
      return user
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  // Login con Google usando Firebase Auth SDK
  async signInWithGoogle(remember: boolean = true): Promise<User> {
    try {
      if (!this.googleProvider) {
        throw new Error('Google Authentication no está disponible. Verifica la configuración de Firebase.')
      }

      // Verificar que auth esté disponible
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado. Verifique la configuración de Firebase.')
      }

      console.log('🔐 Iniciando Google Auth con Firebase...')

      // PASO 1: Autenticar con Google usando Firebase
      const result = await signInWithPopup(auth, this.googleProvider)
      console.log('✅ Google popup completed:', result.user?.email)

      const googleCredential = GoogleAuthProvider.credentialFromResult(result)
      const googleIdToken = googleCredential?.idToken || null
      
      // PASO 2: Obtener ID token
      const idToken = await result.user.getIdToken()
      console.log('✅ ID token obtained')

      // PASO 3: Intentar endpoint oficial /auth/google (OpenAPI)
      const apiUrl = this.getApiUrl()
      let backendData: any = null

      if (googleIdToken) {
        const formData = new URLSearchParams()
        formData.append('google_token', googleIdToken)

        const googleResponse = await fetch(`${apiUrl}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: formData.toString()
        })

        if (googleResponse.ok) {
          backendData = await googleResponse.json()
          console.log('✅ /auth/google successful')
        } else {
          const googleErrorData = await googleResponse.json().catch(() => ({}))
          console.warn('⚠️ /auth/google failed, fallback to /auth/validate-session', googleErrorData)
        }
      }

      // Fallback robusto: validar sesión con token Firebase
      if (!backendData) {
        console.log('🌐 Validating session with backend:', apiUrl)
        const response = await fetch(`${apiUrl}/auth/validate-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(this.parseApiErrorMessage(error, 'Validation failed'))
        }

        backendData = await response.json()
        console.log('✅ Backend validation successful')
      }

      // PASO 4: Mapear usuario con roles y permisos del backend
      const backendUser = backendData?.user || backendData?.data?.user || backendData?.data || backendData
      const backendToken = backendData?.id_token || backendData?.idToken || idToken
      const user = this.mapApiUser(backendUser, backendToken)
      
      // Guardar sesión localmente
      this.saveSession(user, remember)
      
      console.log('✅ Google Auth complete for:', user.email)
      return user
    } catch (error: any) {
      console.error('❌ Google login error:', error)
      
      // Manejar errores específicos de Google Auth
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Autenticación cancelada por el usuario',
        'auth/popup-blocked': 'Popup bloqueado por el navegador. Permite popups para este sitio.',
        'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
        'auth/cancelled-popup-request': 'Autenticación cancelada'
      }
      
      throw new Error(
        errorMessages[error.code] || error.message || 'Error con Google Auth'
      )
    }
  }

  // Validar sesión actual
  async validateSession(idToken?: string): Promise<User | null> {
    try {
      let token = idToken || this.getStoredToken()

      if (!token && auth?.currentUser) {
        token = await auth.currentUser.getIdToken()
      }

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

      const user = this.mapApiUser(data.user, token)
      
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
      // WIF: Cerrar sesión en Firebase (limpia automáticamente tokens)
      if (auth?.currentUser) {
        const { signOutWIF } = await import('@/lib/firebase')
        await signOutWIF()
        console.log('✅ WIF: Sesión cerrada automáticamente')
      }
      
      // Limpiar sesión local
      this.clearSession()
    } catch (error) {
      console.error('❌ WIF: Error cerrando sesión:', error)
      // Limpiar sesión local aunque haya error
      this.clearSession()
    }
  }

  // Guardar sesión en localStorage/sessionStorage
  private saveSession(user: User, remember: boolean): void {
    console.log('💾 Guardando sesión:', {
      email: user.email,
      roles: user.roles,
      rolesLength: user.roles?.length,
      permissions: user.permissions,
      hasToken: !!user.idToken,
      remember,
      storageType: remember ? 'localStorage' : 'sessionStorage'
    })
    
    const storage = remember ? localStorage : sessionStorage
    const sessionData = {
      user,
      timestamp: Date.now(),
      remember
    }
    
    storage.setItem('auth_session', JSON.stringify(sessionData))
    
    // Verificar que se guardó correctamente
    const saved = storage.getItem('auth_session')
    if (saved) {
      const parsed = JSON.parse(saved)
      console.log('✅ Sesión guardada correctamente:', {
        email: parsed.user?.email,
        roles: parsed.user?.roles,
        rolesLength: parsed.user?.roles?.length
      })
    }
    
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
      
      // Verificar expiración de sesión (15 días = 1,296,000,000 ms)
      const SESSION_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000; // 15 días
      if (parsed.timestamp && (Date.now() - parsed.timestamp) > SESSION_EXPIRY_MS) {
        console.warn('⚠️ Sesión expirada (más de 15 días) - Requiriendo nuevo login')
        this.clearSession()
        return null
      }
      
      // Validar que la sesión tenga roles
      const hasRoles = parsed.user?.roles && Array.isArray(parsed.user.roles) && parsed.user.roles.length > 0
      
      console.log('📖 Leyendo sesión guardada:', {
        email: parsed.user?.email,
        roles: parsed.user?.roles,
        rolesLength: parsed.user?.roles?.length,
        hasRoles: hasRoles,
        isValidSession: hasRoles
      })
      
      // Si la sesión no tiene roles o roles es undefined, invalidarla
      if (!hasRoles) {
        console.warn('⚠️ Sesión sin roles detectada - Se requiere nuevo login para actualizar roles')
        // NO limpiamos la sesión automáticamente para no desloguear al usuario
        // Pero marcamos que necesita actualización
      }
      
      return {
        user: parsed.user,
        remember: parsed.remember || false
      }
    } catch (error) {
      console.error('❌ Error leyendo sesión:', error)
      this.clearSession()
      return null
    }
  }

  // Obtener token almacenado
  private getStoredToken(): string | null {
    const session = this.getStoredSession()
    return (session?.user as any)?.idToken || (session?.user as any)?.id_token || null
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
      if (newPassword !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden')
      }

      const session = this.getStoredSession()
      const uid = session?.user?.uid
      if (!uid) {
        throw new Error('No se encontró sesión activa para determinar el uid del usuario')
      }

      const formData = new URLSearchParams()
      formData.append('uid', uid)
      formData.append('new_password', newPassword)

      const response = await fetch(`${this.getApiUrl()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData.toString()
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(this.parseApiErrorMessage(data, 'Error al cambiar la contraseña'))
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