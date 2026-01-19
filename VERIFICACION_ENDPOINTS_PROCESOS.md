# Verificación de Endpoints - Gestión de Procesos Empréstito

## ✅ Estado de Implementación

### Endpoints Correctamente Configurados:

#### 1. **POST `/emprestito/cargar-proceso`** ✅
- **Componentes que lo usan:**
  - `ProcesosEmprestitoTable.tsx` ✅
  - `AgregarProcesoModal.tsx` ✅
  - `AgregarProcesoModalAlt.tsx` ✅

- **Implementación:**
  ```typescript
  // ProcesosEmprestitoTable.tsx
  const procesoData: Record<string, any> = {
    referencia_proceso: nuevoProceso.referencia_proceso.trim(),
    nombre_centro_gestor: nuevoProceso.nombre_centro_gestor.trim(),
    nombre_banco: nuevoProceso.nombre_banco.trim(),
    plataforma: nuevoProceso.plataforma.trim()
  }
  // + campos opcionales si tienen valor
  ```

- **Formato de envío:**
  - `ProcesosEmprestitoTable.tsx`: `application/json` ✅
  - `AgregarProcesoModal.tsx`: `application/json` ✅
  - `AgregarProcesoModalAlt.tsx`: `application/x-www-form-urlencoded` ✅

#### 2. **PUT `/emprestito/modificar-valores/proceso/{referencia_proceso}`** 
- **Estado:** ⚠️ Endpoint documentado pero NO implementado en el frontend
- **Uso previsto:** Actualizar solo `valor_publicacion` de procesos SECOP
- **Campos requeridos:**
  - `valor_publicacion`: number
  - `change_motivo`: string
  - `change_support_file`: file (PDF, XLSX, DOCX, etc.)

- **Implementación pendiente:** Ningún componente actual usa este endpoint

#### 3. **PUT `/emprestito/modificar-valores/orden-compra/{numero_orden}`**
- **Estado:** ⚠️ Endpoint documentado pero NO implementado en el frontend
- **Uso previsto:** Actualizar `valor_orden` y/o `valor_proyectado` de órdenes TVEC
- **Campos opcionales:**
  - `valor_orden`: number
  - `valor_proyectado`: number
  - `change_motivo`: string (requerido)
  - `change_support_file`: file (requerido)

- **Implementación pendiente:** Ningún componente actual usa este endpoint

---

## ⚠️ Problema Identificado: Validación de SECOP

### Descripción del Problema:

Cuando intentas crear un proceso con plataforma "SECOP II" usando el endpoint `/emprestito/cargar-proceso`, el backend **valida que el proceso exista en la base de datos de SECOP** antes de guardarlo, independientemente de si proporcionas todos los datos opcionales.

### Ejemplo de Error:
```
Error al agregar el proceso:

Error obteniendo datos de SECOP: No se encontró el proceso 4137.010.26.1.519-2020 
en SECOP. Verifique que la referencia del proceso sea válida y esté registrada en SECOP.
```

### ¿Por qué ocurre esto?

El backend está diseñado para:
1. **Detectar la plataforma** (SECOP vs TVEC) basándose en el campo `plataforma`
2. **Validar la existencia del proceso** en la API externa correspondiente
3. **Obtener datos adicionales** de la API si el proceso existe
4. **Rechazar la creación** si el proceso no se encuentra en la API externa

Este comportamiento está **implementado en el backend** y no se puede modificar desde el frontend.

---

## 🔧 Soluciones Recomendadas:

### Opción 1: Usar Procesos que Existan en SECOP ✅
Si el proceso está registrado en SECOP II, el endpoint funcionará correctamente:
- Verifica que la referencia del proceso sea válida
- Asegúrate de que el proceso esté publicado en SECOP II
- El backend obtendrá automáticamente los datos adicionales

### Opción 2: Usar Plataforma "TVEC" para Procesos Manuales ✅
Si el proceso no existe en SECOP:
- Cambia la plataforma a "Tienda Virtual del Estado Colombiano" (TVEC)
- El backend buscará en TVEC en lugar de SECOP
- Si tampoco existe en TVEC, se guardará con los datos proporcionados

### Opción 3: Solicitar Cambio en el Backend ⚠️
Contacta al equipo de backend para:
- Permitir la creación de procesos sin validación externa
- Agregar un parámetro `skip_validation: boolean` al endpoint
- Crear un endpoint alternativo `/emprestito/cargar-proceso-manual`

