# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-21

### 🎉 Sistema de Mapas Unificado y Mejoras de Arquitectura

#### ✨ Nuevas Funcionalidades

- **UniversalMapCore.tsx** - Componente unificado para todos los tipos de mapas

  - Soporte para capas GeoJSON y puntos (CircleMarkers)
  - Controles de pantalla completa mejorados con iconos más visibles
  - Control de centrado automático en capas visibles
  - Manejo robusto de errores de pantalla completa (policies)
  - Estilos de botones modernos con gradientes y efectos hover
  - Popups personalizados para diferentes tipos de datos

- **Mapa de Unidades de Proyecto Mejorado**

  - Carga automática de ambas capas por defecto (Equipamientos y Vías)
  - CircleMarkers para unidades de proyecto en lugar de marcadores estándar
  - Eliminación de duplicación de datos entre equipamientos y unidades
  - Sistema de capas simplificado y eficiente

- **Sistema de Carga de GeoJSON Optimizado**
  - Corrección de rutas duplicadas en ChoroplethMapInteractive
  - Loader unificado con manejo consistente de nombres vs rutas
  - Cache inteligente para evitar recargas innecesarias
  - Logs detallados para depuración de carga de datos

#### 🛠️ Mejoras Técnicas

- **ProjectMapCore.tsx** - Arquitectura simplificada

  - Eliminación de lógica redundante de capas
  - Mapeo eficiente de datos a formato unificado
  - Soporte para múltiples tipos de geometría

- **ProjectMapUnified.tsx** - Gestión de estado mejorada

  - Efectos separados para carga inicial y actualización de datos
  - Mejor manejo del ciclo de vida de componentes
  - Logs informativos para seguimiento de estado

- **useUnidadesProyecto Hook** - Carga de datos robusta
  - Verificación de entorno cliente antes de fetch
  - Logs detallados de proceso de carga
  - Manejo de errores mejorado con información específica
  - Procesamiento de coordenadas con validaciones

#### 🐛 Correcciones

- **Error de Pantalla Completa**

  - Resolución de `TypeError: Disallowed by permissions policy`
  - Implementación de try-catch para APIs de fullscreen
  - Fallbacks para diferentes navegadores (webkit, ms)
  - Manejo graceful de errores sin interrumpir la aplicación

- **Rutas GeoJSON Duplicadas**

  - Corrección de `/geodata/geodata/` en solicitudes HTTP
  - Estandarización de uso de nombres de archivo vs rutas completas
  - Eliminación de errores 404 en carga de mapas

- **Carga de Equipamientos**
  - Resolución de problema donde equipamientos no se mostraban
  - Corrección de conteo "0 unidades de proyecto"
  - Mejora en la integración de datos del hook con componentes

#### 🗑️ Limpieza de Código

- **Archivos Obsoletos Eliminados**

  - `UniversalMapComponent.tsx` - Componente obsoleto que causaba conflictos
  - `UniversalGeoJSONMap.tsx` - Referencias obsoletas eliminadas
  - Página `demo-universal-map` temporal eliminada

- **Importaciones y Referencias**
  - Limpieza de importaciones de módulos inexistentes
  - Eliminación de tipos no definidos
  - Simplificación de importaciones dinámicas

#### 📦 Optimizaciones de Build

- **Compilación Exitosa**
  - Eliminación de errores TypeScript en build
  - Solo warnings menores de React hooks (no afectan funcionalidad)
  - Optimización de chunks de JavaScript

#### 🎨 Mejoras de UI/UX

- **Controles de Mapa Mejorados**

  - Botones de 40x40px para mejor visibilidad
  - Gradientes elegantes (azul para fullscreen, verde para centrar)
  - Efectos hover con escala y sombras
  - Posicionamiento optimizado con mejor espaciado

- **Sistema de Capas Coherente**
  - Equipamientos: Puntos azules (unidades de proyecto)
  - Vías: Líneas naranjas (infraestructura GeoJSON)
  - Eliminación de confusión entre tipos de datos
  - Ambas capas activadas por defecto para mejor experiencia

#### 🔧 Configuración y Mantenimiento

- **Arquitectura Unificada**

  - Un solo componente (UniversalMapCore) para todos los mapas
  - Consistencia en manejo de datos y estilos
  - Reducción de duplicación de código
  - Mejor mantenibilidad a largo plazo

- **Sistema de Logs Mejorado**
  - Logs informativos en proceso de carga
  - Tracking de errores específicos
  - Información de depuración para desarrollo
  - Contadores de features cargadas

### 📝 Cambios en Documentación

- Actualización de comentarios en código para nueva arquitectura
- Documentación de interfaces y tipos en UniversalMapCore
- Logs explicativos en proceso de carga de datos
- Mejora en descripción de funcionalidades de componentes

### ⚠️ Notas de Migración

