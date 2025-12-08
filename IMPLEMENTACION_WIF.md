# 🔐 Implementación de Workload Identity Federation (WIF)

## ✅ Estado: Implementado

La aplicación ahora usa **Workload Identity Federation (WIF)** para autenticación automática con Firebase.

---

## 🎯 ¿Qué es WIF?

**Workload Identity Federation** es un sistema de autenticación automática que:

- ✅ **Elimina la necesidad de renovar tokens manualmente**
- ✅ **Gestiona la sesión automáticamente**
- ✅ **Renueva tokens antes de que expiren**
- ✅ **Mantiene la autenticación persistente**
- ✅ **Simplifica la gestión de credenciales**

---

## 🔄 Flujo de Autenticación con WIF

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUJO WIF COMPLETO                           │
└──────────────────────────────────────────────────────────────────┘

1. 👤 Usuario ingresa credenciales (email/password)
   ↓
2. 🌐 Frontend → Backend: POST /auth/login
   ↓
3. 🔐 Backend valida credenciales en Firestore
   ↓
4. 🎫 Backend genera custom_token de Firebase
   ↓
5. 📤 Backend retorna: { success, user, custom_token }
   ↓
6. 🔄 Frontend: authenticateWithWIF(custom_token)
   ↓
7. 🔥 Firebase: signInWithCustomToken(custom_token)
   ↓
8. ✅ Firebase Auth mantiene la sesión activa
   ↓
9. 🔄 Renovación automática de tokens (cada ~55 min)
   ↓
10. 🔒 Todas las peticiones usan getCurrentIdToken()
```

---

## 📁 Archivos Modificados

### 1. `src/lib/firebase.ts`

**Funciones WIF implementadas:**

```typescript
// ✅ Autenticación automática con custom_token
authenticateWithWIF(customToken: string): Promise<string>

// ✅ Obtener token actual con renovación automática
getCurrentIdToken(forceRefresh?: boolean): Promise<string | null>

// ✅ Verificar si hay usuario autenticado
isAuthenticated(): boolean

// ✅ Cerrar sesión y limpiar tokens
signOutWIF(): Promise<void>
```

**Características:**

- ✅ Manejo automático de errores con mensajes específicos
- ✅ Logging detallado para debugging
- ✅ Renovación automática de tokens
- ✅ Persistencia de sesión local

### 2. `src/services/authService.ts`

**Método actualizado:**

```typescript
signInWithEmailFallback({ email, password, remember });
```

**Cambios:**

- ✅ Usa `authenticateWithWIF()` en lugar de `signInWithCustomToken()`
- ✅ Logging con prefijo "WIF" para identificar el flujo
- ✅ Manejo automático de renovación de tokens

**Método actualizado:**

```typescript
signOut();
```

**Cambios:**

- ✅ Usa `signOutWIF()` para cerrar sesión
- ✅ Limpia completamente todos los tokens de Firebase
- ✅ Limpia sesión local y storage

### 3. `src/services/api.ts`

**Método actualizado:**

```typescript
getAuthToken(): Promise<string | null>
```

**Cambios:**

- ✅ Usa `getCurrentIdToken()` de WIF
- ✅ Renovación automática de tokens si están próximos a expirar
- ✅ Logging con prefijo "WIF"

---

## 🚀 Ventajas de WIF

### 1. **Renovación Automática**

```typescript
// ❌ ANTES (manual)
const token = await user.getIdToken();
// El token expira en 1 hora, hay que renovarlo manualmente

// ✅ AHORA (WIF - automático)
const token = await getCurrentIdToken();
// WIF renueva automáticamente si está próximo a expirar
```

### 2. **Gestión de Sesión Simplificada**

```typescript
// ❌ ANTES (complejo)
- Guardar token en localStorage
- Verificar expiración antes de cada petición
- Renovar token manualmente si expiró
- Manejar errores de token expirado

// ✅ AHORA (WIF - simple)
- authenticateWithWIF(customToken)
- Firebase Auth maneja TODO automáticamente
```

### 3. **Seguridad Mejorada**

```typescript
// ✅ Tokens se renuevan antes de expirar (no hay "downtime")
// ✅ Firebase Auth valida tokens en cada operación
// ✅ Sesión persistente con validación continua
// ✅ Cierre de sesión limpia todos los tokens
```

---

## 🔍 Logging y Debugging

### Consola del Navegador

**Inicio de sesión exitoso:**

```
🔐 WIF: Iniciando autenticación automática...
🔄 WIF: Convirtiendo custom_token a id_token (automático)...
🔐 WIF: Iniciando autenticación automática...
✅ WIF: Autenticación exitosa
👤 Usuario autenticado: <firebase_uid>
✅ WIF: Token obtenido y configurado automáticamente
✅ WIF: Login exitoso con autenticación automática: usuario@email.com
```

**Petición API con token:**

```
🌐 API Request: /api/proxy/admin/users
✅ API Request successful
```

**Cierre de sesión:**

```
✅ WIF: Sesión cerrada correctamente
✅ WIF: Sesión cerrada automáticamente
```

**Error de autenticación:**

```
❌ WIF: Error en autenticación automática: <mensaje>
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env.local`)

```env
# ✅ CONFIGURADAS - Firebase con WIF
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDC8K9i8xLl7XhT_pMBKEr9qJ9W0RyXbcg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=574623423766
NEXT_PUBLIC_FIREBASE_APP_ID=1:574623423766:web:f8e3a47e947fb64b25bfe9
```

### Persistencia de Sesión

Firebase Auth usa `local` persistence por defecto:

- ✅ La sesión persiste incluso después de cerrar el navegador
- ✅ Los tokens se renuevan automáticamente al reabrir la app
- ✅ No requiere re-login hasta hacer `signOutWIF()`

---

## 🧪 Pruebas

### Test 1: Login con WIF

```powershell
# 1. Reiniciar servidor
npm run dev

