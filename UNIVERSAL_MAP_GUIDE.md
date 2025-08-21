# 🗺️ UniversalGeoJSONMap - Componente Universal para Mapas Leaflet

## 📋 **Descripción**

`UniversalGeoJSONMap` es un componente React universal y altamente configurable para renderizar mapas con datos GeoJSON usando Leaflet. Diseñado siguiendo las mejores prácticas de software, evita duplicación de código y proporciona máxima flexibilidad.

## 🎯 **Características Principales**

### ✅ **Configuración Universal**

- **Tiles personalizables**: Cualquier proveedor de mapas
- **Múltiples capas**: Puntos, líneas, polígonos
- **Estilos dinámicos**: Función o configuración estática
- **Popups configurables**: Content completamente personalizable

### ✅ **Optimización Automática**

- **Carga inteligente**: Props directos o archivos GeoJSON
- **Canvas rendering**: Para mejor rendimiento
- **Cache integrado**: Usa `geoJSONLoader.ts` automáticamente
- **Procesamiento coordenadas**: Corrección automática

### ✅ **Flexibilidad Total**

- **Eventos personalizados**: Click, hover, etc.
- **Estadísticas opcionales**: Contadores automáticos
- **Estados de carga**: Loading, error, success
- **Clustering**: Preparado para activar

## 🚀 **Uso Básico**

### Importación

```typescript
import UniversalGeoJSONMap, {
  createEquipamientosLayer,
  createInfraestructuraLayer,
  createComunasLayer,
  createBarriosLayer,
} from "@/components/UniversalGeoJSONMap";
```

### Configuración Simple

```tsx
<UniversalGeoJSONMap
  tileConfig={{
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  }}
  layers={[
    createEquipamientosLayer("equipamientos"),
    createInfraestructuraLayer("infraestructura_vial"),
  ]}
/>
```

## 🔧 **Configuraciones Avanzadas**

### 1. **Mapa con Datos Personalizados**

```tsx
<UniversalGeoJSONMap
  center={[3.4516, -76.532]}
  zoom={12}
  tileConfig={{
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© CARTO",
  }}
  layers={[
    {
      id: "custom-points",
      data: myCustomGeoJSON,
      type: "point",
      style: {
        radius: 8,
        fillColor: "#FF6B6B",
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.8,
      },
      popup: (feature) => `<h3>${feature.properties.name}</h3>`,
    },
  ]}
  showStats={true}
  useCanvas={true}
/>
```

### 2. **Estilos Dinámicos**

```tsx
const equipamientosLayer = {
  id: "equipamientos",
  fileName: "equipamientos",
  type: "point" as const,
  style: (feature: any) => {
    const clase = feature.properties?.clase_obra?.toLowerCase() || "";

    return {
      radius: clase.includes("educativa") ? 10 : 6,
      fillColor: clase.includes("educativa")
        ? "#10B981"
        : clase.includes("deportiva")
        ? "#3B82F6"
        : "#6B7280",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 0.8,
    };
  },
  popup: (feature) => {
    const props = feature.properties || {};
    return `
      <div style="font-family: system-ui; min-width: 200px;">
        <h4>${props.nickname || "Equipamiento"}</h4>
        <p><strong>Clase:</strong> ${props.clase_obra || "N/A"}</p>
        <p><strong>Comuna:</strong> ${props.comuna_corregimiento || "N/A"}</p>
      </div>
    `;
  },
};
```

### 3. **Múltiples Capas con Diferentes Tipos**

```tsx
<UniversalGeoJSONMap
  tileConfig={{
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
  }}
  layers={[
    // Polígonos de fondo (comunas)
    createComunasLayer("comunas"),

    // Líneas de infraestructura
    createInfraestructuraLayer("infraestructura_vial"),

    // Puntos de equipamientos
    createEquipamientosLayer("equipamientos"),

    // Capa personalizada
    {
      id: "custom-areas",
      fileName: "areas_especiales",
      type: "polygon",
      style: {
        color: "#8B5CF6",
        weight: 3,
        fillOpacity: 0.2,
      },
    },
  ]}
  onFeatureClick={(feature, layer) => {
    console.log("Clicked:", feature.properties);
  }}
/>
```

## 🔧 **Configuración de Props**

### **UniversalGeoJSONMapProps**

```typescript
interface UniversalGeoJSONMapProps {
  // Configuración básica del mapa
  center?: [number, number]; // Default: CALI_COORDINATES.CENTER_LAT_LNG
  zoom?: number; // Default: CALI_COORDINATES.DEFAULT_ZOOM
  className?: string; // Clases CSS adicionales

  // Configuración de tiles (REQUERIDO)
  tileConfig: {
    url: string; // URL del tile server
    attribution: string; // Atribución del mapa
    maxZoom?: number; // Default: 18
    minZoom?: number; // Default: 8
  };

  // Capas de datos (REQUERIDO)
  layers: LayerConfig[]; // Array de configuraciones de capas

  // Características opcionales
  showStats?: boolean; // Mostrar estadísticas (default: true)
  enableClustering?: boolean; // Habilitar clustering (default: false)
  onFeatureClick?: (feature, layer) => void; // Callback para clicks
  onMapReady?: (map) => void; // Callback cuando el mapa esté listo

  // Optimizaciones
  useCanvas?: boolean; // Usar canvas rendering (default: true)
  processCoordinates?: boolean; // Procesar coordenadas (default: true)
}
```

