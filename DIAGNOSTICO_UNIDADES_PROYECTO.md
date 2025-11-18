# 🔍 Diagnóstico: Unidades de Proyecto - Geometrías en Mapa

## ✅ Estado Actual de la API

### Endpoint Principal: `/unidades-proyecto/geometry`

- **Total de registros**: 1,641 unidades de proyecto
- **Formato**: GeoJSON estándar (RFC 7946)
- **Coordenadas**: Formato correcto `[lon, lat]`
- **Metadata**: Campo `has_valid_geometry` para identificar coordenadas válidas vs placeholders

### Ejemplo de Datos Correctos

```json
{
  "type": "Feature",
  "geometry": {
    "coordinates": [3.4418833, -76.520562], // [lon, lat] ✓
    "type": "Point"
  },
  "properties": {
    "upid": "UNP-1",
    "has_valid_geometry": true,
    "nombre_up": "Misión Santa Elena",
    "estado": "En alistamiento",
    "presupuesto_base": 650000000
  }
}
```

---

## 🎯 Verificación de Problemas Comunes

### 1. ¿Los datos se cargan correctamente?

**Verificar en el navegador:**

```javascript
// Abrir DevTools > Console y ejecutar:
fetch("/api/proxy/unidades-proyecto/geometry?limit=10")
  .then((r) => r.json())
  .then((data) => {
    console.log("✅ Total features:", data.features?.length || 0);
    console.log(
      "📍 Primera coordenada:",
      data.features[0]?.geometry?.coordinates
    );
    console.log(
      "🗺️ Has valid geometry:",
      data.features[0]?.properties?.has_valid_geometry
    );
  });
```

**Resultado esperado:**

- Total features: 10
- Primera coordenada: `[3.4418833, -76.520562]`
- Has valid geometry: `true`

---

### 2. ¿Las coordenadas están en el rango correcto para Cali, Colombia?

**Rangos válidos para Santiago de Cali:**

- **Latitud**: 3.3° a 3.6° N (aproximadamente)
- **Longitud**: -76.7° a -76.4° W (aproximadamente)

**Verificar en datos:**

```javascript
// En DevTools Console:
fetch("/api/proxy/unidades-proyecto/geometry?limit=50")
  .then((r) => r.json())
  .then((data) => {
    const validCoords = data.features.filter((f) => {
      const [lon, lat] = f.geometry.coordinates;
      return lat >= 3.3 && lat <= 3.6 && lon >= -76.7 && lon <= -76.4;
    });
    console.log(
      `✅ Coordenadas válidas: ${validCoords.length}/${data.features.length}`
    );
    console.log(
      "📍 Muestra:",
      validCoords.slice(0, 3).map((f) => ({
        upid: f.properties.upid,
        coords: f.geometry.coordinates,
        nombre: f.properties.nombre_up,
      }))
    );
  });
```

---

### 3. ¿El mapa se centra correctamente?

**Centro de Cali:**

- **Latitud**: 3.4516
- **Longitud**: -76.5320

**Verificar en código (MapContainer):**

```tsx
// Debe estar en EnhancedUnidadesProyectoMap.tsx o similar
<MapContainer
  center={[3.4516, -76.5320]}  // ✓ CORRECTO
  zoom={13}
  style={{ height: '100%', width: '100%' }}
>
```

---

## 🛠️ Soluciones para Problemas Comunes

### Problema A: Puntos no visibles en el mapa

**Causa posible**: Coordenadas con `has_valid_geometry: false` (placeholders [0, 0])

**Solución 1: Filtrar puntos con geometría inválida**

```typescript
// En tu componente de mapa, filtrar antes de renderizar
const validFeatures = geometryData?.features?.filter(
  feature => feature.properties.has_valid_geometry === true
) || [];

const filteredGeoJSON = {
  type: 'FeatureCollection',
  features: validFeatures
};

// Usar filteredGeoJSON en lugar de geometryData
<GeoJSON data={filteredGeoJSON} ... />
```

**Solución 2: Agregar parámetro a la API**

```typescript
// Modificar la llamada para obtener solo geometrías válidas
const response = await fetch(
  "/api/proxy/unidades-proyecto/geometry?only_with_geometry=true"
);
```

---

### Problema B: Coordenadas intercambiadas (lon/lat vs lat/lon)

**Síntoma**: Los puntos aparecen en el océano o muy lejos de Cali

**Diagnóstico actual**: ✅ Tu código YA INVIERTE CORRECTAMENTE las coordenadas

```typescript
// EnhancedUnidadesProyectoMap.tsx - línea ~822
pointToLayer={(feature: any, latlng: any) => {
  const style = getCircleMarkerStyle(feature);
  return L.circleMarker(latlng, style); // Leaflet maneja automáticamente
}}
```

