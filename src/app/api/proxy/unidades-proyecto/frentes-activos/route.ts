import { NextRequest, NextResponse } from 'next/server';

// Marcar esta ruta como dinámica y sin cache
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Agregar timestamp único para evitar cache
    searchParams.set('_nocache', Date.now().toString());
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/frentes-activos${queryString ? `?${queryString}` : ''}`;

    console.log(`🏗️ [frentes-activos] Fetching from: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Timestamp': Date.now().toString(),
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ [frentes-activos] Loaded: ${data.properties?.total_frentes_activos || 0} frentes activos`);
    
    const frentesResponse = NextResponse.json(data);
    frentesResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    frentesResponse.headers.set('Pragma', 'no-cache');
    frentesResponse.headers.set('Expires', '0');
    
    return frentesResponse;
  } catch (error) {
    console.error('❌ [frentes-activos] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch frentes activos',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
