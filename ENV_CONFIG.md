# 🔒 Configuración de Variables de Entorno

Este documento explica cómo configurar las variables de entorno necesarias para el funcionamiento seguro de la aplicación.

## 📁 Archivos de Configuración

### `.env.local` (Desarrollo Local - NO COMMITEAR)

Archivo para desarrollo local que contiene todas las variables necesarias. Este archivo **NO debe ser commiteado** al repositorio.

### `.env.example`

Plantilla con todas las variables necesarias pero sin valores reales. Este archivo sí puede ser commiteado.

## 🔧 Configuración Requerida

### 1. Variables de API (OBLIGATORIAS)

```bash
# URL base de la API de autenticación
NEXT_PUBLIC_API_BASE_URL=https://tu-api-production.com
```

⚠️ **IMPORTANTE**: Sin esta variable, la aplicación no funcionará.

### 2. Variables de Firebase (Para Google Auth)

```bash
# Configuración de Firebase para Google Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=tu-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Variables de Aplicación (Opcionales)

```bash
# Información de la aplicación
NEXT_PUBLIC_APP_NAME=Dashboard Alcaldía Cali
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_ENV=development

# Configuración de debugging
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_ENABLE_LOGS=true
```

## 🛠️ Configuración por Entorno

### Desarrollo Local

1. Copia `.env.example` a `.env.local`
2. Reemplaza los valores con las credenciales reales
3. Nunca commitees `.env.local`

### Vercel (Producción)

1. Ve a tu proyecto en Vercel Dashboard
2. Ve a Settings > Environment Variables
3. Agrega cada variable con su valor correspondiente
4. Asegúrate de seleccionar el entorno correcto (Production, Preview, Development)

### Otras Plataformas

- **Netlify**: Site Settings > Environment Variables
- **Railway**: Project Settings > Variables
- **Heroku**: Settings > Config Vars

## 🔐 Seguridad de Credenciales

### ✅ Buenas Prácticas

- ✅ Usar variables de entorno para todas las credenciales
- ✅ Nunca hardcodear URLs o claves en el código
- ✅ Diferentes valores para desarrollo/producción
- ✅ Validar variables requeridas al inicio de la aplicación
- ✅ Usar prefijo `NEXT_PUBLIC_` solo para variables que deben ser públicas

### ❌ Evitar

- ❌ Commitear archivos `.env*` con credenciales reales
- ❌ Incluir credenciales en el código fuente
- ❌ Compartir credenciales por chat o email
- ❌ Usar las mismas credenciales en todos los entornos

## 🚨 Validación de Configuración

La aplicación incluye validación automática de variables de entorno:

```typescript
// En desarrollo, la aplicación validará que todas las variables requeridas estén presentes
if (NODE_ENV === "development") {
  validateEnvironmentConfig();
}
```

Si faltan variables requeridas, verás advertencias en la consola.

## 📋 Checklist de Configuración

### Para Desarrolladores

- [ ] Copiar `.env.example` a `.env.local`
- [ ] Configurar `NEXT_PUBLIC_API_BASE_URL`
- [ ] Configurar variables de Firebase (si usas Google Auth)
- [ ] Verificar que no hay errores de validación en la consola
- [ ] Confirmar que `.env.local` está en `.gitignore`

### Para Despliegue

- [ ] Configurar todas las variables en la plataforma de hosting
- [ ] Usar URLs de producción (no localhost)
- [ ] Usar credenciales de producción
- [ ] Probar la aplicación en el entorno de despliegue
- [ ] Verificar que las variables se carguen correctamente

## 🔍 Troubleshooting

### Error: "NEXT_PUBLIC_API_BASE_URL no está configurada"

**Solución**: Agrega la variable a tu archivo `.env.local` o en la configuración de tu plataforma de hosting.

### Error: "Failed to fetch auth config"

**Solución**: Verifica que la URL de la API sea correcta y que la API esté funcionando.

### Error: Google Auth no funciona

**Solución**: Verifica que todas las variables de Firebase estén configuradas correctamente.

### Variables no se cargan en producción

**Solución**: Verifica que las variables estén configuradas en tu plataforma de hosting y que tengan el prefijo `NEXT_PUBLIC_` si deben ser accesibles en el cliente.

## 🔗 Enlaces Útiles

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Console](https://console.firebase.google.com/)

---

**⚠️ RECORDATORIO**: Nunca commitees archivos con credenciales reales. Siempre usa variables de entorno para información sensible.
