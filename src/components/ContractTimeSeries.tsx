'use client'

import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Info } from 'lucide-react'

interface ContractTimeSeriesProps {
  contrato: any
}

// Helper para obtener el número de semana ISO
const getISOWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const ContractTimeSeries: React.FC<ContractTimeSeriesProps> = ({ contrato }) => {
  const timeSeriesData = React.useMemo(() => {
    if (!contrato) {
      return []
    }

    // Caso 1: Hay reportes históricos - procesarlos normalmente
    if (contrato.reportes && contrato.reportes.length > 0) {
      // Verificar que al menos un reporte tenga fecha válida
      const reportesConFecha = contrato.reportes.filter((reporte: any) => {
        if (!reporte.fecha_reporte) return false
        const fecha = new Date(reporte.fecha_reporte)
        return !isNaN(fecha.getTime())
      })

      if (reportesConFecha.length === 0) {
        // Si hay reportes pero sin fechas válidas, usar datos actuales
        return createCurrentDataPoint(contrato)
      }

      const valorContrato = contrato.valor_contrato || contrato.valor_del_contrato || 0

      const weeklyData = reportesConFecha.reduce((acc: any, reporte: any) => {
        const fecha = new Date(reporte.fecha_reporte)
        const week = getISOWeek(fecha)
        const year = fecha.getFullYear()
        const weekKey = `${year}-W${week}`

        if (!acc[weekKey]) {
          acc[weekKey] = {
            count: 0,
            avance_fisico: 0,
            avance_financiero: 0,
          }
        }

        acc[weekKey].count += 1
        acc[weekKey].avance_fisico += reporte.avance_fisico || 0
        acc[weekKey].avance_financiero += reporte.avance_financiero || 0

        return acc
      }, {})

      return Object.keys(weeklyData)
        .sort((a, b) => {
          const [yearA, weekA] = a.split('-W').map(Number)
          const [yearB, weekB] = b.split('-W').map(Number)
          if (yearA !== yearB) return yearA - yearB
          return weekA - weekB
        })
        .map(weekKey => {
          const weekData = weeklyData[weekKey]

          return {
            periodo: weekKey,
            'Avance Físico': weekData.avance_fisico / weekData.count,
            'Avance Financiero': weekData.avance_financiero / weekData.count,
          }
        })
    }

    // Caso 2: No hay reportes históricos - crear punto de datos actual
    return createCurrentDataPoint(contrato)
  }, [contrato])

  // Función para crear un punto de datos con la información actual del contrato
  function createCurrentDataPoint(contrato: any): any[] {
    const avanceFisico = contrato.avance_fisico || contrato.ejecucion_fisica || 0
    const avanceFinanciero = contrato.avance_financiero || contrato.ejecucion_financiera || 0

    // Crear punto de datos para la semana actual
    const now = new Date()
    const week = getISOWeek(now)
    const year = now.getFullYear()

    return [{
      periodo: `${year}-W${week}`,
      'Avance Físico': avanceFisico,
      'Avance Financiero': avanceFinanciero,
    }]
  }

  // Verificar si hay datos válidos (no todos cero)
  const hasValidData = timeSeriesData.some(data => 
    (data['Avance Físico'] || 0) > 0 || 
    (data['Avance Financiero'] || 0) > 0
  )

  if (timeSeriesData.length === 0 || !hasValidData) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-4">
        <div className="font-semibold mb-2">
          No hay datos de ejecución disponibles
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <div>Contrato: {contrato?.referencia_contrato || 'N/A'}</div>
          <div>Este contrato aún no tiene registros de avance</div>
        </div>
      </div>
    )
  }

  const formatYAxis = (value: number) => `${value.toFixed(0)}%`

  // Determinar si los datos son sintéticos (sin historial) o históricos
  const esDataSintetico = !contrato?.reportes || contrato.reportes.length === 0
  
  return (
    <div className="w-full h-64">
      {esDataSintetico && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>Mostrando estado actual del contrato - No hay reportes históricos disponibles</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={timeSeriesData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="periodo" 
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            tickFormatter={formatYAxis}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}%`,
              name
            ]}
            labelStyle={{ fontSize: '11px' }}
            contentStyle={{ 
              fontSize: '11px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          
          <Line 
            type="monotone" 
            dataKey="Avance Físico" 
            stroke="#10b981" 
            strokeWidth={3}
            strokeDasharray="0"
            dot={{ r: 4, fill: "#10b981" }}
            name="Avance Físico"
          />
          <Line 
            type="monotone" 
            dataKey="Avance Financiero" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 1 }}
            name="Avance Financiero"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ContractTimeSeries