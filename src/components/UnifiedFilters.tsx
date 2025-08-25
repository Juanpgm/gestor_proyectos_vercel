'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Calendar, ChevronDown, RefreshCw, X } from 'lucide-react'
import { useCentroGestor } from '@/hooks/useCentroGestor'
import { useFuentesFinanciamiento } from '@/hooks/useFuentesFinanciamiento'
import { useComunasBarrios } from '@/hooks/useComunasBarrios'
import { useMovimientosPresupuestales } from '@/hooks/useMovimientosPresupuestales'


interface FilterState {
  search: string
  estado: string
  centroGestor: string[]
  comunas: string[]
  barrios: string[]
  corregimientos: string[]
  veredas: string[]
  fuentesFinanciamiento: string[]
  filtrosPersonalizados: string[]
  subfiltrosPersonalizados: string[]
  periodos: string[]
  fechaInicio?: string | null
  fechaFin?: string | null
}

interface FilterProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
  allProjects?: any[] // Para obtener nombres de proyectos para sugerencias
  activeTab?: 'overview' | 'projects' | 'project_units' | 'contracts' | 'activities' | 'products'
}

// Valores por defecto para evitar errores
const defaultFilters: FilterState = {
  search: '',
  estado: 'all',
  centroGestor: [],
  comunas: [],
  barrios: [],
  corregimientos: [],
  veredas: [],
  fuentesFinanciamiento: [],
  filtrosPersonalizados: [],
  subfiltrosPersonalizados: [],
  periodos: [],
  fechaInicio: null,
  fechaFin: null
}

