'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Construction, Wrench, Hammer, Settings } from 'lucide-react'

interface UnidadProyecto {
  id: string
  bpin: string
  name: string
  status: string
  budget: number
  tipoIntervencion?: string
  claseObra?: string
  [key: string]: any
}

interface ProjectInterventionMetricsProps {
  data: UnidadProyecto[]
  loading: boolean
}

const COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export default function ProjectInterventionMetrics({ data, loading }: ProjectInterventionMetricsProps) {
  const metricsData = useMemo(() => {
    if (!data || data.length === 0) return { tipos: [], clases: [] }

    // Procesar tipos de intervención
    const tiposCounts: Record<string, number> = {}
    const tiposBudgets: Record<string, number> = {}
    
    // Procesar clases de obra
    const clasesCounts: Record<string, number> = {}
    const clasesBudgets: Record<string, number> = {}

    data.forEach(item => {
      const tipo = item.tipoIntervencion || 'Sin especificar'
      const clase = item.claseObra || 'Sin especificar'
      const budget = item.budget || 0

      // Contar tipos
      tiposCounts[tipo] = (tiposCounts[tipo] || 0) + 1
      tiposBudgets[tipo] = (tiposBudgets[tipo] || 0) + budget

      // Contar clases
      clasesCounts[clase] = (clasesCounts[clase] || 0) + 1
      clasesBudgets[clase] = (clasesBudgets[clase] || 0) + budget
    })

    // Convertir a arrays ordenados
    const tipos = Object.entries(tiposCounts)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        count,
        budget: tiposBudgets[name] || 0,
        percentage: ((count / data.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)

    const clases = Object.entries(clasesCounts)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        count,
        budget: clasesBudgets[name] || 0,
        percentage: ((count / data.length) * 100)
      }))
      .sort((a, b) => b.count - a.count)

    return { tipos, clases }
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount)
  }

  const getInterventionIcon = (tipo: string) => {
    const iconMap: Record<string, any> = {
      'Construcción': Construction,
      'Mejoramiento': Wrench,
      'Rehabilitación': Hammer,
      'Mantenimiento': Settings,
      'default': Construction
    }
    
    const IconComponent = iconMap[tipo] || iconMap.default
    return <IconComponent className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    )
  }

  const totalProjects = data?.length || 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-blue-500 p-2 rounded-lg">
          <Construction className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análisis de Intervenciones
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Distribución por tipo y clase de obra ({totalProjects} proyectos)
          </p>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Construction className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Tipos Únicos</span>
          </div>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{metricsData.tipos.length}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Hammer className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Clases Únicas</span>
          </div>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">{metricsData.clases.length}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Top Tipo</span>
          </div>
          <p className="text-sm font-bold text-purple-900 dark:text-purple-100 truncate">
            {metricsData.tipos[0]?.fullName || 'N/A'}
          </p>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            {metricsData.tipos[0]?.count || 0} proyectos
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Top Clase</span>
          </div>
          <p className="text-sm font-bold text-orange-900 dark:text-orange-100 truncate">
            {metricsData.clases[0]?.fullName || 'N/A'}
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            {metricsData.clases[0]?.count || 0} proyectos
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Tipos de Intervención */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Construction className="w-4 h-4" />
            Tipos de Intervención
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metricsData.tipos.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={11}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                fontSize={11}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                labelFormatter={(label) => metricsData.tipos.find(t => t.name === label)?.fullName || label}
                formatter={(value: any, name: string) => [
                  `${value} proyectos`, 
                  'Cantidad'
                ]}
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity-50)',
                  border: '1px solid var(--tw-border-opacity-50)',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'var(--tw-text-opacity)' }}
              />
              <Bar dataKey="count" fill="#1E40AF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico Circular - Clases de Obra */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Clases de Obra
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metricsData.clases.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({percentage}) => `${percentage.toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metricsData.clases.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${value} proyectos (${props.payload.percentage.toFixed(1)}%)`, 
                  props.payload.fullName
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Tipos Principales */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top 5 Tipos de Intervención
          </h5>
          <div className="space-y-2">
            {metricsData.tipos.slice(0, 5).map((tipo, index) => (
              <div key={tipo.fullName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {tipo.fullName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tipo.count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {tipo.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Top 5 Clases de Obra
          </h5>
          <div className="space-y-2">
            {metricsData.clases.slice(0, 5).map((clase, index) => (
              <div key={clase.fullName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {clase.fullName}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {clase.count}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {clase.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
