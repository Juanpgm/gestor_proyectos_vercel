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

export const formatCurrency = (value: number, showDecimals: boolean = true): string => {
  if (value === 0) return '$0'

  const absValue = Math.abs(value)
  const isNegative = value < 0
  const prefix = isNegative ? '-$' : '$'

  // Mostrar cifra completa si es menor a 100,000 (cien mil)
  if (absValue < 100000) {
    return `${prefix}${absValue.toLocaleString('es-CO')}`
  }

  // Miles (K) - de 100,000 a 999,999
  if (absValue < 1e6) {
    const thousands = absValue / 1e3
    const decimals = showDecimals && thousands % 1 !== 0 ? 1 : 0
    return `${prefix}${thousands.toFixed(decimals)}K`
  }

  // Millones (M) - de 1,000,000 a 999,999,999
  if (absValue < 1e9) {
    const millions = absValue / 1e6
    const decimals = showDecimals && millions % 1 !== 0 ? 1 : 0
    return `${prefix}${millions.toFixed(decimals)}M`
  }

  // Mil millones (MM) - de 1,000,000,000 a 999,999,999,999
  if (absValue < 1e12) {
    const thousands = absValue / 1e9
    const decimals = showDecimals && thousands % 1 !== 0 ? 1 : 0
    return `${prefix}${thousands.toFixed(decimals)}MM`
  }

  // Billones (B) - de 1,000,000,000,000 en adelante (un millón de millones)
  const trillions = absValue / 1e12
  const decimals = showDecimals && trillions % 1 !== 0 ? 1 : 0
  return `${prefix}${trillions.toFixed(decimals)}B`
}

export const formatCurrencyFull = (value: number): string => {
  if (value === 0) return '$0'

  const isNegative = value < 0
  const prefix = isNegative ? '-$' : '$'
  const absValue = Math.abs(value)

  return `${prefix}${absValue.toLocaleString('es-CO')}`
}

export const formatCurrencyCompact = (value: number): string => {
  return formatCurrency(value, false)
}