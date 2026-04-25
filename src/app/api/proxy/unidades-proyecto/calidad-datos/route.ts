import { NextResponse } from 'next/server'
import { API_BASE_URL, DEFAULT_TIMEOUT } from '@/services/api'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function GET(request: Request) {
  if (!API_BASE_URL) {
    return NextResponse.json(
      {
        error: 'Configuration error',
        message: 'Backend URL not configured',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    )
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), Math.max(DEFAULT_TIMEOUT, 90000))

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()
    const url = `${API_BASE_URL}/unidades-proyecto/calidad-datos${query ? `?${query}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    })

    const contentType = response.headers.get('content-type') || ''
    const rawText = await response.text()

    let payload: unknown = null
    if (rawText?.trim()) {
      if (contentType.includes('application/json')) {
        try {
          payload = JSON.parse(rawText)
        } catch {
          payload = { raw: rawText }
        }
      } else {
        payload = { raw: rawText }
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Error ${response.status}: ${response.statusText}`,
          details: payload,
        },
        {
          status: response.status,
          headers: corsHeaders,
        }
      )
    }

    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
  } catch (error: any) {
    const statusCode = error?.name === 'AbortError' ? 408 : 500
    return NextResponse.json(
      {
        error: statusCode === 408 ? 'Request timeout' : 'Proxy request failed',
        message: error?.message || 'Unknown error',
        backend_url: `${API_BASE_URL}/unidades-proyecto/calidad-datos`,
      },
      {
        status: statusCode,
        headers: corsHeaders,
      }
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
