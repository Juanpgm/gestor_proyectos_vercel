/**
 * cn() — Función centralizadora de clases CSS.
 *
 * Combina clsx (condicionales) + tailwind-merge (deduplicación inteligente de clases Tailwind).
 * Ambas librerías ya están instaladas en el proyecto.
 *
 * Uso:
 *   import { cn } from '@/lib/cn'
 *   <div className={cn('base-class', isActive && 'active-class', className)} />
 *
 * Por qué no hardcodear clsx/twMerge en cada componente:
 *   - Un solo punto de actualización si cambia la lógica de merge
 *   - Configuración extendida si se necesita (prefixes personalizados de Tailwind)
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
