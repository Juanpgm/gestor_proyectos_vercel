/**
 * Configuración y utilidades para hacer la aplicación responsiva en tablets
 * Incluye breakpoints específicos para iPad y otras tablets
 */

import React from 'react'

export const TABLET_BREAKPOINTS = {
  // Tablet general (768px - 1024px)
  tablet: {
    min: '768px',
    max: '1024px'
  },
  // iPad específico
  ipad: {
    portrait: '(min-width: 768px) and (max-width: 1024px) and (orientation: portrait)',
    landscape: '(min-width: 768px) and (max-width: 1366px) and (orientation: landscape)'
  },
  // iPad Pro
  ipadPro: {
    portrait: '(min-width: 1024px) and (max-width: 1366px) and (orientation: portrait)',
    landscape: '(min-width: 1024px) and (max-width: 1500px) and (orientation: landscape)'
  },
  // Dispositivos táctiles
  touch: '(hover: none) and (pointer: coarse)',
  noTouch: '(hover: hover) and (pointer: fine)'
}

export const TABLET_SPACING = {
  // Espaciado base para tablets
  padding: {
    xs: '0.75rem',   // 12px
    sm: '1rem',      // 16px  
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
  },
  margin: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  },
  gap: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
  }
}

export const TABLET_TYPOGRAPHY = {
  // Escalas de tipografía optimizadas para tablets
  fontSize: {
    xs: '0.875rem',    // 14px
    sm: '1rem',        // 16px
    base: '1.125rem',  // 18px
    lg: '1.25rem',     // 20px
    xl: '1.375rem',    // 22px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
}

export const TABLET_COMPONENTS = {
  // Componentes base optimizados para tablets
  button: {
    minHeight: '44px',
    minWidth: '44px',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: TABLET_TYPOGRAPHY.fontSize.base,
    touchAction: 'manipulation'
  },
  input: {
    minHeight: '44px',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: TABLET_TYPOGRAPHY.fontSize.base,
    touchAction: 'manipulation'
  },
  card: {
    padding: TABLET_SPACING.padding.lg,
    borderRadius: '1rem',
    minHeight: '8rem',
    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  table: {
    cell: {
      padding: TABLET_SPACING.padding.md,
      fontSize: TABLET_TYPOGRAPHY.fontSize.base
    },
    header: {
      padding: TABLET_SPACING.padding.md,
      fontSize: TABLET_TYPOGRAPHY.fontSize.lg,
      fontWeight: '600'
    }
  }
}

export const TABLET_GRID = {
  // Configuraciones de grid responsivas para tablets
  responsive: {
    cols: {
      portrait: {
        xs: 1,
        sm: 2,
        md: 2,
        lg: 3
      },
      landscape: {
        xs: 2,
        sm: 3,
        md: 4,
        lg: 5
      }
    }
  },
  // Grid específico por tipo de contenido
  cards: {
    stats: {
      portrait: 'grid-cols-2',
      landscape: 'grid-cols-3 tablet-lg:grid-cols-5'
    },
    content: {
      portrait: 'grid-cols-1',
      landscape: 'grid-cols-2'
    }
  }
}

export const TABLET_INTERACTIONS = {
  // Mejoras para interacciones táctiles
  hover: {
    // En dispositivos táctiles, convertir hover a active
    touchDeviceClass: 'active:scale-95 active:bg-gray-100',
    nonTouchDeviceClass: 'hover:scale-105 hover:bg-gray-50'
  },
  tap: {
    // Feedback visual para taps
    scale: '0.98',
    duration: '100ms'
  },
  focus: {
    // Estados de focus más visibles en tablets
    ring: '3px',
    color: 'blue-500',
    opacity: '0.3'
  }
}

// Utilidades helper para componentes
export const getTabletClasses = {
  button: (variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const base = 'tablet-interactive btn-tablet touch-target'
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100'
    }
    return `${base} ${variants[variant]}`
  },
  
  card: (interactive: boolean = false) => {
    const base = 'card-tablet rounded-xl'
    const hover = interactive ? 'hover:shadow-xl hover:-translate-y-1' : ''
    return `${base} ${hover}`
  },
  
  input: () => {
    return 'input-tablet w-full border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
  },
  
  grid: (content: 'stats' | 'cards' | 'table' = 'cards') => {
    const configs = {
      stats: 'grid grid-cols-2 tablet:grid-cols-3 tablet-lg:grid-cols-5 gap-4 tablet:gap-6',
      cards: 'tablet-card-grid gap-4 tablet:gap-6',
      table: 'overflow-x-auto'
    }
    return configs[content]
  },
  
  text: (size: keyof typeof TABLET_TYPOGRAPHY.fontSize = 'base') => {
    return `tablet:text-tablet-${size}`
  },
  
  spacing: (type: 'padding' | 'margin' | 'gap' = 'padding', size: keyof typeof TABLET_SPACING.padding = 'md') => {
    const prefix = type === 'gap' ? 'gap' : type.substring(0, 1)
    return `tablet:${prefix}-tablet-${size}`
  }
}

// Hook para detectar si estamos en un dispositivo tablet
export const useTabletDetection = () => {
  const [isTablet, setIsTablet] = React.useState(false)
  const [isPortrait, setIsPortrait] = React.useState(false)
  const [isTouch, setIsTouch] = React.useState(false)
  
  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTabletSize = width >= 768 && width <= 1024
      const isPortraitMode = height > width
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      setIsTablet(isTabletSize)
      setIsPortrait(isPortraitMode)
      setIsTouch(isTouchDevice)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])
  
  return { isTablet, isPortrait, isTouch }
}

// Utilidad para clases condicionales según dispositivo
export const getResponsiveClasses = (classes: {
  mobile?: string
  tablet?: string
  tabletPortrait?: string
  tabletLandscape?: string
  desktop?: string
  touch?: string
  noTouch?: string
}) => {
  const classArray = []
  
  if (classes.mobile) classArray.push(classes.mobile)
  if (classes.tablet) classArray.push(`tablet:${classes.tablet}`)
  if (classes.tabletPortrait) classArray.push(`ipad-portrait:${classes.tabletPortrait}`)
  if (classes.tabletLandscape) classArray.push(`ipad-landscape:${classes.tabletLandscape}`)
  if (classes.desktop) classArray.push(`lg:${classes.desktop}`)
  if (classes.touch) classArray.push(`touch:${classes.touch}`)
  if (classes.noTouch) classArray.push(`no-touch:${classes.noTouch}`)
  
  return classArray.join(' ')
}

export default {
  TABLET_BREAKPOINTS,
  TABLET_SPACING,
  TABLET_TYPOGRAPHY,
  TABLET_COMPONENTS,
  TABLET_GRID,
  TABLET_INTERACTIONS,
  getTabletClasses,
  useTabletDetection,
  getResponsiveClasses
}