'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Target, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { useCentrosGravedad, getColorByNovedad } from '@/hooks/useCentrosGravedad'

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

// Función para crear serie temporal agrupada cada 4 horas
function createTimeSeriesData(features: any[]) {
  const timeGroups: Record<string, number> = {}
  
  features.forEach(feature => {
    const timestamp = feature.properties.marca_temporal
    const date = new Date(timestamp)
    
    // Redondear a intervalos de 4 horas
    const hour = date.getHours()
    const roundedHour = Math.floor(hour / 4) * 4
    date.setHours(roundedHour, 0, 0, 0)
    
    // Crear clave única para cada intervalo de 4 horas
    const timeKey = date.toISOString()
    
    timeGroups[timeKey] = (timeGroups[timeKey] || 0) + 1
  })
  
  // Convertir a array y ordenar cronológicamente
  const sortedData = Object.entries(timeGroups)
    .map(([timeKey, cantidad]) => {
      const date = new Date(timeKey)
      return {
        time: timeKey,
        fecha: date.toLocaleDateString('es-ES', { 
          day: '2-digit',
          month: '2-digit'
        }),
        hora: date.toLocaleTimeString('es-ES', { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        fechaCompleta: date.toLocaleDateString('es-ES', { 
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        horaCompleta: date.toLocaleTimeString('es-ES', { 
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        cantidad,
        timestamp: date.getTime()
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
  
  return sortedData
}

export default function CentrosGravedadMetrics() {
  const { data, loading, error, metrics } = useCentrosGravedad()

  const chartData = useMemo(() => {
    if (!metrics || !data) return { novedades: [], temporal: [], sitios: [] }

    // Datos para gráfico de novedades (top 6)
    const novedades = metrics.topNovedades.slice(0, 6).map(item => ({
      tipo: item.tipo.length > 12 ? item.tipo.substring(0, 12) + '...' : item.tipo,
      fullTipo: item.tipo,
      cantidad: item.cantidad,
      porcentaje: item.porcentaje,
      color: getColorByNovedad(item.tipo)
    }))

    // Datos temporales agrupados cada 4 horas
    const temporal = createTimeSeriesData(data.features)

    // Top sitios
    const sitios = Object.entries(metrics.sitiosPorZona)
      .map(([sitio, cantidad]) => ({
        sitio: sitio.length > 20 ? sitio.substring(0, 20) + '...' : sitio,
        fullSitio: sitio,
        cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)

    return { novedades, temporal, sitios }
  }, [metrics, data])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">Error cargando datos: {error}</span>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  const getNovedadIcon = (novedad: string) => {
    const iconMap: Record<string, string> = {
      'bache': '🕳️',
      'sumidero': '🔘',
      'pavimentación inicio': '🚧',
      'pavimentación fin': '✅',
      'demarcación vial inicio': '🎨',
      'demarcación vial fin': '✅',
      'tapa anden': '🔧',
      'tapa via': '🔧',
      'luminaria y/o poste en mal estado': '💡',
      'poda arboles': '🌳',
      'punto de recoleccion y aseo': '🗑️',
      default: '📍'
    }
    return iconMap[novedad] || iconMap.default
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-purple-500 p-2 rounded-lg">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Centros de Gravedad
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Análisis de puntos críticos urbanos ({metrics.total} registros)
          </p>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">Total Registros</span>
          </div>
          <p className="text-xl font-bold text-red-900 dark:text-red-100">{metrics.total.toLocaleString()}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Tipos Novedad</span>
          </div>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
            {Object.keys(metrics.novedadesPorTipo).length}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">Promedio/Día</span>
          </div>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">
            {metrics.promedioRegistrosPorDia.toFixed(1)}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Sitios Activos</span>
          </div>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {Object.keys(metrics.sitiosPorZona).length}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Top Novedades */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Top Tipos de Novedades
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.novedades} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="tipo" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                fontSize={11}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                labelFormatter={(label) => chartData.novedades.find(n => n.tipo === label)?.fullTipo || label}
                formatter={(value: any, name: string) => [
                  `${value} registros`, 
                  'Cantidad'
                ]}
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity-50)',
                  border: '1px solid var(--tw-border-opacity-50)',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Línea Temporal */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tendencia Temporal (cada 4 horas)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData.temporal} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="fecha" 
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                angle={-45}
                textAnchor="end"
                height={60}
                interval={Math.max(0, Math.floor(chartData.temporal.length / 8))} // Mostrar máximo 8 etiquetas
              />
              <YAxis 
                fontSize={11}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const data = payload[0].payload
                    return `${data.fechaCompleta} - ${data.horaCompleta}h`
                  }
                  return label
                }}
                formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity-50)',
                  border: '1px solid var(--tw-border-opacity-50)',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="cantidad" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Top Novedades */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Principales Tipos de Novedades
          </h5>
          <div className="space-y-2">
            {chartData.novedades.map((novedad, index) => (
              <div key={novedad.fullTipo} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getNovedadIcon(novedad.fullTipo)}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {novedad.fullTipo}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {novedad.cantidad}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {novedad.porcentaje}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Sitios Más Activos
          </h5>
          <div className="space-y-2">
            {chartData.sitios.map((sitio, index) => (
              <div key={sitio.fullSitio} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={sitio.fullSitio}>
                    {sitio.sitio}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {sitio.cantidad}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    registros
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estadísticas Temporales
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {chartData.temporal.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Intervalos de 4h</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {chartData.temporal.length > 0 ? Math.max(...chartData.temporal.map(t => t.cantidad)) : 0}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pico máximo</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {chartData.temporal.length > 0 ? (chartData.temporal.reduce((sum, t) => sum + t.cantidad, 0) / chartData.temporal.length).toFixed(1) : '0'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Promedio por período</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {metrics.topNovedades[0]?.tipo.split(' ')[0] || 'N/A'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Problema más común</p>
          </div>
        </div>
      </div>
    </div>
  )
}