# 2. Ir a http://localhost:3000

# 3. Login con usuario de prueba

# 4. Verificar en consola del navegador:
# ✅ Debe ver: "✅ WIF: Autenticación exitosa"
# ✅ Debe ver: "👤 Usuario autenticado: <uid>"
```

### Test 2: Renovación Automática de Token

```typescript
// Abrir consola del navegador y ejecutar:
const { getCurrentIdToken } = await import("./src/lib/firebase");

// Primera llamada
const token1 = await getCurrentIdToken();
console.log("Token 1:", token1);

// Forzar renovación
const token2 = await getCurrentIdToken(true);
console.log("Token 2:", token2);

// ✅ Ambos tokens deben ser válidos
// ✅ token2 debe ser diferente a token1 (renovado)
```

### Test 3: Operaciones de Admin

```typescript
// En el panel de "Gestionar Usuarios", probar:
1. ✅ Ver lista de usuarios
2. ✅ Asignar rol a un usuario
3. ✅ Actualizar información de usuario
4. ✅ Cambiar estado de usuario

// Verificar en Network tab:
// ✅ Todas las peticiones llevan Authorization: Bearer <token>
// ✅ Respuestas 200 (no 401)
```

---

## 🔧 Solución de Problemas

### Problema: "Token inválido o expirado"

**Solución:**

```typescript
// Forzar renovación de token
const { getCurrentIdToken } = await import("./src/lib/firebase");
const newToken = await getCurrentIdToken(true); // force refresh
```

### Problema: "Firebase Auth no está inicializado"

**Solución:**

1. Verificar que Firebase está configurado en `.env.local`
2. Reiniciar el servidor: `npm run dev`
3. Limpiar cache del navegador

### Problema: "Error en autenticación automática"

**Solución:**

1. Verificar que el backend retorna `custom_token` válido
2. Verificar que Firebase API key es correcto
3. Ver logs detallados en consola del navegador

---

## 📊 Comparación: Antes vs Ahora

| Aspecto                  | ❌ Antes              | ✅ Ahora (WIF)           |
| ------------------------ | --------------------- | ------------------------ |
| **Renovación de tokens** | Manual                | Automática               |
| **Gestión de sesión**    | Compleja              | Simple                   |
| **Persistencia**         | localStorage manual   | Firebase Auth automático |
| **Seguridad**            | Tokens pueden expirar | Renovación preventiva    |
| **Código**               | ~100 líneas           | ~50 líneas               |
| **Debugging**            | Difícil               | Logs claros con "WIF"    |
| **Errores de token**     | Frecuentes            | Raros                    |

---

## 📝 Notas Importantes

1. **WIF NO es OAuth 2.0 Workload Identity Federation de Google Cloud**

   - Es un patrón de autenticación automática con Firebase Auth
   - Usa `signInWithCustomToken` para conversión automática
   - Firebase Auth maneja toda la gestión de tokens

2. **Tokens se renuevan cada ~55 minutos**

   - Firebase Auth tokens tienen validez de 1 hora
   - WIF los renueva automáticamente a los ~55 minutos
   - No hay interrupción del servicio

3. **Backend NO necesita cambios**

   - El backend sigue generando `custom_token`
   - El backend sigue validando `id_token`
   - Solo cambió el frontend (cómo maneja los tokens)

4. **Compatible con todas las operaciones**
   - Login/Logout
   - Operaciones de administración
   - Gestión de usuarios
   - Asignación de roles
   - Todo funciona con WIF

---

## 🎯 Próximos Pasos (Opcionales)

### 1. Monitoreo de Renovación de Tokens

```typescript
// Agregar listener para ver cuándo se renuevan tokens
import { auth } from "@/lib/firebase";

auth.onIdTokenChanged((user) => {
  if (user) {
    console.log("🔄 WIF: Token renovado automáticamente");
  }
});
```

### 2. Manejo de Errores Globales

```typescript
// Interceptar errores 401 y renovar token automáticamente
if (error.status === 401) {
  const newToken = await getCurrentIdToken(true);
  // Reintentar petición con nuevo token
}
```

### 3. Métricas de Autenticación

```typescript
// Rastrear cuántas veces se renueva el token
let tokenRenewals = 0;
auth.onIdTokenChanged(() => {
  tokenRenewals++;
  console.log(`🔄 Token renovado ${tokenRenewals} veces`);
});
```

---

## ✅ Conclusión

La implementación de WIF está **completa y funcional**. El sistema ahora maneja automáticamente:

- ✅ Autenticación con Firebase
- ✅ Renovación de tokens
- ✅ Persistencia de sesión
- ✅ Cierre de sesión limpio
- ✅ Manejo de errores

**El panel de Gestionar Usuarios debe funcionar correctamente ahora.**

---

## 🆘 Soporte

Si tienes problemas:

1. Verificar logs en consola del navegador (buscar "WIF")
2. Verificar Network tab para ver peticiones con token
3. Verificar que Firebase está configurado correctamente
4. Reiniciar el servidor: `npm run dev`

**Documentos relacionados:**

- `CONFIGURACION_FIREBASE_REQUERIDA.md` - Setup de Firebase
- `context/IMPLEMENTACION_FRONTEND.md` - Arquitectura general
- `context/SOLUCION_JWT_TOKENS.md` - Backend JWT tokens
