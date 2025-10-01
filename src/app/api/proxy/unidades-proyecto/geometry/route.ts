import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const url = `${FASTAPI_BASE_URL}/unidades-proyecto/geometry`;
    console.log(`[PROXY GEOMETRY] Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 } // Cache por 5 minutos (geometry cambia menos)
    });

    console.log(`[PROXY GEOMETRY] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY GEOMETRY] Error response: ${errorText}`);
      throw new Error(`FastAPI responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[PROXY GEOMETRY] Data received:`, data?.type, data?.features?.length ? `${data.features.length} features` : 'No features');
    console.log(`[PROXY GEOMETRY] Data structure:`, data?.success ? 'Has success wrapper' : 'Direct data');
    
    // Extraer y transformar los datos de geometry a formato GeoJSON
    let actualData;
    if (data?.success && data?.data) {
      // Transformar al formato GeoJSON esperado
      actualData = {
        type: "FeatureCollection",
        features: data.data.map((item: any) => ({
          type: "Feature",
          geometry: item.geometry,
          properties: {
            upid: item.upid
          }
        }))
      };
      console.log(`[PROXY GEOMETRY] Transformed to GeoJSON:`, actualData.features.length, 'features');
    } else {
      actualData = data;
      console.log(`[PROXY GEOMETRY] Using raw data:`, typeof actualData);
    }
    
    return NextResponse.json(actualData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[PROXY GEOMETRY] Error fetching geometry data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch geometry data',
        message: error instanceof Error ? error.message : 'Unknown error',
        url: `${FASTAPI_BASE_URL}/unidades-proyecto/geometry`
      },
      { status: 500 }
    );
  }
}