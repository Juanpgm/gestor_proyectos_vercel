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
  API = "API_ERROR",
  /** Errores de conexión a la red */
  NETWORK = "NETWORK_ERROR",
  /** Errores por timeout en solicitudes */
  TIMEOUT = "TIMEOUT_ERROR",
  /** Errores de validación de datos */
  VALIDATION = "VALIDATION_ERROR",
  /** Errores de autenticación o autorización */
  AUTHENTICATION = "AUTH_ERROR",
  /** Errores no categorizados */
  UNKNOWN = "UNKNOWN_ERROR",
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
  code?: number,
): AppError {
  return {
    type,
    message,
    code,
    originalError,
    context,
  };
}

// Función para manejar errores de API
export function handleApiError(error: any, endpoint?: string): AppError {
  console.error(`❌ Error en API${endpoint ? ` (${endpoint})` : ""}:`, error);

  const statusCode = error?.status ?? error?.code;
  const backendDetail = error?.data?.detail;
  const backendMessage = error?.data?.message;

  const resolvedBackendMessage = (() => {
    if (typeof backendDetail === "string" && backendDetail.trim())
      return backendDetail;
    if (Array.isArray(backendDetail) && backendDetail.length > 0) {
      const first = backendDetail[0];
      if (typeof first?.msg === "string" && first.msg.trim()) return first.msg;
    }
    if (typeof backendMessage === "string" && backendMessage.trim())
      return backendMessage;
    return "";
  })();

  // Determinar el tipo de error
  if (error.name === "AbortError") {
    return createAppError(
      ErrorType.TIMEOUT,
      "La solicitud ha excedido el tiempo de espera",
      error,
      { endpoint },
    );
  }

  if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
    return createAppError(
      ErrorType.NETWORK,
      "Error de conexión a la red",
      error,
      { endpoint },
    );
  }

  if (statusCode === 401) {
    return createAppError(
      ErrorType.AUTHENTICATION,
      resolvedBackendMessage || "401: Token ausente, inválido o expirado",
      error,
      { endpoint, statusCode, backendDetail },
      statusCode,
    );
  }

  if (statusCode === 403) {
    const detailText = (resolvedBackendMessage || "").toLowerCase();
    const forbiddenMessage =
      detailText.includes("inactive") || detailText.includes("inactivo")
        ? "403: Usuario inactivo. Contacta a un super_admin."
        : detailText.includes("permission") || detailText.includes("permiso")
          ? `403: Permisos insuficientes. ${resolvedBackendMessage}`
          : resolvedBackendMessage ||
            "403: No tienes permisos para ejecutar esta operación";

    return createAppError(
      ErrorType.AUTHENTICATION,
      forbiddenMessage,
      error,
      { endpoint, statusCode, backendDetail },
      statusCode,
    );
  }

  if (statusCode === 404) {
    return createAppError(
      ErrorType.VALIDATION,
      resolvedBackendMessage ||
        "404: Recurso no encontrado (usuario no existe o endpoint inválido)",
      error,
      { endpoint, statusCode, backendDetail },
      statusCode,
    );
  }

  if (statusCode >= 400 && statusCode < 500) {
    return createAppError(
      ErrorType.VALIDATION,
      resolvedBackendMessage || "Error en la solicitud",
      error,
      { endpoint, statusCode, backendDetail },
      statusCode,
    );
  }

  if (statusCode >= 500) {
    return createAppError(
      ErrorType.API,
      resolvedBackendMessage || "Error en el servidor",
      error,
      { endpoint, statusCode, backendDetail },
      statusCode,
    );
  }

  return createAppError(
    ErrorType.UNKNOWN,
    error.message || "Error desconocido",
    error,
    { endpoint },
  );
}

// Helper to get the current Firebase auth token (client-side only).
// Waits up to 4 s for Firebase auth state to resolve if currentUser is null.
async function _getAuthTokenForFetch(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { getCurrentIdToken, auth } = await import("@/lib/firebase");
    // Fast path: token already available
    const token = await getCurrentIdToken();
    if (token) return token;

    // Slow path: Firebase hasn't resolved auth state yet.
    // Wait for the first onAuthStateChanged event (max 4 s).
    if (auth) {
      const { onAuthStateChanged } = await import("firebase/auth");
      const waitedToken = await new Promise<string | null>((resolve) => {
        const tid = setTimeout(() => resolve(null), 4000);
        const unsub = onAuthStateChanged(auth, async (user) => {
          clearTimeout(tid);
          unsub();
          if (user) {
            try {
              resolve(await user.getIdToken(false));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      if (waitedToken) return waitedToken;
    }
  } catch {}
  // Fallback: read stored session from storage
  try {
    const raw =
      localStorage.getItem("auth_session") ||
      sessionStorage.getItem("auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      const t = parsed?.user?.idToken || parsed?.user?.id_token;
      if (t) return t;
    }
  } catch {}
  return null;
}

// Función para manejar errores de fetch con timeout
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 120000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Inject auth token automatically for /api/proxy calls
  let authHeader: Record<string, string> = {};
  if (typeof url === "string" && url.startsWith("/api/proxy")) {
    const existingHeaders = (options.headers || {}) as Record<string, string>;
    if (
      !existingHeaders["Authorization"] &&
      !existingHeaders["authorization"]
    ) {
      const token = await _getAuthTokenForFetch();
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...authHeader,
        ...options.headers,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    clearTimeout(timeoutId);

    const rawResponse = await response.text().catch(() => "");
    const trimmedResponse = rawResponse?.trim?.() || "";

    const parsedResponse = (() => {
      if (!trimmedResponse) return null;
      try {
        return JSON.parse(trimmedResponse);
      } catch {
        return trimmedResponse;
      }
    })();

    if (!response.ok) {
      const errorData =
        parsedResponse && typeof parsedResponse === "object"
          ? parsedResponse
          : {
              message: typeof parsedResponse === "string" ? parsedResponse : "",
            };

      const error = new Error(
        (errorData as any).message || `HTTP Error: ${response.status}`,
      );
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }

    if (
      !trimmedResponse ||
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304
    ) {
      return {} as T;
    }

    return parsedResponse as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw handleApiError(error, url);
  }
}

/**
 * Drop-in replacement for native fetch() that automatically injects the
 * Firebase auth token for any /api/proxy/... call.
 * Use this wherever a component calls fetch('/api/proxy/...') directly.
 */
export async function proxyFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  let authHeader: Record<string, string> = {};
  const existingHeaders = (options.headers || {}) as Record<string, string>;
  if (!existingHeaders["Authorization"] && !existingHeaders["authorization"]) {
    const token = await _getAuthTokenForFetch();
    if (token) authHeader = { Authorization: `Bearer ${token}` };
  }
  return fetch(url, {
    ...options,
    headers: {
      ...authHeader,
      ...options.headers,
    },
  });
}

// Función para registrar errores (podría conectarse a un servicio de monitoreo)
export function logError(error: AppError): void {
  const { type, message, code, context } = error;
  console.error(
    `[${type}]${code ? ` (${code})` : ""}: ${message}`,
    context || "",
  );

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
          error.message || "Error desconocido",
          error,
          context,
        );
      }

      logError(appError);
      return appError;
    },
  };
}
