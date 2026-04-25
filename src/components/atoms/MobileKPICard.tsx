/**
 * MobileKPICard — Átomo de tarjeta KPI para Mobile LITE
 *
 * Muestra un número grande con un icono SVG y etiqueta.
 * Adaptado para pantallas de 375-430px.
 * Link opcional a detalle de la sección.
 *
 * Uso:
 *   import { MobileKPICard } from '@/components/atoms'
 *   import { FolderKanban } from 'lucide-react'
 *   <MobileKPICard label="Proyectos" value={42} icon={<FolderKanban size={18} />} color="blue" />
 */
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ColorName = 'blue' | 'red' | 'orange' | 'violet' | 'green' | 'teal' | 'amber'

export interface MobileKPICardProps {
  label:  string
  value:  number | null
  /** Pasar siempre un componente Lucide — nunca un emoji */
  icon:   ReactNode
  color:  ColorName
  href?:  string
  className?: string
}

const colorMap: Record<ColorName, { bg: string; iconBg: string; text: string; number: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     iconBg: 'bg-blue-100 dark:bg-blue-800/40',   text: 'text-blue-600 dark:text-blue-400',   number: 'text-blue-700 dark:text-blue-300' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       iconBg: 'bg-red-100 dark:bg-red-800/40',     text: 'text-red-600 dark:text-red-400',     number: 'text-red-700 dark:text-red-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-100 dark:bg-orange-800/40', text: 'text-orange-600 dark:text-orange-400', number: 'text-orange-700 dark:text-orange-300' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', iconBg: 'bg-violet-100 dark:bg-violet-800/40', text: 'text-violet-600 dark:text-violet-400', number: 'text-violet-700 dark:text-violet-300' },
  green:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconBg: 'bg-emerald-100 dark:bg-emerald-800/40', text: 'text-emerald-600 dark:text-emerald-400', number: 'text-emerald-700 dark:text-emerald-300' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',     iconBg: 'bg-teal-100 dark:bg-teal-800/40',   text: 'text-teal-600 dark:text-teal-400',   number: 'text-teal-700 dark:text-teal-300' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   iconBg: 'bg-amber-100 dark:bg-amber-800/40', text: 'text-amber-600 dark:text-amber-400', number: 'text-amber-700 dark:text-amber-300' },
}

function CardContent({ label, value, icon, color }: Omit<MobileKPICardProps, 'href' | 'className'>) {
  const c = colorMap[color]
  return (
    <>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', c.iconBg)}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className={cn('text-2xl font-semibold tabular-nums leading-none mb-1 tracking-tight', c.number)}>
        {value === null
          ? <span className="inline-block w-10 h-6 bg-current opacity-10 rounded animate-pulse" />
          : value.toLocaleString('es-CO')
        }
      </div>
      <div className={cn('text-[11px] font-medium uppercase tracking-wide mt-0.5', c.text)}>
        {label}
      </div>
    </>
  )
}

export function MobileKPICard({ label, value, icon, color, href, className }: MobileKPICardProps) {
  const c = colorMap[color]
  const baseClass = cn(
    'flex flex-col p-4 rounded-lg border',
    'bg-white dark:bg-gray-800/60',
    'border-gray-200 dark:border-gray-700',
    'shadow-sm',
    href && 'active:scale-[0.98] transition-transform duration-[150ms]',
    className,
  )

  if (href) {
    return (
      <a href={href} className={baseClass} aria-label={`Ver ${label}`}>
        <CardContent label={label} value={value} icon={icon} color={color} />
      </a>
    )
  }

  return (
    <div className={baseClass}>
      <CardContent label={label} value={value} icon={icon} color={color} />
    </div>
  )
}
