import { NextResponse } from 'next/server'

// Marcar esta ruta como dinámica para evitar errores de pre-renderizado
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBaseUrl}/reportes_contratos/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // No cache para obtener siempre datos frescos
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Error al obtener reportes: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error en API reportes_contratos_all:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes de contratos', data: [] },
      { status: 500 }
    )
  }
}
