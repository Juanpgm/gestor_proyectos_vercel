# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

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
