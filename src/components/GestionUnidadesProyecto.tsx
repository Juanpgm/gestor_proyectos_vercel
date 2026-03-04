'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  Building2,
  FileText,
  CheckCircle2,
  ClipboardList,
  History,
  Database,
  TrendingUp,
  Filter,
  FilterX
} from 'lucide-react'
import { SummaryView, RecordsView, StatsView } from './QualityControlViews'
import { ChangelogView, ByCentroGestorView, MetadataView } from './QualityControlViewsExtended'
import { MultiSelect } from './MultiSelect'
import ManagementFeatureTour from './ManagementFeatureTour'

// Interfaces específicas para cada endpoint
interface ChangeMetric {
  previous: number
  value: number
  change: number
  change_percentage: number
  trend: 'improving' | 'stable' | 'worsening'
}

interface SeverityChange {
  previous: number
  value: number
  change: number
  change_percentage: number
  trend: 'improving' | 'stable' | 'worsening'
}

interface ComparisonWithPrevious {
  has_previous: boolean
  previous_timestamp: string
  previous_report_id: string
  changes: {
    quality_score: ChangeMetric
    total_issues: ChangeMetric
    records_with_issues: ChangeMetric
    error_rate: ChangeMetric
    total_records: ChangeMetric
    centros_require_attention: ChangeMetric
  }
  severity_changes: {
    CRITICAL: SeverityChange
    HIGH: SeverityChange
    MEDIUM: SeverityChange
    LOW: SeverityChange
    INFO?: SeverityChange
  }
}

interface TrendsCount {
  improving: number
  stable: number
  worsening: number
}

interface SummaryData {
  id: string
  report_id: string
  report_timestamp: string
  global_quality_score: number
  error_rate: number
  total_records_validated: number
  records_with_issues: number
  records_without_issues: number
  total_issues_found: number
  system_status: string
  requires_immediate_action: boolean
  severity_distribution: { [key: string]: number }
  dimension_distribution: { [key: string]: number }
  top_quality_centros: Array<{ nombre: string; quality_score: number; error_rate: number; issues: number }>
  top_problematic_centros: Array<{ nombre: string; quality_score: number; error_rate: number; issues: number }>
  recommendations: Array<{ category: string; priority: string; recommendation: string }>
  comparison_with_previous?: ComparisonWithPrevious
  // Campos adicionales de tendencia (vienen a nivel raíz de la respuesta)
  overall_trend?: 'improving' | 'stable' | 'worsening'
  trends_count?: TrendsCount
  has_comparison_data?: boolean
}

interface RecordData {
  id: string
  upid: string
  nombre_up: string
  nombre_centro_gestor: string
  total_issues: number
  max_severity: string
  priority: string
  issues: Array<{
    rule_id: string
    rule_name: string
    dimension: string
    severity: string
    field_name: string
    current_value: any
    expected_value: any
    suggestion: string
    details: string
  }>
  affected_fields: string[]
  severity_counts: { [key: string]: number }
  dimension_counts: { [key: string]: number }
}

interface ChangelogData {
  id: string
  upid: string
  document_id: string
  action: string
  timestamp: string
  old_report_id: string
  new_report_id: string
  changes: { [key: string]: { old: any; new: any } }
}

interface CentroGestorData {
  id: string
  nombre_centro_gestor: string
  total_records: number
  records_with_issues: number
  records_without_issues: number
  total_issues: number
  quality_score: number
  error_rate: number
  status: string
  requires_attention: boolean
  severity_counts: { [key: string]: number }
  dimension_counts: { [key: string]: number }
  top_violated_rules: Array<{ rule_id: string; count: number }>
  top_problematic_fields: Array<{ field: string; count: number }>
  affected_records_sample: string[]
}

interface MetadataData {
  id: string
  report_id: string
  version: string
  generated_at: string
  counts: {
    total_records: number
    total_centros: number
    total_issues: number
    records_with_issues: number
    centros_require_attention: number
  }
  filters: {
    centros_gestores: string[]
    severities: string[]
    priorities: string[]
    dimensions: string[]
    statuses: string[]
  }
  colors: any
  charts: any
}

interface StatsData {
  success: boolean
  data: {
    [key: string]: {
      collection: string
      count: number
    }
  }
  timestamp: string
}

interface ApiResponse {
  success: boolean
  data: any[]
  count: number
  message?: string
  error?: string
}

