import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL, DEFAULT_TIMEOUT } from '@/services/api'

// CORS headers for FastAPI integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
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
  
  // Construct the full FastAPI URL
  const fastApiUrl = `${API_BASE_URL}/${apiPath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  
  try {
    // Setup timeout controller
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Forward authorization headers if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
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
        // This is specifically for unidades-proyecto endpoints
        if (apiPath.includes('unidades-proyecto') && 
            responseData && 
            typeof responseData === 'object' && 
            responseData.success === true && 
            'data' in responseData) {
          console.log(`🔄 Unwrapping API response: ${Array.isArray(responseData.data) ? responseData.data.length : 'N/A'} items`)
          responseData = responseData.data
        }
        
      } catch (error) {
        console.warn('Failed to parse JSON response:', error)
        responseData = { error: 'Invalid JSON response from backend' }
      }
    } else {
      responseData = await response.text()
    }
    
    // Return the response with CORS headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
    
  } catch (error: any) {
    console.error(`❌ Proxy error for ${method} ${fastApiUrl}:`, error)
    
    let errorResponse = {
      error: 'Proxy request failed',
      message: error.message || 'Unknown error',
      backend_url: fastApiUrl,
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