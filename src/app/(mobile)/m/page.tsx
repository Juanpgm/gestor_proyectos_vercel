/**
 * Mobile LITE Home Page — /m
 *
 * Vista de resumen KPI para teléfonos.
 * Sin emojis — usa iconos SVG de Lucide.
 * Sin mapas, sin charts pesados, sin tablas de 500+ filas.
 */
'use client'

import { FolderKanban, Activity, Package, FileText, Building2 } from 'lucide-react'
import { useDataContext } from '@/context/DataContext'
import { MobileKPICard } from '@/components/atoms/MobileKPICard'

const KPI_CONFIG = [
  {
    key:   'totalProyectos' as const,
    label: 'Proyectos',
    icon:  <FolderKanban size={18} />,
    color: 'blue'  as const,
    href:  '/m/proyectos',
  },
  {
    key:   'totalActividades' as const,
    label: 'Actividades',
    icon:  <Activity size={18} />,
    color: 'red'   as const,
    href:  '/m/actividades',
  },
  {
    key:   'totalProductos' as const,
    label: 'Productos',
    icon:  <Package size={18} />,
    color: 'orange' as const,
    href:  '/m/productos',
  },
  {
    key:   'totalContratos' as const,
    label: 'Contratos',
    icon:  <FileText size={18} />,
    color: 'violet' as const,
    href:  '/m/contratos',
  },
  {
    key:   'totalUnidadesProyecto' as const,
    label: 'Unidades UP',
    icon:  <Building2 size={18} />,
    color: 'green' as const,
    href:  '/m/unidades',
  },
]

export default function MobilePage() {
  const { stats, loading, error } = useDataContext()

  return (
    <div className="space-y-4">
      {/* ── Encabezado ─────────────────────────── */}
      <div className="pb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
          Panel de control
        </p>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Resumen general
        </h1>
      </div>

      {/* ── Error ──────────────────────────────── */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ── Tarjetas KPI ───────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
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

      {/* ── Aviso versión escritorio ────────────── */}
      <div className="rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 px-4 py-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Vista simplificada para móvil.{' '}
          <a href="/" className="text-blue-700 dark:text-sky-400 font-medium hover:underline">
            Abrir versión completa
          </a>
        </p>
      </div>
    </div>
  )
}
