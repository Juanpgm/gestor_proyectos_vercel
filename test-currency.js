// Test de formateo de moneda colombiana
const formatCurrency = (value, showDecimals = true) => {
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

console.log('=== EJEMPLOS DE FORMATO DE MONEDA COLOMBIANA ===');
console.log('');
console.log('Cifras pequeñas (completas):');
console.log('$50,000 =>', formatCurrency(50000));
console.log('$85,750 =>', formatCurrency(85750));
console.log('');
console.log('Miles (K):');
console.log('$150,000 =>', formatCurrency(150000));
console.log('$500,500 =>', formatCurrency(500500));
console.log('');
console.log('Millones (M):'); 
console.log('$2,500,000 =>', formatCurrency(2500000));
console.log('$45,300,000 =>', formatCurrency(45300000));
console.log('');
console.log('Mil millones (MM - NO billones anglosajones):');
console.log('$1,200,000,000 =>', formatCurrency(1200000000));
console.log('$15,500,000,000 =>', formatCurrency(15500000000));
console.log('');
console.log('Billones colombianos (B - un millón de millones):');
console.log('$2,300,000,000,000 =>', formatCurrency(2300000000000));
console.log('$150,700,000,000,000 =>', formatCurrency(150700000000000));
