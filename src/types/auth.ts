import { User as FirebaseUser } from 'firebase/auth'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  provider?: string
  emailVerified?: boolean
  createdAt?: string
  lastLoginAt?: string
  // Campos de administración y roles
  roles?: string[]
  permissions?: string[]
  centro_gestor_assigned?: string | null
  is_active?: boolean
  phone?: string | null
  // Token de autenticación de Firebase
  idToken?: string | null
}

export interface AuthState {
  user: User | null
  firebaseUser: FirebaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  cellphone: string
  nombre_centro_gestor: string
}

export interface FirebaseConfig {
  projectId: string
  authDomain: string
  apiKey?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
}

export interface AuthConfig extends FirebaseConfig {
  allowRegistration?: boolean
  rememberMeEnabled?: boolean
  sessionTimeout?: number
  passwordRequirements?: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecial: boolean
  }
}