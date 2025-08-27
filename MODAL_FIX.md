# 🔧 Corrección del Modal de Simbología

## ❌ **Problema Identificado**

El modal de simbología se mostraba **por debajo del mapa** debido a problemas de z-index.

## ✅ **Soluciones Implementadas**

### 1. **Z-index Mejorado**

- **Modal overlay**: `z-index: 9999`
- **Modal content**: `z-index: 10000`
- **Estilos CSS adicionales** con `!important` para sobrescribir z-index de Leaflet

### 2. **Portal de React**

- **Renderizado con `createPortal`** para montar el modal directamente en `document.body`
- **Evita conflictos** de z-index con contenedores padre
- **Asegura posicionamiento correcto** en el DOM

### 3. **Estilos CSS Específicos**

```css
.symbology-modal-overlay {
  z-index: 9999 !important;
  position: fixed !important;
}

.symbology-modal-content {
  z-index: 10000 !important;
  position: relative !important;
}

/* Override para Leaflet */
.leaflet-container {
  z-index: 1 !important;
}
```

### 4. **Clases CSS Aplicadas**

- **`symbology-modal-overlay`** en el contenedor principal
- **`symbology-modal-content`** en el modal interno
- **Combinación de CSS y estilos inline** para máxima compatibilidad

## 🎯 **Resultado Esperado**

Ahora el modal debe aparecer **correctamente por encima del mapa** con:

- ✅ **Fondo semi-transparente** que cubre toda la pantalla
- ✅ **Modal centrado** y completamente visible
- ✅ **Z-index superior** a todos los elementos del mapa
- ✅ **Portal rendering** para evitar conflictos de DOM

## 🚀 **Para Probar**

1. Ir al mapa
2. Click en el ícono de configuración ⚙️ de cualquier capa
3. El modal debe aparecer **encima del mapa**, no debajo

¡El modal ahora debe funcionar correctamente!