### **LayerConfig**

```typescript
interface LayerConfig {
  id: string; // Identificador único de la capa
  fileName?: string; // Nombre del archivo GeoJSON a cargar
  data?: any; // Datos GeoJSON directos (alternativa a fileName)
  type: "point" | "line" | "polygon"; // Tipo de geometría
  style?: LayerStyleConfig | ((feature) => LayerStyleConfig); // Estilo
  popup?: (feature) => string; // Función para generar popup HTML
  visible?: boolean; // Visibilidad de la capa (default: true)
}
```

### **LayerStyleConfig**

```typescript
interface LayerStyleConfig {
  // Para todos los tipos
  color?: string; // Color del borde
  weight?: number; // Grosor del borde
  opacity?: number; // Opacidad del borde

  // Para polígonos y puntos
  fillColor?: string; // Color de relleno
  fillOpacity?: number; // Opacidad del relleno

  // Solo para puntos
  radius?: number; // Radio del círculo
}
```

## 🛠️ **Utilidades Helper**

### **Capas Predefinidas**

```typescript
// Equipamientos con estilos por clase
createEquipamientosLayer(fileName?: string, data?: any): LayerConfig

// Infraestructura vial con estilos por tipo
createInfraestructuraLayer(fileName?: string, data?: any): LayerConfig

// Comunas con estilo de polígono azul
createComunasLayer(fileName?: string, data?: any): LayerConfig

// Barrios con estilo de polígono verde
createBarriosLayer(fileName?: string, data?: any): LayerConfig
```

## 📁 **Archivos de Datos Soportados**

El componente busca archivos GeoJSON en las siguientes ubicaciones:

- `/geodata/` - Para archivos geográficos generales
- `/data/unidades_proyecto/` - Para proyectos específicos

### **Archivos Disponibles**

- `barrios.geojson`
- `comunas.geojson`
- `corregimientos.geojson`
- `veredas.geojson`
- `equipamientos.geojson`
- `infraestructura_vial.geojson`

## 🎨 **Ejemplos de Configuración de Tiles**

### **OpenStreetMap**

```typescript
tileConfig: {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors"
}
```

### **CartoDB Light**

```typescript
tileConfig: {
  url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  attribution: "© CARTO"
}
```

### **CartoDB Dark**

```typescript
tileConfig: {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution: "© CARTO"
}
```

### **Satellite (Esri)**

```typescript
tileConfig: {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "© Esri"
}
```

## 📊 **Integración con Hook de Datos**

```tsx
import { useUnidadesProyecto } from "@/hooks/useUnidadesProyecto";

const MapWithData = () => {
  const { equipamientos, infraestructura, loading } = useUnidadesProyecto();

  if (loading) return <div>Cargando...</div>;

  return (
    <UniversalGeoJSONMap
      tileConfig={{
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap",
      }}
      layers={[
        createEquipamientosLayer(undefined, equipamientos),
        createInfraestructuraLayer(undefined, infraestructura),
      ]}
    />
  );
};
```

## 🔄 **Migración desde Componentes Anteriores**

### **Desde SimpleMap**

```tsx
// Antes
<SimpleMap
  tileLayerUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  tileLayerAttribution="© OpenStreetMap"
  equipamientos={equipamientosData}
  infraestructura={infraestructuraData}
/>

// Ahora
<UniversalGeoJSONMap
  tileConfig={{
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap"
  }}
  layers={[
    createEquipamientosLayer(undefined, equipamientosData),
    createInfraestructuraLayer(undefined, infraestructuraData)
  ]}
/>
```

### **Desde DynamicMapContent**

```tsx
// Antes
<DynamicMapContent
  tileLayerUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  tileLayerAttribution="© OpenStreetMap"
/>

// Ahora
<UniversalGeoJSONMap
  tileConfig={{
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap"
  }}
  layers={[
    createEquipamientosLayer('equipamientos'),
    createInfraestructuraLayer('infraestructura_vial')
  ]}
/>
```

## 🎯 **Ventajas del Nuevo Enfoque**

### ✅ **Comparado con SimpleMap**

- ✅ Configuración más flexible y limpia
- ✅ Soporte para múltiples capas simultáneas
- ✅ Estilos dinámicos por feature
- ✅ Better TypeScript support

### ✅ **Comparado con DynamicMapContent**

- ✅ No hardcodeado a archivos específicos
- ✅ Configuración completa desde props
- ✅ Reutilizable para cualquier tipo de mapa
- ✅ Mejor manejo de errores

### ✅ **Comparado con ChoroplethMapLeaflet**

- ✅ Más simple para casos básicos
- ✅ Configuración declarativa vs imperativa
- ✅ Menor complejidad de código
- ✅ Enfoque en reutilización

## 🚨 **Consideraciones Importantes**

1. **Rendimiento**: Usa `useCanvas={true}` para mapas con muchas features
2. **Memoria**: El cache se maneja automáticamente via `geoJSONLoader`
3. **TypeScript**: Todas las interfaces están tipadas correctamente
4. **Responsive**: El componente se adapta al contenedor padre
5. **Accesibilidad**: Popups y controles son accesibles por teclado

---

**¡Componente listo para reemplazar todos los mapas existentes con una API unificada!** 🎉
