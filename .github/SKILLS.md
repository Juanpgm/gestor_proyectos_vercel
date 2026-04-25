# Skills Maestro — gestor_proyectos_vercel (Frontend)

Índice de habilidades especializadas para el frontend de CaliTrack. Análogo al `SKILLS.md` del backend.

---

## Skills Disponibles

### 1. [`nextjs-firebase-auth-skills.md`](skills/nextjs-firebase-auth-skills.md)
**Cuándo usar**: Al implementar login, logout, rutas protegidas, manejo de tokens, o cualquier lógica de autenticación en el frontend.

**Cubre**:
- Firebase Auth en App Router (Server vs Client Components)
- AuthContext pattern con `useReducer`
- Middleware de Next.js para proteger rutas
- Manejo de tokens JWT y refresh
- SSR-safe auth state

### 2. [`nextjs-api-integration-skills.md`](skills/nextjs-api-integration-skills.md)
**Cuándo usar**: Al añadir nuevos endpoints, modificar el proxy, crear nuevos service files, o sincronizar tipos con el backend.

**Cubre**:
- CORS proxy pattern `/api/proxy/[...path]`
- Services layer architecture
- Tipos TypeScript compartidos con el backend
- Error handling en servicios
- Optimistic updates con Redux

---

## Cuándo Cargar Skills

| Tarea | Skill |
|-------|-------|
| Añadir página con login/logout | `nextjs-firebase-auth-skills.md` |
| Proteger una ruta con RBAC | `nextjs-firebase-auth-skills.md` |
| Añadir llamada a endpoint nuevo | `nextjs-api-integration-skills.md` |
| Crear un service file nuevo | `nextjs-api-integration-skills.md` |
| Sincronizar tipos con backend | `nextjs-api-integration-skills.md` |
| Token handling o refresh | `nextjs-firebase-auth-skills.md` |

---

## Skills del Backend (Referencia cruzada)

Para entender el contrato de la API y los response shapes, consultar:
- `back/.github/skills/backend-frontend-contract-skills.md`
- `back/.github/skills/fastapi-firebase-api-skills.md`

---

## Vault de Conocimiento

Para contexto de dominio, arquitectura y glosario:
- `obsidian_vault/02_API_CONTRACTS/endpoints_catalog.md` — Catálogo de endpoints
- `obsidian_vault/03_DOMAIN/domain_glossary.md` — Glosario del dominio
- `obsidian_vault/04_CONTEXT/data_models.md` — Modelos de datos Firebase
