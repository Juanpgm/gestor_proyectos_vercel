// Issue #14: descarga de la "ficha de contrato" del módulo Empréstito como PDF.
// Genera una hoja-resumen en texto (robusta, sin captura de DOM) con los datos
// principales del contrato y su último reporte de avance.

type AnyRecord = Record<string, unknown>;

const fmtMoneda = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === "") return "No disponible";
  const numero =
    typeof valor === "string" ? parseFloat(valor.replace(/[^0-9.-]/g, "")) : Number(valor);
  if (isNaN(numero)) return "No disponible";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(numero);
};

const fmtFecha = (fecha: unknown): string => {
  if (!fecha) return "No disponible";
  try {
    return new Date(String(fecha)).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(fecha);
  }
};

const val = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v).trim();
  return s.length > 0 ? s : "No disponible";
};

interface ReporteLike {
  fecha_reporte?: string;
  avance_fisico?: number;
  avance_financiero?: number;
  observaciones?: string;
}

const latestReporte = (reportes: ReporteLike[]): ReporteLike | null => {
  if (!Array.isArray(reportes) || reportes.length === 0) return null;
  return [...reportes].sort(
    (a, b) =>
      new Date(b.fecha_reporte || 0).getTime() - new Date(a.fecha_reporte || 0).getTime(),
  )[0];
};

/**
 * Genera y descarga la ficha del contrato como PDF.
 * `contrato` proviene de la colección contratos_emprestito (estructura flexible).
 */
export async function downloadContratoFichaPdf(
  contrato: AnyRecord,
  reportes: ReporteLike[] = [],
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  const contentWidth = pageWidth - marginX * 2;
  let y = 56;

  const ref = val(contrato.referencia_contrato);
  const nombre = val(
    contrato.nombre_resumido_proceso ||
      contrato.nombre_proceso ||
      contrato.objeto_contrato,
  );

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Ficha de Contrato — Empréstito", marginX, y);
  y += 18;
  doc.setFontSize(11);
  doc.setTextColor(90);
  doc.text(`Alcaldía de Santiago de Cali`, marginX, y);
  doc.setTextColor(0);
  y += 14;
  doc.setDrawColor(200);
  doc.line(marginX, y, marginX + contentWidth, y);
  y += 22;

  const row = (label: string, value: string) => {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 56;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentWidth - 150);
    doc.text(lines, marginX + 150, y);
    y += Math.max(16, lines.length * 13);
  };

  const rep = latestReporte(reportes);

  row("Referencia contrato:", ref);
  row("Referencia proceso:", val(contrato.referencia_proceso));
  row("Nombre / Objeto:", nombre);
  row("Centro gestor:", val(contrato.nombre_centro_gestor));
  row("Banco:", val(contrato.banco));
  row("Estado:", val(contrato.estado_contrato));
  row("Tipo de contrato:", val(contrato.tipo_contrato));
  row("Modalidad:", val(contrato.modalidad_contratacion));
  row("Valor del contrato:", fmtMoneda(contrato.valor_contrato));
  row("Valor pagado:", fmtMoneda(contrato.valor_pagado));
  row("Avance físico:", rep?.avance_fisico != null ? `${rep.avance_fisico}%` : "No disponible");
  row(
    "Avance financiero:",
    rep?.avance_financiero != null ? `${rep.avance_financiero}%` : "No disponible",
  );
  row("Fecha inicio:", fmtFecha(contrato.fecha_inicio_contrato));
  row("Fecha fin:", fmtFecha(contrato.fecha_fin_contrato));
  row("Ordenador del gasto:", val(contrato.ordenador_gasto));
  row("Supervisor:", val(contrato.supervisor));
  row("BP:", val(contrato.bp));
  if (rep?.observaciones) {
    y += 6;
    row("Última observación:", val(rep.observaciones));
  }

  // Pie
  const footerY = doc.internal.pageSize.getHeight() - 32;
  doc.setFontSize(8);
  doc.setTextColor(130);
  doc.text(
    `Generado el ${new Date().toLocaleString("es-CO")}`,
    marginX,
    footerY,
  );
  doc.setTextColor(0);

  const safeRef = ref.replace(/[^a-zA-Z0-9._-]+/g, "_");
  doc.save(`ficha_contrato_${safeRef}.pdf`);
}
