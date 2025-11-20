import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Función auxiliar para reintentar peticiones con backoff exponencial
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Reintento ${attempt}/${maxRetries} después de ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      const response = await fetch(url, options)
      
      // Si es 503, reintentar
      if (response.status === 503 && attempt < maxRetries) {
        console.log(`⚠️ Servicio no disponible (503), reintentando...`)
        lastError = new Error(`503 Service Unavailable (intento ${attempt + 1})`)
        continue
      }
      
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido')
      console.error(`❌ Error en intento ${attempt + 1}:`, lastError.message)
      
      // Si es el último intento o no es un error de red, lanzar
      if (attempt === maxRetries || !(error instanceof TypeError)) {
        throw lastError
      }
    }
  }
  
  throw lastError || new Error('Todos los intentos fallaron')
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Cargando proyecciones sin proceso desde backend externo...')
    
    // Obtener URL del backend desde variables de entorno
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
    
    if (!apiBaseUrl) {
      throw new Error('URL del backend no configurada. Configure NEXT_PUBLIC_API_BASE_URL en las variables de entorno.')
    }
    
    console.log(`🌐 Conectando al backend: ${apiBaseUrl}`)
    
    // Hacer petición al backend real con timestamp para evitar cache
    const backendUrl = `${apiBaseUrl}/emprestito/proyecciones-sin-proceso?_nocache=${Date.now()}`
    
    const response = await fetchWithRetry(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
      // Timeout de 45 segundos
      signal: AbortSignal.timeout(45000)
    }, 3, 2000)
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles')
      console.error(`❌ Backend respondió con error: ${response.status} ${response.statusText}`, errorText)
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-cache',
        'Vercel-CDN-Cache-Control': 'no-cache',
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