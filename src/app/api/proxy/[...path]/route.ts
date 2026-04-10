import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, DEFAULT_TIMEOUT } from '@/services/api'

// Marcar esta ruta como dinámica
export const dynamic = 'force-dynamic'

// CORS headers for FastAPI integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
}

const EMPRESTITO_CACHE_TTL = 15 * 60 * 1000 // 15 minutos
const emprestitoProxyCache = new Map<string, { data: unknown; status: number; timestamp: number }>()

const normalizeApiPath = (apiPath: string): string => apiPath.replace(/\/+$/, '')

const isCacheableEmprestitoPath = (apiPath: string): boolean => {
  const path = normalizeApiPath(apiPath)

  if (
    path === 'contratos_pagos_all' ||
    path === 'rpc_all' ||
    path === 'rpc_documentos_temporales' ||
    path === 'convenios_transferencias_all' ||
    path === 'pagos_emprestito_all' ||
    path === 'rpc_contratos_emprestito_all' ||
    path === 'contratos_emprestito_all' ||
    path === 'emprestito/ordenes-compra' ||
    path === 'procesos_emprestito_all' ||
    path === 'emprestito/obtener-procesos-bp' ||
    path === 'emprestito/obtener-contratos-bp' ||
    path === 'asignaciones-emprestito-banco-centro-gestor' ||
    path === 'reportes_contratos' ||
    path === 'reportes_contratos/' ||
    path === 'emprestito/quality-control/summary' ||
    path === 'emprestito/quality-control/changelog' ||
    path === 'emprestito/quality-control/by-centro-gestor' ||
    path === 'emprestito/quality-control/stats' ||
    path === 'emprestito/quality-control/records' ||
    path === 'emprestito/flujo-caja/all' ||
    path === 'emprestito/leer-tabla-proyecciones' ||
    path === 'emprestito/proyecciones-sin-proceso' ||
    path === 'bancos_emprestito_all' ||
    path === 'solicitudes_cambios_emprestito'
  ) {
    return true
  }

  return (
    path.startsWith('emprestito/proceso/') ||
    path.startsWith('emprestito/quality-control/') ||
    path.startsWith('contratos_emprestito/referencia/') ||
    path.startsWith('contratos_emprestito/centro-gestor/') ||
    path.startsWith('ordenes_compra_emprestito/numero/') ||
    path.startsWith('ordenes_compra_emprestito/centro-gestor/') ||
    path.startsWith('reportes_emprestito/')
  )
}

const buildCacheKey = (apiPath: string, searchParams: URLSearchParams): string => {
  const query = searchParams.toString()
  const normalizedPath = normalizeApiPath(apiPath)
  return query ? `${normalizedPath}?${query}` : normalizedPath
}

const getProxyTimeout = (apiPath: string): number => {
  const path = normalizeApiPath(apiPath)

  if (
    path === 'procesos_emprestito_all' ||
    path === 'contratos_emprestito_all' ||
    path === 'convenios_transferencias_all' ||
    path === 'emprestito/ordenes-compra' ||
    path === 'emprestito/quality-control/summary' ||
    path === 'emprestito/quality-control/records' ||
    path === 'emprestito/quality-control/by-centro-gestor' ||
    path === 'reportes_contratos' ||
    path === 'reportes_contratos/' ||
    path === 'emprestito/flujo-caja/all' ||
    path === 'emprestito/leer-tabla-proyecciones' ||
    path === 'solicitudes_cambios_emprestito'
  ) {
    return Math.max(DEFAULT_TIMEOUT, 90000)
  }

  return DEFAULT_TIMEOUT
}

const sanitizeSearchParamsForBackend = (searchParams: URLSearchParams): URLSearchParams => {
  const sanitized = new URLSearchParams(searchParams)
  sanitized.delete('bypass_cache')
  sanitized.delete('_t')
  return sanitized
}

const shouldRetryOnEmptyJson = (apiPath: string, method: string): boolean => {
  if (method !== 'GET') return false
  const normalizedPath = normalizeApiPath(apiPath)
  return normalizedPath === 'procesos_emprestito_all' || normalizedPath === 'emprestito/obtener-procesos-bp'
}

