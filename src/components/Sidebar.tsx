'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Home, FileText, ChevronRight, TrendingUp, DollarSign, Users, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  activeSection, 
  onSectionChange
}) => {
  const { isSuperAdmin, state, signOut, getHighestRole, hasRole } = useAuth()

  const canAccessFullManagementSidebar =
    hasRole('super_admin') || hasRole('admin_general') || hasRole('editor_datos')
  const isAdminCentroGestor = hasRole('admin_centro_gestor')
  
  // Debug: Mostrar información del usuario y roles en consola
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      console.log('👤 Usuario actual:', {
        email: state.user.email,
        roles: state.user.roles,
        permissions: state.user.permissions,
        isSuperAdmin: isSuperAdmin(),
        highestRole: getHighestRole()
      })
    }
  }, [state.isAuthenticated, state.user, isSuperAdmin, getHighestRole])
  
  const dashboardMenuItem = {
    id: 'dashboard',
    label: 'Dashboard Principal',
    icon: Home,
    description: 'Panel principal del sistema'
  }

  const managementMenuItems = [
    {
      id: 'gestionar-procesos',
      label: 'Gestionar Procesos',
      icon: FileText,
      description: 'Gestión de procesos contractuales'
    },
    {
      id: 'gestionar-contratos',
      label: 'Gestionar Contratos',
      icon: FileText,
      description: 'Administración de convenios y transferencias'
    },
    {
      id: 'proyecciones-emprestito',
      label: 'Proyecciones de Empréstito',
      icon: TrendingUp,
      description: 'Gestión y seguimiento de proyecciones'
    },
    {
      id: 'gestion-pagos',
      label: 'Gestión de Pagos',
      icon: DollarSign,
      description: 'Gestión de RPCs y pagos de empréstito'
    },
    {
      id: 'gestionar-unidades-proyecto',
      label: 'Gestionar Unidades de Proyecto',
      icon: ClipboardCheck,
      description: 'Control de calidad de unidades de proyecto'
    }
  ]

  const visibleManagementMenuItems = canAccessFullManagementSidebar
    ? managementMenuItems
    : isAdminCentroGestor
      ? managementMenuItems.filter((item) => item.id === 'gestionar-unidades-proyecto')
      : []

  const baseMenuItems = [dashboardMenuItem, ...visibleManagementMenuItems]

  // Agregar "Gestionar Usuarios" solo para super_admin
  const shouldShowUserManagement = isSuperAdmin()
  
  // Debug log para ver si debe mostrar el módulo
  useEffect(() => {
    console.log('🔍 Sidebar - Validación de módulo Gestionar Usuarios:', {
      shouldShow: shouldShowUserManagement,
      isSuperAdmin: isSuperAdmin(),
      userRoles: state.user?.roles,
      canAccessFullManagementSidebar,
      isAdminCentroGestor,
      totalMenuItems: shouldShowUserManagement ? baseMenuItems.length + 1 : baseMenuItems.length
    })
  }, [
    shouldShowUserManagement,
    state.user?.roles,
    canAccessFullManagementSidebar,
    isAdminCentroGestor,
    baseMenuItems.length,
    isSuperAdmin
  ])
  
  const menuItems = shouldShowUserManagement
    ? [
        ...baseMenuItems,
        {
          id: 'gestionar-usuarios',
          label: 'Gestionar Usuarios',
          icon: Users,
          description: 'Administración de usuarios y roles'
        }
      ]
    : baseMenuItems

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
            style={{ zIndex: 8000 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
            style={{ zIndex: 8500 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Navegación
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sistema de Gestión
                </p>
                {state.user && state.user.roles && state.user.roles.length > 0 && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                      {getHighestRole()}
                    </span>
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </motion.button>
            </div>

            {/* Menu Items - Con scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id
                
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSectionChange(item.id)
                      onClose()
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-800/50'
                          : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm ${
                          isActive
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {item.label}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`} />
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>Alcaldía de Santiago de Cali</p>
                <p className="mt-1">Unidad de Cumplimiento</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Sidebar