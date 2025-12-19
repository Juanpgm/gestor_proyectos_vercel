'use client'

import React, { useState, useMemo } from 'react'
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Wallet
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'
import EmprestitoFinancialMetrics from './EmprestitoFinancialMetrics'
import EmprestitoProjectAnalysis from './EmprestitoProjectAnalysis'

// Tipos de datos del endpoint
interface FlujoCajaRegistro {
  id: string
  organismo: string
  banco: string
  bp_proyecto?: string
  descripcion_bp?: string
  responsable?: string
  mes: string
  periodo: string
  desembolso: number
  desembolso_real?: number
  columna_origen?: string
  archivo_origen?: string
  fecha_procesamiento?: string
}

interface FlujoCajaResponse {
  success: boolean
  data: FlujoCajaRegistro[]
  count: number
  summary: {
    responsables_unicos: number
    organismos_unicos: number
    bancos_unicos: number
    bp_proyectos_unicos: number
    meses_procesados: number
    total_desembolso: number
  }
  metadata: {
    responsables: string[]
    organismos: string[]
    bancos: string[]
    bp_proyectos: string[]
    meses: string[]
  }
}

interface EmprestitoFlujoCajaDashboardProps {
  className?: string
}

// Colores por banco
const BANCO_COLORS: Record<string, string> = {
  'Bancolombia': '#2563EB',
  'BBVA': '#EAB308',
  'Davivienda': '#16A34A',
  'Banco de Occidente': '#F97316',
  'IFC': '#8B5CF6',
  'Banco Nuevo 2': '#EC4899'
}

// Colores para organismos
const ORGANISMO_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16', '#F43F5E', '#06B6D4'
]

