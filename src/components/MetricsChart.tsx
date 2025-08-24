'use client'

import React, { useMemo } from 'react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useDataContext } from '@/context/DataContext'

interface MetricsChartProps {
  className?: string
  type?: 'pie' | 'bar'
  metric?: 'centro_gestor' | 'tipo_intervencion' | 'estado' | 'comuna' | 'fuente_financiamiento'
  title?: string
}

// Paleta de colores para gráficos
const COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#EF4444', // Rojo
  '#8B5CF6', // Púrpura
  '#F97316', // Naranja
  '#06B6D4', // Cian
  '#84CC16', // Lima
  '#EC4899', // Rosa
  '#6B7280'  // Gris
]

const MetricsChart: React.FC<MetricsChartProps> = ({ 
  className = '', 
  type = 'pie',
  metric = 'centro_gestor',
  title
}) => {
  const { filteredProyectos } = useDataContext()

  // Procesar datos según la métrica seleccionada
  const chartData = useMemo(() => {
    if (!filteredProyectos || filteredProyectos.length === 0) return []

    const counts: Record<string, number> = {}

    filteredProyectos.forEach(proyecto => {
      let key: string
      
      switch (metric) {
        case 'centro_gestor':
          key = proyecto.nombre_centro_gestor || 'Sin centro gestor'
          break
        case 'tipo_intervencion':
          key = proyecto.tipo_intervencion || 'Sin especificar'
          break
        case 'estado':
          key = proyecto.estado || 'Sin estado'
          break
        case 'comuna':
          key = proyecto.comuna || 'Sin comuna'
          break
        case 'fuente_financiamiento':
          key = proyecto.nombre_fondo || proyecto.fuente_financiamiento || 'Sin especificar'
          break
        default:
          key = 'Otros'
      }

      counts[key] = (counts[key] || 0) + 1
    })

    // Convertir a formato para gráficos y ordenar por valor
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Limitar a los 8 más importantes
  }, [filteredProyectos, metric])

  // Función para formatear labels largos
  const formatLabel = (label: string, maxLength: number = 20) => {
    if (label.length <= maxLength) return label
    return label.substring(0, maxLength - 3) + '...'
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.payload.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Proyectos: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-xs text-gray-500">
            {((data.value / filteredProyectos.length) * 100).toFixed(1)}% del total
          </p>
        </div>
      )
    }
    return null
  }

  // Función para obtener el título por defecto
  const getDefaultTitle = () => {
    switch (metric) {
      case 'centro_gestor':
        return 'Por Centro Gestor'
      case 'tipo_intervencion':
        return 'Por Tipo de Intervención'
      case 'estado':
        return 'Por Estado'
      case 'comuna':
        return 'Por Comuna'
      case 'fuente_financiamiento':
        return 'Por Fuente de Financiamiento'
      default:
        return 'Distribución'
    }
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {title || getDefaultTitle()}
        </h4>
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          No hay datos disponibles
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {title || getDefaultTitle()}
      </h4>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                tickFormatter={(value) => formatLabel(value, 15)}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Leyenda para gráfico de torta */}
      {type === 'pie' && (
        <div className="mt-3 space-y-1">
          {chartData.slice(0, 5).map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                  {formatLabel(entry.name, 25)}
                </span>
              </div>
              <span className="font-medium text-gray-800 dark:text-white ml-2">
                {entry.value}
              </span>
            </div>
          ))}
          {chartData.length > 5 && (
            <div className="text-xs text-gray-500 pt-1">
              +{chartData.length - 5} más...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MetricsChart
