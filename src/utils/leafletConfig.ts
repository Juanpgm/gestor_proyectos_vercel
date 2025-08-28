// Importaciones de iconos de Leaflet
import L from 'leaflet'

// Configurar iconos por defecto de Leaflet para evitar errores 404
delete (L.Icon.Default.prototype as any)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export const configureLeafletIcons = () => {
  // Esta función se ejecuta para asegurar que los iconos estén configurados
  console.log('✅ Iconos de Leaflet configurados')
}
