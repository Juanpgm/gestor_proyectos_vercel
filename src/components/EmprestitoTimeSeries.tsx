'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'

interface FlujoCajaData {
  banco: string
  centro_gestor: string
  [key: string]: string // Los meses están como claves dinámicas con fechas en formato string
}

interface EmprestitoTimeSeriesProps {
  data?: FlujoCajaData[]
  loading?: boolean
}

const EmprestitoTimeSeries: React.FC<EmprestitoTimeSeriesProps> = ({
  data = [],
  loading = false
}) => {
  // Estado para controlar qué bancos están seleccionados
  const [selectedBancos, setSelectedBancos] = React.useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Obtener bancos únicos (fuera del useMemo para poder usar en useEffect)
  const bancos = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return Array.from(new Set(data.map(row => row.banco)))
  }, [data])

  // Inicializar bancos seleccionados cuando cambien los bancos disponibles
  React.useEffect(() => {
    if (bancos.length > 0 && !isInitialized) {
      setSelectedBancos(new Set(bancos))
      setIsInitialized(true)
    } else if (bancos.length === 0) {
      setIsInitialized(false)
    }
  }, [bancos.join(','), isInitialized])

  // Atajos de teclado para manejo de filtros
  React.useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Solo procesar si se mantiene presionada la tecla Ctrl/Cmd
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'a':
            // Ctrl+A: Seleccionar todos
            event.preventDefault()
            if (bancos.length > 0 && selectedBancos.size < bancos.length) {
              setSelectedBancos(new Set(bancos))
            }
            break
          case 'd':
            // Ctrl+D: Deseleccionar todos
            event.preventDefault()
            if (selectedBancos.size > 0) {
              setSelectedBancos(new Set())
            }
            break
          case 'i':
            // Ctrl+I: Invertir selección
            event.preventDefault()
            if (bancos.length > 0) {
              const newSelected = new Set<string>()
              bancos.forEach(banco => {
                if (!selectedBancos.has(banco)) {
                  newSelected.add(banco)
                }
              })
              setSelectedBancos(newSelected)
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [bancos, selectedBancos])

  // Procesar datos del flujo de caja
  const timeSeriesData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { data: [], bancoColors: {} }
    }

    // Obtener todas las fechas (columnas que no sean banco o centro_gestor)
    const dateColumns = Object.keys(data[0] || {}).filter(
      key => key !== 'banco' && key !== 'centro_gestor'
    )

    // Convertir fechas y ordenarlas
    const sortedDates = dateColumns
      .map(dateStr => ({ 
        original: dateStr, 
        date: new Date(dateStr),
        formatted: new Date(dateStr).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: '2-digit' 
        }).replace('/', '-')
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Filtrar bancos según selección
    const bancosToShow = bancos.filter(banco => selectedBancos.has(banco))
    
    // Colores para cada banco
    const bancoColors: Record<string, string> = {
      'Bancolombia': '#2563EB',
      'BBVA': '#EAB308', 
      'Davivienda': '#16A34A',
      'Davivienda/Otro Si': '#8B5CF6'
    }

    // Procesar datos mes a mes
    const processedData = sortedDates.map(({ original: dateStr, formatted }) => {
      const mesData: any = { 
        periodo: formatted,
        total: 0,
        acumulado: 0
      }

      // Agregar valores por banco (solo los seleccionados)
      bancosToShow.forEach(banco => {
        const bancoTotal = data
          .filter(row => row.banco === banco)
          .reduce((sum, row) => {
            const value = parseFloat(row[dateStr] || '0')
            return sum + (isNaN(value) ? 0 : value)
          }, 0)
        
        mesData[`${banco}_valor`] = bancoTotal
        mesData.total += bancoTotal
      })

      return mesData
    })

    // Calcular acumulados
    let acumuladoTotal = 0
    processedData.forEach(mes => {
      acumuladoTotal += mes.total
      mes.acumulado = acumuladoTotal
    })

    // Agregar colores y formato para tooltip
    const enrichedData = processedData.map(data => ({
      ...data,
      totalFormatted: formatNumber(data.total, 'currency'),
      acumuladoFormatted: formatNumber(data.acumulado, 'currency'),
      ...Object.fromEntries(
        bancosToShow.map(banco => [
          `${banco}_valorFormatted`, 
          formatNumber(data[`${banco}_valor`], 'currency')
        ])
      )
    }))

    return { data: enrichedData, bancosToShow, bancoColors }
  }, [data, selectedBancos])

  // Función para obtener color de intensidad para las barras
  const getColorIntensity = (value: number, maxValue: number, baseColor: [number, number, number]) => {
    if (maxValue === 0) return `rgb(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]})`
    const intensity = Math.max(0.3, value / maxValue)
    const lightColor = [baseColor[0] + (255 - baseColor[0]) * 0.6, baseColor[1] + (255 - baseColor[1]) * 0.6, baseColor[2] + (255 - baseColor[2]) * 0.6]
    const r = Math.round(lightColor[0] + (baseColor[0] - lightColor[0]) * intensity)
    const g = Math.round(lightColor[1] + (baseColor[1] - lightColor[1]) * intensity)
    const b = Math.round(lightColor[2] + (baseColor[2] - lightColor[2]) * intensity)
    return `rgb(${r}, ${g}, ${b})`
  }

  // Extraer datos procesados
  const { 
    data: enrichedData = [], 
    bancosToShow = [], 
    bancoColors = {} as Record<string, string>
  } = timeSeriesData

  // Función helper para obtener color de banco
  const getBancoColor = (banco: string): string => {
    const colorMap = bancoColors as Record<string, string>
    return colorMap[banco] || '#6B7280'
  }

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          
          <div className="space-y-1 text-sm">
            <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Flujo de Caja por Banco:</div>
            {bancosToShow.map(banco => (
              <div key={banco} className="flex justify-between items-center ml-2">
                <span style={{ color: getBancoColor(banco) }}>{banco}:</span>
                <span className="font-medium">{data[`${banco}_valorFormatted`] || '$0'}</span>
              </div>
            ))}
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total del Mes:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{data.totalFormatted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Acumulado Total:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{data.acumuladoFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-96 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </motion.div>
    )
  }

  if (enrichedData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Serie de Tiempo - Empréstito
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Evolución temporal de ejecución presupuestal y pagos
            </p>
          </div>
        </div>
        <div className="h-96 flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
          <p>No hay datos de serie de tiempo disponibles</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Serie de Tiempo - Empréstito
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Flujo de caja mensual por banco (barras) y acumulado total (línea)
          </p>
        </div>
      </div>

      {/* Filtros de bancos */}
      {bancos.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtrar por Banco:</h4>
          <div className="flex flex-wrap gap-3">
            {bancos.map(banco => (
              <label key={banco} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBancos.has(banco)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedBancos)
                    if (e.target.checked) {
                      newSelected.add(banco)
                    } else {
                      newSelected.delete(banco)
                    }
                    setSelectedBancos(newSelected)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: getBancoColor(banco) }}
                >
                  {banco}
                </span>
              </label>
            ))}
          </div>
          
          {/* Botones de acción rápida */}
          <div className="mt-3 flex gap-2 items-center">
            <button
              onClick={() => {
                if (bancos.length > 0) {
                  setSelectedBancos(new Set(bancos))
                }
              }}
              disabled={bancos.length === 0 || selectedBancos.size === bancos.length}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 font-medium ${
                bancos.length === 0 || selectedBancos.size === bancos.length
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 hover:shadow-sm text-blue-700 cursor-pointer active:bg-blue-300'
              }`}
              title={
                bancos.length === 0 
                  ? 'No hay bancos disponibles' 
                  : selectedBancos.size === bancos.length 
                    ? 'Todos los bancos ya están seleccionados'
                    : `Seleccionar todos los bancos (${bancos.length})`
              }
            >
              Seleccionar Todos
              {bancos.length > 0 && selectedBancos.size < bancos.length && (
                <span className="ml-1 text-xs opacity-75">
                  ({bancos.length - selectedBancos.size})
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                console.log('🔴 DESELECCIONAR TODOS - Estado antes:', {
                  bancosDisponibles: bancos.length,
                  bancosSeleccionados: selectedBancos.size,
                  listaBancos: Array.from(selectedBancos)
                })
                setSelectedBancos(new Set())
                console.log('🔴 DESELECCIONAR TODOS - Comando ejecutado: setSelectedBancos(new Set())')
              }}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 font-medium ${
                selectedBancos.size === 0
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer'
                  : 'bg-red-100 hover:bg-red-200 hover:shadow-sm text-red-700 cursor-pointer active:bg-red-300'
              }`}
              title={
                selectedBancos.size === 0 
                  ? 'Limpiar selección (ya está vacía)'
                  : `Deseleccionar todos los bancos (${selectedBancos.size})`
              }
            >
              Deseleccionar Todos
              {selectedBancos.size > 0 && (
                <span className="ml-1 text-xs opacity-75">
                  ({selectedBancos.size})
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (bancos.length > 0) {
                  const newSelected = new Set<string>()
                  bancos.forEach(banco => {
                    if (!selectedBancos.has(banco)) {
                      newSelected.add(banco)
                    }
                  })
                  setSelectedBancos(newSelected)
                }
              }}
              disabled={bancos.length === 0}
              className={`px-3 py-1 text-xs rounded-md transition-all duration-200 font-medium ${
                bancos.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-100 hover:bg-purple-200 hover:shadow-sm text-purple-700 cursor-pointer active:bg-purple-300'
              }`}
              title={
                bancos.length === 0 
                  ? 'No hay bancos disponibles' 
                  : `Invertir selección actual (${bancos.length - selectedBancos.size} serán seleccionados)`
              }
            >
              Alternar Selección
              {bancos.length > 0 && (
                <span className="ml-1 text-xs opacity-75">
                  (→{bancos.length - selectedBancos.size})
                </span>
              )}
            </button>

            {/* Indicador de estado con atajos de teclado */}
            <div className="ml-auto flex items-center gap-2">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                {selectedBancos.size} de {bancos.length} seleccionados
              </div>
              
              {/* Tooltip de atajos de teclado */}
              <div className="relative group">
                <button 
                  type="button"
                  className="text-xs text-gray-400 hover:text-gray-600 w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center transition-colors"
                  title="Atajos de teclado disponibles"
                >
                  ?
                </button>
                <div className="absolute right-0 top-6 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                  <div className="font-semibold mb-2">Atajos de teclado:</div>
                  <div className="space-y-1">
                    <div><span className="font-mono bg-gray-700 px-1 rounded">Ctrl+A</span> - Seleccionar todos</div>
                    <div><span className="font-mono bg-gray-700 px-1 rounded">Ctrl+D</span> - Deseleccionar todos</div>
                    <div><span className="font-mono bg-gray-700 px-1 rounded">Ctrl+I</span> - Invertir selección</div>
                  </div>
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={enrichedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="periodo" 
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 'currency')}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => formatNumber(value, 'currency')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Barras para valores por banco */}
            {bancosToShow.map(banco => (
              <Bar 
                key={banco}
                yAxisId="right"
                dataKey={`${banco}_valor`}
                name={banco}
                fill={getBancoColor(banco)}
                opacity={0.8}
              />
            ))}
            
            {/* Línea para acumulado total */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="acumulado" 
              stroke="#DC2626"
              strokeWidth={3}
              name="Acumulado Total"
              dot={{ fill: "#DC2626", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default EmprestitoTimeSeries