const EmprestitoFlujoCajaDashboard: React.FC<EmprestitoFlujoCajaDashboardProps> = ({ className = '' }) => {
  const [flujoCajaData, setFlujoCajaData] = useState<FlujoCajaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBancos, setSelectedBancos] = useState<Set<string>>(new Set())
  const [selectedOrganismos, setSelectedOrganismos] = useState<Set<string>>(new Set())

  // Cargar datos del endpoint
  React.useEffect(() => {
    const fetchFlujoCaja = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://gestorproyectoapi-production.up.railway.app/emprestito/flujo-caja/all')
        const data = await response.json()
        setFlujoCajaData(data)
        
        // Inicializar selecciones
        if (data.metadata) {
          setSelectedBancos(new Set(data.metadata.bancos.filter((b: string) => b && b !== 'nan')))
          setSelectedOrganismos(new Set(data.metadata.organismos))
        }
      } catch (error) {
        console.error('Error al cargar flujo de caja:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlujoCaja()
  }, [])

  // Procesar datos para serie temporal mensual
  const timeSeriesData = useMemo(() => {
    if (!flujoCajaData?.data) return []

    const filteredData = flujoCajaData.data.filter(row => 
      selectedBancos.has(row.banco) && 
      selectedOrganismos.has(row.organismo) &&
      row.banco !== 'nan'
    )

    // Agrupar por mes
    const monthlyData = filteredData.reduce((acc, row) => {
      const month = row.mes
      if (!acc[month]) {
        acc[month] = {
          mes: month,
          periodo: new Date(row.periodo).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'short' 
          }),
          total: 0,
          desembolso_real_total: 0,
          acumulado: 0,
          bancos: {} as Record<string, number>
        }
      }
      
      acc[month].total += row.desembolso || 0
      acc[month].desembolso_real_total += row.desembolso_real || 0
      
      // Agrupar por banco
      if (!acc[month].bancos[row.banco]) {
        acc[month].bancos[row.banco] = 0
      }
      acc[month].bancos[row.banco] += row.desembolso || 0
      
      return acc
    }, {} as Record<string, any>)

    // Convertir a array y ordenar por periodo
    const sortedData = Object.values(monthlyData).sort((a: any, b: any) => {
      const dateA = new Date(a.periodo)
      const dateB = new Date(b.periodo)
      return dateA.getTime() - dateB.getTime()
    })

    // Calcular acumulado
    let acumulado = 0
    return sortedData.map((item: any) => {
      acumulado += item.total
      return {
        ...item,
        acumulado,
        totalFormatted: formatNumber(item.total, 'currency'),
        acumuladoFormatted: formatNumber(acumulado, 'currency')
      }
    })
  }, [flujoCajaData, selectedBancos, selectedOrganismos])

  // Análisis por banco
  const bankAnalysis = useMemo(() => {
    if (!flujoCajaData?.data) return []

    const filteredData = flujoCajaData.data.filter(row => 
      selectedBancos.has(row.banco) && 
      selectedOrganismos.has(row.organismo) &&
      row.banco !== 'nan'
    )

    const bankTotals = filteredData.reduce((acc, row) => {
      if (!acc[row.banco]) {
        acc[row.banco] = {
          banco: row.banco,
          total: 0,
          desembolso_real: 0,
          proyectos: new Set(),
          organismos: new Set()
        }
      }
      
      acc[row.banco].total += row.desembolso || 0
      acc[row.banco].desembolso_real += row.desembolso_real || 0
      if (row.bp_proyecto) acc[row.banco].proyectos.add(row.bp_proyecto)
      acc[row.banco].organismos.add(row.organismo)
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(bankTotals)
      .map((bank: any) => ({
        ...bank,
        proyectos: bank.proyectos.size,
        organismos: bank.organismos.size,
        porcentaje: 0
      }))
      .sort((a: any, b: any) => b.total - a.total)
  }, [flujoCajaData, selectedBancos, selectedOrganismos])

  // Análisis por organismo
  const organismoAnalysis = useMemo(() => {
    if (!flujoCajaData?.data) return []

    const filteredData = flujoCajaData.data.filter(row => 
      selectedBancos.has(row.banco) && 
      selectedOrganismos.has(row.organismo) &&
      row.banco !== 'nan'
    )

    const organismoTotals = filteredData.reduce((acc, row) => {
      if (!acc[row.organismo]) {
        acc[row.organismo] = {
          organismo: row.organismo,
          total: 0,
          proyectos: new Set(),
          bancos: new Set()
        }
      }
      
      acc[row.organismo].total += row.desembolso || 0
      if (row.bp_proyecto) acc[row.organismo].proyectos.add(row.bp_proyecto)
      acc[row.organismo].bancos.add(row.banco)
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(organismoTotals)
      .map((org: any) => ({
        ...org,
        proyectos: org.proyectos.size,
        bancos: org.bancos.size
      }))
      .sort((a: any, b: any) => b.total - a.total)
  }, [flujoCajaData, selectedBancos, selectedOrganismos])

  // Comparación planeado vs real
  const plannedVsRealData = useMemo(() => {
    if (!flujoCajaData?.data) return []

    const filteredData = flujoCajaData.data.filter(row => 
      selectedBancos.has(row.banco) && 
      selectedOrganismos.has(row.organismo) &&
      row.banco !== 'nan'
    )

    const monthlyComparison = filteredData.reduce((acc, row) => {
      const month = row.mes
      if (!acc[month]) {
        acc[month] = {
          mes: month,
          planeado: 0,
          real: 0,
          diferencia: 0
        }
      }
      
      acc[month].planeado += row.desembolso || 0
      acc[month].real += row.desembolso_real || 0
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(monthlyComparison)
      .map((item: any) => ({
        ...item,
        diferencia: item.real - item.planeado,
        cumplimiento: item.planeado > 0 ? (item.real / item.planeado) * 100 : 0
      }))
      .sort((a: any, b: any) => a.mes.localeCompare(b.mes))
  }, [flujoCajaData, selectedBancos, selectedOrganismos])

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span style={{ color: entry.color }}>{entry.name}:</span>
                <span className="font-medium ml-4">{formatNumber(entry.value, 'currency')}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-xl"></div>
          ))}
        </div>
        <div className="bg-gray-200 dark:bg-gray-700 h-96 rounded-xl"></div>
      </div>
    )
  }

  const totalDesembolso = flujoCajaData?.summary?.total_desembolso || 0
  const totalReal = flujoCajaData?.data.reduce((sum, row) => sum + (row.desembolso_real || 0), 0) || 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas Financieras Avanzadas */}
      <EmprestitoFinancialMetrics 
        data={flujoCajaData?.data.filter(row => 
          selectedBancos.has(row.banco) && 
          selectedOrganismos.has(row.organismo) &&
          row.banco !== 'nan'
        ) || []} 
      />

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Total</div>
          </div>
          <div className="text-2xl font-bold">{formatNumber(totalDesembolso, 'currency')}</div>
          <div className="text-sm opacity-90">Desembolso Planeado</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 opacity-80" />
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Real</div>
          </div>
          <div className="text-2xl font-bold">{formatNumber(totalReal, 'currency')}</div>
          <div className="text-sm opacity-90">Desembolso Ejecutado</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-8 h-8 opacity-80" />
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Bancos</div>
          </div>
          <div className="text-2xl font-bold">{flujoCajaData?.summary?.bancos_unicos || 0}</div>
          <div className="text-sm opacity-90">Entidades Financieras</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <div className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Cumplimiento</div>
          </div>
          <div className="text-2xl font-bold">
            {totalDesembolso > 0 ? ((totalReal / totalDesembolso) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-sm opacity-90">Del Planeado</div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Filtros de Análisis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtro de Bancos */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Bancos</label>
            <div className="flex flex-wrap gap-2">
              {flujoCajaData?.metadata?.bancos.filter(b => b && b !== 'nan').map(banco => (
                <label key={banco} className="inline-flex items-center cursor-pointer">
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
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium" style={{ color: BANCO_COLORS[banco] || '#6B7280' }}>
                    {banco}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtro de Organismos */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              Organismos ({selectedOrganismos.size}/{flujoCajaData?.metadata?.organismos.length || 0})
            </label>
            <div className="max-h-24 overflow-y-auto flex flex-wrap gap-2">
              {flujoCajaData?.metadata?.organismos.map(organismo => (
                <label key={organismo} className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrganismos.has(organismo)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedOrganismos)
                      if (e.target.checked) {
                        newSelected.add(organismo)
                      } else {
                        newSelected.delete(organismo)
                      }
                      setSelectedOrganismos(newSelected)
                    }}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs">{organismo}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Serie de Tiempo - Flujo de Caja Mensual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Serie de Tiempo - Flujo de Caja
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Flujo de caja mensual por banco (barras) y acumulado total (línea)
            </p>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="periodo" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
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
              
              {/* Barras por banco */}
              {Array.from(selectedBancos).map((banco, index) => (
                <Bar
                  key={banco}
                  yAxisId="right"
                  dataKey={`bancos.${banco}`}
                  name={banco}
                  fill={BANCO_COLORS[banco] || '#6B7280'}
                  stackId="bancos"
                />
              ))}
              
              {/* Línea de acumulado */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="acumulado"
                stroke="#DC2626"
                strokeWidth={3}
                name="Acumulado Total"
                dot={{ fill: "#DC2626", strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Análisis por Banco y Organismo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis por Banco */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Distribución por Banco
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Participación de cada entidad financiera
              </p>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bankAnalysis}
                  dataKey="total"
                  nameKey="banco"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.banco}: ${formatNumber(entry.total, 'currency')}`}
                  labelLine={{ stroke: '#6B7280' }}
                >
                  {bankAnalysis.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={BANCO_COLORS[entry.banco] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Organismos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Organismos
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Desembolsos por centro gestor
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {organismoAnalysis.slice(0, 10).map((org: any, index: number) => {
              const maxTotal = organismoAnalysis[0]?.total || 1
              const percentage = (org.total / maxTotal) * 100
              
              return (
                <div key={org.organismo} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {org.organismo}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {formatNumber(org.total, 'currency')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: ORGANISMO_COLORS[index % ORGANISMO_COLORS.length]
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{org.proyectos} proyectos</span>
                    <span>{org.bancos} bancos</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Comparación Planeado vs Real */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Planeado vs Real
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comparación de desembolsos planeados y ejecutados
            </p>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={plannedVsRealData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="mes" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => formatNumber(value, 'currency')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Area
                type="monotone"
                dataKey="planeado"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Desembolso Planeado"
              />
              <Area
                type="monotone"
                dataKey="real"
                stackId="2"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Desembolso Real"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Análisis Detallado por Proyecto */}
      <EmprestitoProjectAnalysis 
        data={flujoCajaData?.data || []}
        selectedBancos={selectedBancos}
        selectedOrganismos={selectedOrganismos}
      />
    </div>
  )
}

export default EmprestitoFlujoCajaDashboard
