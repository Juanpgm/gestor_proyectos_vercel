'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  PieChart,
  BarChart3,
  Building2,
  Banknote,
  FileText,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  Building,
  Target,
  Layers
} from 'lucide-react'
import { 
  useEmprestitoBP, 
  useAnalisisPorBP, 
  useTotalesGenerales,
  useEmprestitoPagos,
  useEmprestitoPagosAll,
  AnalisisPorBP 
} from '@/hooks/useEmprestitoBP'

// Interface para contratos del endpoint
interface ContratoBP {
  bp: string
  banco: string
  nombre_centro_gestor: string
  nombre_resumido_proceso: string
  tipo_contrato: string
  urlproceso: any
  valor_contrato: number
  fecha_inicio_contrato: string | null
  fecha_fin_contrato: string | null
  sector: string
}

// Función para formatear montos con notación dinámica
const formatMonto = (valor: number): { valor: string; unidad: string } => {
  const absValor = Math.abs(valor)
  
  if (absValor >= 1_000_000_000_000) {
    // Billones (colombiano): 1,000,000,000,000
    return {
      valor: (valor / 1_000_000_000_000).toFixed(3),
      unidad: 'Billones'
    }
  } else if (absValor >= 1_000_000_000) {
    // Miles de millones: 1,000,000,000
    return {
      valor: (valor / 1_000_000_000).toFixed(3),
      unidad: 'Mil M'
    }
  } else if (absValor >= 1_000_000) {
    // Millones: 1,000,000
    return {
      valor: (valor / 1_000_000).toFixed(3),
      unidad: 'MM'
    }
  } else if (absValor >= 1_000) {
    // Miles
    return {
      valor: (valor / 1_000).toFixed(3),
      unidad: 'Mil'
    }
  } else {
    return {
      valor: valor.toFixed(0),
      unidad: ''
    }
  }
}

// Colores para los bancos
const BANK_COLORS: Record<string, string> = {
  'Bancolombia': '#1e3a8a',
  'Davivienda': '#dc2626',
  'BBVA': '#16a34a',
  'Banco de Occidente': '#eab308',
  'Banco Occidente': '#eab308',
  'Davivienda - (Otro sí)': '#f97316',
  'IFC': '#8b5cf6',
}

const getColorForBank = (banco: string, index: number): string => {
  const defaultColors = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6']
  return BANK_COLORS[banco] || defaultColors[index % defaultColors.length]
}

// Componente de tarjeta de métrica mejorado
const MetricCard: React.FC<{
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  variant?: 'primary' | 'success' | 'danger' | 'info'
}> = React.memo(({ title, value, subtitle, icon: Icon, variant = 'info' }) => {
  const iconColors = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400',
    info: 'text-gray-500 dark:text-gray-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 h-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold mb-1 uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <Icon className={`w-6 h-6 ${iconColors[variant]}`} />
      </div>
    </motion.div>
  )
})

MetricCard.displayName = 'MetricCard'

