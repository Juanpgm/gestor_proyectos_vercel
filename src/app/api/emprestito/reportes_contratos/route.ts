import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET - Obtener todos los reportes de contratos
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Cargando reportes de contratos de empréstito...')
    
    const contratosPath = path.join(process.cwd(), 'public/data/emprestito/emp_contratos.json')
    const contratosData = await fs.readFile(contratosPath, 'utf-8').catch(() => '[]')
    const contratos = JSON.parse(contratosData)
    
    // Generar reporte con estadísticas de contratos
    const reporte = {
      resumen: {
        total_contratos: contratos.length,
        valor_total_contratos: contratos.reduce((sum: number, c: any) => 
          sum + (c.valor_del_contrato || c.valor_contrato || 0), 0),
        valor_pagado: contratos.reduce((sum: number, c: any) => 
          sum + (c.valor_pagado || 0), 0),
        valor_pendiente: contratos.reduce((sum: number, c: any) => 
          sum + (c.valor_pendiente_de_ejecucion || 0), 0),
      },
      por_estado: {} as {[key: string]: number},
      por_entidad: {} as {[key: string]: number},
      por_banco: {} as {[key: string]: number},
      por_modalidad: {} as {[key: string]: number},
      contratos: contratos.slice(0, 100), // Limitar a 100 contratos más recientes
      timestamp: new Date().toISOString(),
      fuente: 'emp_contratos.json'
    }
    
    // Agrupar por estado
    contratos.forEach((contrato: any) => {
      const estado = contrato.estado_contrato || 'Sin estado'
      reporte.por_estado[estado] = (reporte.por_estado[estado] || 0) + 1
    })
    
    // Agrupar por entidad
    contratos.forEach((contrato: any) => {
      const entidad = extractOrganismo(contrato.nombre_entidad) || 'Sin entidad'
      reporte.por_entidad[entidad] = (reporte.por_entidad[entidad] || 0) + 1
    })
    
    // Agrupar por banco
    contratos.forEach((contrato: any) => {
      const banco = contrato._registro_origen?.banco || 'Bancolombia'
      reporte.por_banco[banco] = (reporte.por_banco[banco] || 0) + 1
    })
    
    // Agrupar por modalidad
    contratos.forEach((contrato: any) => {
      const modalidad = contrato.modalidad_de_contratacion || contrato.tipo_de_contrato || 'Sin modalidad'
      reporte.por_modalidad[modalidad] = (reporte.por_modalidad[modalidad] || 0) + 1
    })
    
    console.log(`✅ Reporte de contratos generado: ${contratos.length} contratos procesados`)
    
    return NextResponse.json({
      success: true,
      data: reporte,
      timestamp: new Date().toISOString(),
      source: 'local_files'
    })
    
  } catch (error) {
    console.error('❌ Error generando reporte de contratos:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error al generar reporte de contratos',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Función auxiliar para extraer nombre del organismo
function extractOrganismo(texto: string): string {
  if (!texto) return 'No especificado'
  
  // Patrones comunes para extraer el organismo
  const patrones = [
    /DISTRITO DE SANTIAGO DE CALI[^-]*-\s*([^-,\.]+)/i,
    /SECRETAR[ÍI]A\s+DE\s+([^-,\.]+)/i,
    /DEPARTAMENTO\s+ADMINISTRATIVO\s+DE\s+([^-,\.]+)/i,
    /SANTIAGO DE CALI[^-]*-\s*([^-,\.]+)/i
  ]
  
  for (const patron of patrones) {
    const match = texto.match(patron)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  // Si no encuentra patrón, tomar las primeras palabras
  const palabras = texto.split(/[\s-,\.]+/).slice(0, 3)
  return palabras.join(' ').substring(0, 30)
}