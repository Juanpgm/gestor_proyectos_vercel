/**
 * Utility para parsear geometrías de Firebase a GeoJSON estándar
 * Maneja tanto arrays (Point) como JSON strings (LineString, Polygon, etc.)
 */

export interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection';
  coordinates: any;
}

export interface ParsedGeometry extends GeoJSONGeometry {
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

/**
 * Parse geometry from Firebase format to standard GeoJSON
 * Handles both array (Point) and JSON string (LineString, Polygon, etc.)
 */
export function parseGeometry(geometry: any): ParsedGeometry | null {
  if (!geometry || !geometry.type) {
    console.warn('parseGeometry: Invalid geometry object', geometry);
    return null;
  }

  let coordinates = geometry.coordinates;

  // Si coordinates es string, parsear JSON
  if (typeof coordinates === 'string') {
    try {
      coordinates = JSON.parse(coordinates);
    } catch (e) {
      console.error('Error parsing geometry coordinates:', e, 'Original:', coordinates);
      return null;
    }
  }

  // Validar que coordinates sea array
  if (!Array.isArray(coordinates)) {
    console.error('Invalid coordinates format:', typeof coordinates);
    return null;
  }

  return {
    type: geometry.type,
    coordinates: coordinates
  };
}

/**
 * Calculate center point from any geometry type
 */
export function getGeometryCenter(geometry: ParsedGeometry): [number, number] | null {
  try {
    switch (geometry.type) {
      case 'Point':
        return geometry.coordinates as [number, number];
      
      case 'LineString': {
        const lineCoords = geometry.coordinates as number[][];
        if (lineCoords.length === 0) return null;
        const midIndex = Math.floor(lineCoords.length / 2);
        return lineCoords[midIndex] as [number, number];
      }
      
      case 'Polygon': {
        const polyCoords = (geometry.coordinates as number[][][])[0];
        if (!polyCoords || polyCoords.length === 0) return null;
        const polyMidIndex = Math.floor(polyCoords.length / 2);
        return polyCoords[polyMidIndex] as [number, number];
      }
      
      case 'MultiPoint': {
        const multiPoints = geometry.coordinates as number[][];
        if (multiPoints.length === 0) return null;
        return multiPoints[0] as [number, number];
      }
      
      case 'MultiLineString': {
        const multiLines = geometry.coordinates as number[][][];
        if (multiLines.length === 0 || multiLines[0].length === 0) return null;
        const firstLine = multiLines[0];
        const multiMidIndex = Math.floor(firstLine.length / 2);
        return firstLine[multiMidIndex] as [number, number];
      }
      
      case 'MultiPolygon': {
        const multiPolys = geometry.coordinates as number[][][][];
        if (multiPolys.length === 0 || multiPolys[0].length === 0 || multiPolys[0][0].length === 0) return null;
        const firstPoly = multiPolys[0][0];
        const multiPolyMidIndex = Math.floor(firstPoly.length / 2);
        return firstPoly[multiPolyMidIndex] as [number, number];
      }
      
      default:
        console.warn('Unknown geometry type:', geometry.type);
        return null;
    }
  } catch (e) {
    console.error('Error calculating geometry center:', e, 'Geometry:', geometry);
    return null;
  }
}

/**
 * Create GeoJSON Feature from Firebase document
 */
export function createGeoJSONFeature(doc: any) {
  const parsedGeometry = parseGeometry(doc.geometry);
  
  if (!parsedGeometry) {
    return null;
  }

  return {
    type: 'Feature' as const,
    geometry: parsedGeometry,
    properties: {
      upid: doc.upid,
      nombre_up: doc.nombre_up,
      nombre_up_detalle: doc.nombre_up_detalle,
      identificador: doc.identificador,
      estado: doc.estado,
      tipo_intervencion: doc.tipo_intervencion,
      tipo_equipamiento: doc.tipo_equipamiento,
      nombre_centro_gestor: doc.nombre_centro_gestor,
      comuna_corregimiento: doc.comuna_corregimiento,
      barrio_vereda: doc.barrio_vereda,
      presupuesto_base: doc.presupuesto_base,
      avance_obra: doc.avance_obra,
      fecha_inicio: doc.fecha_inicio,
      fecha_fin: doc.fecha_fin,
      descripcion_intervencion: doc.descripcion_intervencion,
      fuente_financiacion: doc.fuente_financiacion,
      ano: doc.ano,
      geometry_type: doc.geometry_type,
      has_geometry: doc.has_geometry
    }
  };
}

/**
 * Parse an array of documents to GeoJSON FeatureCollection
 */
export function createGeoJSONFeatureCollection(docs: any[]): GeoJSON.FeatureCollection {
  const parsedFeatures = docs
    .map(doc => createGeoJSONFeature(doc))
    .filter(feature => feature !== null);

  console.log(`✅ Parsed ${parsedFeatures.length} features from ${docs.length} documents`);

  // Convertir a formato GeoJSON estándar
  const features: GeoJSON.Feature[] = parsedFeatures.map(f => ({
    type: 'Feature' as const,
    geometry: f!.geometry as any,
    properties: f!.properties
  }));

  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Validate if a geometry has valid coordinates
 */
export function hasValidGeometry(geometry: any): boolean {
  if (!geometry || !geometry.type) return false;
  
  const parsed = parseGeometry(geometry);
  return parsed !== null;
}

/**
 * Get bounds from a FeatureCollection
 */
export function getBounds(features: GeoJSON.Feature[]): [[number, number], [number, number]] | null {
  if (features.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates as [number, number];
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    } else if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates as number[][];
      coords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      });
    }
    // Agregar más tipos según necesidad
  });

  if (!isFinite(minLng)) return null;

  return [[minLng, minLat], [maxLng, maxLat]];
}
