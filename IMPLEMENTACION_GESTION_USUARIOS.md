# 📋 Módulo de Gestión de Usuarios - Documentación de Implementación

## 🎯 Objetivo

Implementar un módulo completo de gestión de usuarios con sistema RBAC (Role-Based Access Control) que permita a super_admin administrar usuarios, roles y permisos desde el frontend.

## 📦 Componentes Creados

### 1. Sistema de Tipos (`src/types/admin.ts`)

**Propósito**: Definiciones de tipos TypeScript para todo el módulo de administración

**Contenido Principal**:

- ✅ **RoleId**: Union type con 8 roles del sistema

  - `super_admin` (nivel 0) - Acceso total
  - `admin_general` (nivel 0) - Administrador general
  - `coordinador` (nivel 1) - Coordinador de área
  - `gestor` (nivel 2) - Gestor de proyectos
  - `profesional_uc` (nivel 3) - Profesional UC
  - `auxiliar_uc` (nivel 4) - Auxiliar UC
  - `visualizador` (nivel 5) - Solo lectura
  - `publico` (nivel 6) - Acceso público limitado

- ✅ **AdminUser Interface**: Estructura completa de usuario

  ```typescript
  - uid: string
  - email: string
  - displayName: string | null
  - photoURL: string | null
  - roles: RoleId[]
  - permissions: string[]
  - centro_gestor_assigned: string | null
  - is_active: boolean
  - email_verified: boolean
  - phone: string | null
  - created_at: string
  - last_login_at: string | null
  - updated_at: string | null
  - temporary_permissions: TemporaryPermission[]
  ```

- ✅ **ROLES_CONFIG**: Configuración completa de cada rol

  - name: Nombre legible
  - level: Jerarquía (0-6)
  - permissions: Array de permisos
  - color: Color para UI
  - icon: Icono representativo
  - description: Descripción del rol

- ✅ **Interfaces de Request/Response**:

  - ListUsersRequest, ListUsersResponse
  - AssignRolesRequest
  - UpdateCentroGestorRequest
  - ToggleUserStatusRequest
  - GrantTemporaryPermissionRequest
  - ChangePasswordRequest

- ✅ **Helper Functions**:
  - `getRoleInfo(roleId)`: Obtiene configuración de un rol
  - `hasHigherAuthority(role1, role2)`: Compara autoridad entre roles
  - `getHighestRole(roles)`: Obtiene el rol de mayor jerarquía

### 2. Servicio de API (`src/services/admin.service.ts`)

**Propósito**: Capa de comunicación con el backend para operaciones de administración

**Métodos Implementados**:

#### Gestión de Usuarios

- ✅ `listUsers(params)` - GET /admin/users

  - Paginación (page, page_size)
  - Filtros (role, centro_gestor, is_active, search)
  - Ordenamiento (sort_by, sort_order)

- ✅ `getUser(uid)` - GET /auth/user/{uid}

  - Obtiene información completa de un usuario

- ✅ `deleteUser(uid, softDelete)` - DELETE /auth/user/{uid}
  - Eliminar usuario (soft delete por defecto)

#### Gestión de Roles y Permisos

- ✅ `assignRoles(uid, request)` - POST /auth/users/{uid}/roles

  - Asignar múltiples roles a un usuario
  - Requiere reason para auditoría

- ✅ `grantTemporaryPermission(uid, request)` - POST /auth/users/{uid}/temporary-permissions

  - Otorgar permisos temporales con fecha de expiración

- ✅ `listRoles()` - GET /auth/roles

  - Lista todos los roles disponibles

- ✅ `getRoleDetails(roleId)` - GET /auth/roles/{roleId}
  - Detalles completos de un rol específico

#### Gestión de Centro Gestor

- ✅ `updateCentroGestor(uid, request)` - PUT /auth/users/{uid}/centro-gestor

  - Actualizar centro gestor asignado
  - Requiere reason para auditoría

- ✅ `getCentrosGestores()` - GET /centros-gestores/nombres-unicos
  - Lista de centros gestores disponibles

#### Gestión de Estado

- ✅ `toggleUserStatus(uid, request)` - PUT /auth/users/{uid}/status

  - Activar/desactivar usuario
  - Requiere reason para auditoría

