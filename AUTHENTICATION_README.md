# Sistema de Autenticación - Dashboard Alcaldía Cali

## 📋 Descripción

Sistema de autenticación completo integrado con la API de FastAPI y Firebase Authentication. Proporciona login con email/contraseña, registro de usuarios, y autenticación con Google.

## 🚀 Características Implementadas

### ✅ Autenticación Completa

- **Login con Email/Contraseña**: Integrado con el endpoint `/auth/login` de la API
- **Registro de Usuarios**: Integrado con el endpoint `/auth/register` de la API
- **Google Authentication**: Integrado con el endpoint `/auth/google` de la API
- **Validación de Sesión**: Integrado con el endpoint `/auth/validate-session` de la API

### ✅ Gestión de Sesiones

- **Persistencia de Sesión**: Opción "Recordar sesión" guarda en localStorage
- **Sesión Temporal**: Sin "recordar" guarda en sessionStorage
- **Validación Automática**: Verifica sesiones al cargar la aplicación
- **Logout Seguro**: Limpia todas las sesiones almacenadas

### ✅ Interfaz de Usuario

- **Diseño Moderno**: Interface inspirada en mejores prácticas de autenticación
- **Responsivo**: Optimizado para móviles, tablets y desktop
- **Animaciones Fluidas**: Transiciones suaves con Framer Motion
- **Tema Oscuro/Claro**: Compatible con el sistema de temas existente
- **Estados de Carga**: Indicadores visuales durante las operaciones

### ✅ Seguridad

- **Validación en Tiempo Real**: Verificación de formatos de entrada
- **Manejo de Errores**: Mensajes de error claros y útiles
- **Protección de Rutas**: Middleware que protege el acceso a la aplicación
- **Tokens Seguros**: Manejo seguro de tokens de autenticación

## 🛠️ Configuración

### 1. Variables de Entorno

Asegúrate de configurar las siguientes variables en tu archivo `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://gestorproyectoapi-production.up.railway.app

# Firebase Configuration (para Google Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=tu-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=unidad-cumplimiento-aa245.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=unidad-cumplimiento-aa245
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=unidad-cumplimiento-aa245.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=tu-app-id
```

### 2. Dependencias Instaladas

Las siguientes dependencias fueron agregadas al proyecto:

```json
{
  "firebase": "^10.x.x",
  "react-firebase-hooks": "^5.x.x"
}
```

## 📁 Estructura de Archivos Creados/Modificados

```
src/
├── components/
│   ├── AuthWrapper.tsx          # Componente wrapper para proteger la app
│   ├── LoginPage.tsx           # Página de login completa
│   └── Header.tsx              # Actualizado con info de usuario
├── context/
│   └── AuthContext.tsx         # Contexto global de autenticación
├── services/
│   └── authService.ts          # Servicio para comunicación con API
├── types/
│   └── auth.ts                 # Tipos TypeScript para autenticación
├── app/
│   ├── layout.tsx              # Actualizado con AuthProvider
│   └── middleware.ts           # Middleware de autenticación
└── .env.local                  # Variables de entorno actualizadas
```

## 🔄 Flujo de Autenticación

### 1. Inicio de la Aplicación

1. La aplicación verifica si existe una sesión guardada
2. Si existe, valida la sesión con la API
3. Si es válida, muestra la aplicación principal
4. Si no es válida o no existe, muestra la página de login

### 2. Login con Email/Contraseña

1. Usuario ingresa credenciales
2. Se envían al endpoint `/auth/login` de la API
3. Si son válidas, se guarda la sesión localmente
4. Se redirige a la aplicación principal

### 3. Login con Google

1. Usuario hace clic en "Continuar con Google"
2. Se abre popup de Google Authentication
3. Se obtiene el token de Google
4. Se envía al endpoint `/auth/google` de la API
5. Si es válido, se guarda la sesión localmente
6. Se redirige a la aplicación principal

