'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Archive,
  Edit3
} from 'lucide-react'
import { CATEGORIES, formatNumber, ANIMATIONS } from '@/lib/design-system'

/**
 * Componente de estadísticas de contratos simplificado
 * Muestra 6 métricas principales en cards responsivas
 */

interface ContratosStatsProps {
  totalContratos: number
  totalValorContratos: number
  valorPagado: number
  valorPendientePago: number
  valorPendienteEjecucion: number
  contratosLiquidados: number
  contratosModificados: number
  contratosConPagoAdelantado: number
  loading?: boolean
}

const ContratosStats: React.FC<ContratosStatsProps> = ({
  totalContratos,
  totalValorContratos,
  valorPagado,
  valorPendientePago,
  valorPendienteEjecucion,
  contratosLiquidados,
  contratosModificados,
  contratosConPagoAdelantado,
  loading = false
}) => {
  // Calcular porcentajes simplificados
  const porcentajePagado = totalValorContratos > 0 ? (valorPagado / totalValorContratos) * 100 : 0
  const porcentajePendientePago = totalValorContratos > 0 ? (valorPendientePago / totalValorContratos) * 100 : 0
  const porcentajeLiquidados = totalContratos > 0 ? (contratosLiquidados / totalContratos) * 100 : 0
  const porcentajeModificados = totalContratos > 0 ? (contratosModificados / totalContratos) * 100 : 0

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // Datos de las 6 cards principales simplificadas
  const statsData = [
    {
      id: 'total',
      title: 'Total Contratos',
      value: formatNumber(totalContratos),
      subtitle: 'Contratos registrados',
      icon: FileText,
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
      textColor: 'text-violet-600 dark:text-violet-400',
      borderColor: 'border-violet-200 dark:border-violet-800'
    },
    {
      id: 'valor-total',
      title: 'Valor Total',
      value: formatNumber(totalValorContratos, 'currency'),
      subtitle: 'Valor contractual',
      icon: DollarSign,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'pagado',
      title: 'Valor Pagado',
      value: formatNumber(valorPagado, 'currency'),
      subtitle: `${porcentajePagado.toFixed(1)}% del total`,
      icon: CheckCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
      id: 'pendiente-pago',
      title: 'Pendiente de Pago',
      value: formatNumber(valorPendientePago, 'currency'),
      subtitle: `${porcentajePendientePago.toFixed(1)}% del total`,
      icon: Clock,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800'
    },
    {
      id: 'liquidados',
      title: 'Contratos Liquidados',
      value: formatNumber(contratosLiquidados),
      subtitle: `${porcentajeLiquidados.toFixed(1)}% del total`,
      icon: Archive,
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'border-teal-200 dark:border-teal-800'
    },
    {
      id: 'modificados',
      title: 'Contratos Modificados',
      value: formatNumber(contratosModificados),
      subtitle: `${porcentajeModificados.toFixed(1)}% del total`,
      icon: Edit3,
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, ...ANIMATIONS.fadeIn }}
            className={`
              bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border 
              border-gray-200 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 
              transition-all duration-300 ${stat.bgColor}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.borderColor} border`}>
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {stat.title}
              </h3>
              <p className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stat.subtitle}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default ContratosStats
