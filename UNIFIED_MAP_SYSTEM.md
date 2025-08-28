# 🗺️ Sistema de Mapas Unificado

## 🎯 **Objetivo**

El **Sistema de Mapas Unificado** resuelve el problema de fragmentación entre componentes de mapa y gestión de capas. Ahora todos los componentes funcionan de manera cohesiva y pueden comunicarse entre sí efectivamente.

## 🚀 **Componentes Principales**

### **1. UnifiedMapInterface**

_El componente principal que integra todo_

```tsx
<UnifiedMapInterface
  height="800px"
  selectedProjectUnitFromTable={selectedUnit}
  onFeatureClick={(feature, layerType) => {}}
  enablePanels={true}
  initialLayersPanelCollapsed={false}
  initialPropertiesPanelCollapsed={true}
/>
```

**Características:**

- ✅ **Panel izquierdo**: Gestión avanzada de capas con filtros
- ✅ **Área central**: Mapa interactivo con todas las funcionalidades
- ✅ **Panel derecho**: Propiedades detalladas de elementos seleccionados
- ✅ **Comunicación bidireccional**: Entre tabla y mapa
- ✅ **Persistencia**: Configuración guardada en localStorage

### **2. useUnifiedLayerManagement Hook**

_Gestión centralizada del estado de capas_

```tsx
const {
  layers,
  updateLayer,
  toggleLayerVisibility,
  getFilteredData,
  updateFilters,
  stats,
} = useUnifiedLayerManagement();
```

**Funcionalidades:**

- 🔄 **Estado centralizado** de todas las capas
- 🎨 **Gestión de estilos** y simbología
- 🔍 **Sistema de filtros** avanzado
- 💾 **Persistencia automática** en localStorage
- 📊 **Estadísticas en tiempo real**

### **3. LayerControlAdvanced**

_Panel de control avanzado para capas_

**Características:**

- 🔍 **Búsqueda en tiempo real** en propiedades
- 🏷️ **Filtros por categoría** y estado
- 👁️ **Toggle de visibilidad** rápido
- 🎨 **Control de opacidad** por capa
- ⚙️ **Acceso a configuración** de simbología
- 📈 **Estadísticas visuales** de capas

## 🔧 **Arquitectura**

```
┌─────────────────────────────────────────────────────────────┐
│                    UnifiedMapInterface                       │
├─────────────────┬───────────────────────┬───────────────────┤
│  Panel Capas    │     Mapa Central      │  Panel Props      │
│                 │                       │                   │
│ LayerControl    │   UniversalMapCore    │ PropertiesPanel   │
│ Advanced        │                       │                   │
│                 │                       │                   │
│ - Filtros       │ - Carga GeoJSON       │ - Detalles        │
│ - Búsqueda      │ - Interacciones       │ - Métricas        │
│ - Estadísticas  │ - Simbología          │ - Gráficos        │
│ - Configuración │ - Controles           │ - Exportar        │
└─────────────────┴───────────────────────┴───────────────────┘
                              │
                    ┌─────────────────────┐
                    │ useUnifiedLayer     │
                    │ Management          │
                    │                     │
                    │ - Estado global     │
                    │ - Filtros           │
                    │ - Persistencia      │
                    │ - Comunicación      │
                    └─────────────────────┘
```

## 🔄 **Flujo de Comunicación**

### **1. Carga de Datos**

```
useUnidadesProyecto → allGeoJSONData → UnifiedMapInterface
                                            ↓
                                   useUnifiedLayerManagement
                                            ↓
                                   updateLayerData() para cada capa
```

### **2. Interacciones del Usuario**

```
LayerControlAdvanced → updateLayer() → useUnifiedLayerManagement
                                            ↓
                                   mapLayers actualizado
                                            ↓
                                   UniversalMapCore re-render
```

### **3. Selección de Features**

```
UniversalMapCore → onFeatureClick → UnifiedMapInterface
                                            ↓
                                   setSelectedFeature()
                                            ↓
                                   PropertiesPanel actualizado
```

### **4. Filtros**

```
LayerControlAdvanced → updateFilters() → useUnifiedLayerManagement
                                               ↓
                                   getFilteredData() para cada capa
                                               ↓
                                   Mapa re-renderiza con datos filtrados
```

## 🎨 **Sistema de Simbología**

### **Configuración por Defecto**

