// Sistema de colores unificado para toda la aplicación
// Colores más sutiles pero legibles

export const CONTRACT_COLORS = {
  // Estados de contratos - Colores más sutiles
  states: {
    // Estados positivos - Verde sutil
    'celebrado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dark: 'dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800' },
    'liquidado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dark: 'dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800' },
    'ejecutado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dark: 'dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800' },
    'finalizado': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dark: 'dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800' },
    
    // Estados de finalización - Azul sutil
    'terminado': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dark: 'dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800' },
    'completado': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dark: 'dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800' },
    'cerrado': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dark: 'dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-800' },
    
    // Estados en progreso - Ámbar sutil
    'en ejecución': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dark: 'dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800' },
    'ejecución': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dark: 'dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800' },
    'vigente': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dark: 'dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800' },
    'activo': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dark: 'dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800' },
    
    // Estados de adjudicación - Púrpura sutil
    'adjudicado': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dark: 'dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800' },
    'asignado': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dark: 'dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800' },
    'contratado': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dark: 'dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-800' },
    
    // Estados negativos - Rojo sutil
    'desierto': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dark: 'dark:bg-red-900/10 dark:text-red-400 dark:border-red-800' },
    'cancelado': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dark: 'dark:bg-red-900/10 dark:text-red-400 dark:border-red-800' },
    'anulado': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dark: 'dark:bg-red-900/10 dark:text-red-400 dark:border-red-800' },
    
    // Estado por defecto - Gris sutil
    'default': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dark: 'dark:bg-slate-900/10 dark:text-slate-400 dark:border-slate-800' }
  }
}

export const SECTION_COLORS = {
  // Gradientes de sección más sutiles
  execution: {
    light: 'from-blue-50/80 to-indigo-50/80',
    dark: 'dark:from-blue-900/10 dark:to-indigo-900/10',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-100 dark:border-blue-800/50'
  },
  financial: {
    light: 'from-emerald-50/80 to-green-50/80',
    dark: 'dark:from-emerald-900/10 dark:to-green-900/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-100 dark:border-emerald-800/50'
  },
  contractor: {
    light: 'from-purple-50/80 to-violet-50/80',
    dark: 'dark:from-purple-900/10 dark:to-violet-900/10',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-800/50'
  },
  entity: {
    light: 'from-teal-50/80 to-cyan-50/80',
    dark: 'dark:from-teal-900/10 dark:to-cyan-900/10',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-100 dark:border-teal-800/50'
  },
  schedule: {
    light: 'from-orange-50/80 to-amber-50/80',
    dark: 'dark:from-orange-900/10 dark:to-amber-900/10',
    icon: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-100 dark:border-orange-800/50'
  },
  additional: {
    light: 'from-rose-50/80 to-pink-50/80',
    dark: 'dark:from-rose-900/10 dark:to-pink-900/10',
    icon: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-100 dark:border-rose-800/50'
  }
}

export const FINANCIAL_COLORS = {
  // Colores para métricas financieras
  contract_value: 'text-emerald-600 dark:text-emerald-400',
  paid_value: 'text-blue-600 dark:text-blue-400',
  billed_value: 'text-purple-600 dark:text-purple-400',
  pending_value: 'text-orange-600 dark:text-orange-400',
  state: 'text-slate-600 dark:text-slate-400'
}

// Función para obtener colores de estado de contrato de forma unificada
export function getContractStateColors(estado: string): string {
  const estadoLower = (estado || '').toLowerCase().trim()
  
  // Buscar coincidencia exacta primero
  if (CONTRACT_COLORS.states[estadoLower as keyof typeof CONTRACT_COLORS.states]) {
    const colors = CONTRACT_COLORS.states[estadoLower as keyof typeof CONTRACT_COLORS.states]
    return `${colors.bg} ${colors.text} ${colors.border} ${colors.dark}`
  }
  
  // Buscar coincidencias parciales
  for (const [key, colors] of Object.entries(CONTRACT_COLORS.states)) {
    if (key !== 'default' && estadoLower.includes(key)) {
      return `${colors.bg} ${colors.text} ${colors.border} ${colors.dark}`
    }
  }
  
  // Retornar color por defecto
  const defaultColors = CONTRACT_COLORS.states.default
  return `${defaultColors.bg} ${defaultColors.text} ${defaultColors.border} ${defaultColors.dark}`
}

// Función para obtener colores de sección
export function getSectionColors(section: keyof typeof SECTION_COLORS) {
  const colors = SECTION_COLORS[section] || SECTION_COLORS.execution
  return {
    background: `bg-gradient-to-br ${colors.light} ${colors.dark}`,
    icon: colors.icon,
    border: colors.border
  }
}

// Función para obtener colores financieros
export function getFinancialColor(type: keyof typeof FINANCIAL_COLORS): string {
  return FINANCIAL_COLORS[type] || FINANCIAL_COLORS.state
}