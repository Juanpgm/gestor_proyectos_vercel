'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Calendar, ChevronDown, RefreshCw, X } from 'lucide-react'
import { useCentroGestor } from '@/hooks/useCentroGestor'
import { useFuentesFinanciamiento } from '@/hooks/useFuentesFinanciamiento'
import { useComunasBarrios } from '@/hooks/useComunasBarrios'
import { useCorregimientosVeredas } from '@/hooks/useCorregimientosVeredas'
import { useMovimientosPresupuestales } from '@/hooks/useMovimientosPresupuestales'


interface FilterState {
  search: string
  estado: string
  filtrosPersonalizados: string[]
  centroGestor: string[]
  comunas: string[]
  barrios: string[]
  corregimientos: string[]
  veredas: string[]
  fuentesFinanciamiento: string[]
  fechaInicio?: string | null
  fechaFin?: string | null
  periodos: string[] // Cambiado de año: string a periodos: string[] para múltiples selecciones
}

interface FilterProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
  allProjects?: any[] // Para obtener nombres de proyectos para sugerencias
  activeTab?: 'projects' | 'project_units' | 'contracts' | 'activities' | 'products'
}

// Valores por defecto para evitar errores
const defaultFilters: FilterState = {
  search: '',
  estado: 'all',
  filtrosPersonalizados: [],
  centroGestor: [],
  comunas: [],
  barrios: [],
  corregimientos: [],
  veredas: [],
  fuentesFinanciamiento: [],
  fechaInicio: null,
  fechaFin: null,
  periodos: []
}

