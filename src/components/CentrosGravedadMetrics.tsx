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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      {/* Header compacto */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-purple-500 p-1.5 rounded">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Centros de Gravedad
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {metrics.total.toLocaleString()} registros
          </p>
        </div>
      </div>

      {/* Métricas compactas */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-700">
          <div className="text-center">
            <p className="text-sm font-bold text-red-900 dark:text-red-100">{metrics.total > 999 ? (metrics.total/1000).toFixed(1)+'K' : metrics.total}</p>
            <p className="text-xs text-red-700 dark:text-red-300">Total</p>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-700">
          <div className="text-center">
            <p className="text-sm font-bold text-green-900 dark:text-green-100">
              {metrics.promedioRegistrosPorDia.toFixed(1)}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Prom/Día</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{Object.keys(metrics.novedadesPorTipo).length}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Tipos</p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-200 dark:border-purple-700">
          <div className="text-center">
            <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{Object.keys(metrics.sitiosPorZona).length}</p>
            <p className="text-xs text-purple-700 dark:text-purple-300">Sitios</p>
          </div>
        </div>
      </div>

      {/* Gráficos restaurados - Versión compacta */}
      <div className="space-y-4">
        {/* Gráfico de Barras - Top Novedades */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Top Tipos de Novedades
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData.novedades.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="tipo" 
                angle={-45}
                textAnchor="end"
                height={50}
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
                labelFormatter={(label) => chartData.novedades.find(n => n.tipo === label)?.fullTipo || label}
                formatter={(value: any) => [`${value} registros`, 'Cantidad']}
                contentStyle={{
                  backgroundColor: 'var(--tw-bg-opacity-50)',
                  border: '1px solid var(--tw-border-opacity-50)',
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              <Bar dataKey="cantidad" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Línea Temporal */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Tendencia Temporal (cada 4 horas)
          </h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData.temporal} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="fecha" 
                fontSize={8}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                angle={-45}
                textAnchor="end"
                height={40}
                interval={Math.max(0, Math.floor(chartData.temporal.length / 6))}
              />
              <YAxis 
                fontSize={8}
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
                  borderRadius: '6px',
                  fontSize: '11px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="cantidad" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 1, r: 2 }}
                activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Listas compactas en dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {/* Columna izquierda: Top Novedades */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Top Novedades
          </h5>
          <div className="space-y-0.5">
            {chartData.novedades.slice(0, 4).map((novedad, index) => (
              <div key={novedad.fullTipo} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-sm flex-shrink-0">{getNovedadIcon(novedad.fullTipo)}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight" title={novedad.fullTipo}>
                    {novedad.fullTipo}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-1">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
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

        {/* Columna derecha: Sitios Más Activos */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[0] }}
            ></div>
            Sitios Activos
          </h5>
          <div className="space-y-0.5">
            {chartData.sitios.slice(0, 4).map((sitio, index) => (
              <div key={sitio.fullSitio} className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div 
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight" title={sitio.fullSitio}>
                    {sitio.fullSitio}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-1">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">
                    {sitio.cantidad}
                  </div>
                </div>
              </div>
            ))}
            {chartData.sitios.length > 4 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                +{chartData.sitios.length - 4} más...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
