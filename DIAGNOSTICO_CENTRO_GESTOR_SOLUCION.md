# Diagnóstico: Filtro Centro Gestor - Secretaría de Bienestar Social

## 📊 Resumen del Problema

**Síntoma**: Cuando se selecciona "Secretaría de Bienestar Social" en el filtro de Centro Gestor, el contador muestra "18 de 18" registros pero el mapa no muestra nada.

## 🔬 Diagnóstico Completo

### Tests Ejecutados

#### Test 1: Verificación de API (test-frontend-vs-api.js)

**Resultado**: ✅ **7/7 tests pasados**

- ✅ API con filtro server-side: 18 registros
- ✅ Carga completa de datos: 1443 registros
- ✅ Filtrado local funciona correctamente: 18 registros
- ✅ Campo `nombre_centro_gestor` existe en ambos endpoints
- ✅ UPIDs alineados 100% entre geometry y attributes
- ✅ Resultados idénticos entre server-side y client-side
- ✅ Tipos de UPID coinciden (string)

**Conclusión**: La API y la lógica de filtrado funcionan **perfectamente**.

#### Test 2: Verificación de Frontend (logs del navegador)

**Resultado**: ✅ **Datos llegan correctamente al mapa**

```
🎯 Creating memoized map with:
  {filteredGeometryFeatures: 18, filteredDataCount: 18}

🎨 Rendering GeoJSON layer with 18 features

🗺️ UnidadesProyectoMapSimple: Received data:
  {geometryFeatures: 18, filteredDataItems: 18}
```

**Conclusión**: El frontend está funcionando correctamente, los 18 registros filtrados llegan al componente del mapa.

#### Test 3: Verificación de Coordenadas

**Resultado**: ❌ **PROBLEMA IDENTIFICADO**

```bash
UPID   has_valid_geometry coordinates
----   ------------------ -----------
UNP-81 False              0, 0
UNP-82 False              0, 0
UNP-83 False              0, 0
...
UNP-99 False              0, 0
```

**TODAS las 18 unidades** de "Secretaría de Bienestar Social" tienen:

- `has_valid_geometry: false`
- `coordinates: [0, 0]` (Golfo de Guinea, África - no Cali, Colombia)

## 🎯 Causa Raíz

**El filtro funciona correctamente**. El problema es que:

1. Las unidades de proyecto **no tienen coordenadas geográficas válidas** en la base de datos
2. El sistema las registra con coordenadas `[0, 0]` por defecto
3. Estas coordenadas están fuera del área visible del mapa de Cali
4. Por eso el mapa aparece "vacío" aunque los datos estén cargados

## ✅ Solución Implementada

### 1. Logs Mejorados

- ✅ Log de geometrías válidas vs inválidas
- ✅ Advertencia cuando todas las features tienen coordenadas [0,0]

### 2. Alerta Visual en el Mapa

- ✅ Mensaje amarillo en la parte superior del mapa cuando:
  - Hay registros filtrados (contador > 0)
  - Pero todas las geometrías son inválidas
  - Indica al usuario que revise la tabla

**Mensaje mostrado**:

```
⚠️ Sin coordenadas geográficas
18 registros encontrados pero sin ubicación en el mapa.
Verifica la tabla para ver los datos.
```

## 📋 Próximos Pasos Recomendados

### Opción 1: Actualizar Base de Datos

- Geocodificar las direcciones de las 18 UTS de Bienestar Social
- Actualizar las coordenadas en Firestore
- Las direcciones están disponibles:
  - UNP-81: "Cra 8 # 51 N 35 - Olaya Herrera"
  - UNP-82: "Cll 13 # 50 B -104"
  - etc.

### Opción 2: Mostrar en Tabla con Prioridad

- Ya están visibles en la tabla de datos
- El filtro funciona correctamente para buscar y visualizar en formato tabular
- Usuario puede ver toda la información excepto la ubicación geográfica

### Opción 3: Indicador en Contador

- Modificar el contador para indicar: "18 de 18 (0 con ubicación)"
- Ayuda a que el usuario entienda que hay datos pero sin coordenadas

## 🔍 Validación

### Comando para verificar otras Secretarías

```powershell
curl -s "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry?nombre_centro_gestor=<NOMBRE>" | ConvertFrom-Json | Select-Object -ExpandProperty features | Where-Object {$_.properties.has_valid_geometry -eq $true} | Measure-Object
```

### Ejemplo - Secretaría de Educación

```powershell
# Verificar cuántas tienen geometría válida
curl -s "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/geometry?nombre_centro_gestor=Secretaría%20de%20Educación" | ConvertFrom-Json | Select-Object -ExpandProperty features | Select-Object @{Name='UPID';Expression={$_.properties.upid}}, @{Name='valid';Expression={$_.properties.has_valid_geometry}}
```

## ✅ Estado Final

- ✅ **Filtro funciona correctamente** (backend y frontend)
- ✅ **Datos se filtran y cargan correctamente**
- ✅ **Logs detallados para debugging**
- ✅ **Alerta visual implementada**
- ⚠️ **Problema de datos**: Unidades sin coordenadas geográficas en la base de datos

**El sistema está funcionando según lo diseñado**. La ausencia de puntos en el mapa es un problema de **datos faltantes**, no de código.
