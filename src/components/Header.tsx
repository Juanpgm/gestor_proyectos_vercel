'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { UserProfile } from '@/components/AuthWrapper'
import { CATEGORIES, ANIMATIONS, TYPOGRAPHY, CSS_UTILS } from '@/lib/design-system'
import { useRecentNotificationCount } from '@/hooks/useNotifications'
import NotificationPanel from '@/components/NotificationPanel'
import { useAuth } from '@/context/AuthContext'
import RoleFeatureTour from '@/components/RoleFeatureTour'
import GearMenu from '@/components/GearMenu'

interface HeaderProps {
  onToggleSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, setTheme } = useTheme()
  const { state, getHighestRole } = useAuth()
  const unreadCount = useRecentNotificationCount(5) // Mostrar notificaciones de los últimos 5 días
  const [showNotifications, setShowNotifications] = useState(false)
  const highestRole = getHighestRole()

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
      <div className="px-2 sm:px-4 lg:px-6 py-3">
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
                data-tour-id="header-menu"
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
            <RoleFeatureTour highestRole={highestRole} userId={state.user?.uid || state.user?.email} />

            {/* Theme Toggle - Más grande en tablets */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.projects.className.text}`}
              title="Cambiar tema"
              data-tour-id="header-theme"
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
              onClick={() => setShowNotifications(!showNotifications)}
              className={`${CSS_UTILS.iconButton} tablet-interactive p-2 tablet:p-3 rounded-lg tablet:rounded-xl ${CATEGORIES.activities.className.text} relative`}
              title="Notificaciones"
              data-tour-id="header-notifications"
            >
              <Bell className="w-4 h-4 tablet:w-6 tablet:h-6 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Settings menu - Visible en tablets */}
            <GearMenu />

            {/* User Profile - Componente de autenticación con mejor espaciado */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center tablet:ml-2"
              data-tour-id="header-profile"
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

      {/* Panel de Notificaciones */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </motion.header>
  )
}

export default Header