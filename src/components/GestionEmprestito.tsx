'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  X,
  Building2,
  FileText,
  CheckCircle2,
  History,
  TrendingUp,
  Filter,
  FilterX,
  FilePenLine,
  ShieldCheck,
  Archive,
  Landmark,
  BarChart3,
} from 'lucide-react'
import { SummaryView, StatsView } from './QualityControlViews'
import { ChangelogView, ByCentroGestorView } from './QualityControlViewsExtended'
import { MultiSelect } from './MultiSelect'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { getCentroGestorAccessFromSession, itemMatchesCentroGestor } from '@/utils/centroGestorAccess'
import type { EmprestitoTabId } from '@/types/gestion-emprestito'
import { EMPRESTITO_TAB_LABELS } from '@/types/gestion-emprestito'

// Dynamic imports for heavy tabs
const GestionRegistrosEmprestitoTab = dynamic(() => import('./GestionRegistrosEmprestitoTab'), { ssr: false })
const AvancesEmprestitoTab = dynamic(() => import('./AvancesEmprestitoTab'), { ssr: false })
const SolicitudesPendientesEmprestitoTab = dynamic(() => import('./SolicitudesPendientesEmprestitoTab'), { ssr: false })
const HistorialSolicitudesEmprestitoTab = dynamic(() => import('./HistorialSolicitudesEmprestitoTab'), { ssr: false })
const AnalisisEmprestitoTab = dynamic(() => import('./AnalisisEmprestitoTab'), { ssr: false })

// ── Interfaces de datos ──────────────────────────────────────────

interface ChangeMetric {
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
  severity_changes: Record<string, ChangeMetric>
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
  severity_distribution: Record<string, number>
  dimension_distribution: Record<string, number>
  top_quality_centros: Array<{ nombre: string; quality_score: number; error_rate: number; issues: number }>
  top_problematic_centros: Array<{ nombre: string; quality_score: number; error_rate: number; issues: number }>
  recommendations: Array<{ category: string; priority: string; recommendation: string }>
  comparison_with_previous?: ComparisonWithPrevious
  overall_trend?: 'improving' | 'stable' | 'worsening'
  trends_count?: { improving: number; stable: number; worsening: number }
  has_comparison_data?: boolean
}

// ── Filter types ─────────────────────────────────────────────────

type EmprestitoFilterOptions = {
  centros_gestores: string[]
  estados: string[]
  bancos: string[]
}

type EmprestitoFilterCatalog = {
  centros_gestores?: string[]
  estados?: string[]
  bancos?: string[]
}

interface SelectedEmprestitoFilters {
  centros_gestores: string[]
  estados: string[]
  bancos: string[]
}

declare global {
  interface Window {
    EMPRESTITO_FILTERS_GLOBAL?: EmprestitoFilterCatalog
    EMPRESTITO_SELECTED_FILTERS?: SelectedEmprestitoFilters
  }
}

// ── Props ────────────────────────────────────────────────────────

interface GestionEmprestitoProps {
  onNavigateHome: () => void
}

// ── Component ────────────────────────────────────────────────────

