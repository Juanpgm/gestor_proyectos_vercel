# 🔍 Diagnóstico: valor_proyectado en Producción

**Fecha:** 20 de noviembre, 2025  
**Estado:** ❌ **PROBLEMA IDENTIFICADO EN BACKEND**

---

## 📊 Resumen Ejecutivo

El campo `valor_proyectado` está llegando con valor `0` para **todos los 143 registros** tanto en Railway como en el proxy de Vercel. Esto indica que el problema **NO está en el frontend** sino en la **lectura del Google Sheet por parte del backend Railway**.

---

## 🧪 Pruebas Realizadas

### Test 1: Backend Railway (Directo)

```
Endpoint: https://gestorproyectoapi-production.up.railway.app/emprestito/leer-tabla-proyecciones
Registros: 143
Con valor_proyectado > 0: 0
Con valor_proyectado = 0: 143
Con valor_proyectado null/undefined: 0
```

### Test 2: Proxy Vercel (Local)

```
Endpoint: /api/emprestito/leer-tabla-proyecciones
Registros: 143
Con valor_proyectado > 0: 0
Con valor_proyectado = 0: 143
```

### Test 3: Endpoint proyecciones-sin-proceso

```
Endpoint: /emprestito/proyecciones-sin-proceso
Registros: 8
Con valor_proyectado > 0: 0
Todos los valores: 0
```

---

## ✅ Verificaciones Completadas

- ✅ **Frontend**: El código de `ProyeccionesEmprestito.tsx` está correcto

  - `formatValue()` funciona correctamente con tipo `'currency'`
  - La columna `valor_proyectado` está visible en la configuración
  - No hay transformaciones que eliminen o modifiquen el valor

- ✅ **Proxy API**: Los routes en `/api/emprestito/` están correctos

  - No hay mapeos ni filtros que alteren `valor_proyectado`
  - `NextResponse.json()` preserva todos los campos
  - Cache está deshabilitado correctamente

- ✅ **Tipo de dato**: Es consistente
  - Backend devuelve: `number`
  - Frontend recibe: `number`
  - No hay conversiones de string a number necesarias

---

## ❌ Problema Identificado

### El backend Railway devuelve TODOS los valores en 0

**Posibles causas:**

1. **Google Sheet tiene valores en 0**

   - La columna de valores proyectados podría estar vacía o en cero
   - Verificar manualmente el Sheet

2. **Nombre de columna incorrecto**

   - El backend busca una columna con nombre específico
   - Si el nombre cambió en el Sheet, no lee los datos

3. **Mapeo de columnas incorrecto en backend**

   - El código Python del backend puede tener un mapeo erróneo
   - Necesita revisar el archivo que lee el Google Sheet

4. **Formato de datos en Sheet**
   - Los valores pueden estar como texto en lugar de números
   - Puede haber caracteres especiales o formato de moneda

---

## 🔧 Acciones Requeridas (Backend)

### 1. Verificar Google Sheet Origen

```
Verificar:
- ¿Existe la columna de valores proyectados?
- ¿Cuál es el nombre exacto de la columna?
- ¿Los valores son números o texto?
- ¿Hay valores mayores a 0 en el Sheet?
```

### 2. Revisar Mapeo de Columnas en Backend

El backend necesita mapear correctamente:

```python
# Ejemplo de mapeo esperado
{
  'Columna_en_Sheet': 'valor_proyectado',
  # Verificar nombres exactos
}
```

Posibles nombres de columna en el Sheet:

- "Valor Proyectado"
- "Valor_Proyectado"
- "ValorProyectado"
- "Valor"
- "Monto"
- "Presupuesto"

### 3. Validar Lectura de Datos

En el backend FastAPI (Railway), verificar:

```python
# Archivo: backend/emprestito/leer_google_sheets.py (o similar)

# Asegurar que:
1. Se lee la columna correcta del Sheet
2. Se convierte a número (int o float)
3. Se maneja correctamente valores vacíos o null
4. Se asigna al campo 'valor_proyectado'
```

### 4. Logs del Backend

Agregar logging para debug:

```python
logger.info(f"Valor leído del Sheet: {valor_raw}")
logger.info(f"Valor convertido: {valor_proyectado}")
logger.info(f"Tipo: {type(valor_proyectado)}")
```

---

## 📋 Checklist de Verificación

- [ ] Acceder al Google Sheet y verificar columna de valores
- [ ] Identificar nombre exacto de la columna
- [ ] Verificar que hay valores > 0 en el Sheet
- [ ] Revisar código backend que lee el Sheet
- [ ] Verificar mapeo de columnas en backend
- [ ] Validar conversión de tipo de dato (string → number)
- [ ] Probar con un valor de prueba conocido
- [ ] Verificar logs del backend en Railway

---

## 🎯 Próximos Pasos

1. **INMEDIATO**: Verificar Google Sheet manualmente

   - Identificar si hay valores > 0
   - Anotar nombre exacto de la columna

2. **BACKEND**: Revisar código de lectura de Google Sheets

   - Archivo Python que procesa el Sheet
   - Función que mapea las columnas
   - Lógica de conversión de tipos

3. **TESTING**: Después de corregir backend
   - Ejecutar: `node test-valor-proyectado-detalle.js`
   - Verificar que hay valores > 0
   - Probar en frontend que se muestran correctamente

---

## 📞 Información de Contacto

**Backend API:** https://gestorproyectoapi-production.up.railway.app  
**Documentación API:** `/docs` (FastAPI Swagger UI)

---

## 📝 Notas Adicionales

### Estructura de datos correcta esperada:

```json
{
  "success": true,
  "data": [
    {
      "item": "139",
      "referencia_proceso": "ABC-123",
      "nombre_resumido_proceso": "Nombre del proceso",
      "valor_proyectado": 150000000, // ← Debe ser > 0 para algunos registros
      "nombre_organismo_reducido": "Organismo"
      // ... otros campos
    }
  ],
  "timestamp": "2025-11-20T..."
}
```

### Formato de valor_proyectado:

- **Tipo**: `number` (integer o float)
- **Rango**: 0 - 999,999,999,999 (billones)
- **Decimales**: Aceptados pero no requeridos
- **Null**: Aceptado (se renderiza como "-")

---

## ✅ Frontend Confirmado Como Correcto

El frontend está funcionando correctamente:

1. ✅ Recibe el valor como `number`
2. ✅ Formatea correctamente con `Intl.NumberFormat`
3. ✅ Muestra en formato moneda colombiana (COP)
4. ✅ Columna visible en tabla
5. ✅ Cache deshabilitado correctamente

**No se requieren cambios en el frontend.**

---

**Conclusión:** El problema es 100% en el backend Railway. Se requiere verificar el Google Sheet y el código de lectura/mapeo de columnas.
