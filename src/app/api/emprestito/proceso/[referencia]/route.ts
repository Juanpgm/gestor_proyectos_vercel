import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET - Obtener proceso específico por referencia
export async function GET(
  request: NextRequest,
  { params }: { params: { referencia: string } }
) {
  try {
    const { referencia } = params
    console.log(`📊 Buscando proceso específico: ${referencia}`)
    
    // Leer datos de procesos
    const procesosPath = path.join(process.cwd(), 'public/data/emprestito/emp_procesos.json')
    const procesosData = await fs.readFile(procesosPath, 'utf-8').catch(() => '[]')
    const procesos = JSON.parse(procesosData)
    
    // Buscar el proceso por referencia
    const proceso = procesos.find((p: any) => 
      p.referencia_proceso === referencia ||
      p.id?.toString() === referencia
    )
    
    if (!proceso) {
      return NextResponse.json({
        success: false,
        error: 'Proceso no encontrado',
        message: `No se encontró el proceso con referencia: ${referencia}`
      }, { status: 404 })
    }
    
    // Formatear datos del proceso
    const procesoFormateado = {
      id: proceso.id,
      referencia_proceso: proceso.referencia_proceso,
      nombre_organismo_reducido: extractOrganismo(proceso.objeto || proceso.descripcion),
      nombre_banco: proceso.banco || 'Bancolombia',
      BP: extractBP(proceso.objeto || proceso.descripcion),
      nombre_generico_proyecto: proceso.descripcion || proceso.objeto,
      nombre_resumido_proceso: proceso.objeto || proceso.descripcion,
      id_paa: proceso.referencia_proceso?.split('-')[0] || '',
      urlProceso: proceso.urlProceso,
      valor_proyectado: proceso.valor_total || proceso.valor_plataforma || 0,
      estado_proceso: proceso.estado_proceso_secop || 'Con Proceso',
      modalidad: proceso.modalidad,
      planeado: proceso.planeado,
      observaciones: proceso.observaciones,
      numero_contacto: proceso.numero_contacto,
      urlEstadoRealProceso: proceso.urlEstadoRealProceso,
      archivo_origen: proceso.archivo_origen,
      fecha_procesamiento: proceso.fecha_procesamiento,
      fuente: 'emp_procesos.json'
    }
    
    console.log(`✅ Proceso encontrado: ${procesoFormateado.referencia_proceso}`)
    
    return NextResponse.json({
      success: true,
      data: procesoFormateado,
      timestamp: new Date().toISOString(),
      source: 'local_files'
    })
    
  } catch (error) {
    console.error(`❌ Error obteniendo proceso ${params.referencia}:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Error al obtener proceso',
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

// Función auxiliar para extraer BP
function extractBP(texto: string): string {
  if (!texto) return ''
  
  const match = texto.match(/BP[-\s]*(\d+[\d\-]*)/i)
  return match ? match[1] : ''
}