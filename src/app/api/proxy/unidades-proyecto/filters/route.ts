import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/filters${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[PROXY FILTERS] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache por 5 minutos (filtros no cambian tan seguido)
    });

    console.log(`[PROXY FILTERS] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY FILTERS] Error response: ${errorText}`);
      throw new Error(`FastAPI responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[PROXY FILTERS] Data received:`, data?.success ? 'Has success wrapper' : 'Direct data');
    console.log(`[PROXY FILTERS] Filters structure:`, data?.filters ? Object.keys(data.filters).join(', ') : 'No filters');
    
    // Extraer los datos reales si vienen envueltos en success/filters
    const actualData = data?.success && data?.filters ? data.filters : data;
    console.log(`[PROXY FILTERS] Actual data keys:`, typeof actualData === 'object' ? Object.keys(actualData).join(', ') : typeof actualData);
    
    return NextResponse.json(actualData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[PROXY FILTERS] Error fetching filters data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch filters data',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: `${FASTAPI_BASE_URL}/unidades-proyecto/filters`
      },
      { status: 500 }
    );
  }
}