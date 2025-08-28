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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
      {/* Header ultra compacto */}
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-blue-500 p-1.5 rounded">
          <Construction className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Análisis de Intervenciones
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {totalProjects} proyectos
          </p>
        </div>
      </div>

      {/* Métricas súper compactas en una fila */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{metricsData.tipos.length}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Tipos</p>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
          <div className="text-center">
            <p className="text-lg font-bold text-green-900 dark:text-green-100">{metricsData.clases.length}</p>
            <p className="text-xs text-green-700 dark:text-green-300">Clases</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white break-words" title={metricsData.tipos[0]?.fullName}>
              {metricsData.tipos[0]?.fullName || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Top Tipo</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white break-words" title={metricsData.clases[0]?.fullName}>
              {metricsData.clases[0]?.fullName || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Top Clase</p>
          </div>
        </div>
      </div>

      {/* Gráficos y Listas comprimidos - Layout horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Columna izquierda: Tipos de Intervención */}
        <div className="space-y-2">
          {/* Gráfico mini */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Construction className="w-3 h-3" />
              Tipos de Intervención
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={metricsData.tipos.slice(0, 4)} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  fontSize={8}
                  stroke="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  fontSize={8}
                  stroke="currentColor"
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip 
                  labelFormatter={(label) => metricsData.tipos.find(t => t.name === label)?.fullName || label}
                  formatter={(value: any) => [`${value} proyectos`, 'Cantidad']}
                  contentStyle={{
                    backgroundColor: 'var(--tw-bg-opacity-50)',
                    border: '1px solid var(--tw-border-opacity-50)',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#1E40AF" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lista compacta */}
          <div>
            <div className="space-y-0.5">
              {metricsData.tipos.slice(0, 3).map((tipo, index) => (
                <div key={tipo.fullName} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight" title={tipo.fullName}>
                      {tipo.fullName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {tipo.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: Clases de Obra */}
        <div className="space-y-2">
          {/* Gráfico mini */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Hammer className="w-3 h-3" />
              Clases de Obra
            </h4>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={metricsData.clases.slice(0, 4)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({percentage}) => `${percentage.toFixed(0)}%`}
                  outerRadius={45}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metricsData.clases.slice(0, 4).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} proyectos`, 
                    props.payload.fullName
                  ]}
                  contentStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Lista compacta */}
          <div>
            <div className="space-y-0.5">
              {metricsData.clases.slice(0, 3).map((clase, index) => (
                <div key={clase.fullName} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight" title={clase.fullName}>
                      {clase.fullName}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">
                      {clase.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
