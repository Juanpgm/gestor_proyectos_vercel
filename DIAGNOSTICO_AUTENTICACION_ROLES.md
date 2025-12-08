# Diagnóstico y Solución: Error de Autenticación en Asignación de Roles

## 🔍 Problema Identificado

Al intentar asignar roles a usuarios desde el panel de administración, se obtenía el error:

```
Error de autenticación o autorización (401/403)
```

## 🎯 Causa Raíz

El sistema **NO estaba enviando el token de autenticación correcto** en las peticiones API. El problema tenía múltiples capas:

### 1. Token Incorrecto en la Sesión

- El sistema guardaba solo el `uid` del usuario en lugar del `idToken` de Firebase
- El `uid` **NO es un token JWT válido** y no puede usarse para autenticación
- El backend esperaba recibir un token JWT de Firebase válido

### 2. ApiClient sin Headers de Autenticación

- El `ApiClient` en `src/services/api.ts` no agregaba automáticamente el header `Authorization`
- Cada petición se hacía sin credenciales, resultando en errores 401/403

### 3. Extracción Incorrecta del Token

- El método `getAuthToken()` solo buscaba el `uid` en lugar del `idToken`

## ✅ Soluciones Implementadas

### 1. Modificación del Servicio de Autenticación (`authService.ts`)

#### A. Actualizar `mapApiUser()` para recibir y almacenar el token

```typescript
// Antes
private mapApiUser(apiUser: any): User

// Después
private mapApiUser(apiUser: any, idToken?: string): User
```

Ahora el usuario mapeado incluye el `idToken`:

```typescript
const mappedUser = {
  // ... otros campos
  idToken: idToken || apiUser.id_token || apiUser.idToken || null,
};
```

#### B. Modificar todos los métodos de login para extraer y pasar el token

**Login con Email:**

```typescript
// Extraer el token de la respuesta
const idToken =
  data.id_token || data.idToken || data.token || data.user?.id_token;
const user = this.mapApiUser(data.user, idToken);
```

**Login con Google:**

```typescript
// Usar el idToken de Firebase obtenido del popup
const idToken = await result.user.getIdToken();
const user = this.mapApiUser(data.user, idToken);
```

**Registro:**

```typescript
const idToken =
  data.id_token || data.idToken || data.token || userData?.id_token;
const user = this.mapApiUser(userData, idToken);
```

### 2. Actualización del ApiClient (`api.ts`)

#### A. Agregar método para obtener el token

```typescript
private getAuthToken(): string | null {
  try {
    const localData = localStorage.getItem('auth_session');
    if (localData) {
      const parsed = JSON.parse(localData);
      // Priorizar idToken sobre uid
      return parsed.user?.idToken || parsed.user?.uid || null;
    }

    const sessionData = sessionStorage.getItem('auth_session');
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      return parsed.user?.idToken || parsed.user?.uid || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}
```

#### B. Incluir automáticamente el header de autorización

```typescript
async request<T>(endpoint: string, options: RequestInit = {}, useRetry: boolean = true): Promise<T> {
  // Obtener token y agregarlo a los headers
  const token = this.getAuthToken();
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetchWithErrorHandling<T>(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders,  // ✅ Token incluido automáticamente
      ...options.headers,
    },
  }, this.timeout);
}
```

### 3. Actualización del Tipo User (`types/auth.ts`)

```typescript
export interface User {
  uid: string;
  email: string | null;
  // ... otros campos
  idToken?: string | null; // ✅ Nuevo campo agregado
}
```

## 🧪 Herramientas de Prueba Creadas

### 1. Test HTML Interactivo (`test-roles-assignment.html`)

Archivo: `public/test-roles-assignment.html`

**Características:**

- ✅ Verifica el estado de autenticación
- ✅ Analiza el token guardado en la sesión
- ✅ Ejecuta batería de tests automáticos:
  - Test 1: Verificar sesión local
  - Test 2: Verificar token
  - Test 3: Test del proxy (GET)
  - Test 4: Test de headers de autorización
  - Test 5: Listar usuarios
  - Test 6: Validar permisos
- ✅ Permite asignar roles interactivamente
- ✅ Sistema de logs en tiempo real

**Cómo usar:**

1. Abre el navegador en: `http://localhost:3000/test-roles-assignment.html`
2. Asegúrate de estar autenticado en el sistema
3. Click en "Ejecutar Todos los Tests"
4. Revisa los resultados y logs
5. Si todos pasan, prueba asignar roles a un usuario

### 2. Script Node.js de Prueba (`test-role-assignment-flow.js`)

Archivo: `test-role-assignment-flow.js`

**Características:**

