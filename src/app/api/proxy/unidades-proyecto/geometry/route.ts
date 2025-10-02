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
    console.log(`[PROXY GEOMETRY] Data received:`, data?.success ? 'Has success wrapper' : 'Direct data');
    console.log(`[PROXY GEOMETRY] Count:`, data?.count, 'Message:', data?.message);
    
    // Extraer y transformar los datos de geometry a formato GeoJSON
    let actualData;
    if (data?.success && data?.data && Array.isArray(data.data)) {
      // Nueva estructura: transformar al formato GeoJSON esperado
      actualData = {
        type: "FeatureCollection",
        features: data.data
          .filter((item: any) => item.geometry !== null) // Filtrar items sin geometría
          .map((item: any) => ({
            type: "Feature",
            geometry: item.geometry,
            properties: {
              upid: item.upid
            }
          })),
        count: data.count,
        message: data.message,
        timestamp: data.timestamp
      };
      console.log(`[PROXY GEOMETRY] Transformed to GeoJSON:`, actualData.features.length, 'valid features of', data.count, 'total');
    } else if (data?.type === "FeatureCollection") {
      // Ya es GeoJSON válido
      actualData = data;
      console.log(`[PROXY GEOMETRY] Already GeoJSON:`, data.features?.length, 'features');
    } else {
      // Fallback
      actualData = {
        type: "FeatureCollection",
        features: [],
        message: "No geometry data available"
      };
      console.log(`[PROXY GEOMETRY] Fallback: empty FeatureCollection`);
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