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
        percentage: ((count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    const clases = Object.entries(clasesCounts)
      .map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        count,
        budget: clasesBudgets[name] || 0,
        percentage: ((count / data.length) * 100).toFixed(1)
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    )
  }

  const totalProjects = data?.length || 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col">
      {/* Header con estadísticas clave */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1.5 rounded">
              <Construction className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Análisis de Intervenciones
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Distribución por tipo y clase de obra
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalProjects}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Proyectos</p>
          </div>
        </div>

        {/* Estadísticas principales organizadas */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{metricsData.tipos.length}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">Tipos</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate" title={metricsData.tipos[0]?.fullName}>
                {metricsData.tipos[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-700">
            <div className="text-center">
              <p className="text-lg font-bold text-green-900 dark:text-green-100">{metricsData.clases.length}</p>
              <p className="text-xs text-green-700 dark:text-green-300">Clases</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate" title={metricsData.clases[0]?.fullName}>
                {metricsData.clases[0]?.name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-700">
            <div className="text-center">
              <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {metricsData.tipos[0]?.count || 0}
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">Mayor Tipo</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {metricsData.tipos[0]?.percentage || 0}%
              </p>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-700">
            <div className="text-center">
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {metricsData.clases[0]?.count || 0}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">Mayor Clase</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {metricsData.clases[0]?.percentage || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de análisis visual organizada */}
      <div className="flex-1 space-y-6">
        
        {/* Tipos de Intervención - Análisis de Barras */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Construction className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Distribución por Tipos de Intervención
            </h4>
            <div className="ml-auto bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">
              {metricsData.tipos.length} categorías
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* Gráfico de barras optimizado */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metricsData.tipos.slice(0, 8)} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    fontSize={9}
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    fontSize={9}
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    labelFormatter={(label) => metricsData.tipos.find(t => t.name === label)?.fullName || label}
                    formatter={(value: any) => [`${value} proyectos`, 'Cantidad']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" fill="#1E40AF" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Lista organizada de tipos */}
            <div className="w-72">
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Ranking de Tipos ({metricsData.tipos.length})
                </h5>
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {metricsData.tipos.slice(0, 12).map((tipo, index) => (
                    <div key={tipo.fullName} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full bg-blue-500">
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate" title={tipo.fullName}>
                          {tipo.fullName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{tipo.count}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{tipo.percentage}%</div>
                      </div>
                    </div>
                  ))}
                  {metricsData.tipos.length > 12 && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                      +{metricsData.tipos.length - 12} tipos adicionales
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clases de Obra - Análisis Circular */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Hammer className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Distribución por Clases de Obra
            </h4>
            <div className="ml-auto bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300">
              {metricsData.clases.length} clases
            </div>
          </div>
          
          <div className="flex gap-4">
            {/* Gráfico circular optimizado */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={metricsData.clases.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percentage}) => `${parseFloat(percentage).toFixed(0)}%`}
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="count"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {metricsData.clases.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} proyectos (${parseFloat(props.payload.percentage).toFixed(1)}%)`, 
                      props.payload.fullName
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Lista organizada de clases */}
            <div className="w-72">
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Ranking de Clases ({metricsData.clases.length})
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metricsData.clases.slice(0, 15).map((clase, index) => (
                    <div key={clase.fullName} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate" title={clase.fullName}>
                          {clase.fullName}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{clase.count}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{clase.percentage}%</div>
                      </div>
                    </div>
                  ))}
                  {metricsData.clases.length > 15 && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
                      +{metricsData.clases.length - 15} clases adicionales
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
