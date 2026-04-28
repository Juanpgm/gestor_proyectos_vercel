/**
 * Utilidades compartidas para generar reportes PDF con jsPDF + jspdf-autotable
 * Usado por reporteUPsPdf y reporteEmprestitoPdf
 */
import type jsPDF from "jspdf";

// ── Colores del tema ─────────────────────────────────────
export const PDF_COLORS = {
  primary: [30, 64, 175] as [number, number, number], // blue-800
  primaryLight: [59, 130, 246] as [number, number, number], // blue-500
  success: [22, 163, 74] as [number, number, number], // green-600
  warning: [217, 119, 6] as [number, number, number], // amber-600
  danger: [220, 38, 38] as [number, number, number], // red-600
  gray: [107, 114, 128] as [number, number, number], // gray-500
  grayLight: [243, 244, 246] as [number, number, number], // gray-100
  grayDark: [55, 65, 81] as [number, number, number], // gray-700
  white: [255, 255, 255] as [number, number, number],
  black: [17, 24, 39] as [number, number, number], // gray-900
};

// ── Utilidades de formato ────────────────────────────────
export function formatFechaPdf(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPorcentaje(valor: number): string {
  return `${Math.round(valor * 10) / 10}%`;
}

export function diasDesde(fecha: string | null): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Obtiene color de semáforo según porcentaje (0-100) */
export function getColorSemaforo(porcentaje: number): [number, number, number] {
  if (porcentaje >= 80) return PDF_COLORS.success;
  if (porcentaje >= 40) return PDF_COLORS.warning;
  return PDF_COLORS.danger;
}

/** Texto del semáforo */
export function getTextoSemaforo(porcentaje: number): string {
  if (porcentaje >= 80) return "Alto";
  if (porcentaje >= 40) return "Medio";
  return "Bajo";
}

// ── Crear instancia de jsPDF ─────────────────────────────
export async function crearDocPdf(): Promise<jsPDF> {
  const { default: JsPDF } = await import("jspdf");
  const { applyPlugin } = await import("jspdf-autotable");
  applyPlugin(JsPDF);
  const doc = new JsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "letter",
    putOnlyUsedFonts: true,
  });
  // Idioma y metadatos para compatibilidad UTF-8 / español
  doc.setLanguage("es");
  doc.setDocumentProperties({
    title: "Reporte CaliTrack",
    subject: "Avances Unidades de Proyecto",
    author: "Alcaldia de Santiago de Cali",
    keywords: "calitrack, avances, unidades, proyecto, reporte",
    creator: "CaliTrack — Plataforma de Gestion de Proyectos",
  });
  return doc;
}

// ── Header del reporte ───────────────────────────────────
export function dibujarHeader(
  doc: jsPDF,
  titulo: string,
  subtitulo?: string,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Barra superior
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(titulo, 14, y);

  // Subtítulo / fecha
  y += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const fechaGen = `Generado: ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  doc.text(subtitulo ? `${subtitulo}  |  ${fechaGen}` : fechaGen, 14, y);

  // Línea de separación
  doc.setDrawColor(...PDF_COLORS.primaryLight);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  return 34; // Y offset para el contenido siguiente
}

// ── Tarjeta de resumen (KPI) ─────────────────────────────
export function dibujarTarjetasResumen(
  doc: jsPDF,
  tarjetas: Array<{
    label: string;
    valor: string;
    color?: [number, number, number];
  }>,
  startY: number,
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cardCount = tarjetas.length;
  const totalGap = gap * (cardCount - 1);
  const cardWidth = (pageWidth - margin * 2 - totalGap) / cardCount;
  const cardHeight = 18;

  for (let i = 0; i < tarjetas.length; i++) {
    const x = margin + i * (cardWidth + gap);
    const t = tarjetas[i];
    const color = t.color || PDF_COLORS.primary;

    // Fondo de tarjeta
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, "F");

    // Valor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(t.valor, x + cardWidth / 2, startY + 8, { align: "center" });

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(t.label, x + cardWidth / 2, startY + 14, { align: "center" });
  }

  return startY + cardHeight + 6;
}

// ── Título de sección ────────────────────────────────────
export function dibujarTituloSeccion(
  doc: jsPDF,
  titulo: string,
  y: number,
  color: [number, number, number] = PDF_COLORS.primary,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...color);
  doc.text(titulo, 14, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, doc.internal.pageSize.getWidth() - 14, y + 1.5);
  return y + 6;
}

// ── Footer con paginación ────────────────────────────────
export function dibujarFooters(doc: jsPDF, titulo: string): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.gray);
    doc.setFont("helvetica", "normal");

    // Izquierda: título
    doc.text(titulo, 14, pageHeight - 8);

    // Centro: fecha
    doc.text(
      `Alcaldía de Santiago de Cali — ${new Date().toLocaleDateString("es-CO")}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" },
    );

    // Derecha: página
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, {
      align: "right",
    });

    // Línea
    doc.setDrawColor(...PDF_COLORS.grayLight);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
  }
}

// ── Verificar si necesita nueva página ───────────────────
export function verificarPagina(
  doc: jsPDF,
  y: number,
  minSpace: number = 30,
): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + minSpace > pageHeight - 15) {
    doc.addPage();
    return 15;
  }
  return y;
}

// ── Descargar PDF ────────────────────────────────────────
export function descargarPdf(doc: jsPDF, nombreArchivo: string): void {
  doc.save(nombreArchivo);
}
