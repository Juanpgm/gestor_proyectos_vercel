# Guía de Uso: Sistema de Roles y Permisos

## 🎯 Respuesta Directa

### **"¿En este momento la app puede identificar el rol y permisos del usuario logueado?"**

# ✅ SÍ

La aplicación **ahora puede identificar completamente** el rol y permisos de cualquier usuario autenticado.

---

## 📖 Cómo Funciona

### 1. Durante el Login

Cuando un usuario inicia sesión:

```typescript
// El usuario ingresa email y password
authService.signInWithEmail({ email, password })

// ↓ Backend responde con datos completos:
{
  "success": true,
  "user": {
    "uid": "abc123",
    "email": "admin@example.com",
    "display_name": "Admin User",
    "roles": ["super_admin"],              // ← ROLES INCLUIDOS
    "permissions": [                       // ← PERMISOS INCLUIDOS
      "users.view",
      "users.create",
      "users.edit",
      "users.delete",
      "users.assign_roles"
    ],
    "centro_gestor_assigned": null,
    "is_active": true
  }
}

// ↓ authService.mapApiUser() extrae AUTOMÁTICAMENTE:
// - roles
// - permissions
// - centro_gestor_assigned
// - is_active

// ↓ AuthContext almacena el User completo con roles
```

### 2. Verificación en Componentes

Cualquier componente puede verificar roles inmediatamente:

```typescript
import { useAuth } from "@/context/AuthContext";

function MiComponente() {
  const { state, isSuperAdmin, hasRole, hasPermission } = useAuth();

  // ✅ Ver roles del usuario
  console.log(state.user?.roles);
  // Output: ["super_admin"]

  // ✅ Ver permisos del usuario
  console.log(state.user?.permissions);
  // Output: ["users.view", "users.create", ...]

  // ✅ Verificar si es super admin
  if (isSuperAdmin()) {
    console.log("Usuario es super_admin");
  }

  // ✅ Verificar rol específico
  if (hasRole("gestor_master")) {
    console.log("Usuario tiene rol gestor_master");
  }

  // ✅ Verificar permiso específico
  if (hasPermission("projects.edit")) {
    console.log("Usuario puede editar proyectos");
  }
}
```

---

## 🔧 API Disponible en useAuth()

### Propiedades del Estado

```typescript
const { state } = useAuth()

// Usuario completo con roles y permisos
state.user
  ↳ uid: string
  ↳ email: string
  ↳ displayName: string
  ↳ roles: string[]              // ← Todos los roles del usuario
  ↳ permissions: string[]        // ← Todos los permisos del usuario
  ↳ centro_gestor_assigned: string | null
  ↳ is_active: boolean

// Estado de autenticación
state.isAuthenticated: boolean   // ¿Está logueado?
state.isLoading: boolean         // ¿Está cargando?
state.error: string | null       // ¿Hay algún error?
```

### Métodos Helper

```typescript
const {
  hasRole,
  hasPermission,
  getHighestRole,
  isSuperAdmin
} = useAuth()

// 1. Verificar si tiene un rol específico
hasRole('super_admin') → true/false
hasRole('gestor') → true/false

// 2. Verificar si tiene un permiso específico
hasPermission('users.edit') → true/false
hasPermission('projects.create') → true/false

// 3. Obtener el rol principal (más alto en jerarquía)
getHighestRole() → 'super_admin' | 'admin' | 'gestor_master' | ...

// 4. Verificar si es super admin (atajo)
isSuperAdmin() → true/false
```

---

## 💡 Ejemplos de Uso Real

### Ejemplo 1: Mostrar/Ocultar Botones según Rol

```typescript
"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";

export default function Dashboard() {
  const { isSuperAdmin, hasPermission } = useAuth();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Solo super_admin ve este botón */}
      {isSuperAdmin() && (
        <Button onClick={() => router.push("/admin/usuarios")}>
          Gestionar Usuarios
        </Button>
      )}

      {/* Cualquiera con permiso 'reports.create' lo ve */}
      {hasPermission("reports.create") && (
        <Button onClick={() => router.push("/reportes/nuevo")}>
          Crear Reporte
        </Button>
      )}
    </div>
  );
}
```

### Ejemplo 2: Proteger Ruta Completa

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { state, isSuperAdmin } = useAuth();

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!state.isAuthenticated) {
      router.push("/");
      return;
    }

    // Si no es super_admin, redirigir al dashboard
    if (!isSuperAdmin()) {
      router.push("/dashboard");
      return;
    }
  }, [state.isAuthenticated, isSuperAdmin, router]);

  // No renderizar hasta verificar permisos
  if (!state.isAuthenticated || !isSuperAdmin()) {
    return null;
  }

  // Usuario autorizado, mostrar contenido
  return (
    <div>
      <h1>Panel de Administración</h1>
      {/* Contenido solo para super_admin */}
    </div>
  );
}
```

### Ejemplo 3: Deshabilitar Funciones según Permisos

```typescript
"use client";

import { useAuth } from "@/context/AuthContext";

export default function UserTable() {
  const { hasPermission } = useAuth();

  const canEdit = hasPermission("users.edit");
  const canDelete = hasPermission("users.delete");

  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.uid}>
            <td>{user.displayName}</td>
            <td>{user.email}</td>
            <td>
              <button onClick={() => viewUser(user)}>Ver</button>

              <button
                onClick={() => editUser(user)}
                disabled={!canEdit} // ← Deshabilitado si no tiene permiso
              >
                Editar
              </button>

              <button
                onClick={() => deleteUser(user)}
                disabled={!canDelete} // ← Deshabilitado si no tiene permiso
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Ejemplo 4: Renderizado Condicional Complejo

