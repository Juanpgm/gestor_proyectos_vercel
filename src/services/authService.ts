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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private extractBackendUserPayload(payload: any): any {
    if (!payload) return null
    return (
      payload.user ||
      payload.data?.user ||
      payload.detail?.user ||
      payload.detail?.data?.user ||
      payload.data ||
      payload.detail ||
      null
    )
  }

  private toBoolean(value: any, fallback: boolean = false): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
    return fallback
  }

  private getRequestId(payload: any): string | null {
    if (!payload) return null
    return (
      payload.request_id ||
      payload.requestId ||
      payload.data?.request_id ||
      payload.detail?.request_id ||
      null
    )
  }

  private hasHydratedProfile(user: User | null | undefined): boolean {
    if (!user) return false
    const hasRoles = Array.isArray(user.roles) && user.roles.length > 0
    const isSessionValid = user.session_valid === true
    const hasCentroGestor = Boolean(
      (user.nombre_centro_gestor && String(user.nombre_centro_gestor).trim()) ||
      (user.centro_gestor_assigned && String(user.centro_gestor_assigned).trim())
    )
    return hasRoles && hasCentroGestor && isSessionValid
  }

  private async validateSessionWithRetry(
    firebaseUser: FirebaseUser,
    maxAttempts: number = 2
  ): Promise<{ backendData: any; idToken: string }> {
    let lastError: any = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const idToken = await firebaseUser.getIdToken(attempt > 1)
        const response = await fetch(`${this.getApiUrl()}/auth/validate-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id_token: idToken })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(this.parseApiErrorMessage(error, 'Validation failed'))
        }

        const backendData = await response.json()
        const backendUser = this.extractBackendUserPayload(backendData)
        const requestId = this.getRequestId(backendData)
        const mappedUser = this.mapApiUser(backendUser, idToken, {
          ...backendData,
          request_id: requestId,
          session_valid: backendData?.session_valid ?? backendData?.success ?? true
        })

        console.log(`🔎 validate-session login attempt ${attempt}/${maxAttempts}`, {
          request_id: requestId,
          session_valid: mappedUser.session_valid,
          profile_complete: mappedUser.profile_complete,
          roles: mappedUser.roles
        })

        if (this.hasHydratedProfile(mappedUser)) {
          return { backendData, idToken }
        }

        const shouldRetry =
          attempt < maxAttempts &&
          (mappedUser.profile_complete === false || !this.hasHydratedProfile(mappedUser))

        if (!shouldRetry) {
          return { backendData, idToken }
        }

        const retryDelay = 300 + Math.floor(Math.random() * 401)
        console.warn(`⚠️ Perfil incompleto en intento ${attempt}/${maxAttempts}. Reintentando validación...`, {
          request_id: requestId,
          roles: mappedUser.roles,
          nombre_centro_gestor: mappedUser.nombre_centro_gestor,
          centro_gestor_assigned: mappedUser.centro_gestor_assigned,
          profile_complete: mappedUser.profile_complete,
          retry_in_ms: retryDelay
        })

        await this.delay(retryDelay)
      } catch (error: any) {
        lastError = error
        if (attempt === maxAttempts) {
          // Last resort: if Firebase auth succeeded but backend is unreachable,
          // build a minimal session from the Firebase user so login is not fully blocked.
          const isNetworkError = error?.name === 'AbortError' ||
            error?.message?.includes('Failed to fetch') ||
            error?.message?.includes('Network') ||
            error?.message?.includes('timeout') ||
            error?.message?.includes('Validation failed')
          if (isNetworkError) {
            try {
              const fallbackToken = await firebaseUser.getIdToken(false)
              console.warn('⚠️ Backend validation unreachable — using Firebase-only session fallback:', error.message)
              return {
                backendData: {
                  success: true,
                  session_valid: true,
                  user: { uid: firebaseUser.uid, email: firebaseUser.email }
                },
                idToken: fallbackToken,
              }
            } catch (tokenError) {
              // Token fetch failed too — fall through to throw
            }
          }
          break
        }
        await this.delay(300 + Math.floor(Math.random() * 401))
      }
    }

    throw lastError || new Error('No fue posible hidratar perfil completo en el primer login')
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
  private mapApiUser(apiUser: any, idToken?: string, responseMeta?: any): User {
    const safeApiUser = apiUser || {}
    const safeMeta = responseMeta || {}

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
        viewer: 'publico',
        visualizador: 'publico'
      }
      return aliases[normalized] || normalized
    }

    const dedupe = (items: string[]) => Array.from(new Set(items))

    const rawRoleCandidates = [
      safeApiUser.primary_role,
      safeApiUser.roles,
      safeApiUser.role,
      safeApiUser.user_role,
      safeApiUser.firestore_data?.roles,
      safeApiUser.firestore_data?.role,
      safeApiUser.custom_claims?.roles,
      safeApiUser.custom_claims?.role,
      safeApiUser.claims?.roles,
      safeApiUser.claims?.role,
      safeApiUser.profile?.roles,
      safeApiUser.profile?.role,
      safeApiUser.data?.roles,
      safeApiUser.data?.role,
      safeMeta.primary_role,
      safeMeta.role,
      safeMeta.roles,
      safeMeta.user?.primary_role,
      safeMeta.user?.roles,
      safeMeta.data?.primary_role,
      safeMeta.data?.roles
    ]

    const parsedRoles = pickFirstArray(...rawRoleCandidates)
    const normalizedRoles = dedupe(parsedRoles.map(normalizeRole))
    const sessionValidFlag = this.toBoolean(
      safeMeta.session_valid ?? safeApiUser.session_valid,
      false
    )

    const roles = normalizedRoles.length > 0
      ? normalizedRoles
      : (sessionValidFlag ? ['publico'] : [])

    const primaryRole = roles[0] || null

    const permissions = dedupe(pickFirstArray(
      safeApiUser.permissions,
      safeApiUser.permisos,
      safeApiUser.effective_permissions,
      safeApiUser.permissions_effective,
      safeApiUser.permission,
      safeApiUser.permiso,
      safeApiUser.firestore_data?.permissions,
      safeApiUser.firestore_data?.permisos,
      safeApiUser.firestore_data?.effective_permissions,
      safeApiUser.firestore_data?.permissions_effective,
      safeApiUser.custom_claims?.permissions,
      safeApiUser.custom_claims?.permisos,
      safeApiUser.custom_claims?.effective_permissions,
      safeApiUser.custom_claims?.permissions_effective,
      safeApiUser.claims?.permissions,
      safeApiUser.claims?.permisos,
      safeApiUser.claims?.effective_permissions,
      safeApiUser.claims?.permissions_effective,
      safeApiUser.profile?.permissions,
      safeApiUser.profile?.permisos,
      safeApiUser.profile?.effective_permissions,
      safeApiUser.profile?.permissions_effective,
      safeApiUser.data?.permissions,
      safeApiUser.data?.permisos,
      safeApiUser.data?.effective_permissions,
      safeApiUser.data?.permissions_effective,
      safeApiUser.authz?.permissions,
      safeApiUser.authz?.effective_permissions,
      safeApiUser.authorization?.permissions,
      safeApiUser.authorization?.effective_permissions,
      safeMeta.permissions,
      safeMeta.permisos,
      safeMeta.effective_permissions,
      safeMeta.permissions_effective,
      safeMeta.user?.permissions,
      safeMeta.user?.permisos,
      safeMeta.user?.effective_permissions,
      safeMeta.user?.permissions_effective,
      safeMeta.data?.permissions,
      safeMeta.data?.permisos,
      safeMeta.data?.effective_permissions,
      safeMeta.data?.permissions_effective,
      safeApiUser.authorization?.effective_permissions
    ))

    const profileComplete = this.toBoolean(
      safeMeta.profile_complete ??
      safeApiUser.profile_complete ??
      safeApiUser.profile?.profile_complete,
      true
    )

    const sessionValid = this.toBoolean(
      safeMeta.session_valid ?? safeApiUser.session_valid,
      false
    )

    const requestId =
      safeMeta.request_id ||
      safeApiUser.request_id ||
      safeApiUser.requestId ||
      null
    
    // Extraer centro_gestor desde firestore_data o custom_claims
    const nombre_centro_gestor =
      safeApiUser.nombre_centro_gestor ||
      safeApiUser.centro_gestor ||
      safeApiUser.nombre_centro ||
      safeApiUser.firestore_data?.nombre_centro_gestor ||
      safeApiUser.custom_claims?.nombre_centro_gestor ||
      safeApiUser.custom_claims?.centro_gestor ||
      safeApiUser.claims?.nombre_centro_gestor ||
      safeApiUser.claims?.centro_gestor ||
      safeApiUser.profile?.nombre_centro_gestor ||
      safeApiUser.data?.nombre_centro_gestor ||
      safeMeta?.nombre_centro_gestor ||
      safeMeta?.centro_gestor ||
      safeMeta?.user?.nombre_centro_gestor ||
      safeMeta?.user?.centro_gestor ||
      safeMeta?.data?.nombre_centro_gestor ||
      safeMeta?.data?.centro_gestor ||
      null

    const centro_gestor_assigned = 
      safeApiUser.centro_gestor_assigned || 
      safeApiUser.centro_gestor ||
      safeApiUser.firestore_data?.nombre_centro_gestor ||
      safeApiUser.custom_claims?.nombre_centro_gestor ||
      safeApiUser.custom_claims?.centro_gestor || 
      safeApiUser.claims?.nombre_centro_gestor ||
      safeApiUser.claims?.centro_gestor ||
      safeMeta?.centro_gestor_assigned ||
      safeMeta?.centro_gestor ||
      safeMeta?.nombre_centro_gestor ||
      safeMeta?.user?.centro_gestor_assigned ||
      safeMeta?.user?.centro_gestor ||
      safeMeta?.user?.nombre_centro_gestor ||
      safeMeta?.data?.centro_gestor_assigned ||
      safeMeta?.data?.centro_gestor ||
      safeMeta?.data?.nombre_centro_gestor ||
      null
    
    // Extraer is_active desde firestore_data
    const is_active = safeApiUser.firestore_data?.is_active !== undefined 
      ? safeApiUser.firestore_data.is_active 
      : (safeApiUser.is_active !== undefined ? safeApiUser.is_active : true)
    
    // Extraer teléfono
    const phone = safeApiUser.phone || safeApiUser.phone_number || safeApiUser.firestore_data?.cellphone || safeApiUser.cellphone || null
    
    console.log('🔄 Mapping API user:', {
      email: safeApiUser.email,
      rolesFound: roles,
      rolesSource: roles.length > 0 ? 'multi-source-normalized' : 'none',
      permissionsFound: permissions,
      hasCustomClaims: !!safeApiUser.custom_claims,
      hasFirestoreData: !!safeApiUser.firestore_data,
      request_id: requestId,
      profile_complete: profileComplete,
      session_valid: sessionValid,
      apiUserKeys: Object.keys(safeApiUser)
    })
    
    const mappedUser = {
      uid: safeApiUser.uid || safeApiUser.id,
      email: safeApiUser.email,
      displayName: safeApiUser.display_name || safeApiUser.firestore_data?.full_name || safeApiUser.firestore_data?.fullname || safeApiUser.name || safeApiUser.displayName,
      photoURL: safeApiUser.photoURL || safeApiUser.photo_url,
      emailVerified: safeApiUser.email_verified || safeApiUser.emailVerified || false,
      provider: safeApiUser.provider || 'email',
      createdAt: safeApiUser.created_at || safeApiUser.createdAt || safeApiUser.firestore_data?.created_at || (safeApiUser.custom_claims?.created_at),
      lastLoginAt: safeApiUser.last_login_at || safeApiUser.lastLoginAt || safeApiUser.firestore_data?.last_login || safeApiUser.last_sign_in,
      // Roles y permisos extraídos de firestore_data
      roles: roles,
      primary_role: primaryRole,
      permissions: permissions,
      nombre_centro_gestor: nombre_centro_gestor,
      centro_gestor_assigned: centro_gestor_assigned,
      is_active: is_active,
      phone: phone,
      profile_complete: profileComplete,
      session_valid: sessionValid,
      request_id: requestId,
      // Token de autenticación (puede venir de la API o ser pasado explícitamente)
      idToken: idToken || safeApiUser.id_token || safeApiUser.idToken || null
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
      const idToken = await userCredential.user.getIdToken(true)
      console.log('✅ ID token obtained:', idToken.substring(0, 20) + '...')

      // PASO 3: Validar con backend y obtener roles/permisos
      const { backendData, idToken: hydratedToken } = await this.validateSessionWithRetry(userCredential.user)
      console.log('✅ Backend validation successful:', {
        roles: this.extractBackendUserPayload(backendData)?.roles,
        permissions: this.extractBackendUserPayload(backendData)?.permissions
      })

      // PASO 4: Mapear usuario con roles y permisos del backend
      const user = this.mapApiUser(this.extractBackendUserPayload(backendData), hydratedToken, {
        ...backendData,
        request_id: this.getRequestId(backendData),
        session_valid: backendData?.session_valid ?? backendData?.success ?? true
      })
      
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
      // Limpiar cualquier sesión/estado stale de Firebase Auth antes de registrar
      // Esto evita conflictos con sesiones previas (ej: usuario parcialmente registrado)
      this.clearSession()
      if (auth?.currentUser) {
        try {
          await firebaseSignOut(auth)
          console.log('🧹 Sesión Firebase previa limpiada antes de registro')
        } catch (signOutError) {
          console.warn('⚠️ Error limpiando sesión Firebase previa:', signOutError)
        }
      }

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

        // Normalizar códigos de error de Firebase Auth a mensajes amigables
        if (errorMessage.includes('EMAIL_EXISTS') || errorMessage.includes('email-already-in-use')) {
          errorMessage = 'Ya existe un usuario con este email'
        }
        
        throw new Error(errorMessage)
      }

      // Verificar si el registro fue exitoso
      let success = data.success
      let userData = data.user
      let requestId = this.getRequestId(data)

      // Si la respuesta está anidada en detail
      if (data.detail) {
        success = data.detail.success
        userData = data.detail.user
        requestId = requestId || this.getRequestId(data.detail)
      }

      if (!success) {
        const errorMessage = userData?.error || data.error || data.message || 'Error en el registro'
        throw new Error(errorMessage)
      }

      // Extraer el token de la respuesta si está disponible
      let idToken = data.id_token || data.idToken || data.token || userData?.id_token || data.detail?.id_token || data.detail?.token

      if (!idToken && auth?.currentUser) {
        idToken = await auth.currentUser.getIdToken(true)
      }

      let user = this.mapApiUser(userData, idToken, {
        ...data,
        request_id: requestId,
        session_valid: data?.session_valid ?? data?.success ?? true
      })

      if (idToken) {
        const validatedUser = await this.validateSession(idToken)
        if (validatedUser) {
          user = validatedUser
        }
      }

      console.log('🧾 register response correlation:', {
        request_id: requestId,
        session_valid: user.session_valid,
        profile_complete: user.profile_complete,
        primary_role: user.primary_role,
        roles: user.roles
      })
      
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
      const user = this.mapApiUser(backendUser, backendToken, {
        ...backendData,
        request_id: this.getRequestId(backendData),
        session_valid: backendData?.session_valid ?? backendData?.success ?? true
      })
      
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

      for (let attempt = 1; attempt <= 2; attempt++) {
        const response = await fetch(`${this.getApiUrl()}/auth/validate-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ id_token: token })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (attempt === 2) {
            this.clearSession()
            return null
          }
          await this.delay(300 + Math.floor(Math.random() * 401))
          continue
        }

        const backendUser = this.extractBackendUserPayload(data)
        const requestId = this.getRequestId(data)
        const user = this.mapApiUser(backendUser, token, {
          ...data,
          request_id: requestId,
          session_valid: data?.session_valid ?? data?.success ?? true
        })

        console.log(`🔎 validate-session check attempt ${attempt}/2`, {
          request_id: requestId,
          session_valid: user.session_valid,
          profile_complete: user.profile_complete,
          primary_role: user.primary_role,
          roles: user.roles
        })

        if (user.profile_complete === false && attempt === 1) {
          await this.delay(300 + Math.floor(Math.random() * 401))
          if (!idToken && auth?.currentUser) {
            token = await auth.currentUser.getIdToken(true)
          }
          continue
        }

        if (user.session_valid !== true) {
          this.clearSession()
          return null
        }

        this.saveSession(user, true)
        return user
      }

      this.clearSession()
      return null
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
      const hasSessionValid = parsed.user?.session_valid === true
      
      console.log('📖 Leyendo sesión guardada:', {
        email: parsed.user?.email,
        roles: parsed.user?.roles,
        rolesLength: parsed.user?.roles?.length,
        hasRoles: hasRoles,
        session_valid: parsed.user?.session_valid,
        isValidSession: hasRoles && hasSessionValid
      })
      
      // Si la sesión no tiene roles o roles es undefined, invalidarla
      if (!hasRoles || !hasSessionValid) {
        console.warn('⚠️ Sesión incompleta detectada - Se requiere revalidación contra backend')
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

  // Solicitar restablecimiento de contraseña via Firebase Auth
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth')
      const { auth } = await import('@/lib/firebase')
      if (!auth) {
        throw new Error('Firebase no está configurado. Contacta al administrador del sistema.')
      }
      await sendPasswordResetEmail(auth, email)
      return {
        success: true,
        message: 'Se ha enviado un enlace de restablecimiento a tu correo'
      }
    } catch (error: any) {
      console.error('Password reset request error:', error)
      const code = error?.code || ''
      if (code === 'auth/user-not-found') {
        throw new Error('No existe una cuenta registrada con este correo electrónico.')
      } else if (code === 'auth/invalid-email') {
        throw new Error('El correo electrónico ingresado no es válido.')
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Demasiados intentos. Espera unos minutos antes de intentar nuevamente.')
      }
      throw new Error('Error al enviar el correo de recuperación. Intenta nuevamente.')
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