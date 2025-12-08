# Documentación: Campos de Unidades de Proyecto

## Endpoint: GET /unidades-proyecto/attributes

### Campos de Fechas Disponibles

El endpoint `/unidades-proyecto/attributes` debe incluir los siguientes campos de fechas:

| Campo                | Tipo        | Descripción                            | Estado Actual            |
| -------------------- | ----------- | -------------------------------------- | ------------------------ |
| `clase_up`           | string      | Clasificación de la Unidad de Proyecto | ✅ Disponible            |
| `fecha_inicio`       | string/date | Fecha de inicio del proyecto           | ✅ Disponible            |
| `fecha_fin`          | string/date | Fecha de finalización del proyecto     | ✅ Disponible            |
| `fecha_inauguracion` | string/date | Fecha de inauguración del proyecto     | ❌ **PENDIENTE AGREGAR** |

### Cambios Requeridos en el Backend

#### 1. Agregar campo `fecha_inauguracion` en el modelo de datos

En el backend FastAPI (Railway), necesitas agregar el campo `fecha_inauguracion` a:

**Archivo: models.py o similar**

```python
class UnidadProyecto(BaseModel):
    # ... campos existentes ...
    clase_up: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    fecha_inauguracion: Optional[datetime] = None  # ⬅️ NUEVO CAMPO
```

#### 2. Actualizar el endpoint de attributes

**Archivo: routers/unidades_proyecto.py o similar**

```python
@router.get("/unidades-proyecto/attributes")
async def get_unidades_proyecto_attributes(
    limit: Optional[int] = None,
    offset: Optional[int] = None
):
    # Asegurarse de incluir fecha_inauguracion en la proyección
    projection = {
        "_id": 0,
        "clase_up": 1,
        "fecha_inicio": 1,
        "fecha_fin": 1,
        "fecha_inauguracion": 1,  # ⬅️ NUEVO CAMPO
        # ... otros campos ...
    }

    # Query a la base de datos con la proyección actualizada
    # ...
```

#### 3. Actualizar la base de datos

Si los datos ya existen en Firebase/MongoDB, asegúrate de que el campo `fecha_inauguracion` esté presente:

```python
# Script de migración si es necesario
from datetime import datetime

def agregar_campo_fecha_inauguracion():
    collection = db.get_collection("unidades-proyecto")

    # Agregar el campo a documentos existentes si no lo tienen
    collection.update_many(
        {"fecha_inauguracion": {"$exists": False}},
        {"$set": {"fecha_inauguracion": None}}
    )
```

### Formato de Fechas Esperado

Todas las fechas deben seguir el formato ISO 8601:

```json
{
  "clase_up": "Infraestructura Vial",
  "fecha_inicio": "2024-01-15T00:00:00",
  "fecha_fin": "2025-06-30T00:00:00",
  "fecha_inauguracion": "2025-07-15T00:00:00"
}
```

O pueden ser `null` si no están disponibles:

```json
{
  "clase_up": "Equipamiento Educativo",
  "fecha_inicio": null,
  "fecha_fin": null,
  "fecha_inauguracion": null
}
```

### Ejemplo de Respuesta Completa

```json
{
  "success": true,
  "data": [
    {
      "upid": "UNP-2238",
      "nombre_up": "Construcción Vía Principal",
      "clase_up": "Infraestructura Vial",
      "fecha_inicio": "2024-01-15T00:00:00",
      "fecha_fin": "2025-06-30T00:00:00",
      "fecha_inauguracion": "2025-07-15T00:00:00",
      "estado": "En ejecución",
      "presupuesto_base": 5000000000,
      "avance_obra": 0.45
    }
  ],
  "count": 1,
  "type": "attributes"
}
```

### Validaciones Recomendadas

1. **fecha_inicio** debe ser anterior a **fecha_fin**
2. **fecha_inauguracion** debe ser posterior o igual a **fecha_fin**
3. Todas las fechas son opcionales (pueden ser null)
4. Formato ISO 8601 para consistencia

### Pruebas

Después de implementar el cambio, verifica con:

```bash
curl "https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/attributes?limit=1"
```

Deberías ver el campo `fecha_inauguracion` en la respuesta.

---

## Actualización del Frontend

El frontend (Next.js) ya está preparado para recibir estos campos a través del proxy:

**Ruta:** `src/app/api/proxy/unidades-proyecto/attributes/route.ts`

Este proxy no requiere cambios, ya que simplemente retransmite los datos del backend.

### Uso en Componentes

Una vez que el backend retorne el campo `fecha_inauguracion`, estará disponible en todos los componentes que consumen el endpoint:

```typescript
// Ejemplo de uso en un componente
import { useUnidadesProyecto } from "@/hooks/useUnidadesProyecto";

function MiComponente() {
  const { data } = useUnidadesProyecto();

  return (
    <div>
      {data.map((proyecto) => (
        <div key={proyecto.upid}>
          <p>Clase: {proyecto.clase_up}</p>
          <p>Inicio: {proyecto.fecha_inicio}</p>
          <p>Fin: {proyecto.fecha_fin}</p>
          <p>Inauguración: {proyecto.fecha_inauguracion}</p>
        </div>
      ))}
    </div>
  );
}
```

---

**Fecha de documentación:** 21 de noviembre de 2025  
**Estado:** Pendiente implementación de `fecha_inauguracion` en backend
