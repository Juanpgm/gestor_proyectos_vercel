import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const referencia = searchParams.get('referencia')

    const response = await fetch('https://gestorproyectoapi-production.up.railway.app/reportes_contratos/', {
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