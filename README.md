# Dashboard Alcaldía de Cali

Un dashboard interactivo para la gestión y visualización de proyectos de inversión pública de la Alcaldía de Santiago de Cali.

## 🚀 Características Principales

### 📊 Dashboard General

- **Tarjetas de estadísticas**: Métricas clave como presupuesto total, proyectos activos, beneficiarios y progreso general
- **Gráficos de presupuesto**: Visualización de ejecución presupuestal por centro gestor con diferentes métricas
- **Filtros unificados**: Sistema integral de filtros por ubicación geográfica, fechas, centros gestores y categorías personalizadas

### 🗺️ Visualización Geoespacial

- **Mapas coropléticos**: Visualización de datos por comunas y barrios usando Leaflet
- **Datos geográficos reales**: Integración con archivos GeoJSON de Cali (comunas, barrios, corregimientos, veredas)
- **Mapas interactivos**: Navegación y zoom dinámico con información contextual
- **Popups informativos**: Detalles específicos al hacer clic en las áreas geográficas

### 📋 Gestión de Proyectos

- **Tabla de proyectos**: Lista completa con filtros, búsqueda y ordenamiento
- **Tabla de unidades de proyecto**: Gestión detallada de componentes de proyecto con clasificación por tipo de intervención
- **Modal de detalles**: Vista completa de información de proyectos y unidades
- **Estados y progreso**: Seguimiento del avance y estado de cada proyecto

### 🔍 Sistema de Filtros Avanzado

- **Búsqueda global**: Texto libre para BPIN, nombres, responsables, etc.
- **Filtros geográficos**: Comunas, barrios, corregimientos y veredas con dependencias jerárquicas
- **Filtros administrativos**: Centro gestor, estado, fechas y fuentes de financiamiento
- **Filtros personalizados**: Categorías específicas como "Invertir para crecer" y "Seguridad"
- **Filtros activos**: Visualización de filtros aplicados con opción de eliminación individual

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
- **React Leaflet**: Integración de Leaflet con React
- **Turf.js**: Análisis y manipulación de datos geoespaciales

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
│   │   ├── ChoroplethMapLeaflet.tsx  # Mapa coroplético con Leaflet
│   │   ├── DynamicMapContent.tsx     # Contenido dinámico del mapa
│   │   ├── Header.tsx         # Encabezado de navegación
│   │   ├── MapComponent.tsx   # Componente principal del mapa
│   │   ├── MapPopup.tsx       # Popup del mapa
│   │   ├── ProjectModal.tsx   # Modal de detalles de proyecto
│   │   ├── ProjectsChart.tsx  # Gráfico de proyectos
│   │   ├── ProjectsTable.tsx  # Tabla de proyectos
│   │   ├── ProjectsUnitsTable.tsx  # Tabla de unidades de proyecto
│   │   ├── ReduxProvider.tsx  # Proveedor de Redux
│   │   ├── StatsCards.tsx     # Tarjetas de estadísticas
│   │   ├── UnifiedFilters.tsx # Sistema unificado de filtros
│   │   └── __tests__/         # Tests de componentes
│   ├── context/               # Contextos de React
│   │   └── ThemeContext.tsx   # Gestión de temas
│   ├── lib/                   # Utilidades y configuraciones
│   │   └── leaflet-config.ts  # Configuración de Leaflet
│   ├── store/                 # Configuración de Redux
│   │   └── store.ts          # Store principal
│   ├── types/                 # Definiciones de tipos
│   │   └── kepler.d.ts       # Tipos para mapas
│   └── utils/                 # Funciones utilitarias
│       └── keplerShims.ts    # Configuración de mapas
├── public/
│   └── geodata/              # Datos geográficos
│       ├── barrios.geojson   # Datos de barrios
│       ├── comunas.geojson   # Datos de comunas
│       ├── corregimientos.geojson  # Datos de corregimientos
│       └── veredas.geojson   # Datos de veredas
├── geodata/                  # Archivos fuente de datos geográficos
│   ├── BARRIOS/             # Shapefiles de barrios
│   └── COMUNAS/             # Shapefiles de comunas
├── scripts/                 # Scripts de utilidad
│   └── convert-shapefile.js # Conversión de shapefiles a GeoJSON
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

### Sistema de Pestañas

El dashboard está organizado en pestañas principales:

1. **Vista General**: Dashboard con métricas, gráficos y mapa general
2. **Proyectos**: Tabla detallada de proyectos con filtros avanzados
3. **Unidades de Proyecto**: Gestión específica de componentes de proyecto
4. **Contratos**: (Preparado para futuras implementaciones)
5. **Actividades**: (Preparado para futuras implementaciones)
6. **Productos**: (Preparado para futuras implementaciones)

### Características de las Tablas

- **Paginación**: Navegación eficiente por grandes conjuntos de datos
- **Ordenamiento**: Por cualquier columna clickeable
- **Búsqueda**: Filtro de texto en tiempo real
- **Exportación**: (Preparado para futuras implementaciones)
- **Selección múltiple**: Para operaciones en lote

### Mapas Interactivos

- **Capas intercambiables**: Comunas, barrios, corregimientos y veredas
- **Datos en tiempo real**: Métricas actualizadas por área geográfica
- **Colores dinámicos**: Visualización basada en diferentes indicadores
- **Zoom inteligente**: Navegación fluida con controles intuitivos

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

**Versión**: 1.0.0  
**Última actualización**: Agosto 2025  
**Desarrollado con**: ❤️ para la gestión pública eficiente
