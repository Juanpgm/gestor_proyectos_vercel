import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/dashboard${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[PROXY DASHBOARD] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 120 } // Cache por 2 minutos (dashboard necesita datos más frescos)
    });

    console.log(`[PROXY DASHBOARD] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY DASHBOARD] Error response: ${errorText}`);
      throw new Error(`FastAPI responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[PROXY DASHBOARD] Data received:`, data?.success ? 'Has success wrapper' : 'Direct data');
    console.log(`[PROXY DASHBOARD] Dashboard sections:`, data?.dashboard ? Object.keys(data.dashboard).join(', ') : 'No dashboard');
    console.log(`[PROXY DASHBOARD] Message:`, data?.message);
    
    // Extraer los datos reales desde la nueva estructura de respuesta
    let actualData;
    if (data?.success && data?.dashboard) {
      // Nueva estructura: mantener metadatos importantes
      actualData = {
        success: data.success,
        dashboard: data.dashboard,
        message: data.message,
        timestamp: data.timestamp,
        last_updated: data.last_updated
      };
    } else {
      // Fallback para estructura antigua
      actualData = data;
    }
    
    console.log(`[PROXY DASHBOARD] Final dashboard sections:`, actualData?.dashboard ? Object.keys(actualData.dashboard).join(', ') : 'No dashboard');
    
    return NextResponse.json(actualData, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('[PROXY DASHBOARD] Error fetching dashboard data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: `${FASTAPI_BASE_URL}/unidades-proyecto/dashboard`
      },
      { status: 500 }
    );
  }
}