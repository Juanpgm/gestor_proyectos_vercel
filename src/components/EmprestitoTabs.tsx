'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import EmprestitoTimeSeries from '@/components/EmprestitoTimeSeries'

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
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      className={getTabButtonClasses(isActive)}
      aria-selected={isActive}
      role="tab"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{tab.label}</span>
        <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
      </div>
      
      {/* Indicador de tab activo */}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-teal-600 rounded-lg -z-10"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
})

// Componente principal de tabs con programación funcional
const EmprestitoTabs: React.FC<EmprestitoTabsProps> = ({
  flujoCajaData = [],
  flujoCajaLoading = false,
  onFilteredBpinsChange,
  className = ''
}) => {
  // Estado del tab activo - solo flujo-caja disponible
  const [activeTab, setActiveTab] = useState<string>('flujo-caja')
  
  // Función pura para cambio de tab
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])
  
  // Memorizar tab activo para evitar re-renders innecesarios
  const activeTabConfig = useMemo(() => 
    TAB_CONFIG.find(tab => tab.id === activeTab) || TAB_CONFIG[0], 
    [activeTab]
  )
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header de tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* Título y descripción */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Análisis de Empréstito
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeTabConfig.description}
            </p>
          </div>
          
          {/* Navegación de tabs */}
          <div 
            className="flex flex-wrap gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
            role="tablist"
            aria-label="Secciones de análisis de empréstito"
          >
            {TAB_CONFIG.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Contenido del tab activo */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
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
}

// Optimización de memoria: nombres de display
TabContent.displayName = 'TabContent'
TabButton.displayName = 'TabButton'
EmprestitoTabs.displayName = 'EmprestitoTabs'

export default EmprestitoTabs