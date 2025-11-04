# Capa de División Geopolítica - Comunas

## Descripción

Se ha agregado una capa de división geopolítica (comunas) al mapa de unidades de proyectos. Esta capa muestra los límites de las 22 comunas y permite visualizar la distribución geográfica de los proyectos dentro del contexto administrativo del municipio.

## Características

### 1. Visualización de Comunas
- **22 comunas** cargadas desde el archivo GeoJSON
- Límites visualizados con líneas punteadas azules
- Relleno semi-transparente que se adapta al tema (claro/oscuro)
- Efectos de hover para mejor interactividad

### 2. Control de Capas
- Botón de control para mostrar/ocultar la capa de comunas
- Ubicado en la esquina superior izquierda del mapa
- Ícono de ojo que indica el estado (visible/oculto)
- Estado persistente durante la sesión

### 3. Información Interactiva
- Popup al hacer clic en una comuna con:
  - Nombre de la comuna
  - Número de comuna
  - Área en km² (si está disponible)
- Estilo adaptable al tema del sistema

### 4. Integración Visual
- Se superpone correctamente sobre el mapa base
- No interfiere con los marcadores de proyectos
- Colores y opacidades optimizados para ambos temas

## Archivos Creados/Modificados

### Archivos de Datos
```
public/data/geodata/
├── Comunas.kml           # Archivo KML original
└── comunas.geojson       # Archivo GeoJSON convertido
```

### Scripts
```
scripts/
└── convert-kml-to-geojson.js  # Script de conversión KML → GeoJSON
```

### Componentes
```
src/components/
└── UnidadesProyectoMapSimple.tsx  # Componente del mapa actualizado
```

## Uso

### Visualizar las Comunas

1. Abre la página de Unidades de Proyecto
2. En el mapa, verás un control en la esquina superior izquierda
3. Haz clic en el botón "Comunas" para mostrar/ocultar la capa
4. Haz clic en cualquier comuna para ver su información

### Convertir Nuevos Archivos KML

Si necesitas agregar o actualizar archivos KML:

1. Coloca el archivo KML en `public/data/geodata/`
2. Actualiza la ruta en `scripts/convert-kml-to-geojson.js`
3. Ejecuta el script:
   ```bash
   npm run geo:convert-kml
   ```

## Especificaciones Técnicas

### Estilos de la Capa

**Tema Claro:**
- Color de línea: `#2563EB` (azul)
- Grosor de línea: `2px`
- Opacidad de relleno: `0.05`
- Patrón de línea: líneas punteadas (5, 5)

**Tema Oscuro:**
- Color de línea: `#3B82F6` (azul claro)
- Grosor de línea: `2px`
- Opacidad de relleno: `0.08`
- Patrón de línea: líneas punteadas (5, 5)

**Hover:**
- Grosor aumenta a `3px`
- Opacidad de relleno aumenta a `0.15`
- Color más brillante

### Dependencias Agregadas

```json
{
  "@xmldom/xmldom": "^latest",
  "@mapbox/togeojson": "^latest"
}
```

## Estructura del GeoJSON

El archivo `comunas.geojson` contiene:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon" | "MultiPolygon",
        "coordinates": [...]
      },
      "properties": {
        "nombre": "Comuna 1",
        "comuna": "1",
        "descripcion": "...",
        "shape_leng": 12758.747,
        "shape_area": 5384271.744
      }
    }
  ]
}
```

## Mejoras Futuras

### Posibles Extensiones
1. **Análisis por Comuna**
   - Estadísticas de proyectos por comuna
   - Presupuesto total por comuna
   - Estado de proyectos por comuna

2. **Filtrado Geográfico**
   - Filtrar proyectos por comuna seleccionada
   - Resaltar comuna con más proyectos

3. **Otras Divisiones**
   - Barrios/Veredas
   - Zonas administrativas
   - Distritos electorales

4. **Exportación**
   - Exportar datos filtrados por comuna
   - Generar reportes geográficos

## Solución de Problemas

### La capa no se muestra
- Verifica que el archivo `comunas.geojson` existe en `public/data/geodata/`
- Revisa la consola del navegador para errores de carga
- Asegúrate de que el botón "Comunas" esté activado

### Error al convertir KML
- Verifica que el archivo KML sea válido
- Asegúrate de que las dependencias estén instaladas: `npm install`
- Revisa que la ruta del archivo sea correcta

### Problemas de rendimiento
- El archivo GeoJSON con 22 comunas es ligero (~500KB)
- Si agregás más capas, considera lazy loading
- Usa simplificación de geometrías para archivos grandes

## Créditos

- **Datos geográficos:** División política administrativa del municipio
- **Formato original:** KML
- **Conversión:** @mapbox/togeojson
- **Visualización:** React Leaflet

---

**Fecha de implementación:** Noviembre 2025
**Versión:** 1.0.0
