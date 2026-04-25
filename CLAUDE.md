# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CaliTrack** — Interactive dashboard for managing and visualizing public investment projects for the Municipality of Santiago de Cali. Built with Next.js 14 App Router, deployed on Vercel, backed by a separate FastAPI service.

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev:stable       # Stable dev mode
npm run fresh-start      # Full reset + start dev

# Build
npm run build            # Production build
npm run build:vercel     # Vercel-specific build
npm run preview          # Build + start locally

# Quality
npm run lint             # ESLint
npm run test             # Vitest (jsdom)
npm run test:avances-media  # Specific test for avances module
npm run type-check       # TypeScript check
npm run type-check:all   # Full TypeScript validation

# Environment
npm run setup:env        # Create .env.local from .env.example
npm run env:validate     # Validate env config

# Deploy
npm run deploy           # Deploy to Vercel production
npm run deploy:preview   # Deploy preview
```

Run a single test file:
```bash
npx vitest run src/path/to/test.file.ts
```

## Architecture

### Request Flow

All backend API calls go through the Next.js proxy at `/api/proxy/[...path]` — this handles CORS and authentication. The proxy forwards to `NEXT_PUBLIC_API_BASE_URL` (a FastAPI service). Never call the FastAPI backend directly from the client.

### State Management

Three layers:
1. **Redux** (`src/store/`) — global app state
2. **React Context** (`src/context/`) — feature state:
   - `DashboardContext` — active tab, filters, stats, refresh logic
   - `DataContext` — raw project data and search filters
   - `AuthContext` — user session, roles, centro gestor access
   - `ThemeContext` — light/dark mode
3. **Custom hooks** (`src/hooks/`) — data fetching per entity (projects, contracts, activities, etc.), each wrapping the API client with smart caching

### Map System

`UniversalMapCore` is the single base component for all map types. It supports:
- Choropleth maps (comunas, barrios, corregimientos, veredas) via `ChoroplethMapInteractive`
- Point maps (equipamientos via CircleMarkers, infraestructura vial via GeoJSON)

Leaflet must be imported dynamically (SSR-safe) — see `src/lib/leaflet-config.ts`. GeoJSON files for Cali geography live in `public/geodata/`.

### Authentication

Firebase Auth with Workload Identity Federation (WIF). `AuthWrapper` gates the entire app. Role-based access control (RBAC) is enforced via `centroGestorAccess.ts` — data is filtered per user's centro gestor.

### Performance

- `EmprestitoTabs` is lazy-loaded (heavy module)
- Smart cache (`src/utils/smartCache.ts`) with configurable TTL via env vars:
  - `NEXT_PUBLIC_UNIDADES_CACHE_TTL_MS` (default: 3600000)
  - `NEXT_PUBLIC_INTERVENCIONES_CACHE_TTL_MS`
- Debounced search filters throughout

### Key Environment Variables

```
NEXT_PUBLIC_API_BASE_URL       # FastAPI backend URL
NEXT_PUBLIC_API_URL            # Alternative API URL
NEXT_PUBLIC_FIREBASE_*         # Firebase credentials
NEXT_PUBLIC_MAPBOX_TOKEN       # Mapbox (optional)
NEXT_PUBLIC_DEFAULT_LATITUDE/LONGITUDE/ZOOM  # Map defaults
```

## Code Conventions

- **TypeScript always** — no plain `.js` in `src/`
- **Functional components + hooks** — no class components
- **English variable/function names** — comments and strings may be in Spanish (domain language)
- Path alias `@/*` maps to `src/*`
- ESLint: extends `next/core-web-vitals`; `react-hooks` rules are warnings not errors
- Tests use Vitest + Testing Library; avoid mocking the database/API layer in integration tests

## Module Map

| Area | Key files |
|------|-----------|
| Main dashboard | `src/app/page.tsx` (tabs: projects, project_units, contracts, activities, products, emprestito, procesos) |
| API proxy | `src/app/api/proxy/[...path]/route.ts` |
| API client | `src/services/api.ts`, `src/lib/api-client.ts` |
| Filters | `src/components/UnifiedFilters.tsx`, `src/hooks/useDataFilters.ts` |
| Maps | `src/components/UniversalMapCore.tsx`, `src/components/ChoroplethMapInteractive.tsx` |
| Loan module | `src/components/EmprestitoTabs.tsx` (lazy-loaded) |
| Auth | `src/context/AuthContext.tsx`, `src/services/authService.ts`, `src/utils/centroGestorAccess.ts` |
| Exports | `src/utils/pdfExporter.ts` (jsPDF), ExcelJS used in hooks directly |
