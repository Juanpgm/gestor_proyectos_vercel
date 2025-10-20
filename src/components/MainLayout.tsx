'use client'

import React, { useState } from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import GestionProcesos from '@/components/GestionProcesos'

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
        return <GestionProcesos onNavigateHome={handleNavigateHome} />
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