/**
 * Script de diagnóstico para verificar el cálculo de "Valor Total RPCs"
 *
 * PROBLEMA DETECTADO: Los endpoints de RPCs no están disponibles en producción
 * - /rpc_all - 404
 * - /rpc_contratos_emprestito_all - 404
 *
 * Este script intentará usar endpoints alternativos disponibles
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://gestorproyectoapi-production.up.railway.app";

async function diagnosticarValorTotalRPCs() {
  console.log("=".repeat(80));
  console.log("DIAGNÓSTICO: Valor Total RPCs");
  console.log("=".repeat(80));
  console.log(`\n📡 API URL: ${API_URL}`);
  console.log(`⏰ Fecha: ${new Date().toLocaleString("es-CO")}\n`);

  try {
    // 1. Verificar endpoints disponibles
    console.log("1️⃣ Verificando endpoints disponibles...\n");

    const endpointsToTest = [
      "/rpc_all",
      "/rpc_contratos_emprestito_all",
      "/contratos_pagos_all",
      "/pagos_emprestito_all",
    ];

    let workingEndpoint = null;
    let responseData = null;

    for (const endpoint of endpointsToTest) {
      try {
        console.log(`   Probando: ${API_URL}${endpoint}`);
        const response = await fetch(`${API_URL}${endpoint}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Endpoint funcional: ${endpoint}`);
          console.log(
            `   📊 Respuesta: success=${data.success}, count=${
              data.count || data.data?.length || 0
            }`
          );

          // Verificar si es el endpoint correcto
          if (endpoint.includes("rpc")) {
            workingEndpoint = endpoint;
            responseData = data;
            break;
          } else if (endpoint.includes("pago")) {
            console.log(`   ℹ️  Este es un endpoint de PAGOS, no de RPCs\n`);
          }
        } else {
          console.log(`   ❌ Error ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.log(`   ❌ Error de conexión: ${err.message}`);
      }
      console.log();
    }

    if (!workingEndpoint) {
      console.log("=".repeat(80));
      console.log("❌ PROBLEMA CRÍTICO DETECTADO:");
      console.log("=".repeat(80));
      console.log("\n🚨 NO HAY ENDPOINTS DE RPCs DISPONIBLES EN PRODUCCIÓN\n");
      console.log("Los endpoints intentados fueron:");
      endpointsToTest
        .filter((e) => e.includes("rpc"))
        .forEach((e) => console.log(`   • ${e}`));
      console.log("\n📋 SITUACIÓN:");
      console.log("   • El componente GestionPagos.tsx está usando /rpc_all");
      console.log("   • Este endpoint NO existe en el backend de producción");
      console.log(
        '   • La funcionalidad de "Valor Total RPCs" está ROTA en producción'
      );
      console.log("\n💡 SOLUCIONES POSIBLES:");
      console.log(
        "   1. Desplegar el backend con los endpoints de RPCs implementados"
      );
      console.log(
        "   2. Verificar que el backend tenga la ruta configurada correctamente"
      );
      console.log(
        "   3. Revisar la documentación OpenAPI vs implementación real"
      );
      console.log("\n🔍 VERIFICACIÓN ADICIONAL:");
      console.log(
        "   • El openapi_production.json muestra que /rpc_all debería existir"
      );
      console.log("   • Pero el servidor en Heroku no lo tiene implementado");
      console.log(
        "   • Posible problema de sincronización entre docs y código"
      );
      console.log("=".repeat(80));
      return;
    }

    console.log(`✅ Usando endpoint funcional: ${workingEndpoint}\n`);

    const data = responseData;
    console.log(`   ✅ Respuesta recibida: success=${data.success}`);
    console.log(`   📦 Total de RPCs: ${data.data?.length || 0}\n`);

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("Respuesta inválida del API");
    }

    const rpcs = data.data;

    // 2. Analizar cada RPC
    console.log("2️⃣ Analizando campo valor_rpc en cada RPC...\n");

    const rpcsConValor = [];
    const rpcsSinValor = [];
    const rpcsValorCero = [];
    const rpcsValorInvalido = [];
    let sumaTotal = 0;

    rpcs.forEach((rpc, index) => {
      const valor = rpc.valor_rpc;

      if (valor === undefined || valor === null) {
        rpcsSinValor.push({
          index,
          id: rpc.id,
          numero: rpc.numero_rpc,
          valor,
          beneficiario: rpc.beneficiario_nombre,
          contrato: rpc.referencia_contrato,
        });
      } else if (typeof valor !== "number") {
        rpcsValorInvalido.push({
          index,
          id: rpc.id,
          numero: rpc.numero_rpc,
          valor,
          tipo: typeof valor,
          beneficiario: rpc.beneficiario_nombre,
          contrato: rpc.referencia_contrato,
        });
      } else if (valor === 0) {
        rpcsValorCero.push({
          index,
          id: rpc.id,
          numero: rpc.numero_rpc,
          valor,
          beneficiario: rpc.beneficiario_nombre,
          contrato: rpc.referencia_contrato,
          fecha_contabilizacion: rpc.fecha_contabilizacion,
        });
      } else {
        rpcsConValor.push({
          index,
          id: rpc.id,
          numero: rpc.numero_rpc,
          valor,
          beneficiario: rpc.beneficiario_nombre,
          contrato: rpc.referencia_contrato,
        });
        sumaTotal += valor;
      }
    });

    // 3. Mostrar estadísticas
    console.log("📊 ESTADÍSTICAS:");
    console.log(`   Total de RPCs: ${rpcs.length}`);
    console.log(`   ✅ Con valor válido (> 0): ${rpcsConValor.length}`);
    console.log(`   ⚠️  Con valor = 0: ${rpcsValorCero.length}`);
    console.log(`   ❌ Sin valor (null/undefined): ${rpcsSinValor.length}`);
    console.log(
      `   🔴 Valor inválido (no numérico): ${rpcsValorInvalido.length}\n`
    );

    // 4. Calcular sumatoria
    console.log("💰 CÁLCULO DE SUMATORIA:");
    console.log(
      `   Formula: rpcs.reduce((sum, rpc) => sum + (rpc.valor_rpc || 0), 0)`
    );
    console.log(
      `   Suma Total: $${sumaTotal.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}\n`
    );

    // 5. Mostrar algunos ejemplos
    if (rpcsConValor.length > 0) {
      console.log("✅ EJEMPLOS DE RPCs CON VALOR VÁLIDO (primeros 5):");
      rpcsConValor.slice(0, 5).forEach((rpc) => {
        console.log(
          `   • RPC ${rpc.numero}: $${rpc.valor.toLocaleString("es-CO", {
            minimumFractionDigits: 2,
          })}`
        );
      });
      console.log();
    }

    if (rpcsValorCero.length > 0) {
      console.log(
        `⚠️  RPCs CON VALOR = 0 (TODOS - ${rpcsValorCero.length} registros):`
      );
      console.log("=".repeat(80));
      rpcsValorCero.forEach((rpc, i) => {
        console.log(`\n${i + 1}. RPC: ${rpc.numero}`);
        console.log(`   ID: ${rpc.id}`);
        console.log(`   Beneficiario: ${rpc.beneficiario || "N/A"}`);
        console.log(`   Contrato: ${rpc.contrato || "N/A"}`);
        console.log(
          `   Fecha contabilización: ${rpc.fecha_contabilizacion || "N/A"}`
        );
        console.log(`   ⚠️  Valor RPC: $0`);
      });
      console.log("\n" + "=".repeat(80));
      console.log();
    }

    if (rpcsSinValor.length > 0) {
      console.log(
        `❌ RPCs SIN VALOR (null/undefined) - TODOS (${rpcsSinValor.length} registros):`
      );
      console.log("=".repeat(80));
      rpcsSinValor.forEach((rpc, i) => {
        console.log(`\n${i + 1}. RPC: ${rpc.numero}`);
        console.log(`   ID: ${rpc.id}`);
        console.log(`   Beneficiario: ${rpc.beneficiario || "N/A"}`);
        console.log(`   Contrato: ${rpc.contrato || "N/A"}`);
        console.log(`   ❌ Valor: ${rpc.valor}`);
      });
      console.log("\n" + "=".repeat(80));
      console.log();
    }

    if (rpcsValorInvalido.length > 0) {
      console.log(`🔴 RPCs CON VALOR INVÁLIDO (no numérico) - TODOS:`);
      console.log("=".repeat(80));
      rpcsValorInvalido.forEach((rpc, i) => {
        console.log(`\n${i + 1}. RPC: ${rpc.numero}`);
        console.log(`   ID: ${rpc.id}`);
        console.log(`   Beneficiario: ${rpc.beneficiario || "N/A"}`);
        console.log(`   Contrato: ${rpc.contrato || "N/A"}`);
        console.log(`   🔴 Valor: ${rpc.valor} (tipo: ${rpc.tipo})`);
      });
      console.log("\n" + "=".repeat(80));
      console.log();
    }

    // 6. Verificar distribución de valores
    console.log("📈 DISTRIBUCIÓN DE VALORES:");
    const rangos = {
      "Menos de $1M": 0,
      "$1M - $10M": 0,
      "$10M - $100M": 0,
      "$100M - $1.000M": 0,
      "Más de $1.000M": 0,
    };

    rpcsConValor.forEach((rpc) => {
      const valor = rpc.valor;
      if (valor < 1_000_000) rangos["Menos de $1M"]++;
      else if (valor < 10_000_000) rangos["$1M - $10M"]++;
      else if (valor < 100_000_000) rangos["$10M - $100M"]++;
      else if (valor < 1_000_000_000) rangos["$100M - $1.000M"]++;
      else rangos["Más de $1.000M"]++;
    });

    Object.entries(rangos).forEach(([rango, count]) => {
      if (count > 0) {
        console.log(`   ${rango}: ${count} RPCs`);
      }
    });
    console.log();

    // 7. Verificar consistencia con el componente
    console.log("🔍 VERIFICACIÓN DE CONSISTENCIA:");
    console.log(
      `   El código del componente usa: rpcs.reduce((sum, rpc) => sum + (rpc.valor_rpc || 0), 0)`
    );
    console.log(`   Esto significa que:`);
    console.log(`   • Valores undefined/null se tratan como 0: ✅`);
    console.log(`   • Valores numéricos se suman correctamente: ✅`);
    console.log(
      `   • Valores en string deberían convertirse o tratarse como 0`
    );
    console.log();

    // 8. Resumen final
    console.log("=".repeat(80));
    console.log("📋 RESUMEN FINAL:");
    console.log("=".repeat(80));
    console.log(`Total de RPCs: ${rpcs.length}`);
    console.log(
      `Valor Total RPCs: $${sumaTotal.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    );

    if (
      rpcsSinValor.length > 0 ||
      rpcsValorInvalido.length > 0 ||
      rpcsValorCero.length > 0
    ) {
      console.log(`\n⚠️  REGISTROS CON PROBLEMAS DETECTADOS:`);
      if (rpcsSinValor.length > 0) {
        console.log(
          `   • ${rpcsSinValor.length} RPCs sin valor (null/undefined) - NO SUMAN`
        );
      }
      if (rpcsValorInvalido.length > 0) {
        console.log(
          `   • ${rpcsValorInvalido.length} RPCs con valor inválido (no numérico) - NO SUMAN`
        );
      }
      if (rpcsValorCero.length > 0) {
        console.log(
          `   • ${rpcsValorCero.length} RPCs con valor = 0 - NO SUMAN`
        );
      }
      console.log(`\n💡 IMPACTO EN EL CÁLCULO:`);
      console.log(
        `   • Estos ${
          rpcsSinValor.length + rpcsValorInvalido.length + rpcsValorCero.length
        } RPCs se están tratando como $0 en la sumatoria`
      );
      console.log(
        `   • Representan ${(
          ((rpcsSinValor.length +
            rpcsValorInvalido.length +
            rpcsValorCero.length) /
            rpcs.length) *
          100
        ).toFixed(1)}% del total de registros`
      );

      if (rpcsValorCero.length > 0) {
        console.log(`\n📌 NOTA IMPORTANTE SOBRE RPCs CON VALOR = 0:`);
        console.log(`   • Hay ${rpcsValorCero.length} RPCs con valor_rpc = 0`);
        console.log(
          `   • Esto puede ser normal si son RPCs sin valor asignado aún`
        );
        console.log(`   • O puede indicar un problema de carga de datos`);
        console.log(
          `   • Revisa el listado detallado arriba para determinar si es correcto`
        );
      }
    } else {
      console.log(
        `\n✅ NO SE DETECTARON PROBLEMAS - Todos los RPCs tienen valor_rpc válido > 0`
      );
    }

    console.log("=".repeat(80));
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.stack) {
      console.error("\n📚 Stack trace:");
      console.error(error.stack);
    }
  }
}

// Ejecutar diagnóstico
diagnosticarValorTotalRPCs();
