/**
 * Configuración segura de la aplicación
 * Solo contiene valores no sensibles y valida variables de entorno
 */

// Validar variables de entorno requeridas
const requiredEnvVars = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
} as const

// Función para validar configuración en desarrollo
export function validateEnvironmentConfig() {
  const missing: string[] = []
  
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(`NEXT_PUBLIC_${key}`)
    }
  })

  if (missing.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  Missing environment variables:\n' + 
      missing.map(key => `   - ${key}`).join('\n') +
      '\n\nPlease check your .env.local file.'
    )
  }

  return missing.length === 0
}

// Configuración de API
export const API_CONFIG = {
  BASE_URL: requiredEnvVars.API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

// Configuración de Firebase (solo metadatos públicos)
export const FIREBASE_CONFIG = {
  PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Dashboard Alcaldía Cali',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  DEBUG: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
} as const

// Configuración de mapas
export const MAPS_CONFIG = {
  DEFAULT_CENTER: {
    lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LATITUDE || '3.4516'),
    lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LONGITUDE || '-76.5320'),
  },
  DEFAULT_ZOOM: parseInt(process.env.NEXT_PUBLIC_DEFAULT_ZOOM || '11'),
  TILE_SERVER: process.env.NEXT_PUBLIC_TILE_SERVER || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
} as const

// Configuración de autenticación
export const AUTH_CONFIG = {
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
  REMEMBER_ME_ENABLED: true,
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL: true,
  },
} as const

// Validar configuración al importar en desarrollo
if (process.env.NODE_ENV === 'development') {
  validateEnvironmentConfig()
}