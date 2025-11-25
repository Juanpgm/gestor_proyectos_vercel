# 🚨 Error 403 - Usuario sin Permisos de Super Admin

## 📋 Diagnóstico del Problema

El error **403 (Forbidden)** ocurre cuando intentas asignar roles a un usuario porque:

```
❌ El usuario actual NO tiene el rol "super_admin"
```

### ¿Por qué necesitas super_admin?

El backend **valida** que solo usuarios con rol `super_admin` puedan:

- ✅ Asignar roles a otros usuarios
- ✅ Actualizar información de usuarios
- ✅ Cambiar estado de usuarios
- ✅ Gestionar permisos del sistema

---

## 🔍 Verificar Roles del Usuario Actual

### Opción 1: Desde la consola del navegador

1. Abre la consola del navegador (F12)
2. Pega este código:

```javascript
// Verificar roles del usuario actual
const session = JSON.parse(localStorage.getItem("auth_session"));
console.log("Email:", session.user?.email);
console.log("Roles:", session.user?.roles);
console.log("¿Es super_admin?", session.user?.roles?.includes("super_admin"));
```

### Opción 2: Desde el backend

Ejecutar este comando en el backend:

```bash
# En el backend (Railway o local)
python -c "
from firebase_admin import firestore
db = firestore.client()
user = db.collection('usuarios').document('TU_UID_AQUI').get()
print('Roles:', user.to_dict().get('roles'))
"
```

---

## ✅ Soluciones

### Solución 1: Asignar super_admin desde Firebase Console (MÁS RÁPIDO)

1. **Ir a Firebase Console:**

   - https://console.firebase.google.com/
   - Seleccionar proyecto: `unidad-cumplimiento-aa245`

2. **Navegar a Firestore:**

   - Click en "Firestore Database" en el menú lateral

3. **Buscar tu usuario:**

   - Colección: `usuarios`
   - Buscar documento con tu UID o email

4. **Editar roles:**

   - Click en el documento
   - Buscar campo `roles` (es un array)
   - Agregar el valor: `"super_admin"`
   - Guardar cambios

5. **Cerrar sesión y volver a iniciar:**
   - En la aplicación, hacer logout
   - Volver a hacer login
   - Ahora tendrás permisos de super_admin

---

### Solución 2: Script de Python en el Backend

Si tienes acceso al backend, ejecutar:

```python
# assign_super_admin.py
from firebase_admin import credentials, firestore, initialize_app
import os

# Inicializar Firebase Admin
cred = credentials.Certificate('path/to/serviceAccountKey.json')
initialize_app(cred)

db = firestore.client()

# Email del usuario al que quieres dar super_admin
USER_EMAIL = 'tu_email@example.com'

# Buscar usuario por email
users = db.collection('usuarios').where('email', '==', USER_EMAIL).limit(1).get()

if not users:
    print(f'❌ Usuario no encontrado: {USER_EMAIL}')
    exit(1)

user_doc = users[0]
user_ref = user_doc.reference

# Obtener roles actuales
current_data = user_doc.to_dict()
current_roles = current_data.get('roles', [])

# Agregar super_admin si no existe
if 'super_admin' not in current_roles:
    current_roles.append('super_admin')
    user_ref.update({'roles': current_roles})
    print(f'✅ Rol super_admin asignado a {USER_EMAIL}')
else:
    print(f'⚠️ Usuario ya tiene rol super_admin')

print(f'Roles actuales: {current_roles}')
```

Ejecutar:

```bash
python assign_super_admin.py
```

---

### Solución 3: Crear Nuevo Usuario Super Admin

Si prefieres crear un usuario nuevo con super_admin desde el inicio:

