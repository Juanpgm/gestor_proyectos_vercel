/**
 * Utilidades para formateo de moneda y números en notación colombiana
 */

/**
 * Formatea un número a notación colombiana de pesos
 * @param amount - Cantidad en pesos
 * @param options - Opciones de formateo
 */
export const formatCurrencyColombian = (
  amount: number,
  options: {
    showDecimals?: boolean
    abbreviated?: boolean
    includeSymbol?: boolean
  } = {}
): string => {
  const { showDecimals = false, abbreviated = false, includeSymbol = true } = options

  if (isNaN(amount) || amount === null || amount === undefined) {
    return includeSymbol ? '$0' : '0'
  }

  // Para números abreviados (millones, miles de millones)
  if (abbreviated) {
    const symbol = includeSymbol ? '$' : ''
    
    if (amount >= 1e12) {
      return `${symbol}${(amount / 1e12).toFixed(1)} Billones`
    } else if (amount >= 1e9) {
      return `${symbol}${(amount / 1e9).toFixed(1)} mil M`
    } else if (amount >= 1e6) {
      return `${symbol}${(amount / 1e6).toFixed(1)} M`
    } else if (amount >= 1e3) {
      return `${symbol}${(amount / 1e3).toFixed(1)} mil`
    } else {
      return `${symbol}${amount.toLocaleString('es-CO')}`
    }
  }

  // Formateo completo colombiano
  const formatter = new Intl.NumberFormat('es-CO', {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: 'COP',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })

  return formatter.format(amount)
}

/**
 * Formatea un número simple con separadores colombianos
 */
export const formatNumberColombian = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return '0'
  return num.toLocaleString('es-CO')
}

/**
 * Convierte un número a texto abreviado colombiano
 */
export const abbreviateNumber = (num: number): string => {
  if (isNaN(num) || num === null || num === undefined) return '0'
  
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(1)} B` // Billones
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)} mil M` // Miles de millones
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)} M` // Millones
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)} mil` // Miles
  } else {
    return num.toString()
  }
}

/**
 * Obtiene el color para una categoría específica
 */
export const getCategoryColor = (value: any, type: 'progress' | 'budget' | 'type' | 'status'): string => {
  switch (type) {
    case 'progress':
      const progress = typeof value === 'number' ? value : parseFloat(value) || 0
      if (progress >= 0.9) return '#10b981' // Verde - Completado
      if (progress >= 0.7) return '#3b82f6' // Azul - Avanzado  
      if (progress >= 0.4) return '#f59e0b' // Amarillo - En progreso
      if (progress >= 0.1) return '#f97316' // Naranja - Iniciado
      return '#ef4444' // Rojo - Sin avance

    case 'budget':
      const budget = typeof value === 'number' ? value : parseFloat(value) || 0
      if (budget >= 50e9) return '#7c3aed' // Violeta - Muy alto
      if (budget >= 10e9) return '#dc2626' // Rojo - Alto
      if (budget >= 5e9) return '#ea580c' // Naranja - Medio-alto
      if (budget >= 1e9) return '#f59e0b' // Amarillo - Medio
      if (budget >= 100e6) return '#10b981' // Verde - Bajo
      return '#6b7280' // Gris - Muy bajo

    case 'type':
      const typeColors: Record<string, string> = {
        'CONSTRUCCIÓN': '#dc2626',
        'MANTENIMIENTO': '#f59e0b', 
        'REHABILITACIÓN': '#3b82f6',
        'MEJORAMIENTO': '#10b981',
        'DOTACIÓN': '#7c3aed',
        'ESTUDIOS': '#6b7280',
        'INTERVENTORÍA': '#f97316',
      }
      return typeColors[String(value).toUpperCase()] || '#6b7280'

    case 'status':
      const statusColors: Record<string, string> = {
        'COMPLETADO': '#10b981',
        'EN EJECUCIÓN': '#3b82f6',
        'EN EVALUACIÓN': '#f59e0b',
        'PLANIFICACIÓN': '#6b7280',
        'SUSPENDIDO': '#ef4444',
      }
      return statusColors[String(value).toUpperCase()] || '#6b7280'

    default:
      return '#6b7280'
  }
}