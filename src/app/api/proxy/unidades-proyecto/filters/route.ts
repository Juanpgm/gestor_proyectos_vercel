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
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/filters${queryString ? `?${queryString}` : ''}`;

    console.log(`🔄 [filters] Fetching fresh data from: ${url}`);

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
    
    // Unwrap FastAPI response
    let actualData = data;
    if (data?.success === true && data.filters) {
      actualData = data.filters;
    }
    
    console.log(`✅ [filters] Loaded filter options`);
    
    const filtersResponse = NextResponse.json(actualData);
    filtersResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    filtersResponse.headers.set('Pragma', 'no-cache');
    filtersResponse.headers.set('Expires', '0');
    filtersResponse.headers.set('X-Timestamp', Date.now().toString());
    filtersResponse.headers.set('CDN-Cache-Control', 'no-cache');
    filtersResponse.headers.set('Vercel-CDN-Cache-Control', 'no-cache');
    return filtersResponse;
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch filters data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}