```typescript
"use client";

import { useAuth } from "@/context/AuthContext";

export default function ProjectDetail({ project }) {
  const { state, hasRole, hasPermission, getHighestRole } = useAuth();

  const userRole = getHighestRole();
  const canEdit = hasPermission("projects.edit");
  const canApprove = hasRole("gestor_master") || hasRole("super_admin");
  const isOwner = project.owner_uid === state.user?.uid;

  return (
    <div>
      <h1>{project.name}</h1>

      {/* Información básica - todos la ven */}
      <div className="info">
        <p>Estado: {project.status}</p>
        <p>Presupuesto: {project.budget}</p>
      </div>

      {/* Botón de edición - solo con permiso o si es dueño */}
      {(canEdit || isOwner) && (
        <button onClick={() => editProject(project)}>Editar Proyecto</button>
      )}

      {/* Botón de aprobación - solo gestores master+ */}
      {canApprove && project.status === "pending" && (
        <button onClick={() => approveProject(project)}>
          Aprobar Proyecto
        </button>
      )}

      {/* Información sensible - solo super_admin */}
      {userRole === "super_admin" && (
        <div className="sensitive-info">
          <h3>Información Administrativa</h3>
          <p>Usuario creador: {project.created_by}</p>
          <p>Historial de cambios: ...</p>
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 5: Sidebar con Módulos Condicionales

```typescript
"use client";

import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { isSuperAdmin, hasPermission, hasRole } = useAuth();

  const menuItems = [
    // Todos ven el dashboard
    { id: "dashboard", label: "Dashboard", icon: Home },

    // Solo con permiso 'projects.view'
    ...(hasPermission("projects.view")
      ? [
          {
            id: "proyectos",
            label: "Proyectos",
            icon: FileText,
          },
        ]
      : []),

    // Solo gestores y superiores
    ...(hasRole("gestor") || hasRole("gestor_master") || hasRole("admin")
      ? [
          {
            id: "contratos",
            label: "Contratos",
            icon: FileText,
          },
        ]
      : []),

    // Solo super_admin
    ...(isSuperAdmin()
      ? [
          {
            id: "gestionar-usuarios",
            label: "Gestionar Usuarios",
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <nav>
      {menuItems.map((item) => (
        <a key={item.id} href={`/${item.id}`}>
          <item.icon />
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

---

## 🔐 Jerarquía de Roles

```
super_admin (Nivel 0)
    ↓ Todos los permisos
admin (Nivel 1)
    ↓ Gestión de centro gestor
gestor_master (Nivel 2)
    ↓ Gestión completa de proyectos
gestor (Nivel 3)
    ↓ Gestión limitada
consultor_master (Nivel 4)
    ↓ Consulta avanzada
consultor (Nivel 5)
    ↓ Consulta básica
publico (Nivel 6)
    ↓ Solo lectura
```

---

## 🧪 Cómo Probarlo

### 1. Inspeccionar en Consola del Navegador

```javascript
// Después de hacer login, en la consola:

// Ver datos del usuario
JSON.parse(localStorage.getItem('auth_session')).user

// Debería mostrar:
{
  uid: "...",
  email: "admin@example.com",
  displayName: "Admin User",
  roles: ["super_admin"],
  permissions: ["users.view", "users.create", ...],
  centro_gestor_assigned: null,
  is_active: true
}
```

### 2. Agregar Logs Temporales

```typescript
import { useAuth } from "@/context/AuthContext";

function MiComponente() {
  const { state, isSuperAdmin } = useAuth();

  // Debug logs
  console.log("👤 Usuario:", state.user?.email);
  console.log("🎭 Roles:", state.user?.roles);
  console.log("🔑 Permisos:", state.user?.permissions);
  console.log("⭐ Es super admin?", isSuperAdmin());

  return <div>...</div>;
}
```

### 3. Verificar en React DevTools

1. Instalar React DevTools en el navegador
2. Abrir la pestaña Components
3. Buscar `AuthProvider`
4. Ver el valor de `state.user` en el hook

---

## ⚡ Ventajas de Este Sistema

### ✅ **1. Sin Llamadas API Redundantes**

- Los roles vienen en el login
- No necesitas llamar `adminService.getUser()` cada vez

### ✅ **2. Performance Óptima**

- Roles almacenados en memoria
- Verificación instantánea
- Sin delays ni race conditions

### ✅ **3. Fácil de Usar**

```typescript
// Antes (COMPLICADO):
const [userRole, setUserRole] = useState(null)
useEffect(() => {
  adminService.getUser(uid).then(user => {
    setUserRole(getHighestRole(user.roles))
  })
}, [uid])

// Ahora (SIMPLE):
const { isSuperAdmin } = useAuth()
if (isSuperAdmin()) { ... }
```

### ✅ **4. Type-Safe**

- Todo con TypeScript
- Autocompletado de roles
- Errores en tiempo de desarrollo

### ✅ **5. Centralizado**

- Una sola fuente de verdad
- Fácil de mantener
- Consistente en toda la app

---

## 🎉 Resumen Final

### La app puede identificar roles y permisos porque:

1. ✅ El backend incluye roles en `/auth/login`
2. ✅ `authService` extrae y almacena roles automáticamente
3. ✅ `AuthContext` expone helpers para verificación
4. ✅ Cualquier componente puede usar `useAuth()` para acceder
5. ✅ No requiere llamadas API adicionales
6. ✅ Funciona desde el primer render después del login

### Para usar en cualquier componente:

```typescript
import { useAuth } from "@/context/AuthContext";

const {
  state, // user con roles y permisos
  hasRole, // verificar rol
  hasPermission, // verificar permiso
  getHighestRole, // obtener rol principal
  isSuperAdmin, // verificar super admin
} = useAuth();
```

**¡El sistema está completamente funcional!** 🚀
