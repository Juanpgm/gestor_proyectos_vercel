import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/services/api'

// Marcar esta ruta como dinámica
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Test connection to FastAPI backend
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store'
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `FastAPI backend returned ${response.status}`,
          backend_url: API_BASE_URL
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      status: 'ok',
      message: 'Next.js API and FastAPI backend connection successful',
      backend_url: API_BASE_URL,
      backend_response: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Health check failed:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          status: 'timeout', 
          message: 'Connection to FastAPI backend timed out',
          backend_url: API_BASE_URL
        },
        { status: 408 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Failed to connect to FastAPI backend',
        backend_url: API_BASE_URL,
        error_type: error.name || 'Unknown'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Health check endpoint only supports GET requests' },
    { status: 405 }
  )
}