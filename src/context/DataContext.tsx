'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Tipos para cada fuente de datos
interface Proyecto {
  bpin: number
  [key: string]: any
}

interface UnidadProyecto {
  bpin?: number
  [key: string]: any
}

interface Producto {
  bpin: number
  [key: string]: any
}

interface Actividad {
  bpin: number
  [key: string]: any
}

interface Contrato {
  bpin?: number
  [key: string]: any
}

interface MovimientoPresupuestal {
  bpin: number
  periodo_corte: string
  [key: string]: any
}

interface EjecucionPresupuestal {
  bpin: number
  periodo_corte: string
  [key: string]: any
}

interface SeguimientoPa {
  bpin?: number
  avance_proyecto_pa?: number
  ejecucion_ppto_proyecto_pa?: number
  periodo_corte?: string
  [key: string]: any
}

interface ProductoPa {
  bpin: number
  cod_producto: number
  nombre_producto: string
  descripcion_avance_producto?: string
  periodo_corte: string
  cantidad_programada_producto?: number
  ponderacion_producto?: number
  [key: string]: any
}

interface ActividadPa {
  bpin: number
  cod_actividad: number
  nombre_actividad: string
  descripcion_actividad?: string
  periodo_corte: string
  fecha_inicio_actividad?: string
  fecha_fin_actividad?: string
  ppto_inicial_actividad?: number
  [key: string]: any
}

// Filtros de búsqueda
interface SearchFilters {
  search: string
  bpin?: string
  centroGestor?: string[]
  comunas?: string[]
  barrios?: string[]
  corregimientos?: string[]
  veredas?: string[]
  fuentesFinanciamiento?: string[]
  estado?: string
  [key: string]: any
}

// Estado del contexto
interface DataContextState {
  // Datos crudos
  proyectos: Proyecto[]
  equipamientos: UnidadProyecto[]
  infraestructuraVial: UnidadProyecto[]
  productos: Producto[]
  actividades: Actividad[]
  contratos: Contrato[]
  movimientosPresupuestales: MovimientoPresupuestal[]
  ejecucionPresupuestal: EjecucionPresupuestal[]
  seguimientoPa: SeguimientoPa[]
  productosPa: ProductoPa[]
  actividadesPa: ActividadPa[]
  
  // Datos filtrados
  filteredProyectos: Proyecto[]
  filteredUnidadesProyecto: UnidadProyecto[]
  filteredProductos: Producto[]
  filteredActividades: Actividad[]
  filteredContratos: Contrato[]
  filteredMovimientosPresupuestales: MovimientoPresupuestal[]
  filteredEjecucionPresupuestal: EjecucionPresupuestal[]
  
  // Estados de carga
  loading: boolean
  error: string | null
  
  // Filtros
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  
  // Estadísticas calculadas
  stats: {
    totalProyectos: number
    totalUnidadesProyecto: number
    totalProductos: number
    totalActividades: number
    totalContratos: number
  }
}

