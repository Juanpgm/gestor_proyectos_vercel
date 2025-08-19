'use client'

import { useState, useEffect, useMemo } from 'react'
import type { FilterState } from '@/components/UnifiedFilters'

// Interfaces para los tipos de datos
export interface ProyectoCaracteristico {
  bpin: number
  bp: string | null
  nombre_proyecto: string
  nombre_actividad: string
  programa_presupuestal: string
  nombre_centro_gestor: string
  nombre_area_funcional: string
  nombre_fondo: string
  clasificacion_fondo: string
  nombre_pospre: string
  nombre_dimension: string
  nombre_linea_estrategica: string
  nombre_programa: string
  origen: string
  anio: number
  tipo_gasto: string
  cod_sector: number
  cod_producto: number
  validador_cuipo: string | null
}

export interface EjecucionPresupuestal {
  bpin: number
  periodo: string
  vr_prog_mensual: number
  vr_ejec_mensual: number
  porc_ejec_mensual: number
  vr_prog_acum: number
  vr_ejec_acum: number
  porc_ejec_acum: number
  archivo_origen: string
}

export interface SeguimientoPA {
  bpin: number
  cod_pd_lvl_1: number
  cod_pd_lvl_2: number
  cod_pd_lvl_3: number
  cod_actividad: number
  cod_producto: number
  subdireccion_subsecretaria: string
  periodo_corte: string
  avance_proyecto_pa: number
  ejecucion_ppto_proyecto_pa: number
  archivo_origen: string
}

export interface MovimientosPresupuestales {
  bpin: number
  vigencia: number
  periodo: string
  vr_cdp: number
  vr_crp: number
  vr_obligaciones: number
  vr_pagos: number
  archivo_origen: string
}

export interface Contrato {
  bpin: number
  cod_contrato: string
  nombre_proyecto: string
  descripcion_contrato: string
  estado_contrato: string
  codigo_proveedor: string
  proveedor: string
  url_contrato: string
  fecha_actualizacion: string
}

export interface ContratoValor {
  bpin: number
  cod_contrato: string
  valor_contrato: number
}

export interface UnidadProyectoEquipamiento {
  bpin: number
  identificador: string
  cod_fuente_financiamiento: string
  fuente_financiamiento: string
  nombre_proyecto: string
  tipo_equipamiento: string
  codigo_unidad_proyecto: string
  nombre_unidad_proyecto: string
  codigo_actividad: string
  nombre_actividad: string
  codigo_producto: string
  nombre_producto: string
  ponderacion_unidad_proyecto: number
  fecha_corte: string
  coordinates: [number, number]
}

export interface UnidadProyectoInfraestructura {
  bpin: number
  id_vial: string
  nombre_proyecto: string
  seccion_via: string
  codigo_unidad_proyecto: string
  nombre_unidad_proyecto: string
  codigo_actividad: string
  nombre_actividad: string
  ponderacion_unidad_proyecto: number
  fecha_corte: string
  geometry: {
    type: string
    coordinates: number[][]
  }
}

// Estado de los datos unificados
export interface UnifiedProjectData {
  proyectos: ProyectoCaracteristico[]
  ejecucion: EjecucionPresupuestal[]
  seguimiento: SeguimientoPA[]
  movimientos: MovimientosPresupuestales[]
  contratos: Contrato[]
  contratoValores: ContratoValor[]
  equipamientos: UnidadProyectoEquipamiento[]
  infraestructura: UnidadProyectoInfraestructura[]
  loading: boolean
  error: string | null
}

// Datos agregados para estadísticas rápidas
export interface ProjectStats {
  totalProyectos: number
  totalInversion: number
  totalEjecucion: number
  promedioAvance: number
  proyectosPorEstado: Record<string, number>
  proyectosPorCentroGestor: Record<string, number>
  proyectosPorFondo: Record<string, number>
  tendenciaMensual: { periodo: string; programado: number; ejecutado: number }[]
  // Nuevas estadísticas para contratos
  totalContratos: number
  totalValorContratos: number
  contratosPorEstado: Record<string, number>
  contratosPorProveedor: Record<string, number>
  // Nuevas estadísticas para unidades de proyecto
  totalEquipamientos: number
  totalInfraestructura: number
  equipamientosPorTipo: Record<string, number>
  unidadesPorFuenteFinanciamiento: Record<string, number>
}