// Componente de gráfica de donut (participación por banco) - SVG real
const DonutChartSVG: React.FC<{
  data: { banco: string; monto: number; porcentaje: number }[]
  title: string
  totalLabel?: string
}> = React.memo(({ data, title, totalLabel }) => {
  const total = data.reduce((sum, item) => sum + item.monto, 0)
  const totalFormateado = formatMonto(total)
  const radius = 120
  const strokeWidth = 35
  const circumference = 2 * Math.PI * radius
  
  let currentOffset = 0
  const segments = data.map((item, index) => {
    const segmentLength = (item.porcentaje / 100) * circumference
    const segment = {
      ...item,
      offset: currentOffset,
      length: segmentLength,
      color: getColorForBank(item.banco, index)
    }
    currentOffset += segmentLength
    return segment
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {title}
      </h3>
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0">
          <svg width="300" height="300" viewBox="0 0 300 300" className="transform -rotate-90">
            {segments.map((segment, index) => (
              <circle
                key={segment.banco}
                cx="150"
                cy="150"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {totalLabel && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${totalFormateado.valor}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalFormateado.unidad} Total</p>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-3 w-full">
          {data.map((item, index) => {
            const montoFormateado = formatMonto(item.monto)
            return (
              <div key={item.banco} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getColorForBank(item.banco, index) }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {item.banco}
                  </span>
                </div>
                <div className="text-right text-sm ml-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.porcentaje.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    (${montoFormateado.valor} {montoFormateado.unidad})
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

DonutChartSVG.displayName = 'DonutChartSVG'

// Componente de barras para bancos con adjudicado y pagos
const BankBarChart: React.FC<{
  data: { banco: string; monto: number; porcentaje: number }[]
  title: string
}> = React.memo(({ data, title }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {data.map((item, index) => {
          const montoFormateado = formatMonto(item.monto)
          return (
            <div key={item.banco} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300" title={item.banco}>
                  {item.banco}
                </span>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {item.porcentaje.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    (${montoFormateado.valor} {montoFormateado.unidad})
                  </span>
                </div>
              </div>
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.porcentaje}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

BankBarChart.displayName = 'BankBarChart'

// Componente de barras horizontales para presupuesto por organismo
const HorizontalBarChart: React.FC<{
  data: { organismo: string; monto: number; porcentaje: number }[]
  title: string
}> = React.memo(({ data, title }) => {
  const topData = data.slice(0, 12)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {topData.map((item, index) => {
          const montoFormateado = formatMonto(item.monto)
          return (
            <div key={item.organismo} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-300" title={item.organismo}>
                  {item.organismo}
                </span>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {item.porcentaje.toFixed(1)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    (${montoFormateado.valor} {montoFormateado.unidad})
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

HorizontalBarChart.displayName = 'HorizontalBarChart'

// Componente de Gauge para % de ejecución
const GaugeChart: React.FC<{
  percentage: number
  title: string
  brecha: number
}> = React.memo(({ percentage, title, brecha }) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)
  const angle = (clampedPercentage / 100) * 180 - 90
  
  const getColor = (p: number) => {
    if (p >= 80) return '#22c55e' // green
    if (p >= 50) return '#eab308' // yellow
    return '#ef4444' // red
  }

  const getLabel = (p: number) => {
    if (p >= 80) return 'ACEPTABLE'
    if (p >= 50) return 'EN PROGRESO'
    return 'CRÍTICO'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
        {title}
      </h3>
      <div className="relative w-48 h-28 mx-auto">
        {/* Background arc */}
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Red zone */}
          <path
            d="M 20 100 A 80 80 0 0 1 74 32"
            fill="none"
            stroke="#ef4444"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Yellow zone */}
          <path
            d="M 74 32 A 80 80 0 0 1 126 32"
            fill="none"
            stroke="#eab308"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Green zone */}
          <path
            d="M 126 32 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#22c55e"
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
            stroke="#1f2937"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <circle cx="100" cy="100" r="8" fill="#1f2937" />
        </svg>
      </div>
      <div className="text-center mt-2">
        <p className="text-3xl font-bold" style={{ color: getColor(clampedPercentage) }}>
          {clampedPercentage.toFixed(1)}%
        </p>
        <p className="text-sm font-medium" style={{ color: getColor(clampedPercentage) }}>
          {getLabel(clampedPercentage)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Brecha de Adjudicación: <span className="font-semibold text-red-500">
            ${(() => { const f = formatMonto(Math.abs(brecha)); return `${f.valor} ${f.unidad}` })()}
          </span>
        </p>
      </div>
    </div>
  )
})

GaugeChart.displayName = 'GaugeChart'

// Componente de acordeón para Centro Gestor con subagrupación por banco
const CentroGestorConBancosAccordion: React.FC<{
  centroGestor: string
  bpsPorBanco: Array<{ banco: string; bps: AnalisisPorBP[] }>
  totales: { programado: number; adjudicado: number; brecha: number }
}> = React.memo(({ centroGestor, bpsPorBanco, totales }) => {
  const porcentaje = totales.programado > 0 ? (totales.adjudicado / totales.programado) * 100 : 0
  const totalBPs = bpsPorBanco.reduce((sum, g) => sum + g.bps.length, 0)

  const getColorForBank = (banco: string) => {
    const colors: Record<string, string> = {
      'Davivienda': '#EF4444',
      'Bancolombia': '#FBBF24',
      'BBVA': '#3B82F6',
      'Banco Occidente': '#8B5CF6',
      'Davivienda - (Otro sí)': '#EC4899',
    }
    return colors[banco] || '#6B7280'
  }

  return (
    <details className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      <summary className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center gap-3">
          <ChevronRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform" />
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{centroGestor}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                {totalBPs} BP{totalBPs !== 1 ? 's' : ''}
              </span>
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                {bpsPorBanco.length} banco{bpsPorBanco.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-xs text-gray-500">Programado</span>
            <p className="font-bold text-gray-900 dark:text-white">
              ${(() => { const f = formatMonto(totales.programado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <span className="text-xs text-gray-500">Adjudicado</span>
            <p className="font-bold text-green-600 dark:text-green-400">
              ${(() => { const f = formatMonto(totales.adjudicado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className={`text-sm font-bold px-3 py-1 rounded ${
            porcentaje >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            porcentaje >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {porcentaje.toFixed(1)}%
          </div>
        </div>
      </summary>
      <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
        {bpsPorBanco.map(({ banco, bps }) => {
          const totalProgramadoBanco = bps.reduce((sum, bp) => sum + bp.monto_programado, 0)
          const totalAdjudicadoBanco = bps.reduce((sum, bp) => sum + bp.monto_adjudicado, 0)
          const porcentajeBanco = totalProgramadoBanco > 0 ? (totalAdjudicadoBanco / totalProgramadoBanco) * 100 : 0

          return (
            <details key={banco} className="group/banco border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <summary className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-500 group-open/banco:rotate-90 transition-transform" />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getColorForBank(banco) }}
                  />
                  <Banknote className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{banco}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {bps.length} BP
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                    ${(() => { const f = formatMonto(totalProgramadoBanco); return `${f.valor} ${f.unidad}` })()}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    porcentajeBanco >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    porcentajeBanco >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {porcentajeBanco.toFixed(1)}%
                  </span>
                </div>
              </summary>
              <div className="p-2 space-y-1 bg-gray-50 dark:bg-gray-700/20">
                {bps.map(bp => {
                  const porcentajeBP = bp.monto_programado > 0 
                    ? (bp.monto_adjudicado / bp.monto_programado) * 100 
                    : 0

                  return (
                    <div key={bp.bp} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                          {bp.bp.slice(-4)}
                        </div>
                        <div>
                          <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{bp.bp}</span>
                          {bp.contratos.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {bp.contratos.length} contrato{bp.contratos.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-gray-500">Programado</div>
                          <div className="font-medium text-gray-900 dark:text-white text-xs">
                            ${(() => { const f = formatMonto(bp.monto_programado); return `${f.valor} ${f.unidad}` })()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Adjudicado</div>
                          <div className="font-semibold text-green-600 dark:text-green-400 text-xs">
                            ${(() => { const f = formatMonto(bp.monto_adjudicado); return `${f.valor} ${f.unidad}` })()}
                          </div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded ${
                          porcentajeBP >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          porcentajeBP >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {porcentajeBP.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </details>
  )
})

CentroGestorConBancosAccordion.displayName = 'CentroGestorConBancosAccordion'

// Componente de acordeón para Centro Gestor
const CentroGestorAccordion: React.FC<{
  centroGestor: string
  bps: AnalisisPorBP[]
  totales: { programado: number; adjudicado: number; brecha: number }
}> = React.memo(({ centroGestor, bps, totales }) => {
  const [expanded, setExpanded] = useState(false)
  const porcentaje = totales.programado > 0 ? (totales.adjudicado / totales.programado) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-teal-500" />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{centroGestor}</h4>
            <p className="text-xs text-gray-500">{bps.length} proyectos BP</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Programado</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              ${(() => { const f = formatMonto(totales.programado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Adjudicado</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ${(() => { const f = formatMonto(totales.adjudicado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ejecución</p>
            <p className={`text-sm font-bold ${
              porcentaje >= 80 ? 'text-green-600' :
              porcentaje >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {porcentaje.toFixed(1)}%
            </p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-2">
              {bps.map(bp => {
                const porcentajeBP = bp.monto_programado > 0 ? (bp.monto_adjudicado / bp.monto_programado) * 100 : 0
                return (
                  <div key={bp.bp} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {bp.bp.slice(-4)}
                        </div>
                        <div>
                          <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{bp.bp}</span>
                          {bp.contratos.length > 0 && (
                            <p className="text-xs text-gray-500">{bp.contratos.length} contrato{bp.contratos.length > 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Programado</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${(() => { const f = formatMonto(bp.monto_programado); return `${f.valor} ${f.unidad}` })()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Adjudicado</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${(() => { const f = formatMonto(bp.monto_adjudicado); return `${f.valor} ${f.unidad}` })()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Ejecución</p>
                          <p className={`text-sm font-bold ${
                            porcentajeBP >= 80 ? 'text-green-600' :
                            porcentajeBP >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {porcentajeBP.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

CentroGestorAccordion.displayName = 'CentroGestorAccordion'

// Componente de acordeón para Banco
const BancoAccordion: React.FC<{
  banco: string
  bps: AnalisisPorBP[]
  totales: { programado: number; adjudicado: number }
}> = React.memo(({ banco, bps, totales }) => {
  const [expanded, setExpanded] = useState(false)
  const porcentaje = totales.programado > 0 ? (totales.adjudicado / totales.programado) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: getColorForBank(banco, 0) }}
          />
          <div className="text-left">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{banco}</h4>
            <p className="text-xs text-gray-500">{bps.length} proyectos BP</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Programado</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              ${(() => { const f = formatMonto(totales.programado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Adjudicado</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              ${(() => { const f = formatMonto(totales.adjudicado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ejecución</p>
            <p className={`text-sm font-bold ${
              porcentaje >= 80 ? 'text-green-600' :
              porcentaje >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {porcentaje.toFixed(1)}%
            </p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-2">
              {bps.map(bp => {
                const porcentajeBP = bp.monto_programado > 0 ? (bp.monto_adjudicado / bp.monto_programado) * 100 : 0
                return (
                  <div key={bp.bp} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {bp.bp.slice(-4)}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{bp.bp}</span>
                          <p className="text-xs text-gray-500">{bp.nombre_centro_gestor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Programado</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            ${(() => { const f = formatMonto(bp.monto_programado); return `${f.valor} ${f.unidad}` })()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Adjudicado</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${(() => { const f = formatMonto(bp.monto_adjudicado); return `${f.valor} ${f.unidad}` })()}
                          </p>
                        </div>
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Ejecución</p>
                          <p className={`text-sm font-bold ${
                            porcentajeBP >= 80 ? 'text-green-600' :
                            porcentajeBP >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {porcentajeBP.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

BancoAccordion.displayName = 'BancoAccordion'

// Componente de detalle de BP individual
const BPDetailCard: React.FC<{ analisis: AnalisisPorBP }> = React.memo(({ analisis }) => {
  const [expanded, setExpanded] = useState(false)
  const porcentaje = analisis.monto_programado > 0 
    ? (analisis.monto_adjudicado / analisis.monto_programado) * 100 
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-4"
      >
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
              {analisis.bp.slice(-4)}
            </div>
          </div>
          <div className="text-left flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {analisis.bp}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
              {analisis.nombre_centro_gestor}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Programado</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${(() => { const f = formatMonto(analisis.monto_programado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Adjudicado</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ${(() => { const f = formatMonto(analisis.monto_adjudicado); return `${f.valor} ${f.unidad}` })()}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ejecución</p>
            <p className={`text-lg font-bold \${
              porcentaje >= 80 ? 'text-green-600' :
              porcentaje >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {porcentaje.toFixed(1)}%
            </p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 sm:px-6 py-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DonutChartSVG
                  data={analisis.participacion_bancos}
                  title="Distribución por Banco"
                  totalLabel="Total"
                />
                <HorizontalBarChart
                  data={analisis.presupuesto_organismos}
                  title="Presupuesto por Organismo"
                />
              </div>

              {analisis.contratos.length > 0 && (
                <div className="mt-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-600 rounded-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contratos</p>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analisis.contratos.length}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          ${(() => { 
                            const total = analisis.contratos.reduce((sum, c) => sum + c.valor_contrato, 0)
                            const f = formatMonto(total)
                            return `${f.valor} ${f.unidad}` 
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

BPDetailCard.displayName = 'BPDetailCard'

// Componente principal
const EmprestitoAnalisisProyectosBP: React.FC = () => {
  const { procesos, contratos, asignaciones, loading, error } = useEmprestitoBP()
  const { pagos } = useEmprestitoPagos()
  const { pagos: pagosEmprestito } = useEmprestitoPagosAll()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBancos, setSelectedBancos] = useState<string[]>([])
  const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<string[]>([])
  const [selectedAnios, setSelectedAnios] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<'bp' | 'banco'>('bp')
  const [dataMode, setDataMode] = useState<'programado' | 'adjudicado'>('adjudicado')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [contratosBP, setContratosBP] = useState<ContratoBP[]>([])

  // Cargar contratos desde el endpoint
  React.useEffect(() => {
    const fetchContratosBP = async () => {
      try {
        const response = await fetch('https://gestorproyectoapi-production.up.railway.app/emprestito/obtener-contratos-bp')
        const result = await response.json()
        if (result.success && result.data) {
          setContratosBP(result.data)
        }
      } catch (error) {
        console.error('Error al cargar contratos BP:', error)
      }
    }
    fetchContratosBP()
  }, [])

  // Convertir selectedAnios para el hook - si no hay años seleccionados, usar 'all'
  const filtroAnio = selectedAnios.length === 0 ? 'all' : selectedAnios[0]
  
  // El hook ahora recibe el filtro de año
  const analisisPorBP = useAnalisisPorBP(procesos, contratos, asignaciones, filtroAnio)
  const totales = useTotalesGenerales(analisisPorBP)

  // Obtener años únicos
  const anios = useMemo(() => {
    const aniosSet = new Set<number>()
    asignaciones.forEach(a => {
      if (a.anio) aniosSet.add(a.anio)
    })
    return Array.from(aniosSet).sort((a, b) => b - a)
  }, [asignaciones])

  // Obtener lista única de bancos
  const bancos = useMemo(() => {
    const bancosSet = new Set<string>()
    asignaciones.forEach(a => bancosSet.add(a.banco))
    return Array.from(bancosSet).sort()
  }, [asignaciones])

  // Obtener lista única de centros gestores
  const centrosGestores = useMemo(() => {
    const centrosSet = new Set<string>()
    analisisPorBP.forEach(a => centrosSet.add(a.nombre_centro_gestor))
    return Array.from(centrosSet).sort()
  }, [analisisPorBP])

  // Filtrar análisis
  const analisisFiltrado = useMemo(() => {
    return analisisPorBP.filter(analisis => {
      const matchSearch = analisis.bp.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analisis.nombre_centro_gestor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchBanco = selectedBancos.length === 0 || 
                        analisis.participacion_bancos.some(b => selectedBancos.includes(b.banco))

      const matchCentroGestor = selectedCentrosGestores.length === 0 ||
                                selectedCentrosGestores.includes(analisis.nombre_centro_gestor)

      return matchSearch && matchBanco && matchCentroGestor
    })
  }, [analisisPorBP, searchTerm, selectedBancos, selectedCentrosGestores])

  // Totales filtrados
  const totalesFiltrados = useMemo(() => {
    const totalProgramado = analisisFiltrado.reduce((sum, a) => sum + a.monto_programado, 0)
    const totalAdjudicado = analisisFiltrado.reduce((sum, a) => sum + a.monto_adjudicado, 0)
    return {
      totalProgramado,
      totalAdjudicado,
      brecha: totalProgramado - totalAdjudicado,
      porcentaje: totalProgramado > 0 ? (totalAdjudicado / totalProgramado) * 100 : 0,
      cantidadBPs: analisisFiltrado.length,
      cantidadContratos: analisisFiltrado.reduce((sum, a) => sum + a.contratos.length, 0)
    }
  }, [analisisFiltrado])

  // Participación global por banco (usando adjudicado real)
  const participacionBancosAdjudicado = useMemo(() => {
    const montosPorBanco = new Map<string, number>()
    
    // Iterar sobre los análisis filtrados y sus contratos
    analisisFiltrado.forEach(analisis => {
      analisis.contratos.forEach(contrato => {
        const banco = contrato.banco || 'Sin banco'
        const actual = montosPorBanco.get(banco) || 0
        montosPorBanco.set(banco, actual + (contrato.valor_contrato || 0))
      })
    })
    
    const total = Array.from(montosPorBanco.values()).reduce((sum, m) => sum + m, 0)
    return Array.from(montosPorBanco.entries())
      .map(([banco, monto]) => ({
        banco,
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto)
  }, [analisisFiltrado])

  // Participación global por banco (usando programado)
  const participacionBancosProgramado = useMemo(() => {
    const montosPorBanco = new Map<string, number>()
    
    analisisFiltrado.forEach(analisis => {
      analisis.participacion_bancos.forEach(pb => {
        const actual = montosPorBanco.get(pb.banco) || 0
        montosPorBanco.set(pb.banco, actual + pb.monto)
      })
    })
    
    const total = Array.from(montosPorBanco.values()).reduce((sum, m) => sum + m, 0)
    return Array.from(montosPorBanco.entries())
      .map(([banco, monto]) => ({
        banco,
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto)
  }, [analisisFiltrado])

  const participacionBancosGlobal = dataMode === 'adjudicado' ? participacionBancosAdjudicado : participacionBancosProgramado

  // Presupuesto global por organismo (usando adjudicado real)
  const presupuestoOrganismosAdjudicado = useMemo(() => {
    const montosPorOrganismo = new Map<string, number>()
    
    // Agrupar por organismo usando el monto adjudicado ya calculado
    analisisFiltrado.forEach(analisis => {
      const organismo = analisis.nombre_centro_gestor || 'Sin organismo'
      const actual = montosPorOrganismo.get(organismo) || 0
      montosPorOrganismo.set(organismo, actual + analisis.monto_adjudicado)
    })
    
    const total = Array.from(montosPorOrganismo.values()).reduce((sum, m) => sum + m, 0)
    return Array.from(montosPorOrganismo.entries())
      .map(([organismo, monto]) => ({
        organismo,
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto)
  }, [analisisFiltrado])

  // Presupuesto global por organismo (usando programado)
  const presupuestoOrganismosProgramado = useMemo(() => {
    const montosPorOrganismo = new Map<string, number>()
    
    analisisFiltrado.forEach(analisis => {
      const organismo = analisis.nombre_centro_gestor || 'Sin organismo'
      const actual = montosPorOrganismo.get(organismo) || 0
      montosPorOrganismo.set(organismo, actual + analisis.monto_programado)
    })
    
    const total = Array.from(montosPorOrganismo.values()).reduce((sum, m) => sum + m, 0)
    return Array.from(montosPorOrganismo.entries())
      .map(([organismo, monto]) => ({
        organismo,
        monto,
        porcentaje: total > 0 ? (monto / total) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto)
  }, [analisisFiltrado])

  const presupuestoOrganismosGlobal = dataMode === 'adjudicado' ? presupuestoOrganismosAdjudicado : presupuestoOrganismosProgramado

  // Pagos filtrados por BPs seleccionados
  const pagosFiltrrados = useMemo(() => {
    const bpsSet = new Set(analisisFiltrado.map(a => a.bp))
    return pagos.filter(pago => bpsSet.has(pago.bp))
  }, [pagos, analisisFiltrado])

  // Pagos por organismo para las gráficas
  const pagosPorOrganismo = useMemo(() => {
    return pagosFiltrrados.map(p => ({
      organismo: p.nombre_centro_gestor,
      monto: p.valor_pago
    }))
  }, [pagosFiltrrados])

  const totalesPagos = useMemo(() => {
    const totalPagado = pagosFiltrrados.reduce((sum, p) => sum + p.valor_pago, 0)
    return {
      totalPagado,
      cantidadPagos: pagosFiltrrados.length,
      conDocumentos: pagosFiltrrados.filter(p => p.tiene_documentos_soporte).length
    }
  }, [pagosFiltrrados])

  // Métricas para Pagos y Desembolsos (nueva sección)
  const metricasPagosDesembolsos = useMemo(() => {
    // Filtrar asignaciones por años seleccionados
    const asignacionesFiltradas = selectedAnios.length > 0
      ? asignaciones.filter(a => selectedAnios.includes(a.anio))
      : asignaciones

    // Total pagado desde pagos empréstito
    const pagosEmprestitoFiltrados = selectedAnios.length > 0
      ? pagosEmprestito.filter(p => {
          const year = new Date(p.fecha_transaccion).getFullYear()
          return selectedAnios.includes(year)
        })
      : pagosEmprestito

    const totalPagado = pagosEmprestitoFiltrados.reduce((sum, p) => sum + p.valor_pago, 0)
    
    // Total adjudicado (de los contratos filtrados)
    const totalAdjudicado = analisisFiltrado.reduce((sum, a) => sum + a.monto_adjudicado, 0)
    
    // Cuentas por pagar (diferencia entre adjudicado y pagado)
    const cuentasPorPagar = totalAdjudicado - totalPagado

    // Pagos por banco (relacionar pagos con bancos mediante BP)
    const pagosPorBanco = new Map<string, number>()
    
    pagosEmprestitoFiltrados.forEach(pago => {
      // Buscar el banco asociado al BP en las asignaciones
      const asignacionesBP = asignacionesFiltradas.filter(a => a.bp === pago.bp)
      asignacionesBP.forEach(asig => {
        const bancoActual = pagosPorBanco.get(asig.banco) || 0
        // Distribuir el pago proporcionalmente entre los bancos del BP
        const proporcion = asignacionesBP.length > 0 ? 1 / asignacionesBP.length : 1
        pagosPorBanco.set(asig.banco, bancoActual + (pago.valor_pago * proporcion))
      })
    })

    const pagosPorBancoArray = Array.from(pagosPorBanco.entries())
      .map(([banco, monto]) => ({
        banco,
        monto,
        porcentaje: totalPagado > 0 ? (monto / totalPagado) * 100 : 0
      }))
      .sort((a, b) => b.monto - a.monto)

    return {
      totalAdjudicado,
      totalPagado,
      cuentasPorPagar,
      cantidadPagos: pagosEmprestitoFiltrados.length,
      pagosPorBanco: pagosPorBancoArray,
      porcentajePagado: totalAdjudicado > 0 ? (totalPagado / totalAdjudicado) * 100 : 0
    }
  }, [analisisFiltrado, pagosEmprestito, selectedAnios, asignaciones])

  // Pagos por banco para las gráficas (usando metricasPagosDesembolsos) - MOVIDO DESPUÉS
  const pagosPorBancoParaGrafica = useMemo(() => {
    return metricasPagosDesembolsos.pagosPorBanco
  }, [metricasPagosDesembolsos])

  // Pagos agrupados por Centro Gestor, BP y Contratos para la tabla de la sección de pagos
  const pagosAgrupadosPorCentroGestor = useMemo(() => {
    // Filtrar pagos por años seleccionados
    const pagosFiltrados = selectedAnios.length > 0
      ? pagosEmprestito.filter(p => {
          const year = new Date(p.fecha_transaccion).getFullYear()
          return selectedAnios.includes(year)
        })
      : pagosEmprestito

    // Agrupar por centro gestor
    const grupos = new Map<string, {
      centroGestor: string
      totalPagado: number
      cantidadPagos: number
      bps: Map<string, { 
        bp: string; 
        totalPagado: number; 
        cantidadPagos: number;
        contratos: Map<string, { 
          numeroContrato: string; 
          totalPagado: number; 
          cantidadPagos: number;
          montoAdjudicado: number;
        }>
      }>
    }>()

    pagosFiltrados.forEach(pago => {
      const centroGestor = pago.nombre_centro_gestor || 'Sin Centro Gestor'
      
      if (!grupos.has(centroGestor)) {
        grupos.set(centroGestor, {
          centroGestor,
          totalPagado: 0,
          cantidadPagos: 0,
          bps: new Map()
        })
      }
      
      const grupo = grupos.get(centroGestor)!
      grupo.totalPagado += pago.valor_pago
      grupo.cantidadPagos += 1
      
      // Agrupar por BP dentro del centro gestor
      if (!grupo.bps.has(pago.bp)) {
        grupo.bps.set(pago.bp, { bp: pago.bp, totalPagado: 0, cantidadPagos: 0, contratos: new Map() })
      }
      const bpGrupo = grupo.bps.get(pago.bp)!
      bpGrupo.totalPagado += pago.valor_pago
      bpGrupo.cantidadPagos += 1
      
      // Agrupar por contrato dentro del BP
      const referenciaContrato = pago.referencia_contrato || 'Sin contrato'
      if (!bpGrupo.contratos.has(referenciaContrato)) {
        // Buscar el valor del contrato en contratosBP
        // Primero intentar por BP y nombre_resumido_proceso
        let contratoEncontrado = contratosBP.find(c => 
          c.bp === pago.bp && 
          c.nombre_resumido_proceso && 
          referenciaContrato.includes(c.nombre_resumido_proceso)
        )
        
        // Si no se encuentra, buscar solo por BP y tomar el primer contrato
        if (!contratoEncontrado) {
          contratoEncontrado = contratosBP.find(c => c.bp === pago.bp)
        }
        
        const montoAdjudicado = contratoEncontrado?.valor_contrato || 0
        
        bpGrupo.contratos.set(referenciaContrato, { 
          numeroContrato: referenciaContrato, 
          totalPagado: 0, 
          cantidadPagos: 0,
          montoAdjudicado
        })
      }
      const contratoGrupo = bpGrupo.contratos.get(referenciaContrato)!
      contratoGrupo.totalPagado += pago.valor_pago
      contratoGrupo.cantidadPagos += 1
    })

    // Convertir a array y ordenar
    return Array.from(grupos.values())
      .map(g => ({
        ...g,
        bps: Array.from(g.bps.values())
          .map(bp => ({
            ...bp,
            contratos: Array.from(bp.contratos.values()).sort((a, b) => b.totalPagado - a.totalPagado)
          }))
          .sort((a, b) => b.totalPagado - a.totalPagado)
      }))
      .sort((a, b) => b.totalPagado - a.totalPagado)
  }, [pagosEmprestito, selectedAnios, analisisPorBP, contratosBP])

  // Agrupar por Centro Gestor
  const agrupadoPorCentroGestor = useMemo(() => {
    const grupos = new Map<string, AnalisisPorBP[]>()
    analisisFiltrado.forEach(a => {
      const actual = grupos.get(a.nombre_centro_gestor) || []
      grupos.set(a.nombre_centro_gestor, [...actual, a])
    })
    return Array.from(grupos.entries())
      .map(([centro, bps]) => {
        // Organizar BPs por banco dentro del centro gestor
        const bpsPorBanco = new Map<string, AnalisisPorBP[]>()
        bps.forEach(bp => {
          // Obtener el banco principal (el de mayor participación)
          const bancoPrincipal = bp.participacion_bancos.length > 0 
            ? bp.participacion_bancos.sort((a, b) => b.monto - a.monto)[0].banco
            : 'Sin banco'
          const actualBanco = bpsPorBanco.get(bancoPrincipal) || []
          bpsPorBanco.set(bancoPrincipal, [...actualBanco, bp])
        })

        return {
          centro,
          bps,
          bpsPorBanco: Array.from(bpsPorBanco.entries())
            .map(([banco, bpsBanco]) => ({
              banco,
              bps: bpsBanco.sort((a, b) => b.monto_programado - a.monto_programado)
            }))
            .sort((a, b) => {
              const sumaA = a.bps.reduce((sum, bp) => sum + bp.monto_programado, 0)
              const sumaB = b.bps.reduce((sum, bp) => sum + bp.monto_programado, 0)
              return sumaB - sumaA
            }),
          totales: {
            programado: bps.reduce((sum, b) => sum + b.monto_programado, 0),
            adjudicado: bps.reduce((sum, b) => sum + b.monto_adjudicado, 0),
            brecha: bps.reduce((sum, b) => sum + b.brecha, 0)
          }
        }
      })
      .sort((a, b) => b.totales.programado - a.totales.programado)
  }, [analisisFiltrado])

  // Agrupar por Banco
  const agrupadoPorBanco = useMemo(() => {
    const grupos = new Map<string, AnalisisPorBP[]>()
    analisisFiltrado.forEach(a => {
      a.participacion_bancos.forEach(pb => {
        const actual = grupos.get(pb.banco) || []
        if (!actual.some(x => x.bp === a.bp)) {
          grupos.set(pb.banco, [...actual, a])
        }
      })
    })
    return Array.from(grupos.entries())
      .map(([banco, bps]) => ({
        banco,
        bps,
        totales: {
          programado: bps.reduce((sum, b) => sum + b.monto_programado, 0),
          adjudicado: bps.reduce((sum, b) => sum + b.monto_adjudicado, 0)
        }
      }))
      .sort((a, b) => b.totales.programado - a.totales.programado)
  }, [analisisFiltrado])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando análisis de proyectos BP...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Error al cargar datos: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
              RESUMEN EJECUTIVO DE EJECUCIÓN {selectedAnios.length > 0 ? selectedAnios.join(', ') : ''}
            </h1>
            <p className="text-blue-100 text-lg">Análisis detallado por Proyecto de Inversión (BP)</p>
          </div>
          
          {/* Botón de Filtro Flotante */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                showFilterPanel || selectedBancos.length > 0 || selectedAnios.length > 0 || selectedCentrosGestores.length > 0
                  ? 'bg-white text-blue-700 shadow-lg'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="font-semibold">Filtros</span>
              {(selectedBancos.length > 0 || selectedAnios.length > 0 || selectedCentrosGestores.length > 0) && (
                <span className="bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {selectedBancos.length + selectedAnios.length + selectedCentrosGestores.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </button>

            {/* Panel de Filtros Flotante */}
            <AnimatePresence>
              {showFilterPanel && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                >
                  <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filtros Avanzados</h3>
                      <button
                        onClick={() => {
                          setSelectedBancos([])
                          setSelectedAnios([])
                          setSelectedCentrosGestores([])
                          setSearchTerm('')
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Limpiar todo
                      </button>
                    </div>

                    {/* Búsqueda */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Buscar BP o Centro Gestor
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ej: BP26005393..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>

                    {/* Años - Selección Múltiple */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Años ({selectedAnios.length} seleccionados)
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                        {anios.map(anio => (
                          <label key={anio} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedAnios.includes(anio)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAnios([...selectedAnios, anio])
                                } else {
                                  setSelectedAnios(selectedAnios.filter(a => a !== anio))
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{anio}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Bancos - Selección Múltiple */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bancos ({selectedBancos.length} seleccionados)
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                        {bancos.map(banco => (
                          <label key={banco} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedBancos.includes(banco)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBancos([...selectedBancos, banco])
                                } else {
                                  setSelectedBancos(selectedBancos.filter(b => b !== banco))
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{banco}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Centro Gestor - Selección Múltiple con Scroll */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Centros Gestores ({selectedCentrosGestores.length} seleccionados)
                      </label>
                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-700">
                        {centrosGestores.map(centro => (
                          <label key={centro} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedCentrosGestores.includes(centro)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCentrosGestores([...selectedCentrosGestores, centro])
                                } else {
                                  setSelectedCentrosGestores(selectedCentrosGestores.filter(c => c !== centro))
                                }
                              }}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{centro}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Botón Aplicar */}
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Métricas principales - Estilo similar a la imagen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setDataMode('programado')}
          className={`cursor-pointer transition-all duration-200 rounded-xl ${
            dataMode === 'programado' 
              ? 'opacity-100 bg-blue-50 dark:bg-blue-950/10' 
              : 'opacity-70 hover:opacity-90'
          }`}
        >
          <MetricCard
            title={selectedAnios.length > 0 ? `Total Programado Concejo ${selectedAnios.join(', ')}` : 'Total Programado'}
            value={(() => {
              const f = formatMonto(totalesFiltrados.totalProgramado)
              return `$${f.valor} ${f.unidad}`
            })()}
            icon={DollarSign}
            variant="info"
          />
        </div>
        <div 
          onClick={() => setDataMode('adjudicado')}
          className={`cursor-pointer transition-all duration-200 rounded-xl ${
            dataMode === 'adjudicado' 
              ? 'opacity-100 bg-green-50 dark:bg-green-950/10' 
              : 'opacity-70 hover:opacity-90'
          }`}
        >
          <MetricCard
            title="Total Adjudicado Real (Subtotal)"
            value={(() => {
              const f = formatMonto(totalesFiltrados.totalAdjudicado)
              return `$${f.valor} ${f.unidad}`
            })()}
            subtitle={`${totalesFiltrados.cantidadContratos} contratos adjudicados`}
            icon={TrendingUp}
            variant="info"
          />
        </div>
        <div className="rounded-xl">
          <MetricCard
            title="Brecha de Ejecución (Alarma)"
            value="---"
            subtitle="Pendiente endpoint"
            icon={AlertTriangle}
            variant="info"
          />
        </div>
      </div>


      {/* Métricas secundarias - Solo Adjudicado, optimizado */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Proyectos (BP)</span>
          <span className="text-2xl md:text-3xl font-bold text-blue-600">{totalesFiltrados.cantidadBPs}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Contratos</span>
          <span className="text-2xl md:text-3xl font-bold text-green-600">{totalesFiltrados.cantidadContratos}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Bancos</span>
          <span className="text-2xl md:text-3xl font-bold text-teal-600">{participacionBancosAdjudicado.length}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Pagos</span>
          <span className="text-2xl md:text-3xl font-bold text-purple-600">{totalesPagos.cantidadPagos}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-center items-center">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Total Pagado</span>
          <span className="text-2xl md:text-3xl font-bold text-purple-600">{(() => { const f = formatMonto(totalesPagos.totalPagado); return `$${f.valor} ${f.unidad}` })()}</span>
        </div>
      </div>

      {/* Gráficas globales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChartSVG
          data={participacionBancosGlobal}
          title="Participación por Banco"
          totalLabel="Total"
        />
        <HorizontalBarChart
          data={presupuestoOrganismosGlobal}
          title="Presupuesto por Organismo"
        />
      </div>

      {/* ===== SECCIÓN PAGOS Y DESEMBOLSOS ===== */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-purple-600" />
          Pagos y Desembolsos
        </h2>

        {/* Tarjetas de métricas de pagos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Número de Pagos */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-5 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Número de Pagos</span>
            </div>
            <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {metricasPagosDesembolsos.cantidadPagos.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Transacciones registradas</p>
          </div>

          {/* Pagos Efectivos */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-5 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Pagos Efectivos</span>
            </div>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {(() => { const f = formatMonto(metricasPagosDesembolsos.totalPagado); return `$${f.valor} ${f.unidad}` })()}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Monto total pagado</p>
          </div>

          {/* Cuentas por Pagar */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-5 border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Cuentas por Pagar</span>
            </div>
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {(() => { const f = formatMonto(Math.abs(metricasPagosDesembolsos.cuentasPorPagar)); return `$${f.valor} ${f.unidad}` })()}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              {metricasPagosDesembolsos.cuentasPorPagar >= 0 ? 'Pendiente por ejecutar' : 'Sobreejecución'}
            </p>
          </div>

          {/* Reservas Presupuestales - Placeholder para futuro endpoint */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-5 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Reservas Presupuestales</span>
            </div>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              --
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Pendiente endpoint</p>
          </div>
        </div>

        {/* Gráfica circular de pagos por banco y tabla de pagos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfica circular de pagos efectivos por banco */}
          <DonutChartSVG
            data={pagosPorBancoParaGrafica}
            title="Pagos Efectivos por Banco"
            totalLabel="Pagado"
          />

          {/* Tabla de pagos por BP agrupados por Centro Gestor */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Pagos por BP (Agrupado por Centro Gestor)
            </h3>
            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {pagosAgrupadosPorCentroGestor.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No hay pagos registrados</p>
                </div>
              ) : (
                pagosAgrupadosPorCentroGestor.map((grupo, idx) => (
                  <details key={grupo.centroGestor} className="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-gray-500 group-open:rotate-90 transition-transform" />
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{grupo.centroGestor}</span>
                        <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full">
                          {grupo.bps.length} BP{grupo.bps.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                          {(() => { const f = formatMonto(grupo.totalPagado); return `$${f.valor} ${f.unidad}` })()}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">({grupo.cantidadPagos} pagos)</span>
                      </div>
                    </summary>
                    <div className="p-3 bg-white dark:bg-gray-800 space-y-2">
                      {grupo.bps.map(bp => (
                        <details key={bp.bp} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                          <summary className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-gray-500 group-open:rotate-90 transition-transform" />
                              <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                                {bp.bp.slice(-4)}
                              </div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{bp.bp}</span>
                              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                                {bp.contratos.length} contrato{bp.contratos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                                {(() => { const f = formatMonto(bp.totalPagado); return `$${f.valor} ${f.unidad}` })()}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">({bp.cantidadPagos})</span>
                            </div>
                          </summary>
                          <div className="p-2 bg-white dark:bg-gray-800 space-y-1">
                            {bp.contratos.map(contrato => {
                              return (
                                <div key={contrato.numeroContrato} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/20 rounded">
                                  <div className="flex items-center gap-2 flex-1">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{contrato.numeroContrato}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">Pagado:</div>
                                      <div className="font-semibold text-green-600 dark:text-green-400 text-xs">
                                        {(() => { const f = formatMonto(contrato.totalPagado); return `$${f.valor} ${f.unidad}` })()}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ({contrato.cantidadPagos} pago{contrato.cantidadPagos !== 1 ? 's' : ''})
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ===== FIN SECCIÓN PAGOS Y DESEMBOLSOS ===== */}

      {/* Vista condicional según modo seleccionado */}
      <div className="space-y-4">
        {/* Selector de agrupación */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            {viewMode === 'bp' && <FileText className="w-5 h-5 mr-2" />}
            {viewMode === 'banco' && <Banknote className="w-5 h-5 mr-2" />}
            {viewMode === 'bp' && `Proyectos BP por Centro Gestor (${agrupadoPorCentroGestor.length} organismos)`}
            {viewMode === 'banco' && `Por Banco (${agrupadoPorBanco.length})`}
          </h2>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agrupar por:</span>
              <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                <button
                  onClick={() => setViewMode('bp')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'bp' 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  Centro Gestor
                </button>
                <button
                  onClick={() => setViewMode('banco')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'banco' 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  Banco
                </button>
              </div>
            </div>
          </div>
        </div>

        {viewMode === 'bp' && (
          <div className="space-y-4">
            {analisisFiltrado.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">No se encontraron proyectos BP</p>
              </div>
            ) : (
              agrupadoPorCentroGestor.map((grupo) => (
                <CentroGestorConBancosAccordion
                  key={grupo.centro}
                  centroGestor={grupo.centro}
                  bpsPorBanco={grupo.bpsPorBanco}
                  totales={grupo.totales}
                />
              ))
            )}
          </div>
        )}

        {viewMode === 'banco' && (
          <div className="space-y-3">
            {agrupadoPorBanco.map((grupo) => (
              <BancoAccordion
                key={grupo.banco}
                banco={grupo.banco}
                bps={grupo.bps}
                totales={grupo.totales}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmprestitoAnalisisProyectosBP
