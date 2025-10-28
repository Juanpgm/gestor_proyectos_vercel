# Controles de Filtrado para la Sección "Proyectos"

## 🎯 Funcionalidades Implementadas

Se han añadido controles de filtrado avanzados a la sección "Proyectos" que permiten a los usuarios filtrar y buscar proyectos de manera más eficiente.

## 📋 Controles de Filtrado Disponibles

### 1. Barra de Búsqueda General

- **Ubicación**: Panel de filtros principal
- **Funcionalidad**: Busca en todos los campos del proyecto
- **Campos incluidos**:
  - Nombre del proyecto
  - BPIN
  - Centro gestor responsable
  - Comuna
  - Nombre del fondo
  - Clasificación del fondo
  - Descripción
  - Textos adicionales

### 2. Dropdowns con Búsqueda Interna

#### Estado del Proyecto

- **Valores**: En Ejecución, Planificación, Completado, Suspendido, En Evaluación
- **Funcionalidad**: Filtrar por estado actual del proyecto

#### Centro Gestor

- **Valores**: Lista dinámica de todos los centros gestores disponibles
- **Funcionalidad**: Filtrar por entidad responsable del proyecto

#### Comuna

- **Valores**: Lista dinámica de todas las comunas con proyectos
- **Funcionalidad**: Filtrar por ubicación geográfica

#### Nombre del Fondo

- **Valores**: Lista dinámica de todos los nombres de fondos disponibles
- **Funcionalidad**: Filtrar por el fondo específico del proyecto
- **Fuente de datos**: Variable `nombre_fondo` de los datos del proyecto

#### Clasificación del Fondo

- **Valores**: Lista dinámica de todas las clasificaciones de fondos disponibles
- **Funcionalidad**: Filtrar por el tipo de clasificación del fondo
- **Fuente de datos**: Variable `clasificacion_fondo` de los datos del proyecto

### 3. Filtros Numéricos

#### Rango de Presupuesto

- **Presupuesto Mínimo**: Campo numérico para establecer el valor mínimo
- **Presupuesto Máximo**: Campo numérico para establecer el valor máximo
- **Unidad**: Pesos colombianos (COP)

#### Rango de Progreso

- **Progreso Mínimo**: Porcentaje mínimo de avance (0-100%)
- **Progreso Máximo**: Porcentaje máximo de avance (0-100%)

## 🎨 Características de la UI

### Panel de Filtros Colapsable

- **Activación**: Botón "Filtros" en el header de la tabla
- **Estado visual**: Se resalta cuando hay filtros activos
- **Contador**: Muestra el número de filtros aplicados

### Dropdowns Mejorados

- **Búsqueda interna**: Cada dropdown incluye una caja de búsqueda
- **Selección visual**: Opción seleccionada marcada con ✓
- **Limpiar opción**: Botón para deseleccionar
- **Responsivo**: Se adapta a diferentes tamaños de pantalla

### Indicadores Visuales

- **Contador de filtros activos**: Badge en el botón de filtros
- **Estadísticas en tiempo real**: Muestra proyectos filtrados vs. total
- **Botón limpiar**: Visible solo cuando hay filtros activos

## 🔧 Funcionalidades Técnicas

### Filtrado en Tiempo Real

- Los filtros se aplican instantáneamente al cambiar valores
- No requiere botón "Aplicar"
- Mantiene el estado durante la sesión

### Combinación de Filtros

- Todos los filtros se pueden combinar
- Lógica AND: debe cumplir TODOS los filtros aplicados
- Filtros vacíos son ignorados

### Persistencia de Estado

- Los filtros se mantienen durante la navegación en la página
- Se resetean solo al limpiar manualmente

### Optimización de Rendimiento

- Uso de `useMemo` para cálculos de filtrado
- Filtrado local sin llamadas adicionales al servidor
- Renderizado eficiente con animaciones suaves

## 🎯 Casos de Uso

### Para Administradores

- Encontrar proyectos por centro gestor específico
- Filtrar por rango de presupuesto para análisis financiero
- Buscar proyectos por estado para seguimiento

### Para Usuarios Finales

- Buscar proyectos en su comuna
- Encontrar proyectos por nombre o descripción
- Filtrar por avance para ver proyectos completados

### Para Analistas

- Combinar múltiples filtros para análisis específicos
- Filtrar por nombre y clasificación de fondo para estudios presupuestales
- Analizar proyectos por tipo de fondo (Recursos Propios, Transferencias, etc.)
- Usar rangos numéricos para estudios comparativos
- Búsqueda textual para encontrar proyectos específicos

## 📊 Estadísticas del Panel

El panel de filtros incluye estadísticas en tiempo real:

- Total de proyectos disponibles
- Número de proyectos después del filtrado
- Cantidad de estados, centros gestores, comunas, nombres de fondos y clasificaciones de fondos disponibles

## 🚀 Cómo Usar

1. **Acceder a los filtros**: Hacer clic en el botón "Filtros" en el header de la tabla
2. **Búsqueda rápida**: Usar la barra de búsqueda general para búsquedas textuales
3. **Filtros específicos**: Seleccionar valores en los dropdowns
4. **Rangos numéricos**: Ingresar valores mínimos y máximos para presupuesto y progreso
5. **Limpiar filtros**: Usar el botón "X" o "Limpiar filtros" para resetear

## 🔄 Integración

Los nuevos controles de filtrado:

- ✅ Se integran completamente con la tabla existente
- ✅ Mantienen compatibilidad con el sistema de paginación
- ✅ Preservan la funcionalidad de ordenamiento
- ✅ Son responsivos para todos los dispositivos
- ✅ Siguen el tema dark/light de la aplicación

## 📱 Responsive Design

- **Desktop**: Panel completo con grid de 4 columnas
- **Tablet**: Grid adaptativo a 2 columnas
- **Mobile**: Layout vertical con controles apilados
- **Todos**: Dropdowns con búsqueda interna optimizada para touch

## 🎨 Animaciones

- Transiciones suaves para mostrar/ocultar panel
- Animaciones de apertura de dropdowns
- Estados hover e interactivos
- Feedback visual para filtros activos
