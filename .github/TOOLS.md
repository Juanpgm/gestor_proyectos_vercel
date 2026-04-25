# Herramientas y Restricciones — gestor_proyectos_vercel (Frontend)

---

## Comandos Permitidos

```bash
# Desarrollo
npm run dev                    # Servidor dev (puerto 3000)
npm run dev:stable             # Dev con script de estabilidad
npm run dev:production         # Dev con config de producción

# Build y verificación
npm run build                  # Build de producción (SIEMPRE verificar antes de PR)
npm run lint                   # ESLint
npx tsc --noEmit               # Type checking sin emitir archivos

# Testing
npx vitest run                 # Todos los tests
npx vitest run --reporter=verbose   # Tests con detalle
npx vitest --watch             # Watch mode (desarrollo)

# Análisis
npx next build --debug         # Build con debug
npx next info                  # Info del entorno Next.js
```

---

## Comandos Peligrosos — Requieren Confirmación

```bash
git push origin master         # Push a producción (trigger Vercel deploy)
npm run build                  # (si hay cambios en auth/proxy — verificar primero)
npx next export                # (cambia estrategia de deployment)
```

---

## Comandos PROHIBIDOS

```bash
cat .env*                      # No exponer variables de entorno
cat .env.local                 # No exponer config local
echo $NEXT_PUBLIC_*            # No exponer en logs/terminal
git push --force               # NUNCA force push a master
rm -rf .next node_modules      # Destructivo — confirmar con usuario
```

---

## Archivos NUNCA Modificar sin Revisión Explícita

| Archivo | Razón |
|---------|-------|
| `src/lib/firebase.ts` | Config Firebase SDK |
| `src/middleware.ts` | Auth middleware Next.js |
| `src/app/api/proxy/[...path]/route.ts` | CORS proxy al backend |
| `src/context/AuthContext.tsx` | Auth state global |
| `vercel.json` | Deploy config Vercel |
| `next.config.js` | Config Next.js + rewrites |
| `.gitignore` | Seguridad |

---

## Workflow de Desarrollo

```
1. npm run dev              → Verificar funcionalidad
2. npx tsc --noEmit        → Sin errores de tipos
3. npm run lint             → Sin errores ESLint
4. npx vitest run           → Tests pasan
5. npm run build            → Build production exitoso
6. git push origin master   → Deploy automático Vercel
```

---

## Variables de Entorno

```bash
# ─── Desarrollo (.env.local — gitignored) ───────────────
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# ─── Producción (Vercel Dashboard — NO en archivos) ─────
NEXT_PUBLIC_API_URL=https://<railway-service>.railway.app
# (El resto de Firebase vars iguales a dev)
```

**NUNCA** añadir el valor real de `NEXT_PUBLIC_FIREBASE_API_KEY` u otras vars en archivos commiteados.

---

## CI/CD — Vercel

- **Trigger**: Push a branch `master` de `Juanpgm/gestor_proyectos_vercel`
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Environment**: Variables configuradas en Vercel Dashboard
- **Preview**: Vercel crea preview URL automático en PRs

---

## Puertos de Desarrollo

| Servicio | Puerto | Comando |
|----------|--------|---------|
| Frontend dev | 3000 | `npm run dev` |
| Backend API | 8000 | `python main.py` (en `back/`) |
| API Docs | 8000/docs | — |
