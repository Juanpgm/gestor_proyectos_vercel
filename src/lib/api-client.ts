import { auth } from '@/lib/firebase';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  '';

/**
 * Obtener el token actual del usuario autenticado
 */
async function getCurrentIdToken(): Promise<string | null> {
  if (!auth) return null;

  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return null;
  }
}

/**
 * Renovar el token (forzar refresh)
 */
export async function refreshIdToken(): Promise<string | null> {
  if (!auth) return null;

  const user = auth.currentUser;
  if (!user) return null;

  try {
    return await user.getIdToken(true); // true = force refresh
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return null;
  }
}

/**
 * Cliente API con autenticación automática
 */
export class ApiClient {
  private static async parseResponse<T>(response: Response): Promise<T> {
    const rawText = await response.text();
    const trimmedText = rawText?.trim?.() || '';

    if (!trimmedText || response.status === 204 || response.status === 205 || response.status === 304) {
      return {} as T;
    }

    try {
      return JSON.parse(trimmedText) as T;
    } catch {
      return trimmedText as T;
    }
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Request failed');
    }

    return ApiClient.parseResponse<T>(response);
  }

  /**
   * POST request
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Request failed');
    }

    return ApiClient.parseResponse<T>(response);
  }

  /**
   * PUT request
   */
  static async put<T>(endpoint: string, data: any): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Request failed');
    }

    return ApiClient.parseResponse<T>(response);
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Request failed');
    }

    return ApiClient.parseResponse<T>(response);
  }

  /**
   * PATCH request
   */
  static async patch<T>(endpoint: string, data: any): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Request failed');
    }

    return ApiClient.parseResponse<T>(response);
  }

  /**
   * Upload file with FormData
   */
  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const idToken = await getCurrentIdToken();

    if (!idToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
        // No Content-Type header for FormData - browser sets it automatically
      },
      body: formData
    });

    if (!response.ok) {
      const error = await ApiClient.parseResponse<any>(response);
      throw new Error(error?.message || error?.detail || 'Upload failed');
    }

    return ApiClient.parseResponse<T>(response);
  }
}

/**
 * Hacer petición autenticada (helper function)
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const idToken = await getCurrentIdToken();

  if (!idToken) {
    throw new Error('No authentication token available');
  }

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

// Ejemplo de uso:
// const users = await ApiClient.get<User[]>('/auth/admin/users');
// const newUser = await ApiClient.post<User>('/auth/admin/users', userData);
// const updatedUser = await ApiClient.put<User>('/auth/admin/users/123', userData);
// await ApiClient.delete('/auth/admin/users/123');
