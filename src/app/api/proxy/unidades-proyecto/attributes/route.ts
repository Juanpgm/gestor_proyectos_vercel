import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/attributes${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[PROXY] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Cache por 1 minuto
    });

    console.log(`[PROXY] Response status: ${response.status}`);
    console.log(`[PROXY] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Error response: ${errorText}`);
      throw new Error(`FastAPI responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[PROXY ATTRIBUTES] Data received:`, data?.success ? 'Has success wrapper' : 'Direct data');
    console.log(`[PROXY ATTRIBUTES] Count:`, data?.count, 'Total:', data?.total_before_limit);
    
    // Extraer los datos reales desde la nueva estructura de respuesta
    let actualData;
    if (data?.success && data?.data) {
      // Nueva estructura: envolver en el formato esperado por el frontend
      actualData = {
        success: data.success,
        data: data.data,
        count: data.count,
        total_before_limit: data.total_before_limit,
        pagination: data.pagination,
        message: data.message
      };
    } else {
      // Fallback para estructura antigua
      actualData = data;
    }
    
    console.log(`[PROXY ATTRIBUTES] Final data:`, actualData?.data ? `${actualData.data.length} features` : typeof actualData);
    
    return NextResponse.json(actualData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('[PROXY] Error fetching attributes data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch attributes data',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: `${FASTAPI_BASE_URL}/unidades-proyecto/attributes`
      },
      { status: 500 }
    );
  }
}