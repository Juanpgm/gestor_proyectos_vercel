import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/services/api'

export const dynamic = 'force-dynamic'

/**
 * Proxy dedicado para reportes de contratos.
 * Maneja FormData (multipart) para POST con archivos de evidencia.
 * GET pasa a través del proxy genérico.
 */

// GET - Obtener reportes (proxy al backend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const queryString = searchParams.toString()
    const url = `${API_BASE_URL}/reportes_contratos/${queryString ? `?${queryString}` : ''}`

    console.log(`🌐 [GET] Proxy reportes_contratos → ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
      cache: 'no-store',
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Error proxy GET reportes_contratos:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener reportes de contratos',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// POST - Crear reporte con archivos (FormData → FormData)
export async function POST(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/reportes_contratos/`
    console.log(`🌐 [POST] Proxy reportes_contratos (FormData) → ${url}`)

    // Verificar Content-Length para detectar antes si excede el límite de Vercel
    const contentLength = request.headers.get('content-length')
    if (contentLength) {
      const sizeBytes = parseInt(contentLength, 10)
      const VERCEL_LIMIT = 4.5 * 1024 * 1024
      if (sizeBytes > VERCEL_LIMIT) {
        console.warn(`⚠️ Request body (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) excede el límite de Vercel (4.5 MB). ` +
          `El frontend debería usar subida directa al backend para archivos grandes.`)
      }
    }

    // Leer el FormData del request entrante
    const incomingFormData = await request.formData()

    // Crear nuevo FormData para reenviar al backend
    const outgoingFormData = new FormData()

    // Copiar todos los campos del form data
    Array.from(incomingFormData.entries()).forEach(([key, value]) => {
      if (value instanceof File) {
        outgoingFormData.append(key, value, value.name)
      } else {
        outgoingFormData.append(key, value)
      }
    })

    // Log de campos enviados (sin archivos)
    const fields: string[] = []
    Array.from(outgoingFormData.entries()).forEach(([key, value]) => {
      if (!(value instanceof File)) {
        fields.push(`${key}=${value}`)
      } else {
        fields.push(`${key}=[File: ${(value as File).name}]`)
      }
    })
    console.log('📋 Campos FormData:', fields.join(', '))

    // Enviar al backend (NO usar Content-Type header, fetch lo pondrá automáticamente para FormData)
    const response = await fetch(url, {
      method: 'POST',
      body: outgoingFormData,
      // No incluir Content-Type header - fetch lo genera con boundary automáticamente
      headers: {
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Backend error:', data)
      return NextResponse.json({
        success: false,
        error: data.detail || data.error || 'Error del backend al crear reporte',
        data
      }, { status: response.status })
    }

    console.log('✅ Reporte de contrato creado exitosamente')
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('❌ Error proxy POST reportes_contratos:', error)
    const message = error instanceof Error ? error.message : 'Error desconocido'
    // Detectar si el error es por tamaño de payload (Vercel limit)
    const isPayloadError = message.includes('body') || message.includes('size') || message.includes('limit') || message.includes('too large')
    return NextResponse.json({
      success: false,
      error: isPayloadError
        ? 'El archivo es demasiado grande para el proxy. Intente con un archivo menor a 4 MB o contacte al administrador.'
        : 'Error al crear reporte de contrato',
      message
    }, { status: isPayloadError ? 413 : 500 })
  }
}
