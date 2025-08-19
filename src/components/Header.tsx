'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Settings, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

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
      className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">AC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-300">
                  Dashboard Alcaldía de Cali
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  Sistema de Gestión de Proyectos
                </p>
              </div>
            </motion.div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 relative"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <Settings className="w-6 h-6" />
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800 dark:text-white transition-colors duration-300">Admin</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">Administrador</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

export default Header