// Sistema unificado de colores para contratos - Versión sutil
export const contractColors = {
  // Estados de contrato - Colores más sutiles
  estados: {
    'En ejecución': {
      bg: 'bg-emerald-25 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800',
      badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      accent: 'text-emerald-500 dark:text-emerald-400'
    },
    'Vigente': {
      bg: 'bg-blue-25 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-800',
      badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
      accent: 'text-blue-500 dark:text-blue-400'
    },
    'Activo': {
      bg: 'bg-green-25 dark:bg-green-950/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-100 dark:border-green-800',
      badge: 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300',
      accent: 'text-green-500 dark:text-green-400'
    },
    'Terminado': {
      bg: 'bg-gray-25 dark:bg-gray-950/30',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-100 dark:border-gray-800',
      badge: 'bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300',
      accent: 'text-gray-500 dark:text-gray-400'
    },
    'Liquidado': {
      bg: 'bg-slate-25 dark:bg-slate-950/30',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-100 dark:border-slate-800',
      badge: 'bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300',
      accent: 'text-slate-500 dark:text-slate-400'
    },
    'Suspendido': {
      bg: 'bg-orange-25 dark:bg-orange-950/30',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-100 dark:border-orange-800',
      badge: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300',
      accent: 'text-orange-500 dark:text-orange-400'
    },
    'Cancelado': {
      bg: 'bg-red-25 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-800',
      badge: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300',
      accent: 'text-red-500 dark:text-red-400'
    }
  },

  // Métricas financieras - Colores más sutiles
  metricas: {
    valor: {
      bg: 'bg-indigo-25 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-800',
      icon: 'text-indigo-500 dark:text-indigo-400',
      accent: 'text-indigo-500 dark:text-indigo-400'
    },
    facturado: {
      bg: 'bg-emerald-25 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800',
      icon: 'text-emerald-500 dark:text-emerald-400',
      accent: 'text-emerald-500 dark:text-emerald-400'
    },
    pagado: {
      bg: 'bg-green-25 dark:bg-green-950/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-100 dark:border-green-800',
      icon: 'text-green-500 dark:text-green-400',
      accent: 'text-green-500 dark:text-green-400'
    },
    pendiente: {
      bg: 'bg-amber-25 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-800',
      icon: 'text-amber-500 dark:text-amber-400',
      accent: 'text-amber-500 dark:text-amber-400'
    }
  },

  // Información general - Colores más sutiles
  info: {
    entidad: {
      bg: 'bg-violet-25 dark:bg-violet-950/30',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-800',
      icon: 'text-violet-500 dark:text-violet-400',
      accent: 'text-violet-500 dark:text-violet-400'
    },
    contratista: {
      bg: 'bg-teal-25 dark:bg-teal-950/30',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-100 dark:border-teal-800',
      icon: 'text-teal-500 dark:text-teal-400',
      accent: 'text-teal-500 dark:text-teal-400'
    },
    cronograma: {
      bg: 'bg-purple-25 dark:bg-purple-950/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-800',
      icon: 'text-purple-500 dark:text-purple-400',
      accent: 'text-purple-500 dark:text-purple-400'
    },
    temporal: {
      bg: 'bg-sky-25 dark:bg-sky-950/30',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-100 dark:border-sky-800',
      icon: 'text-sky-500 dark:text-sky-400',
      accent: 'text-sky-500 dark:text-sky-400'
    }
  }
}

// Función para obtener los colores según el estado del contrato
export const getContractStateColors = (estado: string) => {
  return contractColors.estados[estado as keyof typeof contractColors.estados] || contractColors.estados['Vigente']
}

// Función para obtener colores por tipo de métrica
export const getMetricColors = (tipo: keyof typeof contractColors.metricas) => {
  return contractColors.metricas[tipo]
}

// Función para obtener colores por tipo de información
export const getInfoColors = (tipo: keyof typeof contractColors.info) => {
  return contractColors.info[tipo]
}