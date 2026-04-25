/**
 * Design Tokens — CaliTrack Design System
 *
 * FUENTE ÚNICA DE VERDAD para todos los valores visuales del proyecto.
 * No uses valores hardcoded en los componentes — importa desde aquí.
 *
 * Uso:
 *   import { tokens } from '@/theme'
 *   const color = tokens.colors.brand.primary   // '#2563eb'
 */

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────
export const colors = {
  // Brand — identidad de CaliTrack (azul institucional)
  brand: {
    50:      '#eff6ff',
    100:     '#dbeafe',
    200:     '#bfdbfe',
    300:     '#93c5fd',
    400:     '#60a5fa',
    500:     '#3b82f6',
    primary: '#2563eb',  // blue-600 — color principal
    700:     '#1d4ed8',
    800:     '#1e40af',
    900:     '#1e3a8a',
  },

  // Semánticos — estados y feedback
  semantic: {
    success: {
      light:   '#d1fae5',
      default: '#059669',  // emerald-600
      dark:    '#065f46',
    },
    warning: {
      light:   '#fef3c7',
      default: '#d97706',  // amber-600
      dark:    '#92400e',
    },
    error: {
      light:   '#fee2e2',
      default: '#dc2626',  // red-600
      dark:    '#991b1b',
    },
    info: {
      light:   '#dbeafe',
      default: '#2563eb',  // blue-600
      dark:    '#1e40af',
    },
  },

  // Dominios de la app (alineados con design-system.ts existente)
  domain: {
    projects: {
      bg:      '#eff6ff',
      light:   '#dbeafe',
      mid:     '#60a5fa',
      default: '#2563eb',
      dark:    '#1e3a8a',
    },
    activities: {
      bg:      '#fef2f2',
      light:   '#fee2e2',
      mid:     '#f87171',
      default: '#dc2626',
      dark:    '#7f1d1d',
    },
    products: {
      bg:      '#fff7ed',
      light:   '#fed7aa',
      mid:     '#fb923c',
      default: '#ea580c',
      dark:    '#7c2d12',
    },
    contracts: {
      bg:      '#f5f3ff',
      light:   '#ede9fe',
      mid:     '#a78bfa',
      default: '#7c3aed',
      dark:    '#4c1d95',
    },
    units: {
      bg:      '#ecfdf5',
      light:   '#d1fae5',
      mid:     '#34d399',
      default: '#059669',
      dark:    '#064e3b',
    },
    emprestito: {
      bg:      '#f0fdfa',
      light:   '#ccfbf1',
      mid:     '#2dd4bf',
      default: '#0d9488',
      dark:    '#134e4a',
    },
    procesos: {
      bg:      '#fff1f2',
      light:   '#ffe4e6',
      mid:     '#fb7185',
      default: '#e11d48',
      dark:    '#881337',
    },
  },

  // Superficie / Neutrales
  neutral: {
    0:   '#ffffff',
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Dark mode surface
  surface: {
    light: {
      background: '#f9fafb',  // gray-50
      card:       '#ffffff',
      border:     '#e5e7eb',  // gray-200
      subtle:     '#f3f4f6',  // gray-100
    },
    dark: {
      background: '#111827',  // gray-900
      card:       '#1f2937',  // gray-800
      border:     '#374151',  // gray-700
      subtle:     '#1f2937',  // gray-800
    },
  },
} as const

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────
export const typography = {
  fontFamily: {
    display: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    body:    "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    mono:    "'JetBrains Mono', 'Courier New', monospace",
  },
  fontSize: {
    xs:   '0.75rem',    // 12px
    sm:   '0.875rem',   // 14px
    base: '1rem',       // 16px
    lg:   '1.125rem',   // 18px
    xl:   '1.25rem',    // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  fontWeight: {
    light:     '300',
    normal:    '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },
  lineHeight: {
    tight:   '1.25',
    snug:    '1.375',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight:   '-0.025em',
    normal:  '0em',
    wide:    '0.025em',
    wider:   '0.05em',
  },
} as const

// ─────────────────────────────────────────────
// SPACING (escala 4px base)
// ─────────────────────────────────────────────
export const spacing = {
  px:  '1px',
  0:   '0rem',
  0.5: '0.125rem',  // 2px
  1:   '0.25rem',   // 4px
  1.5: '0.375rem',  // 6px
  2:   '0.5rem',    // 8px
  2.5: '0.625rem',  // 10px
  3:   '0.75rem',   // 12px
  3.5: '0.875rem',  // 14px
  4:   '1rem',      // 16px
  5:   '1.25rem',   // 20px
  6:   '1.5rem',    // 24px
  7:   '1.75rem',   // 28px
  8:   '2rem',      // 32px
  9:   '2.25rem',   // 36px
  10:  '2.5rem',    // 40px
  12:  '3rem',      // 48px
  14:  '3.5rem',    // 56px
  16:  '4rem',      // 64px
  20:  '5rem',      // 80px
  24:  '6rem',      // 96px
  32:  '8rem',      // 128px
  // Semánticos
  touchTarget: '44px',  // mínimo recomendado para touch
  sidebarWidth: '16rem',
  headerHeight: '3.5rem',
  mobileNavHeight: '4rem',
} as const

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────
export const radii = {
  none:  '0px',
  xs:    '0.125rem',  // 2px
  sm:    '0.25rem',   // 4px
  md:    '0.375rem',  // 6px
  lg:    '0.5rem',    // 8px
  xl:    '0.75rem',   // 12px
  '2xl': '1rem',      // 16px
  '3xl': '1.5rem',    // 24px
  full:  '9999px',
} as const

// ─────────────────────────────────────────────
// SHADOWS
// ─────────────────────────────────────────────
export const shadows = {
  none:  'none',
  xs:    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm:    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md:    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Coloreadas (glow por dominio)
  brand:   '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
  success: '0 4px 14px 0 rgba(5, 150, 105, 0.25)',
  warning: '0 4px 14px 0 rgba(217, 119, 6, 0.25)',
  error:   '0 4px 14px 0 rgba(220, 38, 38, 0.25)',
} as const

// ─────────────────────────────────────────────
// Z-INDEX (semántico, no números mágicos)
// ─────────────────────────────────────────────
export const zIndex = {
  hide:        -1,
  base:         0,
  raised:       1,
  dropdown:   200,
  sticky:     300,
  overlay:    400,
  modal:      500,
  popover:    600,
  toast:      700,
  tooltip:    800,
  mobileNav:  900,
  header:     100,
  tour:      1000,
  max:       9999,
} as const

// ─────────────────────────────────────────────
// MOTION / ANIMACIONES
// ─────────────────────────────────────────────
export const motion = {
  duration: {
    instant: '0ms',
    fast:    '150ms',
    normal:  '250ms',
    slow:    '400ms',
    slower:  '600ms',
  },
  easing: {
    linear:     'linear',
    easeIn:     'cubic-bezier(0.4, 0, 1, 1)',
    easeOut:    'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',
    spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce:     'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  // Framer Motion variants reutilizables
  variants: {
    fadeIn: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.25 } },
    },
    slideUp: {
      hidden:  { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
    },
    slideDown: {
      hidden:  { opacity: 0, y: -16 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
    },
    scaleIn: {
      hidden:  { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0, 0, 0.2, 1] } },
    },
    stagger: {
      visible: { transition: { staggerChildren: 0.07 } },
    },
  },
} as const

// ─────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────
export const breakpoints = {
  mobile:    '< 768px',
  tablet:    '768px – 1023px',
  desktop:   '≥ 1024px',
  // Tailwind classes helper
  tw: {
    mobile:  'max-md',   // @media (max-width: 767px)
    tablet:  'md:',      // @media (min-width: 768px)
    desktop: 'lg:',      // @media (min-width: 1024px)
  },
  // Numeric (para useDevice comparisons)
  px: {
    mobile:  768,
    tablet:  1024,
  },
} as const

// ─────────────────────────────────────────────
// EXPORT RAÍZ
// ─────────────────────────────────────────────
export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  zIndex,
  motion,
  breakpoints,
} as const

export type Tokens = typeof tokens
export type ColorToken = typeof colors
export type MotionVariant = keyof typeof motion.variants
