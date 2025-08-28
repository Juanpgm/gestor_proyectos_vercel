# 🎯 Auto-Centrado del Mapa en Capas Visibles

## 📋 **Resumen de la Funcionalidad**

Se implementó una funcionalidad que automáticamente centra el mapa en las capas vectoriales visibles cuando los paneles laterales cambian de tamaño, manteniendo siempre la vista optimizada en el contenido geográfico relevante.

---

## ✅ **Funcionalidad Implementada**

### **🗺️ Auto-Centrado Inteligente**

#### **Comportamiento:**

1. **Detección Automática**: Cuando se expanden/contraen los paneles laterales
2. **Redimensionamiento**: El mapa se adapta al nuevo espacio disponible
3. **Centrado Automático**: Se centra automáticamente en las capas vectoriales visibles
4. **Fallback Inteligente**: Si no hay capas visibles, se centra en Cali

#### **Lógica de Centrado:**

```typescript
// 1. Detectar capas visibles con datos
const visibleLayers = layers.filter((layer) => layer.visible && layer.data);

// 2. Calcular bounds de todas las capas visibles
visibleLayers.forEach((layer) => {
  if (layer.type === "geojson" && layer.data?.features) {
    const tempLayer = L.geoJSON(layer.data);
    bounds.extend(tempLayer.getBounds());
  }
});

// 3. Aplicar centrado con padding
mapRef.current?.fitBounds(bounds, {
  padding: [30, 30],
  maxZoom: 15,
});
```

---

## 🔧 **Implementación Técnica**

### **Nuevas Props y Callbacks**

#### **UniversalMapCore**

```typescript
interface UniversalMapCoreProps {
  // ... props existentes
  onMapReady?: (centerFunction: () => void) => void;
}
```

#### **ProjectMapCore**

```typescript
interface ProjectMapCoreProps {
  // ... props existentes
  onMapReady?: (centerFunction: () => void) => void;
}
```

#### **ProjectMapWithPanels**

```typescript
// Referencia para almacenar función de centrado
const centerMapFunction = useRef<(() => void) | null>(null)

// Callback cuando el mapa está listo
onMapReady={(centerFunction) => {
  centerMapFunction.current = centerFunction
}}
```

### **Auto-Centrado en Cambios de Panel**

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // 1. Notificar redimensionamiento
    window.dispatchEvent(new Event("resize"));

    // 2. Centrar en capas visibles
    if (centerMapFunction.current) {
      setTimeout(() => {
        centerMapFunction.current?.();
        console.log("🎯 Centrando mapa en capas visibles");
      }, 100);
    }
  }, 350); // Esperar que termine la animación

  return () => clearTimeout(timer);
}, [leftPanelCollapsed, rightPanelCollapsed]);
```

---

## 🎯 **Casos de Uso**

### **1. 📱 Panel Izquierdo se Expande/Contrae**

- Mapa se redimensiona automáticamente
- Vista se centra en capas de equipamientos e infraestructura
- Mantiene zoom apropiado (máximo 15)

### **2. 📊 Panel Derecho se Expande/Contrae**

- Mapa se adapta al nuevo espacio lateral
- Auto-centrado en datos geográficos visibles
- Transición suave de 300ms + centrado

### **3. 🗂️ Sin Capas Visibles**

- Fallback: se centra en coordenadas de Cali
- Zoom por defecto: nivel 13
- Vista consistente y predecible

### **4. 🌍 Capas Fuera del Área de Cali**

- Validación de bounds contra área de Cali
- Si está fuera del área: centrar en Cali
- Si está dentro: ajustar a las capas + incluir centro de Cali

---

## 📁 **Archivos Modificados**

### `src/components/UniversalMapCore.tsx`

- ✅ **Agregada prop `onMapReady`** para exponer función de centrado
- ✅ **Función de centrado mejorada** en `whenReady` callback
- ✅ **Validación de bounds** contra área de Cali
- ✅ **Padding y maxZoom** configurables

### `src/components/ProjectMapCore.tsx`

- ✅ **Prop `onMapReady` agregada** a la interfaz
- ✅ **Propagación de callback** al UniversalMapCore
- ✅ **Mantenimiento de compatibilidad** con componentes existentes

### `src/components/ProjectMapWithPanels.tsx`

- ✅ **useRef para función de centrado**
- ✅ **Callback `onMapReady`** configurado
- ✅ **useEffect mejorado** para cambios de panel
- ✅ **Auto-centrado tras redimensionamiento**

---

## 🚀 **Flujo de Trabajo**

### **Secuencia de Auto-Centrado:**

1. **🎮 Usuario expande/contrae panel**

   ```
   setLeftPanelCollapsed(!leftPanelCollapsed)
   ```

2. **⚡ Animación de panel (300ms)**

   ```
   motion.div animate={{ width: collapsed ? '40px' : '350px' }}
   ```

3. **📐 Redimensionamiento del mapa (350ms delay)**

   ```
   window.dispatchEvent(new Event('resize'))
   ```

4. **🎯 Auto-centrado en capas (450ms total)**

   ```
   centerMapFunction.current?.()
   ```

5. **✅ Vista optimizada**
   - Mapa centrado en capas visibles
   - Espacio disponible maximizado
   - UX fluida y predecible

---

## 🎉 **Ventajas**

### **🔄 Automático**

- No requiere intervención del usuario
- Funciona en todos los cambios de panel
- Mantiene siempre vista optimizada

### **⚡ Performance**

- Solo se ejecuta cuando cambian los paneles
- Delays optimizados para animaciones
- No afecta performance de renderizado

### **🎯 Inteligente**

- Respeta área geográfica de Cali
- Considera solo capas visibles
- Fallback consistente

### **📱 Responsive**

- Funciona en todas las resoluciones
- Se adapta al espacio disponible
- UX consistente en móvil y desktop

**¡El mapa ahora mantiene automáticamente centrada la vista en las capas vectoriales!** ✨
