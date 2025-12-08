# 🚨 PROBLEMA CRÍTICO: Panel de Gestionar Usuarios No Funciona

## ❌ Error Identificado

```
POST /api/proxy/auth/admin/users/.../roles 401 Unauthorized
PUT /api/proxy/auth/admin/users/... 401 Unauthorized
```

**Todas las operaciones de administración retornan 401 (No autorizado)**

## 🔍 Causa Raíz

El backend requiere un **token de Firebase válido** para endpoints protegidos:

```
Login → Backend retorna custom_token
      ↓
custom_token debe convertirse a id_token usando Firebase
      ↓
Firebase requiere API Key VÁLIDA (actualmente es placeholder)
      ↓
Sin API Key válida = Sin id_token válido
      ↓
Backend rechaza peticiones con 401
```

## ✅ SOLUCIÓN: Configurar Firebase (5 minutos)

### Paso 1: Obtener Credenciales de Firebase Console

1. **Ir a:** https://console.firebase.google.com/
2. **Seleccionar proyecto:** `unidad-cumplimiento-aa245`
3. **Click en ⚙️** (Settings) → **Project settings**
4. **Scroll a "Your apps"** → Click en la app Web (ícono `</>`)
5. **Copiar valores:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...", // ← Copiar este
     authDomain: "unidad-cumplimiento-aa245.firebaseapp.com",
     projectId: "unidad-cumplimiento-aa245",
     storageBucket: "unidad-cumplimiento-aa245.appspot.com",
     messagingSenderId: "...", // ← Copiar este
     appId: "1:...:web:...", // ← Copiar este
   };
   ```

### Paso 2: Actualizar .env.local

Abre `A:\programing_workspace\gestor_proyectos_vercel\.env.local` y reemplaza:

```env
# Reemplazar estas 3 líneas con valores reales:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy... ← Pegar apiKey completo
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123... ← Pegar messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:... ← Pegar appId completo
```

### Paso 3: Reiniciar Servidor

```powershell
# Detener servidor actual (Ctrl+C)
npm run dev
```

### Paso 4: Verificar

1. Login nuevamente
2. Ir a **Admin → Gestionar Usuarios**
3. Intentar asignar rol a un usuario
4. Debería funcionar ✅

## 📊 Qué Funciona y Qué NO

### ❌ SIN Firebase configurado (Estado Actual)

- ❌ Asignar/remover roles
- ❌ Actualizar información de usuarios
- ❌ Cambiar estado (activar/desactivar)
- ❌ Cambiar centro gestor
- ❌ Todas las operaciones de administración
- ✅ Login básico funciona
- ✅ Ver lista de usuarios funciona

### ✅ CON Firebase configurado

- ✅ Todas las operaciones de administración
- ✅ Asignar/remover roles
- ✅ Actualizar usuarios
- ✅ Cambiar estado
- ✅ Google Sign-In
- ✅ Tokens renovados automáticamente

## 🔧 Verificación Técnica

### Logs Actuales (Problema)

```
⚠️ Firebase disabled - using fallback authentication
🔄 Using fallback authentication (direct backend)
🌐 Proxying POST .../roles 401 ← ERROR AQUÍ
```

### Logs Esperados (Solución)

```
✅ Firebase initialized successfully
✅ Firebase authentication successful
✅ ID token obtained: eyJhbGci...
🌐 Proxying POST .../roles 200 ← ÉXITO
```

## ⚡ Alternativa Temporal (NO Recomendada)

Si no puedes acceder a Firebase Console ahora mismo:

**Contacta al administrador del proyecto Firebase** para que te proporcione las 3 credenciales necesarias:

- `apiKey`
- `messagingSenderId`
- `appId`

## 📝 Archivos Relevantes

- `INSTRUCCIONES_FIREBASE.md` - Guía completa paso a paso
- `.env.local` - Archivo a modificar (líneas 12-17)
- `SOLUCION_FIREBASE_FALLBACK.md` - Explicación técnica

## ⏰ Tiempo Estimado

- ⚡ Con acceso a Firebase Console: **5 minutos**
- 📧 Esperando credenciales del admin: **Depende de respuesta**

---

**Estado Actual:** ❌ Panel de Gestionar Usuarios NO funcional  
**Causa:** Credenciales Firebase inválidas (placeholders)  
**Solución:** Actualizar 3 variables en `.env.local` con valores reales  
**Tiempo:** 5 minutos si tienes acceso a Firebase Console
