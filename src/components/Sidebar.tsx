'use client'

import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Home, FileText, ChevronRight, TrendingUp, DollarSign, Users, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/cn'

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
  
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      console.log('👤 Usuario actual:', {
        email: state.user.email,
        roles: state.user.roles,
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
    },
    {
      id: 'gestionar-emprestito',
      label: 'Gestionar Empréstito',
      icon: TrendingUp,
      description: 'Gestión unificada de contratos, procesos, RPCs, pagos y convenios'
    }
  ]

  const visibleManagementMenuItems = canAccessFullManagementSidebar
    ? managementMenuItems
    : isAdminCentroGestor
      ? managementMenuItems.filter((item) => item.id === 'gestionar-unidades-proyecto' || item.id === 'gestionar-emprestito')
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 lg:hidden"
            style={{ zIndex: 8000 }}
            onClick={onClose}
          />

          {/* Sidebar panel — navy govtech */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="fixed left-0 top-0 h-full w-72 bg-[#1e3a5f] dark:bg-[#0d1f36] border-r border-[#163355] dark:border-[#0a1829] flex flex-col"
            style={{ zIndex: 8500 }}
          >
            {/* Header del sidebar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#1d4ed8] flex items-center justify-center shrink-0">
                  <span className="text-white text-[11px] font-bold tracking-tight">CT</span>
                </div>
                <div>
                  <div className="text-white text-[13px] font-semibold leading-tight">CaliTrack</div>
                  {state.user && getHighestRole() && (
                    <div className="text-white/40 text-[9px] uppercase tracking-widest leading-none mt-0.5">
                      {getHighestRole()}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-[120ms]"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Ítems de navegación */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id)
                      onClose()
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors duration-[120ms]',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                    )}
                  >
                    <span className={cn(
                      'shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                      isActive ? 'bg-white/15' : 'bg-white/5'
                    )}>
                      <Icon size={15} strokeWidth={1.5} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-[13px] font-medium truncate leading-tight',
                        isActive ? 'text-white' : 'text-white/70'
                      )}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-white/35 truncate leading-none mt-0.5">
                        {item.description}
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight size={13} strokeWidth={2} className="text-white/40 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="text-[10px] text-white/30 uppercase tracking-widest text-center leading-relaxed">
                Alcaldía de Santiago de Cali<br />
                Unidad de Cumplimiento
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Sidebar