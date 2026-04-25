/**
 * Mobile LITE Home Page — /m
 *
 * Vista de resumen KPI para teléfonos.
 * Usa DataContext para datos en tiempo real.
 * Carga rápida: sin mapas, sin charts pesados, sin tablas de 500+ filas.
 */
'use client'

import { useDataContext } from '@/context/DataContext'
import { MobileKPICard } from '@/components/atoms/MobileKPICard'

const KPI_CONFIG = [
  {
    key:     'totalProyectos' as const,
    label:   'Proyectos',
    icon:    '📋',
    color:   'blue',
    href:    '/m/proyectos',
  },
  {
    key:     'totalActividades' as const,
    label:   'Actividades',
    icon:    '⚡',
    color:   'red',
    href:    '/m/actividades',
  },
  {
    key:     'totalProductos' as const,
    label:   'Productos',
    icon:    '📦',
    color:   'orange',
    href:    '/m/productos',
  },
  {
    key:     'totalContratos' as const,
    label:   'Contratos',
    icon:    '📄',
    color:   'violet',
    href:    '/m/contratos',
  },
  {
    key:     'totalUnidadesProyecto' as const,
    label:   'Unidades de Proyecto',
    icon:    '🏗️',
    color:   'green',
    href:    '/m/unidades',
  },
] as const

type KPIKey = typeof KPI_CONFIG[number]['key']
type ColorName = typeof KPI_CONFIG[number]['color']

export default function MobilePage() {
  const { stats, loading, error } = useDataContext()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Resumen</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Proyectos activos · CaliTrack</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {KPI_CONFIG.map(({ key, label, icon, color, href }) => (
          <MobileKPICard
            key={key}
            label={label}
            value={loading ? null : stats[key]}
            icon={icon}
            color={color}
            href={href}
          />
        ))}
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
          Vista móvil simplificada. Para acceder a todos los filtros, reportes y gráficas usa la{' '}
          <a href="/" className="underline underline-offset-2">versión de escritorio</a>.
        </p>
      </div>
    </div>
  )
}
