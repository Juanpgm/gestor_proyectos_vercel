# ⚠️ Configuración de Firebase Requerida

## 🔴 Problema Actual

El panel de **Gestionar Usuarios** no funciona porque la aplicación está usando credenciales de Firebase de **placeholder** (valores de prueba).

### Síntomas:

- ❌ Error: `Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)`
- ❌ Operaciones de administración retornan 401 (no autorizado)
- ❌ No se pueden asignar roles a usuarios
- ❌ No se puede crear/editar/eliminar usuarios

### Causa Raíz:

El backend valida que los tokens de Firebase sean válidos. Los tokens generados con credenciales de placeholder son inválidos y el backend los rechaza.

---

## ✅ Solución: Obtener Credenciales Reales de Firebase

### Paso 1: Acceder a Firebase Console

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **unidad-cumplimiento-aa245**

### Paso 2: Obtener Credenciales

1. En el menú lateral, haz clic en el ícono de **⚙️ Configuración** (esquina superior izquierda)
2. Selecciona **Configuración del proyecto** (Project Settings)
3. En la pestaña **General**, desplázate hasta la sección **Tus aplicaciones** (Your apps)
4. Si ya existe una aplicación web registrada:
   - Haz clic en la aplicación web existente
   - Copia las credenciales que se muestran
5. Si NO existe una aplicación web:
   - Haz clic en el botón **</>** (Web) para agregar una aplicación web
   - Dale un nombre a la app (ejemplo: "Gestor Proyectos Web")
   - NO necesitas configurar Firebase Hosting
   - Copia las credenciales que se muestran

### Paso 3: Copiar las Credenciales

Verás algo como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "unidad-cumplimiento-aa245.firebaseapp.com",
  projectId: "unidad-cumplimiento-aa245",
  storageBucket: "unidad-cumplimiento-aa245.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

### Paso 4: Actualizar .env.local

Abre el archivo `.env.local` en la raíz del proyecto y reemplaza los valores de placeholder:

```env
# ✅ REEMPLAZA ESTOS VALORES CON LOS REALES DE FIREBASE CONSOLE
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### Paso 5: Reiniciar el Servidor

```powershell
# Detener el servidor (Ctrl+C en el terminal)
# Luego reiniciar:
npm run dev
```

---

## 🎯 Verificación

Después de configurar las credenciales reales:

1. ✅ La consola del navegador NO debe mostrar el error `auth/api-key-not-valid`
2. ✅ Al hacer login, debes ver en la consola: `✅ Firebase initialized successfully`
3. ✅ Las operaciones en el panel de Gestionar Usuarios deben funcionar:
   - Crear usuarios
   - Editar usuarios
   - Asignar roles
   - Ver listado de usuarios

---

## 📋 Arquitectura Actual (Para Referencia)

### Flujo de Autenticación:

```
1. Usuario ingresa email/password en frontend
2. Frontend envía credenciales a backend /auth/login
3. Backend valida credenciales y genera custom_token de Firebase
4. Frontend usa signInWithCustomToken() para convertir custom_token a id_token
5. Frontend almacena id_token en Firebase Auth
6. Cada petición al backend incluye id_token en el header Authorization
7. Backend valida id_token y extrae roles/permisos
```

### Archivos Clave:

- `src/lib/firebase.ts` - Inicialización de Firebase SDK
- `src/services/authService.ts` - Servicio de autenticación (login/logout)
- `src/services/api.ts` - Cliente API con inyección automática de tokens
- `src/services/admin.service.ts` - Operaciones de administración de usuarios

---

## ⚠️ Importante

- **NO compartas** las credenciales de Firebase en repositorios públicos
- El archivo `.env.local` está en `.gitignore` (no se sube a Git)
- Estas credenciales son **PÚBLICAS** (van al navegador), pero Firebase tiene reglas de seguridad para proteger los datos
- El backend siempre valida los tokens antes de permitir operaciones sensibles

---

## 🆘 ¿Necesitas Ayuda?

Si no tienes acceso a Firebase Console:

1. Contacta al administrador del proyecto Firebase
2. Solicita acceso al proyecto `unidad-cumplimiento-aa245`
3. O solicita que te envíen las credenciales de la aplicación web

---

**Estado Actual:** ⏳ Esperando configuración de credenciales reales de Firebase
**Bloqueador:** Sin credenciales válidas, el panel de administración no puede funcionar
**Siguiente Paso:** Obtener y configurar credenciales de Firebase Console
