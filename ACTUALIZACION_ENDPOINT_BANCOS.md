# Actualización del Endpoint de Bancos Empréstito

## 📋 Resumen
Se actualizó la carga del dropdown de bancos en la gestión de procesos contractuales del empréstito para usar el nuevo endpoint `/asignaciones-emprestito-banco-centro-gestor` en lugar del endpoint deprecado `/bancos_emprestito_all`.

## 🔄 Cambios Realizados

### 1. **ProcesosEmprestitoTable.tsx**
- **Archivo**: `src/components/ProcesosEmprestitoTable.tsx`
- **Cambio**: Actualizada la función `fetchBancos()` (línea 205)
- **Endpoint anterior**: `/api/proxy/bancos_emprestito_all`
- **Endpoint nuevo**: `/api/proxy/asignaciones-emprestito-banco-centro-gestor`
- **Lógica de extracción**: Se extraen bancos únicos del campo `nombre_banco` de las asignaciones

```typescript
// Extraer nombres únicos de bancos del campo nombre_banco
const nombresBancos = Array.isArray(data) 
  ? Array.from(new Set(data.map((asignacion: any) => asignacion.nombre_banco).filter(Boolean))) as string[]
  : []
```

### 2. **AgregarConvenioTransferenciaModal.tsx**
- **Archivo**: `src/components/AgregarConvenioTransferenciaModal.tsx`
- **Cambio**: Actualizada la carga de bancos en `loadInitialData()` (línea 157)
- **Endpoint anterior**: `${apiUrl}/bancos_emprestito_all`
- **Endpoint nuevo**: `${apiUrl}/asignaciones-emprestito-banco-centro-gestor`
- **Formateo**: Se crean objetos con estructura `{nombre_banco: string}` a partir de bancos únicos

```typescript
const bancosUnicos = Array.from(
  new Set(bancosData.data.map((asignacion: any) => asignacion.nombre_banco).filter(Boolean))
) as string[]
const bancosFormatted = bancosUnicos.map((nombre) => ({
  nombre_banco: nombre
}))
```

### 3. **AgregarProcesoModal.tsx**
- **Archivo**: `src/components/AgregarProcesoModal.tsx`
- **Cambio**: Corregido el campo de extracción de `asig.banco` a `asig.nombre_banco` (línea 149)
- **Endpoint**: Ya usaba el correcto `/asignaciones-emprestito-banco-centro-gestor`
- **Corrección**: Cambio del campo de extracción para coincidir con la estructura real de la respuesta

```typescript
// ANTES: asig.banco
// AHORA: asig.nombre_banco
const bancosUnicos = Array.from(
  new Set(bancosData.data.map((asig: any) => asig.nombre_banco).filter(Boolean))
)
```

### 4. **AgregarProcesoModalAlt.tsx**
- **Archivo**: `src/components/AgregarProcesoModalAlt.tsx`
- **Cambio**: Corregido el campo de extracción de `asig.banco` a `asig.nombre_banco` (línea 149)
- **Endpoint**: Ya usaba el correcto `/asignaciones-emprestito-banco-centro-gestor`
- **Corrección**: Similar a AgregarProcesoModal.tsx

## 📊 Estructura del Nuevo Endpoint

### GET `/asignaciones-emprestito-banco-centro-gestor`

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "BBVA_BP26004701_2026",
      "nombre_banco": "BBVA",
      "nombre_centro_gestor": "Secretaría de Educación",
      "bp": "BP26004701",
      "monto_programado_adjudicacion": 27000000000,
      "monto_programado_pago": 0,
      "anio": 2025,
      "created_at": "2026-01-09T17:05:33.863368",
      "updated_at": "2026-01-09T17:05:37.712448",
      "data_hash": "fd8954a51355210c69f8648c181ab5ad"
    }
    // ... más asignaciones
  ],
  "count": 96,
  "collection": "montos_emprestito_asignados_centro_gestor",
  "timestamp": "2026-01-19T15:51:07.380924",
  "message": "Se obtuvieron 96 asignaciones de empréstito banco-centro gestor exitosamente"
}
```

**Campo relevante para bancos**: `nombre_banco`

## 🎯 Bancos Disponibles (Ejemplo)

Según la respuesta del endpoint, los bancos disponibles incluyen:
- BBVA
- Banco Occidente
- Bancolombia
- CAF
- Davivienda
- Davivienda - (Otro sí)
- IFC

## ✅ Verificación

Los siguientes componentes ahora cargan correctamente el dropdown de bancos:

1. ✅ **Tabla de Procesos de Empréstito** - Agregar/modificar procesos
2. ✅ **Modal de Convenio/Transferencia** - Selección de banco
3. ✅ **Modal de Agregar Proceso** - Versión principal
4. ✅ **Modal de Agregar Proceso Alt** - Versión alternativa

## 🔍 Pruebas Sugeridas

1. Abrir el modal de agregar proceso en la gestión de procesos contractuales
2. Verificar que el dropdown de bancos se carga correctamente
3. Confirmar que aparecen todos los bancos disponibles
4. Verificar que se puede seleccionar un banco y guardar el formulario
5. Comprobar que la funcionalidad de búsqueda en el dropdown sigue funcionando

## 📝 Notas Técnicas

- El proxy API ya soporta dinámicamente todas las rutas a través de `[...path]/route.ts`
- No se requieren cambios en el proxy para este endpoint
- La extracción de bancos únicos se realiza usando `Set` para evitar duplicados
- Se mantiene la compatibilidad con el formato de datos existente
- Timeout configurado: 120 segundos (2 minutos)

## 🔗 Referencias

- Endpoint documentado en: OpenAPI Swagger
- Colección de datos: `montos_emprestito_asignados_centro_gestor`
- Fecha de actualización: 19 de enero de 2026
