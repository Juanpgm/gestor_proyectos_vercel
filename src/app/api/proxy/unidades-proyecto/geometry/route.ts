import { NextRequest, NextResponse } from 'next/server';

// Marcar esta ruta como dinámica
export const dynamic = 'force-dynamic'

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/geometry`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'NextJS-Proxy/1.0',
        'X-Timestamp': Date.now().toString(),
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // API now returns direct GeoJSON FeatureCollection
    if (data?.type === "FeatureCollection") {
      const geoResponse = NextResponse.json(data);
      geoResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      geoResponse.headers.set('Pragma', 'no-cache');
      geoResponse.headers.set('Expires', '0');
      geoResponse.headers.set('X-Timestamp', Date.now().toString());
      return geoResponse;
    }
    
    // Legacy handling for old wrapper format (if still used)
    if (data?.success === true && data.data) {
      const actualData = {
        type: "FeatureCollection",
        features: Array.isArray(data.data) 
          ? data.data.filter((item: any) => item.geometry !== null)
              .map((item: any) => ({
                type: "Feature",
                geometry: item.geometry,
                properties: { upid: item.upid }
              }))
          : []
      };
      const legacyResponse = NextResponse.json(actualData);
      legacyResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      legacyResponse.headers.set('Pragma', 'no-cache');
      legacyResponse.headers.set('Expires', '0');
      return legacyResponse;
    }
    
    // Fallback for unexpected format
    const fallbackResponse = NextResponse.json({
      type: "FeatureCollection",
      features: [],
      message: "No geometry data available"
    });
    fallbackResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    fallbackResponse.headers.set('Pragma', 'no-cache');
    fallbackResponse.headers.set('Expires', '0');
    return fallbackResponse;
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch geometry data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}