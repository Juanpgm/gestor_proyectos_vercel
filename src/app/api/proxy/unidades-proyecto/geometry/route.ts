import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/geometry`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extraer y transformar los datos de geometry a formato GeoJSON
    let actualData;
    if (data?.success && data?.data && Array.isArray(data.data)) {
      actualData = {
        type: "FeatureCollection",
        features: data.data
          .filter((item: any) => item.geometry !== null)
          .map((item: any) => ({
            type: "Feature",
            geometry: item.geometry,
            properties: {
              upid: item.upid
            }
          })),
        count: data.count,
        message: data.message
      };
    } else if (data?.type === "FeatureCollection") {
      actualData = data;
    } else {
      actualData = {
        type: "FeatureCollection",
        features: [],
        message: "No geometry data available"
      };
    }
    
    return NextResponse.json(actualData);
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