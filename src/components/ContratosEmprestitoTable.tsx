'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Search, 
  Filter, 
  ChevronDown,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'
import ContratosModal from '@/components/ContratosModal'
import { getContratosEmprestitoUrl } from '@/config/api'

// Interfaz para los contratos de empréstito - Basada exactamente en la respuesta del endpoint GET /contratos_emprestito_all
interface ContratoEmprestito {
  // Campos principales del endpoint
  tipo_contrato: string
  representante_legal: string
  nombre_centro_gestor: string
  supervisor: string
  fecha_firma_contrato?: string | null
  modalidad_contratacion: string
  _dataset_source: string
  bp: string
  bpin?: number | null
  nit_contratista: string
  nombre_contratista: string
  sector: string
  descripcion_proceso: string
  estado_contrato: string
  nit_entidad: string
  proceso_contractual: string
  fecha_fin_contrato: string
  id_contrato: string
  valor_contrato: number
  valor_pagado: string | number
  fecha_guardado: string
  fecha_inicio_contrato?: string | null
  ordenador_gasto: string
  banco: string
  nombre_procedimiento: string
  referencia_proceso: string
  fuente_datos: string
  referencia_contrato: string
  entidad_contratante: string
  version_esquema: string
  urlproceso?: {
    url: string
  }
  objeto_contrato: string
  id: string
}

