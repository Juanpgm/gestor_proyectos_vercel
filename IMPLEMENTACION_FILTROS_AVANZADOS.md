# Implementación de Filtros Avanzados - Control de Calidad

## Resumen

Se ha implementado un sistema completo de filtrado avanzado con multi-selección para el módulo de Control de Calidad (Gestión de Unidades de Proyecto).

## Características Implementadas

### 1. Panel de Filtros Collapsible

- **Ubicación**: Posicionado entre el header y las tabs
- **Toggle**: Botón "Filtros" con badge mostrando cantidad de filtros activos
- **Animación**: Transición suave al mostrar/ocultar (framer-motion)
- **Diseño**: Completamente responsive con soporte para modo oscuro

### 2. Barra de Búsqueda

- **Funcionalidad**: Búsqueda de texto libre en todos los campos de datos
- **Features**:
  - Icono de búsqueda (Search) a la izquierda
  - Botón X para limpiar (aparece solo cuando hay texto)
  - Placeholder: "Buscar en registros..."
  - Cuenta como filtro activo en el badge

### 3. Filtros Multi-Select

Se implementaron 4 filtros con selección múltiple:

#### a) Centro Gestor

- **Campo**: `nombre_centro_gestor` / `centro_gestor`
- **Opciones**: Extraídas automáticamente de los datos
- **Placeholder**: "Todos los centros"

#### b) Severidad

- **Campo**: `max_severity` / `severity`
- **Opciones**: Extraídas automáticamente de los datos
- **Placeholder**: "Todas las severidades"

#### c) Prioridad

- **Campo**: `priority`
- **Opciones**: Extraídas automáticamente de los datos
- **Placeholder**: "Todas las prioridades"

#### d) Estado

- **Campo**: `estado` / `status`
- **Opciones**: Extraídas automáticamente de los datos
- **Placeholder**: "Todos los estados"

### 4. Componente MultiSelect Reutilizable

**Archivo**: `src/components/MultiSelect.tsx`

**Características**:

- ✅ Selección múltiple con checkmarks visuales
- ✅ Botones "Seleccionar todos" y "Limpiar"
- ✅ Contador de items seleccionados
- ✅ Click-outside para cerrar
- ✅ Dropdown scrolleable con altura máxima
- ✅ Footer con conteo total
- ✅ Botón X para limpiar en el trigger
- ✅ Soporte completo para modo oscuro
- ✅ TypeScript con interfaces tipadas

**Props**:

```typescript
interface MultiSelectProps {
  options: string[]; // Opciones disponibles
  selected: string[]; // Items seleccionados
  onChange: (selected: string[]) => void; // Callback de cambio
  placeholder?: string; // Texto cuando no hay selección
  label?: string; // Etiqueta del filtro
  maxHeight?: string; // Altura máxima del dropdown (default: 48)
}
```

### 5. Botón "Limpiar Todos los Filtros"

- **Ubicación**: Inferior derecha del panel de filtros
- **Visibilidad**: Aparece solo cuando hay filtros activos
- **Funcionalidad**: Resetea todos los filtros y la búsqueda en un solo click

## Arquitectura Técnica

### Estado de Filtros

```typescript
// Filtros activos (arrays para multi-select)
const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<
  string[]
>([]);
const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
const [selectedEstados, setSelectedEstados] = useState<string[]>([]);

// Opciones disponibles (extraídas de los datos)
const [availableCentrosGestores, setAvailableCentrosGestores] = useState<
  string[]
>([]);
const [availableSeverities, setAvailableSeverities] = useState<string[]>([]);
const [availablePriorities, setAvailablePriorities] = useState<string[]>([]);
const [availableEstados, setAvailableEstados] = useState<string[]>([]);

// Búsqueda de texto y visibilidad del panel
const [searchTerm, setSearchTerm] = useState("");
const [showFilters, setShowFilters] = useState(false);
```

### Lógica de Filtrado

La función `applyFilters()` aplica todos los filtros en secuencia:

1. **Validación**: Verifica que los datos sean un array
2. **Filtro de Centros**: Filtra por centros gestores seleccionados
3. **Filtro de Severidad**: Filtra por severidades seleccionadas
4. **Filtro de Prioridad**: Filtra por prioridades seleccionadas
5. **Filtro de Estado**: Filtra por estados seleccionados
6. **Búsqueda de Texto**: Filtra por coincidencia en cualquier campo

```typescript
const applyFilters = () => {
  if (!Array.isArray(data)) {
    setFilteredData([]);
    return;
  }

  let filtered = [...data];

  // Multi-select filters
  if (selectedCentrosGestores.length > 0) {
    filtered = filtered.filter(
      (item) =>
        selectedCentrosGestores.includes(item.nombre_centro_gestor) ||
        selectedCentrosGestores.includes(item.centro_gestor)
    );
  }

  // ... otros filtros similares ...

  // Text search
  if (searchTerm) {
    filtered = filtered.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  setFilteredData(filtered);
};
```

### Extracción de Opciones

