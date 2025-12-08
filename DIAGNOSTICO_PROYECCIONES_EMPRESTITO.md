# 📊 Diagnóstico: Diferencias en "Proyecciones de Empréstito"

## Problema Reportado

La sección "Proyecciones de Empréstito" se ve diferente en local que en producción.

## 🔍 Hallazgos del Test

### ✅ Datos Correctos

- **Mismo número de registros**: 143 en ambos entornos
- **Mismos campos**: Todos los campos están presentes
- **API funcionando**: El backend y el proxy devuelven datos

### ⚠️ Problema Identificado

**Los registros vienen en diferente orden en cada llamada**, lo que hace que parezca que hay diferencias cuando en realidad son los mismos datos pero desordenados.

#### Ejemplo de la diferencia:

**Backend Railway (primera llamada)**:

- Primer registro: ID `GNIxtnhbdjijVfnurpoK`, Item `139`, Organismo `MOVILIDAD`

**Proxy Next.js (segunda llamada)**:

- Primer registro: ID `V0K3z4HczzAnm2Z5bkw9`, Item `new`, Organismo `DATIC`

Esto NO significa que falten datos, solo que están en diferente orden.

## 📊 Análisis de Datos

### Campos con valores nulos/vacíos:

1. `referencia_proceso`: 84 registros (58.7%) - **Normal**: Son proyecciones sin proceso asociado
2. `urlProceso`: 63 registros (44.1%)
3. `BP`: 1 registro (0.7%)
4. `nombre_banco`: 1 registro (0.7%)
5. `id_paa`: 1 registro (0.7%)

### Distribución de procesos:

- **Con proceso**: 59 proyecciones (41.3%)
- **Sin proceso**: 84 proyecciones (58.7%)

## 🔧 Causas Potenciales

### 1. **Falta de ordenamiento consistente en el backend**

El endpoint `/emprestito/leer-tabla-proyecciones` no aplica un `ORDER BY` consistente, por lo que los registros pueden venir en diferente orden cada vez.

### 2. **Cache en producción**

Producción podría estar cacheando una versión anterior de los datos.

### 3. **Variables de entorno diferentes**

La URL del backend podría ser diferente en producción.

## ✅ Soluciones Propuestas

### Solución 1: Aplicar orden por defecto en el componente (RECOMENDADA)

Modificar el estado inicial de `sortConfig` para que siempre ordene por un campo específico:

\`\`\`typescript
// En ProyeccionesEmprestito.tsx, línea ~89
const [sortConfig, setSortConfig] = useState<SortConfig>({
key: 'item', // Ordenar por item por defecto
direction: 'asc'
})
\`\`\`

**Ventajas**:

- ✅ Garantiza orden consistente en todos los entornos
- ✅ No requiere cambios en el backend
- ✅ Implementación inmediata

---

### Solución 2: Pedir al backend que ordene los datos

Modificar el endpoint del backend para que siempre retorne los datos ordenados:

**En el backend FastAPI**:
\`\`\`python

# Ordenar por item o por fecha de última actualización

proyecciones = sorted(proyecciones, key=lambda x: x.get('item', 0))
\`\`\`

**Ventajas**:

- ✅ Orden consistente desde el origen
- ✅ Reduce procesamiento en el frontend

**Desventajas**:

- ⏱️ Requiere cambios en el backend
- 🚀 Requiere redeploy del backend

---

### Solución 3: Verificar variables de entorno en producción

Asegurarse de que las variables de entorno en Vercel apuntan al backend correcto:

\`\`\`bash
NEXT_PUBLIC_API_BASE_URL=https://gestorproyectoapi-production.up.railway.app

# o

NEXT_PUBLIC_API_URL=https://gestorproyectoapi-production.up.railway.app
\`\`\`

---

### Solución 4: Limpiar cache en producción

Después del deploy, forzar limpieza del cache de Vercel:

1. Ir a Vercel Dashboard
2. Ir a la página del proyecto
3. Settings → Functions → Function Region
4. Hacer un nuevo deploy forzado

---

## 🎯 Recomendación Final

**IMPLEMENTAR SOLUCIÓN 1** (orden por defecto en el componente):

1. **Inmediato**:

   - Cambiar `sortConfig` inicial para ordenar por `item` ascendente
   - Esto garantiza orden consistente en todos los entornos

2. **Corto plazo**:

   - Verificar variables de entorno en producción
   - Limpiar cache de Vercel después del deploy

3. **Opcional** (si el problema persiste):
   - Solicitar al equipo de backend que agreguen ordenamiento al endpoint

---

## 📝 Campos Disponibles

Todos estos campos están disponibles y se transfieren correctamente:

- ✅ `id` - ID único del registro
- ✅ `item` - Número de item
- ✅ `referencia_proceso` - Referencia del proceso (puede ser vacío)
- ✅ `nombre_organismo_reducido` - Nombre del organismo
- ✅ `nombre_banco` - Nombre del banco
- ✅ `BP` - Código BP
- ✅ `nombre_resumido_proceso` - Nombre resumido del proceso
- ✅ `nombre_generico_proyecto` - Nombre genérico del proyecto
- ✅ `id_paa` - ID del PAA
- ✅ `urlProceso` - URL del proceso
- ✅ `valor_proyectado` - Valor proyectado
- ✅ `descripcion_bp` - Descripción del BP
- ✅ `fecha_carga` - Fecha de carga
- ✅ `fecha_guardado` - Fecha de guardado
- ✅ `ultima_actualizacion` - Última actualización
- ✅ `fuente` - Fuente de los datos
- ✅ `fila_origen` - Fila de origen

**TODOS los campos se están transfiriendo correctamente desde el backend a través de la API.**

---

## ✅ Verificación

Para verificar que la solución funciona:

1. Implementar el orden por defecto
2. Hacer deploy
3. Comparar ambos entornos ordenando por el mismo campo
4. Verificar que los datos sean idénticos

---

**Generado**: 2025-11-20
**Test usado**: `test-proyecciones-emprestito.js`