export default function UnifiedFilters({ 
  filters = defaultFilters, 
  onFiltersChange, 
  className = '',
  allProjects = [],
  activeTab = 'projects'
}: FilterProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{value: string, type: string, label: string}>>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  
  // NUEVO ENFOQUE SIMPLIFICADO: solo visible/oculto + timer de auto-ocultamiento
  const [showSuggestions, setShowSuggestions] = useState(false)
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const suppressSuggestionsRef = useRef(false) // Nuevo flag para suprimir sugerencias temporalmente
  
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
    periodo: false
  })
  const [comunasSearch, setComunasSearch] = useState('')
  const [barriosSearch, setBarriosSearch] = useState('')
  const [corregimientosSearch, setCorregimientosSearch] = useState('')
  const [veredasSearch, setVeredasSearch] = useState('')
  const [fuenteFinanciamientoSearch, setFuenteFinanciamientoSearch] = useState('')
  const [centroGestorSearch, setCentroGestorSearch] = useState('')
  const [filtrosPersonalizadosSearch, setFiltrosPersonalizadosSearch] = useState('')
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

  // Cargar opciones de corregimientos y veredas desde GeoJSON
  const { 
    corregimientosVeredas, 
    loading: corregimientosLoading, 
    error: corregimientosError,
    getCorregimientos,
    getVeredasPorCorregimientos
  } = useCorregimientosVeredas()

  // Nota: Períodos eliminados según requerimientos

  // Asegurar que filters tenga todas las propiedades necesarias
  const safeFilters = {
    ...defaultFilters,
    ...filters
  }

  // Cerrar dropdowns al hacer click fuera - SIMPLIFICADO
  useEffect(() => {
    const handleGlobalClick = (event: Event) => {
      const target = event.target as Element
      
      console.log('🌍 Click global detectado')
      
      // Para dropdowns normales
      const isInDropdown = target.closest('[data-dropdown]') || 
                          target.closest('.absolute.top-full') ||
                          target.closest('button[aria-expanded]') ||
                          target.matches('[data-dropdown] *')
      
      if (!isInDropdown) {
        setOpenDropdowns({
          estado: false,
          comunas_barrios: false,
          corregimientos_veredas: false,
          fuente_financiamiento: false,
          filtros_personalizados: false,
          centro_gestor: false,
          periodo: false
        })
      }
      
      // Para sugerencias - SIMPLIFICADO
      const isInSearchInput = searchInputRef.current?.contains(target as Node)
      const isInSuggestions = suggestionsDropdownRef.current?.contains(target as Node)
      
      if (!isInSearchInput && !isInSuggestions) {
        console.log('❌ Click fuera - programando auto-ocultamiento')
        scheduleAutoHide(100) // Ocultar rápido
      }
    }

    // Solo un evento
    document.addEventListener('click', handleGlobalClick, true)
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true)
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current)
        autoHideTimerRef.current = null
      }
      // Limpiar flag de supresión
      suppressSuggestionsRef.current = false
    }
  }, [])

  // Generar sugerencias de búsqueda comprehensiva
  useEffect(() => {
    const searchTerm = safeFilters.search.trim().toLowerCase()
    
    // NUEVA VERIFICACIÓN: Si las sugerencias están suprimidas, no generar
    if (suppressSuggestionsRef.current) {
      console.log('🔇 Sugerencias suprimidas temporalmente')
      return
    }
    
    if (searchTerm.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    const suggestions: Array<{value: string, type: string, label: string}> = []
    const isNumericSearch = /^\d+$/.test(searchTerm)
    
    if (isNumericSearch) {
      // Búsqueda prioritaria por BPIN para valores numéricos
      allProjects.forEach(projectData => {
        const bpin = projectData.proyecto?.bpin?.toString() || ''
        const nombreProyecto = projectData.proyecto?.nombre_proyecto || ''
        const centroGestor = projectData.proyecto?.nombre_centro_gestor || ''
        
        if (bpin.includes(searchTerm)) {
          // Usar el nombre completo del proyecto sin cortar
          suggestions.push({
            value: bpin,
            type: 'BPIN',
            label: `BPIN ${bpin}: ${nombreProyecto} - ${centroGestor}`
          })
        }
      })
      
      // Limitar a 8 para BPIN
      if (suggestions.length > 8) {
        suggestions.splice(8)
      }
    } else {
      // Búsqueda comprehensiva para texto
      
      // 1. Búsqueda en nombres de proyectos (máxima prioridad)
      allProjects.forEach(projectData => {
        if (suggestions.length >= 4) return
        
        const nombreProyecto = projectData.proyecto?.nombre_proyecto || ''
        const bpin = projectData.proyecto?.bpin?.toString() || ''
        
        if (nombreProyecto.toLowerCase().includes(searchTerm)) {
          // Usar el nombre completo del proyecto sin cortar
          suggestions.push({
            value: nombreProyecto,
            type: 'Proyecto',
            label: `${nombreProyecto} (BPIN: ${bpin})`
          })
        }
      })

      // 2. Búsqueda en centros gestores (prioridad alta)
      centrosGestores.forEach(centro => {
        if (centro.toLowerCase().includes(searchTerm) && suggestions.length < 6) {
          suggestions.push({
            value: centro,
            type: 'Centro Gestor',
            label: `Centro Gestor: ${centro}`
          })
        }
      })

      // 3. Búsqueda en ubicaciones (comunas/barrios) - prioridad alta
      getComunas().forEach(comuna => {
        if (comuna.toLowerCase().includes(searchTerm) && suggestions.length < 8) {
          suggestions.push({
            value: comuna,
            type: 'Comuna',
            label: `Comuna: ${comuna}`
          })
        }
      })

      // 4. Búsqueda en fuentes de financiamiento
      fuentesFinanciamiento.forEach(fuente => {
        if (fuente.toLowerCase().includes(searchTerm) && suggestions.length < 10) {
          suggestions.push({
            value: fuente,
            type: 'Fuente',
            label: `Fuente de Financiamiento: ${fuente}`
          })
        }
      })

      // 5. Búsqueda en actividades
      allProjects.forEach(projectData => {
        if (suggestions.length >= 12) return
        
        const actividades = projectData.actividades || []
        const bpin = projectData.proyecto?.bpin?.toString() || ''
        
        actividades.forEach((actividad: any) => {
          if (suggestions.length >= 12) return
          
          const nombreActividad = actividad.nombre_actividad || ''
          const descripcionActividad = actividad.descripcion_actividad || ''
          
          // Buscar en nombre y descripción de actividad
          if (nombreActividad.toLowerCase().includes(searchTerm) || 
              descripcionActividad.toLowerCase().includes(searchTerm)) {
            
            suggestions.push({
              value: nombreActividad,
              type: 'Actividad',
              label: `Actividad: ${nombreActividad} (BPIN: ${bpin})`
            })
          }
        })
      })

      // 6. Búsqueda en productos
      allProjects.forEach(projectData => {
        if (suggestions.length >= 14) return
        
        const productos = projectData.productos || []
        const bpin = projectData.proyecto?.bpin?.toString() || ''
        
        productos.forEach((producto: any) => {
          if (suggestions.length >= 14) return
          
          const nombreProducto = producto.nombre_producto || ''
          const descripcionProducto = producto.descripcion_producto || ''
          
          // Buscar en nombre y descripción de producto
          if (nombreProducto.toLowerCase().includes(searchTerm) || 
              descripcionProducto.toLowerCase().includes(searchTerm)) {
            
            suggestions.push({
              value: nombreProducto,
              type: 'Producto',
              label: `Producto: ${nombreProducto} (BPIN: ${bpin})`
            })
          }
        })
      })

      // 7. Búsqueda en barrios (después de comunas para menor prioridad)
      const allBarrios = comunasBarrios.flatMap(item => item.barrios)
      allBarrios.forEach(barrio => {
        if (barrio.toLowerCase().includes(searchTerm) && suggestions.length < 16) {
          suggestions.push({
            value: barrio,
            type: 'Barrio',
            label: `Barrio: ${barrio}`
          })
        }
      })

      // 8. Búsqueda general en cualquier campo de texto de los proyectos (menor prioridad)
      if (suggestions.length < 16) {
        allProjects.forEach(projectData => {
          if (suggestions.length >= 16) return
          
          const proyecto = projectData.proyecto || {}
          const bpin = proyecto.bpin?.toString() || ''
          
          // Buscar en todos los campos de texto del proyecto
          Object.entries(proyecto).forEach(([key, value]) => {
            if (suggestions.length >= 16) return
            if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
              // Evitar duplicados con campos ya buscados específicamente
              if (!['nombre_proyecto', 'nombre_centro_gestor'].includes(key)) {
                suggestions.push({
                  value: value,
                  type: 'Datos',
                  label: `${key.replace(/_/g, ' ')}: ${value} (BPIN: ${bpin})`
                })
              }
            }
          })
        })
      }
    }

    // Eliminar duplicados y mostrar hasta 16 sugerencias máximo con mejor organización
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type) === index
    )
    
    setSearchSuggestions(uniqueSuggestions.slice(0, 16))
    setShowSuggestions(uniqueSuggestions.length > 0)
    setSelectedSuggestionIndex(-1)
  }, [safeFilters.search, centrosGestores, getComunas, comunasBarrios, fuentesFinanciamiento, allProjects])

  // Effect para debugging del estado de sugerencias
  useEffect(() => {
    console.log('🔍 Estado showSuggestions cambió a:', showSuggestions)
    console.log('📝 Número de sugerencias:', searchSuggestions.length)
    
    // Si showSuggestions es false, asegurar que todo esté limpio
    if (!showSuggestions) {
      setSelectedSuggestionIndex(-1)
      // No limpiar searchSuggestions aquí para evitar parpadeos
    }
  }, [showSuggestions, searchSuggestions.length])

  // Effect adicional para cleanup agresivo
  useEffect(() => {
    // Si no hay sugerencias visibles pero el array no está vacío, limpiarlo
    if (!showSuggestions && searchSuggestions.length > 0) {
      console.log('🧹 Limpieza agresiva de sugerencias')
      setTimeout(() => {
        if (!showSuggestions) { // Verificar nuevamente después del timeout
          setSearchSuggestions([])
        }
      }, 500) // Delay para evitar parpadeos
    }
  }, [showSuggestions, searchSuggestions.length])

  // Effect para limpiar las sugerencias cuando no hay búsqueda activa
  useEffect(() => {
    if (!safeFilters.search || safeFilters.search.trim().length < 2) {
      hideSuggestions()
    }
  }, [safeFilters.search])

  // Función simplificada para ocultar sugerencias
  const hideSuggestions = () => {
    console.log('🔥 Ocultando sugerencias')
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    setSearchSuggestions([])
    
    // Limpiar timer si existe
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
  }

  // Función para forzar ocultamiento inmediato
  const forceHideSuggestions = () => {
    console.log('🚨 Forzando ocultamiento de sugerencias')
    hideSuggestions()
    // Quitar foco del input si está activo
    if (searchInputRef.current) {
      searchInputRef.current.blur()
    }
    
    // NUEVO: Suprimir sugerencias temporalmente
    suppressSuggestionsRef.current = true
    setTimeout(() => {
      suppressSuggestionsRef.current = false
      console.log('🔊 Supresión de sugerencias desactivada')
    }, 1000) // Suprimir por 1 segundo
  }

  // Función para programar auto-ocultamiento
  const scheduleAutoHide = (delay = 300) => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
    }
    
    autoHideTimerRef.current = setTimeout(() => {
      console.log('⏰ Auto-ocultamiento por timer')
      hideSuggestions()
    }, delay)
  }

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

  // Memoizar opciones de corregimientos para evitar re-renders
  const corregimientosOptions = useMemo(() => {
    if (corregimientosLoading) return ['Cargando...']
    if (corregimientosError) return ['Error al cargar']
    return getCorregimientos()
  }, [corregimientosLoading, corregimientosError, getCorregimientos])

  // Opciones hardcodeadas para filtros personalizados
  const filtrosPersonalizadosOptions = [
    'Invertir para crecer',
    'Seguridad'
  ]

  // Función para obtener veredas dinámicamente según corregimientos seleccionados
  const getVeredasForCorregimientos = (selectedCorregimientos: string[] | undefined) => {
    if (!selectedCorregimientos || selectedCorregimientos.length === 0) return []
    return getVeredasPorCorregimientos(selectedCorregimientos)
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
    
    // NUEVO: Si se actualiza cualquier filtro, ocultar sugerencias
    if (showSuggestions) {
      console.log('🔄 Filtros actualizados - ocultando sugerencias')
      hideSuggestions()
    }
  }

  // NUEVA función simplificada para forzar ocultamiento
  const handleSuggestionSelect = (suggestion: {value: string, type: string, label: string}) => {
    console.log('✅ Seleccionando sugerencia:', suggestion)
    
    // NUEVA LÓGICA: Generar filtros específicos basados en el tipo de sugerencia
    switch (suggestion.type) {
      case 'BPIN':
      case 'Proyecto':
      case 'Actividad':
      case 'Producto':
      case 'Datos':
        // Para estos tipos, mantener como búsqueda de texto
        updateFilters({ search: suggestion.value })
        // OCULTAR DESPUÉS de actualizar filtros para tipos de búsqueda de texto
        setTimeout(() => {
          console.log('🎯 Ocultando sugerencias después de seleccionar proyecto/texto')
          forceHideSuggestions()
        }, 100)
        break
        
      case 'Centro Gestor':
        // Agregar al filtro de centro gestor
        const currentCentros = safeFilters.centroGestor || []
        if (!currentCentros.includes(suggestion.value)) {
          updateFilters({ 
            centroGestor: [...currentCentros, suggestion.value],
            search: '' // Limpiar búsqueda
          })
        }
        // Ocultar inmediatamente para filtros específicos
        forceHideSuggestions()
        break
        
      case 'Comuna':
        // Agregar al filtro de comunas
        const currentComunas = safeFilters.comunas || []
        if (!currentComunas.includes(suggestion.value)) {
          updateFilters({ 
            comunas: [...currentComunas, suggestion.value],
            search: '' // Limpiar búsqueda
          })
        }
        // Ocultar inmediatamente para filtros específicos
        forceHideSuggestions()
        break
        
      case 'Fuente':
        // Agregar al filtro de fuentes de financiamiento
        const currentFuentes = safeFilters.fuentesFinanciamiento || []
        if (!currentFuentes.includes(suggestion.value)) {
          updateFilters({ 
            fuentesFinanciamiento: [...currentFuentes, suggestion.value],
            search: '' // Limpiar búsqueda
          })
        }
        // Ocultar inmediatamente para filtros específicos
        forceHideSuggestions()
        break
        
      default:
        // Para tipos no reconocidos, usar como búsqueda de texto
        updateFilters({ search: suggestion.value })
        // OCULTAR DESPUÉS de actualizar filtros para tipos de búsqueda de texto
        setTimeout(() => {
          console.log('🎯 Ocultando sugerencias después de seleccionar default/texto')
          forceHideSuggestions()
        }, 100)
        break
    }
  }

  const handleSearchInputChange = (value: string) => {
    updateFilters({ search: value })
    setSelectedSuggestionIndex(-1)
    
    // Cancelar timer de auto-ocultamiento si existe
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    
    // Mostrar sugerencias si hay suficiente texto
    if (value.trim().length >= 2) {
      setShowSuggestions(true)
    } else {
      hideSuggestions()
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || searchSuggestions.length === 0) return

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
        } else {
          // Si no hay sugerencia seleccionada, solo ocultar las sugerencias
          forceHideSuggestions()
        }
        break
      case 'Escape':
        forceHideSuggestions()
        break
    }
  }

  const resetFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(defaultFilters)
      // cerrar dropdowns al limpiar
      setOpenDropdowns({ estado: false, comunas_barrios: false, corregimientos_veredas: false, fuente_financiamiento: false, filtros_personalizados: false, centro_gestor: false, periodo: false })
      // limpiar valores de búsqueda
      setComunasSearch('')
      setBarriosSearch('')
      setCorregimientosSearch('')
      setVeredasSearch('')
      setFuenteFinanciamientoSearch('')
      setCentroGestorSearch('')
      setFiltrosPersonalizadosSearch('')
      // ocultar sugerencias de búsqueda
      setShowSuggestions(false)
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
          updateFilters({ filtrosPersonalizados: safeFilters.filtrosPersonalizados.filter(f => f !== value) })
        } else {
          updateFilters({ filtrosPersonalizados: [] })
        }
        break
      case 'periodos':
        if (value) {
          updateFilters({ periodos: safeFilters.periodos.filter(p => p !== value) })
        } else {
          updateFilters({ periodos: [] })
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

  const toggleDropdown = (type: 'estado' | 'comunas_barrios' | 'corregimientos_veredas' | 'fuente_financiamiento' | 'filtros_personalizados' | 'centro_gestor' | 'periodo') => {
    setOpenDropdowns(prev => {
      const newValue = !prev[type]
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

  const handlePeriodoChange = (periodo: string, checked: boolean) => {
    const currentPeriodos = safeFilters.periodos || []
    
    if (checked) {
      const updatedPeriodos = [...currentPeriodos, periodo]
      updateFilters({ periodos: updatedPeriodos })
    } else {
      const updatedPeriodos = currentPeriodos.filter(p => p !== periodo)
      updateFilters({ periodos: updatedPeriodos })
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

  const handleFiltrosPersonalizadosChange = (filtro: string, checked: boolean) => {
    const currentFiltros = safeFilters.filtrosPersonalizados || []
    
    if (checked) {
      const updatedFiltros = [...currentFiltros, filtro]
      updateFilters({ filtrosPersonalizados: updatedFiltros })
    } else {
      const updatedFiltros = currentFiltros.filter(f => f !== filtro)
      updateFilters({ filtrosPersonalizados: updatedFiltros })
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

  // Apply search filtering for dropdown lists
  const filteredComunas = useMemo(() => {
    return comunasOptions.filter((c: string) => c.toLowerCase().includes(comunasSearch.toLowerCase()))
  }, [comunasOptions, comunasSearch])
  
  const filteredBarrios = displayedBarrios.filter((b: string) => b.toLowerCase().includes(barriosSearch.toLowerCase()))
  const filteredCorregimientos = corregimientosOptions.filter((c: string) => c.toLowerCase().includes(corregimientosSearch.toLowerCase()))
  const filteredVeredas = displayedVeredas.filter((v: string) => v.toLowerCase().includes(veredasSearch.toLowerCase()))
  const filteredFuentesFinanciamiento = fuentesFinanciamientoOptions.filter((f: string) => f.toLowerCase().includes(fuenteFinanciamientoSearch.toLowerCase()))
  const filteredCentroGestor = centroGestorOptions.filter((c: string) => c.toLowerCase().includes(centroGestorSearch.toLowerCase()))
  const filteredFiltrosPersonalizados = filtrosPersonalizadosOptions.filter((f: string) => f.toLowerCase().includes(filtrosPersonalizadosSearch.toLowerCase()))

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
                    console.log('🎯 Input enfocado')
                    // Cancelar auto-ocultamiento
                    if (autoHideTimerRef.current) {
                      clearTimeout(autoHideTimerRef.current)
                      autoHideTimerRef.current = null
                    }
                    
                    // Mostrar sugerencias si hay suficiente texto y hay sugerencias disponibles
                    if (safeFilters.search.trim().length >= 2 && searchSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={() => {
                    console.log('😴 Input desenfocado')
                    // Programar ocultamiento con delay para permitir clicks en sugerencias
                    scheduleAutoHide(200)
                  }}
                  placeholder="Buscar por BPIN (optimizado), nombre del proyecto, centro gestor, comuna, barrio, fuente..."
                  className="w-full border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 text-sm"
                />
                
                {/* Dropdown de sugerencias - SIMPLIFICADO */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div 
                    ref={suggestionsDropdownRef} 
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl z-[99999] max-h-80 overflow-y-auto ring-1 ring-black ring-opacity-5 backdrop-blur-sm"
                    onMouseEnter={() => {
                      console.log('🐭 Mouse entró en sugerencias')
                      // Cancelar auto-ocultamiento cuando el mouse está sobre las sugerencias
                      if (autoHideTimerRef.current) {
                        clearTimeout(autoHideTimerRef.current)
                        autoHideTimerRef.current = null
                      }
                    }}
                    onMouseLeave={() => {
                      console.log('🐭 Mouse salió de sugerencias')
                      // Programar ocultamiento cuando el mouse sale
                      scheduleAutoHide(300)
                    }}
                  >
                    <div className="p-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 uppercase tracking-wide border-b border-gray-200 dark:border-gray-600 mb-2">
                        <span>
                          {/^\d+$/.test(safeFilters.search.trim()) ? 'Resultados BPIN (Optimizado)' : 'Filtros Sugeridos - Click para Aplicar'}
                        </span>
                        <button
                          onClick={(e) => {
                            console.log('❌ Botón cerrar clickeado')
                            e.preventDefault()
                            e.stopPropagation()
                            forceHideSuggestions()
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Cerrar sugerencias"
                        >
                          ✕
                        </button>
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.value}-${index}`}
                          onClick={(e) => {
                            console.log('✅ Click en sugerencia:', suggestion.type)
                            e.preventDefault()
                            e.stopPropagation()
                            
                            // Ejecutar selección inmediatamente
                            handleSuggestionSelect(suggestion)
                          }}
                          className={`w-full text-left px-3 py-3 rounded-md transition-colors duration-200 flex items-start gap-3 group ${
                            selectedSuggestionIndex === index 
                              ? 'bg-blue-100 dark:bg-blue-900/30' 
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white break-words leading-5">
                              {suggestion.label}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              suggestion.type === 'BPIN' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300 border border-cyan-300 font-semibold' :
                              suggestion.type === 'Centro Gestor' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300 border border-teal-300' :
                              suggestion.type === 'Comuna' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-300' :
                              suggestion.type === 'Barrio' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border border-green-300' :
                              suggestion.type === 'Fuente' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border border-purple-300' :
                              suggestion.type === 'Proyecto' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300 border border-pink-300' :
                              suggestion.type === 'Actividad' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border border-orange-300' :
                              suggestion.type === 'Producto' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-600' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-300'
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      updateFilters({ search: '' })
                      forceHideSuggestions()
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* BOTÓN DE EMERGENCIA para cerrar sugerencias */}
                  {showSuggestions && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🚨 BOTÓN DE EMERGENCIA clickeado')
                        forceHideSuggestions()
                      }}
                      className="flex-shrink-0 bg-red-100 hover:bg-red-200 text-red-600 text-xs px-2 py-1 rounded transition-colors duration-200"
                      title="Cerrar sugerencias (emergencia)"
                    >
                      ✕ Cerrar
                    </button>
                  )}
                </div>
              )}
            </div>
            {safeFilters.search && (
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Buscando: &ldquo;<span className="font-medium">{safeFilters.search}</span>&rdquo;
                  {/^\d+$/.test(safeFilters.search.trim()) && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300 border border-cyan-300">
                      🎯 Búsqueda optimizada por BPIN
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Centro Gestor y Año */}
          <div className="flex gap-3">
            {/* Centro Gestor - 80% del espacio */}
            <div className="relative flex-1 w-4/5" data-dropdown="centro_gestor">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
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

            {/* Dropdown de Período - 20% del espacio */}
            <div className="relative w-1/5" data-dropdown="periodo">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleDropdown('periodo')
                }}
                className="flex items-center justify-between w-full px-2 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-expanded={openDropdowns.periodo}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Período {safeFilters.periodos && safeFilters.periodos.length > 0 ? `(${safeFilters.periodos.length})` : ''}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.periodo ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.periodo && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-gray-200 dark:border-gray-600">
                        Filtrar por Año
                      </div>
                      {['2024', '2025', '2026', '2027'].map(año => (
                        <label
                          key={año}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={safeFilters.periodos?.includes(año) || false}
                            onChange={(e) => handlePeriodoChange(año, e.target.checked)}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{año}</span>
                        </label>
                      ))}
                      
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 border-b border-t border-gray-200 dark:border-gray-600 mt-2">
                        Filtrar por Período
                      </div>
                      {['2024-2027', '2020-2023', '2016-2019'].map(periodo => (
                        <label
                          key={periodo}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            checked={safeFilters.periodos?.includes(periodo) || false}
                            onChange={(e) => handlePeriodoChange(periodo, e.target.checked)}
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{periodo}</span>
                        </label>
                      ))}
                      
                      {safeFilters.periodos && safeFilters.periodos.length > 0 && (
                        <button
                          onClick={() => {
                            updateFilters({ periodos: [] })
                            setOpenDropdowns(prev => ({ ...prev, periodo: false }))
                          }}
                          className="w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-600 mt-1 pt-2"
                        >
                          Limpiar todos los períodos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Geographical filters */}
          <div ref={dropdownRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-1 relative" data-dropdown="filters-container">
            
            {/* Filtros Personalizados - Nuevo dropdown al principio */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('filtros_personalizados')}
                className="flex items-center justify-between w-full px-1.5 py-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-800/30 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-pink-700 dark:text-pink-300 truncate">Filtros</span>
                <ChevronDown className={`w-3 h-3 text-pink-600 transition-transform duration-200 ml-1 flex-shrink-0 ${openDropdowns.filtros_personalizados ? 'rotate-180' : ''}`} />
              </button>

              {openDropdowns.filtros_personalizados && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto">
                  <div className="p-3">
                    <input
                      type="text"
                      value={filtrosPersonalizadosSearch}
                      onChange={(e) => setFiltrosPersonalizadosSearch(e.target.value)}
                      placeholder="Buscar filtro..."
                      className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
                    />
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {filteredFiltrosPersonalizados.map((filtro: string) => (
                        <label key={filtro} className="flex items-center space-x-2 p-1 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={safeFilters.filtrosPersonalizados?.includes(filtro) || false}
                            onChange={(e) => handleFiltrosPersonalizadosChange(filtro, e.target.checked)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{filtro}</span>
                        </label>
                      ))}
                      {filteredFiltrosPersonalizados.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-2">
                          No se encontraron filtros personalizados
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Estado - Convertido a dropdown con opciones coloridas */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('estado')}
                className="flex items-center justify-between w-full px-1.5 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/30 transition-colors duration-200"
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
                className="flex items-center justify-between w-full px-1.5 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 truncate">Financiamiento</span>
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
                className="flex items-center justify-between w-full px-1.5 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors duration-200"
              >
                <div className="flex items-center space-x-1 min-w-0 flex-1">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">Comunas</span>
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
                className="flex items-center justify-between w-full px-1.5 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors duration-200"
              >
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300 truncate">Corregimientos</span>
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
                  <span key={filtro} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-sm rounded-full border border-pink-200 dark:border-pink-700">
                    <Filter className="w-3 h-3" />
                    {filtro}
                    <button onClick={() => removeFilter('filtrosPersonalizados', filtro)} className="hover:bg-pink-200 dark:hover:bg-pink-800 rounded-full p-1 transition-colors duration-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {safeFilters.periodos?.map(periodo => (
                  <span key={periodo} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full border border-indigo-200 dark:border-indigo-700">
                    <Calendar className="w-3 h-3" />
                    {periodo}
                    <button onClick={() => removeFilter('periodos', periodo)} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-1 transition-colors duration-200">
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
