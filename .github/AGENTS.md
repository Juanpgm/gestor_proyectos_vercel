# Directrices del Frontend — gestor_proyectos_vercel

> Directrices específicas para el frontend de CaliTrack. Para reglas globales del monorepo, ver `.github/AGENTS.md` en la raíz del workspace.

---

## Stack Tecnológico

- **Framework**: Next.js 14.2 (App Router) + React 18 + TypeScript 5
- **Estilos**: Tailwind CSS 3.4 + Framer Motion + Lucide Icons
- **Mapas/GIS**: Leaflet 1.9.4 + React Leaflet + Turf.js 7.2
- **Estado Global**: Redux Toolkit + React Context
- **Formularios**: React Hook Form + Zod
- **Charts**: Recharts 2.15
- **Exports**: jsPDF + ExcelJS + html2canvas
- **Testing**: Vitest + Testing Library
- **Deploy**: Vercel (branch `master` de `Juanpgm/gestor_proyectos_vercel`)
- **Auth**: Firebase Auth SDK (client-side)

---

## Arquitectura de Carpetas

```
src/
├── app/                    # Next.js App Router (páginas y rutas API)
│   ├── api/proxy/[...path]/route.ts   # CORS proxy → FastAPI
│   ├── layout.tsx          # Root layout (MainLayout + AuthWrapper)
│   └── page.tsx            # Dashboard principal
├── components/             # Componentes React reutilizables
│   ├── ui/                 # Primitivas (buttons, modals, inputs)
│   └── [feature].tsx       # Componentes de dominio
├── services/               # Clientes HTTP por dominio
├── context/                # React Context (Auth, Dashboard, Data, Theme)
├── hooks/                  # Custom hooks
├── types/                  # TypeScript types (9+ archivos de dominio)
├── lib/                    # Utils y configuraciones (firebase.ts, api-client.ts)
├── config/                 # Configuraciones de aplicación
└── __tests__/              # Tests (vitest)
```

---

## Reglas de Código TypeScript

### Tipado
- **SIEMPRE** TypeScript, jamás `.js` en `src/`
- Sin `any` explícito — usar tipos específicos de `src/types/`
- Preferir `interface` para shapes de objetos, `type` para uniones/intersecciones
- Exportar tipos desde `src/types/` y reutilizar en components + services

### Componentes
- Solo componentes **funcionales** con hooks
- `'use client'` únicamente cuando se necesita estado del browser (`useState`, `useEffect`, event handlers)
- **Server Components** por defecto para páginas y layouts
- Props tipadas siempre: `interface ComponentProps { ... }`

### Imports
- Usar alias `@/` para imports absolutos (configurado en `tsconfig.json`)
- Orden: React → Next.js → librerías externas → `@/components` → `@/services` → `@/types` → `@/lib`

### Leaflet / Mapas
```tsx
// ✅ CORRECTO — Leaflet necesita SSR: false
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />
});

// ❌ INCORRECTO — Leaflet en Server Component rompe el build
import LeafletMap from '@/components/LeafletMap';
```

---

## Integración con Backend

### Proxy CORS (OBLIGATORIO)
```typescript
// src/app/api/proxy/[...path]/route.ts — NO modificar sin revisión
// El frontend llama:
fetch('/api/proxy/contratos')  // ← siempre relativo

// El proxy reenvía a:
// NEXT_PUBLIC_API_URL/contratos  (Railway en prod, localhost:8000 en dev)
```

### Services Layer
- Cada dominio tiene su service file en `src/services/`
- Los services usan `src/lib/api-client.ts` — no `fetch` directo
- Manejar errores con tipos específicos, no try/catch genéricos

### Variables de Entorno Frontend
```bash
NEXT_PUBLIC_API_URL=           # URL base del backend (sin trailing slash)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Auth — Firebase Client SDK

```typescript
// src/context/AuthContext.tsx — Flujo de autenticación
// 1. Usuario hace login con email/password en Firebase
// 2. Se obtiene el ID Token: await user.getIdToken()
// 3. El token se incluye en cada request al backend:
//    Authorization: Bearer <idToken>
// 4. El backend valida el token con Firebase Admin SDK

// ✅ CORRECTO
const token = await auth.currentUser?.getIdToken();

// ❌ INCORRECTO — nunca exponer en localStorage sin expiración
localStorage.setItem('token', token);
```

---

## Testing

```bash
npx vitest run               # Todos los tests
npx vitest --watch           # Watch mode
npx tsc --noEmit             # Type checking
npm run lint                 # ESLint
npm run build                # Verificar build prod
```

- Tests en `src/__tests__/` — un archivo por service o componente crítico
- Mockear Firebase SDK con `vi.mock('firebase/auth')`
- No testear estilos — testear comportamiento y lógica

---

## Performance

- Componentes pesados (ExcelJS, jsPDF, Recharts grandes) deben usar `dynamic()` con `{ ssr: false }`
- Imágenes: siempre `next/image` con `width` y `height` explícitos
- No importar librerías completas cuando se puede importar solo el módulo: `import { format } from 'date-fns'`
- Evitar `useEffect` para derivar estado — usar `useMemo`

---

## Deploy — Vercel

- **Branch de producción**: `master`
- Variables de entorno configuradas en Vercel Dashboard (no en `.env.production` para secretos)
- `.env.production` solo para overrides de valores no sensibles
- Revisar `VERCEL_ENV_SETUP.md` para el proceso completo

---

## Archivos CRÍTICOS — No modificar sin revisión

| Archivo | Razón |
|---------|-------|
| `src/lib/firebase.ts` | Config Firebase Client SDK |
| `src/middleware.ts` | Auth middleware (protege rutas) |
| `src/app/api/proxy/[...path]/route.ts` | CORS bridge to backend |
| `src/context/AuthContext.tsx` | Estado global de autenticación |
| `vercel.json` | Config de deploy Vercel |
| `next.config.js` | Config Next.js + rewrites |

---

## Skills Disponibles

Ver `front/.github/SKILLS.md` para índice completo:
- `nextjs-firebase-auth-skills.md` — Auth patterns en App Router
- `nextjs-api-integration-skills.md` — Proxy, services, tipos compartidos
