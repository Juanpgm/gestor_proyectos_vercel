'use client'

import React from 'react'
import { motion } from 'framer-motion'
import IntegratedBudgetAnalysis from './IntegratedBudgetAnalysis'
import ChoroplethMapInteractive from './ChoroplethMapInteractive'
import { Map, BarChart3 } from 'lucide-react'

const OptimizedProjectSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Sección de Análisis Presupuestal */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <IntegratedBudgetAnalysis />
      </motion.section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
            Análisis Geográfico
          </span>
        </div>
      </div>

      {/* Sección del Mapa Interactivo */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Distribución Geográfica Municipal
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visualización interactiva de indicadores por veredas y territorios
              </p>
            </div>
          </div>
        </div>
        <div className="p-0">
          <ChoroplethMapInteractive 
            height="700px"
            showControls={true}
            showChartsPanel={true}
            defaultLayer="comunas"
            defaultMetric="contratos"
          />
        </div>
      </motion.section>
    </div>
  )
}

export default OptimizedProjectSection
