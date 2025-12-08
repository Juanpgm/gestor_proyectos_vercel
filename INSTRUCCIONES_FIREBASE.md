# 🔥 Configuración de Firebase - Instrucciones

## ⚠️ PASO CRÍTICO: Obtener Credenciales Reales de Firebase

El archivo `.env.local` actualmente contiene **valores de placeholder**. Necesitas reemplazarlos con las credenciales reales de tu proyecto Firebase.

---

## 📋 Cómo Obtener las Credenciales

### 1. Ir a Firebase Console

Ve a: [https://console.firebase.google.com/](https://console.firebase.google.com/)

### 2. Seleccionar el Proyecto

- Selecciona el proyecto: **unidad-cumplimiento-aa245**
- Si no tienes acceso, contacta al administrador del proyecto

### 3. Ir a Project Settings

1. Haz clic en el ícono de **⚙️ configuración** (arriba a la izquierda)
2. Selecciona **Project settings**

### 4. Encontrar las Credenciales

1. En la pestaña **General**, desplázate hasta **Your apps**
2. Si ya existe una Web App:
   - Haz clic en la app web existente
   - Verás el código de configuración con los valores reales
3. Si NO existe una Web App:
   - Haz clic en el botón **Add app** (agregar aplicación)
   - Selecciona el ícono **</>** (Web)
   - Dale un nombre (ej: "gestor-proyectos-frontend")
   - Haz clic en **Register app**
   - Copia las credenciales que aparecen

### 5. Copiar las Credenciales

Verás algo como esto:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDpQhMV6TLfJz8nT5c4_Zyx-5wE...",
  authDomain: "unidad-cumplimiento-aa245.firebaseapp.com",
  projectId: "unidad-cumplimiento-aa245",
  storageBucket: "unidad-cumplimiento-aa245.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123def456...",
};
```

### 6. Actualizar `.env.local`

Abre el archivo `.env.local` y reemplaza los valores:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDpQhMV6TLfJz8nT5c4_Zyx-5wE...  # ← Copiar de apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com  # ← Copiar de authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245  # ← Copiar de projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com  # ← Copiar de storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890  # ← Copiar de messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123...  # ← Copiar de appId
```

---

## ✅ Verificar la Configuración

Después de actualizar las credenciales:

### 1. Reiniciar el Servidor de Desarrollo

```bash
npm run dev
```

### 2. Abrir la Consola del Navegador

1. Abre la aplicación en el navegador
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Busca el mensaje: `✅ Firebase initialized successfully`

### 3. Intentar Login

1. Ve a la página de login
2. Ingresa credenciales válidas
3. Deberías ver en la consola:
   - `🔐 Attempting login with Firebase Auth SDK:`
   - `✅ Firebase authentication successful`
   - `✅ ID token obtained:`
   - `✅ Backend validation successful:`
   - `✅ Login complete:`

---

## 🚨 Errores Comunes

### Error: "Firebase configuration is missing"

**Causa:** Las variables de entorno no están configuradas correctamente.

**Solución:**

1. Verifica que `.env.local` tenga las credenciales reales
2. Reinicia el servidor (`npm run dev`)
3. Limpia la caché: `npm run clean`

### Error: "Firebase: Error (auth/invalid-api-key)"

**Causa:** El `apiKey` es incorrecto.

**Solución:**

1. Verifica que copiaste el `apiKey` completo de Firebase Console
2. No debe contener espacios ni saltos de línea

### Error: "auth/operation-not-allowed"

**Causa:** El método de autenticación no está habilitado en Firebase.

**Solución:**

1. Ve a Firebase Console
2. Authentication → Sign-in method
3. Habilita **Email/Password**
4. Habilita **Google** (si usas Google Sign-In)

---

## 📝 Checklist de Configuración

- [ ] Accedí a Firebase Console
- [ ] Encontré el proyecto `unidad-cumplimiento-aa245`
- [ ] Obtuve las credenciales de la Web App
- [ ] Actualicé `.env.local` con los valores reales
- [ ] Reinicié el servidor de desarrollo
- [ ] Vi el mensaje `✅ Firebase initialized successfully`
- [ ] Probé el login y funcionó correctamente

---

## 🔒 Seguridad

### Variables de Entorno

- **`.env.local`** NO debe subirse a Git (ya está en `.gitignore`)
- Las credenciales de Firebase son **públicas** (están en el frontend)
- La seguridad viene de las **Firebase Security Rules** (backend)

### Firebase Security Rules

El backend de Firebase debe tener reglas de seguridad configuradas. Esto NO se maneja en el frontend.

---

## 📞 Contacto

Si no tienes acceso al proyecto Firebase:

1. Contacta al administrador del sistema
2. Solicita ser agregado al proyecto `unidad-cumplimiento-aa245`
3. O solicita las credenciales de la Web App

---

**Última actualización:** 25 de Noviembre, 2025
