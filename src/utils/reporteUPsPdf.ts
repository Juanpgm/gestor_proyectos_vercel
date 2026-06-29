/**
 * Reporte PDF — Avances de Unidades de Proyecto por Organismo / Centro Gestor
 * v2 — Estructurado en 5 secciones con indicadores de calidad
 *
 * Secciones:
 *   Resumen ejecutivo  — KPIs globales
 *   1.1 UP's por Organismo — actualizacion (exc. Terminado), mas reciente primero
 *   2.  Semaforo de Calidad por Centro Gestor
 *   3.  Detalle completo por Centro Gestor (menor a mayor avance)
 *   4.  Centros Gestores con Alertas Activas
 *   5.  Centros Gestores sin Ningun Avance Reportado
 *
 * UTF-8 / Español: se usan solo caracteres Latin-1 — sin emoji en el documento PDF.
 */
import type { CentroGestorAvancesResumen } from "@/hooks/useAvancesCentroGestor";
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
  verificarPagina,
  PDF_COLORS,
} from "./pdfReportGenerator";

// ── Tipos ──────────────────────────────────────────────────
export interface ReporteUPsOptions {
  resumenPorCentroGestor: CentroGestorAvancesResumen[];
  totalIntervenciones: number;
  totalAvances: number;
}

type NivelCalidad = "Alto" | "Medio" | "Bajo";

interface CalidadCentro {
  nivel: NivelCalidad;
  color: [number, number, number];
  /** % de UPs activas que han reportado avance */
  tasaReporte: number;
  /** Dias transcurridos desde el ultimo avance, null si nunca reporto */
  diasSinActualizar: number | null;
}

// ── Helper: calcular nivel de calidad de un centro gestor ─
function calcularCalidad(c: CentroGestorAvancesResumen): CalidadCentro {
  const activas = c.total_intervenciones - c.intervenciones_completadas;
  const tasaReporte =
    activas > 0 ? (c.intervenciones_con_avance / activas) * 100 : 100;
  const diasSinActualizar = c.ultimo_avance
    ? Math.floor(
        (Date.now() - new Date(c.ultimo_avance).getTime()) / 86_400_000,
      )
    : null;

  let nivel: NivelCalidad;
  let color: [number, number, number];

  if (
    tasaReporte >= 80 &&
    (diasSinActualizar === null || diasSinActualizar <= 10)
  ) {
    nivel = "Alto";
    color = PDF_COLORS.success;
  } else if (
    tasaReporte >= 40 ||
    (diasSinActualizar !== null && diasSinActualizar <= 30)
  ) {
    nivel = "Medio";
    color = PDF_COLORS.warning;
  } else {
    nivel = "Bajo";
    color = PDF_COLORS.danger;
  }

  return { nivel, color, tasaReporte, diasSinActualizar };
}

