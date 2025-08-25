# Modal de Unidades de Proyecto

Este nuevo componente `ProjectUnitModal` se ha implementado para mostrar información detallada específica de las unidades de proyecto cuando se hace clic en elementos del mapa.

## Características Implementadas

### 1. Detección Automática de Unidades de Proyecto

- El sistema detecta automáticamente cuando se hace clic en una unidad de proyecto basándose en las propiedades del GeoJSON
- Se activa cuando el feature tiene propiedades como: `bpin`, `identificador`, `nickname`, `id_via`, `clase_obra`, o `tipo_intervencion`

### 2. Modal Específico para Unidades de Proyecto

- **Diseño diferenciado**: Color púrpura para distinguirlo del modal de proyectos generales
- **Z-index máximo**: z-[99999] para aparecer siempre por encima de todo
- **Información específica de unidades**: Muestra datos relevantes como tipo de intervención, clase de obra, ubicación específica, etc.

### 3. Contenido del Modal

#### Header

- Nombre de la unidad de proyecto
- ID único y BPIN
- Centro gestor responsable
- Estado actual (En Ejecución, Planificación, etc.)

#### Barras de Progreso

- **Progreso Físico**: Basado en `avance_físico_obra`
- **Progreso Financiero**: Calculado como porcentaje ejecutado del presupuesto

#### Información Detallada

- Tipo de intervención
- Clase de obra
- Ubicación (comuna, barrio, corregimiento, dirección)
- Número de beneficiarios
- Descripción de la intervención

#### Análisis Financiero

- Presupuesto total
- Monto ejecutado y pagado
- Gráficos interactivos (barras, torta, línea, área)

#### Cronograma

- Fechas de inicio y finalización planificadas/reales

### 4. Funcionalidades

- **Exportación**: Botón para exportar la ficha (en desarrollo)
- **Impresión**: Capacidad de imprimir el contenido del modal
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Tema oscuro**: Soporte completo para modo oscuro

## Archivos Modificados

### `src/components/ProjectUnitModal.tsx` (NUEVO)

Componente principal del modal específico para unidades de proyecto.

### `src/components/ProjectMapWithPanels.tsx`

- Agregado import del nuevo modal
- Estados para manejar la unidad de proyecto seleccionada
- Lógica de detección en `handleFeatureClick`
- Función helper `mapEstadoFromGeoJSON`

### `src/components/ProjectMapWithPanels_fixed.tsx`

- Mismas modificaciones que el archivo anterior
- Mantiene compatibilidad con la versión fixed

### `src/app/globals.css`

- Agregadas utilidades de z-index para garantizar que el modal aparezca por encima

## Flujo de Funcionamiento

1. **Click en el Mapa**: Usuario hace clic en una unidad de proyecto en el mapa
2. **Detección**: Sistema verifica si el feature clickeado es una unidad de proyecto
3. **Conversión**: Convierte los datos del GeoJSON a formato `UnidadProyecto`
4. **Modal**: Abre el `ProjectUnitModal` con toda la información específica
5. **Interacción**: Usuario puede ver gráficos, exportar o imprimir la información

## Propiedades Soportadas

El modal puede manejar estas propiedades del GeoJSON:

### Identificación

- `bpin`: Código BPIN del proyecto
- `identificador`: ID único de la unidad
- `id_via`: Para infraestructura vial

### Información Básica

- `nickname`: Nombre de la unidad
- `nombre_unidad_proyecto`: Nombre alternativo
- `seccion_via`: Para vías

### Estado y Progreso

- `estado_unidad_proyecto`: Estado actual
- `avance_físico_obra`: Progreso físico (decimal)
- `pagos_realizados`: Montos ejecutados y pagados
- `ppto_base`: Presupuesto base

### Ubicación

- `comuna_corregimiento`: Comuna o corregimiento
- `barrio_vereda`: Barrio o vereda
- `direccion`: Dirección específica

### Detalles Técnicos

- `tipo_intervencion`: Tipo de intervención
- `clase_obra`: Clase de obra
- `subclase_obra`: Subclase de obra
- `descripcion_intervencion`: Descripción detallada

### Fechas y Responsables

- `fecha_inicio_planeado/real`: Fechas de inicio
- `fecha_fin_planeado/real`: Fechas de finalización
- `nombre_centro_gestor`: Centro gestor responsable
- `usuarios_beneficiarios`: Número de beneficiarios

## Prioridad de Z-Index

- **ProjectUnitModal**: z-[99999] (máxima prioridad)
- **ProjectModal**: z-50 (prioridad normal)
- **Otros elementos**: z-index menores

Esto garantiza que el modal de unidades de proyecto siempre aparezca por encima de cualquier otro elemento en la pantalla.
