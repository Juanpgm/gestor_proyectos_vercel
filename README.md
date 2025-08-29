# Dashboard Alcaldía de Cali

Un dashboard interactivo optimizado para la gestión y visualización de proyectos de inversión pública de la Alcaldía de Santiago de Cali.

## 🚀 Características Principales

### 📊 Dashboard General Optimizado

- **Layout de dos columnas**: Diseño compacto que reduce 70% la altura vertical de componentes principales
- **Tarjetas de estadísticas**: Métricas clave con formato ultra-compacto y texto completo visible
- **Gráficos optimizados**: Visualizaciones de 120-160px de altura para máxima eficiencia espacial
- **Filtros unificados**: Sistema integral sin espacios redundantes, optimizado para densidad de información

### 🎨 Interfaz Ultra-Compacta

- **Eliminación de espacios rojos**: Reducción del 60% de áreas no utilizadas
- **Texto completo sin truncamiento**: Sistema `break-words` que muestra información completa
- **Tablas optimizadas**: Padding reducido (p-6→p-4) y eliminación de columnas redundantes
- **Distribución inteligente**: Aprovechamiento máximo del espacio horizontal disponible

### 🗺️ Visualización Geoespacial

- **Sistema de mapas unificado**: Arquitectura UniversalMapCore que soporta tanto mapas coropléticos como de puntos
- **Mapas coropléticos**: Visualización de datos por comunas y barrios usando Leaflet
- **Mapas de unidades de proyecto**: Visualización de equipamientos (CircleMarkers) e infraestructura vial (GeoJSON)
- **Controles de mapa avanzados**:
  - Pantalla completa con manejo robusto de errores de permisos
  - Centro automático en capas visibles con animación suave
  - Iconos mejorados y estilos modernos con gradientes
- **Datos geográficos reales**: Integración con archivos GeoJSON de Cali (comunas, barrios, corregimientos, veredas, equipamientos, infraestructura vial)
- **Mapas interactivos**: Navegación y zoom dinámico con información contextual
- **Popups informativos**: Detalles específicos al hacer clic en las áreas geográficas o unidades de proyecto
- **Carga optimizada**: Sistema de cache inteligente y eliminación de duplicación de datos

### 📋 Gestión Optimizada de Proyectos

- **Tabla de proyectos compacta**: Lista con espaciado optimizado, filtros y búsqueda sin redundancias
- **Tabla de unidades de proyecto eficiente**: Gestión sin columna DETALLE, enfoque en información esencial
- **Modal de detalles streamlined**: Vista completa optimizada para lectura rápida
- **Estados y progreso visuales**: Seguimiento claro con gráficos compactos de alta densidad informativa

### 🔍 Sistema de Filtros Ultra-Eficiente

- **Búsqueda global compacta**: Texto libre optimizado para respuesta rápida
- **Filtros geográficos densos**: Comunas, barrios, corregimientos con máximo aprovechamiento de espacio
- **Filtros administrativos streamlined**: Centro gestor, estado, fechas en formato compacto
- **Filtros personalizados optimizados**: Categorías específicas con visualización eficiente
- **Gestión de filtros activos**: Eliminación individual sin desperdicio de espacio

## 🛠️ Tecnologías Utilizadas

### Frontend Framework

- **Next.js 14**: Framework React con App Router
- **React 18**: Biblioteca de interfaz de usuario
- **TypeScript**: Tipado estático para mayor robustez

### Estilos y UI

- **Tailwind CSS**: Framework de estilos utilitarios
- **Framer Motion**: Animaciones fluidas y transiciones
- **Lucide React**: Iconografía moderna y consistente
- **Radix UI**: Componentes accesibles y personalizables

### Mapas y Geolocalización

- **Leaflet**: Biblioteca de mapas interactivos
- **React Leaflet**: Integración de Leaflet con React con importación dinámica SSR-safe
- **UniversalMapCore**: Arquitectura unificada para todos los tipos de mapas
- **Turf.js**: Análisis y manipulación de datos geoespaciales
- **CircleMarkers**: Representación optimizada de puntos de interés

### Gráficos y Visualización

