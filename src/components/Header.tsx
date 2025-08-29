'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings, User, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'

const Header = () => {
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
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title - Responsivo */}
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 md:space-x-3 min-w-0"
            >
              <div className={`w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br ${CATEGORIES.projects.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm md:text-xl">AC</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`${TYPOGRAPHY.h5} md:${TYPOGRAPHY.h3} font-bold text-gray-800 dark:text-white transition-colors duration-300 truncate`}>
                  <span className="hidden sm:inline">Dashboard Alcaldía de Cali</span>
                  <span className="sm:hidden">Dashboard AC</span>
                </h1>
                <p className={`${TYPOGRAPHY.bodySmall} text-gray-600 dark:text-gray-400 transition-colors duration-300 hidden md:block`}>
                  Sistema de Gestión de Proyectos
                </p>
              </div>
            </motion.div>
          </div>

          {/* User Actions - Compacto y responsivo */}
          <div className="flex items-center space-x-1 md:space-x-3 flex-shrink-0">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`${CSS_UTILS.iconButton} ${CATEGORIES.projects.className.text}`}
              title="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} ${CATEGORIES.activities.className.text} relative`}
              title="Notificaciones"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse"></span>
            </motion.button>

            {/* Settings - Hidden on mobile */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} ${CATEGORIES.contracts.className.text} hidden md:flex`}
              title="Configuración"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* User Profile - Adaptativo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`flex items-center space-x-2 ${CSS_UTILS.badge} ${CATEGORIES.project_units.className.bg} cursor-pointer hover:shadow-md transition-all duration-200 px-2 py-1 md:px-3 md:py-2`}
            >
              <div className={`w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br ${CATEGORIES.project_units.gradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                <User className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div className="hidden md:block min-w-0">
                <p className={`${TYPOGRAPHY.bodySmall} font-medium text-gray-800 dark:text-white transition-colors duration-300 truncate`}>Admin</p>
                <p className={`${TYPOGRAPHY.caption} text-gray-600 dark:text-gray-400 transition-colors duration-300 truncate`}>Administrador</p>
              </div>
            </motion.div>

            {/* Mobile menu button - Solo visible en móvil */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`${CSS_UTILS.iconButton} ${CATEGORIES.products.className.text} md:hidden`}
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