- ✅ `changePassword(request)` - POST /auth/change-password
  - Cambiar contraseña de un usuario

#### Auditoría y Estadísticas

- ✅ `listAuditLogs(params)` - GET /auth/audit-logs

  - Consulta de logs de auditoría
  - Filtros: user_uid, action, start_date, end_date

- ✅ `getSystemStats()` - GET /auth/system/stats
  - Estadísticas del sistema (usuarios totales, activos, por rol, etc.)

### 3. Componente Principal (`src/components/admin/UserManagementPage.tsx`)

**Propósito**: Contenedor principal del módulo de gestión de usuarios

**Características**:

- ✅ **Control de Acceso**:

  - Solo super_admin puede acceder
  - admin_general puede ver pero con funcionalidad limitada
  - Mensaje de "Acceso Restringido" para otros roles

- ✅ **Gestión de Estado**:

  - Lista de usuarios con paginación
  - Filtros activos (role, centro_gestor, status, search)
  - Loading states y error handling
  - Modal management (edit, role assignment, permission viewer)

- ✅ **Funcionalidades**:

  - Búsqueda por texto (nombre, email)
  - Filtro por rol
  - Filtro por centro gestor
  - Filtro por estado (activo/inactivo)
  - Exportar a CSV
  - Ver estadísticas del sistema

- ✅ **UI Components**:
  - Header con título y botones de acción
  - Barra de filtros responsiva
  - Tabla de usuarios (UserList component)
  - Modales para operaciones
  - Estados de carga y error

### 4. Componente de Lista (`src/components/admin/UserList.tsx`)

**Propósito**: Tabla de usuarios con información detallada

**Características**:

- ✅ **Visualización de Datos**:

  - Avatar/foto del usuario
  - Nombre y email
  - Teléfono
  - Roles con badges de colores
  - Centro gestor asignado
  - Estado (activo/inactivo)
  - Email verificado
  - Último login (formato español)

- ✅ **Acciones por Usuario**:

  - Ver permisos (todos los usuarios)
  - Asignar roles (si canEdit)
  - Editar usuario (si canEdit)

- ✅ **Estados Especiales**:
  - Loading state con skeleton
  - Empty state cuando no hay usuarios
  - Permisos de edición basados en canEdit prop

### 5. Modal de Edición (`src/components/admin/UserEditModal.tsx`)

**Propósito**: Editar propiedades básicas del usuario

**Funcionalidades**:

- ✅ **Actualizar Centro Gestor**:

  - Dropdown con lista de centros gestores
  - Campo de razón para auditoría
  - Validación y confirmación

- ✅ **Toggle Estado del Usuario**:

  - Activar/Desactivar usuario
  - Campo de razón obligatorio
  - Confirmación visual

- ✅ **Cambiar Contraseña**:

  - Nueva contraseña (mínimo 8 caracteres)
  - Confirmación de contraseña
  - Campo de razón para auditoría
  - Validación de coincidencia

- ✅ **UX Features**:
  - Loading states por operación
  - Mensajes de error/éxito
  - Auto-close en éxito
  - Callback onSuccess para refrescar lista
  - AnimatePresence para transiciones

### 6. Modal de Asignación de Roles (`src/components/admin/RoleAssignmentModal.tsx`)

**Propósito**: Asignar múltiples roles a un usuario

**Características**:

- ✅ **Selección de Roles**:

  - Lista completa de roles disponibles
  - Checkboxes para selección múltiple
  - Roles pre-seleccionados del usuario
  - Información visual de cada rol:
    - Icono y color distintivo
    - Nombre y nivel de jerarquía
    - Descripción del rol
    - Preview de permisos clave

- ✅ **Validación**:

  - Debe tener al menos un rol seleccionado
  - Rol "publico" deshabilitado (no asignable manualmente)
  - Contador de roles seleccionados

- ✅ **Auditoría**:
  - Campo de razón opcional pero recomendado
  - Registro de cambios para trazabilidad

### 7. Visor de Permisos (`src/components/admin/PermissionViewer.tsx`)

**Propósito**: Visualización completa de permisos efectivos de un usuario

**Secciones**:

- ✅ **Roles Asignados**:

  - Grid de cards con todos los roles
  - Color coding por rol
  - Nivel de jerarquía
  - Descripción de cada rol

