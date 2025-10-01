'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  DollarSign
} from 'lucide-react'
import { CATEGORIES, formatNumber } from '@/lib/design-system'
import { useProyectos } from '@/hooks/useProyectos'
import ContractDetailCard from '@/components/ContractDetailCard'

// Interfaz para proyecto con contratos asociados
interface ProjectWithContracts {
  bpin: number
  nombre_proyecto: string
  nombre_actividad: string
  nombre_centro_gestor: string
  nombre_programa: string
  tipo_gasto: string
  tipo_objetivo: string
  anio: number
  valor_proyecto: number
  // Datos agregados de contratos
  contratos: any[]
  contratosCount: number
  totalValueContratos: number
  valorPagado: number
  valorPendiente: number
  estadosContratos: string[]
  tiposContratos: string[]
  // Datos de empréstito
  isEmprestito: boolean
  valor_emprestito: number
  fuente_emprestito: string
  bp: string
  nombre_comercial: string
}

// Props del componente
interface IntegratedProjectsContractsProps {
  onFilteredBpinsChange?: (bpins: number[] | undefined) => void // Callback para comunicar BPIN filtrados, undefined = sin filtro
}

const IntegratedProjectsContracts: React.FC<IntegratedProjectsContractsProps> = ({ 
  onFilteredBpinsChange 
}) => {
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentroGestor, setSelectedCentroGestor] = useState('')
  const [selectedTipoContrato, setSelectedTipoContrato] = useState('')
  const [selectedEstadoContrato, setSelectedEstadoContrato] = useState('')
  const [selectedBanco, setSelectedBanco] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedProject, setExpandedProject] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Hooks para datos
  const proyectosState = useProyectos()
  
  // Estados para datos de contratos
  const [contratosData, setContratosData] = React.useState<any[]>([])
  const [loadingContratos, setLoadingContratos] = React.useState(true)
  const [errorContratos, setErrorContratos] = React.useState<string | null>(null)

  // Estado para mapa BPIN -> BP
  const [bpinToBpMap, setBpinToBpMap] = React.useState<Record<number, string>>({})

  // Cargar datos de emp_contratos.json
  React.useEffect(() => {
    const loadContratosData = async () => {
      try {
        setLoadingContratos(true)
        const response = await fetch('/data/emprestito/emp_contratos.json')
        if (!response.ok) {
          throw new Error('Error al cargar los datos de contratos')
        }
        const data = await response.json()
        setContratosData(data)
        setErrorContratos(null)
      } catch (error) {
        console.error('Error cargando contratos:', error)
        setErrorContratos(error instanceof Error ? error.message : 'Error desconocido')
        setContratosData([])
      } finally {
        setLoadingContratos(false)
      }
    }

    loadContratosData()
  }, [])

  // Cargar datos de características de proyectos para obtener el BP real
  React.useEffect(() => {
    const loadBpinToBpMap = async () => {
      try {
        const response = await fetch('/data/emprestito/caracteristicas_proyectos.json')
        if (response.ok) {
          const data = await response.json()
          const map: Record<number, string> = {}
          data.forEach((item: any) => {
            if (item.bpin && item.bp) {
              map[parseInt(item.bpin)] = item.bp
            }
          })
          setBpinToBpMap(map)
        }
      } catch (error) {
        console.warn('No se pudieron cargar las características de proyectos:', error)
      }
    }

    loadBpinToBpMap()
  }, [])

  // Integración de datos - mostrar TODOS los contratos de empréstito
  const integratedData = useMemo(() => {
    // Verificar que tenemos datos de contratos
    if (!contratosData || contratosData.length === 0) {
      console.warn('⚠️ No hay datos de contratos de empréstito disponibles')
      return []
    }

    const proyectos = proyectosState.proyectos || []
    const contratosEmprestito = contratosData
    
    // Crear un mapa de proyectos por BPIN para referencia rápida
    const proyectosPorBpin = proyectos.reduce((acc: Record<number, any>, proyecto: any) => {
      if (proyecto.bpin) {
        acc[proyecto.bpin] = proyecto
      }
      return acc
    }, {} as Record<number, any>)
    
    // Separar contratos con BPIN y sin BPIN
    const contratosConBpin: any[] = []
    const contratosSinBpin: any[] = []
    
    contratosEmprestito.forEach((contrato: any) => {
      // Buscar BPIN en diferentes campos posibles
      const bpinValue = contrato.bpin || contrato.codigo_bpin || contrato.id_bpin
      if (bpinValue) {
        contratosConBpin.push({...contrato, bpin: bpinValue})
      } else {
        contratosSinBpin.push(contrato)
      }
    })
    
    // Crear un mapa de contratos con BPIN por BPIN
    const contratosPorBpin = contratosConBpin.reduce((acc: Record<number, any[]>, contrato: any) => {
      const bpin = parseInt(contrato.bpin)
      if (isNaN(bpin)) return acc
      
      if (!acc[bpin]) {
        acc[bpin] = []
      }
      acc[bpin].push(contrato)
      
      return acc
    }, {} as Record<number, any[]>)

    const result: ProjectWithContracts[] = []

    // 1. Procesar contratos con BPIN
    const validBpins = Object.keys(contratosPorBpin).map(k => parseInt(k))
    
    validBpins.forEach((bpin: number) => {
      const contratosAsociados = contratosPorBpin[bpin] || []
      const proyectoExistente = proyectosPorBpin[bpin]
      const primerContrato = contratosAsociados[0]
      
      result.push({
        // Datos del proyecto (reales o generados)
        bpin: bpin,
        nombre_proyecto: proyectoExistente?.nombre_proyecto || primerContrato?.objeto_contrato || `Proyecto BPIN ${bpin}`,
        nombre_actividad: proyectoExistente?.nombre_actividad || primerContrato?.objeto_contrato || 'Actividad no especificada',
        nombre_centro_gestor: proyectoExistente?.nombre_centro_gestor || primerContrato?.nombre_entidad || 'Centro gestor no especificado',
        nombre_programa: proyectoExistente?.nombre_programa || 'Programa no especificado',
        tipo_gasto: proyectoExistente?.tipo_gasto || 'No especificado',
        tipo_objetivo: proyectoExistente?.tipo_objetivo || 'No especificado',
        anio: proyectoExistente?.anio || new Date().getFullYear(),
        valor_proyecto: proyectoExistente?.valor_proyecto || contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_contrato || 0), 0),
        
        // Datos de contratos
        contratos: contratosAsociados,
        contratosCount: contratosAsociados.length,
        totalValueContratos: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_contrato || 0), 0),
        valorPagado: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_pagado || 0), 0),
        valorPendiente: contratosAsociados.reduce((sum: number, c: any) => sum + (c.valor_pendiente || 0), 0),
        estadosContratos: Array.from(new Set(contratosAsociados.map((c: any) => c.estado_contrato).filter(Boolean))),
        tiposContratos: Array.from(new Set(contratosAsociados.map((c: any) => c.tipo_contrato).filter(Boolean))),
        
        // Datos de empréstito
        isEmprestito: true,
        valor_emprestito: 0,
        fuente_emprestito: primerContrato?.registro_origen?.banco || '',
        bp: bpinToBpMap[bpin] || '',
        nombre_comercial: primerContrato?.objeto_contrato || ''
      } as ProjectWithContracts)
    })

    // 2. Procesar contratos sin BPIN - crear entradas individuales
    contratosSinBpin.forEach((contrato: any, index: number) => {
      const bpinVirtual = -(index + 1) // BPIN negativo para identificar contratos sin BPIN
      
      result.push({
        // Datos generados para contrato sin BPIN
        bpin: bpinVirtual,
        nombre_proyecto: contrato.objeto_contrato || `Contrato sin BPIN ${Math.abs(bpinVirtual)}`,
        nombre_actividad: contrato.objeto_contrato || 'Actividad no especificada',
        nombre_centro_gestor: contrato.nombre_entidad || 'Centro gestor no especificado',
        nombre_programa: 'Programa no especificado',
        tipo_gasto: 'No especificado',
        tipo_objetivo: 'No especificado',
        anio: new Date().getFullYear(),
        valor_proyecto: contrato.valor_contrato || 0,
        
        // Datos de contratos
        contratos: [contrato],
        contratosCount: 1,
        totalValueContratos: contrato.valor_contrato || 0,
        valorPagado: contrato.valor_pagado || 0,
        valorPendiente: contrato.valor_pendiente || 0,
        estadosContratos: contrato.estado_contrato ? [contrato.estado_contrato] : [],
        tiposContratos: contrato.tipo_contrato ? [contrato.tipo_contrato] : [],
        
        // Datos de empréstito
        isEmprestito: true,
        valor_emprestito: 0,
        fuente_emprestito: contrato.registro_origen?.banco || '',
        bp: '',
        nombre_comercial: contrato.objeto_contrato || ''
      } as ProjectWithContratos)
    })

    // Ordenar por valor total de contratos descendente
    const sortedResult = result.sort((a: any, b: any) => {
      return b.totalValueContratos - a.totalValueContratos
    })
    
    return sortedResult
  }, [contratosData, proyectosState.proyectos, bpinToBpMap])

  // Opciones dinámicas para filtros
  const centrosGestor = useMemo(() => {
    const uniqueCentros = new Set(
      integratedData.map(p => p.nombre_centro_gestor).filter(Boolean)
    )
    return Array.from(uniqueCentros).sort()
  }, [integratedData])

  const tiposContrato = useMemo(() => {
    const uniqueTipos = new Set(
      integratedData.flatMap(p => p.tiposContratos)
    )
    return Array.from(uniqueTipos).sort()
  }, [integratedData])

  const estadosContrato = useMemo(() => {
    const uniqueEstados = new Set(
      integratedData.flatMap(p => p.estadosContratos)
    )
    return Array.from(uniqueEstados).sort()
  }, [integratedData])

  const bancosContrato = useMemo(() => {
    const uniqueBancos = new Set<string>()
    integratedData.forEach(p => {
      p.contratos.forEach((contrato: any) => {
        // Los contratos ahora vienen directamente de empréstito con el campo banco
        const banco = contrato.banco || contrato._registro_origen?.banco || contrato.nombre_del_banco
        if (banco && banco !== 'No definido' && banco.trim() !== '') {
          uniqueBancos.add(banco)
        }
      })
    })
    return Array.from(uniqueBancos).sort()
  }, [integratedData])

  // Datos filtrados - búsqueda mejorada y filtros por estado y tipo
  const filteredData = useMemo(() => {
    return integratedData.filter((project: any) => {
      // Filtro por búsqueda amplia en todos los campos relevantes
      const matchesSearch = searchTerm === '' || 
        (project.nombre_proyecto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.nombre_actividad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.bpin || '').toString().includes(searchTerm) ||
        (project.nombre_centro_gestor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.nombre_programa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tipo_gasto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tipo_objetivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.fuente_emprestito || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.bp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.nombre_comercial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.contratos.some((c: any) => 
          (c.descripcion_proceso || c.descripcion_del_proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.proveedor_adjudicado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.nombre_entidad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.referencia_contrato || c.referencia_del_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.objeto_contrato || c.objeto_del_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.tipo_contrato || c.tipo_de_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.estado_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.modalidad_contratacion || c.modalidad_de_contratacion || '').toLowerCase().includes(searchTerm.toLowerCase())
        )

      // Filtro por centro gestor
      const matchesCentroGestor = selectedCentroGestor === '' || 
        (project.nombre_centro_gestor || '') === selectedCentroGestor

      // Filtro por tipo de contrato - verificar que al menos un contrato tenga el tipo seleccionado
      const matchesTipoContrato = selectedTipoContrato === '' || 
        project.contratos.some((c: any) => (c.tipo_contrato || c.tipo_de_contrato) === selectedTipoContrato)

      // Filtro por estado de contrato - verificar que al menos un contrato tenga el estado seleccionado
      const matchesEstadoContrato = selectedEstadoContrato === '' || 
        project.contratos.some((c: any) => c.estado_contrato === selectedEstadoContrato)

      // Filtro por banco - verificar que al menos un contrato tenga el banco seleccionado
      const matchesBanco = selectedBanco === '' || 
        project.contratos.some((c: any) => {
          const banco = c.banco || c._registro_origen?.banco || c.nombre_del_banco
          return banco === selectedBanco
        })

      return matchesSearch && matchesCentroGestor && matchesTipoContrato && matchesEstadoContrato && matchesBanco
    })
  }, [integratedData, searchTerm, selectedCentroGestor, selectedTipoContrato, selectedEstadoContrato, selectedBanco])

  // Sin filtros adicionales - usar datos directamente
  const finalFilteredData = filteredData

  // Efecto para comunicar BPIN filtrados al mapa
  React.useEffect(() => {
    if (onFilteredBpinsChange) {
      // Verificar si hay filtros activos
      const hasActiveFilters = searchTerm || selectedCentroGestor || selectedTipoContrato || selectedEstadoContrato || selectedBanco
      
      if (hasActiveFilters) {
        // Si hay filtros activos, comunicar los BPIN específicos (puede ser array vacío si no hay resultados)
        const filteredBpins = finalFilteredData.map(project => project.bpin)
        onFilteredBpinsChange(filteredBpins)
      } else {
        // Si no hay filtros activos, no aplicar filtro en el mapa (mostrar todas las unidades)
        onFilteredBpinsChange(undefined)
      }
    }
  }, [finalFilteredData, searchTerm, selectedCentroGestor, selectedTipoContrato, selectedEstadoContrato, selectedBanco, onFilteredBpinsChange])

  // Paginación usando finalFilteredData
  const totalPages = Math.ceil(finalFilteredData.length / itemsPerPage)
  const paginatedData = finalFilteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Función para filtrar contratos de un proyecto según los filtros activos
  const getFilteredContracts = React.useCallback((contratos: any[]) => {
    return contratos.filter(contrato => {
      // Filtro por tipo de contrato
      const matchesTipoContrato = selectedTipoContrato === '' || 
        (contrato.tipo_contrato || contrato.tipo_de_contrato) === selectedTipoContrato

      // Filtro por estado de contrato
      const matchesEstadoContrato = selectedEstadoContrato === '' || 
        contrato.estado_contrato === selectedEstadoContrato

      // Filtro por banco
      const matchesBanco = selectedBanco === '' || (() => {
        const banco = contrato.banco || contrato._registro_origen?.banco || contrato.nombre_del_banco
        return banco === selectedBanco
      })()

      // Filtro por búsqueda en contratos
      const matchesSearchInContract = searchTerm === '' ||
        (contrato.descripcion_proceso || contrato.descripcion_del_proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.proveedor_adjudicado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.nombre_entidad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.referencia_contrato || contrato.referencia_del_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.objeto_contrato || contrato.objeto_del_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.tipo_contrato || contrato.tipo_de_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.estado_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.modalidad_contratacion || contrato.modalidad_de_contratacion || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesTipoContrato && matchesEstadoContrato && matchesBanco && matchesSearchInContract
    })
  }, [selectedTipoContrato, selectedEstadoContrato, selectedBanco, searchTerm])

  // Métricas usando finalFilteredData - calculando contratos que realmente pasan los filtros
  const totalContratos = finalFilteredData.reduce((sum, p) => {
    const filteredContracts = getFilteredContracts(p.contratos)
    return sum + filteredContracts.length
  }, 0)
  
  const totalValue = finalFilteredData.reduce((sum, p) => {
    const filteredContracts = getFilteredContracts(p.contratos)
    const contractsValue = filteredContracts.reduce((contractSum: number, c: any) => 
      contractSum + (c.valor_contrato || c.valor_del_contrato || 0), 0)
    return sum + contractsValue
  }, 0)
  
  const emprestitoProjectsWithContracts = finalFilteredData.filter(p => {
    const filteredContracts = getFilteredContracts(p.contratos)
    return p.isEmprestito && filteredContracts.length > 0
  }).length

  // Funciones auxiliares
  const toggleProjectExpansion = (bpin: number) => {
    setExpandedProject(prev => prev === bpin ? null : bpin)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCentroGestor('')
    setSelectedTipoContrato('')
    setSelectedEstadoContrato('')
    setSelectedBanco('')
    setCurrentPage(1)
  }

  const getActiveFiltersDescription = () => {
    const filters = []
    if (selectedCentroGestor) filters.push(`Centro: ${selectedCentroGestor}`)
    if (selectedTipoContrato) filters.push(`Tipo: ${selectedTipoContrato}`)
    if (selectedEstadoContrato) filters.push(`Estado: ${selectedEstadoContrato}`)
    if (selectedBanco) filters.push(`Banco: ${selectedBanco}`)
    return filters.length > 0 ? ` (${filters.join(', ')})` : ''
  }

  const loading = proyectosState.loading || loadingContratos

  // Mostrar errores específicos si los hay
  if (proyectosState.error || errorContratos) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-3" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar datos de proyectos
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {proyectosState.error && (
              <p>• Proyectos: {proyectosState.error}</p>
            )}
            {errorContratos && (
              <p>• Contratos: {errorContratos}</p>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse text-center text-gray-500 dark:text-gray-400">
          Cargando proyectos integrados...
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay datos después de cargar
  if (!loading && integratedData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-3" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay datos de proyectos disponibles
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            No se encontraron contratos de empréstito para mostrar.
          </p>
          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <p>Estado de carga:</p>
            <p>• Proyectos: {proyectosState.proyectos?.length || 0} registros</p>
            <p>• Contratos: {contratosData?.length || 0} registros</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${CATEGORIES.emprestito.gradient}`}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Seguimiento a Proyectos y Contratos de Empréstito
              </h3>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-teal-600 dark:text-teal-400">Total Proyectos</div>
            <div className="text-lg font-semibold text-teal-800 dark:text-teal-300">
              {finalFilteredData.length.toLocaleString()}
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-amber-600 dark:text-amber-400">Total Contratos</div>
            <div className="text-lg font-semibold text-amber-800 dark:text-amber-300">
              {totalContratos.toLocaleString()}
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-2">
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Valor Total</div>
            <div className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
              {formatNumber(totalValue, 'currency')}
            </div>
          </div>
        </div>

        {/* Barra de búsqueda principal */}
        <div className="mt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar proyectos, actividades, BPIN, entidades, contratos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-base"
            />
          </div>
        </div>

        {/* Filtros adicionales colapsables */}
        <div className="mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filtros avanzados
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Centro Gestor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Centro Gestor
                    </label>
                    <select
                      value={selectedCentroGestor}
                      onChange={(e) => setSelectedCentroGestor(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los centros gestor</option>
                      {centrosGestor.map(centro => (
                        <option key={centro} value={centro}>
                          {centro}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Contrato */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo de Contrato
                    </label>
                    <select
                      value={selectedTipoContrato}
                      onChange={(e) => setSelectedTipoContrato(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los tipos</option>
                      {tiposContrato.map(tipo => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado de Contrato */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado de Contrato
                    </label>
                    <select
                      value={selectedEstadoContrato}
                      onChange={(e) => setSelectedEstadoContrato(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los estados</option>
                      {estadosContrato.map(estado => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Banco */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Banco
                    </label>
                    <select
                      value={selectedBanco}
                      onChange={(e) => setSelectedBanco(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Todos los bancos</option>
                      {bancosContrato.map(banco => (
                        <option key={banco} value={banco}>
                          {banco}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Limpiar filtros */}
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lista de proyectos */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <AnimatePresence>
          {paginatedData.map((project, index) => {
            const isExpanded = expandedProject === project.bpin
            
            return (
              <motion.div
                key={project.bpin}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {/* Cabecera del proyecto */}
                <div 
                  className={`p-6 ${project.contratosCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => project.contratosCount > 0 && toggleProjectExpansion(project.bpin)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-shrink-0">
                          {project.contratosCount > 0 ? (
                            isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">∅</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {project.nombre_proyecto}
                              </h3>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-2">
                            {project.nombre_actividad}
                          </p>
                          
                          {/* BPIN y BP debajo del segundo texto */}
                          <div className="flex flex-wrap items-center gap-4 text-sm mb-1">
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-blue-600 dark:text-blue-400">BPIN: {project.bpin}</span>
                            </div>
                            {project.isEmprestito && project.bp && (
                              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <FileText className="h-4 w-4" />
                                <span>BP: {project.bp}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <Calendar className="h-4 w-4" />
                              <span>{project.anio}</span>
                            </div>
                          </div>
                          
                          {/* Centro gestor alineado con los códigos */}
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Building2 className="h-4 w-4" />
                            <span>{project.nombre_centro_gestor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 ml-6">
                      <div className="text-right">
                        {(() => {
                          const filteredContracts = getFilteredContracts(project.contratos)
                          const filteredValue = filteredContracts.reduce((sum: number, c: any) => 
                            sum + (c.valor_contrato || c.valor_del_contrato || 0), 0)
                          const hasFilters = selectedTipoContrato || selectedEstadoContrato || selectedBanco || searchTerm
                          
                          return (
                            <>
                              <div className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                                ${(hasFilters ? filteredValue : project.totalValueContratos).toLocaleString('es-CO')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {hasFilters ? (
                                  filteredContracts.length > 0 ? (
                                    <>
                                      <span className="text-teal-600 dark:text-teal-400">
                                        {filteredContracts.length}
                                      </span>
                                      <span className="text-gray-400 mx-1">de</span>
                                      <span>
                                        {project.contratosCount} contrato{project.contratosCount > 1 ? 's' : ''}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400">Sin contratos (filtrado)</span>
                                  )
                                ) : (
                                  project.contratosCount > 0 ? (
                                    `${project.contratosCount} contrato${project.contratosCount > 1 ? 's' : ''}`
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400">Sin contratos</span>
                                  )
                                )}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {project.tipo_gasto}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos - Contratos */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="p-6">
                        {(() => {
                          const filteredContracts = getFilteredContracts(project.contratos)
                          const hasFilters = selectedTipoContrato || selectedEstadoContrato || selectedBanco || searchTerm
                          
                          return (
                            <>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  Contratos Asociados 
                                  {hasFilters ? (
                                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                      ({filteredContracts.length} de {project.contratos.length} mostrados)
                                    </span>
                                  ) : (
                                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                      ({project.contratos.length})
                                    </span>
                                  )}
                                </h4>
                                {hasFilters && filteredContracts.length !== project.contratos.length && (
                                  <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">
                                    Filtros aplicados
                                  </div>
                                )}
                              </div>
                              
                              {filteredContracts.length > 0 ? (
                                <div className="space-y-4">
                                  {filteredContracts.map((contrato, contractIndex) => (
                                    <ContractDetailCard
                                      key={`${contrato.bpin}-${contrato.id_contrato}-${contractIndex}`}
                                      contrato={contrato}
                                      contractIndex={contractIndex}
                                      proyectoData={{
                                        nombre_centro_gestor: project.nombre_centro_gestor,
                                        bpin: project.bpin,
                                        bp: project.bp
                                      }}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p className="text-lg font-medium">No hay contratos que coincidan con los filtros</p>
                                  <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, finalFilteredData.length)} de {finalFilteredData.length} proyectos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegratedProjectsContracts
