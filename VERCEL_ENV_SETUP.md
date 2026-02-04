# Configuración de Variables de Entorno para Vercel

## 🚨 PROBLEMA IDENTIFICADO

El login no funciona en producción porque faltan variables de entorno en Vercel.

## ✅ SOLUCIÓN: Configurar Variables en Vercel

### Paso 1: Ir a Vercel Dashboard

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **Environment Variables**

### Paso 2: Agregar TODAS estas variables:

#### 🔥 Firebase Configuration (CRÍTICAS)

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDksn0gagNfoms5NfQ58qGXmxyRbgTLcvc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=calitrack-44403.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=calitrack-44403
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=calitrack-44403.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=265506558722
NEXT_PUBLIC_FIREBASE_APP_ID=1:265506558722:web:772b87fd0ecfe2e9b5281b
```

#### 🌐 API Configuration (CRÍTICA)

```
NEXT_PUBLIC_API_BASE_URL=https://gestorproyectoapi-production.up.railway.app
NEXT_PUBLIC_API_URL=https://gestorproyectoapi-production.up.railway.app
```

#### 📱 App Configuration

```
NEXT_PUBLIC_APP_NAME=Dashboard Alcaldía Cali
NEXT_PUBLIC_APP_VERSION=16.0.0
NEXT_PUBLIC_BASE_URL=https://tu-app.vercel.app
```

### Paso 3: Configurar para TODOS los entornos

- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### Paso 4: Redeplegar

1. Después de agregar las variables, redeplegar:
   - Push un commit nuevo, o
   - Ve a Deployments → "..." → "Redeploy"

## 🔧 VERIFICACIÓN POST-DEPLOY

### Test 1: Variables de Entorno

Ve a: `https://tu-app.vercel.app/debug-production.html`
Debe mostrar todas las variables configuradas.

### Test 2: API Connectivity

En la página de debug:

1. Click "Probar Proxy"
2. Click "Probar Backend Directo"
3. Click "Probar Registro"

### Test 3: Firebase

Debe mostrar: "Firebase initialized successfully" en la consola del navegador.

## 🎯 CHECKLIST CRÍTICO

- [ ] NEXT_PUBLIC_API_BASE_URL configurada en Vercel
- [ ] Todas las variables Firebase configuradas
- [ ] Variables aplicadas a Production, Preview y Development
- [ ] Aplicación redeplegada después de configurar variables
- [ ] Test de debug-production.html exitoso
- [ ] Login funcionando en producción

## ⚡ COMANDO RÁPIDO

Para verificar que las variables estén bien configuradas, agrega esto temporal a tu código:

```javascript
console.log("🔧 DEBUG ENV VARS:", {
  apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  firebaseKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + "...",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
```
