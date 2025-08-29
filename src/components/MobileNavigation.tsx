'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'

type ActiveTab = 'projects' | 'project_units' | 'contracts' | 'activities' | 'products'

interface MobileNavigationProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  className?: string
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const tabs = [
    { 
      id: 'projects' as const, 
      label: CATEGORIES.projects.name, 
      icon: CATEGORIES.projects.icon,
      category: 'projects' as const,
      shortLabel: 'Proyectos'
    },
    { 
      id: 'project_units' as const, 
      label: CATEGORIES.project_units.name, 
      icon: CATEGORIES.project_units.icon,
      category: 'project_units' as const,
      shortLabel: 'Unidades'
    },
    { 
      id: 'activities' as const, 
      label: CATEGORIES.activities.name, 
      icon: CATEGORIES.activities.icon,
      category: 'activities' as const,
      shortLabel: 'Actividades'
    },
    { 
      id: 'products' as const, 
      label: CATEGORIES.products.name, 
      icon: CATEGORIES.products.icon,
      category: 'products' as const,
      shortLabel: 'Productos'
    },
    { 
      id: 'contracts' as const, 
      label: CATEGORIES.contracts.name, 
      icon: CATEGORIES.contracts.icon, 
      disabled: true,
      category: 'contracts' as const,
      shortLabel: 'Contratos'
    }
  ]

  const activeTabConfig = tabs.find(tab => tab.id === activeTab)
  const categoryConfig = activeTabConfig ? CATEGORIES[activeTabConfig.category] : CATEGORIES.projects

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <div className="hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`mb-6 ${className}`}
        >
          <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg border border-gray-100 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isDisabled = tab.disabled
              const tabCategoryConfig = CATEGORIES[tab.category]
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && onTabChange(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-all duration-200 text-sm md:text-base min-w-0 ${
                    isDisabled
                      ? 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
                      : activeTab === tab.id
                      ? `${tabCategoryConfig.className.button} shadow-md`
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={isDisabled ? 'Disponible próximamente' : ''}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {isDisabled && (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full ml-1 hidden lg:inline">
                      Próximamente
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`mb-4 ${className}`}
        >
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border border-gray-100 dark:border-gray-700">
            {/* Current Tab Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`p-2 ${categoryConfig.className.accent} rounded-lg`}>
                {activeTabConfig && (
                  <activeTabConfig.icon className={`w-5 h-5 ${categoryConfig.className.text}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`${TYPOGRAPHY.h6} font-semibold text-gray-900 dark:text-white truncate`}>
                  {activeTabConfig?.shortLabel || 'Dashboard'}
                </h2>
                <p className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400`}>
                  Gestión municipal
                </p>
              </div>
            </div>

            {/* Menu Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`${CSS_UTILS.iconButton} ${categoryConfig.className.text}`}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              
              {/* Menu Content */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className={`${CSS_UTILS.card} w-full max-w-md relative`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className={`${TYPOGRAPHY.h5} font-bold text-gray-900 dark:text-white`}>
                      Navegación
                    </h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className={`${CSS_UTILS.iconButton} text-gray-500`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isDisabled = tab.disabled
                    const tabCategoryConfig = CATEGORIES[tab.category]
                    
                    return (
                      <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!isDisabled) {
                            onTabChange(tab.id)
                            setIsOpen(false)
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                          isDisabled
                            ? 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
                            : activeTab === tab.id
                            ? `${tabCategoryConfig.className.bg} ${tabCategoryConfig.className.text} shadow-md`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          activeTab === tab.id 
                            ? tabCategoryConfig.className.accent
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            activeTab === tab.id 
                              ? tabCategoryConfig.className.text
                              : 'text-gray-500'
                          }`} />
                        </div>
                        
                        <div className="flex-1 text-left">
                          <p className={`${TYPOGRAPHY.body} font-medium`}>
                            {tab.label}
                          </p>
                          {isDisabled && (
                            <p className={`${TYPOGRAPHY.caption} text-gray-500`}>
                              Disponible próximamente
                            </p>
                          )}
                        </div>

                        {activeTab === tab.id && (
                          <div className={`w-2 h-2 rounded-full ${tabCategoryConfig.className.button.replace(/text-\w+/, 'bg-current')}`} />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default MobileNavigation
