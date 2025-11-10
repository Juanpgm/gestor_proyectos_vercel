import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Cargando proyecciones sin proceso desde backend externo...')
    
    // Obtener URL del backend desde variables de entorno
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
    
    if (!apiBaseUrl) {
      throw new Error('URL del backend no configurada. Configure NEXT_PUBLIC_API_BASE_URL en las variables de entorno.')
    }
    
    console.log(`🌐 Conectando al backend: ${apiBaseUrl}`)
    
    // Hacer petición al backend real
    const backendUrl = `${apiBaseUrl}/emprestito/proyecciones-sin-proceso`
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Timeout de 30 segundos
      signal: AbortSignal.timeout(30000)
    })
    
    if (!response.ok) {
      throw new Error(`Error del backend: ${response.status} ${response.statusText}`)
    }
    
    const backendData = await response.json()
    console.log(`✅ Datos recibidos del backend:`, {
      success: backendData.success,
      dataLength: backendData.data?.length || 0,
      timestamp: backendData.timestamp
    })
    
    // Verificar que la respuesta tenga el formato esperado
    if (!backendData.success) {
      throw new Error(`Error en respuesta del backend: ${backendData.error || 'Respuesta sin éxito'}`)
    }
    
    // Retornar los datos tal como vienen del backend
    console.log(`📊 Proyecciones sin proceso cargadas exitosamente desde backend: ${backendData.data?.length || 0} registros`)
    
    return NextResponse.json(backendData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      }
    })
    
  } catch (error) {
    console.error('❌ Error cargando proyecciones sin proceso desde backend:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    
    return NextResponse.json({
      success: false,
      error: 'Error al cargar proyecciones sin proceso',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      backend_url: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}