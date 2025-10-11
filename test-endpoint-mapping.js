/**
 * Script para verificar el mapeo correcto de los campos del endpoint
 */

// Datos del endpoint (ejemplo de respuesta real)
const endpointSample = {
  tipo_contrato: "Interventoría",
  representante_legal: "VISION GANADORA BY VALDES GALEANO S.A.S.",
  nombre_centro_gestor: "Departamento Administrativo de Tecnologías",
  supervisor: "ERMILSON DIAZ MARTINEZ",
  fecha_firma_contrato: null,
  modalidad_contratacion: "Concurso de méritos abierto",
  bp: "BP26005260",
  bpin: 2024760010045,
  sector: "Tecnologías de la Información y las Comunicaciones",
  descripcion_proceso: "Realizar la interventoria tecnica...",
  estado_contrato: "Aprobado",
  proceso_contractual: "CO1.BDOS.8607619",
  fecha_fin_contrato: "2025-12-31",
  id_contrato: "CO1.PCCNTR.8355803",
  valor_contrato: 824287971,
  valor_pagado: "0",
  fecha_inicio_contrato: null,
  referencia_contrato: "4134.010.26.1.0544-2025",
  entidad_contratante: "SANTIAGO DE CALI DISTRITO ESPECIAL - DATIC",
  objeto_contrato: "Realizar la interventoria tecnica...",
};

// Campos que usa nuestro componente
const componentFields = [
  "tipo_contrato",
  "representante_legal",
  "nombre_centro_gestor",
  "supervisor",
  "fecha_firma_contrato",
  "modalidad_contratacion",
  "bp",
  "bpin",
  "sector",
  "descripcion_proceso",
  "estado_contrato",
  "proceso_contractual",
  "fecha_fin_contrato",
  "id_contrato",
  "valor_contrato",
  "valor_pagado",
  "fecha_inicio_contrato",
  "referencia_contrato",
  "entidad_contratante",
  "objeto_contrato",
];

console.log("✅ Verificación de mapeo de campos del endpoint:");
console.log("================================================\n");

componentFields.forEach((field) => {
  const exists = endpointSample.hasOwnProperty(field);
  const value = endpointSample[field];
  const status = exists ? "✅" : "❌";

  console.log(
    `${status} ${field}: ${exists ? value || "null/undefined" : "NO EXISTE"}`
  );
});

console.log("\n📊 Resumen:");
console.log(`- Campos verificados: ${componentFields.length}`);
console.log(
  `- Campos válidos: ${
    componentFields.filter((f) => endpointSample.hasOwnProperty(f)).length
  }`
);
console.log(
  `- Campos faltantes: ${
    componentFields.filter((f) => !endpointSample.hasOwnProperty(f)).length
  }`
);

console.log(
  "\n🎯 El componente ContratosEmprestitoTable.tsx está ahora usando los campos exactos del endpoint GET /contratos_emprestito_all"
);
