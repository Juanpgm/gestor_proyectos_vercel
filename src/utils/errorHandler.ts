/**
 * @module errorHandler
 * @description Sistema centralizado de manejo de errores para toda la aplicación
 * Proporciona funciones para manejar errores de API, red y aplicación de manera consistente
 */

/**
 * Tipos de errores que pueden ocurrir en la aplicación
 * @enum {string}
 */
export enum ErrorType {
  /** Errores relacionados con la API externa */
  API = 'API_ERROR',
  /** Errores de conexión a la red */
  NETWORK = 'NETWORK_ERROR',
  /** Errores por timeout en solicitudes */
  TIMEOUT = 'TIMEOUT_ERROR',
  /** Errores de validación de datos */
  VALIDATION = 'VALIDATION_ERROR',
  /** Errores de autenticación o autorización */
  AUTHENTICATION = 'AUTH_ERROR',
  /** Errores no categorizados */
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Interfaz para errores estructurados de la aplicación
 * @interface AppError
 */
export interface AppError {
  /** Tipo de error según la enumeración ErrorType */
  type: ErrorType;
  /** Mensaje descriptivo del error */
  message: string;
  /** Código de estado HTTP opcional */
  code?: number;
  /** Error original que causó el problema */
  originalError?: Error;
  /** Información contextual adicional sobre el error */
  context?: Record<string, any>;
}

/**
 * Crea un error estructurado para la aplicación
 * @param {ErrorType} type - Tipo de error
 * @param {string} message - Mensaje descriptivo
 * @param {Error} [originalError] - Error original que causó el problema
 * @param {Record<string, any>} [context] - Información contextual adicional
 * @param {number} [code] - Código de estado HTTP
 * @returns {AppError} Error estructurado
 */
export function createAppError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, any>,
  code?: number
): AppError {
  return {
    type,
    message,
    code,
    originalError,
    context
  };
}

// Función para manejar errores de API
export function handleApiError(error: any, endpoint?: string): AppError {
  console.error(`❌ Error en API${endpoint ? ` (${endpoint})` : ''}:`, error);
  
  // Determinar el tipo de error
  if (error.name === 'AbortError') {
    return createAppError(
      ErrorType.TIMEOUT,
      'La solicitud ha excedido el tiempo de espera',
      error,
      { endpoint }
    );
  }
  
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    return createAppError(
      ErrorType.NETWORK,
      'Error de conexión a la red',
      error,
      { endpoint }
    );
  }
  
  if (error.status === 401 || error.status === 403) {
    return createAppError(
      ErrorType.AUTHENTICATION,
      'Error de autenticación o autorización',
      error,
      { endpoint },
      error.status
    );
  }
  
  if (error.status >= 400 && error.status < 500) {
    return createAppError(
      ErrorType.VALIDATION,
      'Error en la solicitud',
      error,
      { endpoint },
      error.status
    );
  }
  
  if (error.status >= 500) {
    return createAppError(
      ErrorType.API,
      'Error en el servidor',
      error,
      { endpoint },
      error.status
    );
  }
  
  return createAppError(
    ErrorType.UNKNOWN,
    error.message || 'Error desconocido',
    error,
    { endpoint }
  );
}

// Función para manejar errores de fetch con timeout
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 120000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP Error: ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw handleApiError(error, url);
  }
}

// Función para registrar errores (podría conectarse a un servicio de monitoreo)
export function logError(error: AppError): void {
  const { type, message, code, context } = error;
  console.error(`[${type}]${code ? ` (${code})` : ''}: ${message}`, context || '');
  
  // Aquí se podría implementar el envío a un servicio de monitoreo
  // como Sentry, LogRocket, etc.
}

// Hook para manejar errores en componentes React
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: Record<string, any>): AppError => {
      let appError: AppError;
      
      if ((error as AppError).type) {
        // Ya es un AppError
        appError = error as AppError;
      } else {
        // Convertir a AppError
        appError = createAppError(
          ErrorType.UNKNOWN,
          error.message || 'Error desconocido',
          error,
          context
        );
      }
      
      logError(appError);
      return appError;
    }
  };
}