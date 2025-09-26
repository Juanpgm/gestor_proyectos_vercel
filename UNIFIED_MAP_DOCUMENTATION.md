# Mapa Territorial Unificado - Documentación Técnica

## 🎯 Resumen Ejecutivo

Se ha implementado exitosamente un **Mapa Territorial Unificado** que reemplaza los componentes de mapa anteriores con una solución moderna, elegante y completamente integrada. El nuevo sistema utiliza **Plotly.js** para visualización científica avanzada y se conecta directamente con la API a través del endpoint `GET unidades-proyecto/filter`.

## ✨ Características Principales

### 🔧 Funcionalidades Técnicas

- ✅ **Zoom con scroll habilitado** - Navegación intuitiva con rueda del mouse
- ✅ **API conectada en tiempo real** - Datos desde `unidades-proyecto/filter`
- ✅ **Filtros unificados** - Sistema reactivo integrado con el dashboard
- ✅ **Visualización científica** - Múltiples variables y métricas
- ✅ **Responsive design** - Optimizado para móvil, tablet y desktop
- ✅ **Modo oscuro/claro** - Adapta automáticamente al tema
- ✅ **Pantalla completa** - Modo inmersivo disponible
- ✅ **Caché inteligente** - Optimización de rendimiento automática

### 🎨 Variables de Visualización

1. **Presupuesto Base** - Valor inicial del proyecto (formato moneda)
2. **Avance de Obra** - Porcentaje de progreso (formato porcentaje)
3. **Valor Estimado Pagado** - Cálculo basado en avance (formato moneda)
4. **Densidad por Comuna** - Concentración territorial (formato contador)

### 🗺️ Estilos de Mapa

- **Claro** (`carto-positron`) - Ideal para modo día
- **Oscuro** (`carto-darkmatter`) - Perfecto para modo nocturno
- **Satelital** (`satellite-streets`) - Vista aérea detallada
- **Terreno** (`stamen-terrain`) - Relieve topográfico

## 📁 Arquitectura de Componentes

```
src/components/
├── UnifiedMapComponent.tsx          # Componente principal del mapa
├── UnifiedMapWithFilters.tsx        # Wrapper con filtros integrados
├── DynamicMap.tsx                   # Wrapper de compatibilidad
└── UnifiedFilters.tsx               # Sistema de filtros existente
```

### 🧩 Componente Principal: `UnifiedMapComponent`

```tsx
interface UnifiedMapProps {
  className?: string;
  height?: number;
  filters?: UnidadProyectoFilters;
  onUnidadClick?: (unidad: UnidadProyectoGeo) => void;
  onFiltersChange?: (filters: UnidadProyectoFilters) => void;
  showAnalytics?: boolean;
  showFilters?: boolean;
  showControls?: boolean;
  visualizationVariable?: keyof typeof VISUALIZATION_VARIABLES;
  isDarkMode?: boolean;
  isFullscreen?: boolean;
  onFullscreenToggle?: () => void;
}
```

**Características:**

- Renderización con Plotly.js para máximo rendimiento
- Sistema de burbujas científicas con normalización inteligente
- Panel de controles flotante con diseño moderno
- Panel de filtros deslizable con animaciones
- Panel de análisis con métricas en tiempo real
- Manejo de errores robusto con retry automático

### 🎛️ Wrapper con Filtros: `UnifiedMapWithFilters`

```tsx
interface UnifiedMapWithFiltersProps {
  className?: string;
  height?: number;
  showFiltersPanel?: boolean;
  showAnalytics?: boolean;
  onUnidadClick?: (unidad: UnidadProyectoGeo) => void;
  isDarkMode?: boolean;
}
```

**Características:**

- Integración completa con `UnifiedFilters`
- Layout responsivo con panel lateral
- Conversión automática de filtros Dashboard ↔ API
- Contador de filtros activos
- Modo pantalla completa
- Panel móvil con overlay

## 🔌 Integración con API

### Endpoint Principal

```
GET https://gestorproyectoapi-production.up.railway.app/unidades-proyecto/filter
```

### Parámetros de Filtro Soportados