// Hook principal para manejo de datos
export function useProjectData() {
  const [data, setData] = useState<UnifiedProjectData>({
    proyectos: [],
    ejecucion: [],
    seguimiento: [],
    movimientos: [],
    contratos: [],
    contratoValores: [],
    equipamientos: [],
    infraestructura: [],
    loading: true,
    error: null
  })

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))
        
        // Cargar datos en paralelo para mejor performance
        const [
          proyectosRes, 
          ejecucionRes, 
          seguimientoRes, 
          movimientosRes,
          contratosRes,
          contratoValoresRes,
          equipamientosRes,
          infraestructuraRes
        ] = await Promise.all([
          fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json'),
          fetch('/data/ejecucion_presupuestal/ejecucion_presupuestal.json'),
          fetch('/data/seguimiento_pa/seguimiento_pa.json'),
          fetch('/data/ejecucion_presupuestal/movimientos_presupuestales.json'),
          fetch('/data/contratos/contratos.json'),
          fetch('/data/contratos/contratos_valores.json'),
          fetch('/data/unidades_proyecto/equipamientos.geojson'),
          fetch('/data/unidades_proyecto/infraestructura_vial.geojson')
        ])

        if (!proyectosRes.ok || !ejecucionRes.ok || !seguimientoRes.ok || !movimientosRes.ok ||
            !contratosRes.ok || !contratoValoresRes.ok || !equipamientosRes.ok || !infraestructuraRes.ok) {
          throw new Error('Error al cargar los datos')
        }

        const [
          proyectos, 
          ejecucion, 
          seguimiento, 
          movimientos,
          contratos,
          contratoValores,
          equipamientosGeoJSON,
          infraestructuraGeoJSON
        ] = await Promise.all([
          proyectosRes.json(),
          ejecucionRes.json(),
          seguimientoRes.json(),
          movimientosRes.json(),
          contratosRes.json(),
          contratoValoresRes.json(),
          equipamientosRes.json(),
          infraestructuraRes.json()
        ])

        // Procesar datos GeoJSON para extraer propiedades y coordenadas
        const equipamientos: UnidadProyectoEquipamiento[] = equipamientosGeoJSON.features.map((feature: any) => ({
          ...feature.properties,
          coordinates: feature.geometry.coordinates
        }))

        const infraestructura: UnidadProyectoInfraestructura[] = infraestructuraGeoJSON.features.map((feature: any) => ({
          ...feature.properties,
          geometry: feature.geometry
        }))

        setData({
          proyectos,
          ejecucion,
          seguimiento,
          movimientos,
          contratos,
          contratoValores,
          equipamientos,
          infraestructura,
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error cargando datos:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        }))
      }
    }

    loadData()
  }, [])

  // Función para aplicar filtros a los datos
  const applyFilters = useMemo(() => {
    return (filters: FilterState) => {
      let filteredProyectos = data.proyectos

      // Filtro de búsqueda global
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredProyectos = filteredProyectos.filter(proyecto =>
          proyecto.bpin.toString().includes(searchTerm) ||
          proyecto.nombre_proyecto.toLowerCase().includes(searchTerm) ||
          proyecto.nombre_actividad.toLowerCase().includes(searchTerm) ||
          proyecto.nombre_centro_gestor.toLowerCase().includes(searchTerm) ||
          proyecto.nombre_area_funcional.toLowerCase().includes(searchTerm) ||
          proyecto.nombre_programa.toLowerCase().includes(searchTerm)
        )
      }

      // Filtro por centro gestor
      if (filters.centroGestor && filters.centroGestor.length > 0) {
        filteredProyectos = filteredProyectos.filter(proyecto =>
          filters.centroGestor.some(centro => 
            proyecto.nombre_centro_gestor.toLowerCase().includes(centro.toLowerCase())
          )
        )
      }

      // Filtro por fuentes de financiamiento
      if (filters.fuentesFinanciamiento && filters.fuentesFinanciamiento.length > 0) {
        filteredProyectos = filteredProyectos.filter(proyecto =>
          filters.fuentesFinanciamiento.some(fuente =>
            proyecto.clasificacion_fondo.toLowerCase().includes(fuente.toLowerCase()) ||
            proyecto.nombre_fondo.toLowerCase().includes(fuente.toLowerCase())
          )
        )
      }

      // Filtro por filtros personalizados (dimensiones/líneas estratégicas)
      if (filters.filtrosPersonalizados && filters.filtrosPersonalizados.length > 0) {
        filteredProyectos = filteredProyectos.filter(proyecto =>
          filters.filtrosPersonalizados.some(filtro =>
            proyecto.nombre_dimension.toLowerCase().includes(filtro.toLowerCase()) ||
            proyecto.nombre_linea_estrategica.toLowerCase().includes(filtro.toLowerCase())
          )
        )
      }

      // Filtro por subfiltros personalizados (programas específicos)
      if (filters.subfiltrosPersonalizados && filters.subfiltrosPersonalizados.length > 0) {
        filteredProyectos = filteredProyectos.filter(proyecto =>
          filters.subfiltrosPersonalizados.some(subfiltro =>
            proyecto.nombre_programa.toLowerCase().includes(subfiltro.toLowerCase()) ||
            proyecto.nombre_linea_estrategica.toLowerCase().includes(subfiltro.toLowerCase())
          )
        )
      }

      // Filtro por año (usando fechas)
      if (filters.fechaInicio || filters.fechaFin) {
        filteredProyectos = filteredProyectos.filter(proyecto => {
          const proyectoAnio = proyecto.anio
          const fechaInicio = filters.fechaInicio ? new Date(filters.fechaInicio).getFullYear() : null
          const fechaFin = filters.fechaFin ? new Date(filters.fechaFin).getFullYear() : null

          if (fechaInicio && proyectoAnio < fechaInicio) return false
          if (fechaFin && proyectoAnio > fechaFin) return false
          return true
        })
      }

      // Obtener BPINs filtrados
      const filteredBpins = new Set(filteredProyectos.map(p => p.bpin))

      // Filtrar datos relacionados basados en los BPINs
      const filteredEjecucion = data.ejecucion.filter(e => filteredBpins.has(e.bpin))
      const filteredSeguimiento = data.seguimiento.filter(s => filteredBpins.has(s.bpin))
      const filteredMovimientos = data.movimientos.filter(m => filteredBpins.has(m.bpin))
      const filteredContratos = data.contratos.filter(c => filteredBpins.has(c.bpin))
      const filteredContratoValores = data.contratoValores.filter(cv => filteredBpins.has(cv.bpin))
      const filteredEquipamientos = data.equipamientos.filter(e => filteredBpins.has(e.bpin))
      const filteredInfraestructura = data.infraestructura.filter(i => filteredBpins.has(i.bpin))

      return {
        proyectos: filteredProyectos,
        ejecucion: filteredEjecucion,
        seguimiento: filteredSeguimiento,
        movimientos: filteredMovimientos,
        contratos: filteredContratos,
        contratoValores: filteredContratoValores,
        equipamientos: filteredEquipamientos,
        infraestructura: filteredInfraestructura
      }
    }
  }, [data])

  // Calcular estadísticas agregadas
  const calculateStats = useMemo(() => {
    return (filteredData?: {
      proyectos: ProyectoCaracteristico[]
      ejecucion: EjecucionPresupuestal[]
      seguimiento: SeguimientoPA[]
      movimientos: MovimientosPresupuestales[]
      contratos: Contrato[]
      contratoValores: ContratoValor[]
      equipamientos: UnidadProyectoEquipamiento[]
      infraestructura: UnidadProyectoInfraestructura[]
    }): ProjectStats => {
      const dataToUse = filteredData || {
        proyectos: data.proyectos,
        ejecucion: data.ejecucion,
        seguimiento: data.seguimiento,
        movimientos: data.movimientos,
        contratos: data.contratos,
        contratoValores: data.contratoValores,
        equipamientos: data.equipamientos,
        infraestructura: data.infraestructura
      }

      const totalProyectos = dataToUse.proyectos.length

      // Calcular inversión total (suma de presupuesto programado acumulado más reciente)
      const latestEjecucion = dataToUse.ejecucion.reduce((acc, curr) => {
        const key = curr.bpin
        if (!acc[key] || curr.periodo > acc[key].periodo) {
          acc[key] = curr
        }
        return acc
      }, {} as Record<number, EjecucionPresupuestal>)

      const totalInversion = Object.values(latestEjecucion)
        .reduce((sum, e) => sum + (e.vr_prog_acum || 0), 0)

      const totalEjecucion = Object.values(latestEjecucion)
        .reduce((sum, e) => sum + (e.vr_ejec_acum || 0), 0)

      // Calcular promedio de avance desde seguimiento
      const latestSeguimiento = dataToUse.seguimiento.reduce((acc, curr) => {
        const key = curr.bpin
        if (!acc[key] || curr.periodo_corte > acc[key].periodo_corte) {
          acc[key] = curr
        }
        return acc
      }, {} as Record<number, SeguimientoPA>)

      const promedioAvance = Object.values(latestSeguimiento).length > 0
        ? Object.values(latestSeguimiento)
          .reduce((sum, s) => sum + (s.avance_proyecto_pa || 0), 0) / Object.values(latestSeguimiento).length
        : 0

      // Proyectos por estado (basado en avance)
      const proyectosPorEstado = Object.values(latestSeguimiento).reduce((acc, s) => {
        let estado: string
        if (s.avance_proyecto_pa >= 1) estado = 'Completado'
        else if (s.avance_proyecto_pa >= 0.8) estado = 'En Finalización'
        else if (s.avance_proyecto_pa >= 0.3) estado = 'En Ejecución'
        else if (s.avance_proyecto_pa > 0) estado = 'Iniciado'
        else estado = 'Planificación'

        acc[estado] = (acc[estado] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Proyectos por centro gestor
      const proyectosPorCentroGestor = dataToUse.proyectos.reduce((acc, p) => {
        acc[p.nombre_centro_gestor] = (acc[p.nombre_centro_gestor] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Proyectos por fondo
      const proyectosPorFondo = dataToUse.proyectos.reduce((acc, p) => {
        acc[p.clasificacion_fondo] = (acc[p.clasificacion_fondo] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Tendencia mensual (últimos 12 meses)
      const tendenciaMensual = dataToUse.ejecucion
        .reduce((acc, e) => {
          const existing = acc.find(item => item.periodo === e.periodo)
          if (existing) {
            existing.programado += e.vr_prog_mensual || 0
            existing.ejecutado += e.vr_ejec_mensual || 0
          } else {
            acc.push({
              periodo: e.periodo,
              programado: e.vr_prog_mensual || 0,
              ejecutado: e.vr_ejec_mensual || 0
            })
          }
          return acc
        }, [] as { periodo: string; programado: number; ejecutado: number }[])
        .sort((a, b) => a.periodo.localeCompare(b.periodo))
        .slice(-12) // Últimos 12 períodos

      // Estadísticas de contratos
      const totalContratos = dataToUse.contratos?.length || 0
      
      const totalValorContratos = (dataToUse.contratoValores || [])
        .reduce((sum: number, cv: ContratoValor) => sum + (cv.valor_contrato || 0), 0)

      const contratosPorEstado = (dataToUse.contratos || []).reduce((acc: Record<string, number>, c: Contrato) => {
        acc[c.estado_contrato] = (acc[c.estado_contrato] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const contratosPorProveedor = (dataToUse.contratos || []).reduce((acc: Record<string, number>, c: Contrato) => {
        const proveedor = c.proveedor || 'Sin especificar'
        acc[proveedor] = (acc[proveedor] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Estadísticas de unidades de proyecto
      const totalEquipamientos = dataToUse.equipamientos?.length || 0
      const totalInfraestructura = dataToUse.infraestructura?.length || 0

      const equipamientosPorTipo = (dataToUse.equipamientos || []).reduce((acc: Record<string, number>, e: UnidadProyectoEquipamiento) => {
        const tipo = e.tipo_equipamiento || 'Sin especificar'
        acc[tipo] = (acc[tipo] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const unidadesPorFuenteFinanciamiento = (dataToUse.equipamientos || []).reduce((acc: Record<string, number>, e: UnidadProyectoEquipamiento) => {
        const fuente = e.fuente_financiamiento || 'Sin especificar'
        acc[fuente] = (acc[fuente] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      return {
        totalProyectos,
        totalInversion,
        totalEjecucion,
        promedioAvance,
        proyectosPorEstado,
        proyectosPorCentroGestor,
        proyectosPorFondo,
        tendenciaMensual,
        totalContratos,
        totalValorContratos,
        contratosPorEstado,
        contratosPorProveedor,
        totalEquipamientos,
        totalInfraestructura,
        equipamientosPorTipo,
        unidadesPorFuenteFinanciamiento
      }
    }
  }, [data])

  // Función para obtener opciones únicas para filtros
  const getFilterOptions = useMemo(() => {
    return () => {
      const centrosGestores = Array.from(new Set(data.proyectos.map(p => p.nombre_centro_gestor))).sort()
      const fuentesFinanciamientoSet = new Set([
        ...data.proyectos.map(p => p.clasificacion_fondo),
        ...data.proyectos.map(p => p.nombre_fondo)
      ])
      const fuentesFinanciamiento = Array.from(fuentesFinanciamientoSet).filter(Boolean).sort()
      const dimensiones = Array.from(new Set(data.proyectos.map(p => p.nombre_dimension))).sort()
      const lineasEstrategicas = Array.from(new Set(data.proyectos.map(p => p.nombre_linea_estrategica))).sort()
      const programas = Array.from(new Set(data.proyectos.map(p => p.nombre_programa))).sort()

      return {
        centrosGestores,
        fuentesFinanciamiento,
        dimensiones,
        lineasEstrategicas,
        programas
      }
    }
  }, [data.proyectos])

  return {
    data,
    applyFilters,
    calculateStats,
    getFilterOptions
  }
}

// Hook para búsqueda avanzada y agregaciones
export function useProjectSearch(filters: FilterState) {
  const { data, applyFilters, calculateStats } = useProjectData()
  
  const filteredData = useMemo(() => {
    if (data.loading) return null
    return applyFilters(filters)
  }, [data, filters, applyFilters])

  const stats = useMemo(() => {
    if (!filteredData) return null
    return calculateStats(filteredData)
  }, [filteredData, calculateStats])

  return {
    filteredData,
    stats,
    loading: data.loading,
    error: data.error
  }
}

// Hook para exportar datos filtrados
export function useDataExport() {
  const { applyFilters } = useProjectData()

  const exportToCSV = (filters: FilterState, filename: string = 'proyectos_filtrados.csv') => {
    const filteredData = applyFilters(filters)
    
    // Crear CSV header
    const headers = [
      'BPIN', 'Nombre Proyecto', 'Centro Gestor', 'Clasificación Fondo',
      'Dimension', 'Línea Estratégica', 'Programa', 'Año', 'Tipo Gasto'
    ]
    
    // Crear filas CSV
    const rows = filteredData.proyectos.map(proyecto => [
      proyecto.bpin,
      `"${proyecto.nombre_proyecto}"`,
      `"${proyecto.nombre_centro_gestor}"`,
      `"${proyecto.clasificacion_fondo}"`,
      `"${proyecto.nombre_dimension}"`,
      `"${proyecto.nombre_linea_estrategica}"`,
      `"${proyecto.nombre_programa}"`,
      proyecto.anio,
      `"${proyecto.tipo_gasto}"`
    ])

    // Generar contenido CSV
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const exportToJSON = (filters: FilterState, filename: string = 'proyectos_filtrados.json') => {
    const filteredData = applyFilters(filters)
    
    const jsonContent = JSON.stringify(filteredData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return {
    exportToCSV,
    exportToJSON
  }
}
