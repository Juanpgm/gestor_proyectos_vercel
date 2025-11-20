# 🔧 Solución: valor_proyectado en Producción

**Problema**: En **local** se ven los valores correctamente, pero en **producción** aparecen en 0.

**Causa**: Cache de Vercel o variables de entorno incorrectas.

---

## ✅ SOLUCIÓN PASO A PASO

### 1️⃣ Verificar Variables de Entorno en Vercel

1. Ve a **Vercel Dashboard**: https://vercel.com/
2. Selecciona tu proyecto: `gestor-proyectos-vercel`
3. Ve a **Settings** > **Environment Variables**
4. Verifica que exista:

```
NEXT_PUBLIC_API_BASE_URL = https://gestorproyectoapi-production.up.railway.app
```

O:

```
NEXT_PUBLIC_API_URL = https://gestorproyectoapi-production.up.railway.app
```

**⚠️ IMPORTANTE**: Si la variable apunta a una URL diferente, ese puede ser el problema.

### 2️⃣ Limpiar Cache de Vercel y Redeploy

#### Opción A: Desde Dashboard (Recomendado)

1. Ve a **Deployments** en tu proyecto
2. Encuentra el último deployment exitoso
3. Haz clic en los **3 puntos** (...) a la derecha
4. Selecciona **Redeploy**
5. Marca la opción: **"Use existing Build Cache"** ❌ **DESHABILITADA**
6. Haz clic en **Redeploy**

#### Opción B: Forzar Nuevo Deploy desde Git

```bash
# Hacer un cambio mínimo y pushear
git commit --allow-empty -m "Force redeploy for cache refresh"
git push origin master
```

### 3️⃣ Verificar que el Deploy Use el Código Nuevo

Después del redeploy:

1. Ve a **Deployments** en Vercel
2. Espera que el build termine (status: **Ready**)
3. Haz clic en el deployment
4. Ve a **Function Logs**
5. Busca los nuevos logs que agregamos:

```
🔍 Muestra de datos - Item X
📊 Registros con valor_proyectado > 0: X de 143
```

### 4️⃣ Limpiar Cache del Browser

En tu navegador (producción):

```
1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Marca "Disable cache"
4. Haz Ctrl+Shift+R (forzar recarga sin cache)
```

### 5️⃣ Verificar en Producción

Después de los pasos anteriores, verifica:

```javascript
// En la consola del browser (producción)
fetch('/api/emprestito/leer-tabla-proyecciones?solo_no_guardados=false&_t=' + Date.now())
  .then(r => r.json())
  .then(data => {
    const conValor = data.data.filter(p => p.valor_proyectado > 0).length
    console.log('Registros con valor > 0:', conValor)
    console.log('Sample:', data.data[0])
  })
```

---

## 🔍 DIAGNÓSTICO ADICIONAL

### Si Aún No Funciona

1. **Verificar logs de producción en Vercel**:
   - Deployments > [último deployment] > **Function Logs**
   - Buscar errores o warnings

2. **Verificar que el backend Railway esté respondiendo correctamente**:
   ```bash
   node test-produccion-vs-local.js
   ```

3. **Comparar timestamps**:
   - Si el timestamp en producción es muy antiguo, hay cache
   - Si es reciente pero los valores son 0, el backend tiene el problema

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Variables de entorno en Vercel apuntan a Railway correcto
- [ ] Redeploy sin cache completado exitosamente
- [ ] Logs de producción muestran datos correctos
- [ ] Cache del browser limpiado
- [ ] Valores se muestran correctamente en producción

---

## 🎯 CAMBIOS APLICADOS EN ESTE COMMIT

### Logs Adicionales

Agregamos logs en los API routes para debugging:

**`leer-tabla-proyecciones/route.ts`**:
```typescript
// Log de debugging para producción
if (backendData.data && backendData.data.length > 0) {
  const sample = backendData.data[0]
  console.log(`🔍 Muestra de datos - Item ${sample.item}:`, {
    valor_proyectado: sample.valor_proyectado,
    tipo: typeof sample.valor_proyectado,
    nombre: sample.nombre_resumido_proceso || 'N/A'
  })
  
  const conValor = backendData.data.filter((p: any) => p.valor_proyectado > 0).length
  console.log(`📊 Registros con valor_proyectado > 0: ${conValor} de ${backendData.data.length}`)
}
```

**`proyecciones-sin-proceso/route.ts`**: Logs similares

### Cache Prevention

Ya teníamos:
- `export const dynamic = 'force-dynamic'`
- `export const revalidate = 0`
- `export const fetchCache = 'force-no-store'`
- Timestamp en URLs (`?_nocache=${Date.now()}`)
- Headers de cache agresivos

---

## 🚀 EJECUTAR DESPUÉS DEL REDEPLOY

```bash
# Test de comparación
node test-produccion-vs-local.js
```

Esto te mostrará si producción ahora tiene los valores correctos.

---

## 💡 NOTA IMPORTANTE

Si después de seguir todos estos pasos **producción aún muestra 0**, entonces el problema está en el **backend Railway**, no en el frontend. En ese caso, necesitarás:

1. Acceder a Railway
2. Revisar el código que lee el Google Sheet
3. Verificar el mapeo de la columna `valor_proyectado`
4. Ver logs del backend Railway

---

**Siguiente paso**: Hacer commit y push, luego seguir los pasos de redeploy en Vercel.
