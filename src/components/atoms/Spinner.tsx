/**
 * Spinner — Átomo de indicador de carga de CaliTrack Design System
 *
 * Tamaños: sm | md | lg | xl
 * Colores: default (azul) | white | gray
 *
 * Uso:
 *   import { Spinner } from '@/components/atoms'
 *   <Spinner size="md" />
 *   <Spinner size="sm" color="white" />
 */
import { cn } from '@/lib/cn'

export interface SpinnerProps {
  size?:  'sm' | 'md' | 'lg' | 'xl'
  color?: 'default' | 'white' | 'gray'
  label?: string  // aria-label para accesibilidad
  className?: string
}

const sizeClasses = {
  sm:  'w-3.5 h-3.5 border-2',
  md:  'w-5 h-5 border-2',
  lg:  'w-7 h-7 border-[3px]',
  xl:  'w-10 h-10 border-4',
}

const colorClasses = {
  default: 'border-blue-200 border-t-blue-600',
  white:   'border-white/30 border-t-white',
  gray:    'border-gray-200 border-t-gray-500 dark:border-gray-700 dark:border-t-gray-400',
}

export function Spinner({ size = 'md', color = 'default', label = 'Cargando…', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className,
      )}
    />
  )
}

/** Overlay de página completa con Spinner centrado */
export function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label ?? 'Cargando…'}
      className="fixed inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-[var(--z-overlay)]"
    >
      <Spinner size="xl" />
    </div>
  )
}