- Los mapas ahora usan UniversalMapCore como componente base
- La carga de equipamientos se realiza a través de unidades de proyecto
- Los controles de pantalla completa incluyen manejo de errores automático
- El sistema de cache de GeoJSON es más eficiente

---

## [1.0.0] - 2025-08-18

### 🎉 Lanzamiento Inicial

#### Añadido

- **Dashboard Principal**

  - Interfaz principal con sistema de pestañas (Vista General, Proyectos, Unidades de Proyecto, Contratos, Actividades, Productos)
  - Tarjetas de estadísticas con métricas clave (presupuesto, proyectos, beneficiarios, progreso)
  - Gráfico de presupuesto con múltiples métricas (Movimientos Presupuestales, Ejecución vs Presupuestado, Proyectos por Estado)
  - Navegación responsive con tema claro/oscuro

- **Sistema de Mapas Geoespaciales**

  - Mapa interactivo con Leaflet y React Leaflet
  - Visualización coroplética por comunas, barrios, corregimientos y veredas
  - Integración de datos geográficos reales de Cali (GeoJSON)
  - Popups informativos con datos específicos por área
  - Controles de capas intercambiables
  - Zoom dinámico y navegación fluida

- **Gestión de Proyectos**

  - Tabla de proyectos con paginación, ordenamiento y búsqueda
  - Modal de detalles de proyecto con información completa
  - Estados de proyecto: En Ejecución, Planificación, Completado, Suspendido, En Evaluación
  - Tracking de progreso y métricas de ejecución presupuestal
  - Integración con sistema de filtros global

- **Gestión de Unidades de Proyecto**

  - Tabla especializada para unidades de proyecto
  - Clasificación por tipo de intervención: Construcción, Mejoramiento, Rehabilitación, Mantenimiento
  - Colores distintivos por tipo de intervención
  - Integración con coordenadas geográficas
  - Modal de detalles específico para unidades

- **Sistema de Filtros Unificado**

  - Búsqueda global por texto libre (BPIN, nombre, responsable, barrio, comuna)
  - Filtros geográficos jerárquicos:
    - Comunas → Barrios (dependencia automática)
    - Corregimientos → Veredas (dependencia automática)
  - Filtros administrativos:
    - Centro Gestor (8 centros gestores de la alcaldía)
    - Estado del proyecto
    - Fechas de inicio y fin
    - Fuentes de financiamiento (28 opciones disponibles)
  - Filtros personalizados:
    - Categorías principales: "Invertir para crecer", "Seguridad"
    - Subcategorías: "Sanar heridas del pasado", "Cali al futuro", "Motores estratégicos", etc.
  - Visualización de filtros activos con eliminación individual
  - Contadores de filtros aplicados
  - Función de limpieza total de filtros

- **Componentes UI Avanzados**
  - Animaciones con Framer Motion
  - Diseño responsive con Tailwind CSS
  - Componentes accesibles con Radix UI
  - Iconografía consistente con Lucide React
  - Soporte para temas claro/oscuro

#### Componentes Técnicos

- **BudgetChart.tsx**

  - Gráfico de presupuesto con Recharts
  - Múltiples métricas intercambiables
  - Prop `hideMetricSelector` para uso en modales
  - Datos agrupados por centro gestor

- **ChoroplethMapLeaflet.tsx**

  - Mapa coroplético principal con Leaflet
  - Soporte para múltiples capas geográficas
  - Generación de datos dinámicos por área
  - Configuración de colores por métricas

- **MapComponent.tsx & DynamicMapContent.tsx**

  - Componente de mapa con carga dinámica
  - Prevención de errores de SSR
  - Integración con sistema de filtros

- **ProjectsTable.tsx**

  - Tabla principal de proyectos
  - Ordenamiento por columnas
  - Paginación avanzada
  - Búsqueda en tiempo real
  - Modal de detalles integrado

- **ProjectsUnitsTable.tsx**

  - Tabla especializada para unidades de proyecto
  - Interface `ProjectUnit` con propiedades específicas
  - Clasificación por tipo de intervención con colores
  - Soporte para coordenadas geográficas

- **UnifiedFilters.tsx**
  - Sistema integral de filtros
  - Dropdowns con búsqueda interna
  - Manejo de dependencias jerárquicas
  - Visualización de filtros activos
  - Interface `FilterState` tipada

#### Configuración y Infraestructura

- **Next.js 14**: App Router configurado
- **TypeScript**: Tipado estricto en todo el proyecto
- **Tailwind CSS**: Configuración personalizada con tema oscuro
- **Redux Toolkit**: Store configurado para estado global
- **Testing**: Vitest con Testing Library configurado
- **Linting**: ESLint con reglas de Next.js

#### Datos Geográficos

- **Archivos GeoJSON**: Datos reales de Cali

  - 22 comunas con límites precisos
  - +100 barrios con asociación a comunas
  - 19 corregimientos rurales
  - +80 veredas con asociación a corregimientos

