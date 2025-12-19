'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3,
  ChevronLeft
} from 'lucide-react'
import EmprestitoTimeSeries from '@/components/EmprestitoTimeSeries'
import EmprestitoAdvancedDashboard from '@/components/EmprestitoAdvancedDashboard'
import EmprestitoFlujoCajaDashboard from '@/components/EmprestitoFlujoCajaDashboard'

// Tipos para las props
interface EmprestitoTabsProps {
  flujoCajaData?: any[]
  flujoCajaLoading?: boolean
  onFilteredBpinsChange?: (bpins: number[] | undefined) => void
  className?: string
  onNavigateHome?: () => void
}

// Configuración de tabs con programación funcional
const TAB_CONFIG = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Dashboard avanzado con análisis por Banco y Centro Gestor usando datos reales de la API',
    component: 'EmprestitoAdvancedDashboard'
  },
  {
    id: 'flujo-caja',
    label: 'Flujo de caja - Empréstito',
    icon: TrendingUp,
    description: 'Serie de tiempo de flujo de caja mensual por banco',
    component: 'EmprestitoTimeSeries'
  }
] as const

// Componente de renderizado condicional para tabs
const TabContent: React.FC<{ activeTab: string; props: EmprestitoTabsProps }> = React.memo(({ 
  activeTab, 
  props 
}) => {  
  switch (activeTab) {
    case 'dashboard':
      return <EmprestitoAdvancedDashboard />
    case 'flujo-caja':
      return <EmprestitoTimeSeries />
    default:
      return null
  }
})

// Componente principal optimizado con programación funcional
const EmprestitoTabs: React.FC<EmprestitoTabsProps> = React.memo(({ 
  flujoCajaData, 
  flujoCajaLoading,
  onFilteredBpinsChange,
  className = '',
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tabs - Immediately after header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TAB_CONFIG.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }} 
        >
          <TabContent 
            activeTab={activeTab} 
            props={{
              flujoCajaData,
              flujoCajaLoading,
              onFilteredBpinsChange,
              className
            }} 
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
})

// Optimización de memoria: nombres de display
TabContent.displayName = 'TabContent'
EmprestitoTabs.displayName = 'EmprestitoTabs'

export default EmprestitoTabs