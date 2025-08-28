# Funcionalidad de Imágenes en Popups - Centros de Gravedad

## 📸 Nueva Característica Implementada

Se ha agregado soporte completo para **mostrar imágenes de Google Drive** en los popups de la capa "Centros de Gravedad" cuando se hace clic en un punto del mapa.

## 🎯 Funcionalidad Implementada

### ✅ **Detección Automática de Imágenes**

- Detecta automáticamente cuando un feature tiene la propiedad `imagen`
- Convierte URLs de Google Drive a formato de visualización directa
- Excluye la propiedad `imagen` de las categorías generales para evitar duplicación

### ✅ **Conversión de URLs de Google Drive**

Soporta múltiples formatos de URLs de Google Drive:

```typescript
// Formatos soportados:
- https://drive.google.com/open?id=FILE_ID
- https://drive.google.com/file/d/FILE_ID/view
- https://drive.google.com/uc?id=FILE_ID

// Convertidos automáticamente a:
- https://drive.google.com/uc?export=view&id=FILE_ID
```

### ✅ **Visualización Optimizada**

- **Imagen responsiva**: Se adapta al ancho del popup (max 380px)
- **Altura limitada**: Máximo 200px con `object-fit: cover`
- **Click para ampliar**: Click en la imagen abre versión completa en nueva pestaña
- **Enlace directo**: Botón "Ver imagen completa" con estilo hover
- **Manejo de errores**: Mensaje elegante si la imagen no carga

### ✅ **Diseño Integrado**

- **Sección dedicada**: La imagen aparece en su propia sección con icono 📷
- **Estilo consistente**: Mantiene el diseño del popup existente
- **Separación visual**: Ubicada después de las propiedades, antes del resumen

## 🔧 Implementación Técnica

### Función `convertGoogleDriveUrl()`

```typescript
const convertGoogleDriveUrl = useCallback((url: string): string => {
  if (!url || typeof url !== "string") return "";

  if (url.includes("drive.google.com")) {
    let fileId = "";

    // Extraer ID de diferentes formatos
    if (url.includes("open?id=")) {
      fileId = url.split("open?id=")[1].split("&")[0];
    }
    // ... otros formatos

    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  return url;
}, []);
```

### Modificación en `createFeaturePopup()`

```typescript
// Sección de imagen agregada después de las propiedades
${properties.imagen ? `
  <div style="margin-top: 12px;">
    <h5>📷 Imagen</h5>
    <div style="border-radius: 8px; overflow: hidden;">
      <img
        src="${convertGoogleDriveUrl(properties.imagen)}"
        onclick="window.open('${convertGoogleDriveUrl(properties.imagen)}', '_blank')"
        onerror="this.parentElement.innerHTML='Error cargando imagen'"
      />
    </div>
    <a href="${convertGoogleDriveUrl(properties.imagen)}" target="_blank">
      🔗 Ver imagen completa
    </a>
  </div>
` : ''}
```

### Exclusión de Duplicados

```typescript
const categorizeProperty = (key: string) => {
  const keyLower = key.toLowerCase();

  // Excluir la propiedad imagen ya que se muestra por separado
  if (keyLower === "imagen") {
    return "excluded";
  }
  // ... resto de categorías
};
```

## 📊 Datos de Ejemplo

Los Centros de Gravedad contienen datos como:

```json
{
  "type": "Feature",
  "properties": {
    "marca_temporal": "2025-08-14 16:11:46",
    "cod": "COD0571",
    "descripción": null,
    "novedad": "tapa anden",
    "imagen": "https://drive.google.com/open?id=15oryhf9ggohlkttabooiypbpj8t93ns_",
    "sitio": "28. el diamante - sede principal"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-76.50161045, 3.42000817]
  }
}
```

## 🎨 Experiencia de Usuario

### 1. **Click en Centro de Gravedad**

- Usuario hace click en cualquier punto de la capa "Centros de Gravedad"
- Se abre popup con información del punto

### 2. **Visualización de Imagen**

- Si el punto tiene imagen, se muestra automáticamente
- Imagen optimizada y responsiva
- Sección claramente identificada con icono 📷

### 3. **Interacción con Imagen**

- **Click en imagen**: Abre imagen completa en nueva pestaña
- **Enlace "Ver imagen completa"**: Alternativa de acceso directo
- **Manejo de errores**: Mensaje claro si hay problemas de carga

## 🛡️ Manejo de Errores

### Casos Contemplados:

- **URL inválida**: Se mantiene URL original si no es de Google Drive
- **ID no encontrado**: Fallback a URL original
- **Error de carga**: Mensaje elegante "Error cargando imagen"
- **URL vacía**: Se omite completamente la sección de imagen

## 📱 Responsive Design

### Adaptación de Tamaños:

- **Desktop**: Imagen hasta 380px de ancho
- **Mobile**: Se adapta al ancho del popup
- **Altura máxima**: 200px en todos los dispositivos
- **Object-fit**: `cover` para mantener proporciones

## 🎯 Casos de Uso Específicos

### Centros de Gravedad de Cali:

- **Tapas de anden**: Evidencia fotográfica de estado
- **Pavimentación**: Registro de inicio y fin de obras
- **Puntos de recolección**: Documentación de necesidades de aseo
- **Infraestructura**: Estado actual de equipamientos urbanos

## 🔄 Proceso de Implementación

### Archivos Modificados:

1. **`src/components/UniversalMapCore.tsx`**
   - ✅ Función `convertGoogleDriveUrl()` agregada
   - ✅ Función `createFeaturePopup()` actualizada
   - ✅ Función `categorizeProperty()` modificada
   - ✅ Dependencias de useCallback actualizadas

## 🚀 Funcionalidad Lista para Producción

### ✅ Estado Actual:

- **Compilación exitosa**: Sin errores de TypeScript
- **Servidor funcionando**: Ready en localhost:3000
- **Funcionalidad completa**: Detección, conversión y visualización implementadas
- **Manejo de errores**: Casos edge cubiertos

### 🎉 Resultado Final:

Los usuarios ahora pueden **ver imágenes directamente en los popups** al hacer click en cualquier punto de la capa "Centros de Gravedad" que contenga la propiedad `imagen` con un enlace de Google Drive.

La funcionalidad es **automática, robusta y elegante**, proporcionando una experiencia visual enriquecida para el seguimiento de proyectos urbanos en la ciudad de Cali.
