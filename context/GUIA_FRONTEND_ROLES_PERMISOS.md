# 🎨 Guía Frontend - Sistema de Roles y Permisos

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Autenticación con Firebase](#autenticación-con-firebase)
4. [Sistema de Roles](#sistema-de-roles)
5. [Sistema de Permisos](#sistema-de-permisos)
6. [Gestión de Usuarios](#gestión-de-usuarios)
7. [Componentes UI Recomendados](#componentes-ui-recomendados)
8. [Ejemplos de Código](#ejemplos-de-código)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Esta guía explica cómo implementar el sistema de roles y permisos del **Gestor de Proyectos Cali API** en tu frontend (React, Vue, Angular, o cualquier framework JavaScript).

### Características del Sistema

- ✅ **8 roles jerárquicos** (super_admin → público)
- ✅ **Permisos granulares** con formato `action:resource:scope`
- ✅ **Rol por defecto** (`visualizador`) asignado automáticamente
- ✅ **Autenticación Firebase** con tokens JWT
- ✅ **Protección de rutas** basada en roles/permisos
- ✅ **UI condicional** según privilegios del usuario

---

## 🚀 Configuración Inicial

### 1. Instalar Firebase SDK

```bash
# Con npm
npm install firebase

# Con yarn
yarn add firebase

# Con pnpm
pnpm add firebase
```

### 2. Configurar Firebase en tu Proyecto

Crea `src/config/firebase.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "unidad-cumplimiento-aa245.firebaseapp.com",
  projectId: "unidad-cumplimiento-aa245",
  storageBucket: "unidad-cumplimiento-aa245.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Authentication
export const auth = getAuth(app);

export default app;
```

### 3. Configurar API Client

Crea `src/services/api.js`:

```javascript
import axios from "axios";
import { auth } from "../config/firebase";

// URL base de tu API
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token en cada request
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, intentar renovar
      const user = auth.currentUser;
      if (user) {
        try {
          await user.getIdToken(true); // Forzar renovación
          // Reintentar request original
          const config = error.config;
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
          return apiClient.request(config);
        } catch (refreshError) {
          // No se pudo renovar, redirigir a login
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🔐 Autenticación con Firebase

### Service de Autenticación

Crea `src/services/auth.service.js`:

```javascript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import apiClient from "./api";

class AuthService {
  /**
   * Login con email y password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();

      // Obtener datos completos del usuario desde el backend
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      return {
        user: userCredential.user,
        userData: response.data,
        token,
      };
    } catch (error) {
      console.error("Error en login:", error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Registro de nuevo usuario
   */
  async register(email, password, fullName, phoneNumber = null) {
    try {
      // Registrar en backend (asigna automáticamente rol visualizador)
      const response = await apiClient.post("/auth/register", {
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber,
      });

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Actualizar perfil con nombre
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      return {
        user: userCredential.user,
        userData: response.data,
      };
    } catch (error) {
      console.error("Error en registro:", error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Login con Google
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      // Enviar al backend
      const response = await apiClient.post("/auth/google", {
        id_token: token,
      });

      return {
        user: result.user,
        userData: response.data,
      };
    } catch (error) {
      console.error("Error en login con Google:", error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await signOut(auth);
      // Limpiar almacenamiento local
      localStorage.removeItem("userData");
      localStorage.removeItem("userPermissions");
    } catch (error) {
      console.error("Error en logout:", error);
      throw error;
    }
  }

  /**
   * Recuperar contraseña
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Error al enviar email de recuperación:", error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Obtener token del usuario actual
   */
  async getCurrentToken() {
    const user = this.getCurrentUser();
    if (!user) return null;
    return await user.getIdToken();
  }

  /**
   * Manejo de errores de Firebase
   */
  _handleAuthError(error) {
    const errorMessages = {
      "auth/user-not-found": "Usuario no encontrado",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/email-already-in-use": "El email ya está registrado",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
      "auth/invalid-email": "Email inválido",
      "auth/user-disabled": "Usuario deshabilitado",
      "auth/too-many-requests": "Demasiados intentos. Intenta más tarde",
      "auth/network-request-failed": "Error de conexión",
    };

    return new Error(errorMessages[error.code] || error.message);
  }
}

export default new AuthService();
```

---

## 👥 Sistema de Roles

### Definición de Roles (constantes)

Crea `src/constants/roles.js`:

```javascript
/**
 * Roles del sistema con sus niveles jerárquicos
 * Nivel 0 = máxima autoridad
 * Nivel 6 = mínima autoridad
 */
export const ROLES = {
  SUPER_ADMIN: {
    id: "super_admin",
    name: "Super Administrador",
    level: 0,
    description: "Control total del sistema",
  },
  ADMIN_GENERAL: {
    id: "admin_general",
    name: "Administrador General",
    level: 1,
    description: "Administrador de datos y roles",
  },
  ADMIN_CENTRO_GESTOR: {
    id: "admin_centro_gestor",
    name: "Administrador de Centro Gestor",
    level: 2,
    description: "Administrador de su centro gestor",
  },
  EDITOR_DATOS: {
    id: "editor_datos",
    name: "Editor de Datos",
    level: 3,
    description: "Puede editar pero no eliminar",
  },
  GESTOR_CONTRATOS: {
    id: "gestor_contratos",
    name: "Gestor de Contratos",
    level: 3,
    description: "Gestión de contratos y empréstito",
  },
  ANALISTA: {
    id: "analista",
    name: "Analista",
    level: 4,
    description: "Análisis y exportación de datos",
  },
  VISUALIZADOR: {
    id: "visualizador",
    name: "Visualizador",
    level: 5,
    description: "Solo lectura básica (rol por defecto)",
  },
  PUBLICO: {
    id: "publico",
    name: "Público",
    level: 6,
    description: "Acceso público limitado",
  },
};

/**
 * Rol asignado por defecto a nuevos usuarios
 */
export const DEFAULT_ROLE = ROLES.VISUALIZADOR;

/**
 * Obtener nivel de un rol
 */
export function getRoleLevel(roleId) {
  const role = Object.values(ROLES).find((r) => r.id === roleId);
  return role ? role.level : 999;
}

/**
 * Verificar si un rol tiene mayor autoridad que otro
 */
export function hasHigherAuthority(roleId1, roleId2) {
  return getRoleLevel(roleId1) < getRoleLevel(roleId2);
}

/**
 * Obtener nombre legible de un rol
 */
export function getRoleName(roleId) {
  const role = Object.values(ROLES).find((r) => r.id === roleId);
  return role ? role.name : roleId;
}
```

### Hook de React para Roles

Crea `src/hooks/useRole.js`:

```javascript
import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import apiClient from "../services/api";
import { getRoleLevel } from "../constants/roles";

export function useRole() {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Obtener roles del usuario desde el backend
          const response = await apiClient.get(`/auth/admin/users/${user.uid}`);
          setUserRoles(response.data.roles || ["visualizador"]);
        } catch (error) {
          console.error("Error obteniendo roles:", error);
          setUserRoles(["visualizador"]);
        }
      } else {
        setUserRoles([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (roleId) => {
    return userRoles.includes(roleId);
  };

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  const hasAnyRole = (roleIds) => {
    return roleIds.some((roleId) => userRoles.includes(roleId));
  };

  /**
   * Verifica si el usuario tiene un nivel de rol igual o superior
   */
  const hasRoleLevel = (minLevel) => {
    const userLevel = Math.min(...userRoles.map(getRoleLevel));
    return userLevel <= minLevel;
  };

  /**
   * Obtiene el rol de mayor autoridad del usuario
   */
  const getHighestRole = () => {
    if (userRoles.length === 0) return null;
    return userRoles.reduce((highest, current) =>
      getRoleLevel(current) < getRoleLevel(highest) ? current : highest
    );
  };

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    getHighestRole,
    loading,
  };
}
```

---

## 🔑 Sistema de Permisos

### Definición de Permisos

Crea `src/constants/permissions.js`:

```javascript
/**
 * Estructura de permisos del sistema
 * Formato: action:resource[:scope]
 */
export const PERMISSIONS = {
  // Proyectos
  READ_PROYECTOS: "read:proyectos",
  WRITE_PROYECTOS: "write:proyectos",
  WRITE_PROYECTOS_OWN: "write:proyectos:own_centro",
  DELETE_PROYECTOS: "delete:proyectos",
  EXPORT_PROYECTOS: "export:proyectos",

  // Unidades de Proyecto
  READ_UNIDADES: "read:unidades_proyecto",
  WRITE_UNIDADES: "write:unidades_proyecto",
  DELETE_UNIDADES: "delete:unidades_proyecto",

  // Contratos
  READ_CONTRATOS: "read:contratos",
  WRITE_CONTRATOS: "write:contratos",
  WRITE_CONTRATOS_OWN: "write:contratos:own_centro",
  DELETE_CONTRATOS: "delete:contratos",

  // Empréstito
  READ_EMPRESTITO: "read:emprestito",
  WRITE_EMPRESTITO: "write:emprestito",

  // Reportes
  READ_REPORTES: "read:reportes",
  GENERATE_REPORTES: "generate:reportes",
  EXPORT_REPORTES: "export:reportes",

  // Usuarios (solo admins)
  MANAGE_USERS: "manage:users",

  // Configuración
  MANAGE_SYSTEM: "manage:system",

  // Auditoría
  READ_AUDIT_LOGS: "read:audit_logs",

  // All (super_admin)
  ALL: "*",
};

/**
 * Verifica si un permiso coincide con el permiso requerido
 * Soporta wildcards: * y action:*
 */
export function matchPermission(userPermission, requiredPermission) {
  // Permiso total
  if (userPermission === "*") return true;

  // Permiso exacto
  if (userPermission === requiredPermission) return true;

  // Wildcard de acción: read:* coincide con read:proyectos
  const [userAction, userResource] = userPermission.split(":");
  const [reqAction, reqResource] = requiredPermission.split(":");

  if (userAction === reqAction && userResource === "*") return true;

  return false;
}

/**
 * Verifica si el usuario tiene un permiso específico
 */
export function hasPermission(userPermissions, requiredPermission) {
  if (!userPermissions || userPermissions.length === 0) return false;

  return userPermissions.some((perm) =>
    matchPermission(perm, requiredPermission)
  );
}

/**
 * Verifica si el usuario tiene todos los permisos requeridos
 */
export function hasAllPermissions(userPermissions, requiredPermissions) {
  return requiredPermissions.every((req) =>
    hasPermission(userPermissions, req)
  );
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(userPermissions, requiredPermissions) {
  return requiredPermissions.some((req) => hasPermission(userPermissions, req));
}
```

### Hook de React para Permisos

Crea `src/hooks/usePermissions.js`:

```javascript
import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import apiClient from "../services/api";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "../constants/permissions";

export function usePermissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Obtener permisos del usuario
          const response = await apiClient.get(`/auth/admin/users/${user.uid}`);

          // Combinar permisos de roles + permisos temporales
          const rolePermissions = response.data.permissions || [];
          const tempPermissions = (response.data.temporary_permissions || [])
            .filter((tp) => new Date(tp.expires_at) > new Date())
            .map((tp) => tp.permission);

          const allPermissions = [
            ...new Set([...rolePermissions, ...tempPermissions]),
          ];
          setPermissions(allPermissions);

          // Guardar en localStorage para acceso rápido
          localStorage.setItem(
            "userPermissions",
            JSON.stringify(allPermissions)
          );
        } catch (error) {
          console.error("Error obteniendo permisos:", error);
          // Intentar cargar desde localStorage
          const cached = localStorage.getItem("userPermissions");
          if (cached) {
            setPermissions(JSON.parse(cached));
          }
        }
      } else {
        setPermissions([]);
        localStorage.removeItem("userPermissions");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    permissions,
    can: (permission) => hasPermission(permissions, permission),
    canAll: (perms) => hasAllPermissions(permissions, perms),
    canAny: (perms) => hasAnyPermission(permissions, perms),
    loading,
  };
}
```

---

## 👤 Gestión de Usuarios

### Service de Usuarios

Crea `src/services/user.service.js`:

```javascript
import apiClient from "./api";

class UserService {
  /**
   * Listar todos los usuarios (solo admins)
   */
  async listUsers(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters,
      });

      const response = await apiClient.get(`/auth/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error listando usuarios:", error);
      throw error;
    }
  }

  /**
   * Obtener usuario por UID
   */
  async getUserById(uid) {
    try {
      const response = await apiClient.get(`/auth/admin/users/${uid}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo usuario:", error);
      throw error;
    }
  }

  /**
   * Asignar roles a un usuario
   */
  async assignRoles(uid, roles, reason = "") {
    try {
      const response = await apiClient.post(`/auth/admin/users/${uid}/roles`, {
        roles,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error asignando roles:", error);
      throw error;
    }
  }

  /**
   * Otorgar permiso temporal a un usuario
   */
  async grantTemporaryPermission(uid, permission, expiresAt, reason = "") {
    try {
      const response = await apiClient.post(
        `/auth/admin/users/${uid}/temporary-permissions`,
        {
          permission,
          expires_at: expiresAt,
          reason,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error otorgando permiso temporal:", error);
      throw error;
    }
  }

  /**
   * Actualizar centro gestor de un usuario
   */
  async updateCentroGestor(uid, centroGestor, reason = "") {
    try {
      const response = await apiClient.put(
        `/auth/admin/users/${uid}/centro-gestor`,
        {
          centro_gestor_assigned: centroGestor,
          reason,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error actualizando centro gestor:", error);
      throw error;
    }
  }

  /**
   * Activar/desactivar usuario
   */
  async toggleUserStatus(uid, isActive, reason = "") {
    try {
      const response = await apiClient.put(`/auth/admin/users/${uid}/status`, {
        is_active: isActive,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error cambiando estado de usuario:", error);
      throw error;
    }
  }

  /**
   * Listar todos los roles disponibles
   */
  async listRoles() {
    try {
      const response = await apiClient.get("/auth/admin/roles");
      return response.data;
    } catch (error) {
      console.error("Error listando roles:", error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un rol
   */
  async getRoleDetails(roleId) {
    try {
      const response = await apiClient.get(`/auth/admin/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo detalles del rol:", error);
      throw error;
    }
  }

  /**
   * Listar logs de auditoría
   */
  async listAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters,
      });

      const response = await apiClient.get(`/auth/admin/audit-logs?${params}`);
      return response.data;
    } catch (error) {
      console.error("Error obteniendo audit logs:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del sistema
   */
  async getSystemStats() {
    try {
      const response = await apiClient.get("/auth/admin/system/stats");
      return response.data;
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error);
      throw error;
    }
  }
}

export default new UserService();
```

---

## 🎨 Componentes UI Recomendados

### 1. Componente de Protección de Rutas

Crea `src/components/ProtectedRoute.jsx`:

```jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { useRole } from "../hooks/useRole";
import { auth } from "../config/firebase";
import LoadingSpinner from "./LoadingSpinner";

/**
 * Componente para proteger rutas por permisos o roles
 */
export function ProtectedRoute({
  children,
  requiredPermission = null,
  requiredRole = null,
  requiredAnyRole = null,
  fallbackPath = "/unauthorized",
}) {
  const { can, loading: permLoading } = usePermissions();
  const { hasRole, hasAnyRole, loading: roleLoading } = useRole();
  const user = auth.currentUser;

  // Mostrar loading mientras se cargan permisos/roles
  if (permLoading || roleLoading) {
    return <LoadingSpinner />;
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permiso si se requiere
  if (requiredPermission && !can(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar rol específico si se requiere
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar si tiene uno de los roles
  if (requiredAnyRole && !hasAnyRole(requiredAnyRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
```

**Uso en React Router:**

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PERMISSIONS } from "./constants/permissions";
import { ROLES } from "./constants/roles";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas por permiso */}
        <Route
          path="/proyectos"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.READ_PROYECTOS}>
              <ProyectosPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas por rol */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN.id}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas con múltiples roles permitidos */}
        <Route
          path="/reportes"
          element={
            <ProtectedRoute
              requiredAnyRole={[
                ROLES.SUPER_ADMIN.id,
                ROLES.ADMIN_GENERAL.id,
                ROLES.ANALISTA.id,
              ]}
            >
              <ReportesPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. Componente de Renderizado Condicional

Crea `src/components/Can.jsx`:

```jsx
import React from "react";
import { usePermissions } from "../hooks/usePermissions";

/**
 * Componente para renderizar condicionalmente según permisos
 */
export function Can({
  permission = null,
  allPermissions = null,
  anyPermissions = null,
  children,
  fallback = null,
}) {
  const { can, canAll, canAny } = usePermissions();

  let hasAccess = true;

  if (permission) {
    hasAccess = can(permission);
  } else if (allPermissions) {
    hasAccess = canAll(allPermissions);
  } else if (anyPermissions) {
    hasAccess = canAny(anyPermissions);
  }

  return hasAccess ? children : fallback;
}
```

**Uso:**

```jsx
import { Can } from "./components/Can";
import { PERMISSIONS } from "./constants/permissions";

function ProyectoCard({ proyecto }) {
  return (
    <div className="card">
      <h3>{proyecto.nombre}</h3>

      {/* Mostrar botón solo si tiene permiso de escritura */}
      <Can permission={PERMISSIONS.WRITE_PROYECTOS}>
        <button onClick={() => editProyecto(proyecto.id)}>Editar</button>
      </Can>

      {/* Mostrar botón solo si tiene permiso de eliminación */}
      <Can permission={PERMISSIONS.DELETE_PROYECTOS}>
        <button onClick={() => deleteProyecto(proyecto.id)}>Eliminar</button>
      </Can>

      {/* Mostrar mensaje si NO tiene permiso */}
      <Can
        permission={PERMISSIONS.EXPORT_PROYECTOS}
        fallback={<p>No tienes permiso para exportar</p>}
      >
        <button onClick={() => exportProyecto(proyecto.id)}>Exportar</button>
      </Can>
    </div>
  );
}
```

### 3. Componente de Gestión de Usuarios

Crea `src/components/UserManagement/UserList.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import userService from "../../services/user.service";
import { getRoleName } from "../../constants/roles";

export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.listUsers(page, 20);
      setUsers(response.users);
      setTotalPages(response.total_pages);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className="user-list">
      <h2>Gestión de Usuarios</h2>

      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Roles</th>
            <th>Estado</th>
            <th>Centro Gestor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td>{user.email}</td>
              <td>{user.full_name}</td>
              <td>
                {user.roles.map((roleId) => (
                  <span key={roleId} className="badge">
                    {getRoleName(roleId)}
                  </span>
                ))}
              </td>
              <td>
                <span
                  className={
                    user.is_active ? "status-active" : "status-inactive"
                  }
                >
                  {user.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>{user.centro_gestor_assigned || "-"}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
```

### 4. Componente de Asignación de Roles

Crea `src/components/UserManagement/RoleAssignment.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import userService from "../../services/user.service";
import { ROLES } from "../../constants/roles";

export function RoleAssignment({ user, onClose, onSuccess }) {
  const [selectedRoles, setSelectedRoles] = useState(user.roles || []);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRoles.length === 0) {
      alert("Debes seleccionar al menos un rol");
      return;
    }

    try {
      setLoading(true);
      await userService.assignRoles(user.uid, selectedRoles, reason);
      alert("Roles asignados exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error asignando roles:", error);
      alert("Error al asignar roles: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Asignar Roles a {user.email}</h3>

        <form onSubmit={handleSubmit}>
          <div className="role-list">
            {Object.values(ROLES).map((role) => (
              <label key={role.id} className="role-item">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => handleToggleRole(role.id)}
                  disabled={role.id === ROLES.PUBLICO.id}
                />
                <div>
                  <strong>{role.name}</strong>
                  <p>{role.description}</p>
                  <small>Nivel: {role.level}</small>
                </div>
              </label>
            ))}
          </div>

          <div className="form-group">
            <label>Razón del cambio:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe por qué cambias los roles..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 5. Componente de Perfil de Usuario

Crea `src/components/UserProfile.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { usePermissions } from "../hooks/usePermissions";
import { useRole } from "../hooks/useRole";
import { getRoleName } from "../constants/roles";

export function UserProfile() {
  const user = auth.currentUser;
  const { permissions } = usePermissions();
  const { userRoles, getHighestRole } = useRole();

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <img
          src={user.photoURL || "/default-avatar.png"}
          alt={user.displayName}
          className="avatar"
        />
        <div>
          <h3>{user.displayName || user.email}</h3>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="profile-section">
        <h4>Roles Asignados</h4>
        <div className="roles-list">
          {userRoles.map((roleId) => (
            <span key={roleId} className="badge badge-role">
              {getRoleName(roleId)}
            </span>
          ))}
        </div>
        <p className="text-muted">
          Rol principal: <strong>{getRoleName(getHighestRole())}</strong>
        </p>
      </div>

      <div className="profile-section">
        <h4>Permisos</h4>
        <div className="permissions-list">
          {permissions.slice(0, 10).map((permission) => (
            <span key={permission} className="badge badge-permission">
              {permission}
            </span>
          ))}
          {permissions.length > 10 && (
            <span className="badge">+{permissions.length - 10} más</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 📝 Ejemplos de Código Completos

### Ejemplo 1: Página de Login Completa

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.login(email, password);

      // Guardar datos del usuario
      localStorage.setItem("userData", JSON.stringify(result.userData));

      // Redirigir al dashboard
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await authService.loginWithGoogle();
      localStorage.setItem("userData", JSON.stringify(result.userData));
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Gestor de Proyectos Cali</h1>
        <h2>Iniciar Sesión</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button
          className="btn-google"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <img src="/google-icon.svg" alt="Google" />
          Continuar con Google
        </button>

        <div className="login-footer">
          <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
          <a href="/register">¿No tienes cuenta? Regístrate</a>
        </div>
      </div>
    </div>
  );
}
```

### Ejemplo 2: Navbar con Permisos

```jsx
import React from "react";
import { Link } from "react-router-dom";
import { Can } from "./Can";
import { PERMISSIONS } from "../constants/permissions";
import { ROLES } from "../constants/roles";
import { useRole } from "../hooks/useRole";
import authService from "../services/auth.service";

export function Navbar() {
  const { hasRole } = useRole();

  const handleLogout = async () => {
    if (confirm("¿Seguro que quieres cerrar sesión?")) {
      await authService.logout();
      window.location.href = "/login";
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Gestor de Proyectos Cali</Link>
      </div>

      <ul className="navbar-menu">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>

        {/* Mostrar solo si puede leer proyectos */}
        <Can permission={PERMISSIONS.READ_PROYECTOS}>
          <li>
            <Link to="/proyectos">Proyectos</Link>
          </li>
        </Can>

        {/* Mostrar solo si puede leer contratos */}
        <Can permission={PERMISSIONS.READ_CONTRATOS}>
          <li>
            <Link to="/contratos">Contratos</Link>
          </li>
        </Can>

        {/* Mostrar solo a analistas y superiores */}
        <Can permission={PERMISSIONS.READ_REPORTES}>
          <li>
            <Link to="/reportes">Reportes</Link>
          </li>
        </Can>

        {/* Mostrar solo a super admins */}
        {hasRole(ROLES.SUPER_ADMIN.id) && (
          <li>
            <Link to="/admin/users">Admin Usuarios</Link>
          </li>
        )}
      </ul>

      <div className="navbar-user">
        <Link to="/profile">Mi Perfil</Link>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
}
```

### Ejemplo 3: Dashboard con Estadísticas según Rol

```jsx
import React, { useState, useEffect } from "react";
import { useRole } from "../hooks/useRole";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../constants/permissions";
import userService from "../services/user.service";

export function Dashboard() {
  const { getHighestRole } = useRole();
  const { can } = usePermissions();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await userService.getSystemStats();
      setStats(data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="stats-grid">
        {/* Estadísticas visibles para todos */}
        <div className="stat-card">
          <h3>Mis Proyectos</h3>
          <p className="stat-value">{stats?.my_proyectos || 0}</p>
        </div>

        {/* Solo visible si puede leer contratos */}
        {can(PERMISSIONS.READ_CONTRATOS) && (
          <div className="stat-card">
            <h3>Contratos Activos</h3>
            <p className="stat-value">{stats?.contratos_activos || 0}</p>
          </div>
        )}

        {/* Solo visible si puede gestionar usuarios */}
        {can(PERMISSIONS.MANAGE_USERS) && (
          <>
            <div className="stat-card">
              <h3>Total Usuarios</h3>
              <p className="stat-value">{stats?.total_users || 0}</p>
            </div>

            <div className="stat-card">
              <h3>Usuarios Activos Hoy</h3>
              <p className="stat-value">{stats?.active_today || 0}</p>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-content">
        <h2>Acciones Rápidas</h2>

        <div className="quick-actions">
          {can(PERMISSIONS.WRITE_PROYECTOS) && (
            <button onClick={() => navigate("/proyectos/new")}>
              Crear Proyecto
            </button>
          )}

          {can(PERMISSIONS.WRITE_CONTRATOS) && (
            <button onClick={() => navigate("/contratos/new")}>
              Crear Contrato
            </button>
          )}

          {can(PERMISSIONS.EXPORT_REPORTES) && (
            <button onClick={() => navigate("/reportes/export")}>
              Exportar Reportes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Mejores Prácticas

### 1. Seguridad

```javascript
// ❌ MAL - No confiar solo en el frontend
function deleteProyecto(id) {
  // Solo ocultar botón no es suficiente
  if (hasPermission('delete:proyectos')) {
    api.delete(`/proyectos/${id}`);
  }
}

// ✅ BIEN - El backend siempre valida
function deleteProyecto(id) {
  // El backend validará el permiso, pero ocultamos UI
  if (hasPermission('delete:proyectos')) {
    try {
      await api.delete(`/proyectos/${id}`);
    } catch (error) {
      if (error.response?.status === 403) {
        alert('No tienes permiso para esta acción');
      }
    }
  }
}
```

### 2. Caching de Permisos

```javascript
// Guardar permisos en localStorage para acceso rápido
useEffect(() => {
  if (permissions.length > 0) {
    localStorage.setItem("userPermissions", JSON.stringify(permissions));
  }
}, [permissions]);

// Cargar permisos desde cache al inicio
const cachedPermissions = JSON.parse(
  localStorage.getItem("userPermissions") || "[]"
);
```

### 3. Renovación Automática de Token

```javascript
// Renovar token antes de que expire
useEffect(() => {
  const interval = setInterval(async () => {
    const user = auth.currentUser;
    if (user) {
      await user.getIdToken(true); // Forzar renovación
    }
  }, 50 * 60 * 1000); // Cada 50 minutos (tokens expiran en 60)

  return () => clearInterval(interval);
}, []);
```

### 4. Manejo de Errores 403

```javascript
// Interceptor global para errores de permisos
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Permiso denegado
      toast.error("No tienes permiso para realizar esta acción");

      // Opcional: redirigir
      // navigate('/unauthorized');
    }
    return Promise.reject(error);
  }
);
```

### 5. Loading States

```jsx
// Siempre mostrar loading mientras se cargan permisos
function ProtectedContent() {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return <LoadingSpinner />;
  }

  return <Content />;
}
```

---

## 🐛 Troubleshooting

### Problema 1: "No tienes permiso" aunque debería tenerlo

**Causas posibles:**

- Permisos en cache desactualizados
- Roles no sincronizados entre Firebase Auth y Firestore
- Token expirado

**Solución:**

```javascript
// Forzar recarga de permisos
localStorage.removeItem("userPermissions");
await auth.currentUser.getIdToken(true);
window.location.reload();
```

### Problema 2: Usuario no tiene rol asignado

**Causa:** El usuario se registró pero no se le asignó el rol por defecto

**Solución:**

```javascript
// Verificar y asignar rol por defecto si no tiene ninguno
const userData = await userService.getUserById(user.uid);
if (!userData.roles || userData.roles.length === 0) {
  await userService.assignRoles(
    user.uid,
    ["visualizador"],
    "Asignación automática"
  );
}
```

### Problema 3: Token expirado constantemente

**Causa:** No se está renovando el token automáticamente

**Solución:** Implementar renovación periódica (ver sección "Renovación Automática de Token")

### Problema 4: Permisos no se actualizan después de cambiar roles

**Causa:** Cache del frontend no se actualiza

**Solución:**

```javascript
// Después de cambiar roles, forzar recarga
async function handleRoleChange(uid, newRoles) {
  await userService.assignRoles(uid, newRoles);

  // Si es el usuario actual, recargar permisos
  if (uid === auth.currentUser.uid) {
    localStorage.removeItem("userPermissions");
    await auth.currentUser.getIdToken(true);

    // Opcional: recargar página
    window.location.reload();

    // O mejor: actualizar estado reactivo
    refetchPermissions();
  }
}
```

---

## 📊 Tabla de Referencia Rápida

### Roles y sus Capacidades

| Rol                 | Puede Leer   | Puede Escribir | Puede Eliminar | Puede Exportar | Puede Admin Usuarios |
| ------------------- | ------------ | -------------- | -------------- | -------------- | -------------------- |
| Super Admin         | ✅ Todo      | ✅ Todo        | ✅ Todo        | ✅ Todo        | ✅ Sí                |
| Admin General       | ✅ Todo      | ✅ Todo        | ✅ Todo        | ✅ Todo        | ❌ No                |
| Admin Centro Gestor | ✅ Todo      | ✅ Su centro   | ✅ Su centro   | ✅ Su centro   | ❌ No                |
| Editor Datos        | ✅ Todo      | ✅ Sí          | ❌ No          | ✅ Sí          | ❌ No                |
| Gestor Contratos    | ✅ Contratos | ✅ Contratos   | ❌ No          | ✅ Contratos   | ❌ No                |
| Analista            | ✅ Todo      | ❌ No          | ❌ No          | ✅ Sí          | ❌ No                |
| **Visualizador**    | ✅ Básico    | ❌ No          | ❌ No          | ❌ No          | ❌ No                |
| Público             | ✅ Público   | ❌ No          | ❌ No          | ❌ No          | ❌ No                |

### Endpoints de Administración

| Endpoint                                        | Método | Permiso Requerido | Descripción          |
| ----------------------------------------------- | ------ | ----------------- | -------------------- |
| `/auth/admin/users`                             | GET    | `manage:users`    | Listar usuarios      |
| `/auth/admin/users/{uid}`                       | GET    | `manage:users`    | Obtener usuario      |
| `/auth/admin/users/{uid}/roles`                 | POST   | `manage:users`    | Asignar roles        |
| `/auth/admin/users/{uid}/temporary-permissions` | POST   | `manage:users`    | Permiso temporal     |
| `/auth/admin/roles`                             | GET    | Admin+            | Listar roles         |
| `/auth/admin/roles/{roleId}`                    | GET    | Admin+            | Detalles rol         |
| `/auth/admin/audit-logs`                        | GET    | Admin+            | Ver logs auditoría   |
| `/auth/admin/system/stats`                      | GET    | Admin+            | Estadísticas sistema |

---

## 🎓 Recursos Adicionales

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [React Router Protected Routes](https://reactrouter.com/en/main/start/tutorial)
- [JWT Token Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Autor**: Sistema de Autenticación Gestor Proyectos Cali  
**Versión**: 1.0.0  
**Última Actualización**: 24 de Noviembre 2025
