/**
 * Hook personalizado para gestionar datos del dashboard
 * @description Custom hook con programación funcional para dashboard data
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
// import {
//   getDashboardSummary,
//   processMetricsToAttributes,
//   processDistributionData,
//   calculatePercentages,
//   type DashboardSummaryResponse,
//   type AttributeData
// } from '@/services/dashboardApi'

// Tipos temporales de reemplazo
type DashboardSummaryResponse = any
type AttributeData = any

// Funciones temporales de reemplazo
const getDashboardSummary = async (): Promise<DashboardSummaryResponse> => ({})
const processMetricsToAttributes = (data: any): AttributeData[] => []
const processDistributionData = (data: any, maxItems?: number): ChartData[] => []
const calculatePercentages = (data: any[]): any[] => []

interface ChartData {
  name: string
  value: number
  percentage: number
  color: string
}

interface ProcessedDashboardData {
  metrics: AttributeData[]
  charts: {
    comunas: ChartData[]
    anos: ChartData[]
    fuentes: ChartData[]
    barrios: ChartData[]
  }
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Función para cargar datos del dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const dashboardData = await getDashboardSummary()
      setData(dashboardData)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Procesar datos para métricas de atributos
  const processedMetrics = useMemo((): AttributeData[] => {
    if (!data?.metrics) return []
    return processMetricsToAttributes(data.metrics)
  }, [data?.metrics])

  // Procesar datos para gráficos con programación funcional
  const processedCharts = useMemo(() => {
    if (!data?.distribuciones) {
      return {
        comunas: [],
        anos: [],
        fuentes: [],
        barrios: []
      }
    }

    const { distribuciones } = data

    // Colores para cada categoría de gráfico
    const colors = {
      comunas: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'],
      anos: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981'],
      fuentes: ['#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316'],
      barrios: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6']
    }

    // Función helper para procesar y colorear datos
    const processWithColors = (
      distribution: Record<string, number>,
      colorPalette: string[],
      maxItems: number = 8
    ): ChartData[] => {
      const processedData = processDistributionData(distribution, maxItems)
      const dataWithPercentages = calculatePercentages(processedData)
      
      return dataWithPercentages.map((item, index) => ({
        ...item,
        color: colorPalette[index % colorPalette.length]
      }))
    }

    return {
      comunas: processWithColors(distribuciones.por_comuna_corregimiento, colors.comunas, 10),
      anos: processWithColors(distribuciones.por_ano, colors.anos, 5),
      fuentes: processWithColors(distribuciones.por_fuente_financiacion, colors.fuentes, 8),
      barrios: processWithColors(distribuciones.por_barrio_vereda, colors.barrios, 12)
    }
  }, [data?.distribuciones])

  // Función para refrescar datos
  const refreshData = useCallback(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Datos consolidados para el dashboard
  const dashboardData: ProcessedDashboardData = useMemo(() => ({
    metrics: processedMetrics,
    charts: processedCharts,
    isLoading,
    error,
    lastUpdated
  }), [processedMetrics, processedCharts, isLoading, error, lastUpdated])

  return {
    ...dashboardData,
    refreshData,
    rawData: data
  }
}