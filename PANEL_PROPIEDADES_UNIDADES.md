# Panel de Propiedades para Unidades de Proyecto

Este componente se ha modificado para mostrar información detallada específica de las unidades de proyecto en el **panel de propiedades lateral** en lugar de un modal popup cuando se hace clic en el ícono del "ojito" en la tabla.

## Características Implementadas

### 1. Click en el ícono del ojito (👁️) en la tabla

- Al hacer clic en el ícono del ojito en la columna "DETALLE" de la tabla de unidades de proyecto
- La información se muestra en el **panel de propiedades** dentro del mismo componente del mapa
- **NO se abre un modal popup** - toda la información se integra en el panel lateral existente

### 2. Panel de Propiedades Expandido

- **Detección automática**: El sistema detecta cuando se selecciona una unidad de proyecto desde la tabla
- **Expansión automática**: El panel de propiedades se expande automáticamente si estaba colapsado
- **Información específica**: Muestra datos específicos de la unidad de proyecto seleccionada

### 3. Contenido del Panel

#### Header del Panel

- Nombre de la unidad de proyecto
- BPIN en formato destacado (azul)
- Ubicación completa (comuna/corregimiento, barrio/vereda, dirección)
- Tipo de capa identificado como "unidad proyecto desde tabla"

#### Secciones de Información Categorizada

**🆔 Identificación**

- ID único de la unidad
- Código BPIN

**🛣️ Infraestructura** (cuando aplique)

- Tipo de intervención
- Clase de obra
- Descripción de la intervención

**💰 Inversión**

- Presupuesto base (en verde)
- Pagos realizados (en naranja)
- Valor ejecutado

**🏗️ Proyecto**

- Descripción de la intervención
- Tipo de intervención
- Clase de obra

**📊 Estado**

- Estado actual del proyecto
- Progreso físico de obra

**📅 Fechas**

- Fecha de inicio planeada
- Fecha de finalización planeada
- Responsable (centro gestor)

## Flujo de Funcionamiento

1. **Navegación**: Usuario va a la sección "Unidades de Proyecto"
2. **Visualización**: Ve el mapa con paneles y la tabla de unidades debajo
3. **Selección**: Hace clic en el ícono del ojito (👁️) en cualquier fila de la tabla
4. **Actualización del Panel**: El panel de propiedades se actualiza automáticamente con la información de esa unidad específica
5. **Visualización Integrada**: Toda la información se muestra en el panel lateral sin necesidad de ventanas emergentes

## Archivos Modificados

### `src/components/ProjectsUnitsTable.tsx`

- **Eliminado**: Modal popup (`ProjectModal`)
- **Agregado**: Prop `onViewProjectUnit` para callback al componente padre
- **Modificado**: Función `handleViewProject` para llamar al callback en lugar de abrir modal

### `src/app/page.tsx`

- **Agregado**: Estado `selectedProjectUnitFromTable` para la unidad seleccionada
- **Agregado**: Función `handleViewProjectUnitInPanel` para manejar la selección
- **Modificado**: Props de `ProjectMapWithPanels` para recibir la unidad seleccionada
- **Modificado**: Props de `ProjectsUnitsTable` para enviar el callback

### `src/components/ProjectMapWithPanels.tsx`

- **Agregado**: Prop `selectedProjectUnitFromTable` en la interfaz
- **Agregado**: useEffect para detectar cambios en la unidad seleccionada desde tabla
- **Agregado**: Creación de "feature artificial" para el panel de propiedades
- **Eliminado**: Todo el código relacionado con el modal popup
- **Eliminado**: Estados y funciones del modal (`selectedProjectUnit`, `isUnitModalOpen`, etc.)
- **Modificado**: Click en features del mapa para usar panel de propiedades en lugar de modal

### `src/components/PropertiesPanel.tsx`

- **Ya era compatible**: El panel ya podía mostrar información de unidades de proyecto
- **Maneja automáticamente**: Las nuevas propiedades creadas artificialmente desde la tabla

## Ventajas de la Nueva Implementación

### 🎯 Mejor UX

- **Integración fluida**: No hay ventanas emergentes que interrumpan la experiencia
- **Contexto visual**: El usuario mantiene el contexto del mapa mientras ve los detalles
- **Navegación natural**: Puede alternar fácilmente entre tabla y mapa

### ⚡ Mejor Performance

- **Menos componentes**: Eliminación del modal reduce la carga de componentes
- **Reutilización**: Usa el panel de propiedades existente en lugar de duplicar funcionalidad
- **Menos estado**: Menos variables de estado para manejar

### 🛠️ Mejor Mantenimiento

- **Un solo lugar**: Toda la lógica de visualización de propiedades está centralizada
- **Consistencia**: La información se muestra de manera consistente tanto desde clics en mapa como desde tabla
- **Menos código**: Eliminación de código duplicado del modal

## Comunicación entre Componentes

```
page.tsx (Estado central)
    ↓ onViewProjectUnit callback
ProjectsUnitsTable.tsx (Detecta click en ojito)
    ↓ selectedProjectUnitFromTable prop
ProjectMapWithPanels.tsx (Convierte a feature artificial)
    ↓ selectedFeature prop
PropertiesPanel.tsx (Muestra información)
```

## Datos Soportados

El panel puede mostrar toda la información de las unidades de proyecto:

- **Identificación**: BPIN, ID único
- **Ubicación**: Comuna, barrio, dirección
- **Estado**: Estado actual, progreso físico
- **Financiero**: Presupuesto, ejecutado, pagado
- **Técnico**: Tipo intervención, clase obra, descripción
- **Temporal**: Fechas inicio/fin, responsables, beneficiarios

Toda esta información se mapea automáticamente desde la estructura `UnidadProyecto` a las propiedades del feature artificial que consume el `PropertiesPanel`.

## Testing

Para probar la funcionalidad:

1. Ejecutar `npm run dev`
2. Navegar a la sección "Unidades de Proyecto"
3. En la tabla de unidades, hacer clic en el ícono del ojito (👁️) en cualquier fila
4. Verificar que el panel de propiedades lateral se actualiza con la información de esa unidad específica
5. Verificar que no se abren ventanas emergentes

La aplicación está corriendo en: http://localhost:3000