- ✅ Prueba el flujo completo end-to-end
- ✅ Login programático
- ✅ Validación de token
- ✅ Listado de usuarios
- ✅ Asignación de roles
- ✅ Diagnóstico detallado de errores

**Cómo usar:**

```bash
node test-role-assignment-flow.js
```

Seguir las instrucciones interactivas:

1. Ingresar email y contraseña de administrador
2. El script listará los usuarios disponibles
3. Elegir un usuario para asignar roles
4. Especificar los roles (separados por coma)
5. Ver el resultado

## 🔄 Flujo de Autenticación Actualizado

### Antes (❌ Incorrecto)

```
1. Usuario hace login
2. Backend retorna { user: {...}, id_token: "eyJ..." }
3. Frontend guarda solo el uid
4. ApiClient usa uid en Authorization header
5. Backend rechaza (401) - uid no es un token JWT válido
```

### Después (✅ Correcto)

```
1. Usuario hace login
2. Backend retorna { user: {...}, id_token: "eyJ..." }
3. Frontend guarda el user con idToken incluido
4. ApiClient extrae idToken de la sesión
5. ApiClient agrega: Authorization: Bearer eyJ...
6. Backend valida el token JWT
7. Operación exitosa ✅
```

## 📋 Checklist de Verificación

Antes de considerar el problema resuelto, verifica:

- [ ] El usuario tiene sesión activa (localStorage o sessionStorage)
- [ ] La sesión incluye `user.idToken` (no solo `user.uid`)
- [ ] El `idToken` es un string largo (JWT), no un UID corto
- [ ] Las peticiones API incluyen el header `Authorization: Bearer <token>`
- [ ] El proxy reenvía correctamente el header al backend
- [ ] El usuario tiene el permiso `manage:users` o el rol `super_admin`
- [ ] El backend acepta el token y retorna 200/201

## 🔧 Cómo Probar la Solución

### Opción 1: Navegador (Recomendado)

1. **Limpiar sesión anterior:**

   ```javascript
   // En la consola del navegador
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Hacer login nuevamente** (esto guardará el token correcto)

3. **Verificar que el token esté presente:**

   ```javascript
   // En la consola del navegador
   const session = JSON.parse(
     localStorage.getItem("auth_session") ||
       sessionStorage.getItem("auth_session")
   );
   console.log("Token:", session?.user?.idToken);
   console.log("Es JWT:", session?.user?.idToken?.startsWith("eyJ"));
   ```

4. **Abrir el test HTML:**
   - Ir a: `http://localhost:3000/test-roles-assignment.html`
   - Ejecutar todos los tests
   - Intentar asignar roles

### Opción 2: Script Node.js

```bash
# Ejecutar el test interactivo
node test-role-assignment-flow.js
```

### Opción 3: Interfaz de Usuario

1. Ir al panel de administración de usuarios
2. Hacer click en "Asignar Roles" para un usuario
3. Seleccionar roles
4. Guardar
5. Verificar que NO aparezca el error de autenticación

## 🚨 Posibles Problemas Adicionales

Si después de aplicar estas correcciones el problema persiste:

### 1. Backend no retorna el token

**Síntoma:** `user.idToken` es `null` después del login
**Solución:** Verificar que el backend retorne `id_token` en la respuesta de login

### 2. Token expira rápidamente

**Síntoma:** Funciona inicialmente, luego da 401
**Solución:** Implementar refresh de token o re-login automático

### 3. Backend no acepta el token

**Síntoma:** Envía token pero recibe 401/403
**Solución:** Verificar configuración de Firebase en el backend

### 4. Permisos insuficientes

**Síntoma:** Token válido pero recibe 403
**Solución:** El usuario necesita rol `super_admin` o permiso `manage:users`

## 📝 Logs para Debugging

Después de aplicar los cambios, en la consola del navegador deberías ver:

```
💾 Guardando sesión: {
  email: "user@example.com",
  roles: ["super_admin"],
  hasToken: true,  ✅ Debe ser true
  ...
}

🌐 API Request: /api/proxy/auth/admin/users/123/roles
✅ API Request successful
```

Si ves `hasToken: false`, el backend no está retornando el token.

## 🎉 Resultado Esperado

Después de implementar todas las correcciones:

- ✅ Las peticiones incluyen el header `Authorization` correcto
- ✅ El backend acepta y valida el token
- ✅ La asignación de roles funciona sin errores
- ✅ Se pueden gestionar usuarios sin problemas de autorización

## 📞 Soporte Adicional

Si el problema persiste:

1. Ejecutar ambos tests (HTML y Node.js)
2. Capturar los logs de la consola
3. Verificar la respuesta del backend en Network tab
4. Revisar que el backend esté configurado correctamente para validar tokens de Firebase
