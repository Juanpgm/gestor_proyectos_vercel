'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Header from '@/components/Header'
import StatsCards from '@/components/StatsCards'
import ProjectsTable from '@/components/ProjectsTable'
import { DataProvider } from '@/context/DataContext'
import UnidadesProyecto from '@/components/UnidadesProyecto'
import MobileNavigation from '@/components/MobileNavigation'

type ActiveTab = 'projects' | 'project_units' | 'contracts' | 'activities' | 'products' | 'emprestito' | 'procesos'

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('projects')

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return (
          <div className="space-y-6">
            <StatsCards />
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-4 order-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                  <div className="overflow-hidden">
                    <ProjectsTable className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'project_units':
        return (
          <div className="space-y-6">
            <UnidadesProyecto />
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-blue-500 text-4xl mb-4">🚧</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sección "{activeTab}" en desarrollo
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Esta funcionalidad se agregará pronto
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />
      
      <main className="px-4 md:px-6 py-6 md:py-8 container mx-auto">
        <MobileNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardContent />
    </DataProvider>
  )
}