- **Recharts**: Gráficos responsivos y personalizables
- **D3.js**: Manipulación avanzada de datos para visualizaciones

### Estado y Datos

- **Redux Toolkit**: Gestión del estado global
- **React Hook Form**: Manejo eficiente de formularios
- **Zod**: Validación de esquemas de datos

### Testing

- **Vitest**: Framework de testing rápido
- **Testing Library**: Utilities para testing de componentes React
- **JSDOM**: Entorno DOM para testing

## 📁 Estructura del Proyecto

```
dashboard-alcaldia-cali/
├── src/
│   ├── app/                    # App Router (Next.js 14)
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página principal del dashboard
│   │   └── globals.css        # Estilos globales
│   ├── components/            # Componentes reutilizables
│   │   ├── BudgetChart.tsx    # Gráfico de presupuesto
│   │   ├── ChoroplethMapInteractive.tsx  # Mapa coroplético con Leaflet
│   │   ├── Header.tsx         # Encabezado de navegación
│   │   ├── ProjectMapCore.tsx # Componente de mapas de proyectos
│   │   ├── ProjectMapUnified.tsx  # Contenedor unificado de mapas
│   │   ├── ProjectModal.tsx   # Modal de detalles de proyecto
│   │   ├── ProjectsChart.tsx  # Gráfico de proyectos
│   │   ├── ProjectsTable.tsx  # Tabla de proyectos
│   │   ├── ProjectsUnitsTable.tsx  # Tabla de unidades de proyecto
│   │   ├── StatsCards.tsx     # Tarjetas de estadísticas
│   │   ├── UnifiedFilters.tsx # Sistema unificado de filtros
│   │   ├── UniversalMapCore.tsx   # Componente base unificado para mapas
│   │   └── __tests__/         # Tests de componentes
│   ├── context/               # Contextos de React
│   │   ├── DashboardContext.tsx   # Estado global del dashboard
│   │   ├── DataContext.tsx    # Gestión de datos
│   │   └── ThemeContext.tsx   # Gestión de temas
│   ├── hooks/                 # Hooks personalizados
│   │   ├── useUnidadesProyecto.ts # Hook para unidades de proyecto
│   │   ├── useProjectData.ts  # Hook para datos de proyectos
│   │   └── [otros hooks...]   # Hooks adicionales para datos específicos
│   ├── lib/                   # Utilidades y configuraciones
│   │   └── leaflet-config.ts  # Configuración de Leaflet
│   ├── store/                 # Configuración de Redux
│   │   └── store.ts          # Store principal
│   ├── types/                 # Definiciones de tipos
│   │   └── kepler.d.ts       # Tipos para mapas
│   └── utils/                 # Funciones utilitarias
│       ├── coordinateUtils.ts # Utilidades para coordenadas
│       ├── geoJSONLoader.ts  # Carga optimizada de GeoJSON
│       └── keplerShims.ts    # Configuración de mapas
├── public/
│   ├── data/                 # Datos del dashboard
│   │   ├── contratos/        # Datos de contratos
│   │   ├── ejecucion_presupuestal/  # Datos presupuestales
│   │   ├── seguimiento_pa/   # Seguimiento de planes
│   │   └── unidades_proyecto/ # Datos de unidades de proyecto
│   │       ├── equipamientos.geojson     # Equipamientos urbanos
│   │       └── infraestructura_vial.geojson  # Infraestructura vial
│   └── geodata/              # Datos geográficos
│       ├── barrios.geojson   # Datos de barrios
│       ├── comunas.geojson   # Datos de comunas
│       ├── corregimientos.geojson  # Datos de corregimientos
│       └── veredas.geojson   # Datos de veredas
├── scripts/                  # Scripts de utilidad
│   ├── convert-shapefile.js  # Conversión de shapefiles a GeoJSON
│   ├── add-centro-gestor-equipamientos.js   # Scripts de datos
│   └── [otros scripts...]    # Scripts adicionales
└── [archivos de configuración]
```

## 🚦 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

1. **Clonar el repositorio**

```bash
git clone [url-del-repositorio]
cd dashboard-alcaldia-cali
```

2. **Instalar dependencias**

```bash
npm install
# o
yarn install
```

3. **Configurar variables de entorno**

```bash
# Crear archivo .env.local
cp .env.example .env.local
# Editar las variables según sea necesario
```

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm run start        # Inicia el servidor de producción

# Calidad de código
npm run lint         # Ejecuta linting
npm run test         # Ejecuta tests
```

## 📊 Funcionalidades Detalladas

### Optimizaciones de Layout v1.3.0

El dashboard ha sido completamente optimizado para máxima eficiencia espacial:

1. **Vista General Ultra-Compacta**: Dashboard con métricas en dos columnas, gráficos de 120px y máximo aprovechamiento del viewport
2. **Proyectos Optimizados**: Tabla sin columnas redundantes, padding reducido y información densa
3. **Unidades de Proyecto Eficientes**: Eliminación de columna DETALLE, redistribución de anchos optimizada
4. **Contratos Streamlined**: (Preparado con diseño compacto para futuras implementaciones)
5. **Actividades Compactas**: (Preparado con layout de alta densidad)
6. **Productos Optimizados**: (Preparado con visualización eficiente)

### Características de las Tablas Optimizadas

- **Paginación compacta**: Navegación eficiente con controles de menor altura
- **Ordenamiento visual**: Indicadores claros sin espacios excesivos
- **Búsqueda optimizada**: Filtro de texto con diseño streamlined
- **Densidad de información**: 40% más datos visibles por pantalla
- **Selección eficiente**: Controles compactos para operaciones en lote

### Mapas Interactivos

- **Sistema unificado**: UniversalMapCore como base para todos los tipos de mapas
- **Capas intercambiables**: Comunas, barrios, corregimientos, veredas y unidades de proyecto
- **Controles avanzados**: Pantalla completa y centrado automático con manejo robusto de errores
- **Datos en tiempo real**: Métricas actualizadas por área geográfica
- **Colores dinámicos**: Visualización basada en diferentes indicadores
- **Zoom inteligente**: Navegación fluida con controles intuitivos
- **CircleMarkers optimizados**: Representación eficiente de equipamientos urbanos
- **GeoJSON nativo**: Soporte completo para geometrías complejas

### Filtros Inteligentes

- **Dependencias jerárquicas**: Los barrios se filtran por comunas seleccionadas
- **Filtros múltiples**: Selección de múltiples opciones por categoría
- **Búsqueda dentro de filtros**: Localización rápida de opciones específicas
- **Persistencia**: Los filtros se mantienen al cambiar de pestaña

## 🔧 Configuración Avanzada

### Personalización de Temas

El proyecto incluye soporte para temas claro/oscuro:

```typescript
// Uso del contexto de tema
const { theme, toggleTheme } = useTheme();
```

### Configuración de Mapas

Los mapas utilizan configuración personalizada en `src/lib/leaflet-config.ts`:

```typescript
// Configuración de tiles y estilos
// Bounds geográficos de Cali
// Configuración de popups y controles
```

### Datos Mock vs Datos Reales

Actualmente el proyecto utiliza datos mock para demostración. Para integrar datos reales:

1. Reemplazar arrays mock en `src/app/page.tsx`
2. Implementar servicios API en `src/services/`
3. Configurar endpoints en variables de entorno

## 🤝 Contribución

### Estándares de Código

- **TypeScript**: Tipado estricto obligatorio
- **ESLint**: Configuración de Next.js
- **Prettier**: Formateo automático
- **Convenciones**: Nombres descriptivos y comentarios en español

### Proceso de Desarrollo

1. Crear rama feature desde main
2. Implementar cambios con tests
3. Verificar linting y tipos
4. Crear Pull Request con descripción detallada

## 📝 Licencia

Proyecto desarrollado para la Alcaldía de Santiago de Cali.

## 📞 Soporte

Para reportar problemas o solicitar características:

- Crear issue en el repositorio
- Incluir pasos de reproducción
- Adjuntar capturas de pantalla si es relevante

---

**Versión**: 2.0.0  
**Última actualización**: Agosto 2025  
**Desarrollado con**: ❤️ para la gestión pública eficiente y optimizada
