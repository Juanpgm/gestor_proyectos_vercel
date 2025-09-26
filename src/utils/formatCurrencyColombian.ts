/**
 * Formatea números a moneda usando la notación colombiana CORRECTA
 * Convierte de notación americana a notación colombiana:
 * 
 * NOTACIÓN AMERICANA (INCORRECTA):          NOTACIÓN COLOMBIANA (CORRECTA):
 * - 1,000 = 1K (mil)                      - 1.000 = 1K (mil)
 * - 1,000,000 = 1M (millón)               - 1.000.000 = 1M (millón)  
 * - 1,000,000,000 = 1B (billón)           - 1.000.000.000 = 1.000M (mil millones)
 * - 1,000,000,000,000 = 1T (trillón)      - 1.000.000.000.000 = 1B (billón)
 */

export const formatCurrencyColombian = (value: number, showDecimals: boolean = true): string => {
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
    return `${prefix}${thousands.toLocaleString('es-CO', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}K`
  }
  
  // Millones (M) - de 1,000,000 a 999,999,999
  if (absValue < 1e9) {
    const millions = absValue / 1e6
    const decimals = showDecimals && millions % 1 !== 0 ? 1 : 0
    return `${prefix}${millions.toLocaleString('es-CO', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })}M`
  }
  
  // Mil millones (no "billones" anglosajones) - de 1,000,000,000 a 999,999,999,999
  if (absValue < 1e12) {
    const milMillones = absValue / 1e9
    const decimals = showDecimals && milMillones % 1 !== 0 ? 1 : 0
    return `${prefix}${milMillones.toLocaleString('es-CO', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })} mil M`
  }
  
  // Billones (B) - de 1,000,000,000,000 en adelante (un millón de millones en español)
  const billones = absValue / 1e12
  const decimals = showDecimals && billones % 1 !== 0 ? 1 : 0
  return `${prefix}${billones.toLocaleString('es-CO', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  })}B`
}

export const formatCurrencyColombianFull = (value: number): string => {
  if (value === 0) return '$0'
  
  const isNegative = value < 0
  const prefix = isNegative ? '-$' : '$'
  const absValue = Math.abs(value)
  
  return `${prefix}${absValue.toLocaleString('es-CO')}`
}

export const formatCurrencyColombianCompact = (value: number): string => {
  return formatCurrencyColombian(value, false)
}