'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loadGeoJSON, loadMapDataWithFallback } from '@/utils/geoJSONLoader'

// Tipos para cada fuente de datos
interface Proyecto {
  bpin: number
  periodo?: string
  [key: string]: any
}

interface UnidadProyecto {
  bpin?: number
  periodo?: string
  [key: string]: any
}

interface Producto {
  bpin: number
  periodo?: string
  [key: string]: any
}

interface Actividad {
  bpin: number
  periodo?: string
  [key: string]: any
}

interface Contrato {
  bpin?: number
  periodo?: string
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
  periodo?: string
  periodos?: string[]
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

        // Cargar datos GeoJSON usando el loader centralizado con fallback
        const geoJSONData = await loadMapDataWithFallback()
        const equipamientosData = geoJSONData.equipamientos
        const infraestructuraData = geoJSONData.infraestructura_vial

        // Cargar otros datos con fetch tradicional
        const [
          proyectosRes,
          productosRes,
          actividadesRes,
          contratosRes,
          movimientosPresupuestalesRes,
          ejecucionPresupuestalRes,
          seguimientoPaRes,
          productosPaRes,
          actividadesPaRes
        ] = await Promise.all([
          fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json'),
          fetch('/data/seguimiento_pa/seguimiento_productos_pa.json'),
          fetch('/data/seguimiento_pa/seguimiento_actividades_pa.json'),
          fetch('/data/contratos/contratos.json'),
          fetch('/data/ejecucion_presupuestal/movimientos_presupuestales.json'),
          fetch('/data/ejecucion_presupuestal/ejecucion_presupuestal.json'),
          fetch('/data/seguimiento_pa/seguimiento_pa.json'),
          fetch('/data/seguimiento_pa/seguimiento_productos_pa.json'),
          fetch('/data/seguimiento_pa/seguimiento_actividades_pa.json')
        ])

        // Verificar que todas las respuestas sean exitosas
        if (!proyectosRes.ok) throw new Error('Error cargando proyectos')
        if (!productosRes.ok) throw new Error('Error cargando productos')
        if (!actividadesRes.ok) throw new Error('Error cargando actividades')
        if (!contratosRes.ok) throw new Error('Error cargando contratos')
        if (!movimientosPresupuestalesRes.ok) throw new Error('Error cargando movimientos presupuestales')
        if (!ejecucionPresupuestalRes.ok) throw new Error('Error cargando ejecución presupuestal')
        if (!seguimientoPaRes.ok) throw new Error('Error cargando seguimiento PA')
        if (!productosPaRes.ok) throw new Error('Error cargando productos PA')
        if (!actividadesPaRes.ok) throw new Error('Error cargando actividades PA')

        // Parsear los datos JSON
        const proyectosData = await proyectosRes.json()
        const productosData = await productosRes.json()
        const actividadesData = await actividadesRes.json()
        const contratosData = await contratosRes.json()
        const movimientosPresupuestalesData = await movimientosPresupuestalesRes.json()
        const ejecucionPresupuestalData = await ejecucionPresupuestalRes.json()
        const seguimientoPaData = await seguimientoPaRes.json()
        const productosPaData = await productosPaRes.json()
        const actividadesPaData = await actividadesPaRes.json()

        // Establecer los datos en el estado
        setProyectos(proyectosData || [])
        
        // Para GeoJSON, extraer las features (los datos ya vienen procesados del loader)
        setEquipamientos(equipamientosData?.features?.map((f: any) => f.properties) || [])
        setInfraestructuraVial(infraestructuraData?.features?.map((f: any) => f.properties) || [])
        
        setProductos(productosData || [])
        setActividades(actividadesData || [])
        setContratos(contratosData || [])
        setMovimientosPresupuestales(movimientosPresupuestalesData || [])
        setEjecucionPresupuestal(ejecucionPresupuestalData || [])
        setSeguimientoPa(seguimientoPaData || [])
        setProductosPa(productosPaData || [])
        setActividadesPa(actividadesPaData || [])

        console.log('📊 Datos cargados exitosamente:', {
          proyectos: proyectosData?.length || 0,
          equipamientos: equipamientosData?.features?.length || 0,
          infraestructura: infraestructuraData?.features?.length || 0,
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

// Función para filtrar datos por BPIN, período y otros filtros
  const filterDataByFilters = <T extends { bpin?: number; periodo?: string; [key: string]: any }>(
    data: T[],
    searchFilters: SearchFilters
  ): T[] => {
    return data.filter(item => {
      // Filtro por BPIN específico (desde búsqueda)
      if (searchFilters.search) {
        const searchTerm = searchFilters.search.toLowerCase()
        
        // Buscar por BPIN exacto (convertir número a string)
        if (item.bpin && item.bpin.toString().includes(searchTerm)) {
          return true
        }
        
        // Buscar en todos los campos
        const matchesSearch = Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm)
        )
        
        if (!matchesSearch) return false
      }

      // Filtro por centro gestor (para proyectos que tienen nombre_centro_gestor)
      if (searchFilters.centroGestor && searchFilters.centroGestor.length > 0) {
        const centroGestorField = item.nombre_centro_gestor || item.responsible || item.centro_gestor
        if (centroGestorField && !searchFilters.centroGestor.includes(centroGestorField)) {
          return false
        }
      }

      // Filtro por período específico (desde filtros de período)
      if (searchFilters.periodos && searchFilters.periodos.length > 0) {
        const periodoField = item.periodo_corte || item.periodo || item.anio?.toString()
        if (periodoField) {
          const matchesPeriodo = searchFilters.periodos.some((periodo: string) => 
            periodoField.toString().includes(periodo.toString())
          )
          if (!matchesPeriodo) return false
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
