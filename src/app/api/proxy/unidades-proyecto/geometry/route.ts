import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/geometry`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'NextJS-Proxy/1.0',
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // API now returns direct GeoJSON FeatureCollection
    if (data?.type === "FeatureCollection") {
      return NextResponse.json(data);
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
      return NextResponse.json(actualData);
    }
    
    // Fallback for unexpected format
    return NextResponse.json({
      type: "FeatureCollection",
      features: [],
      message: "No geometry data available"
    });
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