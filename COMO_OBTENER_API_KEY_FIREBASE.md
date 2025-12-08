# 🔥 Cómo Obtener API Key Válido de Firebase

## ❌ Problema Actual

```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

El API Key en `.env.local` es inválido o ha sido revocado.

---

## ✅ Solución Paso a Paso

### Paso 1: Ir a Firebase Console

1. Abre: https://console.firebase.google.com/
2. Selecciona el proyecto: **unidad-cumplimiento-aa245**

### Paso 2: Verificar/Crear Web App

#### Si YA existe una Web App:

1. Click en ⚙️ **Settings** (esquina superior izquierda)
2. **Project settings**
3. Scroll hasta la sección **"Your apps"**
4. Busca el ícono **</>** (Web)
5. Verás algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...", // ← ESTE es el que necesitas
  authDomain: "unidad-cumplimiento-aa245.firebaseapp.com",
  projectId: "unidad-cumplimiento-aa245",
  // ...
};
```

6. **Copia el `apiKey` exacto**

#### Si NO existe una Web App:

1. Click en ⚙️ **Settings** → **Project settings**
2. Scroll hasta **"Your apps"**
3. Click en el botón **"Add app"** o **</>** (Web icon)
4. Dale un nombre: `"Gestor Proyectos Web"`
5. **NO** marques "Firebase Hosting"
6. Click **"Register app"**
7. Copia las credenciales que aparecen

### Paso 3: Actualizar .env.local

Abre el archivo `.env.local` y reemplaza SOLO el API Key:

```env
# ANTES (inválido)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDC8K9i8xLl7XhT_pMBKEr9qJ9W0RyXbcg

# DESPUÉS (el que copiaste de Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy_TU_API_KEY_REAL_AQUI
```

**Los demás valores ya están correctos:**

```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=574623423766
NEXT_PUBLIC_FIREBASE_APP_ID=1:574623423766:web:f8e3a47e947fb64b25bfe9
```

### Paso 4: Reiniciar el Servidor

```powershell
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

### Paso 5: Limpiar Sesión y Re-Login

```powershell
# Opción A: Usar la página web
# Ir a: http://localhost:3000/clear-session.html

# Opción B: En consola del navegador
localStorage.clear();
sessionStorage.clear();
location.href = '/login';
```

---

## 🔍 Verificar que Funciona

Después de actualizar el API Key y reiniciar:

1. **Abrir la consola del navegador** (F12)
2. **Hacer login**
3. **Verificar que NO aparece** el error de API Key
4. **Deberías ver:**
   ```
   ✅ Firebase initialized with WIF support
   🔐 WIF: Iniciando autenticación automática...
   ✅ WIF: Autenticación exitosa
   ```

---

## 🚨 Notas Importantes

### ¿Por qué el API Key actual es inválido?

Posibles causas:

1. **Fue revocado** en Firebase Console
2. **Pertenece a otro proyecto** de Firebase
3. **Es un placeholder** de ejemplo/documentación
4. **Restricciones de API Key** lo bloquean

### ¿El API Key es secreto?

**NO**, el API Key de Firebase para web apps es PÚBLICO:

- Va al navegador del cliente
- Firebase lo protege con reglas de seguridad
- Es seguro compartirlo en el código del frontend

Sin embargo, debes configurar **Security Rules** en Firestore para proteger los datos.

---

## 📋 Checklist

- [ ] Ir a Firebase Console
- [ ] Verificar proyecto: unidad-cumplimiento-aa245
- [ ] Obtener API Key de la Web App
- [ ] Actualizar `.env.local`
- [ ] Reiniciar servidor con `npm run dev`
- [ ] Limpiar sesión del navegador
- [ ] Hacer login nuevamente
- [ ] Verificar que funciona sin errores

---

## 🆘 Si el Problema Persiste

1. **Verificar que el API Key está correcto:**

   - Debe empezar con `AIzaSy...`
   - Debe tener ~39 caracteres
   - No debe tener espacios ni saltos de línea

2. **Verificar que el proyecto es el correcto:**

   - Project ID: `unidad-cumplimiento-aa245`
   - Debe ser el mismo proyecto del backend

3. **Verificar restricciones del API Key:**

   - En Firebase Console → APIs & Services
   - Credentials → API Key
   - Verificar que no tenga restricciones que bloqueen tu dominio

4. **Crear un nuevo API Key si es necesario:**
   - Firebase Console → Project settings
   - Add app → Web
   - Generar nuevas credenciales

---

**Fecha:** 25 de Noviembre, 2025  
**Problema:** API Key inválido  
**Solución:** Obtener API Key real de Firebase Console