interface GestionUnidadesProyectoProps {
  onNavigateHome: () => void
}

type TabType = 
  | 'summary' 
  | 'records' 
  | 'changelog' 
  | 'by-centro-gestor' 
  | 'metadata' 
  | 'stats'

const GestionUnidadesProyecto: React.FC<GestionUnidadesProyectoProps> = ({ onNavigateHome }) => {
  // Estado para tabs
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  
  // Estado para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  
  // Estados para datos
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  
  // Estados para UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros avanzados
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<string[]>([])
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([])
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  
  // Listas de opciones disponibles
  const [availableCentrosGestores, setAvailableCentrosGestores] = useState<string[]>([])
  const [availableSeverities, setAvailableSeverities] = useState<string[]>([])
  const [availablePriorities, setAvailablePriorities] = useState<string[]>([])
  
  const [showFilters, setShowFilters] = useState(true)

  const API_BASE_URL = '/api/proxy' // Usar el proxy de Next.js para evitar CORS
  const CALIDAD_DATOS_ENDPOINT = '/unidades-proyecto/calidad-datos'

  // Definición de tabs - quality-control endpoints de la API
  const tabs = [
    {
      id: 'summary' as TabType,
      label: 'Resumen',
      icon: CheckCircle2,
      endpoint: '/unidades-proyecto/quality-control/summary',
      description: 'Resumen general de calidad de datos (ISO/DAMA)'
    },
    {
      id: 'records' as TabType,
      label: 'Registros',
      icon: ClipboardList,
      endpoint: '/unidades-proyecto/quality-control/records',
      description: 'Todos los registros de control de calidad'
    },
    {
      id: 'changelog' as TabType,
      label: 'Historial',
      icon: History,
      endpoint: '/unidades-proyecto/quality-control/changelog',
      description: 'Historial de cambios en control de calidad'
    },
    {
      id: 'by-centro-gestor' as TabType,
      label: 'Por Centro Gestor',
      icon: Building2,
      endpoint: '/unidades-proyecto/quality-control/by-centro-gestor',
      description: 'Control de calidad agrupado por centro gestor'
    },
    {
      id: 'metadata' as TabType,
      label: 'Metadatos',
      icon: Database,
      endpoint: '/unidades-proyecto/quality-control/metadata',
      description: 'Metadatos de control de calidad'
    },
    {
      id: 'stats' as TabType,
      label: 'Estadísticas',
      icon: TrendingUp,
      endpoint: '/unidades-proyecto/quality-control/stats',
      description: 'Estadísticas de control de calidad'
    }
  ]

  const pickFirst = (...values: any[]) => values.find((value) => value !== undefined && value !== null)

  const mapSeverityCode = (code?: string) => {
    const normalized = String(code || '').toUpperCase()
    if (normalized === 'S1') return 'CRITICAL'
    if (normalized === 'S2') return 'HIGH'
    if (normalized === 'S3') return 'MEDIUM'
    return 'LOW'
  }

  const toNumber = (value: any, fallback: number = 0): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const normalizePriorityValue = (value: any): string => {
    if (typeof value === 'string' || typeof value === 'number') return String(value).toUpperCase()
    if (value && typeof value === 'object') {
      if (value.code) return String(value.code).toUpperCase()
      if (value.label) return String(value.label)
    }
    return 'P3'
  }

  const buildSummaryFromCalidadDatos = (source: any) => {
    const resumen = pickFirst(source.resumen, source.summary, source.resumen_ejecutivo, source.metricas_generales) || {}
    const overall = source.overall || {}
    const rules = Array.isArray(source.rules) ? source.rules : []

    const severityDistribution = rules.reduce((acc: Record<string, number>, rule: any) => {
      const severity = mapSeverityCode(rule?.severity?.code)
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {})

    const dimensionDistribution = rules.reduce((acc: Record<string, number>, rule: any) => {
      const dimension = rule?.dimension || 'no_clasificado'
      const affected = toNumber(rule?.scope?.affected_records)
      acc[dimension] = (acc[dimension] || 0) + affected
      return acc
    }, {})

    const recommendations = (Array.isArray(resumen.hallazgos_principales) ? resumen.hallazgos_principales : [])
      .map((item: any) => ({
        category: item?.category || 'General',
        priority: normalizePriorityValue(item?.priority),
        recommendation: item?.recommendation || item?.description || String(item || '')
      }))

    return {
      ...resumen,
      report_id: source.report_id || resumen.report_id,
      report_timestamp: source.generated_at || resumen.generated_at,
      global_quality_score: toNumber(resumen.data_quality_score, toNumber(overall.quality_score)),
      error_rate: toNumber(resumen.error_rate, 100 - toNumber(resumen.data_quality_score, toNumber(overall.quality_score))),
      total_records_validated: toNumber(resumen.total_registros, overall.total_records),
      records_with_issues: toNumber(resumen.registros_con_problemas, overall.total_issues),
      records_without_issues: Math.max(0, toNumber(resumen.total_registros, overall.total_records) - toNumber(resumen.registros_con_problemas)),
      total_issues_found: toNumber(resumen.total_hallazgos, overall.total_issues),
      system_status: (resumen?.clasificacion?.status || source?.overall?.classification?.status || 'NORMAL').toUpperCase(),
      requires_immediate_action: ['CRITICAL', 'WARNING', 'ACEPTABLE'].includes((resumen?.clasificacion?.status || '').toUpperCase()),
      severity_distribution: severityDistribution,
      dimension_distribution: dimensionDistribution,
      top_quality_centros: [],
      top_problematic_centros: [],
      recommendations,
      overall_trend: source.overall_trend,
      trends_summary: source.trends_summary,
      trends_count: source.trends_count,
      has_comparison_data: source.has_comparison_data
    }
  }

  const buildRecordsFromCalidadDatos = (source: any) => {
    const recordsRoot = pickFirst(source.registros, source.records, source.data_records, source.detalle_registros, source.issues)
    const rulesArray = Array.isArray(recordsRoot?.rules)
      ? recordsRoot.rules
      : Array.isArray(recordsRoot)
        ? recordsRoot
        : []

    return rulesArray.map((rule: any, index: number) => {
      const affected = toNumber(rule?.scope?.affected_records)
      const evaluated = toNumber(rule?.scope?.evaluated_records)
      const priorityCode = String(rule?.priority?.code || 'P3').toUpperCase()
      const severity = mapSeverityCode(rule?.severity?.code)

      return {
        id: rule?.rule_id || `rule-${index}`,
        upid: rule?.rule_id || `RULE-${index + 1}`,
        nombre_up: rule?.name || 'Regla de calidad',
        nombre_centro_gestor: rule?.collection || 'Colección no especificada',
        total_issues: affected,
        max_severity: severity,
        priority: priorityCode,
        issues: [
          {
            rule_id: rule?.rule_id || `RULE-${index + 1}`,
            rule_name: rule?.name || 'Regla',
            dimension: rule?.dimension || 'no_clasificado',
            severity,
            field_name: rule?.collection || 'coleccion',
            current_value: {
              affected_records: affected,
              evaluated_records: evaluated,
              compliance_pct: toNumber(rule?.result?.compliance_pct)
            },
            expected_value: {
              affected_records: 0,
              compliance_pct: 100
            },
            suggestion: rule?.description || 'Revisar cumplimiento de la regla',
            details: rule?.description || 'Sin detalles'
          }
        ],
        affected_fields: [rule?.collection || 'coleccion'],
        severity_counts: { [severity]: affected },
        dimension_counts: { [rule?.dimension || 'no_clasificado']: affected }
      }
    })
  }

  const buildCentrosFromCalidadDatos = (source: any) => {
    const root = pickFirst(source.por_centro_gestor, source.by_centro_gestor, source.byCentroGestor, source['by-centro-gestor']) || {}
    const centros = Array.isArray(root.centros)
      ? root.centros
      : (Array.isArray(root) ? root : [])

    return centros.map((centro: any, index: number) => {
      const totalRecords = toNumber(centro?.total_intervenciones)
      const issuesObj = centro?.issues || {}
      const invalidRanges = issuesObj?.invalid_ranges || {}
      const totalIssues =
        toNumber(issuesObj?.missing_required_fields) +
        toNumber(issuesObj?.estado_vs_avance_inconsistente) +
        toNumber(issuesObj?.intervencion_id_duplicates) +
        toNumber(issuesObj?.without_fecha_inicio) +
        toNumber(issuesObj?.without_fecha_fin) +
        toNumber(invalidRanges?.avance_obra) +
        toNumber(invalidRanges?.presupuesto_base)

      const recordsWithIssues = Math.min(totalRecords, totalIssues)
      const score = toNumber(centro?.dqs?.score)
      const status = (centro?.dqs?.classification?.status || '').toUpperCase()

      const severityCounts: Record<string, number> = {}
      const bySeverity = centro?.dqs?.by_severity || {}
      Object.entries(bySeverity).forEach(([sevCode, data]: [string, any]) => {
        severityCounts[mapSeverityCode(sevCode)] = toNumber(data?.rules)
      })

      const topProblematicFields = [
        { field: 'missing_required_fields', count: toNumber(issuesObj?.missing_required_fields) },
        { field: 'estado_vs_avance_inconsistente', count: toNumber(issuesObj?.estado_vs_avance_inconsistente) },
        { field: 'intervencion_id_duplicates', count: toNumber(issuesObj?.intervencion_id_duplicates) },
        { field: 'without_fecha_inicio', count: toNumber(issuesObj?.without_fecha_inicio) },
        { field: 'without_fecha_fin', count: toNumber(issuesObj?.without_fecha_fin) }
      ].filter((item) => item.count > 0)

      return {
        id: `${centro?.nombre_centro_gestor || 'centro'}-${index}`,
        nombre_centro_gestor: centro?.nombre_centro_gestor || 'Centro no especificado',
        total_records: totalRecords,
        records_with_issues: recordsWithIssues,
        records_without_issues: Math.max(0, totalRecords - recordsWithIssues),
        total_issues: totalIssues,
        quality_score: score,
        error_rate: totalRecords > 0 ? Number(((recordsWithIssues / totalRecords) * 100).toFixed(2)) : 0,
        status,
        requires_attention: status === 'CRITICAL' || score < 95,
        severity_counts: severityCounts,
        dimension_counts: {
          completitud: toNumber(issuesObj?.missing_required_fields),
          validez_conformidad: toNumber(invalidRanges?.avance_obra) + toNumber(invalidRanges?.presupuesto_base),
          consistencia: toNumber(issuesObj?.estado_vs_avance_inconsistente),
          unicidad: toNumber(issuesObj?.intervencion_id_duplicates),
          oportunidad_actualidad: toNumber(issuesObj?.without_fecha_inicio) + toNumber(issuesObj?.without_fecha_fin)
        },
        top_violated_rules: [],
        top_problematic_fields: topProblematicFields,
        affected_records_sample: []
      }
    })
  }

  const buildMetadataFromCalidadDatos = (source: any) => {
    const metadatos = pickFirst(source.metadatos, source.metadata, source.meta, source.configuracion) || {}
    const overall = source.overall || {}
    const centrosRoot = source.por_centro_gestor || {}
    const totalCentros = toNumber(centrosRoot.total_centros)

    return {
      id: source.report_id || 'calidad-datos-metadata',
      report_id: source.report_id || 'N/A',
      version: source.framework || 'ISO/DAMA',
      generated_at: source.generated_at || new Date().toISOString(),
      counts: {
        total_records: toNumber(overall.total_records),
        total_centros: totalCentros,
        total_issues: toNumber(overall.total_issues),
        records_with_issues: toNumber(overall.total_issues),
        centros_require_attention: 0
      },
      filters: {
        centros_gestores: [],
        severities: ['S1', 'S2', 'S3', 'S4'],
        priorities: Object.keys(source.priorities || {}).map((key) => key.toUpperCase()),
        dimensions: Array.isArray(metadatos.dimensions) ? metadatos.dimensions : [],
        statuses: ['OPTIMO', 'ACEPTABLE', 'CRITICAL']
      },
      standards: metadatos.standards,
      dimensions: metadatos.dimensions,
      collections_evaluadas: metadatos.collections_evaluadas,
      cache_ttl_seconds: metadatos.cache_ttl_seconds,
      history_limit: metadatos.history_limit,
      colors: {},
      charts: {}
    }
  }

  const buildStatsFromCalidadDatos = (source: any) => {
    const stats = pickFirst(source.estadisticas_globales, source.stats, source.estadisticas, source.metrics, source.metricas, source.kpis) || {}
    const overall = stats.overall || {}
    const byDimension = Array.isArray(stats.by_dimension) ? stats.by_dimension : []
    const byCollection = stats.by_collection || {}

    const byCollectionTotal = Object.values(byCollection).reduce((acc: number, entry: any) => acc + toNumber(entry?.total), 0)

    return {
      timestamp: source.generated_at || new Date().toISOString(),
      data: {
        overall: {
          collection: 'overall',
          count: toNumber(overall.total_records)
        },
        by_dimension: {
          collection: 'by_dimension',
          count: byDimension.length
        },
        by_collection: {
          collection: 'by_collection',
          count: byCollectionTotal
        }
      },
      raw: stats
    }
  }

  const buildChangelogFromCalidadDatos = (source: any) => {
    const historialRoot = pickFirst(source.historial, source.changelog, source.cambios, source.change_log) || {}
    const items = Array.isArray(historialRoot.items)
      ? historialRoot.items
      : (Array.isArray(historialRoot) ? historialRoot : [])

    return items.map((item: any, index: number) => {
      const next = items[index + 1]
      return {
        id: item?.report_id || `history-${index}`,
        upid: item?.report_id || `history-${index}`,
        document_id: item?.report_id || `history-${index}`,
        action: 'updated',
        timestamp: item?.generated_at || source.generated_at,
        old_report_id: next?.report_id || item?.report_id || 'N/A',
        new_report_id: item?.report_id || 'N/A',
        changes: {
          dqs_score: {
            old: next?.dqs_score ?? item?.dqs_score,
            new: item?.dqs_score
          },
          total_issues: {
            old: next?.total_issues ?? item?.total_issues,
            new: item?.total_issues
          }
        }
      }
    })
  }

  const extractTabDataFromCalidadDatos = (result: any, tab: TabType) => {
    const source = result?.data && typeof result.data === 'object' ? result.data : result

    if (!source || typeof source !== 'object') {
      return { found: false, payload: null }
    }

    const summaries = [
      source.summary,
      source.resumen,
      source.resumen_ejecutivo,
      source.metricas_generales,
      source.quality_summary,
      source.latest_summary
    ]

    const records = [
      source.records,
      source.registros,
      source.data_records,
      source.detalle_registros,
      source.issues,
      source.data
    ]

    const changelog = [
      source.changelog,
      source.historial,
      source.cambios,
      source.change_log
    ]

    const byCentro = [
      source.by_centro_gestor,
      source.byCentroGestor,
      source.por_centro_gestor,
      source['by-centro-gestor']
    ]

    const metadata = [
      source.metadata,
      source.metadatos,
      source.meta,
      source.configuracion
    ]

    const stats = [
      source.stats,
      source.estadisticas,
      source.metrics,
      source.metricas,
      source.kpis
    ]

    if (tab === 'summary') {
      const hasSummary = Boolean(pickFirst(...summaries))
      if (!hasSummary) return { found: false, payload: null }
      return { found: true, payload: { success: true, data: buildSummaryFromCalidadDatos(source) } }
    }

    if (tab === 'records') {
      const payload = pickFirst(...records)
      if (!payload) return { found: false, payload: null }
      return { found: true, payload: { success: true, data: buildRecordsFromCalidadDatos(source) } }
    }

    if (tab === 'changelog') {
      const payload = pickFirst(...changelog)
      if (!payload) return { found: false, payload: null }
      return { found: true, payload: { success: true, data: buildChangelogFromCalidadDatos(source) } }
    }

    if (tab === 'by-centro-gestor') {
      const payload = pickFirst(...byCentro)
      if (!payload) return { found: false, payload: null }
      return { found: true, payload: { success: true, data: buildCentrosFromCalidadDatos(source) } }
    }

    if (tab === 'metadata') {
      const payload = pickFirst(...metadata)
      if (!payload) return { found: false, payload: null }
      return { found: true, payload: { success: true, data: [buildMetadataFromCalidadDatos(source)] } }
    }

    if (tab === 'stats') {
      const payload = pickFirst(...stats)
      if (!payload || typeof payload !== 'object') return { found: false, payload: null }
      return { found: true, payload: buildStatsFromCalidadDatos(source) }
    }

    return { found: false, payload: null }
  }

  const fetchJson = async (url: string) => {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Función para cargar datos según el tab activo
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const currentTab = tabs.find(t => t.id === activeTab)
      if (!currentTab) {
        throw new Error('Tab no válido')
      }

      let result: any = null
      let usedEndpoint = `${API_BASE_URL}${currentTab.endpoint}`

      const calidadDatosUrl = `${API_BASE_URL}${CALIDAD_DATOS_ENDPOINT}`
      try {
        const calidadDatosResult: any = await fetchJson(calidadDatosUrl)
        const adapted = extractTabDataFromCalidadDatos(calidadDatosResult, activeTab)

        if (adapted.found) {
          result = adapted.payload
          usedEndpoint = calidadDatosUrl
          console.log('✅ Datos adaptados desde /unidades-proyecto/calidad-datos para tab:', activeTab)
        } else {
          console.warn('⚠️ /unidades-proyecto/calidad-datos no trajo sección para tab', activeTab, '- fallback a endpoint legacy')
        }
      } catch (calidadError) {
        console.warn('⚠️ Error consultando /unidades-proyecto/calidad-datos, usando fallback legacy:', calidadError)
      }

      if (!result) {
        const legacyUrl = `${API_BASE_URL}${currentTab.endpoint}`
        result = await fetchJson(legacyUrl)
        usedEndpoint = legacyUrl
      }

      console.log('📊 Respuesta recibida para', activeTab, 'desde', usedEndpoint, ':', result)

      // Manejar diferentes estructuras según el endpoint
      if (activeTab === 'stats') {
        // Stats devuelve un objeto directo (no wrapped en success/data)
        console.log('✅ Cargando datos de stats')
        setData(result)
      } else if (activeTab === 'summary') {
        // Summary devuelve {success, data, trends_summary, etc}
        if (result.success && result.data) {
          const summaryData = {
            ...result.data,
            overall_trend: result.overall_trend,
            trends_summary: result.trends_summary,
            trends_count: result.trends_count,
            has_comparison_data: result.has_comparison_data
          }
          console.log('✅ Datos de summary procesados:', summaryData)
          setData([summaryData]) // Envolver en array para mantener consistencia
        } else {
          throw new Error(result.message || 'No se recibieron datos de summary')
        }
      } else if (activeTab === 'metadata') {
        // Metadata puede devolver un objeto o array
        if (result.success) {
          const metadataArray = Array.isArray(result.data) ? result.data : [result.data]
          console.log('✅ Cargando metadata:', metadataArray.length, 'registros')
          setData(metadataArray)
        } else {
          throw new Error(result.message || 'No se recibieron datos de metadata')
        }
      } else if (result.success && result.data) {
        // Otros endpoints (records, changelog, by-centro-gestor) devuelven arrays
        const dataArray = Array.isArray(result.data) ? result.data : []
        console.log('✅ Cargando datos:', dataArray.length, 'registros')
        setData(dataArray)
        
        // Extraer valores únicos para los filtros solo si hay datos
        if (dataArray.length > 0) {
          // Extraer centros gestores únicos
          const centroGestorSet = new Set(
            dataArray
              .map((item: any) => item.nombre_centro_gestor || item.centro_gestor)
              .filter(Boolean)
          )
          const centros = Array.from(centroGestorSet) as string[]
          setAvailableCentrosGestores(centros.sort())
          
          // Extraer severidades únicas
          const severitiesSet = new Set(
            dataArray
              .map((item: any) => item.max_severity || item.severity)
              .filter(Boolean)
          )
          const severities = Array.from(severitiesSet) as string[]
          setAvailableSeverities(severities.sort())
          
          // Extraer prioridades únicas
          const prioritiesSet = new Set(
            dataArray
              .map((item: any) => item.priority)
              .filter(Boolean)
          )
          const priorities = Array.from(prioritiesSet) as string[]
          setAvailablePriorities(priorities.sort())
        }
      } else {
        throw new Error(result.message || 'No se pudieron cargar los datos')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error cargando datos:', errorMessage)
      setError(`Error al cargar datos: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros cuando cambien los datos o filtros seleccionados
  useEffect(() => {
    // Si data no es un array o está vacío, no filtrar
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([])
      return
    }

    let filtered = [...data]

    // Filtro por centros gestores (selección múltiple)
    if (selectedCentrosGestores.length > 0) {
      filtered = filtered.filter(item => 
        selectedCentrosGestores.includes(item.nombre_centro_gestor) || 
        selectedCentrosGestores.includes(item.centro_gestor)
      )
    }

    // Filtro por severidad (selección múltiple)
    if (selectedSeverities.length > 0) {
      filtered = filtered.filter(item => 
        selectedSeverities.includes(item.max_severity) || 
        selectedSeverities.includes(item.severity)
      )
    }

    // Filtro por prioridad (selección múltiple)
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(item => 
        selectedPriorities.includes(item.priority)
      )
    }

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(term)
        )
      )
    }

    setFilteredData(filtered)
  }, [data, selectedCentrosGestores, selectedSeverities, selectedPriorities, searchTerm])

  // Cargar datos cuando cambie el tab activo
  useEffect(() => {
    loadData()
  }, [activeTab])

  // Calcular paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Función para cambiar de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header - Compacto */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex-shrink-0" data-tour-id="mgmt-unidades-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Gestionar Unidades de Proyecto
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Control de Calidad de Unidades de Proyecto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ManagementFeatureTour moduleKey="unidades" />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              {showFilters ? <FilterX className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
              Filtros
              {(selectedCentrosGestores.length + selectedSeverities.length + selectedPriorities.length + (searchTerm ? 1 : 0)) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-semibold">
                  {selectedCentrosGestores.length + selectedSeverities.length + selectedPriorities.length + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros - Collapsible */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 flex-shrink-0"
          data-tour-id="mgmt-unidades-filters"
        >
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Multi-Select Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MultiSelect
                label="Centro Gestor"
                options={availableCentrosGestores}
                selected={selectedCentrosGestores}
                onChange={setSelectedCentrosGestores}
                placeholder="Todos los centros"
              />
              <MultiSelect
                label="Estado"
                options={availableSeverities}
                selected={selectedSeverities}
                onChange={setSelectedSeverities}
                placeholder="Todos los estados"
              />
              <MultiSelect
                label="Tipo de Intervención"
                options={availablePriorities}
                selected={selectedPriorities}
                onChange={setSelectedPriorities}
                placeholder="Todos los tipos"
              />
            </div>

            {/* Clear All Filters Button */}
            {(selectedCentrosGestores.length + selectedSeverities.length + selectedPriorities.length + (searchTerm ? 1 : 0)) > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCentrosGestores([])
                    setSelectedSeverities([])
                    setSelectedPriorities([])
                    setSearchTerm('')
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  Limpiar todos los filtros
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tabs - Horizontal Scroll en móvil */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0" data-tour-id="mgmt-unidades-tabs">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido Principal - Usa TODO el espacio disponible */}
      <div className="flex-1 overflow-hidden flex flex-col" data-tour-id="mgmt-unidades-content">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full flex flex-col p-4"
        >
          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex-shrink-0">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                    Error al cargar datos
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-2 text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg">
              <div className="text-center">
                <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">Cargando datos...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <div className="flex-1 overflow-auto">
              {activeTab === 'summary' && (
                <>
                  {Array.isArray(data) && data.length > 0 ? (
                    <SummaryView data={data[0]} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay datos de resumen disponibles
                    </div>
                  )}
                </>
              )}

              {activeTab === 'records' && (
                <>
                  {paginatedData.length > 0 ? (
                    <RecordsView records={paginatedData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No se encontraron registros
                    </div>
                  )}
                </>
              )}

              {activeTab === 'changelog' && (
                <>
                  {filteredData.length > 0 ? (
                    <ChangelogView changes={filteredData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay cambios registrados
                    </div>
                  )}
                </>
              )}

              {activeTab === 'by-centro-gestor' && (
                <>
                  {filteredData.length > 0 ? (
                    <ByCentroGestorView centros={filteredData} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay datos por centro gestor
                    </div>
                  )}
                </>
              )}

              {activeTab === 'metadata' && (
                <>
                  {(Array.isArray(data) && data.length > 0) || (typeof data === 'object' && data !== null) ? (
                    <MetadataView metadata={data} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay metadatos disponibles
                    </div>
                  )}
                </>
              )}

              {activeTab === 'stats' && (
                <>
                  {data && typeof data === 'object' ? (
                    <StatsView data={data} />
                  ) : (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No hay estadísticas disponibles
                    </div>
                  )}
                </>
              )}

              {/* Paginación solo para records */}
              {activeTab === 'records' && filteredData.length > itemsPerPage && (
                <div className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Mostrando <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> a{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{Math.min(endIndex, filteredData.length)}</span> de{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{filteredData.length}</span> registros
                    </div>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value={10}>10 por página</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let pageNumber: number
                        if (totalPages <= 7) {
                          pageNumber = i + 1
                        } else if (currentPage <= 4) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 3) {
                          pageNumber = totalPages - 6 + i
                        } else {
                          pageNumber = currentPage - 3 + i
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`min-w-[28px] h-7 px-2 text-xs font-medium rounded transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default GestionUnidadesProyecto
