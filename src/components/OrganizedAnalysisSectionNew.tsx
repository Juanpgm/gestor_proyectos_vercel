'use client'

import React from 'react'
import { motion } from 'framer-motion'
import CompactBudgetCharts from './CompactBudgetCharts'
import FinancialMetricsIntegrated from './FinancialMetricsIntegrated'
import ChoroplethMapInteractive from './ChoroplethMapInteractive'

const OrganizedAnalysisSectionNew: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Métricas Financieras - Columna lateral */}
        <div className="xl:col-span-1">
          <FinancialMetricsIntegrated />
        </div>

        {/* Gráficos Presupuestales - Columnas centrales */}
        <div className="xl:col-span-2">
          <CompactBudgetCharts />
        </div>

        {/* Mapa - Columna derecha */}
        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Distribución Territorial</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Proyectos por ubicación</p>
              </div>
            </div>
            <div className="h-80">
              <ChoroplethMapInteractive />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default OrganizedAnalysisSectionNew
