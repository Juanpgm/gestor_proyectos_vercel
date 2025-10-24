'use client'

import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import GestionProcesos from '@/components/GestionProcesos'
import ProyeccionesEmprestito from '@/components/ProyeccionesEmprestito'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
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
      case 'proyecciones-emprestito':
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
              <ProyeccionesEmprestito onNavigateHome={handleNavigateHome} />
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

      <main className="transition-all duration-300">
        {renderContent()}
      </main>
    </>
  )
}

export default MainLayout