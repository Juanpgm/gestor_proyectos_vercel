import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/services/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const url = `${API_BASE_URL}/registrar_avance_up`
    const incomingFormData = await request.formData()
    const outgoingFormData = new FormData()

    Array.from(incomingFormData.entries()).forEach(([key, value]) => {
      if (value instanceof File) {
        outgoingFormData.append(key, value, value.name)
      } else {
        outgoingFormData.append(key, value)
      }
    })

    const response = await fetch(url, {
      method: 'POST',
      body: outgoingFormData,
      headers: {
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!
        })
      },
      cache: 'no-store'
    })

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }

    const text = await response.text()
    return NextResponse.json({ message: text }, { status: response.status })
  } catch (error) {
    console.error('❌ Error proxy POST registrar_avance_up:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al registrar avance de UP',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}