```typescript
interface UnidadProyectoFilters {
  comuna?: string;
  barrio?: string;
  tipo_intervencion?: string;
  clase_obra?: string;
  estado?: string;
  ano?: string;
  centro_gestor?: string;
  fuente_financiacion?: string;
  search?: string;
}
```

### Sistema de Caché

- **TTL por defecto:** 5 minutos para datos generales
- **TTL filtros:** 3 minutos para búsquedas específicas
- **TTL métricas:** 10 minutos para resúmenes del dashboard
- **Limpieza automática:** Expiración inteligente basada en timestamp

## 🎨 Diseño y UX

### 🎭 Paleta de Colores Científica

```typescript
const STATE_COLORS = {
  "En Ejecución": "#2E8B57", // Verde científico
  Completado: "#4169E1", // Azul real
  Planificación: "#FF8C00", // Naranja oscuro
  Suspendido: "#DC143C", // Rojo carmesí
  "Sin estado": "#708090", // Gris pizarra
};
```

### 📱 Breakpoints Responsivos

- **Mobile:** < 768px - Panel de filtros en overlay
- **Tablet:** 768px - 1024px - Layout adaptativo
- **Desktop:** > 1024px - Panel lateral fijo

### 🎨 Animaciones y Transiciones

- **Framer Motion** para transiciones fluidas
- **Entrada secuencial** de componentes con delays
- **Hover effects** en controles y botones
- **Loading states** con spinners científicos

## 🛠️ Guía de Implementación

### 1. Instalación en Página Existente

```tsx
import UnifiedMapWithFilters from "@/components/UnifiedMapWithFilters";

export default function MyPage() {
  return (
    <UnifiedMapWithFilters
      height={600}
      showFiltersPanel={true}
      showAnalytics={true}
      onUnidadClick={(unidad) => {
        console.log("Unidad seleccionada:", unidad);
        // Tu lógica aquí
      }}
      isDarkMode={false}
    />
  );
}
```

### 2. Uso como Componente Simple

```tsx
import UnifiedMapComponent from "@/components/UnifiedMapComponent";

export default function SimpleMap() {
  return (
    <UnifiedMapComponent
      height={400}
      showControls={true}
      showFilters={false}
      showAnalytics={false}
      visualizationVariable="presupuesto_base"
    />
  );
}
```

### 3. Integración con Dashboard Existente

El componente es **completamente compatible** con el sistema existente. Se puede usar como reemplazo directo de `DynamicMap`:

```tsx
// Antes
<DynamicMap height={600} onFeatureClick={handleClick} showAnalytics={true} />

// Después (automático)
// DynamicMap ya usa UnifiedMapComponent internamente
```

## 🔧 Configuración Avanzada

### Personalización de Plotly

```typescript
const PLOT_CONFIG = {
  displayModeBar: true,
  displaylogo: false,
  scrollZoom: true, // ¡CLAVE! Habilita zoom con scroll
  doubleClick: "reset+autosize",
  toImageButtonOptions: {
    format: "png",
    filename: "mapa_unidades_proyecto_cali",
    height: 1080,
    width: 1920,
    scale: 2,
  },
};
```

### Coordenadas Base de Cali

```typescript
const CALI_CONFIG = {
  center: { lat: 3.4516, lon: -76.532 },
  zoom: 11,
  maxZoom: 18,
  minZoom: 9,
};
```

## 📊 Métricas y Analytics

### Panel de Análisis Incluye:

- **Total de proyectos** filtrados
- **Presupuesto total** agregado
- **Avance promedio** calculado
- **Top 5 comunas** por cantidad de proyectos
- **Distribución por estado** con porcentajes
- **Información de variable actual** con descripción

### Cálculos Automáticos:

```typescript
// Normalización de burbujas (8-50px)
const normalizeSize = (value: number) => {
  if (value === 0) return 8;
  if (maxValue === minValue) return 25;
  return 8 + ((value - minValue) / (maxValue - minValue)) * 42;
};

// Valor estimado pagado
const valorEstimadoPagado = (presupuestoBase * avanceObra) / 100;
```

## 🧪 Testing y Desarrollo

### Página de Prueba

```
http://localhost:3000/unified-map-test
```

**Características de la página de prueba:**

- Controles globales para probar funcionalidades
- Información técnica detallada
- Demo interactivo completo
- Métricas de rendimiento visual

### Logs de Desarrollo

El componente incluye logging detallado:

```
🚀 [UnifiedMap] Cargando unidades de proyecto desde API...
✅ [UnifiedMap] Unidades cargadas: 1234
🎯 [UnifiedMap] Unidad seleccionada: Proyecto XYZ
🔄 [UnifiedMapWithFilters] Filtros actualizados: {...}
```

## 🚀 Optimizaciones de Rendimiento

### 1. Memorización Inteligente

- `useMemo` para datos de Plotly pesados
- `useCallback` para handlers de eventos
- `memo` para componentes que no cambian frecuentemente

### 2. Carga Diferida

- `dynamic import` para Plotly.js (evita SSR)
- Componentes con loading states elegantes
- Lazy loading de paneles no visibles

### 3. Caché Multi-Nivel

- Caché en memoria para API calls
- TTL diferenciado por tipo de datos
- Limpieza automática de entradas expiradas

## 🐛 Manejo de Errores

### Estados de Error Cubiertos:

- ❌ **Error de red** - Reintento automático con botón manual
- ❌ **Datos vacíos** - Mensaje informativo elegante
- ❌ **Coordenadas inválidas** - Filtrado automático
- ❌ **Timeout de API** - 30 segundos con abort controller
- ❌ **Error de parsing** - Fallbacks seguros

### UI de Errores:

```tsx
// Error elegante con retry
<div className="text-center p-6">
  <div className="text-red-600 mb-2 text-3xl">🚨</div>
  <div className="text-red-700 font-semibold mb-2">
    Error en la Visualización
  </div>
  <div className="text-sm text-red-600 mb-4">{error}</div>
  <button onClick={retry}>🔄 Reintentar Carga</button>
</div>
```

## 🔮 Roadmap Futuro

### Próximas Características:

- [ ] **Clustering dinámico** para grandes volúmenes de datos
- [ ] **Heatmaps** para análisis de densidad avanzado
- [ ] **Rutas y conexiones** entre proyectos relacionados
- [ ] **Análisis temporal** con slider de tiempo
- [ ] **Exportación de datos** a múltiples formatos
- [ ] **Comentarios y anotaciones** colaborativas
- [ ] **Comparación de períodos** lado a lado
- [ ] **Alertas geográficas** personalizables

### Mejoras Técnicas:

- [ ] **WebGL rendering** para mega datasets
- [ ] **Service Worker** para caché offline
- [ ] **WebSockets** para updates en tiempo real
- [ ] **Compresión de datos** automática
- [ ] **Métricas de performance** integradas

## 📞 Soporte y Mantenimiento

### Archivos Clave a Monitorear:

- `src/components/UnifiedMapComponent.tsx` - Lógica principal
- `src/components/UnifiedMapWithFilters.tsx` - Integración
- `src/services/unidadesProyectoApi.ts` - Conexión API
- `src/app/unified-map-test/page.tsx` - Testing

### Comandos Útiles:

```bash
# Desarrollo
npm run dev

# Testing de producción
npm run build && npm run start

# Verificación de tipos
npm run type-check

# Limpieza de caché
# (implementar función en API service)
```

---

## 🎉 Conclusión

El **Mapa Territorial Unificado** representa una evolución significativa en la visualización de datos geográficos del proyecto. Con **zoom por scroll habilitado**, **filtros reactivos integrados**, y **conexión directa a la API**, proporciona una experiencia de usuario moderna y eficiente que cumple todos los requisitos establecidos.

La implementación modular y la compatibilidad completa con el sistema existente garantizan una transición fluida sin breaking changes, mientras que las optimizaciones de rendimiento y el diseño responsivo aseguran una experiencia excelente en todos los dispositivos.

**¡El mapa está listo para producción y uso inmediato!** 🚀

---

_Documentación técnica - Mapa Territorial Unificado v1.0_  
_Fecha: 25 de septiembre de 2025_
