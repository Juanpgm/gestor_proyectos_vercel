# Skill: Next.js API Integration — Proxy Pattern y Services Layer

**Cuándo cargar**: Al añadir nuevos endpoints, crear nuevos service files, modificar el proxy CORS, o sincronizar tipos TypeScript con el backend FastAPI.

---

## Arquitectura de Integración

```
[Componente React]
       ↓
[Service File]  ← src/services/<dominio>.service.ts
       ↓
[api-client.ts] ← src/lib/api-client.ts (instancia axios/fetch configurada)
       ↓
[Next.js Proxy] ← src/app/api/proxy/[...path]/route.ts
       ↓
[FastAPI Backend] ← Railway production | localhost:8000 dev
```

---

## Proxy CORS — Entender el Pattern

El proxy es el **único punto de contacto** entre el browser y el backend:

```typescript
// src/app/api/proxy/[...path]/route.ts
// NO modificar sin revisión — ver AGENTS.md

// El browser llama:
fetch('/api/proxy/contratos?estado=activo')

// El proxy re-envía a:
const backendUrl = process.env.NEXT_PUBLIC_API_URL; // Railway URL
fetch(`${backendUrl}/contratos?estado=activo`, {
  headers: {
    Authorization: req.headers.get('Authorization'), // Transparente
    'Content-Type': 'application/json',
  }
})
```

---

## Service Layer — Patrón Estándar

### Estructura de un Service File

```typescript
// src/services/contratos.service.ts
import { apiClient } from '@/lib/api-client';
import type { Contrato, ContratoFiltros, ContratoResponse } from '@/types/contratos';

export const contratosService = {
  /**
   * Obtiene lista de contratos con filtros opcionales
   */
  async getContratos(filtros?: ContratoFiltros): Promise<ContratoResponse> {
    const params = new URLSearchParams();
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.contratista) params.append('contratista', filtros.contratista);

    const response = await apiClient.get<ContratoResponse>(
      `/contratos${params.toString() ? `?${params}` : ''}`
    );
    return response.data;
  },

  async getContratoById(id: string): Promise<Contrato> {
    const response = await apiClient.get<Contrato>(`/contratos/${id}`);
    return response.data;
  },

  async updateContrato(id: string, data: Partial<Contrato>): Promise<Contrato> {
    const response = await apiClient.patch<Contrato>(`/contratos/${id}`, data);
    return response.data;
  },
};
```

### API Client Base

```typescript
// src/lib/api-client.ts
import { auth } from '@/lib/firebase';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<{ data: T }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/proxy/${path.replace(/^\//, '')}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new ApiError(response.status, error.detail || 'Error del servidor');
  }

  const data = await response.json();
  return { data };
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
```

---

## Tipos TypeScript — Sincronización con Backend

### Principio: los tipos siguen al schema Pydantic del backend

```typescript
// src/types/contratos.ts
// Refleja el modelo Pydantic de back/api/models/

export interface Contrato {
  id: string;
  numero_contrato: string;         // Mismo nombre que en backend
  contratista: string;
  objeto: string;
  valor_contrato: number;
  fecha_inicio: string;            // ISO 8601
  fecha_fin: string;
  estado: EstadoContrato;
  unidades_proyecto: string[];     // Array de IDs de UPs
}

export type EstadoContrato = 
  | 'activo'
  | 'suspendido'
  | 'terminado'
  | 'liquidado';

export interface ContratoFiltros {
  estado?: EstadoContrato;
  contratista?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface ContratoResponse {
  contratos: Contrato[];
  total: number;
  page: number;
  per_page: number;
}
```

### Checklist al agregar un nuevo endpoint

1. Revisar `obsidian_vault/02_API_CONTRACTS/endpoints_catalog.md` — ¿el endpoint existe?
2. Crear/actualizar tipos en `src/types/<dominio>.ts`
3. Crear/actualizar service en `src/services/<dominio>.service.ts`
4. El servicio usa `apiClient` — no `fetch` directo
5. El componente usa el service — no llama al API directamente
6. Añadir test mínimo en `src/__tests__/<dominio>.service.test.ts`

---

## Error Handling Estándar

```typescript
// En componentes — usando ApiError
import { contratosService } from '@/services/contratos.service';
import { ApiError } from '@/lib/api-client';

async function loadContratos() {
  try {
    const data = await contratosService.getContratos({ estado: 'activo' });
    setContratos(data.contratos);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        // Redirigir a login
      } else if (error.status === 403) {
        setError('No tienes permisos para ver contratos');
      } else {
        setError(`Error al cargar contratos: ${error.message}`);
      }
    }
  }
}
```

---

## Redux — Cuándo Usarlo

CaliTrack usa **Redux Toolkit** para estado global compartido y **React Context** para estado de UI:

```typescript
// ✅ Redux: datos del dominio compartidos entre múltiples componentes
// - Lista de contratos filtrada
// - Estado del mapa (capas activas, filtros geoespaciales)
// - Notificaciones globales

// ✅ Context: estado de sesión y UI
// - AuthContext: usuario, token, rol
// - DashboardContext: sidebar collapsed, theme
// - ThemeContext: dark/light mode

// ❌ No usar Redux para: estado local de formularios, modals, loading por componente
```

### Slice Redux Estándar

```typescript
// src/store/contratosSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contratosService } from '@/services/contratos.service';
import type { Contrato } from '@/types/contratos';

export const fetchContratos = createAsyncThunk(
  'contratos/fetchContratos',
  async (filtros: ContratoFiltros | undefined, { rejectWithValue }) => {
    try {
      return await contratosService.getContratos(filtros);
    } catch (error) {
      return rejectWithValue(error instanceof ApiError ? error.message : 'Error desconocido');
    }
  }
);

const contratosSlice = createSlice({
  name: 'contratos',
  initialState: {
    items: [] as Contrato[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContratos.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchContratos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.contratos;
      })
      .addCase(fetchContratos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
```

---

## Testing de Services

```typescript
// src/__tests__/contratos.service.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { contratosService } from '@/services/contratos.service';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  },
}));

describe('contratosService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getContratos llama al endpoint correcto', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { contratos: [], total: 0 } });
    await contratosService.getContratos({ estado: 'activo' });
    expect(apiClient.get).toHaveBeenCalledWith('/contratos?estado=activo');
  });
});
```