```typescript
const defaultLayers = [
  {
    id: "equipamientos",
    name: "Equipamientos",
    color: "#10B981",
    icon: "🏢",
    representationMode: "clase_obra",
  },
  {
    id: "infraestructura_vial",
    name: "Infraestructura Vial",
    color: "#F59E0B",
    icon: "🛣️",
    representationMode: "tipo_intervencion",
  },
];
```

### **Personalización Avanzada**

- 🎨 **Colores personalizados** por feature
- 📏 **Tamaños dinámicos** basados en propiedades
- 🔶 **Formas diferentes** por categoría
- 📊 **Escalas de colores** para datos numéricos

## 🔍 **Sistema de Filtros**

### **Tipos de Filtros Disponibles**

```typescript
interface LayerFilters {
  search?: string; // Búsqueda en texto
  categoria?: string[]; // Filtro por categorías
  estado?: string[]; // Filtro por estados
  dateRange?: {
    // Filtro por rango de fechas
    from: Date;
    to: Date;
  };
}
```

### **Aplicación de Filtros**

```typescript
// Los filtros se aplican automáticamente
const filteredData = getFilteredData(layerId);

// El mapa se actualiza en tiempo real
const mapLayers = layers.map((layer) => ({
  ...layer,
  data: getFilteredData(layer.id),
}));
```

## 💾 **Persistencia**

### **Configuración Guardada**

```typescript
// Se guarda automáticamente en localStorage
const savedConfig = {
  layers: [...],           // Configuración de capas
  baseMap: {...},         // Mapa base seleccionado
  filters: {...}          // Filtros activos
}
```

### **Restauración**

```typescript
// Se carga automáticamente al iniciar
useEffect(() => {
  const savedConfig = localStorage.getItem("unifiedMapConfig");
  if (savedConfig) {
    const { layers, baseMap } = JSON.parse(savedConfig);
    // Restaurar configuración
  }
}, []);
```

## 📊 **Métricas y Estadísticas**

### **Estadísticas de Capas**

```typescript
const stats = {
  total: 2, // Total de capas
  visible: 2, // Capas visibles
  hidden: 0, // Capas ocultas
  dataLoaded: 2, // Capas con datos cargados
  dataNotLoaded: 0, // Capas sin datos
};
```

### **Métricas en Tiempo Real**

- 📈 **Conteo de elementos** por capa
- 🎯 **Features filtradas** vs totales
- 🔍 **Resultados de búsqueda** activos
- 👁️ **Estado de visibilidad** de capas

## 🚀 **Ventajas del Sistema Unificado**

### **✅ Comunicación Integrada**

- Los paneles se comunican bidireccionalmente
- Los cambios se reflejan instantáneamente
- La sincronización es automática

### **✅ Rendimiento Optimizado**

- Estado centralizado evita re-renders innecesarios
- Filtros aplicados eficientemente
- Carga lazy de componentes pesados

### **✅ Experiencia de Usuario Mejorada**

- Interfaz coherente y consistente
- Transiciones suaves entre estados
- Configuración persistente

### **✅ Mantenibilidad**

- Código modular y reutilizable
- Hooks especializados
- Documentación integrada

### **✅ Escalabilidad**

- Fácil agregar nuevas capas
- Sistema de filtros extensible
- Arquitectura preparada para nuevas funcionalidades

## 🔧 **Uso en la Aplicación**

### **Reemplazar ProjectMapWithPanels**

```tsx
// Antes
<ProjectMapWithPanels
  selectedProjectUnitFromTable={selectedUnit}
  optimizedGeoJSONData={geoJSONData}
/>

// Ahora
<UnifiedMapInterface
  selectedProjectUnitFromTable={selectedUnit}
  onFeatureClick={(feature, layerType) => {
    console.log('Feature clicked:', feature)
  }}
/>
```

### **Integración con Filtros Globales**

```tsx
// El componente se integra automáticamente con el contexto de datos
// Los filtros de la aplicación se sincronizan con los filtros del mapa
```

## 🎯 **Resultado Final**

**El área amarilla de tu imagen ahora funciona como una unidad integrada:**

- 🗺️ **Área roja (mapa)**: Renderiza todos los GeoJSON con simbología personalizada
- 🎛️ **Área azul (gestión)**: Panel completo con filtros, búsqueda y configuración
- 📊 **Panel propiedades**: Muestra detalles y métricas de elementos seleccionados
- 🔄 **Comunicación fluida**: Todos los componentes intercambian información en tiempo real

**¡El sistema está listo para proporcionar un análisis completo y toma de decisiones sobre los datos geográficos!** 🎉