const DataContext = createContext<DataContextState | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Estados para datos crudos
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [equipamientos, setEquipamientos] = useState<UnidadProyecto[]>([])
  const [infraestructuraVial, setInfraestructuraVial] = useState<UnidadProyecto[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [movimientosPresupuestales, setMovimientosPresupuestales] = useState<MovimientoPresupuestal[]>([])
  const [ejecucionPresupuestal, setEjecucionPresupuestal] = useState<EjecucionPresupuestal[]>([])
  const [seguimientoPa, setSeguimientoPa] = useState<SeguimientoPa[]>([])
  const [productosPa, setProductosPa] = useState<ProductoPa[]>([])
  const [actividadesPa, setActividadesPa] = useState<ActividadPa[]>([])
  
  // Estados de control
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({ search: '' })

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Datos mock para equipamientos e infraestructura (ya no se cargan desde GeoJSON)
        const equipamientosData: UnidadProyecto[] = []
        const infraestructuraData: UnidadProyecto[] = []

        // Cargar datos presupuestales con fetch directo
        const fetchJsonData = async (url: string) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        };
        
        // Cargar datos presupuestales directamente
        const [
          proyectosData,
          movimientosPresupuestalesData,
          ejecucionPresupuestalData
        ] = await Promise.all([
          fetchJsonData('/data/datos_caracteristicos_proyectos/datos_caracteristicos_proyectos.json'),
          fetchJsonData('/data/movimientos_presupuestales/movimientos_presupuestales.json'),
          fetchJsonData('/data/ejecucion_presupuestal/ejecucion_presupuestal.json')
        ])

        // Cargar otros datos con fetch tradicional
        const [
          productosRes,
          actividadesRes,
          contratosRes,
          seguimientoPaRes
        ] = await Promise.all([
          fetch('/data/seguimiento_pa/seguimiento_productos_pa.json'),
          fetch('/data/seguimiento_pa/seguimiento_actividades_pa.json'),
          fetch('/data/contratos/contratos_proyectos.json'),
          fetch('/data/seguimiento_pa/seguimiento_pa.json')
        ])

        // Verificar que todas las respuestas sean exitosas
        if (!productosRes.ok) throw new Error('Error cargando productos')
        if (!actividadesRes.ok) throw new Error('Error cargando actividades')
        if (!contratosRes.ok) throw new Error('Error cargando contratos')
        if (!seguimientoPaRes.ok) throw new Error('Error cargando seguimiento PA')

        // Parsear los datos JSON (solo para datos no presupuestales)
        const productosData = await productosRes.json()
        const actividadesData = await actividadesRes.json()
        const contratosData = await contratosRes.json()
        const seguimientoPaData = await seguimientoPaRes.json()

        // Establecer los datos en el estado
        setProyectos(proyectosData || [])
        
        // Usar datos mock vacíos para equipamientos e infraestructura
        setEquipamientos(equipamientosData)
        setInfraestructuraVial(infraestructuraData)
        
        setProductos(productosData || [])
        setActividades(actividadesData || [])
        setContratos(contratosData || [])
        setMovimientosPresupuestales(movimientosPresupuestalesData || [])
        setEjecucionPresupuestal(ejecucionPresupuestalData || [])
        setSeguimientoPa(seguimientoPaData || [])
        setProductosPa([]) // Empty array for now
        setActividadesPa([]) // Empty array for now

        console.log('📊 Datos cargados exitosamente:', {
          proyectos: proyectosData?.length || 0,
          equipamientos: equipamientosData?.length || 0,
          infraestructura: infraestructuraData?.length || 0,
          productos: productosData?.length || 0,
          actividades: actividadesData?.length || 0,
          contratos: contratosData?.length || 0,
          movimientosPresupuestales: movimientosPresupuestalesData?.length || 0,
          ejecucionPresupuestal: ejecucionPresupuestalData?.length || 0
        })

      } catch (err) {
        console.error('Error cargando datos:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    loadAllData()
  }, [])

