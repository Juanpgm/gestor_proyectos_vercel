/\*\*

- DOCUMENTACIÓN DEL MAPA COROPLÉTICO AVANZADO
- ==========================================
-
- Esta documentación explica las nuevas funcionalidades implementadas en UnidadesProyectoDynamicMap.tsx
  \*/

## 🗺️ Funcionalidades Implementadas

### 1. **Mapa Coroplético Interactivo**

- **Visualización por polígonos**: Transforma datos de proyectos puntuales en visualizaciones de áreas geográficas
- **Agregación automática**: Combina datos de proyectos por comuna, barrio, corregimiento o vereda
- **4 variables de visualización**:
  - **Cantidad de Proyectos**: Número total de proyectos por área
  - **Presupuesto Total**: Suma del presupuesto de todos los proyectos
  - **Avance Promedio**: Porcentaje promedio de avance de obra
  - **Densidad de Proyectos**: Proyectos por kilómetro cuadrado

### 2. **Sistema de Personalización de Colores**

- **9 Paletas predefinidas**: Azules, verdes, rojos, púrpuras, naranjas, rojo-amarillo-azul, rojo-gris, marrón-verde, categóricas
- **3 Tipos de escalas**: Secuencial, divergente, categórica
- **Control de intensidad**: Ajuste de opacidad de 30% a 200%
- **Vista previa en tiempo real**: Cambios instantáneos en el mapa
- **Reseteo automático**: Volver a configuración por defecto

### 3. **Sidebar de Propiedades Avanzado**

- **Información detallada**: Muestra todas las propiedades del elemento seleccionado
- **Iconografía intuitiva**: Iconos específicos para cada tipo de dato
- **Formateo inteligente**: Monedas, porcentajes, números localizados
- **Animaciones fluidas**: Transiciones suaves con Framer Motion
- **Estadísticas agregadas**: Para áreas geográficas muestra conteo y porcentaje

### 4. **Controles de Visualización Intuitivos**

- **Toggle coroplético**: Alternar entre vista de puntos y polígonos
- **Selector de variables**: Dropdown para cambiar la métrica visualizada
- **Selector geográfico**: Cambiar entre comunas, barrios, corregimientos, veredas
- **Información contextual**: Descripción de la visualización actual

### 5. **Integración API Completa**

- **Dashboard Summary**: Integración con endpoint /unidades-proyecto/dashboard-summary
- **Datos geográficos**: Carga automática de archivos GeoJSON desde public/data/geodata/
- **Agregaciones dinámicas**: Procesamiento en tiempo real de datos por área geográfica
- **Manejo de errores**: Sistema robusto de carga con indicadores y fallbacks

## 🎨 Paletas de Colores Disponibles

### **Secuenciales** (Ideal para valores numéricos crecientes)

- **Azules**: `#f7fbff → #08306b` - Densidad y concentración
- **Verdes**: `#f7fcf5 → #00441b` - Indicadores positivos
- **Rojos**: `#fff5f0 → #67000d` - Alertas y problemas
- **Púrpuras**: `#fcfbfd → #3f007d` - Datos generales elegantes
- **Naranjas**: `#fff5eb → #7f2704` - Información destacada

### **Divergentes** (Para comparaciones con punto medio)

- **Rojo-Amarillo-Azul**: Desviaciones del promedio
- **Rojo-Gris**: Contraste para comparaciones
- **Marrón-Verde**: Datos ambientales naturales

### **Categóricas** (Para diferentes grupos)

- **Set 1**: Colores vibrantes para categorías distintas
- **Set 2**: Colores suaves para múltiples grupos
- **Pastel**: Profesional y suave

## 🔧 Uso del Componente

### **Props Básicas**

```tsx
<UnidadesProyectoDynamicMap
  unidades={unidadesData}
  onUnidadSelect={handleUnidadSelect}
  showLegend={true}
  height="600px"
/>
```

### **Props Coropléticas**

```tsx
<UnidadesProyectoDynamicMap
  unidades={unidadesData}
  enableChoropleth={true}
  choroplethVariable="count"
  choroplethGeography="comunas"
  onUnidadSelect={handleSelection}
/>
```

### **Props Completas**

```tsx
interface UnidadesProyectoDynamicMapProps {
  unidades: UnidadProyectoGeo[];
  onUnidadSelect?: (unidad: UnidadProyectoGeo) => void;
  filters?: UnidadProyectoFilters;
  className?: string;
  height?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  showLegend?: boolean;
  enableChoropleth?: boolean;
  choroplethVariable?: string;
  choroplethGeography?: "barrios" | "comunas" | "corregimientos" | "veredas";
}
```

## 🗂️ Estructura de Archivos

### **Nuevos Componentes**

```
src/components/
├── PropertySidebar.tsx           # Sidebar de propiedades
├── ColorCustomizationPanel.tsx   # Panel de personalización
└── UnidadesProyectoDynamicMap.tsx # Componente principal actualizado
```

### **Servicios**

```
src/services/
├── choroplethApi.ts    # API para datos coropléticos
└── dashboardApi.ts     # API del dashboard (existente)
```

### **Datos Geográficos**

```
public/data/geodata/cartografia_base/
├── barrios.geojson
├── comunas.geojson
├── corregimientos.geojson
└── veredas.geojson
```

## 🎯 Flujo de Interacción

### **1. Modo Normal** (Puntos de Proyectos)

- **Click en punto**: Abre sidebar con información del proyecto
- **Hover**: Tooltip con datos básicos
- **Colores**: Basados en avance de obra (verde=completo, rojo=inicial)

### **2. Modo Coroplético** (Áreas Geográficas)

- **Click en polígono**: Abre sidebar con estadísticas del área
- **Hover**: Tooltip con valor de la variable seleccionada
- **Colores**: Basados en la intensidad de la variable (más oscuro = mayor valor)

### **3. Controles de Usuario**

- **Panel de colores** (superior izquierda): Cambiar paletas e intensidad
- **Controles de visualización** (superior derecha): Toggle coroplético y configuración
- **Selector de capas** (derecha): Cambiar tiles del mapa base
- **Controles de información** (derecha): Estadísticas y leyenda

## 🚀 Rendimiento y Optimización

### **Técnicas Implementadas**

- **Memoización**: `useMemo` para GeoJSON y cálculos pesados
- **Lazy Loading**: Carga diferida de datos geográficos
- **Debouncing**: Control de actualizaciones en tiempo real
- **Animaciones optimizadas**: Framer Motion con will-change

### **Manejo de Estados**

- **Estados locales**: Para UI inmediata
- **Estados asíncronos**: Para datos de API
- **Indicadores de carga**: UX durante procesamiento
- **Manejo de errores**: Fallbacks y recuperación graceful

## 🎨 Personalización Visual

### **Tema Automático**

- **Detección inteligente**: Responde a cambios de tema del sistema
- **Tiles adaptativos**: CartoDB Positron (claro) / Dark Matter (oscuro)
- **UI consistente**: Todos los componentes siguen el tema actual

### **Responsividad**

- **Adaptación de pantalla**: Funciona en móviles y desktop
- **Controles optimizados**: Botones y paneles se ajustan al espacio
- **Tipografía escalable**: Texto legible en todas las resoluciones

Esta implementación transforma el mapa básico en una herramienta avanzada de análisis geográfico con capacidades profesionales de visualización de datos.