**Si aún ves problemas:**

```typescript
// Verificar manualmente en Console:
const testPoint = data.features[0].geometry.coordinates;
console.log("GeoJSON [lon, lat]:", testPoint);
console.log("Leaflet [lat, lon]:", [testPoint[1], testPoint[0]]);
// GeoJSON: [3.4418833, -76.520562] ❌ INCORRECTO (lon y lat invertidos)
// Debería ser: [-76.520562, 3.4418833] ✓ CORRECTO
```

**⚠️ NOTA IMPORTANTE**: Los datos de la API muestran:

```json
"coordinates": [3.4418833, -76.520562]
```

Esto significa **[lat, lon]** pero GeoJSON espera **[lon, lat]**.

**PROBLEMA CRÍTICO ENCONTRADO**: Las coordenadas en la API están invertidas.

---

### Problema C: Rendimiento lento al cargar 1,641 puntos

**Solución: Implementar clustering**

```typescript
import MarkerClusterGroup from 'react-leaflet-cluster';

// En tu componente de mapa
<MarkerClusterGroup>
  <GeoJSON
    data={filteredGeoJSON}
    pointToLayer={...}
    onEachFeature={...}
  />
</MarkerClusterGroup>
```

**Instalar dependencia:**

```bash
npm install react-leaflet-cluster
```

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### Las coordenadas en la API están en formato INCORRECTO

**Datos actuales:**

```json
"coordinates": [3.4418833, -76.520562]  // [lat, lon] ❌
```

**Deberían ser (GeoJSON estándar):**

```json
"coordinates": [-76.520562, 3.4418833]  // [lon, lat] ✓
```

### ✅ Soluciones Recomendadas

#### **Opción 1: Corregir en el Backend (RECOMENDADO)**

**Modificar el endpoint en Python (FastAPI):**

```python
# En tu archivo de backend que genera las geometrías
def crear_punto_geojson(lat, lon):
    return {
        "type": "Point",
        "coordinates": [lon, lat]  # ✓ Orden correcto: [lon, lat]
    }

# O si ya tienes los datos, invertir al cargar:
for feature in features:
    coords = feature['geometry']['coordinates']
    if len(coords) == 2:
        # Detectar si están invertidos (lat en coords[0] indica error)
        if coords[0] > -90 and coords[0] < 90 and abs(coords[1]) > 90:
            # Están invertidos, corregir
            feature['geometry']['coordinates'] = [coords[1], coords[0]]
```

#### **Opción 2: Corregir en el Frontend (TEMPORAL)**

**En `unidades-proyecto.service.ts`:**

```typescript
export const fetchGeometryData = async (
  filters: FilterParams = {}
): Promise<GeometryData> => {
  // ... código existente ...

  // DESPUÉS de validar con el schema
  const correctedData = {
    ...validatedData,
    features: validatedData.features.map((feature) => {
      if (feature.geometry.type === "Point") {
        const [coord1, coord2] = feature.geometry.coordinates as [
          number,
          number
        ];

        // Detectar si están invertidos
        // Cali está entre lat 3.3-3.6 y lon -76.7 a -76.4
        const isInverted = coord1 > 0 && coord1 < 10 && coord2 < -70;

        if (isInverted) {
          return {
            ...feature,
            geometry: {
              ...feature.geometry,
              coordinates: [coord2, coord1], // Invertir
            },
          };
        }
      }
      return feature;
    }),
  };

  return correctedData;
};
```

---

## 📋 Checklist de Validación

### En el Backend (Python/FastAPI)

- [ ] Verificar que las coordenadas se almacenan como `[lon, lat]`
- [ ] Confirmar que la función de creación de geometrías usa el orden correcto
- [ ] Validar contra un punto conocido (ej: Torre de Cali: [-76.5320, 3.4516])
- [ ] Agregar tests unitarios para geometrías

### En el Frontend (Next.js/React)

- [ ] Verificar que `has_valid_geometry` se usa para filtrar
- [ ] Confirmar que Leaflet recibe coordenadas en formato [lat, lon]
- [ ] Implementar clustering para mejor rendimiento
- [ ] Agregar indicadores visuales para geometrías inválidas

### En la Base de Datos (Firestore)

- [ ] Revisar formato de almacenamiento de coordenadas
- [ ] Ejecutar script de corrección si es necesario
- [ ] Crear backup antes de hacer cambios masivos

---

## 🎯 Plan de Acción Recomendado

### Fase 1: Diagnóstico (5 min)

1. Abrir el mapa en el navegador
2. Ejecutar los scripts de verificación en Console
3. Identificar si los puntos están visibles o no

