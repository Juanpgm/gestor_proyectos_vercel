/**
 * Generador de Reporte PDF — Estado de Reportes Empréstito por Centro Gestor
 *
 * Muestra:
 *  - Resumen general (total contratos, centros con/sin reporte, completitud)
 *  - Tabla centros CON reportes (contratos reportados/total, avance, alertas)
 *  - Tabla centros SIN reportes (resaltados en rojo)
 *  - Detalle de contratos por centro gestor (reportados vs no reportados)
 */
import type { CentroGestorResumen } from '@/hooks/useReportesCentroGestor'
import {
  crearDocPdf,
  dibujarHeader,
  dibujarTarjetasResumen,
  dibujarTituloSeccion,
  dibujarFooters,
  descargarPdf,
  formatFechaPdf,
  formatPorcentaje,
  diasDesde,
  getColorSemaforo,
  PDF_COLORS,
  verificarPagina,
} from './pdfReportGenerator'

// ── Tipos ────────────────────────────────────────────
/** Contrato con campos mínimos para el reporte */
interface ContratoReporte {
  nombre_centro_gestor?: string
  referencia_del_contrato?: string
  id_contrato?: string
  estado_contrato?: string
  valor_del_contrato?: number
  proveedor_adjudicado?: string
  [key: string]: any
}

export interface ReporteEmprestitoOptions {
  resumenPorCentroGestor: CentroGestorResumen[]
  centrosConReportes: string[]
  centrosSinReportes: string[]
  totalReportes: number
  /** Todos los contratos de empréstito (para detalle por centro gestor) */
  contratos?: ContratoReporte[]
}