- ✅ **Permisos Efectivos**:

  - Lista completa de permisos (combinación de roles)
  - Grid responsivo con badges verdes
  - Formato: `action:resource:scope`
  - Contador total de permisos

- ✅ **Permisos Temporales Activos**:

  - Destacados con color amarillo
  - Información de concesión:
    - Permiso específico
    - Razón de concesión
    - Fecha de otorgamiento
    - Fecha de expiración
  - Badge "Temporal" distintivo

- ✅ **Permisos Temporales Expirados**:
  - Sección colapsable con historial
  - Grayed out para indicar inactividad
  - Fecha de expiración visible

### 8. Integración con Navegación

#### Sidebar Actualizado (`src/components/Sidebar.tsx`)

- ✅ **Nuevo Item de Menú**:

  - "Gestionar Usuarios" con icono Users
  - Solo visible para super_admin
  - Navegación a `/admin/usuarios`

- ✅ **Control de Acceso**:
  - Prop `userRole` para verificación
  - Renderizado condicional del menu item
  - Descripción: "Administración de usuarios y roles"

#### MainLayout Actualizado (`src/components/MainLayout.tsx`)

- ✅ **Carga de Rol del Usuario**:

  - useEffect para cargar rol al montar
  - Consulta al backend via adminService
  - Obtención del rol de mayor jerarquía
  - Propagación a Sidebar component

- ✅ **Navegación Especial**:
  - Detección de sección "gestionar-usuarios"
  - Router.push a ruta dedicada
  - Mantiene otras secciones en mismo layout

#### Página Dedicada (`src/app/admin/usuarios/page.tsx`)

- ✅ **Protección de Ruta**:

  - Verificación de autenticación
  - Verificación de rol super_admin
  - Redirección automática si no autorizado

- ✅ **Carga de Datos**:

  - Obtención de información completa del usuario
  - Determinación de rol más alto
  - Obtención de centro gestor asignado

- ✅ **Renderizado**:
  - Loading state durante verificación
  - Renderizado de UserManagementPage
  - Props: currentUserRole, currentUserCentroGestor

## 🔐 Sistema de Control de Acceso

### Jerarquía de Roles

```
Nivel 0: super_admin, admin_general (acceso total)
Nivel 1: coordinador
Nivel 2: gestor
Nivel 3: profesional_uc
Nivel 4: auxiliar_uc
Nivel 5: visualizador
Nivel 6: publico
```

### Reglas de Acceso

1. ✅ Solo **super_admin** puede acceder al módulo de gestión de usuarios
2. ✅ Solo **super_admin** y **admin_general** pueden ver todos los datos
3. ✅ Otros roles solo ven datos de su **centro_gestor**
4. ✅ No se puede editar usuarios con rol de mayor o igual jerarquía
5. ✅ Todas las operaciones críticas requieren **reason** para auditoría

### Permisos Implementados

- `read:users:all` - Ver todos los usuarios
- `read:users:own_centro` - Ver usuarios del mismo centro
- `update:users:all` - Editar cualquier usuario
- `update:users:own_centro` - Editar usuarios del mismo centro
- `create:users:all` - Crear usuarios
- `delete:users:all` - Eliminar usuarios
- Y muchos más según ROLES_CONFIG

## 📊 Funcionalidades Implementadas

### ✅ CRUD de Usuarios

- [x] Listar usuarios con paginación
- [x] Ver detalles de usuario
- [x] Editar información de usuario
- [x] Eliminar usuario (soft delete)
- [x] Buscar usuarios

### ✅ Gestión de Roles

- [x] Listar roles disponibles
- [x] Asignar múltiples roles a usuario
- [x] Ver permisos de cada rol
- [x] Verificación de jerarquía

### ✅ Gestión de Permisos

- [x] Ver permisos efectivos
- [x] Otorgar permisos temporales
- [x] Ver historial de permisos temporales
- [x] Control de expiración

### ✅ Gestión de Centro Gestor

- [x] Asignar centro gestor
- [x] Filtrar por centro gestor
- [x] Listar centros gestores disponibles

### ✅ Gestión de Estado

- [x] Activar/desactivar usuarios
- [x] Filtrar por estado
- [x] Ver indicador de email verificado

### ✅ Auditoría y Seguridad

