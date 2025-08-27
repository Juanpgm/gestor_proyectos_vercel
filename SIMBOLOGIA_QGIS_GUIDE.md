# 🎨 Sistema de Simbología Estilo QGIS

Esta documentación explica cómo usar el nuevo sistema de simbología personalizada que se ha agregado a tu proyecto de mapas de Next.js con Leaflet.

## 📋 Características Implementadas

### 1. **Modos de Simbología**

#### 🎨 **Color Fijo**

- Todos los elementos de la capa tendrán el mismo color
- Configuración simple con selector de color
- Ideal para capas temáticas básicas

#### 📊 **Por Categorías**

- Colores diferentes según valores de un atributo específico
- Generación automática de paleta de colores
- Personalización individual de cada categoría
- Perfecto para datos cualitativos (tipos, estados, etc.)

#### 📈 **Por Rangos**

- Colores según intervalos numéricos configurables
- Número de rangos personalizable (2-10)
- Regeneración automática de intervalos
- Ideal para datos cuantitativos (presupuestos, poblaciones, etc.)

#### 📍 **Iconos Personalizados** (Solo para puntos)

- Iconos emoji personalizados según categorías
- Marcadores HTML con colores de fondo
- Tamaños y estilos configurables

### 2. **Controles Avanzados**

- **Opacidad:** Control deslizante de 0% a 100%
- **Grosor del borde:** Ajustable de 1px a 8px
- **Color del borde:** Personalizable independientemente
- **Regeneración de rangos:** Botón para recalcular intervalos automáticamente

## 🚀 Archivos Modificados y Agregados

### Nuevos Archivos:

1. **`src/hooks/useLayerSymbology.ts`**

   - Hook principal que maneja toda la lógica de simbología
   - Funciones para obtener estilos dinámicos
   - Generación automática de colores y rangos

2. **`src/components/SymbologyControlPanel.tsx`**

   - Panel de control con interfaz estilo QGIS
   - Controles para todos los modos de simbología
   - Interfaz intuitiva con expansión/contracción

3. **`src/utils/customIcons.ts`**
   - Utilidades para crear iconos personalizados
   - Marcadores con emoji y colores de categoría
   - Iconos de rango con intensidad variable

### Archivos Modificados:

1. **`src/components/UniversalMapCore.tsx`**

   - Integración del hook de simbología
   - Aplicación de estilos dinámicos en GeoJSON
   - Soporte para iconos personalizados en puntos

2. **`src/components/ProjectMapWithPanels.tsx`**
   - Agregado del panel de simbología al layout
   - Nuevo estado para controlar el panel
   - Preparación de datos para el panel

## 📖 Cómo Usar la Funcionalidad

### 1. **Acceder al Panel de Simbología**

El panel se encuentra en el panel izquierdo de la interfaz, entre el control de capas y las propiedades. Si está colapsado, busca el botón "Mostrar Simbología" con el icono ✨.

### 2. **Configurar Color Fijo**

```typescript
// Automático en la interfaz:
1. Selecciona una capa
2. Elige "Color Fijo"
3. Usa el selector de color
4. Ajusta opacidad y grosor con los sliders
```

### 3. **Configurar Simbología por Categorías**

```typescript
// Ejemplo para equipamientos por tipo:
1. Selecciona la capa "Equipamientos"
2. Elige "Categorías"
3. Selecciona atributo "tipo_equipamiento"
4. Se generan colores automáticamente
5. Personaliza colores individuales si es necesario
```

### 4. **Configurar Simbología por Rangos**

```typescript
// Ejemplo para presupuestos:
1. Selecciona la capa "Unidades de Proyecto"
2. Elige "Rangos"
3. Selecciona atributo "presupuesto_total"
4. Ajusta número de rangos (ej: 5)
5. Usa el botón de regenerar si es necesario
6. Personaliza colores de cada rango
```

### 5. **Configurar Iconos Personalizados**

```typescript
// Para puntos con iconos por categoría:
1. Selecciona una capa de puntos
2. Elige "Iconos"
3. Selecciona atributo categórico
4. Los iconos se asignan automáticamente
```

## 🛠️ Personalización Avanzada

### Agregar Nuevos Iconos