- **Scripts de Conversión**: `convert-shapefile.js` para procesar datos geográficos

#### Datos Mock para Demostración

- **5 proyectos de ejemplo** con datos realistas de Cali
- **5 unidades de proyecto** con diferentes tipos de intervención
- **Datos de presupuesto** con cifras proporcionales
- **Información geográfica** basada en ubicaciones reales

### 🔧 Configurado

- **Entorno de desarrollo** con hot reload
- **Build de producción** optimizado
- **Testing suite** con casos de prueba básicos
- **Linting y formateo** automático
- **Configuración de TypeScript** estricta

### 📦 Dependencias Principales

#### Producción

- `next`: ^14.2.31 - Framework React
- `react`: ^18 - Biblioteca UI
- `typescript`: ^5 - Tipado estático
- `tailwindcss`: ^3.4.0 - Framework CSS
- `framer-motion`: ^11.0.0 - Animaciones
- `leaflet`: ^1.9.4 - Mapas interactivos
- `react-leaflet`: ^4.2.1 - Integración React-Leaflet
- `recharts`: ^2.10.0 - Gráficos
- `lucide-react`: ^0.344.0 - Iconos
- `@radix-ui/*`: Componentes accesibles
- `@turf/turf`: ^7.2.0 - Análisis geoespacial

#### Desarrollo

- `vitest`: ^1.0.0 - Testing framework
- `@testing-library/*`: Testing utilities
- `eslint`: ^8 - Linting
- `jsdom`: ^22.0.0 - DOM para testing

### 🗑️ Limpieza y Optimización

#### Archivos Eliminados

- `ChoroplethMap_backup.tsx` - Archivo backup obsoleto
- `UnifiedFilters_new.tsx` - Versión obsoleta de filtros
- `DeckChoropleth.tsx` - Componente no utilizado
- `DynamicChoroplethMap.tsx` - Componente obsoleto
- `ProjectsWithFilters.tsx` - Componente reemplazado por UnifiedFilters
- `src/components/filters/` - Carpeta vacía eliminada

#### Optimizaciones Realizadas

- Eliminación de dependencias no utilizadas
- Limpieza de imports obsoletos
- Unificación de componentes similares
- Consolidación del sistema de filtros

### 🐛 Correcciones

#### Problemas Resueltos

- **TypeError en filtros**: Corrección de tipo mismatch entre `string` y `string[]` en `centroGestor`
- **Error de inicialización**: Implementación correcta de `FilterState` con arrays vacíos
- **Verificaciones de tipo**: Añadidas validaciones `Array.isArray()` para operaciones de filtrado
- **Dependencias jerárquicas**: Filtrado correcto de barrios por comunas y veredas por corregimientos

#### Mejoras de Estabilidad

- Manejo seguro de estados undefined/null
- Validaciones de props en componentes
- Prevención de errores SSR en componentes de mapas
- Inicialización correcta de estados globales

### 📝 Documentación

- **README.md**: Documentación completa del proyecto
- **CHANGELOG.md**: Registro detallado de cambios
- **Comentarios en código**: Documentación inline en componentes principales
- **Tipos TypeScript**: Interfaces bien documentadas

---

## [Unreleased] - Próximas Versiones

### 🚀 Funcionalidades Planificadas

#### v1.1.0 - Integración de Datos Reales

- [ ] Conexión con APIs de la alcaldía
- [ ] Servicios de datos para proyectos y presupuesto
- [ ] Autenticación y autorización
- [ ] Cache de datos con React Query

#### v1.2.0 - Funcionalidades Avanzadas

- [ ] Exportación de reportes (PDF, Excel)
- [ ] Dashboard de métricas avanzadas
- [ ] Notificaciones en tiempo real
- [ ] Sistema de comentarios y seguimiento

#### v1.3.0 - Gestión Completa

- [ ] Módulo de contratos
- [ ] Gestión de actividades
- [ ] Tracking de productos entregables
- [ ] Workflow de aprobaciones

#### v2.0.0 - Arquitectura Avanzada

- [ ] Microservicios backend
- [ ] PWA (Progressive Web App)
- [ ] Sincronización offline
- [ ] API GraphQL

### 🔮 Ideas Futuras

- Integración con sistemas externos (SECOP, SIIF)
- Dashboard móvil nativo
- Inteligencia artificial para predicciones
- Realidad aumentada para visualización de proyectos

---

**Convenciones de Changelog:**

- `🎉` Nuevas funcionalidades principales
- `✨` Mejoras y características menores
- `🐛` Correcciones de errores
- `🔧` Configuración y herramientas
- `📦` Dependencias y paquetes
- `🗑️` Eliminaciones y limpieza
- `📝` Documentación
- `🚀` Funcionalidades planificadas
- `🔮` Ideas futuras
