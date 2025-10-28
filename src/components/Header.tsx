'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings, User, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { UserProfile } from '@/components/AuthWrapper'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'

interface HeaderProps {
  onToggleSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${CSS_UTILS.card} shadow-lg border-b border-gray-200 dark:border-gray-700 rounded-none transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 tablet:px-6 md:px-6 py-3 tablet:py-4 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title - Optimizado para tablets */}
          <div className="flex items-center space-x-2 tablet:space-x-4 md:space-x-4 min-w-0 flex-1">
            {/* Sidebar Toggle Button - Más grande en tablets */}
            {onToggleSidebar && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleSidebar}
                className="p-2 tablet:p-3 rounded-lg tablet:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-target tablet-interactive"
                title="Abrir menú"
              >
                <Menu className="w-5 h-5 tablet:w-6 tablet:h-6 text-gray-600 dark:text-gray-300" />
              </motion.button>
            )}

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 tablet:space-x-3 md:space-x-3 min-w-0"
            >
              <div className={`w-8 h-8 tablet:w-14 tablet:h-14 md:w-12 md:h-12 bg-gradient-to-br ${CATEGORIES.projects.gradient} rounded-lg tablet:rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm tablet:text-2xl md:text-xl">AC</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`${TYPOGRAPHY.h5} tablet:text-2xl md:${TYPOGRAPHY.h3} font-bold text-gray-800 dark:text-white transition-colors duration-300 truncate`}>
                  <span className="hidden sm:inline tablet:inline">Sistema de Gestión de Proyectos</span>
                  <span className="sm:hidden tablet:hidden">Dashboard AC</span>
                </h1>
                <p className={`${TYPOGRAPHY.bodySmall} tablet:text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 hidden tablet:block md:block`}>
                  Alcaldía Distrital de Santiago de Cali
                </p>
              </div>
            </motion.div>
          </div>

          {/* User Actions - Optimizado para tablets con elementos más grandes */}
          <div className="flex items-center space-x-2 tablet:space-x-4 md:space-x-3 flex-shrink-0">
            {/* Theme Toggle - Más grande en tablets */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.projects.className.text}`}
              title="Cambiar tema"
            >
              {theme === 'dark' ? 
                <Sun className="w-4 h-4 tablet:w-6 tablet:h-6 md:w-5 md:h-5" /> : 
                <Moon className="w-4 h-4 tablet:w-6 tablet:h-6 md:w-5 md:h-5" />
              }
            </motion.button>

            {/* Notifications - Más grande en tablets */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.activities.className.text} relative`}
              title="Notificaciones"
            >
              <Bell className="w-4 h-4 tablet:w-6 tablet:h-6 md:w-5 md:h-5" />
            </motion.button>

            {/* Settings - Visible en tablets */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.contracts.className.text} hidden tablet:flex md:flex`}
              title="Configuración"
            >
              <Settings className="w-5 h-5 tablet:w-6 tablet:h-6" />
            </motion.button>

            {/* User Profile - Componente de autenticación con mejor espaciado */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center tablet:ml-2"
            >
              <UserProfile />
            </motion.div>

            {/* Mobile menu button - Oculto en tablets */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} ${CATEGORIES.products.className.text} tablet:hidden md:hidden`}
              title="Menú"
            >
              <Menu className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header