En la función `loadData()`, se extraen valores únicos para cada filtro:

```typescript
// Centros Gestores
const centrosSet = new Set(
  result.data
    .map((item: any) => item.nombre_centro_gestor || item.centro_gestor)
    .filter(Boolean)
);
const centros = Array.from(centrosSet) as string[];
setAvailableCentrosGestores(centros.sort());

// Severidades (max_severity o severity)
const severitiesSet = new Set(
  result.data
    .map((item: any) => item.max_severity || item.severity)
    .filter(Boolean)
);
const severities = Array.from(severitiesSet) as string[];
setAvailableSeverities(severities.sort());

// Prioridades
const prioritiesSet = new Set(
  result.data.map((item: any) => item.priority).filter(Boolean)
);
const priorities = Array.from(prioritiesSet) as string[];
setAvailablePriorities(priorities.sort());

// Estados
const estadosSet = new Set(
  result.data.map((item: any) => item.estado || item.status).filter(Boolean)
);
const estados = Array.from(estadosSet) as string[];
setAvailableEstados(estados.sort());
```

## Comportamiento UX

### Toggle de Filtros

- Click en botón "Filtros" muestra/oculta el panel
- Badge numérico muestra cantidad de filtros activos
- Icono cambia entre `Filter` y `FilterX` según estado

### Feedback Visual

- Contador en el botón toggle (ej: "5" filtros activos)
- Cada MultiSelect muestra "X seleccionados" en su dropdown
- Botón "Limpiar todos" aparece solo cuando hay filtros activos

### Interacción

- Filtros se aplican automáticamente al cambiar selección
- useEffect reactivo escucha todos los cambios de filtros
- Persistencia de filtros al cambiar entre tabs
- Los filtros funcionan para todas las tabs del módulo

## Responsive Design

### Layout de Filtros

```css
/* Mobile: 1 columna */
grid-cols-1

/* Tablet: 2 columnas */
md:grid-cols-2

/* Desktop: 4 columnas */
lg:grid-cols-4
```

### Barra de Búsqueda

- Ancho completo en todas las resoluciones
- Iconos posicionados absolutamente
- Input responsive con padding adecuado

## Modo Oscuro

Todos los componentes soportan completamente el modo oscuro:

- Panel de filtros: `dark:bg-slate-800`
- Inputs: `dark:bg-slate-900 dark:text-slate-100`
- Borders: `dark:border-slate-600`
- Hovers: `dark:hover:bg-slate-700`
- MultiSelect dropdown: `dark:bg-slate-800`
- Texto: `dark:text-slate-100`

## Archivos Modificados/Creados

### Creados

- ✅ `src/components/MultiSelect.tsx` (nuevo componente reutilizable)
- ✅ `IMPLEMENTACION_FILTROS_AVANZADOS.md` (esta documentación)

### Modificados

- ✅ `src/components/GestionUnidadesProyecto.tsx`:
  - Agregados estados de filtros (8 nuevos estados)
  - Actualizada función `loadData()` para extraer opciones
  - Actualizada función `applyFilters()` para lógica multi-select
  - Agregado panel de filtros en JSX
  - Agregado botón toggle de filtros
  - Importados componentes e iconos necesarios

## Testing Recomendado

1. **Funcionalidad de Filtros**:

   - Verificar que cada filtro multi-select funcione correctamente
   - Probar combinaciones de múltiples filtros activos
   - Verificar que la búsqueda de texto funcione en todos los campos

2. **UX/UI**:

   - Verificar animación de apertura/cierre del panel
   - Comprobar que el badge muestre el conteo correcto
   - Verificar que "Limpiar todos" resetee todo correctamente

3. **Responsive**:

   - Probar en mobile (1 columna)
   - Probar en tablet (2 columnas)
   - Probar en desktop (4 columnas)

4. **Modo Oscuro**:

   - Verificar todos los componentes en dark mode
   - Comprobar contrastes y legibilidad

5. **Interacción con Tabs**:
   - Verificar que los filtros persistan al cambiar tabs
   - Comprobar que funcionen para todos los tipos de datos
   - Verificar extracción de opciones para cada endpoint

## Próximos Pasos (Opcional)

- [ ] Agregar persistencia de filtros en localStorage
- [ ] Agregar presets de filtros guardados
- [ ] Agregar export de datos filtrados
- [ ] Agregar indicador de cantidad de resultados
- [ ] Agregar tooltips explicativos en filtros
- [ ] Agregar ordenamiento de columnas en vistas tabulares

## Conclusión

Se ha implementado exitosamente un sistema completo de filtrado avanzado con:

- ✅ Multi-selección en 4 categorías principales
- ✅ Búsqueda de texto libre
- ✅ Panel collapsible con animaciones
- ✅ Componente reutilizable MultiSelect
- ✅ Feedback visual completo
- ✅ Diseño responsive
- ✅ Soporte para modo oscuro
- ✅ TypeScript sin errores
- ✅ Funciona para todas las tabs del módulo

El sistema está listo para uso en producción.
