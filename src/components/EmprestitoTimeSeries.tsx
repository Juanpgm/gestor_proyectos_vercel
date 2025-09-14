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
import { EmprestitoData } from '@/hooks/useEmprestito'

interface EmprestitoTimeSeriesProps {
  data: EmprestitoData
  loading?: boolean
}

const EmprestitoTimeSeries: React.FC<EmprestitoTimeSeriesProps> = ({
  data,
  loading = false
}) => {
  // Procesar datos para serie de tiempo distribuyendo valores por duración de contratos
  const timeSeriesData = React.useMemo(() => {
    if (!data.contratos || data.contratos.length === 0) {
      return []
    }

    // Crear estructura de datos por mes
    const monthlyData = new Map<string, {
      periodo: string
      valorContratoPeriodo: number
      valorFacturadoPeriodo: number
      valorPagadoPeriodo: number
      valorContratoAcumulado: number
      valorFacturadoAcumulado: number
      valorPagadoAcumulado: number
      contratosFirmados: number
      contratosActivos: number
      ejecucionPresupuestal: number
      nivelPagos: number
    }>()

    // Generar meses desde enero 2023 hasta diciembre 2025
    const startDate = new Date(2023, 0, 1)
    const endDate = new Date(2025, 11, 31)
    const currentDate = new Date(startDate)

    // Inicializar todos los meses
    while (currentDate <= endDate) {
      const periodo = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      monthlyData.set(periodo, {
        periodo: periodo.replace('-', '/'),
        valorContratoPeriodo: 0,
        valorFacturadoPeriodo: 0,
        valorPagadoPeriodo: 0,
        valorContratoAcumulado: 0,
        valorFacturadoAcumulado: 0,
        valorPagadoAcumulado: 0,
        contratosFirmados: 0,
        contratosActivos: 0,
        ejecucionPresupuestal: 0,
        nivelPagos: 0
      })
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Función para obtener la duración en meses entre dos fechas
    const getMonthsBetween = (startDate: Date, endDate: Date): number => {
      const years = endDate.getFullYear() - startDate.getFullYear()
      const months = endDate.getMonth() - startDate.getMonth()
      return years * 12 + months + 1 // +1 para incluir el mes de inicio
    }

    // Función para generar array de períodos entre dos fechas
    const getPeriodsInRange = (startDate: Date, endDate: Date): string[] => {
      const periods: string[] = []
      const current = new Date(startDate)
      
      while (current <= endDate) {
        const periodo = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
        periods.push(periodo)
        current.setMonth(current.getMonth() + 1)
      }
      
      return periods
    }

    // Procesar cada contrato y distribuir valores durante su vigencia
    data.contratos.forEach(contrato => {
      // Determinar fechas de inicio y fin
      let fechaInicio: Date | null = null
      let fechaFin: Date | null = null

      // Priorizar fecha_de_firma como inicio si no hay fecha de inicio específica
      if (contrato.fecha_de_firma) {
        fechaInicio = new Date(contrato.fecha_de_firma)
      }

      // Usar fecha_de_fin_del_contrato como fin
      if (contrato.fecha_de_fin_del_contrato) {
        fechaFin = new Date(contrato.fecha_de_fin_del_contrato)
      }

      // Solo procesar si tenemos ambas fechas
      if (fechaInicio && fechaFin && fechaInicio <= fechaFin) {
        // Calcular duración en meses
        const duracionMeses = getMonthsBetween(fechaInicio, fechaFin)
        
        // Distribuir valores mensualmente
        const valorMensualContrato = (contrato.valor_del_contrato || 0) / duracionMeses
        const valorMensualFacturado = (contrato.valor_facturado || 0) / duracionMeses
        const valorMensualPagado = (contrato.valor_pagado || 0) / duracionMeses

        // Obtener todos los períodos en el rango del contrato
        const periodosContrato = getPeriodsInRange(fechaInicio, fechaFin)

        // Distribuir valores en cada período
        periodosContrato.forEach((periodo, index) => {
          const monthData = monthlyData.get(periodo)
          if (monthData) {
            monthData.valorContratoPeriodo += valorMensualContrato
            monthData.valorFacturadoPeriodo += valorMensualFacturado
            monthData.valorPagadoPeriodo += valorMensualPagado
            monthData.contratosActivos += 1

            // Contar como contrato firmado solo en el primer mes
            if (index === 0) {
              monthData.contratosFirmados += 1
            }
          }
        })
      } else {
        // Fallback: si no hay fechas válidas, asignar al mes de firma
        if (contrato.fecha_de_firma) {
          const fechaFirma = new Date(contrato.fecha_de_firma)
          const periodo = `${fechaFirma.getFullYear()}-${String(fechaFirma.getMonth() + 1).padStart(2, '0')}`
          
          const existing = monthlyData.get(periodo)
          if (existing) {
            existing.valorContratoPeriodo += contrato.valor_del_contrato || 0
            existing.valorFacturadoPeriodo += contrato.valor_facturado || 0
            existing.valorPagadoPeriodo += contrato.valor_pagado || 0
            existing.contratosFirmados += 1
            existing.contratosActivos += 1
          }
        }
      }
    })

    // Calcular acumulados y métricas
    let valorContratoAcum = 0
    let valorFacturadoAcum = 0
    let valorPagadoAcum = 0

    const sortedPeriods = Array.from(monthlyData.keys()).sort()
    
    sortedPeriods.forEach(periodo => {
      const data = monthlyData.get(periodo)!
      
      // Acumular valores
      valorContratoAcum += data.valorContratoPeriodo
      valorFacturadoAcum += data.valorFacturadoPeriodo
      valorPagadoAcum += data.valorPagadoPeriodo
      
      // Actualizar datos acumulados
      data.valorContratoAcumulado = valorContratoAcum
      data.valorFacturadoAcumulado = valorFacturadoAcum
      data.valorPagadoAcumulado = valorPagadoAcum
      
      // Calcular métricas de ejecución
      data.ejecucionPresupuestal = valorContratoAcum > 0 ? (valorFacturadoAcum / valorContratoAcum) * 100 : 0
      data.nivelPagos = valorFacturadoAcum > 0 ? (valorPagadoAcum / valorFacturadoAcum) * 100 : 0
    })

    // Convertir a array y filtrar períodos con datos
    const timeSeriesArray = Array.from(monthlyData.values())
      .filter(data => data.valorContratoAcumulado > 0 || data.valorFacturadoAcumulado > 0 || data.valorPagadoAcumulado > 0)
      .slice(-36) // Últimos 36 meses

    return timeSeriesArray
  }, [data.contratos])

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

  // Calcular máximos para colores dinámicos
  const maxValorContrato = Math.max(...timeSeriesData.map(d => d.valorContratoPeriodo))
  const maxValorFacturado = Math.max(...timeSeriesData.map(d => d.valorFacturadoPeriodo))
  const maxValorPagado = Math.max(...timeSeriesData.map(d => d.valorPagadoPeriodo))

    // Datos enriquecidos con colores
    const enrichedData = timeSeriesData.map(data => ({
      ...data,
      colorContrato: getColorIntensity(data.valorContratoPeriodo, maxValorContrato, [37, 99, 235]), // Blue
      colorFacturado: getColorIntensity(data.valorFacturadoPeriodo, maxValorFacturado, [234, 179, 8]), // Yellow
      colorPagado: getColorIntensity(data.valorPagadoPeriodo, maxValorPagado, [22, 163, 74]), // Green
      
      // Formateo para tooltips
      valorContratoFormatted: formatNumber(data.valorContratoPeriodo, 'currency'),
      valorFacturadoFormatted: formatNumber(data.valorFacturadoPeriodo, 'currency'),
      valorPagadoFormatted: formatNumber(data.valorPagadoPeriodo, 'currency'),
      valorContratoAcumFormatted: formatNumber(data.valorContratoAcumulado, 'currency'),
      valorFacturadoAcumFormatted: formatNumber(data.valorFacturadoAcumulado, 'currency'),
      valorPagadoAcumFormatted: formatNumber(data.valorPagadoAcumulado, 'currency'),
      ejecucionPresupuestalFormatted: `${data.ejecucionPresupuestal.toFixed(1)}%`,
      nivelPagosFormatted: `${data.nivelPagos.toFixed(1)}%`
    }))

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          
          <div className="space-y-1 text-sm">
            <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">Valores Distribuidos del Período:</div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-blue-600 dark:text-blue-400">Valor Contrato:</span>
              <span className="font-medium">{data.valorContratoFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-yellow-600 dark:text-yellow-400">Facturado:</span>
              <span className="font-medium">{data.valorFacturadoFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-green-600 dark:text-green-400">Pagado:</span>
              <span className="font-medium">{data.valorPagadoFormatted}</span>
            </div>
            
            <div className="text-gray-600 dark:text-gray-400 font-medium mb-1 mt-3">Valores Acumulados:</div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-blue-600 dark:text-blue-400">Total Contratos:</span>
              <span className="font-medium">{data.valorContratoAcumFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-yellow-600 dark:text-yellow-400">Total Facturado:</span>
              <span className="font-medium">{data.valorFacturadoAcumFormatted}</span>
            </div>
            <div className="flex justify-between items-center ml-2">
              <span className="text-green-600 dark:text-green-400">Total Pagado:</span>
              <span className="font-medium">{data.valorPagadoAcumFormatted}</span>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Ejecución Presupuestal:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{data.ejecucionPresupuestalFormatted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Nivel de Pagos:</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">{data.nivelPagosFormatted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contratos Activos:</span>
                <span className="font-medium">{data.contratosActivos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Contratos Firmados:</span>
                <span className="font-medium">{data.contratosFirmados}</span>
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
            Valores distribuidos mensualmente durante la vigencia de contratos (barras) y acumulados históricos (líneas)
          </p>
        </div>
      </div>

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
            
            {/* Barras para valores del período */}
            <Bar 
              yAxisId="right"
              dataKey="valorContratoPeriodo" 
              name="Valor Contrato (Período)"
              opacity={0.8}
            >
              {enrichedData.map((entry, index) => (
                <Cell key={`cell-contrato-${index}`} fill={entry.colorContrato} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="valorFacturadoPeriodo" 
              name="Valor Facturado (Período)"
              opacity={0.8}
            >
              {enrichedData.map((entry, index) => (
                <Cell key={`cell-facturado-${index}`} fill={entry.colorFacturado} />
              ))}
            </Bar>
            <Bar 
              yAxisId="right"
              dataKey="valorPagadoPeriodo" 
              name="Valor Pagado (Período)"
              opacity={0.8}
            >
              {enrichedData.map((entry, index) => (
                <Cell key={`cell-pagado-${index}`} fill={entry.colorPagado} />
              ))}
            </Bar>
            
            {/* Líneas para valores acumulados */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="valorContratoAcumulado" 
              stroke="#2563EB"
              strokeWidth={3}
              name="Valor Contrato (Acumulado)"
              dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="valorFacturadoAcumulado" 
              stroke="#EAB308"
              strokeWidth={3}
              name="Valor Facturado (Acumulado)"
              dot={{ fill: "#EAB308", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="valorPagadoAcumulado" 
              stroke="#16A34A"
              strokeWidth={3}
              name="Valor Pagado (Acumulado)"
              dot={{ fill: "#16A34A", strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export default EmprestitoTimeSeries