export default function UnifiedFilters({ 
  filters = defaultFilters, 
  onFiltersChange, 
  className = '',
  allProjects = [],
  activeTab = 'overview'
}: FilterProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{value: string, type: string, label: string}>>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const suggestionsDropdownRef = useRef<HTMLDivElement>(null)
  const [openDropdowns, setOpenDropdowns] = useState({
    estado: false,
    comunas_barrios: false,
    corregimientos_veredas: false,
    fuente_financiamiento: false,
    filtros_personalizados: false,
    centro_gestor: false,
    periodos: false
  })
  const [comunasSearch, setComunasSearch] = useState('')
  const [barriosSearch, setBarriosSearch] = useState('')
  const [corregimientosSearch, setCorregimientosSearch] = useState('')
  const [veredasSearch, setVeredasSearch] = useState('')
  const [fuenteFinanciamientoSearch, setFuenteFinanciamientoSearch] = useState('')
  const [filtrosPersonalizadosSearch, setFiltrosPersonalizadosSearch] = useState('')
  const [centroGestorSearch, setCentroGestorSearch] = useState('')
  const [periodosSearch, setPeriodosSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cargar opciones de centro gestor desde JSON
  const { centrosGestores, loading: centrosLoading, error: centrosError } = useCentroGestor()
  
  // Cargar opciones de fuentes de financiamiento desde JSON
  const { fuentesFinanciamiento, loading: fuentesLoading, error: fuentesError } = useFuentesFinanciamiento()

  // Cargar opciones de comunas y barrios desde GeoJSON
  const { 
    comunasBarrios, 
    loading: comunasLoading, 
    error: comunasError,
    getComunas,
    getBarriosPorComunas
  } = useComunasBarrios()

  // Cargar períodos desde movimientos presupuestales
  const { 
    movimientos, 
    loading: movimientosLoading, 
    error: movimientosError,
    getPeriodos
  } = useMovimientosPresupuestales()

  // Asegurar que filters tenga todas las propiedades necesarias
  const safeFilters = {
    ...defaultFilters,
    ...filters
  }

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Element
      
      console.log('🖱️ Click detectado en:', target)
      
      // Verificar si el click está en algún dropdown (buscar por clases)
      const isInDropdown = target.closest('[data-dropdown]') || 
                          target.closest('.absolute.top-full') ||
                          target.closest('button[aria-expanded]') ||
                          target.matches('[data-dropdown] *')
      
      if (!isInDropdown) {
        console.log('🖱️ Click fuera de todos los dropdowns, cerrando')
        setOpenDropdowns({
          estado: false,
          comunas_barrios: false,
          corregimientos_veredas: false,
          fuente_financiamiento: false,
          filtros_personalizados: false,
          centro_gestor: false,
          periodos: false
        })
      } else {
        console.log('🖱️ Click dentro de dropdown, manteniendo abierto')
      }
      
      // Manejo independiente para sugerencias de búsqueda
      const isInSearchInput = searchInputRef.current && searchInputRef.current.contains(target)
      const isInSearchContainer = searchDropdownRef.current && searchDropdownRef.current.contains(target)
      const isInSuggestions = suggestionsDropdownRef.current && suggestionsDropdownRef.current.contains(target)
      
      if (!isInSearchInput && !isInSearchContainer && !isInSuggestions) {
        setShowSearchSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Generar sugerencias de búsqueda
  useEffect(() => {
    const searchTerm = safeFilters.search.trim().toLowerCase()
    
    if (searchTerm.length < 2) {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
      return
    }

    const suggestions: Array<{value: string, type: string, label: string}> = []

    // Agregar sugerencias de centros gestores
    centrosGestores.forEach(centro => {
      if (centro.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          value: centro,
          type: 'Centro Gestor',
          label: centro
        })
      }
    })

    // Agregar sugerencias de comunas
    getComunas().forEach(comuna => {
      if (comuna.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          value: comuna,
          type: 'Comuna',
          label: comuna
        })
      }
    })

    // Agregar sugerencias de barrios
    comunasBarrios.flatMap(item => item.barrios).forEach(barrio => {
      if (barrio.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          value: barrio,
          type: 'Barrio',
          label: barrio
        })
      }
    })

    // Agregar sugerencias de fuentes de financiamiento
    fuentesFinanciamiento.forEach(fuente => {
      if (fuente.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          value: fuente,
          type: 'Fuente',
          label: fuente
        })
      }
    })

    // Agregar sugerencias de períodos
    getPeriodos().forEach(periodo => {
      if (periodo.toLowerCase().includes(searchTerm)) {
        suggestions.push({
          value: periodo,
          type: 'Período',
          label: periodo
        })
      }
    })

    // Agregar sugerencias de nombres de proyectos (coincidencias parciales)
    let projectSuggestionsCount = 0
    const maxProjectSuggestions = 3 // Limitar a 3 proyectos para no saturar la lista
    
    allProjects.forEach(projectData => {
      if (projectSuggestionsCount >= maxProjectSuggestions) return
      
      const nombreProyecto = projectData.proyecto?.nombre_proyecto || ''
      const bpin = projectData.proyecto?.bpin?.toString() || ''
      const centroGestor = projectData.proyecto?.nombre_centro_gestor || ''
      
      // Buscar por nombre de proyecto
      if (nombreProyecto.toLowerCase().includes(searchTerm)) {
        // Limitar la longitud del label para mejor visualización
        const shortLabel = nombreProyecto.length > 60 
          ? nombreProyecto.substring(0, 60) + '...' 
          : nombreProyecto
        
        // Agregar contexto adicional al label
        const contextLabel = `${shortLabel} (BPIN: ${bpin}) - ${centroGestor}`
        
        suggestions.push({
          value: nombreProyecto,
          type: 'Proyecto',
          label: contextLabel.length > 100 
            ? `${shortLabel} (BPIN: ${bpin})`
            : contextLabel
        })
        projectSuggestionsCount++
      }
      
      // Buscar por BPIN (solo si no se encontró por nombre)
      else if (bpin.includes(searchTerm) && projectSuggestionsCount < maxProjectSuggestions) {
        const shortLabel = nombreProyecto.length > 50 
          ? nombreProyecto.substring(0, 50) + '...' 
          : nombreProyecto
        
        suggestions.push({
          value: bpin,
          type: 'BPIN',
          label: `BPIN ${bpin}: ${shortLabel}`
        })
        projectSuggestionsCount++
      }
    })

    // Limitar a 10 sugerencias y mostrar
    setSearchSuggestions(suggestions.slice(0, 10))
    setShowSearchSuggestions(suggestions.length > 0)
    setSelectedSuggestionIndex(-1) // Reset del índice seleccionado
  }, [safeFilters.search, centrosGestores, getComunas, comunasBarrios, fuentesFinanciamiento, getPeriodos, allProjects])

  // Opciones dinámicas de estado basadas en la sección activa
  const getEstadosOptions = () => {
    switch (activeTab) {
      case 'projects':
        return [
          { value: 'all', label: 'Estado de Proyecto' },
          { value: 'En Ejecución', label: 'En Ejecución' },
          { value: 'Planificación', label: 'Planificación' },
          { value: 'Completado', label: 'Completado' },
          { value: 'Suspendido', label: 'Suspendido' },
          { value: 'En Evaluación', label: 'En Evaluación' }
        ]
      case 'project_units':
        return [
          { value: 'all', label: 'Estado Unidad de Proyecto' },
          { value: 'En Ejecución', label: 'En Ejecución' },
          { value: 'Planificación', label: 'Planificación' },
          { value: 'Completado', label: 'Completado' },
          { value: 'Suspendido', label: 'Suspendido' }
        ]
      case 'activities':
        return [
          { value: 'all', label: 'Estado de Actividad' },
          { value: 'no_iniciada', label: 'No Iniciada' },
          { value: 'en_ejecucion', label: 'En Ejecución' },
          { value: 'cercana_terminar', label: 'Cercana a Terminar' },
          { value: 'completada', label: 'Completada' }
        ]
      case 'products':
        return [
          { value: 'all', label: 'Estado de Producto' },
          { value: 'no_iniciado', label: 'No Iniciado' },
          { value: 'en_proceso', label: 'En Proceso' },
          { value: 'completado', label: 'Completado' }
        ]
      default:
        return [
          { value: 'all', label: 'Estado' },
          { value: 'En Ejecución', label: 'En Ejecución' },
          { value: 'Planificación', label: 'Planificación' },
          { value: 'Completado', label: 'Completado' },
          { value: 'Suspendido', label: 'Suspendido' },
          { value: 'En Evaluación', label: 'En Evaluación' }
        ]
    }
  }

  const estadosOptions = getEstadosOptions()

  // Opciones de centro gestor cargadas dinámicamente desde JSON
  const centroGestorOptions = centrosLoading ? 
    ['Cargando...'] : 
    centrosError ? 
      ['Error al cargar'] : 
      centrosGestores

  // Memoizar opciones de comunas para evitar re-renders
  const comunasOptions = useMemo(() => {
    if (comunasLoading) return ['Cargando...']
    if (comunasError) return ['Error al cargar']
    return getComunas()
  }, [comunasLoading, comunasError, getComunas])

  // Opciones de fuentes de financiamiento cargadas dinámicamente desde JSON
  const fuentesFinanciamientoOptions = fuentesLoading ?
    ['Cargando...'] :
    fuentesError ?
      ['Error al cargar'] :
      fuentesFinanciamiento

  // Opciones hardcodeadas para corregimientos y veredas
  const corregimientosOptions = [
    'Corregimiento 1', 'Corregimiento 2', 'Corregimiento 3',
    'La Buitrera', 'El Hormiguero', 'Golondrinas',
    'La Castilla', 'Los Andes', 'Villa Carmelo'
  ]

  const veredasOptions = [
    'Vereda 1', 'Vereda 2', 'Vereda 3',
    'La Elvira', 'Santa Elena', 'La Buitrera',
    'El Saladito', 'Los Chorros', 'La Vorágine'
  ]

  // Mapeo hardcodeado de corregimientos a veredas
  const corregimientoVeredasMap = {
    'Corregimiento 1': ['Vereda 1A', 'Vereda 1B'],
    'Corregimiento 2': ['Vereda 2A', 'Vereda 2B'],
    'Corregimiento 3': ['Vereda 3A', 'Vereda 3B'],
    'La Buitrera': ['La Elvira', 'Santa Elena'],
    'El Hormiguero': ['El Saladito', 'Los Chorros'],
    'Golondrinas': ['La Vorágine'],
    'La Castilla': ['Vereda Castilla 1', 'Vereda Castilla 2'],
    'Los Andes': ['Vereda Los Andes'],
    'Villa Carmelo': ['Vereda Villa Carmelo']
  }

  // Opciones hardcodeadas para filtros personalizados
  const filtrosPersonalizadosOptions = [
    'Invertir para crecer',
    'Seguridad'
  ]

  // Función para obtener veredas dinámicamente según corregimientos seleccionados
  const getVeredasForCorregimientos = (selectedCorregimientos: string[] | undefined) => {
    if (!selectedCorregimientos || selectedCorregimientos.length === 0) return []
    
    const set = new Set<string>()
    selectedCorregimientos.forEach(corr => {
      const veredas = (corregimientoVeredasMap as Record<string, string[]>)[corr]
      if (veredas) {
        veredas.forEach((vereda: string) => set.add(vereda))
      }
    })
    
    return Array.from(set).sort()
  }

  // Mapeo de filtros personalizados a subfiltros (jerárquico)
  const filtroSubfiltroMap = useMemo(() => {
    return {
      'Invertir para crecer': ['Sanar heridas del pasado', 'Cali al futuro', 'Motores estratégicos de desarrollo'],
      'Seguridad': ['Lucha contra el terrorismo', 'Orden Vial']
    }
  }, [])

  const getSubfiltrosForFiltros = (selectedFiltros: string[] | undefined) => {
    if (!selectedFiltros || selectedFiltros.length === 0) return []
    const set = new Set<string>()
    selectedFiltros.forEach(filtro => {
      const subfiltros = filtroSubfiltroMap[filtro as keyof typeof filtroSubfiltroMap] || []
      subfiltros.forEach(subfiltro => set.add(subfiltro))
    })
    return Array.from(set)
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    if (onFiltersChange) {
      onFiltersChange({ ...safeFilters, ...newFilters })
    }
  }

  const handleSuggestionSelect = (suggestion: {value: string, type: string, label: string}) => {
    console.log('Seleccionando sugerencia:', suggestion)
    // Usar el valor de la sugerencia como término de búsqueda
    updateFilters({ search: suggestion.value })
    
    // Cerrar las sugerencias inmediatamente
    setShowSearchSuggestions(false)
    setSelectedSuggestionIndex(-1)
    
    // Enfocar el input después de seleccionar
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100)
  }

  const handleSearchInputChange = (value: string) => {
    updateFilters({ search: value })
    setSelectedSuggestionIndex(-1)
    
    // Mostrar sugerencias si hay texto
    if (value.trim().length >= 2) {
      setShowSearchSuggestions(true)
    } else {
      setShowSearchSuggestions(false)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          handleSuggestionSelect(searchSuggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSearchSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  const resetFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(defaultFilters)
      // cerrar dropdowns al limpiar
      setOpenDropdowns({ estado: false, comunas_barrios: false, corregimientos_veredas: false, fuente_financiamiento: false, filtros_personalizados: false, centro_gestor: false, periodos: false })
      // limpiar valores de búsqueda
      setComunasSearch('')
      setBarriosSearch('')
      setCorregimientosSearch('')
      setVeredasSearch('')
      setFuenteFinanciamientoSearch('')
      setFiltrosPersonalizadosSearch('')
      setCentroGestorSearch('')
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (safeFilters.search) count++
    if (safeFilters.estado !== 'all') count++
    if (safeFilters.centroGestor && safeFilters.centroGestor.length > 0) count++
    if (safeFilters.comunas && safeFilters.comunas.length > 0) count++
    if (safeFilters.barrios && safeFilters.barrios.length > 0) count++
    if (safeFilters.corregimientos && safeFilters.corregimientos.length > 0) count++
    if (safeFilters.veredas && safeFilters.veredas.length > 0) count++
    if (safeFilters.fuentesFinanciamiento && safeFilters.fuentesFinanciamiento.length > 0) count++
    if (safeFilters.filtrosPersonalizados && safeFilters.filtrosPersonalizados.length > 0) count++
    if (safeFilters.subfiltrosPersonalizados && safeFilters.subfiltrosPersonalizados.length > 0) count++
    if (safeFilters.periodos && safeFilters.periodos.length > 0) count++
    return count
  }

  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'search':
        updateFilters({ search: '' })
        break
      case 'estado':
        updateFilters({ estado: 'all' })
        break
      case 'centroGestor':
        if (value) {
          updateFilters({ centroGestor: safeFilters.centroGestor.filter(c => c !== value) })
        } else {
          updateFilters({ centroGestor: [] })
        }
        break
      case 'periodos':
        if (value) {
          updateFilters({ periodos: safeFilters.periodos.filter(p => p !== value) })
        } else {
          updateFilters({ periodos: [] })
        }
        break
      case 'comunas':
        if (value) {
          const updatedComunas = safeFilters.comunas.filter(c => c !== value)
          if (updatedComunas.length === 0) {
            updateFilters({ comunas: [], barrios: [] })
          } else {
            const allowedBarrios = new Set(getBarriosPorComunas(updatedComunas))
            const filteredBarrios = (safeFilters.barrios || []).filter(b => allowedBarrios.has(b))
            updateFilters({ comunas: updatedComunas, barrios: filteredBarrios })
          }
        } else {
          updateFilters({ comunas: [], barrios: [] })
        }
        break
      case 'barrios':
        if (value) {
          updateFilters({ barrios: safeFilters.barrios.filter(b => b !== value) })
        } else {
          updateFilters({ barrios: [] })
        }
        break
      case 'corregimientos':
        if (value) {
          const updatedCorregimientos = safeFilters.corregimientos.filter(c => c !== value)
          if (updatedCorregimientos.length === 0) {
            updateFilters({ corregimientos: [], veredas: [] })
          } else {
            const allowedVeredas = new Set(getVeredasForCorregimientos(updatedCorregimientos))
            const filteredVeredas = (safeFilters.veredas || []).filter(v => allowedVeredas.has(v))
            updateFilters({ corregimientos: updatedCorregimientos, veredas: filteredVeredas })
          }
        } else {
          updateFilters({ corregimientos: [], veredas: [] })
        }
        break
      case 'veredas':
        if (value) {
          updateFilters({ veredas: safeFilters.veredas.filter(v => v !== value) })
        } else {
          updateFilters({ veredas: [] })
        }
        break
      case 'fuentesFinanciamiento':
        if (value) {
          updateFilters({ fuentesFinanciamiento: safeFilters.fuentesFinanciamiento.filter(f => f !== value) })
        } else {
          updateFilters({ fuentesFinanciamiento: [] })
        }
        break
      case 'filtrosPersonalizados':
        if (value) {
          const updatedFiltros = safeFilters.filtrosPersonalizados.filter(f => f !== value)
          const validSubfiltros = getSubfiltrosForFiltros(updatedFiltros)
          const filteredSubfiltros = (safeFilters.subfiltrosPersonalizados || []).filter(s => validSubfiltros.includes(s))
          updateFilters({ 
            filtrosPersonalizados: updatedFiltros, 
            subfiltrosPersonalizados: filteredSubfiltros 
          })
        } else {
          updateFilters({ filtrosPersonalizados: [], subfiltrosPersonalizados: [] })
        }
        break
      case 'subfiltrosPersonalizados':
        if (value) {
          updateFilters({ subfiltrosPersonalizados: safeFilters.subfiltrosPersonalizados.filter(s => s !== value) })
        } else {
          updateFilters({ subfiltrosPersonalizados: [] })
        }
        break
    }
  }

  const handleCheckboxChange = (
    type: 'comunas' | 'barrios' | 'corregimientos' | 'veredas',
    value: string,
    checked: boolean
  ) => {
    const currentValues = safeFilters[type] || []
    if (checked) {
      updateFilters({ [type]: [...currentValues, value] })
    } else {
      updateFilters({ [type]: currentValues.filter(v => v !== value) })
    }
  }

  const toggleDropdown = (type: 'estado' | 'comunas_barrios' | 'corregimientos_veredas' | 'fuente_financiamiento' | 'filtros_personalizados' | 'centro_gestor' | 'periodos') => {
    console.log(`🎯 toggleDropdown llamado para: ${type}`)
    setOpenDropdowns(prev => {
      const newValue = !prev[type]
      console.log(`🔄 Toggle dropdown ${type}:`, prev[type] ? 'cerrar' : 'abrir', '→', newValue ? 'abrir' : 'cerrar')
      
      return {
        ...prev,
        [type]: newValue
      }
    })
  }

  // Funciones para manejar las dependencias jerárquicas
  const handleCentroGestorChange = (centro: string, checked: boolean) => {
    const currentCentros = safeFilters.centroGestor || []
    
    if (checked) {
      const updatedCentros = [...currentCentros, centro]
      updateFilters({ centroGestor: updatedCentros })
    } else {
      const updatedCentros = currentCentros.filter(c => c !== centro)
      updateFilters({ centroGestor: updatedCentros })
    }
  }

  const handleComunaChange = (comuna: string, checked: boolean) => {
    const currentComunas = safeFilters.comunas || []
    const currentBarrios = safeFilters.barrios || []
    
    if (checked) {
      const updatedComunas = [...currentComunas, comuna]
      updateFilters({ comunas: updatedComunas })
    } else {
      const updatedComunas = currentComunas.filter(c => c !== comuna)
      
      // Filtrar barrios que ya no son válidos
      const validBarrios = getBarriosPorComunas(updatedComunas)
      const filteredBarrios = currentBarrios.filter(b => validBarrios.includes(b))
      
      updateFilters({ 
        comunas: updatedComunas, 
        barrios: filteredBarrios 
      })
    }
  }

  const handleCorregimientoChange = (corregimiento: string, checked: boolean) => {
    const currentCorregimientos = safeFilters.corregimientos || []
    const currentVeredas = safeFilters.veredas || []
    
    if (checked) {
      const updatedCorregimientos = [...currentCorregimientos, corregimiento]
      updateFilters({ corregimientos: updatedCorregimientos })
    } else {
      const updatedCorregimientos = currentCorregimientos.filter(c => c !== corregimiento)
      
      // Filtrar veredas que ya no son válidas
      const validVeredas = getVeredasForCorregimientos(updatedCorregimientos)
      const filteredVeredas = currentVeredas.filter(v => validVeredas.includes(v))
      
      updateFilters({ 
        corregimientos: updatedCorregimientos, 
        veredas: filteredVeredas 
      })
    }
  }

  const handleFuenteFinanciamientoChange = (fuente: string, checked: boolean) => {
    const currentFuentes = safeFilters.fuentesFinanciamiento || []
    
    if (checked) {
      const updatedFuentes = [...currentFuentes, fuente]
      updateFilters({ fuentesFinanciamiento: updatedFuentes })
    } else {
      const updatedFuentes = currentFuentes.filter(f => f !== fuente)
      updateFilters({ fuentesFinanciamiento: updatedFuentes })
    }
  }

  const handleFiltroPersonalizadoChange = (filtro: string, checked: boolean) => {
    const currentFiltros = safeFilters.filtrosPersonalizados || []
    const currentSubfiltros = safeFilters.subfiltrosPersonalizados || []
    
    if (checked) {
      const updatedFiltros = [...currentFiltros, filtro]
      updateFilters({ filtrosPersonalizados: updatedFiltros })
    } else {
      const updatedFiltros = currentFiltros.filter(f => f !== filtro)
      
      // Filtrar subfiltros que ya no son válidos
      const validSubfiltros = getSubfiltrosForFiltros(updatedFiltros)
      const filteredSubfiltros = currentSubfiltros.filter(s => validSubfiltros.includes(s))
      
      updateFilters({ 
        filtrosPersonalizados: updatedFiltros, 
        subfiltrosPersonalizados: filteredSubfiltros 
      })
    }
  }

  const handleSubfiltroPersonalizadoChange = (subfiltro: string, checked: boolean) => {
    const currentSubfiltros = safeFilters.subfiltrosPersonalizados || []
    
    if (checked) {
      const updatedSubfiltros = [...currentSubfiltros, subfiltro]
      updateFilters({ subfiltrosPersonalizados: updatedSubfiltros })
    } else {
      const updatedSubfiltros = currentSubfiltros.filter(s => s !== subfiltro)
      updateFilters({ subfiltrosPersonalizados: updatedSubfiltros })
    }
  }

  // Listas a mostrar filtradas según las selecciones padre
  const displayedBarrios = useMemo(() => {
    // Si hay comunas seleccionadas, mostrar solo barrios de esas comunas
    if (safeFilters.comunas && safeFilters.comunas.length > 0) {
      return getBarriosPorComunas(safeFilters.comunas)
    }
    // Si no hay comunas seleccionadas, mostrar todos los barrios disponibles
    return comunasBarrios.flatMap(item => item.barrios)
  }, [safeFilters.comunas, getBarriosPorComunas, comunasBarrios])
  
  const displayedVeredas = getVeredasForCorregimientos(safeFilters.corregimientos)
  const displayedSubfiltros = getSubfiltrosForFiltros(safeFilters.filtrosPersonalizados)

  // Apply search filtering for dropdown lists
  const filteredComunas = useMemo(() => {
    return comunasOptions.filter((c: string) => c.toLowerCase().includes(comunasSearch.toLowerCase()))
  }, [comunasOptions, comunasSearch])
  
  const filteredBarrios = displayedBarrios.filter((b: string) => b.toLowerCase().includes(barriosSearch.toLowerCase()))
  const filteredCorregimientos = corregimientosOptions.filter((c: string) => c.toLowerCase().includes(corregimientosSearch.toLowerCase()))
  const filteredVeredas = displayedVeredas.filter((v: string) => v.toLowerCase().includes(veredasSearch.toLowerCase()))
  const filteredFuentesFinanciamiento = fuentesFinanciamientoOptions.filter((f: string) => f.toLowerCase().includes(fuenteFinanciamientoSearch.toLowerCase()))
  const filteredFiltrosPersonalizados = filtrosPersonalizadosOptions.filter((f: string) => f.toLowerCase().includes(filtrosPersonalizadosSearch.toLowerCase()))
  const filteredSubfiltrosPersonalizados = displayedSubfiltros.filter((s: string) => s.toLowerCase().includes(filtrosPersonalizadosSearch.toLowerCase()))
  const filteredCentroGestor = centroGestorOptions.filter((c: string) => c.toLowerCase().includes(centroGestorSearch.toLowerCase()))

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-300 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros de Búsqueda</h3>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                console.log('🔍 Estado completo de filtros:')
                console.log('- Comunas cargadas:', comunasOptions.length)
                console.log('- Fuentes cargadas:', fuentesFinanciamiento.length)
                console.log('- Comunas loading:', comunasLoading)
                console.log('- Fuentes loading:', fuentesLoading)
                console.log('- Datos comunas completos:', comunasBarrios)
                console.log('- Datos fuentes completos:', fuentesFinanciamiento)
                console.log('- Filtros actuales:', safeFilters)
              }}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
              title="Mostrar información de debug en consola (F12)"
            >
              🔍 Debug
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Limpiar</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-700 transition-colors duration-200"
            >
              <span className="text-sm">{isExpanded ? 'Contraer' : 'Expandir'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-visible"
      >
        <div className="p-4 space-y-4 overflow-visible">
          {/* Barra de Búsqueda Global */}
          <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl p-4 relative">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 relative" ref={searchDropdownRef}>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={safeFilters.search}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (safeFilters.search.trim().length >= 2 && searchSuggestions.length > 0) {
                      setShowSearchSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    // El click-outside unificado se encarga de cerrar
                  }}
                  placeholder="Buscar por BPIN, nombre del proyecto, unidad de proyecto, responsable, centro gestor, barrio, comuna..."
                  className="w-full border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                />
                
                {/* Dropdown de sugerencias */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div ref={suggestionsDropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl z-[99999] max-h-64 overflow-y-auto ring-1 ring-black ring-opacity-5 backdrop-blur-sm">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wide">
                        Pre-filtros sugeridos
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.value}-${index}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSuggestionSelect(suggestion)
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 group ${
                            selectedSuggestionIndex === index 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {suggestion.label}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              suggestion.type === 'Centro Gestor' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300' :
                              suggestion.type === 'Comuna' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                              suggestion.type === 'Barrio' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              suggestion.type === 'Fuente' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                              suggestion.type === 'Período' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                              suggestion.type === 'Proyecto' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300' :
                              suggestion.type === 'BPIN' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {suggestion.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {safeFilters.search && (
                <button
                  onClick={() => {
                    updateFilters({ search: '' })
                    setShowSearchSuggestions(false)
                    setSelectedSuggestionIndex(-1)
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {safeFilters.search && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Buscando: &ldquo;<span className="font-medium">{safeFilters.search}</span>&rdquo;
              </div>
            )}
          </div>

          {/* Centro Gestor y Período */}
          <div className="flex gap-3">
            {/* Centro Gestor - Ahora usa la estética blanca como Período */}
            <div className="relative flex-[7]" data-dropdown="centro_gestor">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🎯 Botón Centro Gestor clickeado')
                  toggleDropdown('centro_gestor')
                }}
                className="flex items-center justify-between w-full px-3 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-expanded={openDropdowns.centro_gestor}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Centro Gestor {safeFilters.centroGestor?.length > 0 && `(${safeFilters.centroGestor.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${openDropdowns.centro_gestor ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.centro_gestor && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto"
                >
                  <div className="p-3">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={centroGestorSearch}
                        onChange={(e) => setCentroGestorSearch(e.target.value)}
                        placeholder="Buscar centro gestor..."
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {filteredCentroGestor.map(centro => (
                        <label 
                          key={centro} 
                          className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                            checked={safeFilters.centroGestor?.includes(centro) || false}
                            onChange={(e) => {
                              handleCentroGestorChange(centro, e.target.checked)
                            }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{centro}</span>
                        </label>
                      ))}
                      {filteredCentroGestor.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No se encontraron centros gestores
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Período - Mantiene estética blanca */}
            <div className="relative flex-[3]" data-dropdown="periodos">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('🎯 Botón Período clickeado')
                  toggleDropdown('periodos')
                }}
                className="flex items-center justify-between w-full px-3 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-expanded={openDropdowns.periodos}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Período {safeFilters.periodos?.length > 0 && `(${safeFilters.periodos.length})`}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ml-2 flex-shrink-0 ${openDropdowns.periodos ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.periodos && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={periodosSearch}
                        onChange={(e) => setPeriodosSearch(e.target.value)}
                        placeholder="Buscar período..."
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {getPeriodos()
                        .filter(periodo => 
                          periodo.toLowerCase().includes(periodosSearch.toLowerCase())
                        )
                        .map(periodo => (
                        <label key={periodo} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                            checked={safeFilters.periodos?.includes(periodo) || false}
                            onChange={(e) => {
                              const currentPeriodos = safeFilters.periodos || []
                              if (e.target.checked) {
                                updateFilters({ periodos: [...currentPeriodos, periodo] })
                              } else {
                                updateFilters({ periodos: currentPeriodos.filter(p => p !== periodo) })
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{periodo}</span>
                        </label>
                      ))}
                      {getPeriodos()
                        .filter(periodo => 
                          periodo.toLowerCase().includes(periodosSearch.toLowerCase())
                        ).length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No se encontraron períodos
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Geographical filters */}
          <div ref={dropdownRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-1.5 relative" data-dropdown="filters-container">
            {/* Estado - Convertido a dropdown con opciones coloridas */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('estado')}
                className="flex items-center justify-between w-full px-2 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/30 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300 truncate">Estado</span>
                <ChevronDown className={`w-3 h-3 text-teal-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.estado ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.estado && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <div className="space-y-1">
                      {estadosOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateFilters({ estado: option.value })
                            setOpenDropdowns(prev => ({ ...prev, estado: false }))
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                            safeFilters.estado === option.value 
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-200' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fuente de Financiamiento */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('fuente_financiamiento')}
                className="flex items-center justify-between w-full px-2 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate">Fuente de Financiamiento</span>
                  {fuentesLoading && (
                    <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                  {!fuentesLoading && fuentesFinanciamiento.length === 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">(Sin datos)</span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 text-purple-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.fuente_financiamiento ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.fuente_financiamiento && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <input
                      type="text"
                      value={fuenteFinanciamientoSearch}
                      onChange={(e) => setFuenteFinanciamientoSearch(e.target.value)}
                      placeholder="Buscar fuente..."
                      className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                    />
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {filteredFuentesFinanciamiento.map((fuente: string) => (
                        <label key={fuente} className="flex items-center space-x-2 p-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={safeFilters.fuentesFinanciamiento?.includes(fuente) || false}
                            onChange={(e) => handleFuenteFinanciamientoChange(fuente, e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{fuente}</span>
                        </label>
                      ))}
                      {filteredFuentesFinanciamiento.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          {fuentesLoading ? 'Cargando...' : 'No se encontraron fuentes'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Comunas & Barrios */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('comunas_barrios')}
                className="flex items-center justify-between w-full px-2 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">Comunas y Barrios</span>
                  {comunasLoading && (
                    <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                  )}
                  {!comunasLoading && comunasOptions.length === 0 && (
                    <span className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">(Sin datos)</span>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 text-blue-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.comunas_barrios ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.comunas_barrios && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    {/* Comunas list with search */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 border-b border-blue-200 dark:border-blue-700 pb-1">Comunas</h4>
                      <div className="mb-2">
                        <input
                          type="text"
                          value={comunasSearch}
                          onChange={(e) => setComunasSearch(e.target.value)}
                          placeholder="Buscar comuna..."
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredComunas.map(comuna => (
                          <label 
                            key={comuna} 
                            className="flex items-center space-x-2 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={safeFilters.comunas?.includes(comuna) || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleComunaChange(comuna, e.target.checked)
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{comuna}</span>
                          </label>
                        ))}
                        {filteredComunas.length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">
                            {comunasLoading ? 'Cargando comunas...' : 'No se encontraron comunas'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barrios list with search */}
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 border-b border-green-200 dark:border-green-700 pb-1">
                        <span>Barrios</span>
                      </h4>

                      <div className="mb-2">
                        <input
                          type="text"
                          value={barriosSearch}
                          onChange={(e) => setBarriosSearch(e.target.value)}
                          placeholder="Buscar barrio..."
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredBarrios.length > 0 ? (
                          filteredBarrios.map(barrio => (
                            <label 
                              key={barrio} 
                              className="flex items-center space-x-2 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                checked={safeFilters.barrios?.includes(barrio) || false}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleCheckboxChange('barrios', barrio, e.target.checked)
                                }}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{barrio}</span>
                            </label>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                            No hay barrios disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Corregimientos & Veredas */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('corregimientos_veredas')}
                className="flex items-center justify-between w-full px-2 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300 truncate">Corregimientos y Veredas</span>
                <ChevronDown className={`w-3 h-3 text-orange-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.corregimientos_veredas ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.corregimientos_veredas && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2 border-b border-orange-200 dark:border-orange-700 pb-1">Corregimientos</h4>

                      <div className="mb-2">
                        <input
                          type="text"
                          value={corregimientosSearch}
                          onChange={(e) => setCorregimientosSearch(e.target.value)}
                          placeholder="Buscar corregimiento..."
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredCorregimientos.map(corregimiento => (
                          <label 
                            key={corregimiento} 
                            className="flex items-center space-x-2 p-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              checked={safeFilters.corregimientos?.includes(corregimiento) || false}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleCorregimientoChange(corregimiento, e.target.checked)
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{corregimiento}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 border-b border-purple-200 dark:border-purple-700 pb-1 flex items-center justify-between">
                        <span>Veredas</span>
                        {(!safeFilters.corregimientos || safeFilters.corregimientos.length === 0) && (
                          <span className="text-xs text-gray-500 italic">Selecciona primero un corregimiento</span>
                        )}
                        {(safeFilters.corregimientos && safeFilters.corregimientos.length > 0 && displayedVeredas.length === 0) && (
                          <span className="text-xs text-orange-500 italic">No hay veredas disponibles</span>
                        )}
                      </h4>

                      <div className="mb-2">
                        <input
                          type="text"
                          value={veredasSearch}
                          onChange={(e) => setVeredasSearch(e.target.value)}
                          placeholder="Buscar vereda..."
                          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          disabled={!safeFilters.corregimientos || safeFilters.corregimientos.length === 0}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className={`space-y-1 max-h-32 overflow-y-auto ${(!safeFilters.corregimientos || safeFilters.corregimientos.length === 0) ? 'opacity-50' : ''}`}>
                        {filteredVeredas.length > 0 ? (
                          filteredVeredas.map(vereda => (
                            <label 
                              key={vereda} 
                              className="flex items-center space-x-2 p-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                checked={safeFilters.veredas?.includes(vereda) || false}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  handleCheckboxChange('veredas', vereda, e.target.checked)
                                }}
                                disabled={!safeFilters.corregimientos || safeFilters.corregimientos.length === 0}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{vereda}</span>
                            </label>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                            {(!safeFilters.corregimientos || safeFilters.corregimientos.length === 0) 
                              ? 'Selecciona un corregimiento para ver veredas'
                              : 'No hay veredas disponibles para los corregimientos seleccionados'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtros Personalizados */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('filtros_personalizados')}
                className="flex items-center justify-between w-full px-2 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300 truncate">Filtros Personalizados</span>
                <ChevronDown className={`w-3 h-3 text-indigo-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.filtros_personalizados ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.filtros_personalizados && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={filtrosPersonalizadosSearch}
                        onChange={(e) => setFiltrosPersonalizadosSearch(e.target.value)}
                        placeholder="Buscar filtro..."
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    
                    {/* Categorías principales (Filtros) */}
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Categorías</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredFiltrosPersonalizados.map(filtro => (
                          <label key={filtro} className="flex items-center space-x-2 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              checked={safeFilters.filtrosPersonalizados?.includes(filtro) || false}
                              onChange={(e) => handleFiltroPersonalizadoChange(filtro, e.target.checked)}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{filtro}</span>
                          </label>
                        ))}
                        {filteredFiltrosPersonalizados.length === 0 && (
                          <div className="text-sm text-gray-500 text-center py-2">
                            No se encontraron categorías
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subcategorías (solo si hay categorías seleccionadas) */}
                    {displayedSubfiltros.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Subcategorías</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {filteredSubfiltrosPersonalizados.map(subfiltro => (
                            <label key={subfiltro} className="flex items-center space-x-2 p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                checked={safeFilters.subfiltrosPersonalizados?.includes(subfiltro) || false}
                                onChange={(e) => handleSubfiltroPersonalizadoChange(subfiltro, e.target.checked)}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{subfiltro}</span>
                            </label>
                          ))}
                          {filteredSubfiltrosPersonalizados.length === 0 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              No se encontraron subcategorías
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active filters - Solo se muestra si hay filtros activos */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <span>Filtros Activos</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                </h4>
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                >
                  Limpiar todos
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {safeFilters.search && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-full border border-gray-200 dark:border-gray-600">
                    <Search className="w-3 h-3" />
                    Búsqueda: {safeFilters.search}
                    <button onClick={() => removeFilter('search')} className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {safeFilters.estado !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200 dark:border-blue-700">
                    <Filter className="w-3 h-3" />
                    Estado: {safeFilters.estado}
                    <button onClick={() => removeFilter('estado')} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {safeFilters.centroGestor && Array.isArray(safeFilters.centroGestor) && safeFilters.centroGestor.length > 0 && safeFilters.centroGestor.map(centro => (
                  <span key={centro} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-sm rounded-full border border-teal-200 dark:border-teal-700">
                    <MapPin className="w-3 h-3" />
                    {centro}
                    <button onClick={() => removeFilter('centroGestor', centro)} className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.periodos?.map(periodo => (
                  <span key={periodo} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full border border-green-200 dark:border-green-700">
                    <Calendar className="w-3 h-3" />
                    {periodo}
                    <button onClick={() => removeFilter('periodos', periodo)} className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.comunas?.map(comuna => (
                  <span key={comuna} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full border border-blue-200 dark:border-blue-700">
                    <MapPin className="w-3 h-3" />
                    {comuna}
                    <button onClick={() => removeFilter('comunas', comuna)} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.barrios?.map(barrio => (
                  <span key={barrio} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full border border-green-200 dark:border-green-700">
                    <MapPin className="w-3 h-3" />
                    {barrio}
                    <button onClick={() => removeFilter('barrios', barrio)} className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.corregimientos?.map(corregimiento => (
                  <span key={corregimiento} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full border border-orange-200 dark:border-orange-700">
                    <MapPin className="w-3 h-3" />
                    {corregimiento}
                    <button onClick={() => removeFilter('corregimientos', corregimiento)} className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.veredas?.map(vereda => (
                  <span key={vereda} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full border border-purple-200 dark:border-purple-700">
                    <MapPin className="w-3 h-3" />
                    {vereda}
                    <button onClick={() => removeFilter('veredas', vereda)} className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.fuentesFinanciamiento?.map(fuente => (
                  <span key={fuente} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full border border-purple-200 dark:border-purple-700">
                    <Filter className="w-3 h-3" />
                    {fuente}
                    <button onClick={() => removeFilter('fuentesFinanciamiento', fuente)} className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.filtrosPersonalizados?.map(filtro => (
                  <span key={filtro} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full border border-indigo-200 dark:border-indigo-700">
                    <Filter className="w-3 h-3" />
                    {filtro}
                    <button onClick={() => removeFilter('filtrosPersonalizados', filtro)} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.subfiltrosPersonalizados?.map(subfiltro => (
                  <span key={subfiltro} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full border border-indigo-200 dark:border-indigo-700">
                    <Filter className="w-3 h-3" />
                    {subfiltro}
                    <button onClick={() => removeFilter('subfiltrosPersonalizados', subfiltro)} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Exportar también la interfaz para que otros componentes la puedan usar
export type { FilterState }