Edita `src/hooks/useLayerSymbology.ts`:

```typescript
const DEFAULT_ICONS = {
  Educación: "🏫",
  Salud: "🏥",
  Deporte: "⚽",
  Cultura: "🎭",
  Tu_Nueva_Categoria: "🔧", // ← Agregar aquí
  default: "📍",
};
```

### Personalizar Paleta de Colores

```typescript
const DEFAULT_CATEGORY_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
  "#TU_COLOR_CUSTOM", // ← Agregar más colores
];
```

### Configurar Rangos Personalizados

```typescript
// En el hook useLayerSymbology, función generateRanges:
const colors = [
  "#FEF3C7", // Muy bajo
  "#FDE68A", // Bajo
  "#FCD34D", // Medio
  "#F59E0B", // Alto
  "#D97706", // Muy alto
  // Personaliza estos colores según tus necesidades
];
```

## 🎯 Casos de Uso Recomendados

### 1. **Equipamientos por Tipo**

- **Modo:** Categorías
- **Atributo:** `tipo_equipamiento` o `categoria`
- **Resultado:** Cada tipo de equipamiento (salud, educación, deporte) tendrá un color distinto

### 2. **Infraestructura por Estado**

- **Modo:** Categorías
- **Atributo:** `estado_proyecto` o `fase`
- **Resultado:** Distintos colores para "En ejecución", "Completado", "Suspendido"

### 3. **Proyectos por Presupuesto**

- **Modo:** Rangos
- **Atributo:** `valor_total` o `presupuesto`
- **Resultado:** Colores más intensos para presupuestos mayores

### 4. **Puntos de Interés con Iconos**

- **Modo:** Iconos
- **Atributo:** `categoria` o `tipo`
- **Resultado:** Iconos emoji específicos para cada categoría

## 🔧 Solución de Problemas

### **El panel no aparece**

- Asegúrate de que hay capas visibles con datos
- Verifica que el panel izquierdo esté expandido
- Busca el botón "Mostrar Simbología"

### **Los colores no se aplican**

- Verifica que el atributo seleccionado existe en los datos
- Revisa la consola del navegador para errores
- Intenta cambiar a modo "Color Fijo" temporalmente

### **Los rangos no se generan**

- Asegúrate de seleccionar un atributo numérico
- Verifica que el atributo tiene valores válidos
- Usa el botón "Regenerar rangos"

### **Los iconos no aparecen**

- Los iconos solo funcionan con geometrías de tipo Point
- Verifica que la capa contiene puntos, no líneas o polígonos
- Revisa que el atributo seleccionado tiene valores categóricos

## 📚 Referencia de API

### Hook useLayerSymbology

```typescript
const {
  updateLayerSymbology, // Actualizar configuración de capa
  getLayerSymbology, // Obtener configuración actual
  getFeatureStyle, // Obtener estilo de feature
  getFeatureIcon, // Obtener icono de feature
  getUniqueAttributeValues, // Obtener valores únicos de atributo
  getNumericAttributeValues, // Obtener valores numéricos
  generateCategoryColors, // Generar colores automáticos
  generateRanges, // Generar rangos automáticos
  resetLayerSymbology, // Resetear configuración
} = useLayerSymbology();
```

### Tipos principales

```typescript
type SymbologyMode = "fixed" | "categories" | "ranges" | "icons";

interface SymbologyConfig {
  mode: SymbologyMode;
  attribute?: string;
  fixedColor?: string;
  categoryColors?: Record<string, string>;
  rangeColors?: RangeColorConfig[];
  iconMappings?: Record<string, string>;
  opacity?: number;
  strokeWidth?: number;
  strokeColor?: string;
}
```

## 🎉 ¡Listo para Usar!

Con esta implementación tienes un sistema completo de simbología estilo QGIS integrado en tu aplicación Next.js. El sistema es:

- ✅ **Completamente funcional** - Todos los modos implementados
- ✅ **Fácil de usar** - Interfaz intuitiva y familiar
- ✅ **Extensible** - Código modular y bien documentado
- ✅ **Performante** - Optimizado para grandes datasets
- ✅ **Responsive** - Funciona en todas las pantallas

¡Disfruta personalizando la visualización de tus datos geoespaciales! 🗺️✨
