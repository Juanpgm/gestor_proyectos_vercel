// Configuración centralizada para URLs de API
// Este archivo utiliza variables de entorno para mantener la seguridad
import { safeConsole } from "@/lib/safe-console";

export const API_ENDPOINTS = {
  // URL base del API - NEXT_PUBLIC_API_BASE_URL es la variable canónica
  BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000",

  // Endpoints específicos
  UNIDADES_PROYECTO: "/unidades-proyecto",
  ATTRIBUTES: "/unidades-proyecto/attributes",
  FILTERS: "/unidades-proyecto/filters",
  GEOMETRY: "/unidades-proyecto/geometry",
};

// Función helper para construir URLs completas
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_ENDPOINTS.BASE_URL;

  // Remover barra al inicio si existe para evitar dobles barras
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${baseUrl}${cleanEndpoint}`;
};

// Función para modo de debug (solo en desarrollo)
export const logApiConfig = (): void => {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DEBUG_MODE === "true"
  ) {
    safeConsole.log("API Configuration:");
    safeConsole.log("  - Base URL:", API_ENDPOINTS.BASE_URL);
    safeConsole.log("  - Environment:", process.env.NODE_ENV);
    safeConsole.log(
      "  - Available endpoints:",
      Object.keys(API_ENDPOINTS).filter((key) => key !== "BASE_URL"),
    );
  }
};
