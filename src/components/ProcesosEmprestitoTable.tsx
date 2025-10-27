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
  XCircle
} from 'lucide-react'

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
  console.log('🚨🚨🚨 COMPONENTE PROCESOSEMPRESTITOTABLE CARGADO 🚨🚨🚨')
  console.log('⏰ Timestamp:', new Date().toLocaleTimeString())
  alert('COMPONENTE CARGADO - VER CONSOLA')
  
  // Estados para datos
  const [procesos, setProcesos] = useState<ProcesoEmprestito[]>([])
  const [filteredProcesos, setFilteredProcesos] = useState<ProcesoEmprestito[]>([])
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

  // Estados para modales
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProceso, setSelectedProceso] = useState<ProcesoEmprestito | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Función para cargar procesos
  const fetchProcesos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      const response = await fetch(`${apiUrl}/procesos_emprestito_all`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const data = await response.json()
      setProcesos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar procesos:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
      setProcesos([])
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar centros gestores
  const fetchCentrosGestores = async () => {
    setLoadingCentros(true)
    
    try {
      const response = await fetch(`/api/proxy/centros-gestores/nombres-unicos`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      
      // Verificar si la respuesta tiene el formato esperado {success: true, data: [...]}
      if (result.success && Array.isArray(result.data)) {
        setCentrosGestores(result.data)
        console.log(`✅ Centros gestores cargados: ${result.data.length} elementos`)
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
      const response = await fetch(`/api/proxy/bancos_emprestito_all`)
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const result = await response.json()
      console.log('📊 Respuesta del endpoint bancos_emprestito_all:', result)
      
      let data = result
      
      // Verificar si la respuesta tiene el formato esperado {success: true, data: [...]}
      if (result.success && Array.isArray(result.data)) {
        data = result.data
        console.log('🔄 Usando result.data:', data)
      } else if (!Array.isArray(result)) {
        console.warn('Formato de respuesta inesperado para bancos:', result)
        setBancos([])
        return
      }
      
      // Extraer solo los nombres de los bancos del array de objetos
      const nombresBancos = Array.isArray(data) 
        ? data.map((banco: any) => {
            console.log('🏦 Objeto banco:', banco)
            return banco.nombre_banco || banco.nombre || banco.bank_name
          }).filter(Boolean)
        : []
      
      setBancos(nombresBancos)
      console.log(`✅ Bancos cargados: ${nombresBancos.length} elementos`, nombresBancos)
    } catch (error) {
      console.error('Error al cargar bancos:', error)
      setBancos([])
    } finally {
      setLoadingBancos(false)
    }
  }

  // Función para abrir modal de añadir proceso
  const openAddModal = () => {
    console.log('� ABRIENDO MODAL')
    alert('MODAL ABRIÉNDOSE!')
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
    console.log('🚀 FUNCIÓN handleSubmitProceso INICIADA')
    alert('✅ FUNCIÓN handleSubmitProceso EJECUTADA CORRECTAMENTE')
    console.log('📋 Valores actuales del formulario:', nuevoProceso)
    console.log('🔍 Tipos de datos:')
    console.log('  - referencia_proceso:', typeof nuevoProceso.referencia_proceso, nuevoProceso.referencia_proceso)
    console.log('  - nombre_centro_gestor:', typeof nuevoProceso.nombre_centro_gestor, nuevoProceso.nombre_centro_gestor)
    console.log('  - nombre_banco:', typeof nuevoProceso.nombre_banco, nuevoProceso.nombre_banco)
    console.log('  - plataforma:', typeof nuevoProceso.plataforma, nuevoProceso.plataforma)
    
    // Validar campos requeridos
    const camposRequeridos = ['referencia_proceso', 'nombre_centro_gestor', 'nombre_banco', 'plataforma']
    const camposFaltantes = camposRequeridos.filter(campo => !nuevoProceso[campo as keyof NuevoProceso])
    
    if (camposFaltantes.length > 0) {
      console.log('❌ Campos faltantes:', camposFaltantes)
      alert(`❌ Faltan campos obligatorios: ${camposFaltantes.join(', ')}`)
      return
    }

    console.log('✅ Validación de campos pasada')
    console.log('🔄 Estableciendo isSubmitting = true')
    setIsSubmitting(true)
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL
      console.log('🌐 API URL:', apiUrl)
      
      if (!apiUrl) {
        throw new Error('URL de API no configurada')
      }

      // Preparar datos exactos como los requiere el backend
      const procesoData = {
        referencia_proceso: nuevoProceso.referencia_proceso.trim(),
        nombre_centro_gestor: nuevoProceso.nombre_centro_gestor.trim(),
        nombre_banco: nuevoProceso.nombre_banco.trim(),
        plataforma: nuevoProceso.plataforma.trim()
      }

      console.log('📤 Datos a enviar:', procesoData)
      console.log('📤 JSON stringify:', JSON.stringify(procesoData))
      console.log('🎯 URL completa:', `${apiUrl}/emprestito/cargar-proceso`)

      const response = await fetch(`${apiUrl}/emprestito/cargar-proceso`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(procesoData)
      })

      console.log('📥 Response status:', response.status)
      console.log('📥 Response ok:', response.ok)
      console.log('📥 Response headers:', response.headers)

      // Leer la respuesta una sola vez
      const responseText = await response.text()
      console.log('📥 Response text:', responseText)

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
          console.error('❌ Error JSON:', errorData)
        } catch {
          console.error('❌ Error text:', responseText)
          errorData = { message: responseText }
        }
        throw new Error(`HTTP ${response.status}: ${errorData.detail || errorData.message || responseText}`)
      }

      const result = JSON.parse(responseText)
      console.log('✅ Respuesta exitosa:', result)
      
      // Mostrar mensaje de éxito
      alert('✅ Proceso creado exitosamente!')
      
      // Cerrar el modal inmediatamente
      console.log('🚪 Cerrando modal...')
      setShowAddModal(false)
      
      // Limpiar el formulario
      setNuevoProceso({
        referencia_proceso: '',
        nombre_centro_gestor: '',
        nombre_banco: '',
        plataforma: ''
      })
      
      // Recargar la lista de procesos
      console.log('🔄 Recargando lista de procesos...')
      await fetchProcesos()
      
    } catch (error) {
      console.error('❌ ERROR COMPLETO:', error)
      console.error('❌ Tipo de error:', typeof error)
      if (error instanceof Error) {
        console.error('❌ Stack del error:', error.stack)
      }
      alert(`❌ Error al crear proceso: ${error}`)
    } finally {
      console.log('🔄 Estableciendo isSubmitting = false')
      setIsSubmitting(false)
    }
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchProcesos()
  }, [])

  // Filtrar procesos basado en búsqueda y filtros
  useEffect(() => {
    let filtered = procesos

    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(proceso =>
        proceso.proceso_nombre?.toLowerCase().includes(searchLower) ||
        proceso.proceso_numero?.toLowerCase().includes(searchLower) ||
        proceso.entidad_compradora?.toLowerCase().includes(searchLower) ||
        proceso.objeto_contratar?.toLowerCase().includes(searchLower)
      )
    }

    // Aplicar filtros
    if (filtros.entidad) {
      filtered = filtered.filter(p => p.entidad_compradora === filtros.entidad)
    }
    if (filtros.estado) {
      filtered = filtered.filter(p => p.estado_proceso === filtros.estado)
    }
    if (filtros.modalidad) {
      filtered = filtered.filter(p => p.modalidad_contratacion === filtros.modalidad)
    }
    if (filtros.tipoContrato) {
      filtered = filtered.filter(p => p.tipo_contrato === filtros.tipoContrato)
    }

    setFilteredProcesos(filtered)
  }, [procesos, searchTerm, filtros])

  // Log de renderizado del modal
  useEffect(() => {
    if (showAddModal) {
      console.log('🔄 Modal renderizado, isSubmitting:', isSubmitting)
      console.log('🔄 Estado del botón disabled:', false)
      console.log('🔄 Valores del formulario:', nuevoProceso)
    }
  }, [showAddModal, isSubmitting, nuevoProceso])

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
      {/* INDICADOR VISUAL */}
      <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center', fontSize: '20px' }}>
        🚨 COMPONENTE PROCESOSEMPRESTITOTABLE ACTIVO 🚨
      </div>
      
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
          onClick={() => {
            console.log('🚨 CLICK EN BOTÓN AÑADIR PROCESO')
            alert('CLICK EN AÑADIR PROCESO!')
            openAddModal()
          }}
          onMouseOver={() => console.log('🖱️ MOUSE SOBRE BOTÓN AÑADIR')}
          style={{ backgroundColor: 'green', color: 'white', border: '2px solid yellow' }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md"
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              console.log('🔴 CLICK EN OVERLAY - CERRANDO MODAL')
              console.log('Event target:', e.target)
              console.log('Current target:', e.currentTarget)
              closeAddModal()
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => {
                console.log('🟢 CLICK EN CONTENIDO DEL MODAL')
                console.log('Event target:', e.target)
                e.stopPropagation()
              }}
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
                    onClick={() => alert('BOTÓN FUNCIONANDO!')}
                    className="px-6 py-2 text-sm font-medium text-white bg-red-500 rounded-md"
                  >
                    TEST BOTÓN
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
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Centro Gestor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plataforma
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {procesos.map((proceso, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {proceso.proceso_numero || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {proceso.entidad_compradora || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        N/A
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        N/A
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProcesosEmprestitoTable