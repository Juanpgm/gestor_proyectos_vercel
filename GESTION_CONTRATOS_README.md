# 📋 Sistema de Gestión de Contratos - Documentación

## 🎯 Resumen General

El componente `GestionContratos.tsx` muestra **todos los contratos de empréstito** (60 registros totales) pero **solo permite editar** los registros que fueron creados manualmente a través de órdenes de compra TVEC o convenios/transferencias.

---

## 📊 Fuente de Datos

### Endpoint Principal: `GET /contratos_emprestito_all`

Este endpoint retorna **60 registros totales** de 3 colecciones combinadas:

| Tipo | Cantidad | Fuente | Editable | Campo `tipo` |
|------|----------|--------|----------|-------------|
| **Contratos SECOP** | 44 | `contratos_emprestito` | ❌ No | _null_ o _undefined_ |
| **Órdenes de Compra TVEC** | 12 | `ordenes_compra_emprestito` | ✅ Sí | `orden_compra_manual` |
| **Convenios/Transferencias** | 4 | `convenios_transferencias_emprestito` | ✅ Sí | `convenio_transferencia_manual` |
| **TOTAL** | **60** | - | - | - |

---

## 🔐 Lógica de Permisos de Edición

### Función: `esConvenioOTransferencia()`

```typescript
const esConvenioOTransferencia = (contrato: ContratoEmprestito): boolean => {
  // Verificar si es una orden de compra TVEC (12 registros)
  if (contrato.tipo_contrato === 'Orden de Compra - TVEC') {
    return true
  }
  
  // Verificar si es un convenio/transferencia manual (4 registros)
  if (contrato.tipo === 'convenio_transferencia_manual') {
    return true
  }
  
  return false
}
```

### ¿Qué registros son editables?

✅ **EDITABLES (16 registros)**:
- **12 órdenes de compra TVEC**: `tipo_contrato === "Orden de Compra - TVEC"`
- **4 convenios/transferencias**: `tipo === "convenio_transferencia_manual"`

❌ **NO EDITABLES (44 registros)**:
- Los 44 contratos de SECOP importados automáticamente (otros valores de `tipo_contrato`)

---

## 🔄 Endpoints Relacionados

### 1️⃣ Consulta de Todos los Contratos
```
GET /contratos_emprestito_all
```
- Retorna los 60 registros combinados
- Usado por: `fetchContratos()`

### 2️⃣ Consulta de Órdenes de Compra
```
GET /emprestito/ordenes-compra
```
- Retorna los 12 registros editables de órdenes TVEC
- Campo identificador: `tipo: "orden_compra_manual"`

### 3️⃣ Consulta de Convenios/Transferencias
```
GET /convenios_transferencias_all
```
- Retorna los 4 registros editables de convenios
- Campo identificador: `tipo: "convenio_transferencia_manual"`

### 4️⃣ Actualización de Registros Editables
```
PUT /emprestito/modificar-convenio-transferencia
Body: { doc_id: string, ...formData }
```
- Usado por: `handleUpdateContrato()`
- Solo funciona para registros con `tipo: "orden_compra_manual"` o `"convenio_transferencia_manual"`

---

## 🎨 Interfaz de Usuario

### Tabla de Contratos

#### Columnas Principales:
- Número Contrato
- Objeto del Contrato
- Centro Gestor
- Banco
- Estado
- Valor Contrato
- Fechas (inicio, fin, firma)
- Modalidad
- Contratista
- Supervisor

#### Columna de Acciones:
```tsx
{esConvenioOTransferencia(contrato) && (
  <button onClick={() => handleEditContrato(contrato)}>
    <Edit2 className="h-4 w-4" />
  </button>
)}
```

**Comportamiento:**
- El botón de editar (✏️) **solo aparece** para los 16 registros editables
- Los 44 contratos de SECOP **NO muestran** botón de editar

---

## 🔍 Identificación Visual

### Registros Editables:
- ✅ Tienen botón de editar visible
- ✅ `tipo === "orden_compra_manual"` → Órdenes TVEC (12)
- ✅ `tipo === "convenio_transferencia_manual"` → Convenios (4)

