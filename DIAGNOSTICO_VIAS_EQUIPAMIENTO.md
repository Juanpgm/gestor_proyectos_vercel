# 🔍 Diagnóstico: Problema con tipo_equipamiento = "Vias"

**Fecha**: 18 de noviembre de 2025  
**Proyecto**: Gestor de Proyectos Vercel  
**Problema reportado**: Los datos con tipo_equipamiento = "Vias" no se están representando en el mapa

---

## 📊 Hallazgos

### ✅ Datos Existentes

1. **En la tabla de filtros (`/unidades-proyecto/filters`)**:
   - "Vias" aparece correctamente en la lista de tipos de equipamiento
   - Posición #21 de 23 tipos de equipamiento totales

2. **En la tabla de atributos (`/unidades-proyecto/attributes`)**:
   - **231 registros** con `tipo_equipamiento = "Vias"`
   - 4 registros adicionales con `tipo_equipamiento = "Señalización Vial"`
   - **Total relacionado con vías: 235 registros**

3. **En la tabla de geometrías (`/unidades-proyecto/geometry`)**:
   - **0 registros** con `tipo_equipamiento = "Vias"`
   - 4 registros con `tipo_equipamiento = "Señalización Vial"` (todos con geometría Point)
   - **Total de geometrías relacionadas con vías: 4 features**

---

## 🔴 Problema Identificado

**El problema es del BACKEND (base de datos), NO del frontend.**

### Causa raíz:
Los 231 registros con `tipo_equipamiento = "Vias"` **NO tienen geometrías asociadas** en la base de datos. Por lo tanto:

- ✅ Los datos existen en la tabla de atributos
- ❌ NO existen en la tabla de geometrías
- ❌ **El mapa no puede representar elementos sin coordenadas/geometría**

### Características de los registros sin geometría:

| Característica | Cantidad | Porcentaje |
|----------------|----------|------------|
| **Sin UPID** | 231/231 | 100% |
| **Con Estado** | 229/231 | 99.1% |
| **Sin Estado** | 2/231 | 0.9% |
| **Con Nombre** | 230/231 | 99.6% |
| **Sin Comuna** | Variable | - |

### Ejemplos de registros sin geometría:

1. **Carrera 118 Entre Calle 15 Y 16**
   - Estado: Finalizado
   - Comuna: PANCE
   - Centro Gestor: Secretaría de Infraestructura
   - **UPID: No definido**
   - **Geometría: No existe**

2. **Autopista Suroriental Entre Calle 52 Y 58**
   - Estado: Finalizado
   - Comuna: COMUNA 08
   - Centro Gestor: Secretaría de Infraestructura
   - **UPID: No definido**
   - **Geometría: No existe**

3. **Calle 33 Entre Carrera 29 Y Carrera 29 A**
   - Estado: Finalizado
   - Comuna: COMUNA 11
   - Centro Gestor: Secretaría de Infraestructura
   - **UPID: No definido**
   - **Geometría: No existe**

---

## 💡 Soluciones Propuestas

### Opción 1: Agregar geometrías en la base de datos (RECOMENDADA)

**Acción requerida**: Equipo de backend/base de datos

1. Identificar las coordenadas geográficas de cada vía
2. Crear las geometrías correspondientes (Point, LineString o Polygon según el tipo de vía)
3. Asignar un UPID único a cada registro
4. Vincular las geometrías con los registros de atributos

**Ventajas**:
- ✅ Solución definitiva
- ✅ Permite visualización completa en el mapa
- ✅ Mantiene la consistencia de datos

**Desventajas**:
- ⏱️ Requiere tiempo para geocodificar 231 vías
- 🔧 Requiere acceso y modificación de la base de datos

---

### Opción 2: Mostrar advertencia en el frontend (TEMPORAL)

**Acción requerida**: Equipo de frontend

Agregar un indicador visual que muestre:
- Total de registros con datos
- Total de registros con geometría
- Diferencia (registros sin representación en el mapa)

**Implementación**:

```tsx
// En el componente del mapa o filtros
const totalRecords = attributes.length; // 231
const recordsWithGeometry = geometries.length; // 0
const missingGeometries = totalRecords - recordsWithGeometry; // 231

// Mostrar alerta
{missingGeometries > 0 && (
  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
    ⚠️ {missingGeometries} registros de "Vias" no tienen geometría asociada 
    y no se pueden mostrar en el mapa.
  </div>
)}
```

**Ventajas**:
- ✅ Implementación rápida
- ✅ Informa al usuario del problema
- ✅ No requiere cambios en backend

**Desventajas**:
- ❌ No resuelve el problema de fondo
- ❌ Los datos siguen sin visualizarse

---

## 🔍 Comparación con otros tipos de equipamiento

Para contexto, estos son los tipos de equipamiento con más geometrías:

| Tipo de Equipamiento | Features en Geometría |
|----------------------|----------------------|
| Vivienda Nueva | 671 |
| Vivienda Mejoramiento | 231 |
| Institución Educativa | 221 |
| Infraestructura Cultural | 146 |
| Infraestructura Recreo Deportiva | 118 |
| Bibliotecas | 57 |
| Parques y Zonas Verdes | 56 |
| **Vias** | **0** ❌ |
| Señalización Vial | 4 |

---

## ✅ Verificación del Frontend

Se verificó que el frontend está funcionando correctamente:

1. ✅ El endpoint `/api/proxy/unidades-proyecto/filters` retorna "Vias" en la lista
2. ✅ El endpoint `/api/proxy/unidades-proyecto/attributes` retorna los 231 registros
3. ✅ El componente de filtros muestra "Vias" como opción
4. ✅ El componente de "Colorear por" incluye tipo_equipamiento
5. ✅ El mapa renderiza correctamente todas las geometrías disponibles

**El frontend NO puede mostrar lo que no existe en la base de datos.**

---

## 🎯 Recomendación Final

**RECOMENDACIÓN: Opción 1 (Agregar geometrías en el backend)**

**Pasos sugeridos**:

1. **Inmediato** (Frontend):
   - Implementar Opción 2 para informar al usuario
   - Agregar tooltip o mensaje explicativo

2. **Corto plazo** (Backend):
   - Revisar la fuente original de datos de vías
   - Geocodificar las ubicaciones de las vías
   - Crear geometrías (LineString para vías lineales)
   - Asignar UPIDs únicos
   - Actualizar la base de datos

3. **Validación**:
   - Verificar que los 231 registros tengan geometría
   - Probar visualización en el mapa
   - Confirmar que filtros y coloreado funcionan correctamente

---

## 📝 Notas Técnicas

- Los registros de "Vias" están en la colección de attributes pero no en geometries
- El campo `upid` está indefinido en todos los registros de "Vias"
- Algunos registros tienen `comuna_corregimiento = null`
- El centro gestor es "Secretaría de Infraestructura" para todos los registros
- La mayoría de registros tienen estado "Finalizado"

---

**Generado por**: Sistema de Diagnóstico de Unidades de Proyecto  
**Archivos de test creados**:
- `test-vias-equipamiento.js`
- `test-vias-geometry-issue.js`