```python
# create_super_admin.py
from firebase_admin import auth, firestore, initialize_app, credentials

# Inicializar
cred = credentials.Certificate('path/to/serviceAccountKey.json')
initialize_app(cred)

db = firestore.client()

# Datos del nuevo super admin
EMAIL = 'superadmin@example.com'
PASSWORD = 'SecurePassword123!'
NAME = 'Super Admin'

# Crear usuario en Firebase Auth
user = auth.create_user(
    email=EMAIL,
    password=PASSWORD,
    display_name=NAME,
    email_verified=True
)

print(f'✅ Usuario creado en Firebase Auth: {user.uid}')

# Crear documento en Firestore con rol super_admin
db.collection('usuarios').document(user.uid).set({
    'uid': user.uid,
    'email': EMAIL,
    'display_name': NAME,
    'roles': ['super_admin'],  # ✅ ROL SUPER_ADMIN
    'permissions': ['*'],       # ✅ TODOS LOS PERMISOS
    'email_verified': True,
    'disabled': False,
    'created_at': firestore.SERVER_TIMESTAMP
})

print(f'✅ Usuario super_admin creado en Firestore')
print(f'Email: {EMAIL}')
print(f'Password: {PASSWORD}')
print(f'UID: {user.uid}')
```

---

## 🧪 Verificar que Funcionó

Después de asignar el rol `super_admin`:

### 1. Cerrar sesión y volver a iniciar

```
- Logout en la aplicación
- Login nuevamente
```

### 2. Verificar en consola del navegador

```javascript
const session = JSON.parse(localStorage.getItem("auth_session"));
console.log("Roles:", session.user?.roles);
// Debe mostrar: ["super_admin"]
```

### 3. Probar operación de admin

```
- Ir a panel "Gestionar Usuarios"
- Intentar asignar rol a un usuario
- Debe funcionar sin error 403
```

---

## 🔒 Estructura de Roles en el Sistema

```javascript
// Usuario normal
{
  "roles": ["user"],
  "permissions": []
}

// Administrador
{
  "roles": ["admin"],
  "permissions": ["read_users", "update_own_profile"]
}

// Super Administrador (requerido para gestionar usuarios)
{
  "roles": ["super_admin"],
  "permissions": ["*"]  // Todos los permisos
}
```

---

## 🚨 Importante

1. **Solo asignar super_admin a usuarios de confianza**

   - Este rol tiene acceso completo al sistema
   - Puede modificar cualquier usuario
   - Puede asignar/remover roles

2. **Después de modificar roles en Firestore:**

   - El usuario DEBE cerrar sesión
   - Y volver a iniciar sesión
   - Para que el nuevo token incluya los roles actualizados

3. **Los roles se leen del token JWT:**
   - El backend valida roles desde el token, no desde Firestore directamente
   - Por eso es necesario re-login después de cambiar roles

---

## 📊 Flujo del Problema

```
Usuario hace login
    ↓
Backend genera custom_token (con roles actuales)
    ↓
Frontend convierte a id_token
    ↓
id_token contiene roles en los claims
    ↓
Usuario intenta asignar rol a otro usuario
    ↓
Backend verifica si el token tiene rol "super_admin"
    ↓
❌ Si NO tiene → Error 403 Forbidden
✅ Si tiene → Operación exitosa
```

---

## 💡 Solución Rápida (3 pasos)

1. **Ir a Firebase Console → Firestore**
2. **Editar documento del usuario → Agregar "super_admin" al array de roles**
3. **Logout y Login nuevamente en la app**

Después de esto, el error 403 debe desaparecer.

---

## 🆘 Si el Problema Persiste

Si después de asignar `super_admin` aún ves el error 403:

1. **Verificar que el token se está renovando:**

   ```javascript
   // En consola del navegador
   const { getCurrentIdToken } = await import("./src/lib/firebase.ts");
   const token = await getCurrentIdToken(true); // Force refresh
   console.log("Token renovado");
   ```

2. **Verificar que el token contiene los roles:**

   ```javascript
   const { getCurrentIdToken } = await import("./src/lib/firebase.ts");
   const token = await getCurrentIdToken();
   const payload = JSON.parse(atob(token.split(".")[1]));
   console.log("Roles en token:", payload.roles);
   ```

3. **Verificar logs del backend:**
   - Ver los logs de Railway
   - Buscar mensajes relacionados con autorización
   - Confirmar que el backend está validando el token correctamente

---

**Fecha:** 25 de Noviembre, 2025  
**Problema:** Error 403 al asignar roles  
**Causa:** Usuario sin rol super_admin  
**Solución:** Asignar super_admin en Firebase Console
