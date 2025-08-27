'use client'

import L from 'leaflet'

// Función para crear un icono personalizado con emoji
export const createCustomIcon = (
  emoji: string = '📍', 
  size: number = 30,
  backgroundColor: string = '#3B82F6'
) => {
  const iconHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background: ${backgroundColor};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-size: ${size * 0.5}px;
      line-height: 1;
    ">
      ${emoji}
    </div>
  `

  return L.divIcon({
    html: iconHTML,
    className: 'custom-emoji-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

// Función para crear un marcador de categoría con color
export const createCategoryIcon = (
  color: string = '#3B82F6',
  category: string = '',
  size: number = 20
) => {
  const iconHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      font-size: ${size * 0.3}px;
      color: white;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    ">
      ${category.charAt(0).toUpperCase()}
    </div>
  `

  return L.divIcon({
    html: iconHTML,
    className: 'custom-category-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

// Función para crear un marcador de rango con gradiente
export const createRangeIcon = (
  color: string = '#3B82F6',
  value: number,
  range: { min: number, max: number },
  size: number = 20
) => {
  // Calcular la intensidad basada en el valor dentro del rango
  const intensity = (value - range.min) / (range.max - range.min)
  const opacity = 0.3 + (intensity * 0.7) // Entre 0.3 y 1.0
  
  const iconHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      opacity: ${opacity};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      font-size: ${size * 0.25}px;
      color: white;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    ">
      ${Math.round(value)}
    </div>
  `

  return L.divIcon({
    html: iconHTML,
    className: 'custom-range-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

// Función para crear marcadores con formas personalizadas
export const createShapeIcon = (
  shape: 'circle' | 'square' | 'triangle' | 'star' = 'circle',
  color: string = '#3B82F6',
  size: number = 16,
  strokeColor: string = '#FFFFFF',
  strokeWidth: number = 2
) => {
  let shapeHTML = ''
  
  switch (shape) {
    case 'circle':
      shapeHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: ${strokeWidth}px solid ${strokeColor};
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `
      break
      
    case 'square':
      shapeHTML = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: ${strokeWidth}px solid ${strokeColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>
      `
      break
      
    case 'triangle':
      shapeHTML = `
        <div style="
          width: 0;
          height: 0;
          border-left: ${size/2}px solid transparent;
          border-right: ${size/2}px solid transparent;
          border-bottom: ${size}px solid ${color};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          position: relative;
        ">
          <div style="
            position: absolute;
            top: ${strokeWidth}px;
            left: -${(size/2) - strokeWidth}px;
            width: 0;
            height: 0;
            border-left: ${(size/2) - strokeWidth}px solid transparent;
            border-right: ${(size/2) - strokeWidth}px solid transparent;
            border-bottom: ${size - (strokeWidth * 2)}px solid ${strokeColor};
          "></div>
        </div>
      `
      break
      
    case 'star':
      const starSize = size * 0.8
      shapeHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" 
                fill="${color}" 
                stroke="${strokeColor}" 
                stroke-width="${strokeWidth}"/>
        </svg>
      `
      break
  }

  const iconHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size + 4}px;
      height: ${size + 4}px;
    ">
      ${shapeHTML}
    </div>
  `

  return L.divIcon({
    html: iconHTML,
    className: `custom-shape-icon custom-shape-${shape}`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [(size + 4) / 2, (size + 4) / 2],
    popupAnchor: [0, -(size + 4) / 2]
  })
}
