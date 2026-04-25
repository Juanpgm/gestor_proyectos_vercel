# Skill: Next.js + Firebase Auth en App Router

**Cuándo cargar**: Al implementar login, logout, rutas protegidas, manejo de tokens o cualquier lógica de autenticación en el frontend de CaliTrack.

---

## Principios de Autenticación en CaliTrack

### Flujo Completo

```
[Browser] → Firebase Auth SDK → getIdToken() → Bearer Token
     ↓
[Next.js API Route /api/proxy/] → Authorization: Bearer <token>
     ↓
[FastAPI back/] → Firebase Admin SDK → Validar token → RBAC (7 roles)
     ↓
[Respuesta] → 200 OK (datos) o 401/403 (sin acceso)
```

### Roles RBAC del Backend (referencia)
```
0: SUPERADMIN   → acceso total
1: ADMIN        → administración del sistema
2: DIRECTOR     → aprobación y supervisión
3: SUPERVISOR   → gestión operativa
4: INTERVENTOR  → reportes de intervención
5: CONTRATISTA  → carga de avances propios
6: USER         → solo lectura
```

---

## Patrones Correctos

### 1. AuthContext — Patrón Recomendado

```typescript
// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useReducer } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  role: number | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: User; token: string; role: number }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; loading: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, token: action.token, role: action.role, loading: false };
    case 'CLEAR_USER':
      return { user: null, token: null, role: null, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
  }
}

const AuthContext = createContext<{
  state: AuthState;
  getToken: () => Promise<string | null>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null, token: null, role: null, loading: true,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        // Obtener el rol del usuario desde el backend
        const roleResponse = await fetch('/api/proxy/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { role } = await roleResponse.json();
        dispatch({ type: 'SET_USER', user, token, role });
      } else {
        dispatch({ type: 'CLEAR_USER' });
      }
    });
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!state.user) return null;
    // getIdToken(true) fuerza refresh si el token expiró
    return state.user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ state, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 2. Middleware Next.js — Protección de Rutas

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/proxy'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas — no redirigir
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar cookie de sesión Firebase (httpOnly)
  const session = request.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
```

### 3. Hook useAuthenticatedFetch — Fetch con Token

```typescript
// src/hooks/useAuthenticatedFetch.ts
import { useAuth } from '@/context/AuthContext';
import { useCallback } from 'react';

export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  const fetchWithAuth = useCallback(async (
    path: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getToken();
    if (!token) throw new Error('No autenticado');

    return fetch(`/api/proxy/${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  }, [getToken]);

  return { fetchWithAuth };
}
```

---

## Antipatrones — Evitar

```typescript
// ❌ INCORRECTO — Token en localStorage (vulnerable a XSS)
localStorage.setItem('authToken', token);

// ❌ INCORRECTO — fetch directo sin proxy
fetch('https://api.railway.app/contratos', { headers: { Authorization: ... } });

// ❌ INCORRECTO — acceder a auth en Server Component
import { auth } from '@/lib/firebase'; // Firebase SDK no disponible en Server

// ❌ INCORRECTO — usar user.uid como identificador sin validar rol
if (user) showAdminPanel(); // Debe verificar el role del RBAC del backend
```

---

## Firebase Config (SSR-safe)

```typescript
// src/lib/firebase.ts — Patrón correcto
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evitar múltiples instancias en hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

---

## Testing de Autenticación

```typescript
// src/__tests__/AuthContext.test.tsx
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth, AuthProvider } from '@/context/AuthContext';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-uid', getIdToken: async () => 'mock-token' });
    return () => {};
  }),
  getAuth: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ auth: {} }));

test('AuthContext provee token y estado de usuario', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
  // assertions...
});
```

---

## Checklist de Seguridad Auth

- [ ] Token NUNCA en `localStorage` ni `sessionStorage`
- [ ] Llamadas al backend SIEMPRE a través del proxy `/api/proxy/`
- [ ] `getIdToken()` (sin forzar refresh) para requests normales
- [ ] `getIdToken(true)` para refrescar cuando el backend retorna 401
- [ ] Middleware protege todas las rutas excepto `/login` y assets estáticos
- [ ] No mostrar información de rol/permisos en el DOM (solo en lógica)
- [ ] Logout limpia todo el estado de AuthContext y Firebase
