import { promises as fs } from 'fs'
import path from 'path'

// Server-side data loader - GeoJSON files removed
export async function getStaticMapData() {
  console.log('📂 SERVER: GeoJSON files eliminated, returning empty data')
  
  // Return empty data since GeoJSON files no longer exist
  return {
    equipamientos: { features: [] },
    infraestructura_vial: { features: [] },
    stats: { equipamientos: 0, infraestructura: 0, total: 0 }
  }
}