// ── Helpers internos ─────────────────────────────────
function normalizeCG(cg: string): string {
  return (cg || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatMoneda(valor: number): string {
  if (!valor && valor !== 0) return '$0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

// ── Función principal ────────────────────────────────
export async function generarReporteEmprestitoPorCentroGestor(
  opts: ReporteEmprestitoOptions,
): Promise<void> {
  const {
    resumenPorCentroGestor,
    centrosConReportes,
    centrosSinReportes,
    totalReportes,
    contratos = [],
  } = opts

  const doc = await crearDocPdf()
  const titulo = 'Reporte de Estado — Empréstito'

  // --- Header ---
  let y = dibujarHeader(doc, titulo, 'Municipio de Santiago de Cali')

  // --- Métricas globales ---
  const totalCentros = centrosConReportes.length + centrosSinReportes.length
  const totalContratos = contratos.length
  const pctCentrosReporte = totalCentros > 0 ? (centrosConReportes.length / totalCentros) * 100 : 0

  // Calcular contratos únicos reportados (entre todos los centros)
  const contratosReportadosSet = new Set<string>()
  for (const c of resumenPorCentroGestor) {
    for (const ref of c.contratos_reportados) {
      contratosReportadosSet.add(ref)
    }
  }
  const totalContratosReportados = contratosReportadosSet.size
  const pctContratosReportados = totalContratos > 0 ? (totalContratosReportados / totalContratos) * 100 : 0

  // Centros con alertas
  const centrosConAlertas = resumenPorCentroGestor.filter(c => c.tiene_alertas).length

  y = dibujarTarjetasResumen(doc, [
    { label: 'Total Centros Gestores', valor: String(totalCentros), color: PDF_COLORS.primary },
    { label: 'Centros con Reporte', valor: `${centrosConReportes.length} / ${totalCentros}`, color: PDF_COLORS.success },
    { label: 'Centros sin Reporte', valor: String(centrosSinReportes.length), color: centrosSinReportes.length > 0 ? PDF_COLORS.danger : PDF_COLORS.success },
    { label: 'Contratos Reportados', valor: `${totalContratosReportados} / ${totalContratos}`, color: getColorSemaforo(pctContratosReportados) },
    { label: 'Total Reportes', valor: String(totalReportes), color: PDF_COLORS.primaryLight },
    { label: 'Con Alertas', valor: String(centrosConAlertas), color: centrosConAlertas > 0 ? PDF_COLORS.warning : PDF_COLORS.success },
  ], y)

  // ═══════════════════════════════════════════════════════
  // Sección 1: Centros gestores CON reportes
  // ═══════════════════════════════════════════════════════
  y = dibujarTituloSeccion(
    doc,
    `✅ Centros Gestores con Reportes (${centrosConReportes.length})`,
    y,
    PDF_COLORS.success,
  )

  // Agrupar contratos por centro gestor para saber /total
  const contratosPorCG = new Map<string, ContratoReporte[]>()
  for (const c of contratos) {
    const cg = normalizeCG(c.nombre_centro_gestor || '')
    if (!contratosPorCG.has(cg)) contratosPorCG.set(cg, [])
    contratosPorCG.get(cg)!.push(c)
  }

  // Función para encontrar contratos de un centro gestor (case-insensitive)
  function getContratosCG(nombreCentro: string): ContratoReporte[] {
    const key = normalizeCG(nombreCentro)
    for (const [k, v] of contratosPorCG) {
      if (k === key) return v
    }
    return []
  }

  const resumenSorted = [...resumenPorCentroGestor].sort((a, b) => {
    const totalA = getContratosCG(a.nombre_centro_gestor).length
    const totalB = getContratosCG(b.nombre_centro_gestor).length
    const pctA = totalA > 0 ? a.contratos_reportados.length / totalA : 0
    const pctB = totalB > 0 ? b.contratos_reportados.length / totalB : 0
    return pctA - pctB // menor avance primero
  })

  const conReportesRows = resumenSorted.map(c => {
    const contratosCG = getContratosCG(c.nombre_centro_gestor)
    const totalCG = contratosCG.length
    const reportadosCG = c.contratos_reportados.length
    const dias = diasDesde(c.ultimo_reporte)
    const diasStr = dias !== null ? `${dias} días` : '—'

    return [
      c.nombre_centro_gestor,
      `${reportadosCG} / ${totalCG || '?'}`,
      String(c.total_reportes),
      formatPorcentaje(c.ultimo_avance_fisico),
      formatPorcentaje(c.ultimo_avance_financiero),
      `${c.reportes_ultimos_10_dias}`,
      formatFechaPdf(c.ultimo_reporte),
      diasStr,
      c.tiene_alertas ? '⚠ Sí' : '✓ No',
    ]
  })

  ;(doc as any).autoTable({
    startY: y,
    head: [[
      'Centro Gestor',
      'Contratos\n(rep./total)',
      'Total\nReportes',
      'Avance\nFísico %',
      'Avance\nFinanc. %',
      'Últimos\n10 días',
      'Último\nReporte',
      'Días sin\nReportar',
      'Alertas',
    ]],
    body: conReportesRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: PDF_COLORS.black,
    },
    headStyles: {
      fillColor: PDF_COLORS.success,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 28, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body') {
        const rowIdx = data.row.index
        const centro = resumenSorted[rowIdx]
        if (!centro) return

        if (data.column.index === 8) {
          data.cell.styles.textColor = centro.tiene_alertas ? PDF_COLORS.danger : PDF_COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }

        // Color avance físico
        if (data.column.index === 3) {
          data.cell.styles.textColor = getColorSemaforo(centro.ultimo_avance_fisico)
          data.cell.styles.fontStyle = 'bold'
        }

        // Fila alterna
        if (rowIdx % 2 === 0) data.cell.styles.fillColor = [248, 250, 252]
      }
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ═══════════════════════════════════════════════════════
  // Sección 2: Centros gestores SIN reportes
  // ═══════════════════════════════════════════════════════
  if (centrosSinReportes.length > 0) {
    y = verificarPagina(doc, y, 40)

    y = dibujarTituloSeccion(
      doc,
      `🔴 Centros Gestores SIN Reportes (${centrosSinReportes.length})`,
      y,
      PDF_COLORS.danger,
    )

    const sinReportesRows = centrosSinReportes.sort((a, b) => a.localeCompare(b, 'es')).map((cg) => {
      const contratosCG = getContratosCG(cg)
      return [
        cg,
        String(contratosCG.length || '—'),
        'Sin reportes',
        '—',
        '—',
      ]
    })

    ;(doc as any).autoTable({
      startY: y,
      head: [['Centro Gestor', 'Contratos Asignados', 'Estado', 'Último Reporte', 'Avance']],
      body: sinReportesRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [153, 27, 27],
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 70, halign: 'left' },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          data.cell.styles.fillColor = data.row.index % 2 === 0 ? [254, 242, 242] : PDF_COLORS.white
          if (data.column.index === 2) {
            data.cell.styles.textColor = PDF_COLORS.danger
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ═══════════════════════════════════════════════════════
  // Sección 3: Detalle de contratos por centro gestor
  // ═══════════════════════════════════════════════════════
  if (contratos.length > 0) {
    doc.addPage()
    y = 15

    y = dibujarTituloSeccion(
      doc,
      `📋 Detalle de Contratos por Centro Gestor (${totalContratosReportados} reportados / ${totalContratos} total)`,
      y,
      PDF_COLORS.primary,
    )

    // Agrupar contratos por centro gestor (usando nombre original)
    const contratosPorCGOriginal = new Map<string, ContratoReporte[]>()
    for (const c of contratos) {
      const cg = (c.nombre_centro_gestor || 'Sin centro gestor').trim()
      if (!contratosPorCGOriginal.has(cg)) contratosPorCGOriginal.set(cg, [])
      contratosPorCGOriginal.get(cg)!.push(c)
    }

    const centrosSorted = Array.from(contratosPorCGOriginal.entries()).sort(
      ([a], [b]) => a.localeCompare(b, 'es'),
    )

    for (const [nombreCG, contratosCG] of centrosSorted) {
      y = verificarPagina(doc, y, 20)

      // Determinar qué contratos están reportados
      const resumenCG = resumenPorCentroGestor.find(
        r => normalizeCG(r.nombre_centro_gestor) === normalizeCG(nombreCG),
      )
      const reportadosSet = new Set(
        (resumenCG?.contratos_reportados || []).map(r => r.toLowerCase().trim()),
      )

      const reportados = contratosCG.filter(c =>
        reportadosSet.has((c.referencia_del_contrato || '').toLowerCase().trim()),
      )
      const noReportados = contratosCG.filter(c =>
        !reportadosSet.has((c.referencia_del_contrato || '').toLowerCase().trim()),
      )

      // Mini-header del centro gestor
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      const pctCG = contratosCG.length > 0 ? (reportados.length / contratosCG.length) * 100 : 0
      const colorCG = getColorSemaforo(pctCG)
      doc.setTextColor(...colorCG)
      doc.text(
        `${nombreCG}  —  ${reportados.length}/${contratosCG.length} reportados (${formatPorcentaje(pctCG)})`,
        14,
        y,
      )
      y += 4

      const detalleRows = contratosCG
        .sort((a, b) => {
          const aRep = reportadosSet.has((a.referencia_del_contrato || '').toLowerCase().trim())
          const bRep = reportadosSet.has((b.referencia_del_contrato || '').toLowerCase().trim())
          if (aRep === bRep) return 0
          return aRep ? 1 : -1 // No reportados primero
        })
        .map(c => {
          const ref = c.referencia_del_contrato || c.id_contrato || '—'
          const esReportado = reportadosSet.has(ref.toLowerCase().trim())
          return [
            ref,
            c.estado_contrato || '—',
            formatMoneda(c.valor_del_contrato || 0),
            c.proveedor_adjudicado || '—',
            esReportado ? '✓ Sí' : '✗ No',
          ]
        })

      ;(doc as any).autoTable({
        startY: y,
        head: [['Ref. Contrato', 'Estado', 'Valor', 'Proveedor', 'Reportado']],
        body: detalleRows,
        theme: 'grid',
        styles: {
          fontSize: 6.5,
          cellPadding: 1.5,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          textColor: PDF_COLORS.black,
        },
        headStyles: {
          fillColor: PDF_COLORS.primaryLight,
          textColor: PDF_COLORS.white,
          fontStyle: 'bold',
          fontSize: 6.5,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 60 },
          4: { cellWidth: 22, halign: 'center' },
        },
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const row = detalleRows[data.row.index]
            if (!row) return
            const esReportado = row[4] === '✓ Sí'
            if (data.column.index === 4) {
              data.cell.styles.textColor = esReportado ? PDF_COLORS.success : PDF_COLORS.danger
              data.cell.styles.fontStyle = 'bold'
            }
            if (!esReportado) {
              data.cell.styles.fillColor = [254, 249, 242]
            } else if (data.row.index % 2 === 0) {
              data.cell.styles.fillColor = [248, 250, 252]
            }
          }
        },
        margin: { left: 14, right: 14 },
      })

      y = (doc as any).lastAutoTable.finalY + 6
    }
  }

  // --- Footers ---
  dibujarFooters(doc, titulo)

  // --- Descargar ---
  const fechaArchivo = new Date().toISOString().slice(0, 10)
  descargarPdf(doc, `reporte_emprestito_centros_gestores_${fechaArchivo}.pdf`)
}
