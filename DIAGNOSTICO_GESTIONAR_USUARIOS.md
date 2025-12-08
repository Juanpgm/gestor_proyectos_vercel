# 🔍 Diagnóstico: Panel "Gestionar Usuarios" No Visible

## ✅ Cambios Implementados

1. **Agregados logs de debug en múltiples puntos:**

   - `authService.mapApiUser()` - Para ver datos del backend
   - `Sidebar` - Para verificar estado de autenticación
   - `Dashboard` - Para verificar contexto global
   - Nueva página de prueba: `/test-auth`

2. **Build exitoso:** ✅ Sin errores de compilación

---

## 🧪 Pasos para Diagnosticar

### **Paso 1: Página de Prueba Dedicada**

1. Inicia sesión en la aplicación con tu usuario super_admin
2. Navega a: **`http://localhost:3001/test-auth`** (o puerto 3000)
3. Verás una página con toda la información de autenticación

**Lo que debes verificar:**

- ✅ ¿Aparece tu email?
- ✅ ¿Hay roles asignados?
- ✅ ¿Dice "Es Super Admin: ✅ Sí"?
- ❌ ¿Los roles aparecen vacíos?

---

### **Paso 2: Revisar Consola del Navegador**

1. Abre las DevTools (F12)
2. Ve a la pestaña **Console**
3. Busca estos logs:

#### A) Logs de Login (cuando inicias sesión):

```
🔍 DEBUG mapApiUser - apiUser completo: {...}
🔍 DEBUG mapApiUser - roles encontrados: [...]
🔍 DEBUG mapApiUser - permissions encontrados: [...]
✅ DEBUG mapApiUser - Usuario mapeado: {...}
```

**IMPORTANTE:** Si `roles encontrados: []` está vacío, significa que **el backend NO está enviando roles**.

#### B) Logs del Sidebar:

```
🔍 SIDEBAR DEBUG: {
  isAuthenticated: true,
  userEmail: "tu@email.com",
  userRoles: ["super_admin"],  // ← Debe tener roles
  isSuperAdmin: true
}
```

#### C) Logs del Dashboard:

```
🔍 DEBUG - Estado Auth: {
  isAuthenticated: true,
  user: "tu@email.com",
  roles: ["super_admin"],  // ← Debe tener roles
  isSuperAdmin: true
}
```

---

### **Paso 3: Verificar localStorage**

En la consola del navegador, ejecuta:

```javascript
JSON.parse(localStorage.getItem("auth_session"));
```

**Debe mostrar algo como:**

```json
{
  "user": {
    "uid": "abc123",
    "email": "admin@example.com",
    "displayName": "Admin User",
    "roles": ["super_admin"],           // ← CRÍTICO
    "permissions": ["users.view", ...], // ← CRÍTICO
    "centro_gestor_assigned": null,
    "is_active": true
  },
  "timestamp": 1234567890,
  "remember": true
}
```

---

## 🔴 Escenarios Posibles

### **Escenario 1: Backend NO envía roles**

**Síntomas:**

- En los logs: `roles encontrados: []` o `undefined`
- En `/test-auth`: "❌ No hay roles asignados"
- En localStorage: `"roles": []`

**Causa:** El endpoint `/auth/login` del backend no está incluyendo roles en la respuesta.

**Solución:**

1. Verificar que el backend esté configurado para incluir roles en el login
2. Hacer una prueba directa al backend:

```bash
curl -X POST https://gestorproyectoapi-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword"}'
```

3. Verificar que la respuesta incluya:

```json
{
  "success": true,
  "user": {
    "uid": "...",
    "email": "...",
    "roles": ["super_admin"],  // ← Debe estar presente
    "permissions": [...]
  }
}
```

---

### **Escenario 2: Roles están en custom_claims**

**Síntomas:**

- Backend envía roles pero están anidados en `custom_claims`
- Los logs muestran `apiUser.roles = undefined` pero `apiUser.custom_claims.roles = ["super_admin"]`

**Solución:** El código ya maneja esto:

```typescript
roles: apiUser.roles || apiUser.custom_claims?.roles || [];
```

Pero verifica en los logs si está extrayendo correctamente.

---

### **Escenario 3: Sesión Antigua sin Roles**

**Síntomas:**

- Te logueaste ANTES de los cambios
- localStorage tiene usuario pero sin roles

**Solución:**

1. Cierra sesión completamente
2. Borra el localStorage:

```javascript
localStorage.clear();
sessionStorage.clear();
```

3. Vuelve a iniciar sesión
4. Verifica los nuevos logs

---

### **Escenario 4: Usuario No Tiene Rol Asignado en BD**

**Síntomas:**

- Backend envía roles pero array está vacío: `"roles": []`
- Usuario existe pero no tiene rol `super_admin` asignado en la base de datos

**Solución:**

1. Verificar en la base de datos del backend que el usuario tenga el rol asignado
2. Usar el endpoint de administración para asignar el rol:

```bash
# Asignar rol super_admin al usuario
POST /auth/admin/users/{uid}/roles
{
  "roles": ["super_admin"]
}
```

---

## 🎯 Próximos Pasos según el Diagnóstico

### Si los roles SÍ aparecen pero el módulo NO se ve:

1. Verifica que `isSuperAdmin()` retorne `true` en los logs
2. Verifica que el Sidebar esté recibiendo correctamente el contexto
3. Puede ser un problema de renderizado - verifica la consola por errores de React

### Si los roles NO aparecen:

1. **PRIMERO:** Verifica la respuesta del backend directamente con curl
2. Si el backend no envía roles → Problema en el backend
3. Si el backend SÍ envía roles → Problema en `mapApiUser()` o estructura de datos

---

## 🚀 Comandos Útiles para Pruebas

### Iniciar servidor de desarrollo:

```bash
npm run dev
```

### Limpiar y reconstruir:

```bash
rm -rf .next
npm run build
npm run dev
```

### Ver logs en tiempo real:

Mantén abierta la consola del navegador (F12) mientras navegas por la app.

---

## 📞 Información de Contacto

Si después de seguir estos pasos el problema persiste, necesitamos:

1. **Screenshot de `/test-auth`** después de iniciar sesión
2. **Logs completos de la consola** (copiar todo el output)
3. **Respuesta del backend** al endpoint `/auth/login` (puedes usar Postman o curl)

---

## ✅ Checklist de Verificación

- [ ] Usuario autenticado correctamente
- [ ] Navegué a `/test-auth`
- [ ] Verifiqué los logs en consola
- [ ] Revisé localStorage
- [ ] Roles aparecen en la respuesta del backend
- [ ] `isSuperAdmin()` retorna `true`
- [ ] Cerré sesión y volví a entrar
- [ ] Probé con usuario diferente

---

## 🎉 Si Todo Está Correcto

Si en `/test-auth` ves:

- ✅ "Es Super Admin: ✅ Sí"
- ✅ Roles: `super_admin`
- ✅ Permisos listados

Entonces el sistema de autenticación está funcionando correctamente y el problema está en otro lugar (posiblemente renderizado del Sidebar).