### Fase 2: Corrección Backend (30 min - RECOMENDADO)

1. Crear script de Python para verificar y corregir coordenadas en Firestore
2. Ejecutar en modo de prueba con 10 registros
3. Validar resultados
4. Aplicar a todos los registros
5. Actualizar endpoint para futuros datos

### Fase 3: Corrección Frontend (15 min - TEMPORAL)

1. Implementar lógica de detección e inversión en `unidades-proyecto.service.ts`
2. Probar con datos existentes
3. Verificar que los puntos aparecen correctamente en Cali

### Fase 4: Optimización (1 hora)

1. Implementar clustering de marcadores
2. Agregar filtro para `has_valid_geometry`
3. Mejorar performance de renderizado
4. Agregar indicadores visuales para datos sin geometría

---

## 🔧 Scripts de Ayuda

### Script 1: Verificar coordenadas en Firestore (Python)

```python
import firebase_admin
from firebase_admin import credentials, firestore

# Inicializar Firebase (si no está ya inicializado)
# cred = credentials.Certificate("path/to/serviceAccount.json")
# firebase_admin.initialize_app(cred)

db = firestore.client()

def verificar_coordenadas():
    """Verifica el formato de coordenadas en la colección"""
    collection = db.collection('unidades_proyecto')
    docs = collection.limit(10).stream()

    problemas = []
    correctos = []

    for doc in docs:
        data = doc.to_dict()
        if 'geometry' in data and 'coordinates' in data['geometry']:
            coords = data['geometry']['coordinates']
            upid = data.get('upid', doc.id)

            # Verificar si están invertidos
            # GeoJSON debe ser [lon, lat]
            # Para Cali: lon ~ -76.5, lat ~ 3.4
            if len(coords) == 2:
                lon, lat = coords[0], coords[1]

                # Detectar inversión
                if lat < -70 and lon > 0 and lon < 10:
                    problemas.append({
                        'upid': upid,
                        'actual': coords,
                        'correcto': [lat, lon]  # Invertir
                    })
                elif lon < -70 and lat > 0 and lat < 10:
                    correctos.append({
                        'upid': upid,
                        'coords': coords
                    })

    print(f"✅ Correctos: {len(correctos)}")
    print(f"❌ Con problemas: {len(problemas)}")

    if problemas:
        print("\n🔧 Ejemplos de coordenadas a corregir:")
        for p in problemas[:3]:
            print(f"  UPID: {p['upid']}")
            print(f"    Actual: {p['actual']}")
            print(f"    Correcto: {p['correcto']}")

    return problemas, correctos

if __name__ == "__main__":
    problemas, correctos = verificar_coordenadas()
```

### Script 2: Corregir coordenadas (Python)

```python
def corregir_coordenadas(dry_run=True):
    """Corrige coordenadas invertidas en Firestore"""
    collection = db.collection('unidades_proyecto')
    docs = collection.stream()

    corregidos = 0
    errores = 0

    for doc in docs:
        try:
            data = doc.to_dict()
            if 'geometry' in data and 'coordinates' in data['geometry']:
                coords = data['geometry']['coordinates']

                if len(coords) == 2:
                    lon, lat = coords[0], coords[1]

                    # Detectar inversión
                    if lat < -70 and lon > 0 and lon < 10:
                        coords_corregidos = [lat, lon]  # Invertir

                        if not dry_run:
                            # Actualizar en Firestore
                            doc.reference.update({
                                'geometry.coordinates': coords_corregidos
                            })

                        corregidos += 1
                        print(f"✅ {doc.id}: {coords} → {coords_corregidos}")
        except Exception as e:
            errores += 1
            print(f"❌ Error en {doc.id}: {e}")

    print(f"\n📊 Resultado:")
    print(f"  Corregidos: {corregidos}")
    print(f"  Errores: {errores}")
    print(f"  Modo: {'DRY RUN (sin cambios)' if dry_run else 'PRODUCCIÓN (con cambios)'}")

if __name__ == "__main__":
    # Primero ejecutar en modo dry_run
    print("🧪 Ejecutando en modo prueba...")
    corregir_coordenadas(dry_run=True)

    # input("\n⚠️  ¿Aplicar cambios? (Ctrl+C para cancelar)")
    # corregir_coordenadas(dry_run=False)
```

---

## 📞 Contacto y Soporte

Si encuentras problemas adicionales o necesitas ayuda con la implementación:

1. **Revisar logs del backend**: Buscar errores en Railway
2. **Verificar Network tab**: Ver las respuestas de la API
3. **Console errors**: Revisar errores de JavaScript en el navegador

---

## 📚 Referencias

- [GeoJSON Specification RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [React Leaflet](https://react-leaflet.js.org/)
