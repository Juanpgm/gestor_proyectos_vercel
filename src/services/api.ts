// Centralized API service to handle connections with the backend
import { fetchWithErrorHandling } from '../utils/errorHandler';

// API base URL - FastAPI backend (desde variable de entorno)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Next.js API proxy URL for better error handling and CORS
export const API_PROXY_URL = '/api/proxy';

// Timeout for API requests (30 seconds)
export const DEFAULT_TIMEOUT = 30000;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryMultiplier: 2, // Exponential backoff
};

/**
 * Enhanced API client with retry logic and better error handling
 */
export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryConfig: typeof RETRY_CONFIG;

  constructor(
    baseUrl: string = API_PROXY_URL,
    timeout: number = DEFAULT_TIMEOUT,
    retryConfig: typeof RETRY_CONFIG = RETRY_CONFIG
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryConfig = retryConfig;
  }

  /**
   * Make API request with retry logic
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useRetry: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    
    let lastError: Error = new Error('Unknown error occurred');
    let attempt = 0;
    const maxAttempts = useRetry ? this.retryConfig.maxRetries + 1 : 1;

    while (attempt < maxAttempts) {
      try {
        console.log(`🌐 API Request (attempt ${attempt + 1}/${maxAttempts}): ${url}`);
        
        const response = await fetchWithErrorHandling<T>(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
        }, this.timeout);

        console.log(`✅ API Request successful: ${url}`);
        return response;

      } catch (error: any) {
        lastError = error;
        attempt++;

        console.error(`❌ API Request failed (attempt ${attempt}/${maxAttempts}): ${url}`, error);

        // Don't retry on certain errors
        if (
          !useRetry ||
          attempt >= maxAttempts ||
          error.status === 401 || // Unauthorized
          error.status === 403 || // Forbidden
          error.status === 404 || // Not Found
          error.status >= 400 && error.status < 500 // Client errors
        ) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.retryMultiplier, attempt - 1);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, useRetry: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, useRetry);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, useRetry: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, useRetry);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, useRetry: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, useRetry);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, useRetry: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, useRetry);
  }
}

// Default API client instance
export const apiClient = new ApiClient();

// Direct FastAPI client (for cases where proxy is not needed)
export const directApiClient = new ApiClient(API_BASE_URL);

// Note: Unidades de Proyecto API calls have been removed as requested
// The Proyectos section now uses data directly from public/data/ejecucion_presupuestal