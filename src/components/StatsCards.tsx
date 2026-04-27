'use client'

import React from 'react'
import { useDashboardStats } from '@/context/DashboardContext'
import { useFilteredStats } from '@/hooks/useDataFilters'
import { useContratos } from '@/hooks/useContratos'
import { useProcesos } from '@/hooks/useProcesos'
import { FolderOpen, Activity, Package, DollarSign, Settings } from 'lucide-react'
import { StatCard } from '@/components/molecules/StatCard'

// Mapeo categoría → color del design system
const CATEGORY_COLOR = {
  projects:   'blue',
  activities: 'red',
  products:   'orange',
  contracts:  'violet',
  procesos:   'gray',
} as const

const StatsCards: React.FC = () => {
  const dashboardStats = useDashboardStats()
  const filteredStats  = useFilteredStats()
  const contratosState = useContratos()
  const procesosState  = useProcesos()

  const loading =
    dashboardStats.loading ||
    filteredStats.loading  ||
    contratosState.loading ||
    procesosState.loading

  const statsData = [
    {
      label:   'Proyectos de Inversión',
      value:   filteredStats.stats.totalProyectos   ?? null,
      icon:    <FolderOpen size={18} strokeWidth={1.5} />,
      color:   CATEGORY_COLOR.projects,
    },
    {
      label:   'Actividades',
      value:   filteredStats.stats.totalActividades ?? null,
      icon:    <Activity   size={18} strokeWidth={1.5} />,
      color:   CATEGORY_COLOR.activities,
    },
    {
      label:   'Productos Esperados',
      value:   filteredStats.stats.totalProductos   ?? null,
      icon:    <Package    size={18} strokeWidth={1.5} />,
      color:   CATEGORY_COLOR.products,
    },
    {
      label:   'Contratos',
      value:   contratosState.metrics.totalContratos ?? null,
      icon:    <DollarSign size={18} strokeWidth={1.5} />,
      color:   CATEGORY_COLOR.contracts,
    },
    {
      label:   'Procesos SECOP',
      value:   procesosState.metrics.totalProcesos  ?? null,
      icon:    <Settings   size={18} strokeWidth={1.5} />,
      color:   CATEGORY_COLOR.procesos,
    },
  ] as const

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statsData.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={loading ? null : stat.value}
          icon={stat.icon}
          color={stat.color}
          loading={loading}
        />
      ))}
    </section>
  )
}

export default StatsCards
