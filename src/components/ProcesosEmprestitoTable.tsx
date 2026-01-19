'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  Plus, 
  Eye,
  X,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { fetchWithErrorHandling } from '@/utils/errorHandler'

// Interfaz para proceso de empréstito
interface ProcesoEmprestito {
  id?: number
  proceso_numero?: string
  proceso_nombre?: string
  proceso_presupuesto_estimado?: number
  entidad_compradora?: string
  estado_proceso?: string
  fecha_publicacion?: string
  fecha_cierre?: string
  modalidad_contratacion?: string
  tipo_contrato?: string
  categoria_principal?: string
  objeto_contratar?: string
  ubicacion?: string
  contacto_entidad?: string
}

// Interfaz para filtros
interface FiltrosProcesos {
  entidad: string
  estado: string
  modalidad: string
  tipoContrato: string
}

// Interfaz para nuevo proceso
interface NuevoProceso {
  referencia_proceso: string
  nombre_centro_gestor: string
  nombre_banco: string
  plataforma: string
  bp?: string
  nombre_resumido_proceso?: string
  id_paa?: string
  valor_proyectado?: string
}

const ProcesosEmprestitoTable: React.FC = () => {
  // Estados para datos
  const [procesos, setProcesos] = useState<ProcesoEmprestito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para UI
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosProcesos>({
    entidad: '',
    estado: '',
    modalidad: '',
    tipoContrato: ''
  })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' })

  // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<ProcesoEmprestito | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [procesoToDelete, setProcesoToDelete] = useState<ProcesoEmprestito | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para Centro Gestor dropdown
  const [centrosGestores, setCentrosGestores] = useState<string[]>([])
  const [loadingCentros, setLoadingCentros] = useState(false)
  const [showCentrosDropdown, setShowCentrosDropdown] = useState(false)
  const [centroGestorSearch, setCentroGestorSearch] = useState('')

  // Estados para Banco dropdown
  const [bancos, setBancos] = useState<string[]>([])
  const [loadingBancos, setLoadingBancos] = useState(false)
  const [showBancosDropdown, setShowBancosDropdown] = useState(false)
  const [bancoSearch, setBancoSearch] = useState('')

  // Estado para nuevo proceso
  const [nuevoProceso, setNuevoProceso] = useState<NuevoProceso>({
    referencia_proceso: '',
    nombre_centro_gestor: '',
    nombre_banco: '',
    plataforma: 'SECOP II',
    bp: '',
    nombre_resumido_proceso: '',
    id_paa: '',
    valor_proyectado: ''
  })

  // Función para confirmar eliminación
  const handleDeleteClick = (proceso: ProcesoEmprestito) => {
    setProcesoToDelete(proceso)
    setShowDeleteModal(true)
  }

  // Función para ejecutar eliminación
  const handleConfirmDelete = async () => {
    if (!procesoToDelete) return

    setIsDeleting(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Obtener la referencia del proceso (probando ambas propiedades posibles)
      const referencia = (procesoToDelete as any).referencia_proceso || procesoToDelete.proceso_numero || ''
      
      if (!referencia) {
        throw new Error('No se encontró referencia del proceso para eliminar')
      }

      console.log(`🗑️ Eliminando proceso: ${referencia}`)

      const response = await fetch(`${apiUrl}/emprestito/proceso/${encodeURIComponent(referencia)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Proceso eliminado:', result)

      // Cerrar modal y recargar lista
      setShowDeleteModal(false)
      setProcesoToDelete(null)
      await fetchProcesos()

    } catch (error) {
      console.error('❌ Error al eliminar proceso:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al eliminar'
      alert(`Error al eliminar: ${errorMsg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Función para cargar procesos
  const fetchProcesos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      const data = await fetchWithErrorHandling<any>(
        `${apiUrl}/procesos_emprestito_all`,
        {},
        120000 // 2 minutos de timeout
      )
      
      setProcesos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar procesos:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setProcesos([])
    } finally {
      setLoading(false)
    }
  }

  // Función para manejar ordenamiento
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Procesos ordenados
  const sortedProcesos = useMemo(() => {
    if (!sortConfig.key) return procesos

    return [...procesos].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof ProcesoEmprestito]
      const bValue = b[sortConfig.key as keyof ProcesoEmprestito]

      // Manejar valores nulos o indefinidos
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Comparación numérica
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Comparación de strings
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [procesos, sortConfig])

  // Función para cargar centros gestores
  const fetchCentrosGestores = async () => {
    setLoadingCentros(true)
    
    try {
      const result = await fetchWithErrorHandling<any>(
        `/api/proxy/centros-gestores/nombres-unicos`,
        {},
        120000 // 2 minutos de timeout
      )
      
      // Verificar si la respuesta tiene el formato esperado {success: true, data: [...]}
      if (result.success && Array.isArray(result.data)) {
        setCentrosGestores(result.data)
      } else if (Array.isArray(result)) {
        // Fallback si viene directamente como array
        setCentrosGestores(result)
      } else {
        console.warn('Formato de respuesta inesperado:', result)
        setCentrosGestores([])
      }
    } catch (error) {
      console.error('Error al cargar centros gestores:', error)
      setCentrosGestores([])
    } finally {
      setLoadingCentros(false)
    }
  }

  // Función para cargar bancos
  const fetchBancos = async () => {
    setLoadingBancos(true)
    
    try {
      const result = await fetchWithErrorHandling<any>(
        `/api/proxy/asignaciones-emprestito-banco-centro-gestor`,
        {},
        120000 // 2 minutos de timeout
      )
      
      let data = result
      
      // Verificar si la respuesta tiene el formato esperado {success: true, data: [...]}
      if (result.success && Array.isArray(result.data)) {
        data = result.data
      } else if (!Array.isArray(result)) {
        console.warn('Formato de respuesta inesperado para bancos:', result)
        setBancos([])
        return
      }
      
      // Extraer nombres únicos de bancos del campo nombre_banco
      const nombresBancos = Array.isArray(data) 
        ? Array.from(new Set(data.map((asignacion: any) => asignacion.nombre_banco).filter(Boolean))) as string[]
        : []
      
      setBancos(nombresBancos)
    } catch (error) {
      console.error('Error al cargar bancos:', error)
      setBancos([])
    } finally {
      setLoadingBancos(false)
    }
  }

  // Función para abrir modal de añadir proceso
  const openAddModal = () => {
    setShowAddModal(true)
    fetchCentrosGestores() // Cargar centros gestores cuando se abre el modal
    fetchBancos() // Cargar bancos cuando se abre el modal
  }

  // Función para cerrar modal de añadir proceso
  const closeAddModal = () => {
    setShowAddModal(false)
    setShowCentrosDropdown(false)
    setCentroGestorSearch('')
    setNuevoProceso({
      referencia_proceso: '',
      nombre_centro_gestor: '',
      nombre_banco: '',
      plataforma: 'SECOP II',
      bp: '',
      nombre_resumido_proceso: '',
      id_paa: '',
      valor_proyectado: ''
    })
  }

  // Filtrar centros gestores basado en la búsqueda
  const filteredCentrosGestores = useMemo(() => {
    if (!centroGestorSearch.trim()) {
      return centrosGestores
    }
    return centrosGestores.filter(centro =>
      centro.toLowerCase().includes(centroGestorSearch.toLowerCase())
    )
  }, [centrosGestores, centroGestorSearch])

  // Filtrar bancos basado en la búsqueda
  const filteredBancos = useMemo(() => {
    if (!bancoSearch.trim()) {
      return bancos
    }
    return bancos.filter(banco =>
      banco.toLowerCase().includes(bancoSearch.toLowerCase())
    )
  }, [bancos, bancoSearch])

  // Función para seleccionar centro gestor
  const selectCentroGestor = (centro: string) => {
    setNuevoProceso(prev => ({
      ...prev,
      nombre_centro_gestor: centro
    }))
    setShowCentrosDropdown(false)
    setCentroGestorSearch('')
  }

  // Función para seleccionar banco
  const selectBanco = (banco: string) => {
    setNuevoProceso(prev => ({
      ...prev,
      nombre_banco: banco
    }))
    setShowBancosDropdown(false)
    setBancoSearch('')
  }

  // Función para manejar cambios en el formulario
  const handleInputChange = (field: keyof NuevoProceso, value: string) => {
    setNuevoProceso(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para enviar el nuevo proceso
  const handleSubmitProceso = async () => {
    // Validar campos requeridos
    const camposRequeridos = ['referencia_proceso', 'nombre_centro_gestor', 'nombre_banco', 'plataforma']
    const camposFaltantes = camposRequeridos.filter(campo => !nuevoProceso[campo as keyof NuevoProceso])
    
    if (camposFaltantes.length > 0) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Preparar datos incluyendo campos opcionales si están presentes
      const procesoData: Record<string, any> = {
        referencia_proceso: nuevoProceso.referencia_proceso.trim(),
        nombre_centro_gestor: nuevoProceso.nombre_centro_gestor.trim(),
        nombre_banco: nuevoProceso.nombre_banco.trim(),
        plataforma: nuevoProceso.plataforma.trim()
      }

      // Agregar campos opcionales solo si tienen valor
      if (nuevoProceso.bp && nuevoProceso.bp.trim()) {
        procesoData.bp = nuevoProceso.bp.trim()
      }
      if (nuevoProceso.nombre_resumido_proceso && nuevoProceso.nombre_resumido_proceso.trim()) {
        procesoData.nombre_resumido_proceso = nuevoProceso.nombre_resumido_proceso.trim()
      }
      if (nuevoProceso.id_paa && nuevoProceso.id_paa.trim()) {
        procesoData.id_paa = nuevoProceso.id_paa.trim()
      }
      if (nuevoProceso.valor_proyectado && nuevoProceso.valor_proyectado.trim()) {
        const valorNumerico = parseFloat(nuevoProceso.valor_proyectado.replace(/[^\d.-]/g, ''))
        if (!isNaN(valorNumerico)) {
          procesoData.valor_proyectado = valorNumerico
        }
      }

      console.log('📤 Datos a enviar:', procesoData)

      const result = await fetchWithErrorHandling<any>(
        `${apiUrl}/emprestito/cargar-proceso`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(procesoData)
        },
        120000 // 2 minutos de timeout
      )
      
      // Cerrar el modal inmediatamente
      setShowAddModal(false)
      
      // Limpiar el formulario
      setNuevoProceso({
        referencia_proceso: '',
        nombre_centro_gestor: '',
        nombre_banco: '',
        plataforma: ''
      })
      
      // Recargar la lista de procesos
      await fetchProcesos()
      
    } catch (error) {
      console.error('❌ ERROR COMPLETO:', error)
      console.error('❌ Tipo de error:', typeof error)
      if (error instanceof Error) {
        console.error('❌ Stack del error:', error.stack)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProcesos()
  }, [])

  // Filtrar procesos basado en búsqueda y filtros
  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showCentrosDropdown && !target.closest('.centro-gestor-dropdown')) {
        setShowCentrosDropdown(false)
      }
      if (showBancosDropdown && !target.closest('.banco-dropdown')) {
        setShowBancosDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCentrosDropdown, showBancosDropdown])

  // Función para mostrar detalles del proceso
  const showDetails = (proceso: ProcesoEmprestito) => {
    setSelectedProceso(proceso)
    setShowDetailModal(true)
  }


  return (
    <div className="space-y-6">
      {/* Header con botón de añadir proceso */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Procesos de Empréstito SECOP II
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestión y seguimiento de procesos de contratación
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Añadir Proceso SECOP II
        </button>
      </div>

      {/* Modal de añadir proceso */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeAddModal()
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            >
              {/* Header del modal */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Añadir Proceso SECOP II
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Complete la información básica del proceso
                    </p>
                  </div>
                  <button
                    onClick={closeAddModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-4">
                {/* Información básica requerida */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1">
                    Información Básica (Requerida)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Referencia del proceso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Referencia del Proceso <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nuevoProceso.referencia_proceso}
                        onChange={(e) => handleInputChange('referencia_proceso', e.target.value)}
                        placeholder="Ej: REF-2024-001"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>

                    {/* Centro Gestor con dropdown y búsqueda */}
                    <div className="relative centro-gestor-dropdown">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Centro Gestor <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div
                          onClick={() => setShowCentrosDropdown(!showCentrosDropdown)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between bg-white dark:bg-gray-700 text-sm"
                        >
                          <span className={nuevoProceso.nombre_centro_gestor ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                            {nuevoProceso.nombre_centro_gestor || 'Seleccionar centro gestor'}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showCentrosDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {/* Dropdown */}
                        <AnimatePresence>
                          {showCentrosDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-hidden"
                            >
                              {/* Searchbar */}
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                  <input
                                    type="text"
                                    placeholder={`Buscar... (${centrosGestores.length} disponibles)`}
                                    value={centroGestorSearch}
                                    onChange={(e) => setCentroGestorSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>

                              {/* Lista de opciones */}
                              <div className="max-h-52 overflow-y-auto">
                                {loadingCentros ? (
                                  <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                                      Cargando centros...
                                    </div>
                                  </div>
                                ) : filteredCentrosGestores.length > 0 ? (
                                  filteredCentrosGestores.map((centro, index) => (
                                    <div
                                      key={index}
                                      onClick={() => selectCentroGestor(centro)}
                                      className="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                    >
                                      {centro}
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No se encontraron centros gestores
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Nombre del banco */}
                    <div className="banco-dropdown">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Banco <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm cursor-pointer flex items-center justify-between"
                             onClick={() => setShowBancosDropdown(!showBancosDropdown)}>
                          <span className={nuevoProceso.nombre_banco ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                            {nuevoProceso.nombre_banco || "Seleccionar banco"}
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                        
                        <AnimatePresence>
                          {showBancosDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-hidden"
                            >
                              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                  type="text"
                                  placeholder="Buscar banco..."
                                  value={bancoSearch}
                                  onChange={(e) => setBancoSearch(e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                  autoFocus
                                />
                              </div>
                              <div className="max-h-32 overflow-y-auto">
                                {loadingBancos ? (
                                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    Cargando bancos...
                                  </div>
                                ) : filteredBancos.length > 0 ? (
                                  filteredBancos.map((banco, index) => (
                                    <div
                                      key={index}
                                      onClick={() => selectBanco(banco)}
                                      className="px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                    >
                                      {banco}
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No se encontraron bancos
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Plataforma */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Plataforma <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={nuevoProceso.plataforma}
                        onChange={(e) => handleInputChange('plataforma', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      >
                        <option value="">Seleccionar plataforma</option>
                        <option value="SECOP II">SECOP II</option>
                        <option value="Tienda Virtual del Estado Colombiano">Tienda Virtual del Estado Colombiano</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información opcional */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1">
                    Información Adicional (Opcional)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Código BP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código BP
                      </label>
                      <input
                        type="text"
                        value={nuevoProceso.bp}
                        onChange={(e) => handleInputChange('bp', e.target.value)}
                        placeholder="Ej: BP-001"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>

                    {/* ID PAA */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ID PAA
                      </label>
                      <input
                        type="text"
                        value={nuevoProceso.id_paa}
                        onChange={(e) => handleInputChange('id_paa', e.target.value)}
                        placeholder="Ej: PAA-2024-001"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>

                    {/* Valor proyectado */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor Proyectado
                      </label>
                      <input
                        type="number"
                        value={nuevoProceso.valor_proyectado}
                        onChange={(e) => handleInputChange('valor_proyectado', e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>

                    {/* Nombre resumido del proceso */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre Resumido del Proceso
                      </label>
                      <input
                        type="text"
                        value={nuevoProceso.nombre_resumido_proceso}
                        onChange={(e) => handleInputChange('nombre_resumido_proceso', e.target.value)}
                        placeholder="Nombre corto del proceso"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones del modal */}
              <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeAddModal}
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitProceso}
                    disabled={isSubmitting}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear Proceso'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla de procesos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Procesos
          </h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando procesos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          ) : procesos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No hay procesos disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Proceso / Centro Gestor</span>
                        <button onClick={() => handleSort('proceso_numero')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                          {sortConfig.key === 'proceso_numero' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Banco</span>
                        <button onClick={() => handleSort('entidad_compradora')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                          {sortConfig.key === 'entidad_compradora' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Estado</span>
                        <button onClick={() => handleSort('estado_proceso')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                          {sortConfig.key === 'estado_proceso' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span>Valor Contrato</span>
                        <button onClick={() => handleSort('proceso_presupuesto_estimado')} className="hover:bg-gray-200 dark:hover:bg-gray-600 p-1 rounded">
                          {sortConfig.key === 'proceso_presupuesto_estimado' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>Avance Ejecución</span>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>Observaciones / Alertas</span>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedProcesos.map((proceso, index) => (
                    <tr key={index}>
                      {/* Proceso / Centro Gestor */}
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {proceso.proceso_nombre || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {proceso.entidad_compradora || 'Sin entidad'}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                            {proceso.proceso_numero || 'Sin referencia'}
                          </div>
                        </div>
                      </td>
                      
                      {/* Banco */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                          {proceso.modalidad_contratacion || 'N/A'}
                        </span>
                      </td>
                      
                      {/* Estado */}
                      <td className="px-6 py-4 text-center text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          proceso.estado_proceso === 'Activo' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {proceso.estado_proceso || 'N/A'}
                        </span>
                      </td>
                      
                      {/* Valor Contrato */}
                      <td className="px-6 py-4 text-right text-sm font-medium text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {proceso.proceso_presupuesto_estimado 
                          ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(proceso.proceso_presupuesto_estimado)
                          : 'N/A'
                        }
                      </td>
                      
                      {/* Avance Ejecución */}
                      <td className="px-6 py-4 text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `0%` }}
                            />
                          </div>
                          <span className="font-medium">0%</span>
                        </div>
                      </td>
                      
                      {/* Observaciones / Alertas */}
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="line-clamp-2">
                          {proceso.objeto_contratar || 'Sin observaciones'}
                        </div>
                      </td>
                      
                      {/* Detalle y Acciones */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProceso(proceso)
                              setShowDetailModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg"
                            title="Ver detalles del proceso"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(proceso)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                            title="Eliminar proceso"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {showDeleteModal && procesoToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) {
                setShowDeleteModal(false)
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4 text-red-600 dark:text-red-400">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Eliminar Proceso
                  </h3>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  ¿Está seguro que desea eliminar el proceso <strong>{(procesoToDelete as any).referencia_proceso || procesoToDelete.proceso_numero}</strong>? 
                  <br /><br />
                  <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                    Esta acción no se puede deshacer. Se eliminará de ambas colecciones (SECOP y TVEC).
                  </span>
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Eliminar Definitivamente
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}

export default ProcesosEmprestitoTable