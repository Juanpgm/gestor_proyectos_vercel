// Test para verificar el formateo de moneda en notación colombiana

const formatCurrency = (value, showDecimals = true) => {
  if (value === 0) return "$0";

  const absValue = Math.abs(value);
  const isNegative = value < 0;
  const prefix = isNegative ? "-$" : "$";

  // Mostrar cifra completa si es menor a 100,000 (cien mil)
  if (absValue < 100000) {
    return `${prefix}${absValue.toLocaleString("es-CO")}`;
  }

  // Miles (K) - de 100,000 a 999,999
  if (absValue < 1e6) {
    const thousands = absValue / 1e3;
    const decimals = showDecimals && thousands % 1 !== 0 ? 1 : 0;
    return `${prefix}${thousands.toFixed(decimals)}K`;
  }

  // Millones (M) - de 1,000,000 a 999,999,999
  if (absValue < 1e9) {
    const millions = absValue / 1e6;
    const decimals = showDecimals && millions % 1 !== 0 ? 1 : 0;
    return `${prefix}${millions.toFixed(decimals)}M`;
  }

  // Mil millones (MM) - de 1,000,000,000 a 999,999,999,999
  if (absValue < 1e12) {
    const thousands = absValue / 1e9;
    const decimals = showDecimals && thousands % 1 !== 0 ? 1 : 0;
    return `${prefix}${thousands.toFixed(decimals)}MM`;
  }

  // Billones (B) - de 1,000,000,000,000 en adelante (un millón de millones)
  const trillions = absValue / 1e12;
  const decimals = showDecimals && trillions % 1 !== 0 ? 1 : 0;
  return `${prefix}${trillions.toFixed(decimals)}B`;
};

// Pruebas de formateo
console.log("🧪 Pruebas de formateo de moneda - Notación Colombiana");
console.log("");

console.log("📊 Pruebas básicas:");
console.log(`50,000 = ${formatCurrency(50000)}`); // $50.000
console.log(`500,000 = ${formatCurrency(500000)}`); // $500K
console.log(`1,500,000 = ${formatCurrency(1500000)}`); // $1.5M
console.log(`1,000,000,000 = ${formatCurrency(1000000000)}`); // $1MM (mil millones)
console.log(`1,500,000,000 = ${formatCurrency(1500000000)}`); // $1.5MM (mil quinientos millones)
console.log(`1,000,000,000,000 = ${formatCurrency(1000000000000)}`); // $1B (un billón)

console.log("");
console.log("🔍 Comparación - Notación Estadounidense vs Colombiana:");

const testValues = [
  1000, // mil
  1000000, // un millón
  1000000000, // mil millones (1 millardo)
  1000000000000, // un billón (un millón de millones)
  1500000000000, // un billón quinientos mil millones
];

console.log("Valor\t\t\tEE.UU.\t\tColombia");
console.log("─".repeat(50));

testValues.forEach((value) => {
  // Formateo estadounidense (anterior)
  let usFormat;
  if (value >= 1000000000) usFormat = `$${(value / 1000000000).toFixed(1)}B`;
  else if (value >= 1000000) usFormat = `$${(value / 1000000).toFixed(1)}M`;
  else if (value >= 1000) usFormat = `$${(value / 1000).toFixed(1)}K`;
  else usFormat = `$${value.toLocaleString("es-CO")}`;

  // Formateo colombiano (corregido)
  const coFormat = formatCurrency(value);

  console.log(`${value.toLocaleString()}\t\t${usFormat}\t\t${coFormat}`);
});

console.log("");
console.log("✅ Notar que:");
console.log("- MM = mil millones (millardos)");
console.log("- B = billones (un millón de millones)");
console.log("- Esto es consistente con la notación colombiana/europea");
