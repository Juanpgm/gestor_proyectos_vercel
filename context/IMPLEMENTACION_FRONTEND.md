# 🚀 GUÍA DE IMPLEMENTACIÓN: AUTENTICACIÓN DIRECTA EN FRONTEND

## ✅ Opción 1 Seleccionada: Frontend con Firebase Auth SDK

Esta es la solución **RECOMENDADA** y la más rápida de implementar.

### 🎯 Ventajas
- ✅ Funciona inmediatamente (sin configuración adicional en backend)
- ✅ Más seguro (Firebase maneja toda la autenticación)
- ✅ Tokens JWT automáticos
- ✅ Soporte multi-proveedor (Google, email, etc.)
- ✅ Backend solo valida y enriquece con roles/permisos

---

## 📦 Paso 1: Instalar Dependencias

```bash
npm install firebase
# o
yarn add firebase
# o
pnpm add firebase
```

---

## 🔧 Paso 2: Configuración de Firebase

### 2.1. Crear `lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase (obtener de Firebase Console)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Auth
export const auth = getAuth(app);
export default app;
```

### 2.2. Crear `.env.local`

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Nota:** Obtén estos valores desde [Firebase Console](https://console.firebase.google.com/) → Project Settings → General

---

## 🔐 Paso 3: Servicio de Autenticación

### 3.1. Crear `services/auth.service.ts`

```typescript
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Interface para la respuesta del backend
 */
interface BackendUserData {
  success: boolean;
  session_valid: boolean;
  user: {
    uid: string;
    email: string;
    display_name?: string;
    roles: string[];
    permissions: string[];
    firestore_data?: any;
  };
  token_info?: any;
  message: string;
}

/**
 * Login con email y contraseña
 */
