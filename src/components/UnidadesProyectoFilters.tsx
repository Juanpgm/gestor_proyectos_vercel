/**
 * Componente de filtros mejorado para Unidades de Proyecto
 * Con searchbars y dropdown mejorados (manteniendo compatibilidad con FilterParams)
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, X, ChevronDown, Check, DollarSign, TrendingUp } from 'lucide-react';
import { type FilterData, type FilterParams } from '@/services/unidades-proyecto.service';

type GlobalFilterOptions = {
  centros_gestores: string[];
  estados: string[];
  tipos_intervencion: string[];
  tipos_equipamiento: string[];
  clases_up: string[];
  frentes_activos: string[];
  comunas_corregimientos: string[];
  barrios_veredas: string[];
  fuentes_financiacion: string[];
  anos: string[];
  proyectos_estrategicos: string[];
};

declare global {
  interface Window {
    UNIDADES_PROYECTO_FILTERS_GLOBAL?: Partial<GlobalFilterOptions>;
    CENTROS_GESTORES?: string[];
    ESTADOS?: string[];
    ESTADOS_UP?: string[];
    TIPOS_INTERVENCION?: string[];
    TIPOS_INTERVENCIONES?: string[];
    TIPOS_EQUIPAMIENTO?: string[];
    CLASES_UP?: string[];
    FRENTES_ACTIVOS?: string[];
    COMUNAS_CORREGIMIENTOS?: string[];
    BARRIOS_VEREDAS?: string[];
    FUENTES_FINANCIACION?: string[];
    ANOS?: string[];
    PROYECTOS_ESTRATEGICOS?: string[];
    __UP_FILTER_DEBUG__?: Record<string, unknown>;
    __UP_FILTER_TIMELINE__?: Array<Record<string, unknown>>;
  }
}

const ESTADOS_UP_DEFAULT: string[] = [
  'En alistamiento',
  'En ejecución',
  'Suspendido',
  'Terminado',
  'Inaugurado',
];

const TIPOS_INTERVENCIONES_DEFAULT: string[] = [
  'Obra nueva',
  'Adecuaciones',
  'Rehabilitación / Reforzamiento',
  'Demolición',
  'Mantenimiento',
  'Estudios y diseños',
  'Transferencia directa',
];

const FUENTES_FINANCIACION_DEFAULT: string[] = [
  'Empréstito',
  'Ingresos libre destinación',
  'Ingresos con destinación específica',
  'Cooperación Internacional - donaciones',
  'Presupuesto Participativo',
  'Otros créditos (vigencias anteriores)',
];

const CLASES_UP_DEFAULT: string[] = [
  'Interventoria',
  'Estudios y diseños',
  'Obras equipamientos',
  'Obra vial',
  'Adquisición predial',
  'Subsidios',
  'Demarcación vial',
  'Dotaciones',
  'Obras de Arte (civil)',
];

const TIPOS_EQUIPAMIENTO_DEFAULT: string[] = [
  'Instituciones Educativas',
  'Parques y zonas verdes',
  'Fuentes y monumentos',
  'CALIS',
  'Centro Cultural',
  'Estaciones de policia',
  'Vivienda mejoramiento',
  'Estaciones MIO',
  'Casa de Justicia',
  'Bibliotecas',
  'IPS',
  'Jardines',
  'Reducción del riesgo',
  'Vivienda nueva',
  'UTS',
  'Canchas',
  'Eco parques',
  'CAD',
  'Infraestructura vial',
  'Infraestructura recreativa',
  'Infraestructura recreo deportiva',
  'Adquisición predios',
  'Infraestructura cultural',
  'Señalización vial',
  'Infraestructura de servicios publicos',
];

const CENTROS_GESTORES_DEFAULT: string[] = [
  'Departamento Administrativo de Contratación Pública',
  'Departamento Administrativo de Control Disciplinario Interno',
  'Departamento Administrativo de Control Interno',
  'Departamento Administrativo de Desarrollo e Innovación Institucional',
  'Departamento Administrativo de Gestión Jurídica Pública',
  'Departamento Administrativo de Gestión del Medio Ambiente',
  'Departamento Administrativo de Hacienda',
  'Departamento Administrativo de Planeación Municipal',
  'Departamento Administrativo de Tecnologías de la Información y las Comunicaciones',
  'Secretaría de Bienestar Social',
  'Secretaría de Cultura',
  'Secretaría de Desarrollo Económico',
  'Secretaría de Desarrollo Territorial y Participación Ciudadana',
  'Secretaría de Educación',
  'Secretaría de Gestión del Riesgo de Emergencias y Desastres',
  'Secretaría de Gobierno',
  'Secretaría de Infraestructura',
  'Secretaría de Movilidad',
  'Secretaría de Paz y Cultura Ciudadana',
  'Secretaría de Salud Pública',
  'Secretaría de Seguridad y Justicia',
  'Secretaría de Turismo',
  'Secretaría de Vivienda Social y Hábitat',
  'Secretaría del Deporte y la Recreación',
  'Unidad Administrativa Especial de Gestión de Bienes y Servicios',
  'Unidad Administrativa Especial de Protección Animal',
  'Unidad Administrativa Especial de Servicios Públicos',
];

const COMUNAS_CORREGIMIENTOS_DEFAULT: string[] = [
  'COMUNA 01', 'COMUNA 02', 'COMUNA 03', 'COMUNA 04', 'COMUNA 05',
  'COMUNA 06', 'COMUNA 07', 'COMUNA 08', 'COMUNA 09', 'COMUNA 10',
  'COMUNA 11', 'COMUNA 12', 'COMUNA 13', 'COMUNA 14', 'COMUNA 15',
  'COMUNA 16', 'COMUNA 17', 'COMUNA 18', 'COMUNA 19', 'COMUNA 20',
  'COMUNA 21', 'COMUNA 22',
  'El Hormiguero', 'El Saladito', 'Felidia', 'Golondrinas',
  'La Buitrera', 'La Castilla', 'La Elvira', 'La Leonera', 'La Paz',
  'Los Andes', 'Montebello', 'Navarro', 'Pance', 'Pichinde', 'Villacarmelo',
];

const BARRIOS_VEREDAS_DEFAULT: string[] = [
  '20 de Julio', '3 de Julio', 'Acueducto de la Reforma', 'Aguablanca', 'Aguacatal',
  'Alameda', 'Alfonso Barberena A.', 'Alfonso Bonilla Aragón', 'Alfonso Lopez P. 1a Etapa',
  'Alfonso Lopez P. 2a Etapa', 'Alfonso Lopez P. 3a Etapa', 'Alférez Real',
  'Alirio Mora Beltrán', 'Alto Aguacatal', 'Alto de Los Mangos', 'Alto del Cerro Normandia',
  'Alto Nápoles', 'Altos de Menga', 'Antonio Nariño', 'Aranjuez', 'Arboledas',
  'Asturias', 'Atanasio Girardot', 'Atenas', 'Barrio Obrero', 'Base Aérea',
  'Belalcázar', 'Belisario Caicedo', 'Bella Suiza', 'Bellavista', 'Bello Horizonte',
  'Belén', 'Benjamín Herrera', 'Bolivariano', 'Bosques del Limonar', 'Bretaña',
  'Brisas de Los Alamos', 'Brisas de los Cristales', 'Brisas de Mayo',
  'Brisas de Montebello', 'Brisas del Limonar', 'Buenos Aires', 'Buitrera (Cabecera)',
  'Caldas', 'Calima', 'Calimio Desepaz', 'Calipso',
  'Camino Real - Joaquin Borrero Sinisterra', 'Camino Real - Los Fundadores',
  'Campoalegre', 'Caney', 'Carpatos', 'Cascajal', 'Cauca Viejo',
  'Cañaveral', 'Cañaveralejo - Seguros Patria', 'Cañaverales - Los Samanes',
  'Centenario', 'Champagnat', 'Chapinero', 'Charco Azul',
  'Chiminangos I', 'Chiminangos II', 'Chipichape', 'Ciudad 2000',
  'Ciudad Campestre', 'Ciudad Capri', 'Ciudad Córdoba', 'Ciudad de Los Alamos',
  'Ciudad Talanga', 'Ciudad Universitaria', 'Ciudadela Comfandi',
  'Ciudadela del Rio - CVC', 'Ciudadela Floralia', 'Ciudadela Pasoancho',
  'Club Campestre', 'Colinas del Sur', 'Colseguros Andes', 'Compartir',
  'Cristo Rey - La Hamaca', 'Cristóbal Colón', 'Cuarteles de Nápoles',
  'Cuarto de Legua - Guadalupe', 'Departamental', 'Desepaz Invicali',
  'Dinastia Ventiaderos', 'Doce de Octubre', 'Dos Quebradas',
  'Ecoparque Cristo Rey', 'Eduardo Santos', 'El Banqueo', 'El Bosque',
  'El Calvario', 'El Carmen', 'El Cedro', 'El Cerezo', 'El Cortijo',
  'El Diamante', 'El Dorado', 'El Estero', 'El Faro', 'El Futuro',
  'El Gran Limonar', 'El Gran Limonar - Cataya', 'El Guabal', 'El Hoyo',
  'El Ingenio', 'El Jardin', 'El Jardín', 'El Jordán', 'El Lido',
  'El Limonar', 'El Mango - La Reforma', 'El Morichal', 'El Mortiñal',
  'El Nacional', 'El Otoño', 'El Pajuil', 'El Palomar', 'El Paraíso',
  'El Pato', 'El Peon', 'El Peñón', 'El Piloto', 'El Pinar',
  'El Poblado I', 'El Poblado II', 'El Pondaje', 'El Porvenir', 'El Prado',
  'El Recuerdo', 'El Refugio', 'El Remanso', 'El Retiro', 'El Rodeo',
  'El Rosario', 'El Saladito (Cabecera)', 'El Sena', 'El Troncal',
  'El Trébol', 'El Vallado', 'El Vergel', 'Eucaristico', 'Evaristo Garcia',
  'Felidia (Cabecera)', 'Fenalco Kennedy', 'Fepicol', 'Flora Industrial',
  'Fonaviemcali', 'Francisco Eladio Ramírez', 'Fátima', 'Galeras',
  'Golondrinas (Cabecera)', 'Granada', 'Guayaquil', 'Guillermo Valencia',
  'Horizontes', 'Hormiguero (Cabecera)', 'Ignacio Rengifo',
  'Industria de Licores', 'Industrial', 'Jorge Eliécer Gaitán',
  'Jorge Isaacs', 'Jorge Zawadsky', 'José Holguín Garcés',
  'José Manuel Marroquín I', 'José Manuel Marroquín II',
  'José María Córdoba', 'Juanambú', 'Julio Rincón', 'Junín', 'Km 18',
  'La Alborada', 'La Alianza', 'La Base', 'La Cajita', 'La Campiña',
  'La Candelaria', 'La Carolina - Andes Bajo', 'La Cascada',
  'La Castilla (Cabecera)', 'La Elvira (Cabecera)', 'La Esmeralda',
  'La Esperanza', 'La Flora', 'La Floresta', 'La Fonda', 'La Fortaleza',
  'La Gran Colombia', 'La Hacienda', 'La Independencia', 'La Isla',
  'La Leonera (Cabecera)', 'La Libertad', 'La Luisa', 'La María',
  'La Mariaa', 'La Merced', 'La Paila', 'La Paz', 'La Paz (Cabecera)',
  'La Playa', 'La Rivera I', 'La Riverita', 'La Selva', 'La Sirena',
  'La Sultana', 'La Viga', 'La Voragine', 'Las Acacias', 'Las Américas',
  'Las Brisas', 'Las Ceibas', 'Las Delicias', 'Las Granjas', 'Las Nieves',
  'Las Orquídeas', 'Las Palmas', 'Las Quintas de Don Simón',
  'Laureano Gómez', 'León XIII', 'Lili', 'Limones', 'Lleras Camargo',
  'Lleras Restrepo', 'Lleras Restrepo II', 'Lomitas', 'Los Alcazares',
  'Los Andes', 'Los Andes (Cabecera)', 'Los Andes B - La Riviera',
  'Los Arrayanes - Los Pinos', 'Los Chorros', 'Los Comuneros I',
  'Los Comuneros II', 'Los Conquistadores', 'Los Cámbulos',
  'Los Farallones', 'Los Guaduales', 'Los Guayacanes', 'Los Lagos',
  'Los Laureles', 'Los Libertadores', 'Los Lideres', 'Los Naranjos',
  'Los Naranjos II', 'Los Parques Barranquilla', 'Los Pinos',
  'Los Portales - Nuevo Rey', 'Los Robles', 'Los Sauces', 'Lourdes',
  'Mameyal', 'Manuel Maria Buenaventura', 'Manuela Beltrán',
  'Manzanares', 'Maracaibo', 'Marco Fidel Suárez', 'Mariano Ramos',
  'Mario Correa Rengifo', 'Marroquín III', 'Mayapan - Las Vegas',
  'Meléndez', 'Menga', 'Metropolitano del Norte', 'Miraflores',
  'Mojica', 'Monaco', 'Montañitas', 'Montañuelas',
  'Montebello (Cabecera)', 'Morgan', 'Municipal',
  'Navarro - La Chanca', 'Navarro (Cabecera)', 'Normandia',
  'Nueva Floresta', 'Nueva Tequendama', 'Nápoles', 'Olaya Herrera',
  'Olímpico', 'Omar Torrijos', 'Pampa Linda', 'Panamericano',
  'Pance (Cabecera)', 'Parcelaciones Pance', 'Parque de la Caña',
  'Parque Ecológico CVC', 'Parque La Bandera', 'Paseo de Los Almendros',
  'Paso del Comercio', 'Pasoancho', 'Peñas Blancas',
  'Petecuy Primera Etapa', 'Petecuy Segunda Etapa', 'Petecuy Tercera Etapa',
  'Pichinde (Cabecera)', 'Pico de Aguila', 'Pilas del Cabuyal',
  'Pizamos I', 'Pizamos II', 'Pizamos III - Las Dalias',
  'Planta de Tratamiento', 'Playa Renaciente', 'Polvorines',
  'Popular', 'Porvenir', 'Potrero Grande', 'Prados de Oriente',
  'Prados del Limonar', 'Prados del Norte', 'Prados del Sur',
  'Primavera', 'Primero de Mayo', 'Primitivo Crespo',
  'Promociones Populares B', 'Pueblo Joven', 'Pueblo Nuevo',
  'Puerta del Sol', 'Puerto Mallarino', 'Puerto Nuevo',
  'Quebrada Honda', 'Rafael Uribe Uribe', 'República de Israel',
  'Ricardo Balcázar', 'Rodrigo Lara Bonilla', 'Saavedra Galindo',
  'Salomia', 'Samanes del Cauca', 'San Antonio', 'San Benito',
  'San Carlos', 'San Cayetano', 'San Cristóbal', 'San Fernando Nuevo',
  'San Fernando Viejo', 'San Francisco', 'San Juan Bosco',
  'San Judas Tadeo I', 'San Judas Tadeo II', 'San Luis', 'San Luis II',
  'San Marino', 'San Miguel', 'San Nicolás', 'San Pablo', 'San Pascual',
  'San Pedro', 'San Pedro Claver', 'San Vicente',
  'Santa Anita - La Selva', 'Santa Bárbara', 'Santa Elena', 'Santa Fé',
  'Santa Helena', 'Santa Isabel', 'Santa Mónica',
  'Santa Mónica Belalcázar', 'Santa Mónica Popular', 'Santa Rita',
  'Santa Rosa', 'Santa Teresita', 'Santander', 'Santo Domingo',
  'Sector Alto de los Chorros', 'Sector Alto Jordán',
  'Sector Altos de Santa Isabel', 'Sector Asprosocial - Diamante',
  'Sector Cañaveralejo Guadalupe', 'Sector Geográfico Tres Cruces',
  'Sector Laguna del Pondaje', 'Sector Meléndez',
  'Sector Patio Bonito', 'Sector Puente del Comercio',
  'Senderos de La Flora', 'Siete de Agosto', 'Siloé',
  'Simón Bolívar', 'Sindical', 'Sucre',
  'Sultana - Berlín - San Francisco', 'Tejares - Cristales',
  'Terron Colorado', 'Tierra Blanca', 'Torres de Comfandi',
  'U. D. A. Galindo Plaza de Toros', 'Ulpiano Lloreda',
  'Unicentro Cali', 'Unidad Residencial Bueno Madrid',
  'Unidad Residencial El Coliseo', 'Unidad Residencial Santiago de Cali',
  'Unión de Vivienda Popular', 'Urbanización Boyaca',
  'Urbanización Calimio', 'Urbanización Ciudad Jardín',
  'Urbanización Colseguros', 'Urbanización El Angel del Hogar',
  'Urbanización La Flora', 'Urbanización La Merced',
  'Urbanización La Nueva Base', 'Urbanización Militar',
  'Urbanización Nueva Granada', 'Urbanización Rio Lili',
  'Urbanización San Joaquin', 'Urbanización Tequendama',
  'Valle del Lili', 'Valle Grande', 'Vendimia',
  'Venezuela - Urbanización Cañaveralejo', 'Versalles',
  'Villa Colombia', 'Villa del Lago', 'Villa del Prado - El Guabito',
  'Villa del Rosario', 'Villa del Sol', 'Villa del Sur', 'Villablanca',
  'Villacarmelo (Cabecera)', 'Villamercedes I - Villa Luz - Las Garzas',
  'Villanueva', 'Vipasa', 'Vista Hermosa', 'Yira Castro',
];

const normalizeOptions = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values
    .map((value) => String(value || '').trim())
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'es'));
};

const asText = (value: unknown): string => String(value ?? '').trim();

const pickFirstNonEmpty = (...sources: unknown[]): string[] => {
  for (const source of sources) {
    const normalized = normalizeOptions(source);
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return [];
};

const extractFromRecords = (
  records: Array<Record<string, unknown>>,
  keys: string[]
): string[] => {
  if (!Array.isArray(records) || records.length === 0) return [];

  const values = records
    .map((record) => {
      const recordProperties = (record.properties && typeof record.properties === 'object')
        ? (record.properties as Record<string, unknown>)
        : undefined;

      for (const key of keys) {
        const value = asText(record[key] ?? recordProperties?.[key]);
        if (value) return value;
      }
      return '';
    })
    .filter(Boolean);

  return normalizeOptions(values);
};

const readGlobalOptions = (): Partial<GlobalFilterOptions> => {
  if (typeof window === 'undefined') return {};
  const globalObject = window.UNIDADES_PROYECTO_FILTERS_GLOBAL || {};

  return {
    centros_gestores: normalizeOptions(
      globalObject.centros_gestores && globalObject.centros_gestores.length > 0
        ? globalObject.centros_gestores
        : window.CENTROS_GESTORES
    ),
    estados: normalizeOptions(
      globalObject.estados && globalObject.estados.length > 0
        ? globalObject.estados
        : (window.ESTADOS_UP && window.ESTADOS_UP.length > 0
          ? window.ESTADOS_UP
          : window.ESTADOS)
    ),
    tipos_intervencion: normalizeOptions(
      globalObject.tipos_intervencion && globalObject.tipos_intervencion.length > 0
        ? globalObject.tipos_intervencion
        : (window.TIPOS_INTERVENCIONES && window.TIPOS_INTERVENCIONES.length > 0
          ? window.TIPOS_INTERVENCIONES
          : window.TIPOS_INTERVENCION)
    ),
    tipos_equipamiento: normalizeOptions(globalObject.tipos_equipamiento || window.TIPOS_EQUIPAMIENTO),
    clases_up: normalizeOptions(globalObject.clases_up || window.CLASES_UP),
    frentes_activos: normalizeOptions(globalObject.frentes_activos || window.FRENTES_ACTIVOS),
    comunas_corregimientos: normalizeOptions(globalObject.comunas_corregimientos || window.COMUNAS_CORREGIMIENTOS),
    barrios_veredas: normalizeOptions(globalObject.barrios_veredas || window.BARRIOS_VEREDAS),
    fuentes_financiacion: normalizeOptions(
      globalObject.fuentes_financiacion && globalObject.fuentes_financiacion.length > 0
        ? globalObject.fuentes_financiacion
        : window.FUENTES_FINANCIACION
    ),
    anos: normalizeOptions(globalObject.anos || window.ANOS),
    proyectos_estrategicos: normalizeOptions(globalObject.proyectos_estrategicos || window.PROYECTOS_ESTRATEGICOS)
  };
};

interface UnidadesProyectoFiltersProps {
  filterData: FilterData | null;
  records?: Array<Record<string, unknown>>;
  filters: FilterParams & { 
    searchTerm: string;
    presupuesto_min?: number;
    presupuesto_max?: number;
    avance_min?: number;
    avance_max?: number;
  };
  onFiltersChange: (filters: FilterParams & {
    presupuesto_min?: number;
    presupuesto_max?: number;
    avance_min?: number;
    avance_max?: number;
  }) => void;
  onSearchChange: (term: string) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  showRangeFilters?: boolean; // Nuevo: mostrar filtros de rango
}

// Componente de selector mejorado con searchbar y checkboxes
const EnhancedFilterSelect: React.FC<{
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  label: string;
  disabled?: boolean;
  multiSelect?: boolean;
  selectedItems?: string[];
  onMultiChange?: (values: string[]) => void;
}> = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  disabled = false,
  multiSelect = false,
  selectedItems = [],
  onMultiChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 256; // max-h-64
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen, updateDropdownPosition]);
  
  // Convert value to string for consistent handling
  const stringValue = value?.toString() || '';

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    const sorted = [...options].sort((a, b) => a.localeCompare(b, 'es'));
    if (!searchTerm) return sorted;
    return sorted.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  // Handle multi-select checkbox changes
  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (!onMultiChange) return;
    
    if (checked) {
      onMultiChange([...selectedItems, option]);
    } else {
      onMultiChange(selectedItems.filter(item => item !== option));
    }
  };

  // Handle select all / clear all
  const handleSelectAll = () => {
    if (!onMultiChange) return;
    onMultiChange(filteredOptions);
  };

  const handleClearAll = () => {
    if (!onMultiChange) return;
    onMultiChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(target);
      if (!clickedInsideDropdown && !clickedTrigger) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (option: string) => {
    if (multiSelect) {
      // In multi-select mode, toggle the option
      const isSelected = selectedItems.includes(option);
      handleCheckboxChange(option, !isSelected);
    } else {
      // Single select mode
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = () => {
    if (multiSelect && onMultiChange) {
      onMultiChange([]);
    } else {
      onChange('');
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const displayText = useMemo(() => {
    if (multiSelect) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) {
        const item = selectedItems[0];
        return item.length > 25 ? `${item.substring(0, 25)}...` : item;
      }
      return `${selectedItems.length} seleccionados`;
    } else {
      if (!stringValue) return placeholder;
      return stringValue.length > 25 ? `${stringValue.substring(0, 25)}...` : stringValue;
    }
  }, [multiSelect, selectedItems, stringValue, placeholder]);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left hover:border-gray-400 dark:hover:border-gray-500"
      >
        <span className="truncate">
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown via portal to escape overflow/stacking context */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-64 overflow-hidden"
          style={dropdownStyle}
        >
            {/* Search bar */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Clear option and multi-select controls */}
            {multiSelect ? (
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex divide-x divide-gray-200 dark:divide-gray-700">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Seleccionar todo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
              >
                <span className="italic">{placeholder}</span>
              </button>
            )}

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No se encontraron opciones
                </div>
              ) : (
                filteredOptions.map(option => {
                  const isSelected = multiSelect ? selectedItems.includes(option) : stringValue === option;
                  
                  return (
                    <div
                      key={option}
                      className={`flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : ''
                      }`}
                    >
                      {multiSelect ? (
                        <>
                          <input
                            type="checkbox"
                            id={`${label}-${option}`}
                            checked={isSelected}
                            onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label
                            htmlFor={`${label}-${option}`}
                            className="ml-3 text-sm text-gray-900 dark:text-white cursor-pointer flex-1 truncate"
                          >
                            {option}
                          </label>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectOption(option)}
                          className={`w-full text-left text-sm transition-colors flex items-center ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          <span className="truncate block flex-1">
                            {option}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 flex-shrink-0" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Componente de filtro de rango numérico
const RangeFilter: React.FC<{
  label: string;
  min?: number;
  max?: number;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  placeholder?: { min: string; max: string };
  icon?: React.ReactNode;
  disabled?: boolean;
  formatValue?: (value: number) => string;
}> = ({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  placeholder = { min: 'Mínimo', max: 'Máximo' },
  icon,
  disabled = false,
  formatValue = (v) => v.toString()
}) => {
  const [minValue, setMinValue] = useState<string>(min?.toString() || '');
  const [maxValue, setMaxValue] = useState<string>(max?.toString() || '');

  useEffect(() => {
    setMinValue(min?.toString() || '');
  }, [min]);

  useEffect(() => {
    setMaxValue(max?.toString() || '');
  }, [max]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinValue(value);
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue === undefined || !isNaN(numValue)) {
      onMinChange(numValue);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxValue(value);
    const numValue = value === '' ? undefined : parseFloat(value);
    if (numValue === undefined || !isNaN(numValue)) {
      onMaxChange(numValue);
    }
  };

  const handleClear = () => {
    setMinValue('');
    setMaxValue('');
    onMinChange(undefined);
    onMaxChange(undefined);
  };

  const hasValues = min !== undefined || max !== undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          {icon && <span className="inline-flex mr-1">{icon}</span>}
          {label}
        </label>
        {hasValues && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder={placeholder.min}
          value={minValue}
          onChange={handleMinChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors"
        />
        <input
          type="number"
          placeholder={placeholder.max}
          value={maxValue}
          onChange={handleMaxChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors"
        />
      </div>
      {hasValues && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Rango: {min !== undefined ? formatValue(min) : '...'} - {max !== undefined ? formatValue(max) : '...'}
        </div>
      )}
    </div>
  );
};

// Componente principal de filtros
const UnidadesProyectoFilters: React.FC<UnidadesProyectoFiltersProps> = ({
  filterData,
  records = [],
  filters,
  onFiltersChange,
  onSearchChange,
  onClearFilters,
  isLoading = false,
  className = '',
  compact = false,
  showRangeFilters = false
}) => {
  // Estado para manejar filtros múltiples
  const [multiFilters, setMultiFilters] = useState<{
    estados: string[];
    tipos_intervencion: string[];
    tipos_equipamiento: string[];
    clases_up: string[];
    frentes_activos: string[];
    centros_gestores: string[];
    comunas_corregimientos: string[];
    barrios_veredas: string[];
    fuentes_financiacion: string[];
    anos: string[];
    proyectos_estrategicos: string[];
  }>({
    estados: [],
    tipos_intervencion: [],
    tipos_equipamiento: [],
    clases_up: [],
    frentes_activos: [],
    centros_gestores: [],
    comunas_corregimientos: [],
    barrios_veredas: [],
    fuentes_financiacion: [],
    anos: [],
    proyectos_estrategicos: []
  });

  // Toggle entre modo single y multi-select - habilitado por defecto
  const [isMultiMode, setIsMultiMode] = useState(true);
  const [globalVersion, setGlobalVersion] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onGlobalFiltersUpdated = () => {
      setGlobalVersion((prev) => prev + 1);
    };

    window.addEventListener('up-filters-updated', onGlobalFiltersUpdated);
    return () => {
      window.removeEventListener('up-filters-updated', onGlobalFiltersUpdated);
    };
  }, []);

  const recordOptions = useMemo<GlobalFilterOptions>(() => ({
    centros_gestores: extractFromRecords(records, ['nombre_centro_gestor', 'centro_gestor']),
    estados: extractFromRecords(records, ['estado']),
    tipos_intervencion: extractFromRecords(records, ['tipo_intervencion']),
    tipos_equipamiento: extractFromRecords(records, ['tipo_equipamiento']),
    clases_up: extractFromRecords(records, ['clase_up']),
    frentes_activos: extractFromRecords(records, ['frente_activo']),
    comunas_corregimientos: extractFromRecords(records, ['comuna_corregimiento', 'comuna']),
    barrios_veredas: extractFromRecords(records, ['barrio_vereda']),
    fuentes_financiacion: extractFromRecords(records, ['fuente_financiacion']),
    anos: extractFromRecords(records, ['ano', 'anio']),
    proyectos_estrategicos: extractFromRecords(records, ['proyectos_estrategicos'])
  }), [records]);

  const fallbackOptions = useMemo<GlobalFilterOptions>(() => ({
    centros_gestores: pickFirstNonEmpty(filterData?.centros_gestores, recordOptions.centros_gestores, CENTROS_GESTORES_DEFAULT),
    estados: pickFirstNonEmpty(filterData?.estados, recordOptions.estados, ESTADOS_UP_DEFAULT),
    tipos_intervencion: pickFirstNonEmpty(filterData?.tipos_intervencion, recordOptions.tipos_intervencion, TIPOS_INTERVENCIONES_DEFAULT),
    tipos_equipamiento: pickFirstNonEmpty(filterData?.tipos_equipamiento, recordOptions.tipos_equipamiento, TIPOS_EQUIPAMIENTO_DEFAULT),
    clases_up: pickFirstNonEmpty(recordOptions.clases_up, CLASES_UP_DEFAULT),
    frentes_activos: pickFirstNonEmpty(filterData?.frentes_activos, recordOptions.frentes_activos),
    comunas_corregimientos: pickFirstNonEmpty(filterData?.comunas, recordOptions.comunas_corregimientos, COMUNAS_CORREGIMIENTOS_DEFAULT),
    barrios_veredas: pickFirstNonEmpty(filterData?.barrios_veredas, recordOptions.barrios_veredas, BARRIOS_VEREDAS_DEFAULT),
    fuentes_financiacion: pickFirstNonEmpty(filterData?.fuentes_financiacion, recordOptions.fuentes_financiacion, FUENTES_FINANCIACION_DEFAULT),
    anos: pickFirstNonEmpty(filterData?.anos, recordOptions.anos),
    proyectos_estrategicos: pickFirstNonEmpty(filterData?.proyectos_estrategicos, recordOptions.proyectos_estrategicos, ['Pulmón de Oriente'])
  }), [filterData, recordOptions]);

  const dropdownOptions = useMemo<GlobalFilterOptions>(() => {
    const globalOptions = readGlobalOptions();
    return {
      centros_gestores: pickFirstNonEmpty(fallbackOptions.centros_gestores, globalOptions.centros_gestores),
      estados: pickFirstNonEmpty(fallbackOptions.estados, globalOptions.estados),
      tipos_intervencion: pickFirstNonEmpty(fallbackOptions.tipos_intervencion, globalOptions.tipos_intervencion),
      tipos_equipamiento: pickFirstNonEmpty(fallbackOptions.tipos_equipamiento, globalOptions.tipos_equipamiento),
      clases_up: pickFirstNonEmpty(fallbackOptions.clases_up, globalOptions.clases_up),
      frentes_activos: pickFirstNonEmpty(fallbackOptions.frentes_activos, globalOptions.frentes_activos),
      comunas_corregimientos: pickFirstNonEmpty(fallbackOptions.comunas_corregimientos, globalOptions.comunas_corregimientos),
      barrios_veredas: pickFirstNonEmpty(fallbackOptions.barrios_veredas, globalOptions.barrios_veredas),
      fuentes_financiacion: pickFirstNonEmpty(fallbackOptions.fuentes_financiacion, globalOptions.fuentes_financiacion),
      anos: pickFirstNonEmpty(fallbackOptions.anos, globalOptions.anos),
      proyectos_estrategicos: pickFirstNonEmpty(fallbackOptions.proyectos_estrategicos, globalOptions.proyectos_estrategicos)
    };
  }, [fallbackOptions, globalVersion]);

  const resolvedDropdownOptions = useMemo<GlobalFilterOptions>(() => ({
    centros_gestores: pickFirstNonEmpty(dropdownOptions.centros_gestores, CENTROS_GESTORES_DEFAULT),
    estados: pickFirstNonEmpty(dropdownOptions.estados, ESTADOS_UP_DEFAULT),
    tipos_intervencion: pickFirstNonEmpty(dropdownOptions.tipos_intervencion, TIPOS_INTERVENCIONES_DEFAULT),
    tipos_equipamiento: pickFirstNonEmpty(dropdownOptions.tipos_equipamiento, TIPOS_EQUIPAMIENTO_DEFAULT),
    clases_up: pickFirstNonEmpty(dropdownOptions.clases_up, CLASES_UP_DEFAULT),
    frentes_activos: pickFirstNonEmpty(dropdownOptions.frentes_activos),
    comunas_corregimientos: pickFirstNonEmpty(dropdownOptions.comunas_corregimientos, COMUNAS_CORREGIMIENTOS_DEFAULT),
    barrios_veredas: pickFirstNonEmpty(dropdownOptions.barrios_veredas, BARRIOS_VEREDAS_DEFAULT),
    fuentes_financiacion: pickFirstNonEmpty(dropdownOptions.fuentes_financiacion, FUENTES_FINANCIACION_DEFAULT),
    anos: pickFirstNonEmpty(dropdownOptions.anos),
    proyectos_estrategicos: pickFirstNonEmpty(dropdownOptions.proyectos_estrategicos, ['Pulmón de Oriente'])
  }), [dropdownOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observedGlobal = readGlobalOptions();

    window.__UP_FILTER_DEBUG__ = {
      ...(window.__UP_FILTER_DEBUG__ || {}),
      source: 'UnidadesProyectoFilters',
      globalVersion,
      recordsCount: records.length,
      sources: {
        global: observedGlobal,
        fallback: fallbackOptions,
        resolved: resolvedDropdownOptions,
      }
    };
  }, [resolvedDropdownOptions, records.length, fallbackOptions, globalVersion]);

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleMultiFilterChange = (key: keyof typeof multiFilters, values: string[]) => {
    console.log(`🎯 handleMultiFilterChange: key=${key}, values=`, values);
    
    setMultiFilters(prev => ({
      ...prev,
      [key]: values
    }));
    
    // Mapear las claves de filtros múltiples a las claves del FilterParams
    const mappedKey = key === 'estados' ? 'estado' :
                     key === 'tipos_intervencion' ? 'tipo_intervencion' :
                     key === 'frentes_activos' ? 'frente_activo' :
                     key === 'centros_gestores' ? 'centro_gestor' :
                     key === 'comunas_corregimientos' ? 'comuna_corregimiento' :
                     key === 'barrios_veredas' ? 'barrio_vereda' :
                     key === 'fuentes_financiacion' ? 'fuente_financiacion' :
                     key === 'tipos_equipamiento' ? 'tipo_equipamiento' :
                     key === 'clases_up' ? 'clase_up' :
                     key === 'proyectos_estrategicos' ? 'proyectos_estrategicos' :
                     'ano';
    
    console.log(`🎯 handleMultiFilterChange: mappedKey=${mappedKey}`);
    
    // Crear un nuevo objeto de filtros con el array de valores
    const newFilters = { ...filters };
    
    if (values.length > 0) {
      // Almacenar todos los valores seleccionados
      (newFilters as any)[`${mappedKey}_multiple`] = values;
      // Mantener compatibilidad con el filtro singular usando el primer valor
      (newFilters as any)[mappedKey] = values[0];
      console.log(`🎯 handleMultiFilterChange: Created filters:`, {
        [`${mappedKey}_multiple`]: values,
        [mappedKey]: values[0]
      });
    } else {
      // Limpiar ambos filtros si no hay valores seleccionados
      delete (newFilters as any)[`${mappedKey}_multiple`];
      delete (newFilters as any)[mappedKey];
      console.log(`🎯 handleMultiFilterChange: Cleared filters for ${mappedKey}`);
    }
    
    console.log(`🎯 handleMultiFilterChange: Calling onFiltersChange with:`, newFilters);
    onFiltersChange(newFilters);
  };

  // Handler para filtros de rango
  const handleRangeChange = (key: 'presupuesto' | 'avance', minOrMax: 'min' | 'max', value: number | undefined) => {
    const filterKey = `${key}_${minOrMax}` as 'presupuesto_min' | 'presupuesto_max' | 'avance_min' | 'avance_max';
    onFiltersChange({
      ...filters,
      [filterKey]: value
    });
  };

  const hasActiveFilters = useMemo(() => {
    const hasRegularFilters = Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return false; // Exclude searchTerm from active filters count
      return value && value !== '';
    });
    
    const hasMultiFilters = Object.values(multiFilters).some(values => values.length > 0);
    
    return hasRegularFilters || hasMultiFilters;
  }, [filters, multiFilters]);

  const activeFiltersCount = useMemo(() => {
    const regularFiltersCount = Object.entries(filters).filter(([key, value]) => {
      if (key === 'searchTerm') return false; // Exclude searchTerm from active filters count
      return value && value !== '';
    }).length;
    
    const multiFiltersCount = Object.values(multiFilters).reduce((acc, values) => {
      return acc + (values.length > 0 ? values.length : 0);
    }, 0);
    
    return regularFiltersCount + multiFiltersCount;
  }, [filters, multiFilters]);

  const handleClearAllFilters = () => {
    setMultiFilters({
      estados: [],
      tipos_intervencion: [],
      tipos_equipamiento: [],
      clases_up: [],
      frentes_activos: [],
      centros_gestores: [],
      comunas_corregimientos: [],
      barrios_veredas: [],
      fuentes_financiacion: [],
      anos: [],
      proyectos_estrategicos: []
    });
    onClearFilters();
  };

  const handleToggleMultiMode = () => {
    const newMode = !isMultiMode;
    setIsMultiMode(newMode);
    
    // Si se cambia a modo single, limpiar los filtros múltiples
    if (!newMode) {
      setMultiFilters({
        estados: [],
        tipos_intervencion: [],
        tipos_equipamiento: [],
        clases_up: [],
        frentes_activos: [],
        centros_gestores: [],
        comunas_corregimientos: [],
        barrios_veredas: [],
        fuentes_financiacion: [],
        anos: [],
        proyectos_estrategicos: []
      });
    }
  };

  const criticalOptionsMissing =
    resolvedDropdownOptions.centros_gestores.length === 0 &&
    resolvedDropdownOptions.estados.length === 0 &&
    resolvedDropdownOptions.tipos_intervencion.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative z-50 ${className}`}
      style={{ zIndex: 50 }}
    >
      <div className="p-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-4'}`}>
          <div className="flex items-center space-x-2">
            <Filter className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400`} />
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
              {compact ? 'Filtros' : 'Filtros de Búsqueda'}
            </h3>
            {activeFiltersCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
            {isMultiMode && !compact && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700">
                Multifiltro activado
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Toggle de modo multi-select - más compacto si es necesario */}
            <button
              type="button"
              onClick={handleToggleMultiMode}
              className={`inline-flex items-center ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} text-xs font-medium rounded-lg transition-colors ${
                isMultiMode 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isMultiMode ? 'Multifiltros activados - Puedes seleccionar múltiples opciones' : 'Cambiar a modo de filtros múltiples'}
            >
              <Check className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${compact ? '' : 'mr-1'}`} />
              {!compact && (isMultiMode ? 'Multi-filtros ON' : 'Single filtros')}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                disabled={isLoading}
                className={`inline-flex items-center ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50`}
              >
                <X className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${compact ? '' : 'mr-1'}`} />
                {!compact && 'Limpiar filtros'}
              </button>
            )}
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className={compact ? 'mb-3' : 'mb-4'}>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {compact ? 'Búsqueda' : 'Búsqueda General'}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={compact ? "Buscar..." : "Buscar por nombre, descripción, UPID..."}
              value={filters.searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-10 pr-4 ${compact ? 'py-1.5' : 'py-2'} border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-colors ${compact ? 'text-sm' : ''}`}
            />
            {isLoading && (
              <RefreshCw className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        {criticalOptionsMissing && (
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
            No se pudieron cargar opciones de filtros aun. Revisa conexion/API y recarga la pagina.
          </div>
        )}

        {/* Layout vertical de filtros para mejor legibilidad */}
        <div className={`space-y-4 ${compact ? 'space-y-3' : 'space-y-4'}`}>
          {/* Estado */}
          <EnhancedFilterSelect
            label="Estado"
            value={filters.estado}
            onChange={(value) => handleFilterChange('estado', value)}
            options={resolvedDropdownOptions.estados}
            placeholder="Todos los estados"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.estados}
            onMultiChange={(values) => handleMultiFilterChange('estados', values)}
          />

          {/* Tipo de intervención */}
          <EnhancedFilterSelect
            label="Tipo de Intervención"
            value={filters.tipo_intervencion}
            onChange={(value) => handleFilterChange('tipo_intervencion', value)}
            options={resolvedDropdownOptions.tipos_intervencion}
            placeholder="Todos los tipos"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.tipos_intervencion}
            onMultiChange={(values) => handleMultiFilterChange('tipos_intervencion', values)}
          />

          {/* Tipo de equipamiento */}
          <EnhancedFilterSelect
            label="Tipo de Equipamiento"
            value={filters.tipo_equipamiento}
            onChange={(value) => handleFilterChange('tipo_equipamiento', value)}
            options={resolvedDropdownOptions.tipos_equipamiento}
            placeholder="Todos los equipamientos"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.tipos_equipamiento}
            onMultiChange={(values) => handleMultiFilterChange('tipos_equipamiento', values)}
          />

          {/* Clase UP */}
          <EnhancedFilterSelect
            label="Clase UP"
            value={filters.clase_up}
            onChange={(value) => handleFilterChange('clase_up', value)}
            options={resolvedDropdownOptions.clases_up}
            placeholder="Todas las clases"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.clases_up}
            onMultiChange={(values) => handleMultiFilterChange('clases_up', values)}
          />

          {/* Frente activo */}
          <EnhancedFilterSelect
            label="Frente Activo"
            value={filters.frente_activo}
            onChange={(value) => handleFilterChange('frente_activo', value)}
            options={resolvedDropdownOptions.frentes_activos}
            placeholder="Todos los frentes"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.frentes_activos}
            onMultiChange={(values) => handleMultiFilterChange('frentes_activos', values)}
          />

          {/* Centro gestor */}
          <EnhancedFilterSelect
            label="Centro Gestor"
            value={filters.centro_gestor}
            onChange={(value) => handleFilterChange('centro_gestor', value)}
            options={resolvedDropdownOptions.centros_gestores}
            placeholder="Todos los centros"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.centros_gestores}
            onMultiChange={(values) => handleMultiFilterChange('centros_gestores', values)}
          />

          {/* Comuna/Corregimiento */}
          <EnhancedFilterSelect
            label="Comuna/Corregimiento"
            value={filters.comuna_corregimiento}
            onChange={(value) => handleFilterChange('comuna_corregimiento', value)}
            options={resolvedDropdownOptions.comunas_corregimientos}
            placeholder="Todas las comunas"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.comunas_corregimientos}
            onMultiChange={(values) => handleMultiFilterChange('comunas_corregimientos', values)}
          />

          {/* Barrio/Vereda */}
          <EnhancedFilterSelect
            label="Barrio/Vereda"
            value={filters.barrio_vereda}
            onChange={(value) => handleFilterChange('barrio_vereda', value)}
            options={resolvedDropdownOptions.barrios_veredas}
            placeholder="Todos los barrios"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.barrios_veredas}
            onMultiChange={(values) => handleMultiFilterChange('barrios_veredas', values)}
          />

          {/* Fuente de financiación */}
          <EnhancedFilterSelect
            label="Fuente de Financiación"
            value={filters.fuente_financiacion}
            onChange={(value) => handleFilterChange('fuente_financiacion', value)}
            options={resolvedDropdownOptions.fuentes_financiacion}
            placeholder="Todas las fuentes"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.fuentes_financiacion}
            onMultiChange={(values) => handleMultiFilterChange('fuentes_financiacion', values)}
          />

          {/* Año */}
          <EnhancedFilterSelect
            label="Año"
            value={filters.ano}
            onChange={(value) => handleFilterChange('ano', value)}
            options={resolvedDropdownOptions.anos}
            placeholder="Todos los años"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.anos}
            onMultiChange={(values) => handleMultiFilterChange('anos', values)}
          />

          {/* Proyectos Estratégicos */}
          <EnhancedFilterSelect
            label="Proyectos Estratégicos"
            value={filters.proyectos_estrategicos}
            onChange={(value) => handleFilterChange('proyectos_estrategicos', value)}
            options={resolvedDropdownOptions.proyectos_estrategicos}
            placeholder="Todos los proyectos"
            disabled={isLoading}
            multiSelect={isMultiMode}
            selectedItems={multiFilters.proyectos_estrategicos}
            onMultiChange={(values) => handleMultiFilterChange('proyectos_estrategicos', values)}
          />

          {/* Filtros de rango - solo si están habilitados */}
          {showRangeFilters && (
            <>
              {/* Rango de Presupuesto */}
              <RangeFilter
                label="Presupuesto Base"
                min={filters.presupuesto_min}
                max={filters.presupuesto_max}
                onMinChange={(value) => handleRangeChange('presupuesto', 'min', value)}
                onMaxChange={(value) => handleRangeChange('presupuesto', 'max', value)}
                placeholder={{ min: 'Mínimo', max: 'Máximo' }}
                icon={<DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />}
                disabled={isLoading}
                formatValue={(value) => new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(value)}
              />

              {/* Rango de Avance de Obra */}
              <RangeFilter
                label="Avance de Obra (%)"
                min={filters.avance_min}
                max={filters.avance_max}
                onMinChange={(value) => handleRangeChange('avance', 'min', value)}
                onMaxChange={(value) => handleRangeChange('avance', 'max', value)}
                placeholder={{ min: '0', max: '100' }}
                icon={<TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                disabled={isLoading}
                formatValue={(value) => `${value}%`}
              />
            </>
          )}
        </div>

        {/* Filtros múltiples activos */}
        {isMultiMode && Object.values(multiFilters).some(values => values.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              Filtros activos:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(multiFilters).map(([key, values]) => {
                const labels = {
                  estados: 'Estados',
                  tipos_intervencion: 'Tipos',
                  tipos_equipamiento: 'Equipamientos',
                  frentes_activos: 'Frentes',
                  centros_gestores: 'Centros',
                  comunas_corregimientos: 'Comunas',
                  barrios_veredas: 'Barrios',
                  fuentes_financiacion: 'Fuentes',
                  anos: 'Años',
                  proyectos_estrategicos: 'Proyectos'
                };
                
                return values.map(value => (
                  <span
                    key={`${key}-${value}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200"
                  >
                    <span className="mr-1 text-blue-600 dark:text-blue-300">
                      {labels[key as keyof typeof labels]}:
                    </span>
                    {value}
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = values.filter(v => v !== value);
                        handleMultiFilterChange(key as keyof typeof multiFilters, newValues);
                      }}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ));
              })}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
};


export default UnidadesProyectoFilters;