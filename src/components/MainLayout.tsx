'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import GestionProcesos from '@/components/GestionProcesos'
import GestionContratos from '@/components/GestionContratos'
import ProyeccionesEmprestito from '@/components/ProyeccionesEmprestito'
import GestionPagos from '@/components/GestionPagos'
import GestionUnidadesProyecto from '@/components/GestionUnidadesProyecto'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSectionChange = (section: string) => {
    // Si es gestionar-usuarios, navegar a la ruta dedicada
    if (section === 'gestionar-usuarios') {
      router.push('/admin/usuarios')
    } else {
      setActiveSection(section)
    }
  }

  const handleNavigateHome = () => {
    setActiveSection('dashboard')
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'gestionar-procesos':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <GestionProcesos onNavigateHome={handleNavigateHome} />
            </div>
          </div>
        )
      case 'gestionar-contratos':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <GestionContratos onNavigateHome={handleNavigateHome} />
            </div>
          </div>
        )
      case 'proyecciones-emprestito':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <ProyeccionesEmprestito onNavigateHome={handleNavigateHome} />
            </div>
          </div>
        )
      case 'gestion-pagos':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <GestionPagos onNavigateHome={handleNavigateHome} />
            </div>
          </div>
        )
      case 'gestionar-unidades-proyecto':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <GestionUnidadesProyecto onNavigateHome={handleNavigateHome} />
            </div>
          </div>
        )
      case 'dashboard':
      default:
        return children
    }
  }

  return (
    <>
      <Header onToggleSidebar={handleToggleSidebar} />
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      <main className="transition-all duration-300 tablet-safe-area">
        {/* Contenedor optimizado para tablets */}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Espaciado responsivo específico para tablets */}
          <div className="px-4 tablet:px-tablet-padding md:px-6 py-4 tablet:py-6 md:py-8">
            {/* Grid container responsivo para diferentes orientaciones */}
            <div className="container mx-auto">
              {/* Orientación landscape en tablets - layout más amplio */}
              <div className="ipad-landscape:max-w-none ipad-landscape:px-8">
                {/* Orientación portrait en tablets - layout más compacto */}
                <div className="ipad-portrait:max-w-4xl ipad-portrait:mx-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Overlay para tablet navigation */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 tablet:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default MainLayout