// ── Función principal ──────────────────────────────────────
export async function generarReporteUPsPorCentroGestor(
  opts: ReporteUPsOptions,
): Promise<void> {
  const { resumenPorCentroGestor, totalIntervenciones, totalAvances } = opts;
  const doc = await crearDocPdf();
  const titulo = "Reporte de Avances — Unidades de Proyecto por Organismo";

  // ═══════════════════════════════════════════════════════
  // ENCABEZADO
  // ═══════════════════════════════════════════════════════
  let y = dibujarHeader(doc, titulo, "Municipio de Santiago de Cali");

  // ═══════════════════════════════════════════════════════
  // RESUMEN EJECUTIVO — KPIs globales
  // ═══════════════════════════════════════════════════════
  const totalOrganismos = resumenPorCentroGestor.length;
  const totalConAvance = resumenPorCentroGestor.reduce(
    (s, c) => s + c.intervenciones_con_avance,
    0,
  );
  const totalSinAvance = resumenPorCentroGestor.reduce(
    (s, c) => s + c.intervenciones_sin_avance,
    0,
  );
  const totalCompletadas = resumenPorCentroGestor.reduce(
    (s, c) => s + c.intervenciones_completadas,
    0,
  );
  const totalActivas = totalIntervenciones - totalCompletadas;
  const pctReportado =
    totalActivas > 0 ? (totalConAvance / totalActivas) * 100 : 0;
  const promedioGeneral =
    totalIntervenciones > 0
      ? resumenPorCentroGestor.reduce(
          (s, c) => s + c.avance_obra_promedio * c.total_intervenciones,
          0,
        ) / totalIntervenciones
      : 0;

  y = dibujarTarjetasResumen(
    doc,
    [
      {
        label: "Organismos",
        valor: String(totalOrganismos),
        color: PDF_COLORS.primary,
      },
      {
        label: "UPs Activas",
        valor: String(totalActivas),
        color: PDF_COLORS.primaryLight,
      },
      {
        label: "Han Actualizado",
        valor: `${totalConAvance} / ${totalActivas}`,
        color: PDF_COLORS.success,
      },
      {
        label: "Sin Reporte",
        valor: String(totalSinAvance),
        color: totalSinAvance > 0 ? PDF_COLORS.danger : PDF_COLORS.success,
      },
      {
        label: "Terminadas",
        valor: String(totalCompletadas),
        color: PDF_COLORS.gray,
      },
      {
        label: "% Actualizacion",
        valor: formatPorcentaje(pctReportado),
        color: getColorSemaforo(pctReportado),
      },
    ],
    y,
  );

  // ═══════════════════════════════════════════════════════
  // SECCION 1.1 — UP's por Organismo
  // Excluye estado Terminado
  // Ordenado: mas reciente primero (por ultimo_avance)
  // ═══════════════════════════════════════════════════════
  y = verificarPagina(doc, y, 50);
  y = dibujarTituloSeccion(
    doc,
    "1.1  UP's por Organismo — Actualizacion (excluye Terminado)",
    y,
  );

  // Filtrar centros con al menos 1 UP activa, ordenar mas reciente primero
  const datosSec11 = [...resumenPorCentroGestor]
    .filter((c) => c.total_intervenciones - c.intervenciones_completadas > 0)
    .sort((a, b) => {
      const fa = a.ultimo_avance ? new Date(a.ultimo_avance).getTime() : 0;
      const fb = b.ultimo_avance ? new Date(b.ultimo_avance).getTime() : 0;
      return fb - fa; // mas reciente primero
    });

  const rows11 = datosSec11.map((c) => {
    const upsSinTerminar = c.intervenciones.filter(
      (i) => i.estado !== "Terminado",
    );
    const hanActualizado = upsSinTerminar.filter((i) => i.tiene_avances).length;
    const pct =
      upsSinTerminar.length > 0
        ? (hanActualizado / upsSinTerminar.length) * 100
        : 0;
    const dias = c.ultimo_avance
      ? Math.floor(
          (Date.now() - new Date(c.ultimo_avance).getTime()) / 86_400_000,
        )
      : null;

    return [
      c.nombre_centro_gestor,
      String(upsSinTerminar.length),
      `${hanActualizado} / ${upsSinTerminar.length}`,
      formatPorcentaje(pct),
      formatFechaPdf(c.ultimo_avance),
      dias !== null ? `${dias} dias` : "Sin reporte",
    ];
  });

  (doc as any).autoTable({
    startY: y,
    head: [
      [
        "Organismo / Centro Gestor",
        "UPs Activas\n(exc. Terminado)",
        "Han Actualizado\n(avance / total)",
        "% Actualiz.",
        "Ultimo Reporte",
        "Dias sin\nActualizar",
      ],
    ],
    body: rows11,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: PDF_COLORS.black,
    },
    headStyles: {
      fillColor: [5, 150, 105] as [number, number, number], // emerald-600 — color Unidades UP
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 68, halign: "left" },
      1: { cellWidth: 28, halign: "center" },
      2: { cellWidth: 38, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 36, halign: "center" },
      5: { cellWidth: 28, halign: "center" },
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      const centro = datosSec11[data.row.index];
      if (!centro) return;

      // % Actualizacion con semaforo
      if (data.column.index === 3) {
        const ups = centro.intervenciones.filter(
          (i) => i.estado !== "Terminado",
        );
        const act = ups.filter((i) => i.tiene_avances).length;
        const p = ups.length > 0 ? (act / ups.length) * 100 : 0;
        data.cell.styles.textColor = getColorSemaforo(p);
        data.cell.styles.fontStyle = "bold";
      }

      // Dias sin actualizar — alerta si > 15 dias o sin reporte
      if (data.column.index === 5) {
        const dias = centro.ultimo_avance
          ? Math.floor(
              (Date.now() - new Date(centro.ultimo_avance).getTime()) /
                86_400_000,
            )
          : null;
        if (dias === null || dias > 15) {
          data.cell.styles.textColor = PDF_COLORS.danger;
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Fondo alternado verde muy claro
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [236, 253, 245];
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════
  // SECCION 2 — Semaforo de Calidad por Centro Gestor
  // ═══════════════════════════════════════════════════════
  y = verificarPagina(doc, y, 70);
  y = dibujarTituloSeccion(doc, "2.  Semaforo de Calidad por Centro Gestor", y);

  const calidades = resumenPorCentroGestor.map((c) => ({
    centro: c,
    calidad: calcularCalidad(c),
  }));

  const altos = calidades.filter((x) => x.calidad.nivel === "Alto");
  const medios = calidades.filter((x) => x.calidad.nivel === "Medio");
  const bajos = calidades.filter((x) => x.calidad.nivel === "Bajo");

  // Mini tarjetas de resumen de calidad
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardW = 62;
  const cardH = 18;
  const gap = 10;
  const startX = (pageWidth - (3 * cardW + 2 * gap)) / 2;

  const niveles: Array<{
    label: string;
    count: number;
    sub: string;
    color: [number, number, number];
  }> = [
    {
      label: String(altos.length),
      sub: "Calidad Alta  (>= 80%)",
      color: PDF_COLORS.success,
      count: altos.length,
    },
    {
      label: String(medios.length),
      sub: "Calidad Media (40–79%)",
      color: PDF_COLORS.warning,
      count: medios.length,
    },
    {
      label: String(bajos.length),
      sub: "Calidad Baja  (< 40%)",
      color: PDF_COLORS.danger,
      count: bajos.length,
    },
  ];
  niveles.forEach((n, i) => {
    const x = startX + i * (cardW + gap);
    doc.setFillColor(...n.color);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(n.label, x + cardW / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(n.sub, x + cardW / 2, y + 14, { align: "center" });
  });
  y += cardH + 6;

  // Tabla de calidad — ordenada de Bajo a Alto
  const ORDER_CALIDAD: Record<NivelCalidad, number> = {
    Bajo: 0,
    Medio: 1,
    Alto: 2,
  };
  const calidadesOrdenadas = [...calidades].sort(
    (a, b) => ORDER_CALIDAD[a.calidad.nivel] - ORDER_CALIDAD[b.calidad.nivel],
  );

  const qualityRows = calidadesOrdenadas.map(({ centro: c, calidad }) => [
    c.nombre_centro_gestor,
    calidad.nivel,
    formatPorcentaje(calidad.tasaReporte),
    String(c.intervenciones_con_avance),
    String(c.intervenciones_sin_avance),
    String(c.intervenciones_completadas),
    String(c.avances_ultimos_10_dias),
    calidad.diasSinActualizar !== null
      ? `${calidad.diasSinActualizar} dias`
      : "Sin reporte",
    formatFechaPdf(c.ultimo_avance),
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [
      [
        "Centro Gestor",
        "Nivel\nCalidad",
        "% Reporte",
        "Con\nAvance",
        "Sin\nAvance",
        "Termi-\nnadas",
        "Ult. 10\ndias",
        "Dias sin\nActualizar",
        "Ultimo\nReporte",
      ],
    ],
    body: qualityRows,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
      textColor: PDF_COLORS.black,
    },
    headStyles: {
      fillColor: PDF_COLORS.grayDark,
      textColor: PDF_COLORS.white,
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 60, halign: "left" },
      1: { cellWidth: 20, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 18, halign: "center" },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 26, halign: "center" },
      8: { cellWidth: 32, halign: "center" },
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      const item = calidadesOrdenadas[data.row.index];
      if (!item) return;
      const { calidad } = item;

      // Nivel con fondo de color
      if (data.column.index === 1) {
        data.cell.styles.fillColor = calidad.color;
        data.cell.styles.textColor = PDF_COLORS.white;
        data.cell.styles.fontStyle = "bold";
        return;
      }

      // % Reporte con semaforo
      if (data.column.index === 2) {
        data.cell.styles.textColor = calidad.color;
        data.cell.styles.fontStyle = "bold";
      }

      // Sin avance en rojo si > 0
      if (
        data.column.index === 4 &&
        item.centro.intervenciones_sin_avance > 0
      ) {
        data.cell.styles.textColor = PDF_COLORS.danger;
      }

      // Dias sin actualizar — resaltar si > 15 o sin reporte
      if (
        data.column.index === 7 &&
        (calidad.diasSinActualizar === null || calidad.diasSinActualizar > 15)
      ) {
        data.cell.styles.textColor = PDF_COLORS.danger;
      }

      // Fondo alternado: rojo suave para Bajo, gris suave para resto
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor =
          calidad.nivel === "Bajo" ? [254, 242, 242] : [248, 250, 252];
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════
  // SECCION 3 — Detalle completo por Centro Gestor
  // Ordenado de menor a mayor avance de obra
  // ═══════════════════════════════════════════════════════
  y = verificarPagina(doc, y, 60);
  y = dibujarTituloSeccion(
    doc,
    "3.  Detalle Completo por Centro Gestor  (menor a mayor avance de obra)",
    y,
  );

  const datosSorted = [...resumenPorCentroGestor].sort(
    (a, b) => a.avance_obra_promedio - b.avance_obra_promedio,
  );

  const bodyRows = datosSorted.map((c) => [
    c.nombre_centro_gestor,
    String(c.total_intervenciones),
    `${c.intervenciones_con_avance} / ${c.total_intervenciones}`,
    String(c.intervenciones_sin_avance),
    String(c.intervenciones_completadas),
    formatPorcentaje(c.avance_obra_promedio),
    String(c.total_avances),
    String(c.avances_ultimos_10_dias),
    formatFechaPdf(c.ultimo_avance),
    c.tiene_alertas ? "SI" : "No",
  ]);

  (doc as any).autoTable({
    startY: y,
    head: [
      [
        "Centro Gestor",
        "Total\nInt.",
        "Avance\n(report./total)",
        "Sin\nAvance",
        "Termi-\nnadas",
        "Avance\nObra %",
        "Total\nReportes",
        "Ult.\n10 dias",
        "Ultimo\nReporte",
        "Alerta",
      ],
    ],
    body: bodyRows,
    theme: "grid",
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
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 55, halign: "left" },
      1: { cellWidth: 14, halign: "center" },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 20, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
      7: { cellWidth: 16, halign: "center" },
      8: { cellWidth: 29, halign: "center" },
      9: { cellWidth: 18, halign: "center" },
    },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      const centro = datosSorted[data.row.index];
      if (!centro) return;

      if (data.column.index === 9) {
        data.cell.styles.textColor = centro.tiene_alertas
          ? PDF_COLORS.danger
          : PDF_COLORS.success;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 5) {
        data.cell.styles.textColor = getColorSemaforo(
          centro.avance_obra_promedio,
        );
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === 3 && centro.intervenciones_sin_avance > 0) {
        data.cell.styles.textColor = PDF_COLORS.danger;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [248, 250, 252];
      }
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ═══════════════════════════════════════════════════════
  // SECCION 4 — Centros Gestores con Alertas Activas
  // ═══════════════════════════════════════════════════════
  const centrosConAlertas = datosSorted.filter((c) => c.tiene_alertas);
  if (centrosConAlertas.length > 0) {
    y = verificarPagina(doc, y, 40);
    y = dibujarTituloSeccion(
      doc,
      `4.  Centros Gestores con Alertas Activas  (${centrosConAlertas.length} organismos)`,
      y,
      PDF_COLORS.danger,
    );

    const alertRows = centrosConAlertas.map((c) => {
      const pendientes = c.intervenciones.filter(
        (i) => !i.tiene_avances && !i.esta_completada,
      );
      const muestra =
        pendientes
          .slice(0, 3)
          .map((i) => `${i.upid} (${i.tipo_intervencion})`)
          .join(", ") +
        (pendientes.length > 3 ? ` +${pendientes.length - 3} mas` : "");
      return [
        c.nombre_centro_gestor,
        String(pendientes.length),
        muestra,
        formatFechaPdf(c.ultimo_avance),
      ];
    });

    (doc as any).autoTable({
      startY: y,
      head: [
        [
          "Centro Gestor",
          "UPs Pendientes",
          "Muestra de UPs sin avance",
          "Ultimo Reporte",
        ],
      ],
      body: alertRows,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: PDF_COLORS.black,
      },
      headStyles: {
        fillColor: PDF_COLORS.danger,
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 55, halign: "left" },
        1: { cellWidth: 26, halign: "center" },
        2: { cellWidth: 128, halign: "left" },
        3: { cellWidth: 33, halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          if (data.row.index % 2 === 0)
            data.cell.styles.fillColor = [254, 242, 242];
          if (data.column.index === 1) {
            data.cell.styles.textColor = PDF_COLORS.danger;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ═══════════════════════════════════════════════════════
  // SECCION 5 — Centros sin Ningun Avance Reportado
  // ═══════════════════════════════════════════════════════
  const centrosSinNingunAvance = datosSorted.filter(
    (c) => c.intervenciones_con_avance === 0,
  );
  if (centrosSinNingunAvance.length > 0) {
    y = verificarPagina(doc, y, 30);
    y = dibujarTituloSeccion(
      doc,
      `5.  Centros Gestores sin Ningun Avance Reportado  (${centrosSinNingunAvance.length} organismos)`,
      y,
      [153, 27, 27] as [number, number, number],
    );

    const sinRows = centrosSinNingunAvance.map((c) => [
      c.nombre_centro_gestor,
      String(c.total_intervenciones),
      String(c.intervenciones_completadas),
      String(c.intervenciones_sin_avance),
    ]);

    (doc as any).autoTable({
      startY: y,
      head: [
        [
          "Centro Gestor",
          "Total Intervenciones",
          "Terminadas",
          "Pendientes sin Avance",
        ],
      ],
      body: sinRows,
      theme: "grid",
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: PDF_COLORS.black,
      },
      headStyles: {
        fillColor: [153, 27, 27] as [number, number, number],
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 80, halign: "left" },
        1: { cellWidth: 40, halign: "center" },
        2: { cellWidth: 40, halign: "center" },
        3: { cellWidth: 50, halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          data.cell.styles.fillColor =
            data.row.index % 2 === 0 ? [254, 242, 242] : PDF_COLORS.white;
          if (data.column.index === 3) {
            data.cell.styles.textColor = PDF_COLORS.danger;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  }

  // ═══════════════════════════════════════════════════════
  // PIE DE PAGINA (todas las paginas)
  // ═══════════════════════════════════════════════════════
  dibujarFooters(doc, titulo);

  // ═══════════════════════════════════════════════════════
  // DESCARGAR
  // ═══════════════════════════════════════════════════════
  const fechaArchivo = new Date().toISOString().slice(0, 10);
  descargarPdf(doc, `reporte_ups_organismos_${fechaArchivo}.pdf`);
}
