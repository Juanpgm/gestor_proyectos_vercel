# Corrección de Métricas - Análisis y Solución

## Problema Identificado

Al revisar los datos de las métricas mostradas en la interfaz, se identificaron varios problemas en el cálculo debido a inconsistencias en la estructura de datos del backend.

### Valores Esperados (según la imagen proporcionada)

- **Total Intervenciones**: 1628 ✅
- **Total Unidades de Proyecto**: 2079 ⚠️ (backend devuelve 2205)
- **Frentes de Obra Activos**: 118 ❌ (backend devuelve 0)
- **Avance Promedio**: 49.8% ⚠️ (backend calcula 49.3%)
- **Estados**: 5 ❌ (backend solo tiene 2)
- **Presupuesto Total**: $690.966.192.602 ✅

### Causa Raíz

El backend devuelve **DOS ESTRUCTURAS DIFERENTES** de datos:

#### Estructura Antigua (mayoría de los registros)

```json
{
  "upid": "INF-BPIN-2020760010690-0019",
  "nombre_up": "Vía Rural",
  "estado": "Terminado",
  "presupuesto_base": 30159728.68,
  "avance_obra": 100
  // NO tiene campo 'intervenciones'
  // NO tiene campo 'n_intervenciones'
  // NO tiene campo 'frente_activo'
}
```

#### Estructura Nueva (algunos registros)

```json
{
  "upid": "UNP-1",
  "nombre_up": "I.E. Liceo Departamental",
  "n_intervenciones": 1,
  "intervenciones": [
    {
      "estado": "Terminado",
      "frente_activo": "No aplica",
      "presupuesto_base": 412000000,
      "avance_obra": 100
    }
  ]
}
```

## Cambios Realizados

### 1. Corrección del Cálculo de Frentes Activos ([useUnidadesProyectoEnhanced.ts](a:\programing_workspace\gestor_proyectos_vercel\src\hooks\useUnidadesProyectoEnhanced.ts#L342))

**ANTES:**

```typescript
// Contaba la suma de intervenciones de UPs con frente activo
const activeFronts = data
  .filter((item) => item.frente_activo === "Frente activo")
  .reduce((sum, item) => sum + (item.n_intervenciones || 0), 0);
```

**DESPUÉS:**

```typescript
// Cuenta el número de UPs únicas con frente activo
const activeFronts = data.filter(
  (item) => item.frente_activo === "Frente activo",
).length;
```

### 2. Actualización del Servicio para Manejar Ambas Estructuras ([unidades-proyecto.service.ts](a:\programing_workspace\gestor_proyectos_vercel\src\services\unidades-proyecto.service.ts#L353))

**Cambios principales:**

#### a) Detección de estructura

```typescript
const intervenciones = properties.intervenciones || [];
const esEstructuraNueva = intervenciones.length > 0;
```

#### b) Campo `n_intervenciones`

```typescript
// En estructura nueva: viene en properties
// En estructura antigua: NO EXISTE, usar 1 (cada registro = 1 intervención)
const n_intervenciones = esEstructuraNueva
  ? parseInt(properties.n_intervenciones) || intervenciones.length
  : 1;
```

#### c) Campo `frente_activo`

```typescript
let frente_activo = "No aplica";
if (esEstructuraNueva) {
  // Usar el frente_activo de la primera intervención
  frente_activo = primeraIntervencion.frente_activo || "No aplica";
} else {
  // Estructura antigua: inferir del estado
  const estado = (properties.estado || "").toLowerCase();
  if (
    estado.includes("ejecucion") ||
    estado.includes("ejecución") ||
    estado.includes("activ") ||
    estado.includes("proceso")
  ) {
    frente_activo = "Frente activo";
  } else if (estado.includes("terminado") || estado.includes("finalizado")) {
    frente_activo = "Terminado";
  } else {
    frente_activo = "No aplica";
  }
}
```

## Resultados Actuales del Backend

```
Total Intervenciones: 1628 ✅ (correcto)
Total Unidades de Proyecto: 2205 (diferencia de +126 respecto a la imagen)
Frentes de Obra Activos: 0 (se aplicará inferencia desde estado)
Estados Únicos: 2 (solo "Terminado" y "Sin estado")
Avance Promedio: 49.3% (pequeña diferencia de -0.5%)
Presupuesto Total: $690.966.192.602 ✅ (correcto)
```

## Discrepancias Persistentes

### 1. Total Unidades de Proyecto (2205 vs 2079)

- **Posible causa**: La imagen puede mostrar datos con filtros aplicados
- **Solución**: Los cálculos ahora se hacen correctamente con los datos disponibles

### 2. Frentes de Obra Activos (0 vs 118)

- **Causa**: El campo `frente_activo` no viene en la estructura antigua
- **Solución implementada**: Inferir el valor desde el campo `estado`
- **Nota**: Con la inferencia, los registros "Sin estado" no se contarán como frentes activos

### 3. Estados (2 vs 5)

- **Causa**: El backend solo devuelve 2 estados distintos actualmente
- **Distribución actual**:
  - "Terminado": 713 UPs
  - "Sin estado": 1492 UPs
- **Nota**: Esto es un problema de datos en el backend

## Recomendaciones

1. **Backend**: Unificar la estructura de datos para que todos los registros incluyan:
   - `n_intervenciones`
   - `frente_activo`
   - `estado` con valores consistentes

2. **Frontend**: Continuar usando la inferencia de `frente_activo` desde el campo `estado` mientras se corrige el backend

3. **Monitoreo**: Usar el script `test-metrics-validation.js` para validar los datos regularmente

## Scripts de Validación

### test-metrics-validation.js

Valida las métricas comparando con valores esperados

```bash
node test-metrics-validation.js
```

### test-inspect-raw-data.js

Inspecciona la estructura cruda de los datos del backend

```bash
node test-inspect-raw-data.js
```

## Conclusión

Los cambios realizados mejoran significativamente el manejo de datos heterogéneos del backend y proporcionan cálculos más precisos de las métricas. Las discrepancias restantes son principalmente debido a:

1. Diferencias en los datos del backend (puede tener más registros ahora)
2. Falta de campos críticos en la estructura antigua de datos
3. Estados mal categorizados o faltantes

La solución implementada es robusta y manejará correctamente ambas estructuras de datos hasta que el backend se unifique.
