/**
 * Generador de Reporte PDF — Avances de Unidades de Proyecto por Centro Gestor
 *
 * Muestra:
 *  - Resumen general (total UPs, intervenciones, avance promedio)
 *  - Tabla por centro gestor: avance/total, semáforo
 *  - Sección de alertas (centros con intervenciones sin reportar)
 */
import type { CentroGestorAvancesResumen } from '@/hooks/useAvancesCentroGestor'
import {
  crearDocPdf,
  dibujarHeader,
  dibujarTarjetasResumen,
  dibujarTituloSeccion,
  dibujarFooters,
  descargarPdf,
  formatFechaPdf,
  formatPorcentaje,
  getColorSemaforo,
  getTextoSemaforo,
  PDF_COLORS,
} from './pdfReportGenerator'

// ── Tipo de opciones ─────────────────────────────────
export interface ReporteUPsOptions {
  resumenPorCentroGestor: CentroGestorAvancesResumen[]
  totalIntervenciones: number
  totalAvances: number
}

// ── Función principal ────────────────────────────────
export async function generarReporteUPsPorCentroGestor(
  opts: ReporteUPsOptions,
): Promise<void> {
  const { resumenPorCentroGestor, totalIntervenciones, totalAvances } = opts
  const doc = await crearDocPdf()
  const titulo = 'Reporte de Avances — Unidades de Proyecto'

  // --- Header ---
  let y = dibujarHeader(doc, titulo, 'Municipio de Santiago de Cali')

  // --- Métricas globales ---
  const totalCentros = resumenPorCentroGestor.length
  const totalConAvance = resumenPorCentroGestor.reduce((s, c) => s + c.intervenciones_con_avance, 0)
  const totalSinAvance = resumenPorCentroGestor.reduce((s, c) => s + c.intervenciones_sin_avance, 0)
  const totalCompletadas = resumenPorCentroGestor.reduce((s, c) => s + c.intervenciones_completadas, 0)
  const promedioGeneral =
    totalIntervenciones > 0
      ? resumenPorCentroGestor.reduce((s, c) => s + c.avance_obra_promedio * c.total_intervenciones, 0) / totalIntervenciones
      : 0
  const pctReportado = totalIntervenciones > 0 ? (totalConAvance / totalIntervenciones) * 100 : 0

  y = dibujarTarjetasResumen(doc, [
    { label: 'Centros Gestores', valor: String(totalCentros), color: PDF_COLORS.primary },
    { label: 'Total Intervenciones', valor: String(totalIntervenciones), color: PDF_COLORS.primaryLight },
    { label: 'Con Avance Reportado', valor: `${totalConAvance} / ${totalIntervenciones}`, color: PDF_COLORS.success },
    { label: 'Sin Avance', valor: String(totalSinAvance), color: totalSinAvance > 0 ? PDF_COLORS.danger : PDF_COLORS.success },
    { label: 'Completadas', valor: String(totalCompletadas), color: PDF_COLORS.success },
    { label: 'Avance Promedio', valor: formatPorcentaje(promedioGeneral), color: getColorSemaforo(pctReportado) },
  ], y)

  // --- Tabla principal: por centro gestor ordenada por menor avance ---
  y = dibujarTituloSeccion(doc, 'Detalle por Centro Gestor (ordenado de menor a mayor avance)', y)

  const datosSorted = [...resumenPorCentroGestor].sort(
    (a, b) => a.avance_obra_promedio - b.avance_obra_promedio,
  )

  const bodyRows = datosSorted.map((c) => {
    const pctAvance = c.total_intervenciones > 0
      ? (c.intervenciones_con_avance / c.total_intervenciones) * 100
      : 0
    return [
      c.nombre_centro_gestor,
      String(c.total_intervenciones),
      `${c.intervenciones_con_avance} / ${c.total_intervenciones}`,
      String(c.intervenciones_sin_avance),
      String(c.intervenciones_completadas),
      formatPorcentaje(c.avance_obra_promedio),
      String(c.total_avances),
      `${c.avances_ultimos_10_dias}`,
      formatFechaPdf(c.ultimo_avance),
      c.tiene_alertas ? '⚠ Sí' : '✓ No',
    ]
  })

  ;(doc as any).autoTable({
    startY: y,
    head: [[
      'Centro Gestor',
      'Total Int.',
      'Avance\n(reportadas/total)',
      'Sin\nAvance',
      'Comple-\ntadas',
      'Avance\nObra %',
      'Total\nReportes',
      'Últimos\n10 días',
      'Último\nReporte',
      'Alertas',
    ]],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: PDF_COLORS.black,
    },
    headStyles: {
      fillColor: PDF_COLORS.primary,
      textColor: PDF_COLORS.white,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 28, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data: any) => {
      // Color de fondo para filas con alertas
      if (data.section === 'body') {
        const rowIdx = data.row.index
        const centro = datosSorted[rowIdx]
        if (!centro) return

        // Columna "Alertas" en rojo/verde
        if (data.column.index === 9) {
          data.cell.styles.textColor = centro.tiene_alertas ? PDF_COLORS.danger : PDF_COLORS.success
          data.cell.styles.fontStyle = 'bold'
        }

        // Columna "Avance Obra %" con color semáforo
        if (data.column.index === 5) {
          data.cell.styles.textColor = getColorSemaforo(centro.avance_obra_promedio)
          data.cell.styles.fontStyle = 'bold'
        }

        // Columna "Sin Avance" resaltar si tiene valores
        if (data.column.index === 3 && centro.intervenciones_sin_avance > 0) {
          data.cell.styles.textColor = PDF_COLORS.danger
          data.cell.styles.fontStyle = 'bold'
        }

        // Fila alterna
        if (rowIdx % 2 === 0) {
          data.cell.styles.fillColor = [248, 250, 252]
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // --- Sección de alertas ---
  const centrosConAlertas = datosSorted.filter(c => c.tiene_alertas)
  if (centrosConAlertas.length > 0) {
    // Verificar si necesita nueva página
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + 40 > pageHeight - 15) {
      doc.addPage()
      y = 15
    }

    y = dibujarTituloSeccion(doc, `⚠ Centros Gestores con Alertas (${centrosConAlertas.length})`, y, PDF_COLORS.danger)

    const alertRows = centrosConAlertas.map(c => {
      const intSinAvance = c.intervenciones.filter(i => !i.tiene_avances && !i.esta_completada)
      return [
        c.nombre_centro_gestor,
        String(intSinAvance.length),
        intSinAvance.slice(0, 3).map(i => `${i.upid} (${i.tipo_intervencion})`).join(', ')
          + (intSinAvance.length > 3 ? ` +${intSinAvance.length - 3} más` : ''),
        formatFechaPdf(c.ultimo_avance),
      ]
    })

    ;(doc as any).autoTable({
      startY: y,
      head: [['Centro Gestor', 'Int. sin avance', 'Intervenciones pendientes (muestra)', 'Último Reporte']],
      body: alertRows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: PDF_COLORS.danger,
        textColor: PDF_COLORS.white,
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 130 },
        3: { cellWidth: 30, halign: 'center' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [254, 242, 242]
        }
      },
      margin: { left: 14, right: 14 },
    })

    y = (doc as any).lastAutoTable.finalY + 8
  }

  // --- Sección: centros sin ningún avance ---
  const centrosSinNingunAvance = datosSorted.filter(c => c.intervenciones_con_avance === 0)
  if (centrosSinNingunAvance.length > 0) {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + 30 > pageHeight - 15) {
      doc.addPage()
      y = 15
    }

    y = dibujarTituloSeccion(
      doc,
      `🔴 Centros Gestores sin ningún avance reportado (${centrosSinNingunAvance.length})`,
      y,
      PDF_COLORS.danger,
    )

    const sinRows = centrosSinNingunAvance.map(c => [
      c.nombre_centro_gestor,
      String(c.total_intervenciones),
      String(c.intervenciones_completadas),
      String(c.intervenciones_sin_avance),
    ])

    ;(doc as any).autoTable({
      startY: y,
      head: [['Centro Gestor', 'Total Intervenciones', 'Completadas', 'Pendientes sin Avance']],
      body: sinRows,
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
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          data.cell.styles.fillColor = data.row.index % 2 === 0 ? [254, 242, 242] : PDF_COLORS.white
        }
      },
      margin: { left: 14, right: 14 },
    })
  }

  // --- Footers ---
  dibujarFooters(doc, titulo)

  // --- Descargar ---
  const fechaArchivo = new Date().toISOString().slice(0, 10)
  descargarPdf(doc, `reporte_avances_ups_${fechaArchivo}.pdf`)
}