const ContratosEmprestitoTable: React.FC = () => {
  // Funciones utilitarias
  const parseValorPagado = (valor: string | number): number => {
    return typeof valor === 'string' ? parseFloat(valor) || 0 : valor || 0
  }

  const formatCurrencyColombian = (amount: number): string => {
    // Formato colombiano completo con separadores de miles
    return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP`
  }

  // Función para formatear cifras resumidas solo en espacios muy pequeños
  const formatCurrencyCompact = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} mil M`
    } else if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1).replace('.', ',')} M`
    } else {
      return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
  }

  // Estados para datos
  const [contratos, setContratos] = useState<ContratoEmprestito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntidad, setSelectedEntidad] = useState('')
  const [selectedTipoContrato, setSelectedTipoContrato] = useState('')
  const [selectedEstadoContrato, setSelectedEstadoContrato] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Estado para modal
  const [selectedContrato, setSelectedContrato] = useState<ContratoEmprestito | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Estados para modal de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingContrato, setEditingContrato] = useState<ContratoEmprestito | null>(null)
  const [paymentData, setPaymentData] = useState({
    fecha_pago: '',
    monto_pagado: '',
    soporte_pago: null as File | null
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Cargar datos del endpoint GET /contratos_emprestito_all
  useEffect(() => {
    const fetchContratos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🚀 Cargando contratos de empréstito...')
        
        const endpoint = getContratosEmprestitoUrl()
        console.log('� Endpoint:', endpoint)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('📊 Respuesta:', { tipo: typeof data, esArray: Array.isArray(data), longitud: data?.length })
        
        // Manejar diferentes tipos de respuesta
        let contratos = []
        if (Array.isArray(data)) {
          contratos = data
        } else if (data && typeof data === 'object' && Array.isArray(data.contratos)) {
          contratos = data.contratos
        } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
          contratos = data.data
        } else {
          console.warn('⚠️ Estructura de respuesta inesperada:', data)
          throw new Error('La respuesta del API no contiene datos válidos')
        }
        
        console.log('✅ Contratos cargados:', contratos.length)
        setContratos(contratos)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        console.error('❌ Error conectando con API:', errorMessage)
        
        // Intentar cargar datos locales como fallback
        try {
          console.log('📂 Intentando cargar datos locales de respaldo...')
          const localResponse = await fetch('/data/emprestito/emp_contratos.json')
          if (localResponse.ok) {
            const localData = await localResponse.json()
            if (Array.isArray(localData) && localData.length > 0) {
              console.log('✅ Datos locales cargados:', localData.length, 'contratos')
              setContratos(localData)
              setError(`API no disponible. Mostrando datos locales (${localData.length} contratos)`)
              return
            }
          }
        } catch (localErr) {
          console.warn('⚠️ No se pudieron cargar datos locales:', localErr)
        }
        
        setError(`Error al cargar contratos: ${errorMessage}`)
        setContratos([])
      } finally {
        setLoading(false)
      }
    }

    fetchContratos()
  }, [])

  // Opciones dinámicas para filtros
  const entidades = useMemo(() => {
    const uniqueEntidades = new Set(
      contratos.map(c => c.entidad_contratante).filter(Boolean)
    )
    return Array.from(uniqueEntidades).sort()
  }, [contratos])

  const tiposContrato = useMemo(() => {
    const uniqueTipos = new Set(
      contratos.map(c => c.tipo_contrato).filter(Boolean)
    )
    return Array.from(uniqueTipos).sort()
  }, [contratos])

  const estadosContrato = useMemo(() => {
    const uniqueEstados = new Set(
      contratos.map(c => c.estado_contrato).filter(Boolean)
    )
    return Array.from(uniqueEstados).sort()
  }, [contratos])

  const sectores = useMemo(() => {
    const uniqueSectores = new Set(
      contratos.map(c => c.sector).filter(Boolean)
    )
    return Array.from(uniqueSectores).sort()
  }, [contratos])

  // Datos filtrados
  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      // Filtro por búsqueda - usando exclusivamente campos del endpoint GET /contratos_emprestito_all
      const matchesSearch = searchTerm === '' || 
        (contrato.entidad_contratante || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.descripcion_proceso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.representante_legal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.referencia_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.id_contrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.proceso_contractual || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.nombre_centro_gestor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contrato.bpin || '').toString().includes(searchTerm)

      // Filtro por entidad
      const matchesEntidad = selectedEntidad === '' || contrato.entidad_contratante === selectedEntidad

      // Filtro por tipo de contrato
      const matchesTipoContrato = selectedTipoContrato === '' || contrato.tipo_contrato === selectedTipoContrato

      // Filtro por estado de contrato
      const matchesEstadoContrato = selectedEstadoContrato === '' || contrato.estado_contrato === selectedEstadoContrato

      // Filtro por sector
      const matchesSector = selectedSector === '' || contrato.sector === selectedSector

      return matchesSearch && matchesEntidad && matchesTipoContrato && matchesEstadoContrato && matchesSector
    })
  }, [contratos, searchTerm, selectedEntidad, selectedTipoContrato, selectedEstadoContrato, selectedSector])

  // Paginación
  const totalPages = Math.ceil(filteredContratos.length / itemsPerPage)
  const paginatedContratos = filteredContratos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Métricas calculadas
  const totalContratos = filteredContratos.length
  const totalValue = filteredContratos.reduce((sum, c) => sum + (c.valor_contrato || 0), 0)
  const totalPagado = filteredContratos.reduce((sum, c) => sum + parseValorPagado(c.valor_pagado), 0)
  const totalPendiente = filteredContratos.reduce((sum, c) => {
    return sum + (c.valor_contrato - parseValorPagado(c.valor_pagado))
  }, 0)

  // Funciones auxiliares
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedEntidad('')
    setSelectedTipoContrato('')
    setSelectedEstadoContrato('')
    setSelectedSector('')
    setCurrentPage(1)
  }

  const openModal = (contrato: ContratoEmprestito) => {
    setSelectedContrato(contrato)
    setShowModal(true)
  }

  const closeModal = () => {
    setSelectedContrato(null)
    setShowModal(false)
  }

  const openPaymentModal = (contrato: ContratoEmprestito) => {
    setEditingContrato(contrato)
    setPaymentData({
      fecha_pago: '',
      monto_pagado: '',
      soporte_pago: null
    })
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setEditingContrato(null)
    setShowPaymentModal(false)
    setPaymentData({
      fecha_pago: '',
      monto_pagado: '',
      soporte_pago: null
    })
    setIsSaving(false)
    setIsDragging(false)
  }

  const handlePaymentDataChange = (field: string, value: string | File | null) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatMontoInput = (value: string) => {
    // Remover todo excepto números
    const numbers = value.replace(/[^\d]/g, '')
    if (!numbers) return ''
    
    // Formatear con separadores colombianos
    const formatted = parseInt(numbers).toLocaleString('es-CO')
    return `$${formatted}`
  }

  const parseMontoInput = (value: string): number => {
    // Remover todo excepto números para obtener el valor real
    const numbers = value.replace(/[^\d]/g, '')
    return parseInt(numbers) || 0
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]
    
    if (allowedTypes.includes(file.type)) {
      handlePaymentDataChange('soporte_pago', file)
    } else {
      alert('Tipo de archivo no permitido. Solo se permiten: PDF, DOCX, XLSX, TXT')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleSavePayment = async () => {
    if (!editingContrato || !paymentData.fecha_pago || !paymentData.monto_pagado) return
    
    setIsSaving(true)
    try {
      console.log('Guardando pago para contrato:', editingContrato.referencia_contrato)
      console.log('Datos del pago:', {
        referencia_contrato: editingContrato.referencia_contrato,
        fecha_pago: paymentData.fecha_pago,
        monto_pagado: parseMontoInput(paymentData.monto_pagado),
        soporte_pago: paymentData.soporte_pago?.name
      })
      
      // Simular delay de guardado
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      closePaymentModal()
      alert('Pago registrado exitosamente')
    } catch (error) {
      console.error('Error al registrar el pago:', error)
      alert('Error al registrar el pago')
    } finally {
      setIsSaving(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'en ejecución':
      case 'ejecutándose':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'terminado':
      case 'terminado anormalmente':
      case 'liquidado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'celebrado':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('es-CO')
    } catch {
      return dateString
    }
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar los contratos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Cargando contratos de empréstito...
            </span>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              <p>Consultando datos desde el API</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 animate-pulse">
              <FileText className="w-5 h-5 text-white" />
            </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Seguimiento a Proyectos y Contratos de Empréstito
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gestión integral de contratos financiados con recursos de empréstito
                </p>
              </div>
            </div>
          </div>

          {/* Métricas resumidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg px-4 py-3">
              <div className="text-xs text-teal-600 dark:text-teal-400 font-medium">Total Contratos</div>
              <div className="text-xl font-bold text-teal-800 dark:text-teal-300">
                {totalContratos.toLocaleString()}
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Valor Total</div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300" 
                   title={`$${totalValue.toLocaleString('es-CO')}`}>
                {formatCurrencyColombian(totalValue)}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Valor Pagado</div>
              <div className="text-xl font-bold text-blue-800 dark:text-blue-300"
                   title={`$${totalPagado.toLocaleString('es-CO')}`}>
                {formatCurrencyColombian(totalPagado)}
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pendiente Pago</div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-300"
                   title={`$${totalPendiente.toLocaleString('es-CO')}`}>
                {formatCurrencyColombian(totalPendiente)}
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar en contratos de empréstito: entidad, proceso, representante legal, referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-base"
              />
            </div>
          </div>

          {/* Filtros adicionales */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Entidad */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Entidad
                      </label>
                      <select
                        value={selectedEntidad}
                        onChange={(e) => setSelectedEntidad(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Todas las entidades</option>
                        {entidades.map(entidad => (
                          <option key={entidad} value={entidad}>
                            {entidad.length > 50 ? `${entidad.substring(0, 50)}...` : entidad}
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
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-sm"
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
                        Estado
                      </label>
                      <select
                        value={selectedEstadoContrato}
                        onChange={(e) => setSelectedEstadoContrato(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Todos los estados</option>
                        {estadosContrato.map(estado => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sector
                      </label>
                      <select
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Todos los sectores</option>
                        {sectores.map(sector => (
                          <option key={sector} value={sector}>
                            {sector}
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

        {/* Tabla de contratos */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2">
                  Información del Contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[18%]">
                  Clasificación & Cronología
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">
                  Valores Financieros
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">
                  Indicadores de Progreso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[7%]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {paginatedContratos.map((contrato, index) => (
                  <motion.tr
                    key={contrato.id_contrato || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {/* Información del contrato */}
                    <td className="px-4 py-4 w-1/2 align-top">
                      <div className="space-y-3">
                        {/* Header con Banco */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                            {contrato.banco}
                          </div>
                          {contrato.bpin && (
                            <div className="flex items-center gap-1 text-sm">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                BPIN: {contrato.bpin}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Referencia del Contrato */}
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Referencia:</span>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {contrato.referencia_contrato}
                          </div>
                        </div>
                        
                        {/* Centro Gestor */}
                        <div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">Centro Gestor:</span>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {contrato.nombre_centro_gestor}
                          </div>
                        </div>

                        {/* Objeto del Contrato */}
                        <div className="mt-4">
                          <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700/30 dark:to-blue-900/20 rounded-xl border-l-4 border-blue-400 dark:border-blue-500 shadow-sm">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              Objeto del Contrato:
                            </span>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{contrato.objeto_contrato}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Clasificación & Cronología */}
                    <td className="px-4 py-4 w-[18%] align-top">
                      <div className="space-y-3">
                        {/* Tipo de Contrato */}
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Tipo:</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 w-full text-center">
                            {contrato.tipo_contrato}
                          </span>
                        </div>
                        
                        {/* Estado del Contrato */}
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Estado:</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium w-full text-center ${getEstadoColor(contrato.estado_contrato)}`}>
                            {contrato.estado_contrato}
                          </span>
                        </div>
                        
                        {/* Sector */}
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Sector:</span>
                          <div className="text-xs text-gray-700 dark:text-gray-300 text-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                            {contrato.sector}
                          </div>
                        </div>

                        {/* Fechas Comprimidas */}
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Cronología:</span>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Firma:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {formatDate(contrato.fecha_firma_contrato || 'N/A')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {formatDate(contrato.fecha_inicio_contrato || 'N/A')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Fin:</span>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {formatDate(contrato.fecha_fin_contrato)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Valores Financieros */}
                    <td className="px-3 py-4 w-[15%] align-top">
                      <div className="space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded-lg">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">💰 Valor Total:</span>
                          <div className="text-sm font-bold text-gray-900 dark:text-white break-words" title={`$${contrato.valor_contrato.toLocaleString('es-CO')}`}>
                            {formatCurrencyColombian(contrato.valor_contrato)}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 block mb-1">✅ Pagado:</span>
                          <div className="text-sm font-semibold text-green-700 dark:text-green-300 break-words" 
                               title={`$${parseValorPagado(contrato.valor_pagado).toLocaleString('es-CO')}`}>
                            {formatCurrencyColombian(parseValorPagado(contrato.valor_pagado))}
                          </div>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block mb-1">⏳ Pendiente:</span>
                          <div className="text-sm font-semibold text-amber-700 dark:text-amber-300 break-words" 
                               title={`$${(contrato.valor_contrato - parseValorPagado(contrato.valor_pagado)).toLocaleString('es-CO')}`}>
                            {formatCurrencyColombian(contrato.valor_contrato - parseValorPagado(contrato.valor_pagado))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Indicadores de Progreso */}
                    <td className="px-4 py-4 w-[15%] align-top">
                      <div className="space-y-4">
                        {/* Ejecución Física */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Ejecución Física</span>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                              {Math.floor(Math.random() * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Ejecución Financiera */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Ejecución Financiera</span>
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              {Math.floor(Math.random() * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Pagos Realizados */}
                        <div>
                          {(() => {
                            const valorPagado = parseValorPagado(contrato.valor_pagado);
                            const porcentaje = contrato.valor_contrato > 0 ? Math.round((valorPagado / contrato.valor_contrato) * 100) : 0;
                            const porcentajeWidth = Math.min(100, Math.max(0, porcentaje));
                            
                            return (
                              <>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Pagos Realizados</span>
                                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                                    {porcentaje}%
                                  </span>
                                </div>
                                <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${porcentajeWidth}%` }}
                                  ></div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-4 w-[7%] align-top">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => openPaymentModal(contrato)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors w-full"
                          title="Registrar pago del contrato"
                        >
                          <DollarSign className="h-3 w-3" />
                          <span className="hidden xl:inline">Añadir Pago</span>
                        </button>
                        <button
                          onClick={() => openModal(contrato)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-md transition-colors w-full"
                          title="Ver detalles del contrato"
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden xl:inline">Ver</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredContratos.length)} de {filteredContratos.length} contratos
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

        {/* Mensaje cuando no hay datos */}
        {!loading && filteredContratos.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No se encontraron contratos
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || selectedEntidad || selectedTipoContrato || selectedEstadoContrato || selectedSector
                ? 'Intenta ajustar los filtros para ver más resultados'
                : 'No hay contratos de empréstito disponibles en este momento'}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <p><strong>Estado de carga:</strong></p>
              <p>• Contratos encontrados: {contratos.length}</p>
              <p>• Después de filtros: {filteredContratos.length}</p>
              {error && <p>• Error: {error}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Modal para registrar pago del contrato */}
      <AnimatePresence>
        {showPaymentModal && editingContrato && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closePaymentModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                      Nuevo Pago
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {editingContrato.referencia_contrato}
                    </p>
                  </div>
                  <button
                    onClick={closePaymentModal}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-8 pb-8 space-y-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Información del contrato */}
                <div className="space-y-6">
                  {/* Detalles principales */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                        {editingContrato.nombre_centro_gestor}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {editingContrato.objeto_contrato}
                      </p>
                    </div>

                    {/* Progress bar de pagos */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso de Pagos</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {((parseValorPagado(editingContrato.valor_pagado) / editingContrato.valor_contrato) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((parseValorPagado(editingContrato.valor_pagado) / editingContrato.valor_contrato) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          Pagado: <span className="font-semibold">${parseValorPagado(editingContrato.valor_pagado).toLocaleString('es-CO')}</span>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total: <span className="font-semibold">${editingContrato.valor_contrato.toLocaleString('es-CO')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulario de pago */}
                <div className="space-y-6">
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-6">
                      Detalles del Pago
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fecha de pago */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={paymentData.fecha_pago}
                          onChange={(e) => handlePaymentDataChange('fecha_pago', e.target.value)}
                          required
                          className="w-full px-4 py-3 border-0 border-b-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-green-500 focus:ring-0 dark:text-white transition-colors text-sm"
                        />
                      </div>

                      {/* Monto pagado */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white">
                          Monto
                        </label>
                        <input
                          type="text"
                          value={paymentData.monto_pagado}
                          onChange={(e) => {
                            const formatted = formatMontoInput(e.target.value)
                            handlePaymentDataChange('monto_pagado', formatted)
                          }}
                          placeholder="$0"
                          required
                          className="w-full px-4 py-3 border-0 border-b-2 border-gray-200 dark:border-gray-600 bg-transparent focus:border-green-500 focus:ring-0 dark:text-white transition-colors text-lg font-light"
                        />
                        {paymentData.monto_pagado && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            ${parseMontoInput(paymentData.monto_pagado).toLocaleString('es-CO')} COP
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soporte de pago */}
                <div className="space-y-4">
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Documento de Soporte
                    </h5>
                    
                    <div
                      className={`relative border border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10 scale-[1.02]'
                          : paymentData.soporte_pago
                          ? 'border-green-300 bg-green-50/30 dark:bg-green-900/10'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 hover:bg-gray-50/30 dark:hover:bg-gray-800/20'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {paymentData.soporte_pago ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-3 text-green-600 dark:text-green-400">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{paymentData.soporte_pago.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(paymentData.soporte_pago.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePaymentDataChange('soporte_pago', null)}
                            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                          >
                            Cambiar archivo
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Arrastra un archivo o haz clic para seleccionar
                            </p>
                            <label className="inline-flex cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.xlsx,.txt"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileSelect(file)
                                }}
                              />
                              <span className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors font-medium">
                                Seleccionar documento
                              </span>
                            </label>
                          </div>
                          <p className="text-xs text-gray-400">
                            PDF, DOCX, XLSX o TXT
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={closePaymentModal}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePayment}
                    disabled={isSaving || !paymentData.fecha_pago || !paymentData.monto_pagado || !paymentData.soporte_pago}
                    className="px-8 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Procesando...
                      </span>
                    ) : (
                      'Registrar Pago'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para detalles del contrato */}
      <ContratosModal
        isOpen={showModal}
        onClose={closeModal}
        referenciaContrato={selectedContrato?.referencia_contrato}
        contratoEmprestito={selectedContrato}
      />
    </>
  )
}

export default ContratosEmprestitoTable