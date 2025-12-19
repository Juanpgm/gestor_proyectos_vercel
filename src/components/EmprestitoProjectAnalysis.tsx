'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'

interface FlujoCajaRegistro {
  id: string
  organismo: string
  banco: string
  bp_proyecto?: string
  descripcion_bp?: string
  responsable?: string
  mes: string
  periodo: string
  desembolso: number
  desembolso_real?: number
}

interface EmprestitoProjectAnalysisProps {
  data: FlujoCajaRegistro[]
  selectedBancos: Set<string>
  selectedOrganismos: Set<string>
  className?: string
}

const EmprestitoProjectAnalysis: React.FC<EmprestitoProjectAnalysisProps> = ({
  data,
  selectedBancos,
  selectedOrganismos,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'total' | 'cumplimiento' | 'nombre'>('total')

  // Análisis por proyecto
  const projectAnalysis = useMemo(() => {
    const filteredData = data.filter(row =>
      selectedBancos.has(row.banco) &&
      selectedOrganismos.has(row.organismo) &&
      row.banco !== 'nan' &&
      row.bp_proyecto
    )

    const projects = filteredData.reduce((acc, row) => {
      const projectId = row.bp_proyecto!
      if (!acc[projectId]) {
        acc[projectId] = {
          id: projectId,
          descripcion: row.descripcion_bp || 'Sin descripción',
          organismo: row.organismo,
          responsable: row.responsable || 'No especificado',
          totalPlaneado: 0,
          totalReal: 0,
          bancos: new Set<string>(),
          meses: [] as any[]
        }
      }

      acc[projectId].totalPlaneado += row.desembolso || 0
      acc[projectId].totalReal += row.desembolso_real || 0
      acc[projectId].bancos.add(row.banco)
      acc[projectId].meses.push({
        mes: row.mes,
        periodo: row.periodo,
        banco: row.banco,
        planeado: row.desembolso || 0,
        real: row.desembolso_real || 0
      })

      return acc
    }, {} as Record<string, any>)

    return Object.values(projects).map((project: any) => ({
      ...project,
      bancos: Array.from(project.bancos),
      cumplimiento: project.totalPlaneado > 0
        ? (project.totalReal / project.totalPlaneado) * 100
        : 0,
      meses: project.meses.sort((a: any, b: any) =>
        new Date(a.periodo).getTime() - new Date(b.periodo).getTime()
      )
    }))
  }, [data, selectedBancos, selectedOrganismos])

  // Filtrar y ordenar proyectos
  const filteredProjects = useMemo(() => {
    let filtered = projectAnalysis

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (p: any) =>
          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.organismo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Ordenar
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'total':
          return b.totalPlaneado - a.totalPlaneado
        case 'cumplimiento':
          return b.cumplimiento - a.cumplimiento
        case 'nombre':
          return a.descripcion.localeCompare(b.descripcion)
        default:
          return 0
      }
    })

    return filtered
  }, [projectAnalysis, searchTerm, sortBy])

  const totalProjects = projectAnalysis.length
  const avgCumplimiento = projectAnalysis.reduce((sum: number, p: any) => sum + p.cumplimiento, 0) / totalProjects || 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header y Controles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Análisis por Proyecto
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalProjects} proyectos • Cumplimiento promedio: {avgCumplimiento.toFixed(1)}%
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Ordenar */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="total">Mayor desembolso</option>
              <option value="cumplimiento">Mayor cumplimiento</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Proyectos */}
      <div className="space-y-4">
        {filteredProjects.map((project: any, index: number) => {
          const isExpanded = expandedProject === project.id
          const cumplimientoColor =
            project.cumplimiento >= 80
              ? 'text-green-600'
              : project.cumplimiento >= 50
              ? 'text-yellow-600'
              : 'text-red-600'

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header del Proyecto */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setExpandedProject(isExpanded ? null : project.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            BP {project.id}
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            {project.organismo}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {project.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Planeado</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatNumber(project.totalPlaneado, 'currency')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ejecutado</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatNumber(project.totalReal, 'currency')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cumplimiento</p>
                        <p className={`text-sm font-semibold ${cumplimientoColor}`}>
                          {project.cumplimiento.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bancos</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {project.bancos.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Detalles Expandidos */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-6"
                >
                  <div className="space-y-4">
                    {/* Información adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.responsable}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Meses activos</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.meses.length} meses
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bancos asociados */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Bancos asociados
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.bancos.map((banco: string) => (
                          <span
                            key={banco}
                            className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium"
                          >
                            {banco}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timeline mensual */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Evolución mensual
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {project.meses.map((mes: any, idx: number) => {
                          const cumplimientoMes =
                            mes.planeado > 0 ? (mes.real / mes.planeado) * 100 : 0

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-20">
                                  {mes.mes}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 w-32">
                                  {mes.banco}
                                </span>
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 dark:text-gray-400">
                                      {formatNumber(mes.planeado, 'currency')}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {formatNumber(mes.real, 'currency')}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${
                                        cumplimientoMes >= 80
                                          ? 'bg-green-500'
                                          : cumplimientoMes >= 50
                                          ? 'bg-yellow-500'
                                          : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(cumplimientoMes, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-semibold ml-4 ${
                                  cumplimientoMes >= 80
                                    ? 'text-green-600'
                                    : cumplimientoMes >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {cumplimientoMes.toFixed(0)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No se encontraron proyectos con los filtros aplicados
          </p>
        </div>
      )}
    </div>
  )
}

export default EmprestitoProjectAnalysis
