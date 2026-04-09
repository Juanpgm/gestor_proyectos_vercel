import { NextResponse } from 'next/server'

// Marcar esta ruta como dinámica para evitar errores de pre-renderizado
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const referencia = searchParams.get('referencia')

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || ''
    const response = await fetch(`${apiBaseUrl}/reportes_contratos/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Error al obtener reportes: ${response.status}`)
    }

    const data = await response.json()

    let filteredData = data.data || []

    if (referencia) {
      filteredData = filteredData.filter((reporte: any) =>
        reporte.referencia_contrato === referencia
      )
    }

    return NextResponse.json({
      success: true,
      total_reportes: data.data?.length || 0,
      referencias_unicas: Array.from(new Set((data.data || []).map((r: any) => r.referencia_contrato))),
      referencia_buscada: referencia,
      reportes_encontrados: filteredData.length,
      data: filteredData
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error en API test reportes:', error)
    return NextResponse.json(
      { error: 'Error al obtener reportes de contratos' },
      { status: 500 }
    )
  }
}