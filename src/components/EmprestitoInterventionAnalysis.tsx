'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { Construction, Building, MapPin, DollarSign, TrendingUp, Calendar, Users, Target } from 'lucide-react'
import { EmprestitoContrato } from '@/hooks/useEmprestito'

interface EmprestitoInterventionAnalysisProps {
  data: EmprestitoContrato[]
  loading: boolean
}

const COLORS = ['#1E40AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export default function EmprestitoInterventionAnalysis({ data, loading }: EmprestitoInterventionAnalysisProps) {
  const analysisData = useMemo(() => {
    if (!data || data.length === 0) return { 
      sectores: [], 
      modalidades: [], 
      departamentos: [],
      tiposContrato: [],
      evolucionTemporal: [],
      resumenGeneral: {}
    }

    // Procesar sectores
    const sectoresCounts: Record<string, { count: number, valor: number }> = {}
    
    // Procesar modalidades de contratación
    const modalidadesCounts: Record<string, { count: number, valor: number }> = {}
    
    // Procesar departamentos
    const departamentosCounts: Record<string, { count: number, valor: number }> = {}
    
    // Procesar tipos de contrato
    const tiposContratoCounts: Record<string, { count: number, valor: number }> = {}
    
    // Procesar evolución temporal
    const evolucionCounts: Record<string, { count: number, valor: number }> = {}

    let totalValor = 0
    let totalPagado = 0
    let totalPendiente = 0

    data.forEach(contrato => {
      const sector = contrato.sector || 'Sin especificar'
      const modalidad = contrato.modalidad_de_contratacion || 'Sin especificar'
      const departamento = contrato.departamento || 'Sin especificar'
      const tipoContrato = contrato.tipo_de_contrato || 'Sin especificar'
      // Usar valor_contrato con respaldo a valor_del_contrato para consistencia
      const valor = (contrato as any).valor_contrato || contrato.valor_del_contrato || 0
      const valorPagado = contrato.valor_pagado || 0
      const valorPendiente = contrato.valor_pendiente_de_pago || 0

      // Acumular totales
      totalValor += valor
      totalPagado += valorPagado
      totalPendiente += valorPendiente

      // Procesar sectores
      if (!sectoresCounts[sector]) {
        sectoresCounts[sector] = { count: 0, valor: 0 }
      }
      sectoresCounts[sector].count += 1
      sectoresCounts[sector].valor += valor

      // Procesar modalidades
      if (!modalidadesCounts[modalidad]) {
        modalidadesCounts[modalidad] = { count: 0, valor: 0 }
      }
      modalidadesCounts[modalidad].count += 1
      modalidadesCounts[modalidad].valor += valor

      // Procesar departamentos
      if (!departamentosCounts[departamento]) {
        departamentosCounts[departamento] = { count: 0, valor: 0 }
      }
      departamentosCounts[departamento].count += 1
      departamentosCounts[departamento].valor += valor

      // Procesar tipos de contrato
      if (!tiposContratoCounts[tipoContrato]) {
        tiposContratoCounts[tipoContrato] = { count: 0, valor: 0 }
      }
      tiposContratoCounts[tipoContrato].count += 1
      tiposContratoCounts[tipoContrato].valor += valor

      // Procesar evolución temporal (por año de firma)
      if (contrato.fecha_de_firma) {
        const year = new Date(contrato.fecha_de_firma).getFullYear().toString()
        if (!isNaN(Number(year))) {
          if (!evolucionCounts[year]) {
            evolucionCounts[year] = { count: 0, valor: 0 }
          }
          evolucionCounts[year].count += 1
          evolucionCounts[year].valor += valor
        }
      }
    })

    // Convertir a arrays ordenados
    const sectores = Object.entries(sectoresCounts)
      .map(([name, itemData]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        count: itemData.count,
        valor: itemData.valor,
        percentage: ((itemData.count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.valor - a.valor)

    const modalidades = Object.entries(modalidadesCounts)
      .map(([name, itemData]) => ({
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        fullName: name,
        count: itemData.count,
        valor: itemData.valor,
        percentage: ((itemData.count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    const departamentos = Object.entries(departamentosCounts)
      .map(([name, itemData]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        count: itemData.count,
        valor: itemData.valor,
        percentage: ((itemData.count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.valor - a.valor)

    const tiposContrato = Object.entries(tiposContratoCounts)
      .map(([name, itemData]) => ({
        name: name.length > 20 ? name.substring(0, 20) + '...' : name,
        fullName: name,
        count: itemData.count,
        valor: itemData.valor,
        percentage: ((itemData.count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    const evolucionTemporal = Object.entries(evolucionCounts)
      .map(([year, data]) => ({
        year,
        count: data.count,
        valor: data.valor
      }))
      .sort((a, b) => a.year.localeCompare(b.year))

    const resumenGeneral = {
      totalContratos: data.length,
      totalValor,
      totalPagado,
      totalPendiente,
      porcentajePagado: totalValor > 0 ? ((totalPagado / totalValor) * 100).toFixed(1) : '0',
      porcentajePendiente: totalValor > 0 ? ((totalPendiente / totalValor) * 100).toFixed(1) : '0'
    }

    return { 
      sectores, 
      modalidades, 
      departamentos, 
      tiposContrato, 
      evolucionTemporal,
      resumenGeneral
    }
  }, [data])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-full flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando análisis de intervención de empréstito...</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-full flex flex-col space-y-6">
      {/* Header con estadísticas principales */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-2 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Análisis de Intervenciones - Empréstito
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Distribución sectorial y modalidades de contratación
              </p>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Contratos</p>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {(analysisData.resumenGeneral as any).totalContratos?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-700 dark:text-green-300">Valor Total</p>
            </div>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">
              {formatCurrency((analysisData.resumenGeneral as any).totalValor || 0)}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700 dark:text-orange-300">% Pagado</p>
            </div>
            <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
              {(analysisData.resumenGeneral as any).porcentajePagado || '0'}%
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Departamentos</p>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {analysisData.departamentos.length}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de análisis */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Análisis por Sectores */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Construction className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Distribución por Sectores
            </h4>
            <div className="ml-auto bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">
              {analysisData.sectores.length} sectores
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysisData.sectores.slice(0, 8)} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={formatCurrency}
              />
              <Tooltip 
                labelFormatter={(label) => analysisData.sectores.find(s => s.name === label)?.fullName || label}
                formatter={(value: any) => [formatCurrency(value), 'Valor Total']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="valor" fill="#1E40AF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Análisis por Modalidades de Contratación */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Modalidades de Contratación
            </h4>
            <div className="ml-auto bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs text-green-700 dark:text-green-300">
              {analysisData.modalidades.length} modalidades
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analysisData.modalidades.slice(0, 8)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percentage}) => `${parseFloat(percentage).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                strokeWidth={2}
                stroke="#fff"
              >
                {analysisData.modalidades.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string, props: any) => [
                  `${value} contratos (${parseFloat(props.payload.percentage).toFixed(1)}%)`, 
                  props.payload.fullName
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Evolución Temporal */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Evolución Temporal
            </h4>
            <div className="ml-auto bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded text-xs text-purple-700 dark:text-purple-300">
              Por año
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analysisData.evolucionTemporal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="year" 
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                fontSize={10}
                stroke="currentColor"
                className="text-gray-600 dark:text-gray-400"
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'count' ? `${value} contratos` : formatCurrency(value),
                  name === 'count' ? 'Cantidad' : 'Valor Total'
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Departamentos */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-orange-600" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Top Departamentos
            </h4>
            <div className="ml-auto bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs text-orange-700 dark:text-orange-300">
              Por valor
            </div>
          </div>
          
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {analysisData.departamentos.slice(0, 10).map((dept, index) => (
              <div key={dept.fullName} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-orange-500">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={dept.fullName}>
                      {dept.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dept.count} contratos
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(dept.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}