// Función para filtrar datos por BPIN y otros filtros
  const filterDataByFilters = <T extends { bpin?: number; [key: string]: any }>(
    data: T[],
    searchFilters: SearchFilters
  ): T[] => {
    return data.filter(item => {
      // Filtro por BPIN específico (desde búsqueda)
      if (searchFilters.search && searchFilters.search.trim() !== '') {
        const searchTerm = searchFilters.search.toLowerCase().trim()
        
        // Buscar por BPIN exacto (convertir número a string)
        if (item.bpin && item.bpin.toString().includes(searchTerm)) {
          // Si encuentra coincidencia en BPIN, continúa con otros filtros
        } else {
          // Buscar en todos los campos
          const matchesSearch = Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(searchTerm)
          )
          
          if (!matchesSearch) return false
        }
      }

      // Filtro por centro gestor (para proyectos que tienen nombre_centro_gestor)
      if (searchFilters.centroGestor && searchFilters.centroGestor.length > 0) {
        const centroGestorField = item.nombre_centro_gestor || item.responsible || item.centro_gestor
        if (centroGestorField && !searchFilters.centroGestor.includes(centroGestorField)) {
          return false
        }
      }

      // Filtro por comuna
      if (searchFilters.comunas && searchFilters.comunas.length > 0) {
        const comunaField = item.comuna || item.nombre_comuna
        if (comunaField && !searchFilters.comunas.includes(comunaField)) {
          return false
        }
      }

      // Filtro por barrio
      if (searchFilters.barrios && searchFilters.barrios.length > 0) {
        const barrioField = item.barrio || item.nombre_barrio
        if (barrioField && !searchFilters.barrios.includes(barrioField)) {
          return false
        }
      }

      // Filtro por fuente de financiamiento
      if (searchFilters.fuentesFinanciamiento && searchFilters.fuentesFinanciamiento.length > 0) {
        const fuenteField = item.nombre_fondo || item.fuente_financiamiento || item.clasificacion_fondo
        if (fuenteField && !searchFilters.fuentesFinanciamiento.some((fuente: string) => 
          fuenteField.toString().toLowerCase().includes(fuente.toLowerCase())
        )) {
          return false
        }
      }

      // Filtros adicionales se pueden agregar aquí según sea necesario
      return true
    })
  }

  // Calcular datos filtrados
  const filteredProyectos = filterDataByFilters(proyectos, filters)
  
  // Para unidades de proyecto, productos y actividades, si hay filtros aplicados (más allá de búsqueda simple),
  // filtrar por los BPINs que pasaron los filtros en proyectos
  const shouldFilterByProjectBPINs = (
    (filters.centroGestor && filters.centroGestor.length > 0) ||
    (filters.comunas && filters.comunas.length > 0) ||
    (filters.barrios && filters.barrios.length > 0) ||
    (filters.fuentesFinanciamiento && filters.fuentesFinanciamiento.length > 0) ||
    (filters.periodos && filters.periodos.length > 0)
  )

  let filteredEquipamientos: UnidadProyecto[]
  let filteredInfraestructura: UnidadProyecto[]
  let filteredProductos: Producto[]
  let filteredActividades: Actividad[]
  let filteredContratos: Contrato[]
  let filteredMovimientosPresupuestales: MovimientoPresupuestal[]
  let filteredEjecucionPresupuestal: EjecucionPresupuestal[]

  if (shouldFilterByProjectBPINs) {
    // Obtener los BPINs de proyectos que pasaron los filtros
    const allowedBPINs = new Set(filteredProyectos.map(p => p.bpin))
    
    // Filtrar equipamientos por BPINs válidos
    filteredEquipamientos = equipamientos.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (item.bpin && !allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    // Filtrar infraestructura vial por BPINs válidos
    filteredInfraestructura = infraestructuraVial.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (item.bpin && !allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })
    
    // Filtrar productos y actividades por esos BPINs, más filtros adicionales
    filteredProductos = productos.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (!allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    filteredActividades = actividades.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (!allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    filteredContratos = contratos.filter(item => {
      // Para contratos, si tienen BPIN, filtrar igual
      if (item.bpin && !allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    // Filtrar movimientos presupuestales por BPINs válidos
    filteredMovimientosPresupuestales = movimientosPresupuestales.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (item.bpin && !allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros de período si aplica
      if (filters.periodos && filters.periodos.length > 0) {
        const periodoCorte = item.periodo_corte
        if (periodoCorte) {
          // Extraer año del periodo_corte (formato YYYY-MM-DD)
          const year = periodoCorte.substring(0, 4)
          if (!filters.periodos.includes(year)) return false
        }
      }
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })

    // Filtrar ejecución presupuestal por BPINs válidos
    filteredEjecucionPresupuestal = ejecucionPresupuestal.filter(item => {
      // Debe pertenecer a un proyecto filtrado
      if (item.bpin && !allowedBPINs.has(item.bpin)) return false
      
      // Aplicar filtros de período si aplica
      if (filters.periodos && filters.periodos.length > 0) {
        const periodoCorte = item.periodo_corte
        if (periodoCorte) {
          // Extraer año del periodo_corte (formato YYYY-MM-DD)
          const year = periodoCorte.substring(0, 4)
          if (!filters.periodos.includes(year)) return false
        }
      }
      
      // Aplicar filtros adicionales específicos (como búsqueda)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        if (!matchesSearch) return false
      }
      
      return true
    })
  } else {
    // Si no hay filtros complejos, usar el filtrado normal
    filteredEquipamientos = filterDataByFilters(equipamientos, filters)
    filteredInfraestructura = filterDataByFilters(infraestructuraVial, filters)
    filteredProductos = filterDataByFilters(productos, filters)
    filteredActividades = filterDataByFilters(actividades, filters)
    filteredContratos = filterDataByFilters(contratos, filters)
    filteredMovimientosPresupuestales = filterDataByFilters(movimientosPresupuestales, filters)
    filteredEjecucionPresupuestal = filterDataByFilters(ejecucionPresupuestal, filters)
  }

  const filteredUnidadesProyecto = [...filteredEquipamientos, ...filteredInfraestructura]

  // Calcular estadísticas
  const stats = {
    totalProyectos: filteredProyectos.length,
    totalUnidadesProyecto: filteredUnidadesProyecto.length,
    totalProductos: filteredProductos.length,
    totalActividades: filteredActividades.length,
    totalContratos: filteredContratos.length
  }

  const contextValue: DataContextState = {
    // Datos crudos
    proyectos,
    equipamientos,
    infraestructuraVial,
    productos,
    actividades,
    contratos,
    movimientosPresupuestales,
    ejecucionPresupuestal,
    seguimientoPa,
    productosPa,
    actividadesPa,
    
    // Datos filtrados
    filteredProyectos,
    filteredUnidadesProyecto,
    filteredProductos,
    filteredActividades,
    filteredContratos,
    filteredMovimientosPresupuestales,
    filteredEjecucionPresupuestal,
    
    // Estados
    loading,
    error,
    
    // Filtros
    filters,
    setFilters,
    
    // Estadísticas
    stats
  }

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

// Hook personalizado para usar el contexto
export const useDataContext = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useDataContext debe ser usado dentro de un DataProvider')
  }
  return context
}

// Hook específico para estadísticas (compatible con el sistema existente)
export const useDataStats = () => {
  const { stats, loading, error } = useDataContext()
  return { stats, loading, error }
}
