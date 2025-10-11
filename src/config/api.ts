// Configuración centralizada para URLs de API
// Este archivo utiliza variables de entorno para mantener la seguridad

export const API_ENDPOINTS = {
  // URL base del API - usando variable de entorno
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 
           process.env.NEXT_PUBLIC_API_BASE_URL || 
           'http://localhost:8000',
  
  // Endpoints específicos
  CONTRATOS_EMPRESTITO: '/contratos_emprestito_all',
  UNIDADES_PROYECTO: '/unidades-proyecto',
  ATTRIBUTES: '/unidades-proyecto/attributes',
  DASHBOARD: '/unidades-proyecto/dashboard',
  FILTERS: '/unidades-proyecto/filters',
  GEOMETRY: '/unidades-proyecto/geometry',
}

// Función helper para construir URLs completas
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_ENDPOINTS.BASE_URL
  
  // Remover barra al inicio si existe para evitar dobles barras
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  return `${baseUrl}${cleanEndpoint}`
}

// Función para obtener la URL del endpoint de contratos de empréstito
export const getContratosEmprestitoUrl = (): string => {
  return getApiUrl(API_ENDPOINTS.CONTRATOS_EMPRESTITO)
}

// Función para modo de debug (solo en desarrollo)
export const logApiConfig = (): void => {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
    console.log('🔧 API Configuration:')
    console.log('  - Base URL:', API_ENDPOINTS.BASE_URL)
    console.log('  - Environment:', process.env.NODE_ENV)
    console.log('  - Available endpoints:', Object.keys(API_ENDPOINTS).filter(key => key !== 'BASE_URL'))
  }
}