const shouldCacheResponsePayload = (payload: unknown): boolean => {
  if (payload === null || payload === undefined) return false

  if (typeof payload !== 'object') {
    return false
  }

  const obj = payload as Record<string, unknown>

  if ('success' in obj && obj.success === false) {
    return false
  }

  if ((('error' in obj) || ('detail' in obj)) && !('data' in obj)) {
    return false
  }

  return true
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

async function handleRequest(request: NextRequest, method: string) {
  const { pathname, searchParams } = request.nextUrl
  
  // Extract the path after /api/proxy/
  const apiPath = pathname.replace('/api/proxy/', '')
  const bypassCache = searchParams.get('bypass_cache') === '1'
  const isCacheableGet = method === 'GET' && isCacheableEmprestitoPath(apiPath) && !bypassCache
  const backendSearchParams = sanitizeSearchParamsForBackend(searchParams)
  const cacheKey = isCacheableGet ? buildCacheKey(apiPath, backendSearchParams) : ''
  const requestTimeout = getProxyTimeout(apiPath)

  if (isCacheableGet) {
    const cached = emprestitoProxyCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < EMPRESTITO_CACHE_TTL) {
      console.log(`💾 [CACHE HIT][${method}] ${cacheKey}`)
      return NextResponse.json(cached.data, {
        status: cached.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Proxy-Cache': 'HIT',
        },
      })
    }

    if (cached) {
      emprestitoProxyCache.delete(cacheKey)
    }
    console.log(`🕒 [CACHE MISS][${method}] ${cacheKey}`)
  }
  
  // Validate API_BASE_URL
  if (!API_BASE_URL) {
    console.error('❌ API_BASE_URL is not configured')
    return NextResponse.json({
      error: 'Configuration error',
      message: 'Backend URL not configured. Check NEXT_PUBLIC_API_BASE_URL environment variable.',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders })
  }
  
  // Construct the full FastAPI URL
  const fastApiUrl = `${API_BASE_URL}/${apiPath}${backendSearchParams.toString() ? `?${backendSearchParams.toString()}` : ''}`
  
  // Debug logging for production
  console.log(`🌐 [${method}] Proxying to: ${fastApiUrl}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV}`)
  console.log(`🔧 API_BASE_URL: ${API_BASE_URL}`)
  
  try {
    // Setup timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout)
    
    // Prepare request options
    const forwardedHeaders: Record<string, string> = {
      'Accept': request.headers.get('accept') || 'application/json',
      'Accept-Encoding': 'identity',
    }

    const incomingContentType = request.headers.get('content-type')
    if (incomingContentType && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      forwardedHeaders['Content-Type'] = incomingContentType
    }

    const incomingAuthorization = request.headers.get('authorization')
    if (incomingAuthorization) {
      forwardedHeaders['Authorization'] = incomingAuthorization
    }

    const requestOptions: RequestInit = {
      method,
      headers: forwardedHeaders,
      signal: controller.signal,
      cache: 'no-store',
    }
    
    // Add body for POST, PUT, PATCH, DELETE requests when present
    // Use arrayBuffer() to preserve binary data (e.g. multipart file uploads)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        const bodyBuffer = await request.arrayBuffer()
        if (bodyBuffer.byteLength > 0) {
          requestOptions.body = Buffer.from(bodyBuffer)
        }
      } catch (error) {
        console.warn('Failed to read request body:', error)
      }
    }
    
    console.log(`🌐 Proxying ${method} request to: ${fastApiUrl}`)
    
    const shouldRetryEmptyJson = shouldRetryOnEmptyJson(apiPath, method)
    let response: Response | null = null
    let responseData: any = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      const targetUrl = attempt === 1
        ? fastApiUrl
        : `${fastApiUrl}${fastApiUrl.includes('?') ? '&' : '?'}_proxy_retry=${Date.now()}_${attempt}`

      response = await fetch(targetUrl, requestOptions)
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const rawText = await response.text()
        const trimmed = rawText?.trim?.() || ''

        if (!trimmed) {
          if (shouldRetryEmptyJson && attempt < 3) {
            console.warn(`⚠️ Empty JSON body from backend (${apiPath}), retry ${attempt}/2`)
            continue
          }

          responseData = {
            error: 'Empty JSON response from backend',
            endpoint: apiPath,
          }
          break
        }

        try {
          responseData = JSON.parse(trimmed)
        } catch {
          try {
            responseData = JSON.parse(JSON.parse(trimmed))
          } catch (parseError) {
            if (shouldRetryEmptyJson && attempt < 3) {
              console.warn(`⚠️ Invalid JSON body from backend (${apiPath}), retry ${attempt}/2`, parseError)
              continue
            }

            responseData = {
              error: 'Invalid JSON response from backend',
              parse_error: parseError instanceof Error ? parseError.message : String(parseError),
              endpoint: apiPath,
            }
          }
        }

        // Unwrap API responses with { success: true, data: [...] } structure
        // This is specifically for unidades-proyecto endpoints, EXCEPT geometry
        if (apiPath.includes('unidades-proyecto') &&
            !apiPath.includes('geometry') &&
            responseData &&
            typeof responseData === 'object' &&
            responseData.success === true &&
            'data' in responseData) {
          console.log(`🔄 Unwrapping API response: ${Array.isArray(responseData.data) ? responseData.data.length : 'N/A'} items`)
          responseData = responseData.data
        }

        break
      }

      const rawText = await response.text()
      const trimmedText = rawText?.trim?.() || ''

      if (!trimmedText) {
        responseData = null
      } else {
        try {
          responseData = JSON.parse(trimmedText)
        } catch {
          responseData = rawText
        }
      }
      break
    }

    clearTimeout(timeoutId)

    if (!response) {
      throw new Error('No response from backend')
    }

    const normalizedApiPath = normalizeApiPath(apiPath)
    if (
      method === 'GET' &&
      normalizedApiPath === 'procesos_emprestito_all' &&
      responseData &&
      typeof responseData === 'object' &&
      (responseData as any).error === 'Empty JSON response from backend'
    ) {
      try {
        const fallbackUrl = `${API_BASE_URL}/emprestito/obtener-procesos-bp`
        console.warn('⚠️ procesos_emprestito_all vacío; intentando fallback API-only:', fallbackUrl)

        const fallbackResponse = await fetch(fallbackUrl, requestOptions)
        const fallbackRaw = await fallbackResponse.text()
        const fallbackTrimmed = fallbackRaw?.trim?.() || ''

        if (fallbackResponse.ok && fallbackTrimmed) {
          const fallbackData = JSON.parse(fallbackTrimmed)
          if (fallbackData && Array.isArray(fallbackData.data)) {
            responseData = {
              ...fallbackData,
              metadata: {
                ...(fallbackData.metadata || {}),
                proxy_source: 'emprestito/obtener-procesos-bp',
              },
            }
            console.log(`✅ Fallback API-only exitoso: ${fallbackData.data.length} procesos`)
          }
        }
      } catch (fallbackError) {
        console.warn('⚠️ Fallback API-only de procesos también falló:', fallbackError)
      }
    }
    
    // Return the response with CORS headers
    if (isCacheableGet && response.ok && shouldCacheResponsePayload(responseData)) {
      emprestitoProxyCache.set(cacheKey, {
        data: responseData,
        status: response.status,
        timestamp: Date.now(),
      })
      console.log(`✅ [CACHE STORE][${method}] ${cacheKey}`)
    }

    if (method !== 'GET' && response.ok && emprestitoProxyCache.size > 0) {
      emprestitoProxyCache.clear()
      console.log(`🧹 [CACHE CLEAR][${method}] Cache de Empréstito limpiado por mutación exitosa`)
    }

    const isExplicitNoContentStatus =
      response.status === 204 ||
      response.status === 205 ||
      response.status === 304

    const isSuccessfulEmptyBody =
      (response.status >= 200 && response.status < 300) &&
      (responseData === null || responseData === undefined)

    const shouldReturnNoContent = isExplicitNoContentStatus || isSuccessfulEmptyBody

    if (shouldReturnNoContent) {
      return new NextResponse(null, {
        status: response.status,
        headers: {
          ...corsHeaders,
          ...(isCacheableGet ? { 'X-Proxy-Cache': 'MISS' } : {}),
        },
      })
    }

    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...(isCacheableGet ? { 'X-Proxy-Cache': 'MISS' } : {}),
      },
    })
    
  } catch (error: any) {
    console.error(`❌ Proxy error for ${method} ${fastApiUrl}:`, error)
    
    let errorResponse = {
      error: 'Proxy request failed',
      message: error.message || 'Unknown error',
      backend_url: fastApiUrl,
      api_base_url: API_BASE_URL,
      environment: process.env.NODE_ENV,
      error_type: error.constructor.name,
      path: apiPath,
      timestamp: new Date().toISOString(),
    }
    
    let statusCode = 500
    
    if (error.name === 'AbortError') {
      errorResponse.error = 'Request timeout'
      errorResponse.message = 'The request to the backend timed out'
      statusCode = 408
    } else if (error.message?.includes('Failed to fetch')) {
      errorResponse.error = 'Network error'
      errorResponse.message = 'Unable to connect to the backend service'
      statusCode = 503
    }
    
    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers: corsHeaders,
    })
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT')
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE')
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH')
}