### Registros No Editables:
- ❌ NO tienen botón de editar
- ❌ `tipo === undefined` o `null` → Contratos SECOP (44)

---

## 📝 Flujo de Edición

1. **Usuario ve la tabla** → 60 contratos totales
2. **Identifica registro editable** → Botón ✏️ visible
3. **Click en editar** → Abre modal `AgregarConvenioTransferenciaModal`
4. **Modifica datos** → Formulario prellenado con datos existentes
5. **Guarda cambios** → `PUT /emprestito/modificar-convenio-transferencia`
6. **Actualiza tabla** → Recarga con `fetchContratos()`

---

## 🛠️ Componentes Relacionados

| Componente | Propósito |
|------------|-----------|
| `GestionContratos.tsx` | Tabla principal de contratos |
| `AgregarConvenioTransferenciaModal.tsx` | Modal para crear/editar registros |
| `CargarRPCModal.tsx` | Modal para cargar RPCs |

---

## 🔐 Seguridad y Validación

### Backend valida:
- Que el `doc_id` exista en la base de datos
- Que el registro sea de tipo editable
- Que los campos requeridos estén presentes

### Frontend valida:
- Visibilidad del botón según campo `tipo`
- Formato de fechas y valores numéricos
- Completitud de campos obligatorios

---

## 📊 Ejemplo de Datos

### Contrato SECOP (NO editable):
```json
{
  "id": "2UzGRo01T7H71j0k0XCO",
  "referencia_contrato": "4134.010.26.1.0544-2025",
  "tipo_contrato": "Interventoría",
  "tipo": null,  // ❌ No editable
  "nombre_centro_gestor": "DATIC",
  "valor_contrato": 824287971
}
```

### Orden de Compra TVEC (Editable):
```json
{
  "id": "3XcwSfKMp4t6Z0jCGXFA",
  "referencia_contrato": "143275",
  "tipo_contrato": "Orden de Compra - TVEC",  // ✅ Editable
  "nombre_centro_gestor": "Secretaría de Infraestructura",
  "valor_contrato": "23260373389"
}
```

### Convenio/Transferencia (Editable):
```json
{
  "id": "PZjWJ8xfrxRBTiNuN6fF",
  "referencia_contrato": "4244.0.9.10.280",
  "tipo": "convenio_transferencia_manual",  // ✅ Editable
  "nombre_centro_gestor": "Secretaría de Vivienda",
  "valor_contrato": 16237022570
}
```

---

## ✅ Resumen de Implementación

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| **Mostrar todos los contratos** | ✅ Implementado | 60 registros visibles |
| **Editar solo registros manuales** | ✅ Implementado | 16 registros editables |
| **Endpoint de carga** | ✅ Correcto | `/contratos_emprestito_all` |
| **Endpoint de actualización** | ✅ Correcto | `/emprestito/modificar-convenio-transferencia` |
| **Validación de permisos** | ✅ Implementado | Campo `tipo` |

---

## 🎓 Para el Usuario Final

**¿Qué verás?**
- Una tabla con **60 contratos**
- Solo **16 registros** tendrán el botón de editar (✏️)
- Los **44 contratos** importados de SECOP son de **solo lectura**

**¿Cuáles puedes editar?**
- Órdenes de compra creadas manualmente (TVEC)
- Convenios y transferencias creados manualmente

**¿Cómo editar?**
1. Busca el contrato en la tabla
2. Si tiene el ícono ✏️, puedes hacer click
3. Modifica los datos en el modal
4. Guarda los cambios

---

## 📞 Soporte Técnico

Si un registro **debería ser editable** pero no muestra el botón:
1. Verificar el campo `tipo` en la base de datos
2. Debe ser `"orden_compra_manual"` o `"convenio_transferencia_manual"`
3. Revisar logs del navegador (Console)
4. Contactar al equipo de desarrollo

---

**Última actualización:** 2025-11-17  
**Versión:** 1.0  
**Componente:** `GestionContratos.tsx`