const GestionEmprestito: React.FC<GestionEmprestitoProps> = ({ onNavigateHome }) => {
  const { hasRole, state: authState } = useAuth()

  const centroGestorAccess = useMemo(() => getCentroGestorAccessFromSession(), [authState.user])
  const userCentroGestor = centroGestorAccess.userCentroGestor
  const canViewAll = centroGestorAccess.canViewAll

  const canViewSolicitudesTabs = hasRole('super_admin') || hasRole('admin_general')
  const canViewAnalisis = hasRole('super_admin') || hasRole('admin_general') || hasRole('admin_centro_gestor') || hasRole('analista')

  // Estado de tabs
  const [activeTab, setActiveTab] = useState<EmprestitoTabId>('resumen')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)

  // Datos
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [recordsData, setRecordsData] = useState<any[]>([])

  // UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCentrosGestores, setSelectedCentrosGestores] = useState<string[]>([])
  const [selectedEstados, setSelectedEstados] = useState<string[]>([])
  const [selectedBancos, setSelectedBancos] = useState<string[]>([])

  // Listas de opciones
  const [availableCentrosGestores, setAvailableCentrosGestores] = useState<string[]>([])
  const [availableEstados, setAvailableEstados] = useState<string[]>([])
  const [availableBancos, setAvailableBancos] = useState<string[]>([])

  const [showFilters, setShowFilters] = useState(false)

  // Auto-seleccionar centro gestor para usuarios restringidos
  useEffect(() => {
    if (!canViewAll && userCentroGestor && selectedCentrosGestores.length === 0) {
      setSelectedCentrosGestores([userCentroGestor])
    }
  }, [canViewAll, userCentroGestor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Publicar filtros seleccionados para tabs autónomos
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.EMPRESTITO_SELECTED_FILTERS = {
      centros_gestores: selectedCentrosGestores,
      estados: selectedEstados,
      bancos: selectedBancos,
    }
    window.dispatchEvent(new Event('emprestito-selected-filters-changed'))
  }, [selectedCentrosGestores, selectedEstados, selectedBancos])

  const API_BASE_URL = '/api/proxy'

  // Map quality control tabs to their real API endpoints
  const QUALITY_TAB_ENDPOINTS: Partial<Record<EmprestitoTabId, string>> = {
    'resumen': '/emprestito/quality-control/summary',
    'historial-cambios': '/emprestito/quality-control/changelog',
    'por-centro-gestor': '/emprestito/quality-control/by-centro-gestor',
    'estadisticas': '/emprestito/quality-control/stats',
  }

  // ── Utilidades ─────────────────────────────────────────────────

  const normalizeOptions = (values: unknown): string[] => {
    if (!Array.isArray(values)) return []
    return Array.from(
      new Set(values.map((v) => String(v || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'es'))
  }

  const pickFirst = (...values: any[]) => values.find((v) => v !== undefined && v !== null)

  const toNumber = (value: any, fallback: number = 0): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const mapSeverityCode = (code?: string) => {
    const n = String(code || '').toUpperCase()
    if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(n)) return n
    if (n === 'ALTA') return 'HIGH'
    if (n === 'MEDIA') return 'MEDIUM'
    if (n === 'BAJA') return 'LOW'
    if (n === 'S1') return 'CRITICAL'
    if (n === 'S2') return 'HIGH'
    if (n === 'S3') return 'MEDIUM'
    return 'LOW'
  }

  const mapPriorityCode = (value: any) => {
    const n = String(value || '').toUpperCase()
    if (['P0', 'P1', 'P2', 'P3'].includes(n)) return n
    if (n === 'URGENT') return 'P0'
    if (n === 'HIGH' || n === 'ALTA') return 'P1'
    if (n === 'MEDIUM' || n === 'MEDIA') return 'P2'
    return 'P3'
  }

  const normalizeDimensionLabel = (value: any) => String(value || '').trim() || 'no_clasificado'

  // ── Lectura/escritura de filtros globales ──────────────────────

  const readGlobalFilterOptions = (): EmprestitoFilterOptions => {
    if (typeof window === 'undefined') {
      return { centros_gestores: [], estados: [], bancos: [] }
    }
    const g = window.EMPRESTITO_FILTERS_GLOBAL || {}
    return {
      centros_gestores: normalizeOptions(g.centros_gestores),
      estados: normalizeOptions(g.estados),
      bancos: normalizeOptions(g.bancos),
    }
  }

  const publishGlobalFilterOptions = (options: EmprestitoFilterOptions) => {
    if (typeof window === 'undefined') return
    window.EMPRESTITO_FILTERS_GLOBAL = {
      centros_gestores: options.centros_gestores,
      estados: options.estados,
      bancos: options.bancos,
    }
    window.dispatchEvent(new Event('emprestito-filters-updated'))
  }

  useEffect(() => {
    const g = readGlobalFilterOptions()
    if (g.centros_gestores.length > 0) setAvailableCentrosGestores(g.centros_gestores)
    if (g.estados.length > 0) setAvailableEstados(g.estados)
    if (g.bancos.length > 0) setAvailableBancos(g.bancos)
  }, [])

  // Hidratar filtros desde el endpoint de contratos si no existen globales
  useEffect(() => {
    const hydrate = async () => {
      const g = readGlobalFilterOptions()
      if (g.centros_gestores.length > 0 && g.estados.length > 0 && g.bancos.length > 0) return

      try {
        const res = await fetch(`${API_BASE_URL}/contratos_emprestito_all`)
        if (!res.ok) return
        const json = await res.json()
        let records = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []

        if (!canViewAll && userCentroGestor) {
          const norm = (v: unknown) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
          const normUser = norm(userCentroGestor)
          records = records.filter((item: any) => {
            const c = norm(item?.nombre_centro_gestor || item?.centro_gestor)
            return c === normUser || c.includes(normUser) || normUser.includes(c)
          })
        }

        const merged: EmprestitoFilterOptions = {
          centros_gestores: normalizeOptions([
            ...g.centros_gestores,
            ...records.map((r: any) => r?.nombre_centro_gestor || r?.centro_gestor),
          ]),
          estados: normalizeOptions([
            ...g.estados,
            ...records.map((r: any) => r?.estado),
          ]),
          bancos: normalizeOptions([
            ...g.bancos,
            ...records.map((r: any) => r?.banco),
          ]),
        }

        publishGlobalFilterOptions(merged)
        setAvailableCentrosGestores(merged.centros_gestores)
        setAvailableEstados(merged.estados)
        setAvailableBancos(merged.bancos)
      } catch {
        // Fallback silencioso
      }
    }
    hydrate()
  }, [API_BASE_URL, canViewAll, userCentroGestor])

  // ── Definición de tabs ─────────────────────────────────────────

  const tabs = useMemo(() => {
    const base: Array<{ id: EmprestitoTabId; label: string; icon: any; description: string }> = [
      { id: 'resumen', label: EMPRESTITO_TAB_LABELS['resumen'], icon: CheckCircle2, description: 'Resumen de calidad de datos del empréstito' },
      { id: 'historial-cambios', label: EMPRESTITO_TAB_LABELS['historial-cambios'], icon: History, description: 'Historial de cambios en control de calidad' },
      { id: 'por-centro-gestor', label: EMPRESTITO_TAB_LABELS['por-centro-gestor'], icon: Building2, description: 'Calidad y registros agrupados por centro gestor' },
      { id: 'estadisticas', label: EMPRESTITO_TAB_LABELS['estadisticas'], icon: TrendingUp, description: 'Estadísticas de calidad' },
    ]

    if (canViewAnalisis) {
      base.push({ id: 'analisis', label: EMPRESTITO_TAB_LABELS['analisis'], icon: BarChart3, description: 'Análisis por banco, CG y BP' })
    }

    base.push(
      { id: 'gestionar-registros', label: EMPRESTITO_TAB_LABELS['gestionar-registros'], icon: FilePenLine, description: 'Crear, eliminar y solicitar cambios' },
      { id: 'avances', label: EMPRESTITO_TAB_LABELS['avances'], icon: FileText, description: 'Avances por centro gestor' },
    )

    if (canViewSolicitudesTabs) {
      base.push(
        { id: 'solicitudes-pendientes', label: EMPRESTITO_TAB_LABELS['solicitudes-pendientes'], icon: ShieldCheck, description: 'Aprobar/rechazar solicitudes' },
        { id: 'historial-solicitudes', label: EMPRESTITO_TAB_LABELS['historial-solicitudes'], icon: Archive, description: 'Historial de solicitudes' },
      )
    }

    return base
  }, [canViewAnalisis, canViewSolicitudesTabs])

  // Redirigir si se pierde acceso a un tab
  useEffect(() => {
    if (!canViewSolicitudesTabs && (activeTab === 'solicitudes-pendientes' || activeTab === 'historial-solicitudes')) {
      setActiveTab('resumen')
      setCurrentPage(1)
    }
    if (!canViewAnalisis && activeTab === 'analisis') {
      setActiveTab('resumen')
      setCurrentPage(1)
    }
  }, [activeTab, canViewSolicitudesTabs, canViewAnalisis])

  // ── Transformación de datos desde calidad-datos ────────────────

  const getRecordsArray = (source: any): any[] => {
    const root = pickFirst(source.registros, source.records, source.data_records, source.detalle_registros, source.issues)
    if (Array.isArray(root)) return root
    if (root && typeof root === 'object') {
      if (Array.isArray(root.items)) return root.items
      if (Array.isArray(root.records)) return root.records
      if (Array.isArray(root.data)) return root.data
    }
    return []
  }

  const buildRecords = (source: any) => {
    const registros = getRecordsArray(source)
    return registros.map((reg: any, index: number) => {
      const diagnostico = pickFirst(reg?.diagnostico, reg?.diagnostico_calidad, reg?.quality_diagnostics, {}) || {}
      const rawIssues = pickFirst(diagnostico?.issues, diagnostico?.hallazgos, reg?.issues, reg?.hallazgos, [])
      const issues = Array.isArray(rawIssues)
        ? rawIssues.map((issue: any, i: number) => ({
            rule_id: String(pickFirst(issue?.rule_id, issue?.codigo_regla, `R-${i + 1}`)),
            rule_name: String(pickFirst(issue?.rule_name, issue?.regla, issue?.nombre, 'Regla de calidad')),
            dimension: normalizeDimensionLabel(pickFirst(issue?.dimension, issue?.categoria)),
            severity: mapSeverityCode(pickFirst(issue?.severity, issue?.nivel)),
            field_name: String(pickFirst(issue?.field_name, issue?.campo, 'N/A')),
            current_value: pickFirst(issue?.current_value, issue?.valor_actual),
            expected_value: pickFirst(issue?.expected_value, issue?.valor_esperado),
            suggestion: String(pickFirst(issue?.suggestion, issue?.sugerencia, 'Revisar y corregir')),
            details: String(pickFirst(issue?.details, issue?.detalle, 'Sin detalles')),
          }))
        : []

      const severityCounts: Record<string, number> = {}
      const dimensionCounts: Record<string, number> = {}
      issues.forEach((iss: any) => {
        severityCounts[iss.severity] = (severityCounts[iss.severity] || 0) + 1
        dimensionCounts[iss.dimension] = (dimensionCounts[iss.dimension] || 0) + 1
      })

      return {
        id: String(pickFirst(reg?.id, reg?.contrato_id, `reg-${index}`)),
        upid: String(pickFirst(reg?.referencia_contrato, reg?.referencia_proceso, reg?.id, `EMP-${index + 1}`)),
        nombre_up: String(pickFirst(reg?.nombre_proyecto, reg?.descripcion, 'Registro empréstito')),
        nombre_centro_gestor: String(pickFirst(reg?.nombre_centro_gestor, reg?.centro_gestor, 'Centro no especificado')),
        total_issues: issues.length,
        max_severity: issues.length > 0 ? mapSeverityCode(issues[0].severity) : 'LOW',
        priority: mapPriorityCode(pickFirst(diagnostico?.priority, reg?.priority)),
        issues,
        affected_fields: Array.from(new Set(issues.map((i: any) => i.field_name).filter(Boolean))),
        severity_counts: severityCounts,
        dimension_counts: dimensionCounts,
        source_record: reg,
      }
    })
  }

  const buildSummary = (source: any) => {
    const resumen = pickFirst(source.resumen, source.summary, source.resumen_ejecutivo, source.metricas_generales) || {}
    const overall = source.overall || {}
    const records = buildRecords(source)
    const recordsWithIssues = records.filter((r: any) => toNumber(r.total_issues) > 0)

    const severityDist = records.reduce((acc: Record<string, number>, r: any) => {
      Object.entries(r.severity_counts || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + toNumber(c) })
      return acc
    }, {})

    const dimensionDist = records.reduce((acc: Record<string, number>, r: any) => {
      Object.entries(r.dimension_counts || {}).forEach(([d, c]) => { acc[d] = (acc[d] || 0) + toNumber(c) })
      return acc
    }, {})

    return {
      ...resumen,
      report_id: source.report_id || resumen.report_id,
      report_timestamp: source.generated_at || resumen.generated_at,
      global_quality_score: toNumber(resumen.data_quality_score, toNumber(overall.quality_score)),
      error_rate: toNumber(resumen.error_rate, 100 - toNumber(resumen.data_quality_score, toNumber(overall.quality_score))),
      total_records_validated: toNumber(resumen.total_registros, toNumber(overall.total_records, records.length)),
      records_with_issues: toNumber(resumen.registros_con_problemas, recordsWithIssues.length),
      records_without_issues: Math.max(0, toNumber(resumen.total_registros, records.length) - toNumber(resumen.registros_con_problemas, recordsWithIssues.length)),
      total_issues_found: toNumber(resumen.total_hallazgos, records.reduce((a: number, r: any) => a + toNumber(r.total_issues), 0)),
      system_status: (resumen?.clasificacion?.status || overall?.classification?.status || 'NORMAL').toUpperCase(),
      requires_immediate_action: ['CRITICAL', 'WARNING'].includes((resumen?.clasificacion?.status || '').toUpperCase()),
      severity_distribution: severityDist,
      dimension_distribution: dimensionDist,
      top_quality_centros: [],
      top_problematic_centros: [],
      recommendations: (Array.isArray(resumen.hallazgos_principales) ? resumen.hallazgos_principales : []).map((item: any) => ({
        category: item?.category || 'General',
        priority: String(item?.priority || 'P3').toUpperCase(),
        recommendation: item?.recommendation || item?.description || String(item || ''),
      })),
      overall_trend: source.overall_trend,
      trends_count: source.trends_count,
      has_comparison_data: source.has_comparison_data,
    }
  }

  const buildCentros = (source: any) => {
    const root = pickFirst(source.por_centro_gestor, source.by_centro_gestor, source.byCentroGestor) || {}
    const centros = Array.isArray(root.centros) ? root.centros : Array.isArray(root) ? root : []

    if (centros.length === 0) {
      // Build from records
      const records = buildRecords(source)
      if (records.length === 0) return []
      const grouped = new Map<string, any[]>()
      records.forEach((r: any) => {
        const c = String(r.nombre_centro_gestor || 'Centro no especificado')
        if (!grouped.has(c)) grouped.set(c, [])
        grouped.get(c)!.push(r)
      })
      return Array.from(grouped.entries()).map(([nombre, recs], idx) => {
        const total = recs.length
        const withIssues = recs.filter((r) => toNumber(r.total_issues) > 0).length
        const totalIssues = recs.reduce((a, r) => a + toNumber(r.total_issues), 0)
        const score = total > 0 ? Number(((1 - withIssues / total) * 100).toFixed(2)) : 100
        return {
          id: `${nombre}-${idx}`,
          nombre_centro_gestor: nombre,
          total_records: total,
          records_with_issues: withIssues,
          records_without_issues: Math.max(0, total - withIssues),
          total_issues: totalIssues,
          quality_score: score,
          error_rate: total > 0 ? Number(((withIssues / total) * 100).toFixed(2)) : 0,
          status: score >= 95 ? 'OPTIMO' : score >= 85 ? 'ACEPTABLE' : 'CRITICAL',
          requires_attention: score < 85,
          severity_counts: {},
          dimension_counts: {},
          top_violated_rules: [],
          top_problematic_fields: [],
          affected_records_sample: [],
        }
      })
    }

    return centros.map((c: any, idx: number) => ({
      id: `${c.nombre_centro_gestor || 'centro'}-${idx}`,
      nombre_centro_gestor: c.nombre_centro_gestor || 'Centro no especificado',
      total_records: toNumber(c.total_contratos || c.total_intervenciones),
      records_with_issues: toNumber(c.records_with_issues),
      records_without_issues: Math.max(0, toNumber(c.total_contratos || c.total_intervenciones) - toNumber(c.records_with_issues)),
      total_issues: toNumber(c.total_issues),
      quality_score: toNumber(c.dqs?.score || c.quality_score),
      error_rate: toNumber(c.error_rate),
      status: (c.dqs?.classification?.status || c.status || 'NORMAL').toUpperCase(),
      requires_attention: toNumber(c.dqs?.score || c.quality_score) < 85,
      severity_counts: c.dqs?.by_severity || c.severity_counts || {},
      dimension_counts: c.dimension_counts || {},
      top_violated_rules: [],
      top_problematic_fields: [],
      affected_records_sample: [],
    }))
  }

  const buildChangelog = (source: any) => {
    const root = pickFirst(source.historial, source.changelog, source.cambios) || {}
    const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []

    if (items.length > 0) {
      return items.map((item: any, index: number) => {
        const next = items[index + 1]
        return {
          id: item?.report_id || `history-${index}`,
          upid: item?.report_id || `history-${index}`,
          document_id: item?.report_id || `history-${index}`,
          action: 'updated',
          timestamp: item?.generated_at || source.generated_at,
          old_report_id: next?.report_id || 'N/A',
          new_report_id: item?.report_id || 'N/A',
          changes: {
            dqs_score: { old: next?.dqs_score ?? item?.dqs_score, new: item?.dqs_score },
            total_issues: { old: next?.total_issues ?? item?.total_issues, new: item?.total_issues },
          },
        }
      })
    }

    // Fallback: build from records
    const records = buildRecords(source)
    return records
      .filter((r: any) => toNumber(r.total_issues) > 0)
      .slice(0, 100)
      .map((r: any, index: number) => ({
        id: `change-${r.id || index}`,
        upid: r.upid,
        document_id: r.id || r.upid,
        action: 'updated',
        timestamp: source.generated_at || new Date().toISOString(),
        old_report_id: source.report_id || 'N/A',
        new_report_id: source.report_id || 'N/A',
        changes: {
          total_issues: { old: 0, new: toNumber(r.total_issues) },
          severidad_maxima: { old: 'N/A', new: r.max_severity || 'LOW' },
        },
      }))
  }

  const buildStats = (source: any) => {
    const stats = pickFirst(source.estadisticas_globales, source.stats, source.estadisticas, source.metrics) || {}
    const overall = stats.overall || {}
    const records = buildRecords(source)
    const withIssues = records.filter((r: any) => toNumber(r.total_issues) > 0).length

    return {
      timestamp: source.generated_at || new Date().toISOString(),
      data: {
        overall: { collection: 'overall', count: toNumber(overall.total_records, records.length) },
        registros_con_problemas: { collection: 'records_with_issues', count: withIssues },
        total_hallazgos: {
          collection: 'total_issues',
          count: records.reduce((a: number, r: any) => a + toNumber(r.total_issues), 0),
        },
      },
      raw: stats,
    }
  }

  const mapSeverityDist = (dist: Record<string, number> | undefined): Record<string, number> => {
    if (!dist) return {}
    return { CRITICAL: dist.S1 || 0, HIGH: dist.S2 || 0, MEDIUM: dist.S3 || 0, LOW: dist.S4 || 0 }
  }

  const extractTabData = (result: any, tab: EmprestitoTabId) => {
    const source = result?.data && typeof result.data === 'object' ? result.data : result
    if (!source || typeof source !== 'object') return { found: false, payload: null }

    if (tab === 'resumen') {
      const summary = source.summary || {}
      const dqs = source.dqs || {}
      const classification = dqs.classification || {}

      // Build top centros from grouped_by_centro_gestor
      const groupedByCG = summary.grouped_by_centro_gestor || {}
      const centrosList = Object.entries(groupedByCG).map(([nombre, info]: [string, any]) => ({
        nombre,
        quality_score: info.total_records > 0
          ? Number(((1 - (info.with_issues || 0) / info.total_records) * 100).toFixed(2))
          : 100,
        error_rate: info.total_records > 0
          ? Number(((info.with_issues || 0) / info.total_records * 100).toFixed(2))
          : 0,
        issues: info.with_issues || 0,
      }))

      const topQuality = [...centrosList].sort((a, b) => b.quality_score - a.quality_score).slice(0, 5)
      const topProblematic = [...centrosList].sort((a, b) => b.issues - a.issues).slice(0, 5)

      // Recommendations from rules — exclude duplicate_reference (EMP-PAGO-003, not a real error)
      const allRules = source.rules || []
      const duplicateRule = allRules.find((r: any) => r.rule_id === 'EMP-PAGO-003')
      const duplicateIssueCount = duplicateRule?.scope?.affected_records || 0
      const rules = allRules.filter((r: any) => r.rule_id !== 'EMP-PAGO-003')
      const recommendations = rules.map((r: any) => ({
        priority: r.priority?.code || 'P3',
        category: r.collection || 'General',
        recommendation: `${r.name} — ${r.scope?.affected_records || 0} registros afectados (${(r.scope?.affected_pct || 0).toFixed(1)}%)`,
      }))

      // Dimension distribution from framework
      const dimensions = source.framework?.dimensions || []
      const dimensionDist: Record<string, number> = {}
      dimensions.forEach((d: string) => { dimensionDist[d] = 1 })

      const status = String(classification.status || 'NORMAL').toUpperCase()

      // Adjust severity distribution: subtract duplicate_reference issues (S1) from counts
      const rawSevDist = mapSeverityDist(source.severity_distribution)
      if (duplicateIssueCount > 0 && rawSevDist.CRITICAL) {
        rawSevDist.CRITICAL = Math.max(0, rawSevDist.CRITICAL - duplicateIssueCount)
      }
      const adjustedTotalIssues = Object.values(rawSevDist).reduce((a, b) => a + b, 0)

      const summaryData = {
        report_id: source.report_id,
        report_timestamp: source.generated_at,
        global_quality_score: toNumber(source.quality_score, toNumber(dqs.score)),
        error_rate: toNumber(source.error_rate),
        total_records_validated: toNumber(summary.total_records),
        records_with_issues: toNumber(summary.records_with_issues),
        records_without_issues: toNumber(summary.records_without_issues),
        total_issues_found: adjustedTotalIssues,
        system_status: status,
        requires_immediate_action: ['CRITICAL', 'WARNING', 'CRITICO'].includes(status),
        severity_distribution: rawSevDist,
        dimension_distribution: dimensionDist,
        top_quality_centros: topQuality,
        top_problematic_centros: topProblematic,
        recommendations,
      }
      return { found: true, payload: { success: true, data: summaryData } }
    }

    if (tab === 'registros') {
      const records = source.records || []
      if (records.length === 0 && !source.rules) return { found: false, payload: null }

      // ── Map reason+field to rich issue metadata ──
      const getIssueMeta = (reason: string, field: string) => {
        const key = `${reason}::${field}`
        const metaMap: Record<string, { rule_id: string; rule_name: string; description: string; suggestion: string }> = {
          'missing_required::monto_pagado': {
            rule_id: 'EMP-PAGO-001',
            rule_name: 'Completitud de campos requeridos en pago',
            description: 'El campo "monto_pagado" es obligatorio pero está vacío o no existe en este registro de pago.',
            suggestion: 'Abrir el registro del pago en Gestionar Registros → Pagos, editar y completar el campo "monto_pagado" con el valor efectivamente desembolsado.',
          },
          'duplicate_reference::referencia_contrato': {
            rule_id: 'EMP-PAGO-003',
            rule_name: 'Unicidad de referencia en pago',
            description: 'El valor de "referencia_contrato" aparece en más de un registro de pago, lo que indica posible duplicación de registros.',
            suggestion: 'Revisar los pagos que comparten la misma referencia_contrato. Si son pagos diferentes, asignar un identificador único a cada uno. Si son duplicados, eliminar el registro sobrante desde Gestionar Registros → Pagos.',
          },
          'orphan_contract_reference::referencia_contrato': {
            rule_id: 'EMP-PAGO-004',
            rule_name: 'Integridad referencial en pago',
            description: 'El valor de "referencia_contrato" no corresponde a ningún contrato registrado en la colección de contratos del empréstito.',
            suggestion: 'Verificar que la referencia_contrato sea correcta. Si el contrato existe con una referencia diferente, corregir el valor en el pago. Si el contrato aún no se ha registrado, crearlo primero en Gestionar Registros → Contratos.',
          },
        }
        const meta = metaMap[key]
        if (meta) return meta
        // Fallback for unknown combinations
        return {
          rule_id: `EMP-${(reason || 'UNK').toUpperCase().slice(0, 8)}`,
          rule_name: `Regla: ${reason || 'desconocida'}`,
          description: `Se detectó un problema de tipo "${reason || 'desconocido'}" en el campo "${field || 'no especificado'}".`,
          suggestion: `Revisar y corregir el campo "${field || 'afectado'}" en el registro correspondiente desde Gestionar Registros.`,
        }
      }

      const mapped = records.map((rec: any, idx: number) => {
        const issues = (rec.issues || [])
          .filter((iss: any) => iss.reason !== 'duplicate_reference') // No es error: varios pagos pueden referenciar el mismo contrato
          .map((iss: any, i: number) => {
          const meta = getIssueMeta(iss.reason || '', iss.field || '')
          return {
            rule_id: meta.rule_id,
            rule_name: meta.rule_name,
            description: meta.description,
            severity: mapSeverityCode(iss.severity),
            severity_label: iss.severity_label || '',
            field_name: iss.field || 'N/A',
            suggestion: meta.suggestion,
            reason: iss.reason || '',
          }
        })
        const severityCounts: Record<string, number> = {}
        issues.forEach((iss: any) => {
          severityCounts[iss.severity] = (severityCounts[iss.severity] || 0) + 1
        })
        return {
          id: rec.record_uid || `rec-${idx}`,
          upid: rec.identifier || rec.record_uid || `REC-${idx + 1}`,
          nombre_up: rec.nombre_centro_gestor || 'Centro no especificado',
          nombre_centro_gestor: rec.nombre_centro_gestor || 'Centro no especificado',
          record_type: rec.record_type || 'registro',
          source_doc_id: rec.source_doc_id || '',
          max_severity: issues.length > 0 ? issues.reduce((worst: string, iss: any) => {
            const sevOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
            return (sevOrder[iss.severity] ?? 99) < (sevOrder[worst] ?? 99) ? iss.severity : worst
          }, 'LOW') : 'LOW',
          priority: issues.length > 3 ? 'P1' : issues.length > 0 ? 'P2' : 'P3',
          total_issues: issues.length,
          issues,
          severity_counts: severityCounts,
          affected_fields: Array.from(new Set(issues.map((i: any) => i.field_name).filter(Boolean))),
          source_record: rec,
        }
      })

      // ── Deduplicate: group by contract reference (upid = identifier = referencia_contrato) ──
      const byContract = new Map<string, any>()
      mapped.forEach((rec: any) => {
        const key = rec.upid
        if (!byContract.has(key)) {
          byContract.set(key, {
            ...rec,
            pago_count: 1,
            issues: [...rec.issues],
          })
        } else {
          const existing = byContract.get(key)!
          existing.pago_count += 1
          // Merge issues, deduplicate by rule_id (same rule on same contract = 1 entry)
          const existingRuleIds = new Set(existing.issues.map((i: any) => i.rule_id))
          rec.issues.forEach((iss: any) => {
            if (!existingRuleIds.has(iss.rule_id)) {
              existing.issues.push(iss)
              existingRuleIds.add(iss.rule_id)
            }
          })
          existing.total_issues = existing.issues.length
          // Update max severity
          const sevOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
          if ((sevOrder[rec.max_severity] ?? 99) < (sevOrder[existing.max_severity] ?? 99)) {
            existing.max_severity = rec.max_severity
          }
          // Merge severity counts
          Object.entries(rec.severity_counts || {}).forEach(([s, c]) => {
            existing.severity_counts[s] = (existing.severity_counts[s] || 0)
          })
          // Recalc severity counts from deduplicated issues
          const newCounts: Record<string, number> = {}
          existing.issues.forEach((i: any) => {
            newCounts[i.severity] = (newCounts[i.severity] || 0) + 1
          })
          existing.severity_counts = newCounts
          existing.affected_fields = Array.from(new Set(existing.issues.map((i: any) => i.field_name).filter(Boolean)))
        }
      })
      const deduplicated = Array.from(byContract.values())
      return { found: true, payload: { success: true, data: deduplicated } }
    }

    if (tab === 'historial-cambios') {
      // Changelog endpoint — may return 500, handle gracefully
      const items = source.changes || source.changelog || source.items || []
      const mapped = (Array.isArray(items) ? items : []).map((item: any, idx: number) => ({
        id: item.id || `change-${idx}`,
        upid: item.record_uid || item.identifier || `CHG-${idx}`,
        action: item.action || 'updated',
        timestamp: item.timestamp || item.generated_at || source.generated_at,
        old_report_id: item.old_report_id || 'N/A',
        new_report_id: item.new_report_id || 'N/A',
        changes: item.changes || {},
      }))
      return { found: true, payload: { success: true, data: mapped } }
    }

    if (tab === 'por-centro-gestor') {
      const centros = (source.centros || []).filter(
        (c: any) => c.nombre_centro_gestor !== 'Centro Gestor de Pruebas'
      )
      const mapped = centros.map((c: any, idx: number) => {
        const total = toNumber(c.total_records)
        const withIssues = toNumber(c.with_issues)
        const qualityScore = total > 0
          ? Number(((1 - withIssues / total) * 100).toFixed(2))
          : 100
        return {
          id: `${c.nombre_centro_gestor || 'centro'}-${idx}`,
          nombre_centro_gestor: c.nombre_centro_gestor || 'Centro no especificado',
          total_records: total,
          records_with_issues: withIssues,
          records_without_issues: toNumber(c.without_issues),
          total_issues: withIssues,
          quality_score: qualityScore,
          error_rate: toNumber(c.issue_rate_pct),
          status: qualityScore >= 95 ? 'EXCELLENT' : qualityScore >= 85 ? 'GOOD' : qualityScore >= 70 ? 'ACCEPTABLE' : qualityScore >= 50 ? 'POOR' : 'CRITICAL',
          requires_attention: qualityScore < 85,
          severity_counts: mapSeverityDist(c.severity),
          dimension_counts: {},
          top_violated_rules: [],
          top_problematic_fields: [],
          affected_records_sample: [],
        }
      })
      return { found: true, payload: { success: true, data: mapped } }
    }

    if (tab === 'estadisticas') {
      const stats = source.stats || {}
      const collections = stats.collections || {}
      const latestReport = stats.latest_quality_report || {}

      const dataMap: Record<string, { count: number; collection: string }> = {}
      Object.entries(collections).forEach(([key, val]: [string, any]) => {
        dataMap[key] = { count: val.total_documents || 0, collection: val.collection || key }
      })
      dataMap['total_calidad'] = { count: latestReport.total_records || 0, collection: 'quality_reports' }
      dataMap['con_problemas'] = { count: latestReport.records_with_issues || 0, collection: 'records_with_issues' }
      dataMap['reportes_calidad'] = { count: stats.total_quality_reports || 0, collection: 'quality_reports_total' }

      return {
        found: true,
        payload: {
          timestamp: latestReport.generated_at || new Date().toISOString(),
          data: dataMap,
        },
      }
    }

    return { found: false, payload: null }
  }

  // ── Cargar datos ───────────────────────────────────────────────

  const fetchJson = async (url: string) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' },
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      return res.json()
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const loadData = async () => {
    const autonomousTabs: EmprestitoTabId[] = ['gestionar-registros', 'avances', 'solicitudes-pendientes', 'historial-solicitudes', 'analisis']
    if (autonomousTabs.includes(activeTab)) return

    setLoading(true)
    setError(null)

    try {
      const endpoint = QUALITY_TAB_ENDPOINTS[activeTab]
      if (!endpoint) {
        throw new Error(`No hay endpoint configurado para "${EMPRESTITO_TAB_LABELS[activeTab]}"`)
      }
      const url = `${API_BASE_URL}${endpoint}`
      const result = await fetchJson(url)

      const adapted = extractTabData(result, activeTab)

      if (!adapted.found || !adapted.payload) {
        throw new Error(`No se encontraron datos para "${EMPRESTITO_TAB_LABELS[activeTab]}"`)
      }

      const payload: any = adapted.payload

      // Fetch records in parallel for por-centro-gestor tab
      if (activeTab === 'por-centro-gestor') {
        try {
          // Fetch all pages (API max limit=200)
          const allRecords: any[] = []
          let page = 1
          let hasMore = true
          while (hasMore) {
            const recordsUrl = `${API_BASE_URL}/emprestito/quality-control/records?limit=200&page=${page}`
            const recordsResult = await fetchJson(recordsUrl)
            const recordsAdapted = extractTabData(recordsResult, 'registros' as EmprestitoTabId)
            if (recordsAdapted.found && recordsAdapted.payload?.success && Array.isArray(recordsAdapted.payload.data)) {
              allRecords.push(...recordsAdapted.payload.data)
            }
            hasMore = recordsResult?.has_more === true
            page++
            if (page > 20) break // Safety limit
          }
          setRecordsData(allRecords)
        } catch {
          console.warn('No se pudieron cargar registros para detalle por centro gestor')
          setRecordsData([])
        }
      }

      if (activeTab === 'estadisticas') {
        setData(payload)
      } else if (activeTab === 'resumen') {
        if (payload.success && payload.data) {
          setData([{
            ...payload.data,
            overall_trend: payload.overall_trend,
            trends_count: payload.trends_count,
            has_comparison_data: payload.has_comparison_data,
          }])
        } else {
          throw new Error('No se recibieron datos de resumen')
        }
      } else if (payload.success && payload.data) {
        const arr = Array.isArray(payload.data) ? payload.data : []
        setData(arr)

        // Hidratar dropdowns
        const g = readGlobalFilterOptions()
        const merged: EmprestitoFilterOptions = {
          centros_gestores: g.centros_gestores.length > 0
            ? g.centros_gestores
            : normalizeOptions(arr.map((i: any) => i.nombre_centro_gestor || i.centro_gestor)),
          estados: g.estados.length > 0
            ? g.estados
            : normalizeOptions(arr.map((i: any) => i.estado || i.max_severity)),
          bancos: g.bancos.length > 0
            ? g.bancos
            : normalizeOptions(arr.map((i: any) => i.banco)),
        }
        setAvailableCentrosGestores(merged.centros_gestores)
        setAvailableEstados(merged.estados)
        setAvailableBancos(merged.bancos)
        publishGlobalFilterOptions(merged)
      } else {
        throw new Error(payload.message || 'No se pudieron cargar los datos')
      }
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === 'AbortError' ? 'Timeout (20s)' : err.message)
        : 'Error desconocido'
      setError(`Error al cargar datos: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) {
      setFilteredData([])
      return
    }

    let filtered = [...data]

    if (!canViewAll && userCentroGestor) {
      filtered = filtered.filter((item) => itemMatchesCentroGestor(item, centroGestorAccess))
    }

    if (selectedCentrosGestores.length > 0) {
      filtered = filtered.filter((item) =>
        selectedCentrosGestores.includes(item.nombre_centro_gestor) || selectedCentrosGestores.includes(item.centro_gestor)
      )
    }

    if (selectedEstados.length > 0) {
      filtered = filtered.filter((item) =>
        selectedEstados.includes(item.estado) || selectedEstados.includes(item.max_severity)
      )
    }

    if (selectedBancos.length > 0) {
      filtered = filtered.filter((item) => selectedBancos.includes(item.banco))
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((item) =>
        Object.values(item).some((v) => String(v).toLowerCase().includes(term))
      )
    }

    setFilteredData(filtered)
  }, [data, selectedCentrosGestores, selectedEstados, selectedBancos, searchTerm, canViewAll, userCentroGestor, centroGestorAccess])

  // Cargar datos al cambiar de tab
  useEffect(() => {
    loadData()
  }, [activeTab])

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleRefreshFromTab = () => {
    loadData()
  }

  // ── Render ─────────────────────────────────────────────────────

  const activeFilterCount =
    selectedCentrosGestores.length +
    selectedEstados.length +
    selectedBancos.length +
    (searchTerm ? 1 : 0)

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900 min-h-0">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">

          {/* Izquierda: nav + título */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              aria-label="Volver al inicio"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-600" />

            <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center shrink-0">
              <Landmark size={16} strokeWidth={1.5} className="text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight truncate">
                Gestionar Empréstito
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 truncate hidden sm:block">
                Contratos · Procesos · RPCs · Pagos · Convenios
              </p>
            </div>
          </div>

          {/* Derecha: acciones */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors border',
                showFilters || activeFilterCount > 0
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700/50'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
              )}
            >
              {showFilters ? (
                <FilterX size={14} strokeWidth={1.5} />
              ) : (
                <Filter size={14} strokeWidth={1.5} />
              )}
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                strokeWidth={1.5}
                className={cn(loading && 'animate-spin')}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel de filtros ── */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-3 pb-4 flex-shrink-0"
        >
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-9 py-1.5 text-[13px] border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MultiSelect
                label="Centro Gestor"
                options={!canViewAll && userCentroGestor ? [userCentroGestor] : availableCentrosGestores}
                selected={!canViewAll && userCentroGestor ? [userCentroGestor] : selectedCentrosGestores}
                onChange={canViewAll ? setSelectedCentrosGestores : () => {}}
                placeholder={!canViewAll && userCentroGestor ? userCentroGestor : 'Todos los centros'}
              />
              <MultiSelect
                label="Estado"
                options={availableEstados}
                selected={selectedEstados}
                onChange={setSelectedEstados}
                placeholder="Todos los estados"
              />
              <MultiSelect
                label="Banco"
                options={availableBancos}
                selected={selectedBancos}
                onChange={setSelectedBancos}
                placeholder="Todos los bancos"
              />
            </div>

            {/* Limpiar */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCentrosGestores([])
                    setSelectedEstados([])
                    setSelectedBancos([])
                    setSearchTerm('')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <FilterX size={13} strokeWidth={1.5} />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Tabs ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex overflow-x-auto scrollbar-hide px-3 gap-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                title={tab.description}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium transition-colors border-b-2 whitespace-nowrap',
                  isActive
                    ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-200 dark:hover:border-slate-600'
                )}
              >
                <Icon
                  size={13}
                  strokeWidth={1.5}
                  className={cn(isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500')}
                />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="h-full flex flex-col"
        >
          {/* Banner de error */}
          {error && (
            <div className="mx-4 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex-shrink-0">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} strokeWidth={1.5} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-red-900 dark:text-red-100">Error al cargar datos</p>
                  <p className="text-[12px] text-red-700 dark:text-red-300 mt-0.5">{error}</p>
                  <button
                    onClick={loadData}
                    className="mt-1.5 text-[11px] px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Spinner */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[13px] text-slate-500 dark:text-slate-400">Cargando datos...</p>
              </div>
            </div>
          )}

          {/* Contenido de tabs */}
          {!loading && (
            <div className="flex-1 min-h-0 overflow-auto p-4">

              {/* Resumen */}
              {activeTab === 'resumen' && (
                Array.isArray(data) && data.length > 0
                  ? <SummaryView data={data[0]} />
                  : !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                      <CheckCircle2 size={32} strokeWidth={1} className="mb-3 opacity-40" />
                      <p className="text-[13px]">No hay datos de resumen disponibles</p>
                    </div>
                  )
              )}

              {/* Historial de cambios */}
              {activeTab === 'historial-cambios' && (
                filteredData.length > 0
                  ? <ChangelogView changes={filteredData} />
                  : !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                      <History size={32} strokeWidth={1} className="mb-3 opacity-40" />
                      <p className="text-[13px]">No hay cambios registrados</p>
                    </div>
                  )
              )}

              {/* Por centro gestor */}
              {activeTab === 'por-centro-gestor' && (
                filteredData.length > 0
                  ? (
                    <>
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={async () => {
                            try {
                              const { exportarEmprestitoXLSX } = await import('@/services/emprestito-gestion.service')
                              const blob = await exportarEmprestitoXLSX()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `emprestito_${new Date().toISOString().slice(0, 10)}.xlsx`
                              a.click()
                              URL.revokeObjectURL(url)
                            } catch (err) {
                              console.error('Error al exportar XLSX:', err)
                              alert('No se pudo descargar el archivo XLSX.')
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50 rounded-md transition-colors"
                        >
                          <FileText size={13} strokeWidth={1.5} />
                          Exportar XLSX
                        </button>
                      </div>
                      <ByCentroGestorView centros={filteredData} records={recordsData} />
                    </>
                  )
                  : !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                      <Building2 size={32} strokeWidth={1} className="mb-3 opacity-40" />
                      <p className="text-[13px]">No hay datos por centro gestor</p>
                    </div>
                  )
              )}

              {/* Estadísticas */}
              {activeTab === 'estadisticas' && (
                data && typeof data === 'object'
                  ? <StatsView data={data} />
                  : !error && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                      <TrendingUp size={32} strokeWidth={1} className="mb-3 opacity-40" />
                      <p className="text-[13px]">No hay estadísticas disponibles</p>
                    </div>
                  )
              )}

              {/* Análisis */}
              {canViewAnalisis && activeTab === 'analisis' && <AnalisisEmprestitoTab />}

              {/* Gestionar registros */}
              {activeTab === 'gestionar-registros' && <GestionRegistrosEmprestitoTab />}

              {/* Avances */}
              {activeTab === 'avances' && <AvancesEmprestitoTab />}

              {/* Solicitudes pendientes */}
              {canViewSolicitudesTabs && activeTab === 'solicitudes-pendientes' && (
                <SolicitudesPendientesEmprestitoTab onRefresh={handleRefreshFromTab} />
              )}

              {/* Historial solicitudes */}
              {canViewSolicitudesTabs && activeTab === 'historial-solicitudes' && (
                <HistorialSolicitudesEmprestitoTab />
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default GestionEmprestito
