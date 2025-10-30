import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/attributes${queryString ? `?${queryString}` : ''}`;

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
    
    // Unwrap the FastAPI response structure to return direct array
    let actualData = data;
    if (data?.success === true && Array.isArray(data.data)) {
      actualData = data.data;
    }
    
    const attributesResponse = NextResponse.json(actualData);
    attributesResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    attributesResponse.headers.set('Pragma', 'no-cache');
    attributesResponse.headers.set('Expires', '0');
    attributesResponse.headers.set('X-Timestamp', Date.now().toString());
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