### 4. Registro de Usuario

1. Usuario llena el formulario de registro
2. Se validan los datos en tiempo real
3. Se envían al endpoint `/auth/register` de la API
4. Si es exitoso, se guarda la sesión automáticamente
5. Se redirige a la aplicación principal

## 🎨 Características de UI/UX

### Página de Login

- **Logo prominente** de la Alcaldía de Cali
- **Pestañas** para alternar entre Login y Registro
- **Botón de Google** prominente y fácil de usar
- **Validación visual** en tiempo real
- **Mensajes de error** claros y útiles
- **Estados de carga** durante las operaciones

### Header de Usuario

- **Avatar del usuario** (foto de perfil o inicial)
- **Nombre y email** del usuario autenticado
- **Botón de logout** fácil de encontrar
- **Diseño responsivo** para móviles

## 🔧 API Endpoints Utilizados

### GET /auth/config

- **Propósito**: Obtener configuración de Firebase
- **Uso**: Inicialización del servicio de autenticación

### POST /auth/login

- **Propósito**: Validar credenciales de email/contraseña
- **Payload**: `{ email, password }`
- **Respuesta**: `{ success, user, message }`

### POST /auth/register

- **Propósito**: Crear nueva cuenta de usuario
- **Payload**: `{ fullname, email, password, cellphone?, nombre_centro_gestor? }`
- **Respuesta**: `{ success, user, message }`

### POST /auth/google

- **Propósito**: Autenticar con token de Google
- **Payload**: `{ google_token }`
- **Respuesta**: `{ success, user, message }`

### POST /auth/validate-session

- **Propósito**: Validar sesión activa
- **Headers**: `Authorization: Bearer {token}`
- **Payload**: `{ id_token }`
- **Respuesta**: `{ success, user, message }`

## 🚨 Manejo de Errores

El sistema maneja elegantemente los siguientes tipos de errores:

- **Credenciales inválidas**: Mensaje claro al usuario
- **Problemas de red**: Indicación de problema de conexión
- **Errores de validación**: Mensajes específicos por campo
- **Sesiones expiradas**: Redirección automática al login
- **Errores de Google Auth**: Manejo específico de errores de OAuth

## 🔐 Seguridad Implementada

- **Validación de entrada** en tiempo real
- **Sanitización de datos** antes de envío
- **Manejo seguro de tokens** sin exposición en logs
- **Limpieza automática** de sesiones expiradas
- **Protección contra ataques CSRF** mediante tokens
- **Validación de dominio** para registro (@cali.gov.co)

## 📱 Responsividad

El sistema es completamente responsivo y funciona perfectamente en:

- **Desktop**: Experiencia completa con todas las características
- **Tablet**: Diseño adaptado para pantallas medianas
- **Mobile**: Interface optimizada para móviles con navegación simplificada

## 🎯 Próximos Pasos Sugeridos

1. **Configurar Firebase completamente** con las claves reales
2. **Implementar reset de contraseña** usando endpoint correspondiente
3. **Agregar verificación de email** para nuevos registros
4. **Implementar roles y permisos** basados en la respuesta del usuario
5. **Agregar logs de auditoría** para eventos de autenticación
6. **Configurar refresh tokens** para sesiones de larga duración

## 🐛 Troubleshooting

### Problema: Error de inicialización de Firebase

**Solución**: Verificar que las variables de entorno estén configuradas correctamente

### Problema: Login no funciona

**Solución**: Verificar que la API esté accesible y el endpoint `/auth/login` responda

### Problema: Google Auth no funciona

**Solución**: Configurar correctamente las claves de Firebase y verificar el dominio autorizado

### Problema: Sesión no se mantiene

**Solución**: Verificar que localStorage/sessionStorage estén habilitados en el navegador

---

## 📞 Soporte

Para problemas o dudas sobre el sistema de autenticación, contacta al equipo de desarrollo del Dashboard Alcaldía Cali.

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
