import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/filters${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
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
    
    const filtersResponse = NextResponse.json(actualData);
    filtersResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    filtersResponse.headers.set('Pragma', 'no-cache');
    filtersResponse.headers.set('Expires', '0');
    filtersResponse.headers.set('X-Timestamp', Date.now().toString());
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