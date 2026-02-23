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
  Cell,
  BarChart,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, DollarSign, Building2, Calendar, TrendingDown } from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'

// Tipos para el endpoint /emprestito/flujo-caja/all
interface FlujoCajaRecord {
  id: string
  bp_proyecto?: string
  descripcion_bp?: string
  responsable?: string
  organismo?: string
  banco: string
  mes: string
  periodo: string
  desembolso: number
  desembolso_real?: number
}

interface FlujoCajaResponse {
  success: boolean
  data: FlujoCajaRecord[]
}

interface EmprestitoTimeSeriesProps {
  className?: string
}

const EmprestitoTimeSeries: React.FC<EmprestitoTimeSeriesProps> = ({ className = '' }) => {
  // Estado para datos y carga
  const [data, setData] = React.useState<FlujoCajaRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Función para formatear valores del eje Y de forma compacta
  const formatAxisValue = (value: number): string => {
    if (value === 0) return '$0'
    const absValue = Math.abs(value)
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(1)}B` // Billones
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(1)}MM` // Miles de millones
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(0)}M` // Millones
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(0)}K` // Miles
    return `$${value.toFixed(0)}`
  }
  
  // Estado para controlar qué bancos están seleccionados
  const [selectedBancos, setSelectedBancos] = React.useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Estado para filtro de meses (permite múltiples selecciones)
  const [selectedMeses, setSelectedMeses] = React.useState<Set<string>>(new Set())

  // Fetch data from API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/proxy/emprestito/flujo-caja/all')
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const result: FlujoCajaResponse = await response.json()
        
        if (result.success && result.data) {
          setData(result.data)
        } else {
          throw new Error('Formato de respuesta inválido')
        }
      } catch (err) {
        console.error('Error fetching flujo de caja data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Obtener bancos únicos (fuera del useMemo para poder usar en useEffect)
  const bancos = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return Array.from(new Set(data.map(row => row.banco))).sort()
  }, [data])

  // Obtener meses únicos ordenados cronológicamente
  const mesesDisponibles = React.useMemo(() => {
    if (!data || data.length === 0) return []
    
    const mesMap: Record<string, number> = {
      'ene-25': 1, 'feb-25': 2, 'mar-25': 3, 'abr-25': 4, 'may-25': 5, 'jun-25': 6,
      'jul-25': 7, 'ago-25': 8, 'sep-25': 9, 'oct-25': 10, 'nov-25': 11, 'dic-25': 12,
      'ene-26': 13, 'feb-26': 14, 'mar-26': 15, 'abr-26': 16, 'may-26': 17, 'jun-26': 18,
      'jul-26': 19, 'ago-26': 20, 'sep-26': 21, 'oct-26': 22, 'nov-26': 23, 'dic-26': 24,
      'ene-27': 25, 'feb-27': 26, 'mar-27': 27, 'abr-27': 28, 'may-27': 29, 'jun-27': 30,
      'jul-27': 31, 'ago-27': 32, 'sep-27': 33, 'oct-27': 34, 'nov-27': 35, 'dic-27': 36
    }
    
    const meses = Array.from(new Set(data.map(row => row.mes)))
      .filter(Boolean)
      .sort((a, b) => (mesMap[a] || 999) - (mesMap[b] || 999))
    
    return meses
  }, [data])

  // Inicializar mes actual (el más reciente disponible)
  React.useEffect(() => {
    if (mesesDisponibles.length > 0 && selectedMeses.size === 0) {
      setSelectedMeses(new Set([mesesDisponibles[mesesDisponibles.length - 1]]))
    }
  }, [mesesDisponibles, selectedMeses.size])

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

    // Mapeo de meses a números para ordenamiento
    const mesMap: Record<string, number> = {
      'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
    }

    // Obtener meses únicos y ordenarlos cronológicamente
    const mesesUnicos = Array.from(new Set(data.map(r => r.mes)))
      .sort((a, b) => {
        // Extraer mes y año de formato "jul-25"
        const [mesA, yearA] = a.split('-')
        const [mesB, yearB] = b.split('-')
        
        // Ordenar primero por año, luego por mes
        const yearDiff = parseInt('20' + yearA) - parseInt('20' + yearB)
        if (yearDiff !== 0) return yearDiff
        
        return (mesMap[mesA] || 0) - (mesMap[mesB] || 0)
      })
    
    // Filtrar bancos según selección
    const bancosToShow = bancos.filter(banco => selectedBancos.has(banco))
    
    // Colores para cada banco
    const bancoColors: Record<string, string> = {
      'Bancolombia': '#2563EB',
      'BBVA': '#EAB308', 
      'Davivienda': '#16A34A',
      'Davivienda/Otro Si': '#8B5CF6',
      'BID': '#F97316',
      'AFD': '#EC4899',
      'FINDETER': '#06B6D4'
    }

    // Procesar datos mes a mes
    const processedData = mesesUnicos.map(mes => {
      const mesData: any = { 
        periodo: mes,
        total: 0,
        acumulado: 0
      }

      // Agregar valores por banco (solo los seleccionados)
      bancosToShow.forEach(banco => {
        const bancoTotal = data
          .filter(row => row.banco === banco && row.mes === mes)
          .reduce((sum, row) => sum + (row.desembolso_real || row.desembolso || 0), 0)
        
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
  }, [data, selectedBancos, bancos])

  // Calcular totales por banco
  const totalesPorBanco = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const bancosAgrupados: Record<string, { planeado: number; real: number; proyectos: Set<string> }> = {}

    data.forEach(record => {
      if (!bancosAgrupados[record.banco]) {
        bancosAgrupados[record.banco] = { planeado: 0, real: 0, proyectos: new Set() }
      }
      bancosAgrupados[record.banco].planeado += record.desembolso || 0
      bancosAgrupados[record.banco].real += record.desembolso_real || 0
      if (record.bp_proyecto) {
        bancosAgrupados[record.banco].proyectos.add(record.bp_proyecto)
      }
    })

    return Object.entries(bancosAgrupados)
      .map(([banco, values]) => ({
        banco,
        planeado: values.planeado,
        real: values.real,
        proyectos: values.proyectos.size,
        cumplimiento: values.planeado > 0 ? (values.real / values.planeado) * 100 : 0
      }))
      .filter(b => b.planeado > 0) // Filtrar bancos sin datos
      .sort((a, b) => b.planeado - a.planeado)
  }, [data])

  // Datos consolidados mensuales (planeado vs real)
  const consolidadoMensual = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const mesMap: Record<string, number> = {
      'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
      'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
    }

    const mesesAgrupados: Record<string, { planeado: number; real: number }> = {}

    data.forEach(record => {
      if (!mesesAgrupados[record.mes]) {
        mesesAgrupados[record.mes] = { planeado: 0, real: 0 }
      }
      mesesAgrupados[record.mes].planeado += record.desembolso || 0
      mesesAgrupados[record.mes].real += record.desembolso_real || 0
    })

    return Object.entries(mesesAgrupados)
      .map(([mes, values]) => ({
        mes,
        planeado: values.planeado,
        real: values.real,
        diferencia: values.real - values.planeado,
        cumplimiento: values.planeado > 0 ? (values.real / values.planeado) * 100 : 0
      }))
      .sort((a, b) => {
        const [mesA, yearA] = a.mes.split('-')
        const [mesB, yearB] = b.mes.split('-')
        const yearDiff = parseInt('20' + yearA) - parseInt('20' + yearB)
        if (yearDiff !== 0) return yearDiff
        return (mesMap[mesA] || 0) - (mesMap[mesB] || 0)
      })
  }, [data])

  // Análisis por organismo
  const analisisOrganismos = React.useMemo(() => {
    if (!data || data.length === 0) return []

    const organismosAgrupados: Record<string, { planeado: number; real: number; proyectos: Set<string> }> = {}

    data.forEach(record => {
      const org = record.organismo || 'Sin clasificar'
      if (!organismosAgrupados[org]) {
        organismosAgrupados[org] = { planeado: 0, real: 0, proyectos: new Set() }
      }
      organismosAgrupados[org].planeado += record.desembolso || 0
      organismosAgrupados[org].real += record.desembolso_real || 0
      if (record.bp_proyecto) {
        organismosAgrupados[org].proyectos.add(record.bp_proyecto)
      }
    })

    return Object.entries(organismosAgrupados)
      .map(([organismo, values]) => ({
        organismo,
        planeado: values.planeado,
        real: values.real,
        proyectos: values.proyectos.size,
        cumplimiento: values.planeado > 0 ? (values.real / values.planeado) * 100 : 0
      }))
      .sort((a, b) => b.planeado - a.planeado)
      .slice(0, 10) // Top 10
  }, [data])

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
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
          Cargando serie temporal de empréstito...
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-red-200 dark:border-red-700 ${className}`}
      >
        <div className="text-center text-red-500 dark:text-red-400">
          <p className="font-semibold mb-2">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
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
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
          Cargando datos de empréstito...
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-red-200 dark:border-red-700 ${className}`}
      >
        <div className="text-center text-red-500 dark:text-red-400">
          <p className="font-semibold mb-2">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-0.5">
            <DollarSign className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-medium opacity-90">Total Adjudicado</span>
          </div>
          <div className="text-xl font-bold">
            {formatNumber(data.reduce((sum, r) => sum + (r.desembolso || 0), 0), 'currency')}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-0.5">
            <TrendingUp className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-medium opacity-90">Total Desembolsado</span>
          </div>
          <div className="text-xl font-bold">
            {formatNumber(data.reduce((sum, r) => sum + (r.desembolso_real || 0), 0), 'currency')}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-0.5">
            <Building2 className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-medium opacity-90">Bancos Activos</span>
          </div>
          <div className="text-xl font-bold">{bancos.filter(b => totalesPorBanco.find(t => t.banco === b && t.planeado > 0)).length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-0.5">
            <Calendar className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-medium opacity-90">% Cumplimiento</span>
          </div>
          <div className="text-xl font-bold">
            {(() => {
              const totalPlaneado = data.reduce((sum, r) => sum + (r.desembolso || 0), 0)
              const totalReal = data.reduce((sum, r) => sum + (r.desembolso_real || 0), 0)
              return totalPlaneado > 0 ? ((totalReal / totalPlaneado) * 100).toFixed(1) + '%' : '0%'
            })()}
          </div>
        </motion.div>
      </div>

      {/* Serie de Tiempo Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
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
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por Banco:</h4>
            <div className="flex flex-wrap gap-2">
              {bancos.filter(b => totalesPorBanco.find(t => t.banco === b)).map(banco => (
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
          </div>
        )}

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enrichedData} 
              margin={{ top: 5, right: 10, left: 5, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="periodo" 
                stroke="#6b7280"
                fontSize={9}
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 9 }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6b7280"
                fontSize={9}
                width={50}
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 9 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                fontSize={9}
                width={50}
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 9 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />
              
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
              
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="acumulado" 
                stroke="#DC2626"
                strokeWidth={2}
                name="Acumulado"
                dot={{ fill: "#DC2626", strokeWidth: 1, r: 2 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Gráficas en Cuadrícula 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Asignado por Banco */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Total Asignado por Banco
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalesPorBanco} margin={{ top: 5, right: 10, left: 5, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="banco" 
                  stroke="#6b7280"
                  fontSize={9}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 9 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={9}
                  width={50}
                  tickFormatter={formatAxisValue}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip 
                  formatter={(value: any) => formatNumber(value, 'currency')}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />
                <Bar dataKey="planeado" fill="#3B82F6" name="Adjudicado" />
                <Bar dataKey="real" fill="#10B981" name="Desembolsado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Consolidado Mensual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Consolidado Mensual
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consolidadoMensual} margin={{ top: 5, right: 10, left: 5, bottom: 35 }}>
                <defs>
                  <linearGradient id="colorPlaneado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="mes" 
                  stroke="#6b7280"
                  fontSize={9}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 9 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={9}
                  width={50}
                  tickFormatter={formatAxisValue}
                  tick={{ fontSize: 9 }}
                />
                <Tooltip 
                  formatter={(value: any) => formatNumber(value, 'currency')}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />
                <Area 
                  type="monotone" 
                  dataKey="planeado" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorPlaneado)" 
                  name="Adjudicado"
                />
                <Area 
                  type="monotone" 
                  dataKey="real" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorReal)" 
                  name="Desembolsado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top 10 Organismos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Top 10 Organismos
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={analisisOrganismos} 
                layout="vertical"
                margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  type="number"
                  stroke="#6b7280"
                  fontSize={9}
                  tickFormatter={formatAxisValue}
                  tick={{ fontSize: 9 }}
                />
                <YAxis 
                  type="category"
                  dataKey="organismo"
                  stroke="#6b7280"
                  fontSize={8}
                  width={75}
                  tick={{ fontSize: 8 }}
                />
                <Tooltip 
                  formatter={(value: any) => formatNumber(value, 'currency')}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />
                <Bar dataKey="planeado" fill="#3B82F6" name="Adjudicado" />
                <Bar dataKey="real" fill="#10B981" name="Desembolsado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cuarta gráfica: Distribución por Banco (Pie Chart) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Distribución por Banco
            </h3>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={totalesPorBanco}
                  dataKey="planeado"
                  nameKey="banco"
                  cx="45%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(props) => {
                    const { percent, x, y } = props;
                    if (percent < 0.05) return null;
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#1f2937"
                        fontSize="11px"
                        fontWeight="bold"
                        textAnchor={x > 200 ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                >
                  {totalesPorBanco.map((entry, index) => {
                    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string) => [formatNumber(value, 'currency'), name]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }} 
                  iconSize={10}
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => {
                    const item = totalesPorBanco.find(b => b.banco === value)
                    return item ? `${value} (${((item.planeado / totalesPorBanco.reduce((s, b) => s + b.planeado, 0)) * 100).toFixed(1)}%)` : value
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Separador para Análisis Detallado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="relative my-8"
      >
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t-2 border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 dark:bg-gray-900 px-6 py-2 text-lg font-semibold text-gray-900 dark:text-white rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-sm">
            Análisis Detallado de Desembolsos
          </span>
        </div>
      </motion.div>

      {/* Selector de Meses Múltiple */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccionar Meses:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMeses(new Set(mesesDisponibles))}
              className="px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-md transition-colors"
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedMeses(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {mesesDisponibles.map(mes => (
            <button
              key={mes}
              onClick={() => {
                const newSelected = new Set(selectedMeses)
                if (newSelected.has(mes)) {
                  newSelected.delete(mes)
                } else {
                  newSelected.add(mes)
                }
                setSelectedMeses(newSelected)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                selectedMeses.has(mes)
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {mes}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Gráfico de Barras por Organismo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Desembolsos por Organismo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comparación de organismos en los meses seleccionados
            </p>
          </div>
        </div>

        <div className="h-96">
          {(() => {
            const filteredData = data.filter(record => 
              (!selectedBancos.size || selectedBancos.has(record.banco)) &&
              selectedMeses.has(record.mes) &&
              (record.desembolso || 0) > 0
            )

            // Agrupar por organismo
            const porOrganismo: Record<string, number> = {}
            filteredData.forEach(record => {
              const org = record.organismo || 'Sin clasificar'
              porOrganismo[org] = (porOrganismo[org] || 0) + (record.desembolso || 0)
            })

            const chartData = Object.entries(porOrganismo)
              .map(([organismo, total]) => ({ organismo, total }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 15) // Top 15

            if (chartData.length === 0) {
              return (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos para los meses seleccionados</p>
                  </div>
                </div>
              )
            }

            return (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    type="number" 
                    tickFormatter={formatAxisValue}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="organismo" 
                    width={150}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatNumber(value, 'currency')}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="total" fill="#0D9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          })()}
        </div>
      </motion.div>

      {/* Tabla Principal: Organismo → Proyectos → Desembolso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalle de Desembolsos por Organismo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Organismo → Proyectos → Desembolso
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Organismo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Mes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  BP Proyecto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Desembolso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(() => {
                const filteredData = data.filter(record => 
                  (!selectedBancos.size || selectedBancos.has(record.banco)) &&
                  selectedMeses.has(record.mes) &&
                  (record.desembolso || 0) > 0
                )

                // Agrupar por organismo
                const porOrganismo: Record<string, FlujoCajaRecord[]> = {}
                
                filteredData.forEach(record => {
                  const org = record.organismo || 'Sin clasificar'
                  if (!porOrganismo[org]) {
                    porOrganismo[org] = []
                  }
                  porOrganismo[org].push(record)
                })

                // Ordenar organismos por total descendente
                const organismosOrdenados = Object.entries(porOrganismo)
                  .map(([org, records]) => ({
                    org,
                    records,
                    total: records.reduce((sum, r) => sum + (r.desembolso || 0), 0)
                  }))
                  .sort((a, b) => b.total - a.total)

                const rows: JSX.Element[] = []
                let globalIndex = 0

                if (organismosOrdenados.length === 0) {
                  rows.push(
                    <tr key="no-data">
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay datos disponibles para los meses seleccionados
                      </td>
                    </tr>
                  )
                }

                organismosOrdenados.forEach(({ org, records, total }) => {
                  // Fila de total del organismo
                  rows.push(
                    <tr key={`org-${org}`} className="bg-blue-50 dark:bg-blue-900/20 font-medium">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {org}
                      </td>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {records.length} proyectos
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {formatNumber(total, 'currency')}
                      </td>
                    </tr>
                  )

                  // Ordenar proyectos por desembolso descendente
                  const proyectosOrdenados = records.sort((a, b) => 
                    (b.desembolso || 0) - (a.desembolso || 0)
                  )

                  // Filas de detalle de proyectos
                  proyectosOrdenados.forEach((record) => {
                    rows.push(
                      <tr key={`${globalIndex++}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 pl-8">
                          ↳
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {record.mes}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {record.bp_proyecto || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                          {record.descripcion_bp || 'Sin descripción'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          {formatNumber(record.desembolso || 0, 'currency')}
                        </td>
                      </tr>
                    )
                  })
                })

                return rows
              })()}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  )
}

export default EmprestitoTimeSeries
