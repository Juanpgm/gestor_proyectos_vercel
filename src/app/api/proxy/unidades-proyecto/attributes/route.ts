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
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/attributes${queryString ? `?${queryString}` : ''}`;

    console.log(`🔄 [attributes] Fetching fresh data from: ${url}`);

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
    
    // Unwrap the FastAPI response structure to return direct array
    let actualData = data;
    if (data?.success === true && Array.isArray(data.data)) {
      actualData = data.data;
    }
    
    console.log(`✅ [attributes] Loaded ${Array.isArray(actualData) ? actualData.length : 0} records`);
    
    const attributesResponse = NextResponse.json(actualData);
    attributesResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    attributesResponse.headers.set('Pragma', 'no-cache');
    attributesResponse.headers.set('Expires', '0');
    attributesResponse.headers.set('X-Timestamp', Date.now().toString());
    attributesResponse.headers.set('CDN-Cache-Control', 'no-cache');
    attributesResponse.headers.set('Vercel-CDN-Cache-Control', 'no-cache');
    return attributesResponse;
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch attributes data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}