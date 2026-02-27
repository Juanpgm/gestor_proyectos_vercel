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
    path === 'asignaciones-emprestito-banco-centro-gestor'
  ) {
    return true
  }

  return (
    path.startsWith('emprestito/proceso/') ||
    path.startsWith('contratos_emprestito/referencia/') ||
    path.startsWith('contratos_emprestito/centro-gestor/') ||
    path.startsWith('ordenes_compra_emprestito/numero/') ||
    path.startsWith('ordenes_compra_emprestito/centro-gestor/')
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
    path === 'emprestito/ordenes-compra'
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

const shouldCacheResponsePayload = (payload: unknown): boolean => {
  if (payload === null || payload === undefined) return false

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>

    if ('success' in obj && obj.success === false) {
      return false
    }

    if ((('error' in obj) || ('detail' in obj)) && !('data' in obj)) {
      return false
    }
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
    }

    const incomingContentType = request.headers.get('content-type')
    if (incomingContentType && ['POST', 'PUT', 'PATCH'].includes(method)) {
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
    
    // Add body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text()
        if (body) {
          requestOptions.body = body
        }
      } catch (error) {
        console.warn('Failed to read request body:', error)
      }
    }
    
    console.log(`🌐 Proxying ${method} request to: ${fastApiUrl}`)
    
    // Make the request to FastAPI
    const response = await fetch(fastApiUrl, requestOptions)
    
    clearTimeout(timeoutId)
    
    // Get response data
    let responseData
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      try {
        responseData = await response.json()
        
        // Unwrap API responses with { success: true, data: [...] } structure
        // This is specifically for unidades-proyecto endpoints, EXCEPT geometry
        if (apiPath.includes('unidades-proyecto') && 
            !apiPath.includes('geometry') && // Geometry returns GeoJSON directly
            responseData && 
            typeof responseData === 'object' && 
            responseData.success === true && 
            'data' in responseData) {
          console.log(`🔄 Unwrapping API response: ${Array.isArray(responseData.data) ? responseData.data.length : 'N/A'} items`)
          responseData = responseData.data
        }
        
      } catch (error) {
        console.warn('Failed to parse JSON response:', error)
        responseData = {
          error: 'Invalid JSON response from backend',
          parse_error: error instanceof Error ? error.message : String(error),
          endpoint: apiPath,
        }
      }
    } else {
      const rawText = await response.text()
      try {
        responseData = JSON.parse(rawText)
      } catch {
        responseData = rawText
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