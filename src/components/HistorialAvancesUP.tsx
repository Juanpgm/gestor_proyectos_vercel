"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BarChart3,
  User,
  ImageIcon,
  ZoomIn,
  ExternalLink,
  RefreshCw,
  Download,
} from "lucide-react";
import { useAvancesUP } from "@/hooks/useAvancesUP";
import { formatCurrency, formatCurrencyFull } from "@/utils/currency";
import type { AvanceUP } from "@/types/avances-up";

interface HistorialAvancesUPProps {
  upid: string;
  intervencionId?: string;
  nombreUP: string;
  presupuesto?: number;
  onClose: () => void;
  onRegistrarAvance?: () => void;
  onAvanceChanged?: () => void;
}

const TendenciaIcon: React.FC<{
  tendencia: "subiendo" | "estable" | "bajando";
}> = ({ tendencia }) => {
  switch (tendencia) {
    case "subiendo":
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "bajando":
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-400" />;
  }
};

const AvanceCard: React.FC<{
  avance: AvanceUP;
  isLatest: boolean;
  prevAvance?: AvanceUP;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ avance, isLatest, prevAvance, onDelete }) => {
  const [expanded, setExpanded] = useState(isLatest);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const [directImageFallback, setDirectImageFallback] = useState<Set<number>>(
    new Set(),
  );

  const markBroken = (index: number) =>
    setBrokenImages((prev) => new Set(prev).add(index));

  // The backend currently returns SigV2 presigned URLs that fail on S3.
  // Prefer regenerating SigV4 URLs in /api/proxy/s3-file using a resolvable S3 key.
  const s3FileUrl = (s3Key: string) =>
    `/api/proxy/s3-file?key=${encodeURIComponent(s3Key)}&inline=1`;

  const s3DownloadUrl = (s3Key: string, nombre: string) =>
    `/api/proxy/s3-file?key=${encodeURIComponent(s3Key)}&name=${encodeURIComponent(nombre)}`;

  const normalizeUrlPath = (value?: string): string => {
    if (!value) return "";
    try {
      const parsed = new URL(value);
      return decodeURIComponent(parsed.pathname.replace(/\/+$/, ""));
    } catch {
      return value.split("?")[0].replace(/\/+$/, "");
    }
  };

  const getFileNameFromUrl = (value: string, fallback: string): string => {
    if (!value) return fallback;

    try {
      const parsed = new URL(value);
      const last = parsed.pathname.split("/").filter(Boolean).pop();
      return last ? decodeURIComponent(last) : fallback;
    } catch {
      const withoutQuery = value.split("?")[0].split("#")[0];
      const last = withoutQuery.split("/").filter(Boolean).pop();
      return last ? decodeURIComponent(last) : fallback;
    }
  };

  const extractS3Key = (value?: string): string | undefined => {
    if (!value) return undefined;
    try {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.replace(/^\/+/, "");
      if (host.includes(".s3.") || host.endsWith(".s3.amazonaws.com")) {
        return decodeURIComponent(path);
      }
      if (host.startsWith("s3.") || host === "s3.amazonaws.com") {
        const segments = path.split("/");
        if (segments.length >= 2) {
          return decodeURIComponent(segments.slice(1).join("/"));
        }
      }
      return decodeURIComponent(path);
    } catch {
      // Some backends return values like "file.jpg?X-Amz-..." (without scheme/host).
      // In that case, recover the object key from the URL-like prefix.
      const withoutQuery = value
        .split("?")[0]
        .split("#")[0]
        .replace(/^\/+/, "");
      if (!withoutQuery) return undefined;
      try {
        return decodeURIComponent(withoutQuery);
      } catch {
        return withoutQuery;
      }
    }
  };

  const findSoporteByUrl = (
    tipo: "imagen" | "documento",
    url: string,
    index: number,
  ) => {
    const byType = avance.soportes.filter((s) => s.tipo === tipo);
    const targetPath = normalizeUrlPath(url);
    const byPath = byType.find((s) => {
      const candidates = [
        s.url,
        s.url_presigned,
        s.presigned_url,
        s.url_directa,
      ]
        .filter(
          (candidate): candidate is string =>
            typeof candidate === "string" && candidate.length > 0,
        )
        .map(normalizeUrlPath);
      return candidates.includes(targetPath);
    });
    if (byPath) return byPath;
    return byType[index];
  };

  const imgUrl = (url: string, index: number) => {
    if (directImageFallback.has(index)) return url;

    const soporte = findSoporteByUrl("imagen", url, index);
    const key =
      soporte?.s3_key ||
      extractS3Key(soporte?.url_directa) ||
      extractS3Key(url);
    if (key) return s3FileUrl(key);
    return `/api/proxy/fetch-file?url=${btoa(url)}&inline=1`;
  };

  const handleImageError = (index: number) => {
    // First failure retries using direct presigned URL from backend.
    if (!directImageFallback.has(index)) {
      setDirectImageFallback((prev) => new Set(prev).add(index));
      return;
    }

    markBroken(index);
  };

  const docProxyUrl = (url: string, nombre: string, index: number) => {
    const soporte = findSoporteByUrl("documento", url, index);
    const key =
      soporte?.s3_key ||
      extractS3Key(soporte?.url_directa) ||
      extractS3Key(url);
    if (key) return s3DownloadUrl(key, nombre);
    return `/api/proxy/fetch-file?url=${btoa(url)}&name=${encodeURIComponent(nombre)}`;
  };

  const docInlineUrl = (url: string, index: number) => {
    const soporte = findSoporteByUrl("documento", url, index);
    const key =
      soporte?.s3_key ||
      extractS3Key(soporte?.url_directa) ||
      extractS3Key(url);
    if (key) return s3FileUrl(key);
    return `/api/proxy/fetch-file?url=${btoa(url)}&inline=1`;
  };

  const diffAvance = prevAvance
    ? avance.avance_fisico - prevAvance.avance_fisico
    : 0;

  const handleDeleteConfirm = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    const success = await onDelete(avance.id);
    setIsDeleting(false);

    if (success) {
      setConfirmDelete(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden ${
        isLatest
          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
    >
      {/* Header del avance */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <button className="p-0.5">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(avance.fecha_reporte)}
              </span>
              {isLatest && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                  Más reciente
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  avance.estado_reporte === "aprobado"
                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                    : avance.estado_reporte === "enviado"
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : avance.estado_reporte === "rechazado"
                        ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {avance.estado_reporte}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {avance.avance_fisico.toFixed(1)}%
              </span>
              {prevAvance && diffAvance !== 0 && (
                <span
                  className={`text-xs font-medium ${diffAvance > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {diffAvance > 0 ? "+" : ""}
                  {diffAvance.toFixed(1)}%
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">Avance</span>
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Barras de progreso */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">
                      Avance
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {avance.avance_fisico.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(avance.avance_fisico, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Valor ejecutado */}
              {avance.valor_ejecutado > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Valor ejecutado:
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(avance.valor_ejecutado)}
                  </span>
                </div>
              )}

              {/* Observaciones */}
              {avance.observaciones && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Observaciones
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {avance.observaciones}
                  </p>
                </div>
              )}

              {/* Fotografías */}
              {avance.imagenes_urls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Fotografías ({avance.imagenes_urls.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {avance.imagenes_urls.map((url, i) => {
                      const soporte = findSoporteByUrl("imagen", url, i);
                      const label =
                        soporte?.nombre_original || `Fotografía ${i + 1}`;
                      const proxied = imgUrl(url, i);
                      if (brokenImages.has(i)) {
                        return (
                          <a
                            key={i}
                            href={proxied}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex flex-col items-center justify-center gap-1 rounded-lg border border-blue-200 dark:border-blue-800 aspect-square bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors p-2"
                            title={`Abrir ${label}`}
                          >
                            <ImageIcon className="w-6 h-6 text-blue-400" />
                            <span className="text-[10px] text-blue-500 dark:text-blue-400 text-center line-clamp-2 leading-tight">
                              {label}
                            </span>
                          </a>
                        );
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingImage(url);
                          }}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square bg-gray-100 dark:bg-gray-700"
                          title={label}
                        >
                          <img
                            src={proxied}
                            alt={label}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={() => handleImageError(i)}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documentos */}
              {avance.documentos_urls.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Documentos ({avance.documentos_urls.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {avance.documentos_urls.map((url, i) => {
                      const soporte = findSoporteByUrl("documento", url, i);
                      const nombre =
                        soporte?.nombre_original ||
                        getFileNameFromUrl(url, `Documento ${i + 1}`);
                      const proxyUrl = docProxyUrl(url, nombre, i);
                      const openUrl = docInlineUrl(url, i);
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <a
                            href={proxyUrl}
                            download={nombre}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-3 py-2 flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors text-sm text-amber-800 dark:text-amber-200"
                            title={`Descargar ${nombre}`}
                          >
                            <FileText className="w-4 h-4 flex-shrink-0 text-amber-500" />
                            <span className="truncate flex-1">{nombre}</span>
                            <Download className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                          </a>
                          <a
                            href={openUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                            title="Abrir en nueva pestaña"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Archivos adjuntos (legacy: sin soportes ni urls tipadas) */}
              {avance.imagenes_urls.length === 0 &&
                avance.documentos_urls.length === 0 &&
                avance.archivos.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Archivos adjuntos ({avance.archivos.length})
                    </span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {avance.archivos.map((archivo) =>
                        archivo.url ? (
                          <a
                            key={archivo.id}
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {archivo.nombre}
                          </a>
                        ) : (
                          <span
                            key={archivo.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300"
                          >
                            <FileText className="w-3 h-3" />
                            {archivo.nombre}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Lightbox de imagen */}
              <AnimatePresence>
                {viewingImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    onClick={() => setViewingImage(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.85, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative max-w-4xl max-h-[90vh] p-2 flex flex-col items-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={imgUrl(
                          viewingImage,
                          Math.max(
                            0,
                            avance.imagenes_urls.indexOf(viewingImage),
                          ),
                        )}
                        alt="Vista completa"
                        className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                        onError={() => {
                          const idx = Math.max(
                            0,
                            avance.imagenes_urls.indexOf(viewingImage),
                          );
                          handleImageError(idx);
                        }}
                      />
                      <div className="flex items-center gap-3">
                        <a
                          href={viewingImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-sm transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Abrir en nueva pestaña
                        </a>
                        <button
                          type="button"
                          onClick={() => setViewingImage(null)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Cerrar
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <User className="w-3 h-3" />
                  <span>{avance.reportado_por}</span>
                  <span>•</span>
                  <span>{formatDate(avance.created_at)}</span>
                </div>
                <div>
                  {confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">¿Eliminar?</span>
                      <button
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        {isDeleting ? "Borrando..." : "Sí"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(false);
                        }}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      disabled={isDeleting}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      title="Eliminar avance"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const HistorialAvancesUP: React.FC<HistorialAvancesUPProps> = ({
  upid,
  intervencionId,
  nombreUP,
  presupuesto = 0,
  onClose,
  onRegistrarAvance,
  onAvanceChanged,
}) => {
  const { avances, loading, error, resumen, deleteAvance, refresh } =
    useAvancesUP(upid, intervencionId);

  const handleDelete = React.useCallback(
    async (id: string): Promise<boolean> => {
      const success = await deleteAvance(id);
      if (success) onAvanceChanged?.();
      return success;
    },
    [deleteAvance, onAvanceChanged],
  );

  // El overlay usa position:fixed. Dentro de un ancestro con `transform` (los
  // contenedores animados con Framer Motion lo aplican) ese ancestro se vuelve
  // el "containing block" y el modal queda anclado a su caja en vez de al
  // viewport. Un portal a document.body lo despega de ancestros transformados.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Historial de Avances
              </h2>
              <p className="text-purple-100 text-sm truncate max-w-md">
                {upid} - {nombreUP}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
              title="Recargar avances (actualiza enlaces de archivos)"
            >
              <RefreshCw
                className={`w-4 h-4 text-white ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Resumen */}
        {resumen && (
          <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {resumen.total_reportes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reportes
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {resumen.ultimo_avance_fisico.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Últ. Avance
                </p>
              </div>
              <div className="flex flex-col items-center">
                <TendenciaIcon tendencia={resumen.tendencia} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                  {resumen.tendencia}
                </p>
              </div>
            </div>
            {presupuesto > 0 && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800 flex items-center justify-between text-sm">
                <span className="text-purple-700 dark:text-purple-300 font-medium">
                  Presupuesto base:
                </span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrencyFull(presupuesto)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Cargando historial...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          ) : avances.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              <div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No hay avances registrados
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Registra el primer avance para esta unidad de proyecto
                </p>
              </div>
              {onRegistrarAvance && (
                <button
                  onClick={onRegistrarAvance}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Registrar Primer Avance
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {avances.map((avance, index) => (
                <AvanceCard
                  key={avance.id}
                  avance={avance}
                  isLatest={index === 0}
                  prevAvance={avances[index + 1]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {avances.length} reporte{avances.length !== 1 ? "s" : ""} registrado
            {avances.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
            {onRegistrarAvance && avances.length > 0 && (
              <button
                onClick={onRegistrarAvance}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg transition-colors shadow-sm"
              >
                <TrendingUp className="w-4 h-4" />
                Nuevo Avance
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default HistorialAvancesUP;
