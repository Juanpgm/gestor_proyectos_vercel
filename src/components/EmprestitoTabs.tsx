'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  BarChart3
} from 'lucide-react'
import EmprestitoTimeSeries from '@/components/EmprestitoTimeSeries'
import EmprestitoAdvancedDashboard from '@/components/EmprestitoAdvancedDashboard'

// Tipos para las props
interface EmprestitoTabsProps {
  flujoCajaData?: any[]
  flujoCajaLoading?: boolean
  onFilteredBpinsChange?: (bpins: number[] | undefined) => void
  className?: string
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
    description: 'Análisis temporal de flujo de caja y evolución presupuestal',
    component: 'EmprestitoTimeSeries'
  }
] as const

// Función pura para generar clases de botón de tab
const getTabButtonClasses = (isActive: boolean): string => {
  const baseClasses = 'relative px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  const activeClasses = 'bg-teal-600 text-white shadow-lg focus:ring-teal-500'
  const inactiveClasses = 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500'
  
  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
}

// Componente de renderizado condicional para tabs
const TabContent: React.FC<{ activeTab: string; props: EmprestitoTabsProps }> = React.memo(({ 
  activeTab, 
  props 
}) => {  
  switch (activeTab) {
    case 'dashboard':
      return <EmprestitoAdvancedDashboard />
    case 'flujo-caja':
      return <EmprestitoTimeSeries 
        data={props.flujoCajaData}
        loading={props.flujoCajaLoading}
      />
    default:
      return null
  }
})

// Componente de botón de tab optimizado
const TabButton: React.FC<{
  tab: typeof TAB_CONFIG[number]
  isActive: boolean
  onClick: () => void
}> = React.memo(({ tab, isActive, onClick }) => {
  const IconComponent = tab.icon
  
  return (
    <button
      onClick={onClick}
      className={getTabButtonClasses(isActive)}
      title={tab.description}
    >
      <div className="flex items-center gap-3">
        <IconComponent className="w-4 h-4" />
        <span>{tab.label}</span>
      </div>
    </button>
  )
})

// Componente principal optimizado con programación funcional
const EmprestitoTabs: React.FC<EmprestitoTabsProps> = React.memo(({ 
  flujoCajaData, 
  flujoCajaLoading,
  onFilteredBpinsChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
          {TAB_CONFIG.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>
      </div>

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
TabButton.displayName = 'TabButton'
EmprestitoTabs.displayName = 'EmprestitoTabs'

export default EmprestitoTabs