---

## 📊 Campos Enviados Correctamente:

### Campos Obligatorios ✅
Todos los componentes envían correctamente:
- ✅ `referencia_proceso`
- ✅ `nombre_centro_gestor`
- ✅ `nombre_banco`
- ✅ `plataforma`

### Campos Opcionales ✅
Los componentes ahora envían correctamente:
- ✅ `bp` (si tiene valor)
- ✅ `nombre_resumido_proceso` (si tiene valor)
- ✅ `id_paa` (si tiene valor)
- ✅ `valor_proyectado` (si tiene valor)

---

## 📝 Mejoras Implementadas:

### 1. ProcesosEmprestitoTable.tsx
✅ **Antes:** Solo enviaba campos obligatorios
```typescript
const procesoData = {
  referencia_proceso: nuevoProceso.referencia_proceso.trim(),
  nombre_centro_gestor: nuevoProceso.nombre_centro_gestor.trim(),
  nombre_banco: nuevoProceso.nombre_banco.trim(),
  plataforma: nuevoProceso.plataforma.trim()
}
```

✅ **Ahora:** Envía todos los campos opcionales con valor
```typescript
const procesoData: Record<string, any> = {
  referencia_proceso: nuevoProceso.referencia_proceso.trim(),
  nombre_centro_gestor: nuevoProceso.nombre_centro_gestor.trim(),
  nombre_banco: nuevoProceso.nombre_banco.trim(),
  plataforma: nuevoProceso.plataforma.trim()
}

// Agregar campos opcionales solo si tienen valor
if (nuevoProceso.bp && nuevoProceso.bp.trim()) {
  procesoData.bp = nuevoProceso.bp.trim()
}
if (nuevoProceso.nombre_resumido_proceso && nuevoProceso.nombre_resumido_proceso.trim()) {
  procesoData.nombre_resumido_proceso = nuevoProceso.nombre_resumido_proceso.trim()
}
if (nuevoProceso.id_paa && nuevoProceso.id_paa.trim()) {
  procesoData.id_paa = nuevoProceso.id_paa.trim()
}
if (nuevoProceso.valor_proyectado && nuevoProceso.valor_proyectado.trim()) {
  const valorNumerico = parseFloat(nuevoProceso.valor_proyectado.replace(/[^\d.-]/g, ''))
  if (!isNaN(valorNumerico)) {
    procesoData.valor_proyectado = valorNumerico
  }
}
```

### 2. Todos los componentes ✅
- Todos envían campos opcionales correctamente
- Todos manejan errores del backend
- Todos usan el endpoint correcto

---

## 🚀 Próximos Pasos Recomendados:

### Para el Frontend:
1. ✅ **Completado:** Verificar que todos los componentes envíen campos opcionales
2. ⚠️ **Pendiente:** Implementar endpoints PUT para modificar valores
3. ⚠️ **Pendiente:** Agregar manejo de archivos para modificaciones

### Para el Backend:
1. ⚠️ **Solicitar:** Permitir creación de procesos sin validación SECOP
2. ⚠️ **Solicitar:** Agregar parámetro `skip_validation` opcional
3. ⚠️ **Solicitar:** Documentar mejor el comportamiento de validación

---

## 🔍 Testing:

### Caso 1: Proceso que existe en SECOP ✅
```
Referencia: [proceso válido de SECOP II]
Plataforma: SECOP II
Resultado esperado: ✅ Proceso creado exitosamente
```

### Caso 2: Proceso que NO existe en SECOP ❌
```
Referencia: 4137.010.26.1.519-2020
Plataforma: SECOP II
Resultado actual: ❌ Error "No se encontró el proceso en SECOP"
```

### Caso 3: Proceso manual con TVEC ✅
```
Referencia: [cualquier referencia]
Plataforma: Tienda Virtual del Estado Colombiano
Resultado esperado: ✅ Proceso creado (si no requiere validación TVEC)
```

---

## 📌 Conclusión:

**El problema NO está en el frontend.** Los componentes están enviando correctamente todos los datos al backend. El problema está en la **lógica de validación del backend** que requiere que el proceso exista en SECOP antes de guardarlo.

**Solución temporal:** Usa procesos que existan en SECOP II o cambia la plataforma a TVEC para procesos que no estén en SECOP.

**Solución permanente:** Solicita al equipo de backend que permita la creación de procesos sin validación externa o con un parámetro para omitirla.
