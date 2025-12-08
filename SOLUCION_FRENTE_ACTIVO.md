# Solución: Campo frente_activo no se mostraba en los controles

## 🐛 Problema Identificado

El campo `frente_activo` no se estaba mostrando en los componentes de Unidades de Proyecto (filtros, tabla de atributos, colorear por) a pesar de:

- ✅ Estar correctamente definido en los tipos TypeScript
- ✅ Estar incluido en el schema de Zod (`AttributeSchema`)
- ✅ Estar presente en la respuesta de la API del backend
- ✅ Estar integrado en todos los componentes de UI

## 🔍 Diagnóstico

### Verificaciones Realizadas:

1. **Backend FastAPI** ✅

   - URL: `https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/attributes`
   - Estado: **Retornando correctamente** el campo `frente_activo`
   - Valores: `"Frente activo"` y `"No aplica"`
   - Registros con frente_activo: 1550 de 1782 (87%)

2. **Proxy Next.js** ✅

   - URL: `/api/proxy/unidades-proyecto/attributes`
   - Estado: **Retornando correctamente** el campo `frente_activo`
   - Los datos llegan sin transformación

3. **Servicio de Procesamiento** ❌
   - Archivo: `src/services/unidades-proyecto.service.ts`
   - Problema: **Campo no se extraía al procesar los datos**
   - Función afectada: `fetchAttributeData()`

## 🔧 Causa Raíz

En la función `fetchAttributeData()` (línea ~345), cuando se validaba cada ítem con el `AttributeSchema`, **se estaban mapeando manualmente los campos** del objeto `properties` al schema de Zod, pero **faltaban varios campos incluyendo `frente_activo`**.

### Código Problemático:

```typescript
const validatedItem = AttributeSchema.parse({
  upid: properties.upid || "",
  nombre_up: properties.nombre_up || "",
  // ... otros campos ...
  // ❌ FALTABA: frente_activo
  // ❌ FALTABA: clase_up
  // ❌ FALTABA: fecha_inauguracion
  // ❌ FALTABA: duracion_proyecto
  ano: parseInt(properties.ano) || 0,
});
```

## ✅ Solución Implementada

Se agregaron **todos los campos faltantes** al mapeo de propiedades en `fetchAttributeData()`:

```typescript
const validatedItem = AttributeSchema.parse({
  upid: properties.upid || "",
  nombre_up: properties.nombre_up || "",
  nombre_up_detalle: properties.nombre_up_detalle || undefined,
  identificador: properties.identificador || undefined,
  estado: properties.estado || "",
  tipo_intervencion: properties.tipo_intervencion || "",
  tipo_equipamiento: properties.tipo_equipamiento || undefined,
  clase_up: properties.clase_up || undefined, // ✅ AGREGADO
  frente_activo: properties.frente_activo || undefined, // ✅ AGREGADO
  nombre_centro_gestor: properties.nombre_centro_gestor || "",
  comuna_corregimiento: properties.comuna_corregimiento || "",
  barrio_vereda: properties.barrio_vereda || "",
  presupuesto_base: parseFloat(properties.presupuesto_base) || 0,
  avance_obra: parseFloat(properties.avance_obra) || 0,
  fecha_inicio: properties.fecha_inicio || "",
  fecha_fin: properties.fecha_fin || "",
  fecha_inauguracion: properties.fecha_inauguracion || undefined, // ✅ AGREGADO
  duracion_proyecto: properties.duracion_proyecto || undefined, // ✅ AGREGADO
  descripcion_intervencion: properties.descripcion_intervencion || "",
  fuente_financiacion: properties.fuente_financiacion || "",
  ano: parseInt(properties.ano) || 0,
});
```

## 📋 Archivo Modificado

- **`src/services/unidades-proyecto.service.ts`** (función `fetchAttributeData`)

## 🎯 Resultado Esperado

Después de reiniciar el servidor de desarrollo:

1. ✅ El dropdown de "Frente Activo" en los filtros mostrará opciones
2. ✅ La opción "Frente Activo" en "Colorear por" funcionará correctamente
3. ✅ La columna "Frente Activo" en la tabla de atributos mostrará valores
4. ✅ Los valores serán: `"Frente activo"` o `"No aplica"`

## 🚀 Verificación

Para verificar que la solución funciona:

1. **Reiniciar el servidor de desarrollo:**

   ```bash
   npm run dev
   ```

2. **Abrir la consola del navegador (F12) y verificar los logs:**

   ```
   ✅ fetchAttributeData: Processed X items, validated Y items
   ```

3. **Inspeccionar un registro en la consola:**

   ```javascript
   // En la consola del navegador:
   fetch("/api/proxy/unidades-proyecto/attributes")
     .then((r) => r.json())
     .then((d) => console.log(d.find((item) => item.frente_activo)));
   ```

   Debería mostrar un objeto con el campo `frente_activo` incluido.

4. **Probar en la UI:**
   - Ir a "Unidades de Proyecto"
   - Abrir el filtro "Frente Activo" → debe tener opciones
   - Seleccionar "Colorear por" → "Frente Activo" → debe colorear el mapa
   - Abrir la tabla de atributos → debe mostrar la columna "Frente Activo"

## 📝 Lecciones Aprendidas

1. **Validación de schemas completa:** Cuando se usa Zod, asegurarse de mapear **todos los campos** definidos en el schema, incluso los opcionales.

2. **Verificación en capas:** Problema se encontró verificando cada capa de la arquitectura:

   - Backend → ✅
   - Proxy → ✅
   - Servicio → ❌ (aquí estaba el problema)

3. **Logs de debugging:** Los `console.log` en el servicio ayudan a identificar dónde se pierden los datos.

## 🔄 Campos Adicionales Corregidos

Además de `frente_activo`, se corrigieron otros campos que tampoco se estaban procesando:

- `clase_up`
- `fecha_inauguracion`
- `duracion_proyecto`

Estos campos ahora también estarán disponibles en los componentes si se necesitan en el futuro.

---

**Fecha de Solución:** 24 de noviembre de 2025  
**Estado:** ✅ Corregido - Pendiente de reinicio del servidor  
**Sin Errores TypeScript**
