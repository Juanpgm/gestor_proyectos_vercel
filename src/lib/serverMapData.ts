import { promises as fs } from 'fs'
import path from 'path'

// Server-side data loader que funciona sin hidratación
export async function getStaticMapData() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    
    // Leer los archivos GeoJSON del servidor
    const equipamientosPath = path.join(publicDir, 'data', 'unidades_proyecto', 'equipamientos.geojson')
    const infraPath = path.join(publicDir, 'data', 'unidades_proyecto', 'infraestructura_vial.geojson')
    
    const equipamientosData = await fs.readFile(equipamientosPath, 'utf8')
    const infraData = await fs.readFile(infraPath, 'utf8')
    
    const equipamientosJson = JSON.parse(equipamientosData)
    const infraJson = JSON.parse(infraData)
    
    return {
      equipamientos: equipamientosJson,
      infraestructura_vial: infraJson,
      stats: {
        equipamientos: equipamientosJson.features?.length || 0,
        infraestructura: infraJson.features?.length || 0,
        total: (equipamientosJson.features?.length || 0) + (infraJson.features?.length || 0)
      }
    }
  } catch (error) {
    console.error('Error loading map data:', error)
    return {
      equipamientos: { features: [] },
      infraestructura_vial: { features: [] },
      stats: { equipamientos: 0, infraestructura: 0, total: 0 }
    }
  }
}