export async function login(email: string, password: string) {
  try {
    // 1. Autenticar con Firebase
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 2. Obtener ID token
    const idToken = await userCredential.user.getIdToken();

    // 3. Validar con backend y obtener roles/permisos
    const response = await fetch(`${API_URL}/auth/validate-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Validation failed');
    }

    const backendData: BackendUserData = await response.json();

    return {
      firebaseUser: userCredential.user,
      userData: backendData.user,
      idToken,
      roles: backendData.user.roles,
      permissions: backendData.user.permissions
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Mapear errores de Firebase a mensajes en español
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión'
    };

    throw new Error(
      errorMessages[error.code] || error.message || 'Error de autenticación'
    );
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Obtener el token actual del usuario
 */
export async function getCurrentIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Renovar el token (forzar refresh)
 */
export async function refreshIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken(true); // true = force refresh
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Hacer petición autenticada al backend
 */
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
) {
  const idToken = await getCurrentIdToken();
  
  if (!idToken) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  return response;
}
```

---

## 🎣 Paso 4: Hook de Autenticación

### 4.1. Crear `hooks/useAuth.ts`

```typescript
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import * as authService from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  idToken: string | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Obtener token
          const token = await firebaseUser.getIdToken();
          setUser(firebaseUser);
          setIdToken(token);

          // Obtener datos del backend
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/validate-session`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            setUserData(data.user);
            setRoles(data.user.roles || []);
            setPermissions(data.user.permissions || []);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIdToken(null);
        setRoles([]);
        setPermissions([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.firebaseUser);
    setUserData(result.userData);
    setIdToken(result.idToken);
    setRoles(result.roles);
    setPermissions(result.permissions);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setUserData(null);
    setIdToken(null);
    setRoles([]);
    setPermissions([]);
  };

  const hasRole = (role: string) => {
    return roles.includes(role);
  };

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        idToken,
        roles,
        permissions,
        loading,
        login: handleLogin,
        logout: handleLogout,
        hasRole,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 🎨 Paso 5: Componentes de UI

### 5.1. Componente de Login

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard'); // Redirigir después del login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
          placeholder="usuario@idrd.gov.co"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### 5.2. Componente Protegido

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ 
  children,
  requiredRole,
  requiredPermission
}: { 
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}) {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        router.push('/unauthorized');
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredRole, requiredPermission, router, hasRole, hasPermission]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 🔌 Paso 6: Integrar en la App

### 6.1. En `app/layout.tsx` (o `_app.tsx`)

```typescript
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 6.2. Página de Login

```typescript
// app/login/page.tsx
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Iniciar Sesión</h2>
        <LoginForm />
      </div>
    </div>
  );
}
```

### 6.3. Página Protegida

```typescript
// app/dashboard/page.tsx
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { userData, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Bienvenido, {userData?.display_name || userData?.email}</p>
        <p>Roles: {userData?.roles?.join(', ')}</p>
        
        <button
          onClick={logout}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Cerrar Sesión
        </button>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 🌐 Paso 7: Cliente API con Autenticación

### 7.1. Crear `lib/api-client.ts`

```typescript
import { makeAuthenticatedRequest } from '@/services/auth.service';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Cliente API genérico con autenticación automática
 */
export class ApiClient {
  /**
   * GET request
   */
  static async get<T>(endpoint: string): Promise<T> {
    const response = await makeAuthenticatedRequest(`${API_URL}${endpoint}`, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * POST request
   */
  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await makeAuthenticatedRequest(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * PUT request
   */
  static async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await makeAuthenticatedRequest(`${API_URL}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  /**
   * DELETE request
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const response = await makeAuthenticatedRequest(`${API_URL}${endpoint}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }
}

// Ejemplo de uso:
// const users = await ApiClient.get<User[]>('/auth/admin/users');
```

---

## 🧪 Paso 8: Testing

### 8.1. Test de Login

```typescript
// En tu componente o página
const testLogin = async () => {
  try {
    const result = await login('test@idrd.gov.co', 'password123');
    console.log('Login exitoso:', result);
  } catch (error) {
    console.error('Login falló:', error);
  }
};
```

### 8.2. Test de API Request

```typescript
import { ApiClient } from '@/lib/api-client';

const testApiRequest = async () => {
  try {
    // Obtener usuarios (requiere permisos de admin)
    const users = await ApiClient.get('/auth/admin/users');
    console.log('Usuarios:', users);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## ✅ Checklist de Implementación

- [ ] Instalar Firebase SDK
- [ ] Configurar Firebase (`lib/firebase.ts`)
- [ ] Agregar variables de entorno (`.env.local`)
- [ ] Crear servicio de autenticación (`services/auth.service.ts`)
- [ ] Crear hook useAuth (`hooks/useAuth.ts`)
- [ ] Crear componente de Login
- [ ] Crear componente ProtectedRoute
- [ ] Integrar AuthProvider en layout
- [ ] Crear cliente API
- [ ] Probar login y logout
- [ ] Probar peticiones autenticadas

---

## 🎯 Resultado Final

Después de seguir estos pasos, tendrás:

✅ Sistema de autenticación completo  
✅ Gestión automática de tokens  
✅ Renovación automática de tokens  
✅ Protección de rutas por roles/permisos  
✅ Cliente API con autenticación incluida  
✅ Manejo de errores en español  

---

## 📝 Notas Importantes

1. **Tokens se renuevan automáticamente** - Firebase maneja esto
2. **Los tokens expiran en 1 hora** - Firebase renueva automáticamente
3. **Backend valida cada token** - Máxima seguridad
4. **Roles y permisos desde Firestore** - El backend los proporciona
5. **No necesitas Service Account en backend** - Firebase maneja la autenticación

---

## 🆘 Solución de Problemas

### Error: "Firebase not initialized"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `lib/firebase.ts` se importe correctamente

### Error: "Token invalid"
- Verifica que el backend esté corriendo
- Confirma que las credenciales de Firebase sean correctas
- Revisa que el proyecto de Firebase sea el correcto

### Error: "User not found"
- El usuario debe existir en Firebase Auth
- Verifica que el usuario tenga un documento en Firestore

---

**¡Listo!** Con esta implementación, tu frontend estará completamente integrado con el sistema de autenticación del backend. 🚀
