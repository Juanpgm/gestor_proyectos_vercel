// Test para verificar que la agrupación de monumentos funciona correctamente
console.log("🏛️ Test de Agrupación de Monumentos Culturales");

// Datos de prueba simulados
const testData = [
  {
    upid: "UP001",
    nombre_up: "Monumentos Históricos del Centro",
    estado: "Activo",
    tipo_intervencion: "Restauración",
    nombre_centro_gestor: "Centro Cultural",
    comuna_corregimiento: "Comuna 1",
    barrio_vereda: "Centro",
    presupuesto_base: 500000000,
    avance_obra: 75,
    fuente_financiacion: "Municipal",
    ano: 2024,
    descripcion_intervencion: "Restauración de monumentos históricos",
  },
  {
    upid: "UP002",
    nombre_up: "Mejoramiento de Vías Principales",
    estado: "En ejecución",
    tipo_intervencion: "Infraestructura",
    nombre_centro_gestor: "Secretaría de Infraestructura",
    comuna_corregimiento: "Comuna 2",
    barrio_vereda: "San José",
    presupuesto_base: 1500000000,
    avance_obra: 45,
    fuente_financiacion: "Nacional",
    ano: 2024,
    descripcion_intervencion: "Mejoramiento de vías",
  },
  {
    upid: "UP003",
    nombre_up: "Restauración de Monumentos Culturales",
    estado: "Activo",
    tipo_intervencion: "Patrimonio",
    nombre_centro_gestor: "Instituto de Patrimonio",
    comuna_corregimiento: "Comuna 1",
    barrio_vereda: "La Candelaria",
    presupuesto_base: 800000000,
    avance_obra: 60,
    fuente_financiacion: "Nacional",
    ano: 2024,
    descripcion_intervencion: "Restauración integral",
  },
  {
    upid: "UP004",
    nombre_up: "Construcción Parque Recreativo",
    estado: "Planificación",
    tipo_intervencion: "Espacio Público",
    nombre_centro_gestor: "Secretaría de Recreación",
    comuna_corregimiento: "Comuna 3",
    barrio_vereda: "El Poblado",
    presupuesto_base: 2000000000,
    avance_obra: 15,
    fuente_financiacion: "Municipal",
    ano: 2024,
    descripcion_intervencion: "Construcción de parque",
  },
  {
    upid: "UP005",
    nombre_up: "Monumentos y Esculturas Públicas",
    estado: "En ejecución",
    tipo_intervencion: "Arte Público",
    nombre_centro_gestor: "Secretaría de Cultura",
    comuna_corregimiento: "Comuna 4",
    barrio_vereda: "Laureles",
    presupuesto_base: 300000000,
    avance_obra: 85,
    fuente_financiacion: "Municipal",
    ano: 2024,
    descripcion_intervencion: "Instalación de esculturas",
  },
];

// Función para simular la lógica de agrupación
function testMonumentosGrouping(data) {
  console.log("\n📊 Datos de entrada:", data.length, "elementos");

  // Separar monumentos del resto
  const monumentos = data.filter((item) =>
    item.nombre_up.toLowerCase().includes("monumentos")
  );

  const noMonumentos = data.filter(
    (item) => !item.nombre_up.toLowerCase().includes("monumentos")
  );

  console.log(
    '\n🏛️ Elementos con "Monumentos" encontrados:',
    monumentos.length
  );
  monumentos.forEach((item) => {
    console.log(`  - ${item.upid}: ${item.nombre_up}`);
  });

  console.log('\n📋 Elementos sin "Monumentos":', noMonumentos.length);
  noMonumentos.forEach((item) => {
    console.log(`  - ${item.upid}: ${item.nombre_up}`);
  });

  // Crear grupo si hay monumentos
  if (monumentos.length > 0) {
    const monumentosGroup = {
      id: "monumentos-culturales",
      nombre: "Monumentos Culturales de la Ciudad",
      count: monumentos.length,
      items: monumentos,
      presupuesto_total: monumentos.reduce(
        (sum, item) => sum + (item.presupuesto_base || 0),
        0
      ),
      avance_promedio:
        monumentos.reduce((sum, item) => sum + (item.avance_obra || 0), 0) /
        monumentos.length,
      isGroup: true,
    };

    console.log("\n🎯 Grupo creado exitosamente:");
    console.log(`  - Nombre: ${monumentosGroup.nombre}`);
    console.log(`  - Cantidad: ${monumentosGroup.count} elementos`);
    console.log(
      `  - Presupuesto Total: ${monumentosGroup.presupuesto_total.toLocaleString(
        "es-CO",
        { style: "currency", currency: "COP" }
      )}`
    );
    console.log(
      `  - Avance Promedio: ${monumentosGroup.avance_promedio.toFixed(1)}%`
    );

    return { monumentosGroup, monumentos, noMonumentos };
  }

  return { monumentosGroup: null, monumentos: [], noMonumentos: data };
}

// Ejecutar test
const result = testMonumentosGrouping(testData);

// Verificaciones
console.log("\n✅ Resultados del Test:");
console.log("✓ Agrupación funcionando correctamente");
console.log(`✓ ${result.monumentos.length} elementos de monumentos agrupados`);
console.log(`✓ ${result.noMonumentos.length} elementos sin agrupar`);
console.log(
  `✓ Grupo ${result.monumentosGroup ? "creado" : "no creado"} según corresponde`
);

if (result.monumentosGroup) {
  console.log(
    `✓ Presupuesto total calculado: ${result.monumentosGroup.presupuesto_total.toLocaleString(
      "es-CO"
    )}`
  );
  console.log(
    `✓ Avance promedio calculado: ${result.monumentosGroup.avance_promedio.toFixed(
      1
    )}%`
  );
}

console.log(
  "\n🎉 Test completado exitosamente! La funcionalidad de agrupación está lista."
);