- [x] Registro de cambios (reason field)
- [x] Logs de auditoría
- [x] Estadísticas del sistema
- [x] Control de acceso por rol

### ✅ UX/UI

- [x] Dark mode support
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Animaciones (Framer Motion)
- [x] Color coding por rol
- [x] Export a CSV
- [x] Búsqueda en tiempo real

## 🔧 Tecnologías Utilizadas

- **TypeScript**: Tipado estático completo
- **React 18+**: Hooks y componentes funcionales
- **Next.js 14+**: App Router y Server Components
- **Framer Motion**: Animaciones y transiciones
- **Tailwind CSS**: Estilos utility-first con dark mode
- **lucide-react**: Iconografía
- **date-fns**: Formateo de fechas con localización española
- **Firebase Auth**: Integración con autenticación existente

## 📁 Estructura de Archivos

```
src/
├── types/
│   └── admin.ts                          # Definiciones de tipos
├── services/
│   └── admin.service.ts                  # Servicio de API
├── components/
│   ├── admin/
│   │   ├── UserManagementPage.tsx        # Página principal
│   │   ├── UserList.tsx                  # Tabla de usuarios
│   │   ├── UserEditModal.tsx             # Modal de edición
│   │   ├── RoleAssignmentModal.tsx       # Modal de roles
│   │   └── PermissionViewer.tsx          # Visor de permisos
│   ├── Sidebar.tsx                       # Sidebar actualizado
│   └── MainLayout.tsx                    # Layout actualizado
└── app/
    └── admin/
        └── usuarios/
            └── page.tsx                  # Ruta protegida
```

## 🚀 Próximos Pasos

### Para Probar

1. **Iniciar servidor de desarrollo**:

   ```bash
   npm run dev
   ```

2. **Autenticarse como super_admin**:

   - Usar credenciales de super_admin del backend
   - Verificar que aparece "Gestionar Usuarios" en el sidebar

3. **Acceder al módulo**:

   - Click en "Gestionar Usuarios"
   - Debe navegar a `/admin/usuarios`
   - Verificar que carga la lista de usuarios

4. **Probar funcionalidades**:
   - Búsqueda de usuarios
   - Filtros (rol, centro gestor, estado)
   - Ver permisos de un usuario
   - Asignar roles
   - Editar información (centro gestor, estado, contraseña)
   - Export a CSV

### Posibles Mejoras Futuras

- [ ] Agregar paginación avanzada (infinite scroll)
- [ ] Implementar filtros guardados
- [ ] Agregar gráficos de estadísticas
- [ ] Implementar bulk operations (acciones masivas)
- [ ] Agregar notificaciones push
- [ ] Implementar historial de cambios detallado
- [ ] Agregar módulo de creación de usuarios
- [ ] Implementar gestión de sesiones activas
- [ ] Agregar 2FA management

## 🐛 Troubleshooting

### Error: "Cannot find module 'date-fns'"

**Solución**: Ya instalado con `npm install date-fns`

### Error: TypeScript cache

**Solución**:

```bash
# Limpiar cache y reinstalar
npm run clean
npm install
```

### Error: "Cannot find module './UserList'"

**Solución**: Los archivos están creados, reiniciar TypeScript server en VS Code:

- Ctrl+Shift+P
- "TypeScript: Restart TS Server"

### Usuario no ve el módulo en Sidebar

**Verificar**:

1. Usuario tiene rol super_admin en backend
2. MainLayout está obteniendo el rol correctamente
3. Sidebar recibe prop userRole

## 📝 Notas de Implementación

1. **date-fns instalado**: v3.x con soporte para localización en español
2. **Todos los componentes creados**: 7 archivos principales
3. **Integración completa**: Sidebar, MainLayout, y página dedicada
4. **Control de acceso**: Solo super_admin puede acceder
5. **Auditoría**: Todos los cambios requieren reason
6. **Type-safe**: TypeScript en todo el módulo
7. **Responsive**: Diseño adaptable a mobile/tablet/desktop
8. **Dark mode**: Soporte completo para tema oscuro

## ✅ Estado del Proyecto

**COMPLETADO** ✨

Todos los archivos han sido creados y la integración está completa. El módulo está listo para pruebas en desarrollo.

---

**Fecha de Implementación**: 2024
**Versión**: 1.0.0
**Autor**: GitHub Copilot
