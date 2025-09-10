'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useEmprestito, useEmprestitoMetrics } from '@/hooks/useEmprestito'
import EmprestitoStats from '@/components/EmprestitoStats'
import IntegratedProjectsContracts from '@/components/IntegratedProjectsContracts'
import EmprestitoCharts from '@/components/EmprestitoCharts'
import { Loader2 } from 'lucide-react'

const EmprestitoPage: React.FC = () => {
  const { data, loading, error } = useEmprestito()
  const metrics = useEmprestitoMetrics(data)

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Error al cargar los datos de empréstito
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Cargando datos de empréstito...
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sección de Empréstito
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Análisis completo de proyectos y contratos financiados con recursos de empréstito
          </p>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <EmprestitoCharts
          data={data}
          loading={loading}
        />
      </motion.div>

      {/* Integrated Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <IntegratedProjectsContracts />
      </motion.div>
    </div>
  )
}

export default EmprestitoPage
