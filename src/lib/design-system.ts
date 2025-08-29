// Design System - Sistema Unificado de Colores, Iconos y Estilos
import {
  FolderOpen,        // Proyectos
  Map,               // Unidades de Proyecto  
  Activity,          // Actividades
  Package,           // Productos
  FileText           // Contratos
} from 'lucide-react'

// Configuración de categorías principales con colores e iconos
export const CATEGORIES = {
  projects: {
    name: 'Proyectos',
    color: {
      primary: '#2563eb',     // blue-600
      light: '#3b82f6',       // blue-500
      lighter: '#60a5fa',     // blue-400
      background: '#dbeafe',  // blue-100
      darkBackground: '#1e3a8a20', // blue-800 con opacidad
    },
    icon: FolderOpen,
    gradient: 'from-blue-500 to-blue-600',
    className: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'bg-blue-100 dark:bg-blue-900/30',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
  },
  project_units: {
    name: 'Unidades de Proyecto',
    color: {
      primary: '#059669',     // emerald-600
      light: '#10b981',       // emerald-500
      lighter: '#34d399',     // emerald-400
      background: '#d1fae5',  // emerald-100
      darkBackground: '#04542720', // emerald-800 con opacidad
    },
    icon: Map,
    gradient: 'from-emerald-500 to-emerald-600',
    className: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      accent: 'bg-emerald-100 dark:bg-emerald-900/30',
      button: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
    }
  },
  activities: {
    name: 'Actividades',
    color: {
      primary: '#dc2626',     // red-600
      light: '#ef4444',       // red-500
      lighter: '#f87171',     // red-400
      background: '#fee2e2',  // red-100
      darkBackground: '#99202020', // red-800 con opacidad
    },
    icon: Activity,
    gradient: 'from-red-500 to-red-600',
    className: {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      accent: 'bg-red-100 dark:bg-red-900/30',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
  },
  products: {
    name: 'Productos',
    color: {
      primary: '#7c2d12',     // orange-800
      light: '#ea580c',       // orange-600
      lighter: '#f97316',     // orange-500
      background: '#fed7aa',  // orange-200
      darkBackground: '#9a3b0520', // orange-800 con opacidad
    },
    icon: Package,
    gradient: 'from-orange-500 to-orange-600',
    className: {
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      accent: 'bg-orange-100 dark:bg-orange-900/30',
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
  },
  contracts: {
    name: 'Contratos',
    color: {
      primary: '#5b21b6',     // violet-800
      light: '#7c3aed',       // violet-600
      lighter: '#8b5cf6',     // violet-500
      background: '#ede9fe',  // violet-100
      darkBackground: '#4c1d9520', // violet-800 con opacidad
    },
    icon: FileText,
    gradient: 'from-violet-500 to-violet-600',
    className: {
      text: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-200 dark:border-violet-800',
      accent: 'bg-violet-100 dark:bg-violet-900/30',
      button: 'bg-violet-500 hover:bg-violet-600 text-white',
      badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'
    }
  }
} as const

// Configuración de estados con colores consistentes
export const STATUS_COLORS = {
  'En Ejecución': { color: '#10b981', bg: '#d1fae5', text: '#065f46' },
  'Completado': { color: '#059669', bg: '#a7f3d0', text: '#064e3b' },
  'Planificación': { color: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  'Suspendido': { color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
  'En Evaluación': { color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  'No Iniciado': { color: '#6b7280', bg: '#f3f4f6', text: '#374151' },
  'Cerrado': { color: '#4b5563', bg: '#e5e7eb', text: '#1f2937' }
} as const

// Paleta de colores para gráficos (consistente y accesible)
export const CHART_COLORS = [
  '#2563eb', // blue-600 - Proyectos
  '#059669', // emerald-600 - Unidades
  '#dc2626', // red-600 - Actividades  
  '#ea580c', // orange-600 - Productos
  '#7c3aed', // violet-600 - Contratos
  '#0891b2', // cyan-600
  '#65a30d', // lime-600
  '#c2410c', // orange-700
  '#be185d', // pink-700
  '#4338ca'  // indigo-700
] as const

// Configuración de tipografía responsiva
export const TYPOGRAPHY = {
  h1: 'text-3xl md:text-4xl lg:text-5xl font-bold',
  h2: 'text-2xl md:text-3xl lg:text-4xl font-bold',
  h3: 'text-xl md:text-2xl lg:text-3xl font-semibold',
  h4: 'text-lg md:text-xl lg:text-2xl font-semibold',
  h5: 'text-base md:text-lg lg:text-xl font-medium',
  h6: 'text-sm md:text-base lg:text-lg font-medium',
  body: 'text-sm md:text-base',
  bodySmall: 'text-xs md:text-sm',
  caption: 'text-xs',
  button: 'text-sm md:text-base font-medium'
} as const

// Configuración de espaciado responsivo
export const SPACING = {
  section: 'space-y-4 md:space-y-6 lg:space-y-8',
  card: 'p-4 md:p-6',
  cardCompact: 'p-3 md:p-4',
  container: 'px-4 md:px-6 lg:px-8',
  gap: 'gap-4 md:gap-6',
  gapSmall: 'gap-2 md:gap-3',
  marginBottom: 'mb-4 md:mb-6',
  marginTop: 'mt-4 md:mt-6'
} as const

// Animaciones sutiles predefinidas
export const ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  stagger: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, staggerChildren: 0.1 }
  }
} as const

// Utilidad para obtener configuración de categoría
export function getCategoryConfig(category: keyof typeof CATEGORIES) {
  return CATEGORIES[category] || CATEGORIES.projects
}

// Utilidad para formatear números con localización colombiana
export function formatNumber(value: number, type: 'currency' | 'number' | 'percent' = 'number'): string {
  if (type === 'currency') {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return value.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    })
  } else if (type === 'percent') {
    return `${value.toFixed(1)}%`
  } else {
    return value.toLocaleString('es-CO')
  }
}

// Utilidad para obtener color de estado
export function getStatusColor(status: string) {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS['No Iniciado']
}

// Breakpoints responsivos
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// Utilidades CSS adicionales
export const CSS_UTILS = {
  glass: 'backdrop-blur-sm bg-white/80 dark:bg-gray-800/80',
  shadow: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
  card: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700',
  cardHover: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
  button: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  input: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-offset-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
  badge: 'px-2 py-1 text-xs font-medium rounded-full',
  iconButton: 'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200'
} as const
