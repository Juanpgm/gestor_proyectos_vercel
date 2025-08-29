/**
 * Formatea números a moneda usando la notación colombiana/internacional
 * - Mil = K (miles)
 * - Millón = M (millones)  
 * - Mil millones = MM (mil millones, no billones anglosajones)
 * - Billón = B (un millón de millones)
 */

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
