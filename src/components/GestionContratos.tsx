"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  FileText,
  Building,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Plus,
  TrendingUp,
  Landmark,
  Upload,
  Eye,
  EyeOff,
  CheckCircle,
  Download,
  Pencil,
  Loader2,
} from "lucide-react";
import {
  patchContratoEmprestito,
  editarNombreResumidoProceso,
} from "@/services/emprestito-gestion.service";
import AgregarConvenioTransferenciaModal from "@/components/AgregarConvenioTransferenciaModal";
import CargarRPCModal from "@/components/CargarRPCModal";
import EditarRPCModal from "@/components/EditarRPCModal";
import ManagementFeatureTour from "./ManagementFeatureTour";
import { proxyFetch } from "@/utils/errorHandler";

// Interfaz para RPC
interface DocumentoConEnlace {
  filename: string;
  s3_key: string;
  s3_url: string;
  content_type: string;
  size: number;
  upload_date?: string;
  url_descarga?: string;
  url_visualizar?: string;
  url_presigned?: string;
  url_expiration_seconds?: number;
}

interface RPC {
  id: string;
  numero_rpc: string;
  referencia_contrato: string;
  numero_contrato?: string;
  beneficiario_id?: string;
  beneficiario_nombre?: string;
  descripcion_rpc?: string;
  fecha_contabilizacion?: string;
  fecha_impresion?: string;
  estado_liberacion?: string;
  bp?: string;
  valor_rpc?: number;
  cdp_asociados?: string[];
  programacion_pac?: { [key: string]: string };
  nombre_centro_gestor?: string;
  documentos_s3?: Array<{
    s3_url: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
  documentos_con_enlaces?: DocumentoConEnlace[];
  total_documentos?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  estado?: string;
  tipo?: string;
}

// Interfaz para contrato de emprÃ©stito
interface ContratoEmprestito {
  id?: string;
  referencia_contrato?: string;
  numero_contrato?: string;
  objeto_contrato?: string;
  valor_contrato?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  nombre_centro_gestor?: string;
  estado?: string;
  tipo_contrato?: string;
  tipo?: string;
  tipo_registro?: string;
  modalidad_contrato?: string;
  banco?: string;
  contratista?: string;
  nit_contratista?: string;
  supervisor?: string;
  // Campos adicionales desde API
  modalidad_contratacion?: string;
  entidad_contratante?: string;
  nombre_resumido_proceso?: string;
  referencia_proceso?: string;
  estado_contrato?: string;
  valor_pagado?: string | number;
  fecha_firma_contrato?: string;
  fecha_firma?: string;
  [key: string]: any;
}

// Interfaz para filtros de columna
interface ColumnFilter {
  [key: string]: string[];
}

// Interfaz para ordenamiento
interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface GestionContratosProps {
  onNavigateHome: () => void;
}

const GestionContratos: React.FC<GestionContratosProps> = ({
  onNavigateHome,
}) => {
  // Estados para datos
  const [contratos, setContratos] = useState<ContratoEmprestito[]>([]);
  const [rpcs, setRpcs] = useState<RPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para UI
  const [searchTerm, setSearchTerm] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({});
  const [showFilters, setShowFilters] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "asc",
  });
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showCargarRPCModal, setShowCargarRPCModal] = useState(false);
  const [selectedContratoForRPC, setSelectedContratoForRPC] =
    useState<ContratoEmprestito | null>(null);
  const [showEditarRPCModal, setShowEditarRPCModal] = useState(false);
  const [selectedRPCForEdit, setSelectedRPCForEdit] = useState<RPC | null>(
    null,
  );
  const [showDocumentosRPCModal, setShowDocumentosRPCModal] = useState(false);
  const [selectedContratoForDocs, setSelectedContratoForDocs] =
    useState<ContratoEmprestito | null>(null);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [selectedDocBlobUrl, setSelectedDocBlobUrl] = useState<string | null>(
    null,
  );
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnSearchTerm, setColumnSearchTerm] = useState("");
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [modalEditContrato, setModalEditContrato] = useState<{
    open: boolean;
    contrato: ContratoEmprestito | null;
  }>({ open: false, contrato: null });
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set([
      "numero_contrato",
      "objeto_contrato",
      "nombre_centro_gestor",
      "banco",
      "estado_contrato",
      "modalidad_contratacion",
      "entidad_contratante",
      "valor_contrato",
      "fecha_firma_contrato",
      "contratista",
      "nombre_resumido_proceso",
    ]),
  );

  // Estados para paginaciÃ³n
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Estados para redimensionamiento de columnas
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>(
    {},
  );
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);

  // Refs para manejar clics fuera del dropdown
  const filtersRef = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const columns = useMemo(
    () => [
      {
        key: "numero_contrato",
        label: "NÃºmero Contrato",
        isSortable: true,
        accessor: (contrato: ContratoEmprestito) =>
          contrato.referencia_contrato || contrato.numero_contrato,
      },
      {
        key: "tipo_origen",
        label: "Tipo",
        isSortable: true,
        accessor: (contrato: ContratoEmprestito) => getTipoContrato(contrato),
      },
      {
        key: "objeto_contrato",
        label: "Objeto del Contrato",
        isSortable: true,
      },
      {
        key: "nombre_resumido_proceso",
        label: "Nombre Proceso",
        isSortable: true,
      },
      { key: "nombre_centro_gestor", label: "Centro Gestor", isSortable: true },
      { key: "banco", label: "Banco", isSortable: true },
      { key: "estado_contrato", label: "Estado Contrato", isSortable: true },
      { key: "estado", label: "Estado", isSortable: true },
      { key: "valor_contrato", label: "Valor Contrato", isSortable: true },
      { key: "valor_pagado", label: "Valor Pagado", isSortable: true },
      { key: "fecha_inicio", label: "Fecha Inicio", isSortable: true },
      { key: "fecha_fin", label: "Fecha Fin", isSortable: true },
      { key: "fecha_firma_contrato", label: "Fecha Firma", isSortable: true },
      {
        key: "modalidad_contratacion",
        label: "Modalidad ContrataciÃ³n",
        isSortable: true,
      },
      {
        key: "entidad_contratante",
        label: "Entidad Contratante",
        isSortable: true,
      },
      { key: "tipo_contrato", label: "Tipo de Contrato", isSortable: true },
      { key: "contratista", label: "Contratista", isSortable: true },
      { key: "nit_contratista", label: "NIT Contratista", isSortable: true },
      { key: "supervisor", label: "Supervisor", isSortable: true },
      { key: "referencia_proceso", label: "Ref. Proceso", isSortable: true },
    ],
    [],
  );

  useEffect(() => {
    if (columnOrder.length === 0 && columns.length > 0) {
      setColumnOrder(columns.map((col) => col.key));
    }
  }, [columns, columnOrder]);

  // Effect para manejar clics fuera de los filtros
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.keys(showFilters).forEach((key) => {
        if (showFilters[key] && filtersRef.current[key]) {
          const filterElement = filtersRef.current[key];
          if (filterElement && !filterElement.contains(event.target as Node)) {
            setShowFilters((prev) => ({ ...prev, [key]: false }));
          }
        }
      });

      if (showColumnSelector) {
        const columnSelector = document.querySelector("[data-column-selector]");
        if (columnSelector && !columnSelector.contains(event.target as Node)) {
          setShowColumnSelector(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters, showColumnSelector]);

  // FunciÃ³n para cargar datos del endpoint
  /**
   * Carga todos los contratos desde el endpoint /contratos_emprestito_all
   * Este endpoint retorna 60 registros en total:
   * - 44 contratos de SECOP (solo lectura)
   * - 12 Ã³rdenes de compra TVEC (editables - tipo: "orden_compra_manual")
   * - 4 convenios/transferencias (editables - tipo: "convenio_transferencia_manual")
   */
  const fetchContratos = async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiUrl) {
        throw new Error("URL de API no configurada");
      }

      const url = bypassCache
        ? "/api/proxy/contratos_emprestito_all?bypass_cache=1"
        : "/api/proxy/contratos_emprestito_all";
      const response = await proxyFetch(url);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response (Contratos):", data);

      if (Array.isArray(data)) {
        setContratos(data);
      } else if (data && Array.isArray(data.data)) {
        setContratos(data.data);
      } else if (data && Array.isArray(data.contratos)) {
        setContratos(data.contratos);
      } else {
        console.warn("Formato de respuesta inesperado:", data);
        setContratos([]);
      }
    } catch (error) {
      console.error("Error fetching contratos:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchRPCs = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiUrl) {
        throw new Error("URL de API no configurada");
      }

      const response = await proxyFetch("/api/proxy/rpc_all");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response (RPCs):", data);

      if (data.success && Array.isArray(data.data)) {
        setRpcs(data.data);
      } else {
        console.warn("Formato de respuesta inesperado para RPCs:", data);
        setRpcs([]);
      }
    } catch (error) {
      console.error("Error fetching RPCs:", error);
      setRpcs([]);
    }
  };

  // FunciÃ³n para obtener TODOS los RPCs de un contrato
  const obtenerRPCsDeContrato = (contrato: ContratoEmprestito): RPC[] => {
    const referenciaContrato =
      contrato.referencia_contrato || contrato.numero_contrato;
    return rpcs.filter((rpc) => rpc.referencia_contrato === referenciaContrato);
  };

  // FunciÃ³n para verificar si algÃºn RPC del contrato tiene documentos
  const tieneDocumentosRPC = (contrato: ContratoEmprestito): boolean => {
    const contratosRpcs = obtenerRPCsDeContrato(contrato);
    return contratosRpcs.some(
      (rpc) =>
        (rpc.documentos_con_enlaces && rpc.documentos_con_enlaces.length > 0) ||
        (rpc.documentos_s3 && rpc.documentos_s3.length > 0),
    );
  };

  // URL remota del documento (usada como key de selecciÃ³n)
  const getDocRemoteUrl = (doc: DocumentoConEnlace): string => {
    return doc.url_visualizar || doc.url_presigned || doc.s3_url;
  };

  // URL para descargar el documento (usa el proxy con Content-Disposition: attachment)
  const getDocDownloadUrl = (doc: DocumentoConEnlace): string => {
    const remoteUrl =
      doc.url_descarga || doc.url_visualizar || doc.url_presigned || doc.s3_url;
    const encoded = btoa(unescape(encodeURIComponent(remoteUrl)));
    return `/api/proxy/fetch-file?url=${encodeURIComponent(encoded)}&name=${encodeURIComponent(doc.filename)}`;
  };

  // Seleccionar documento: fetch como blob para visualizar inline
  // (S3 envÃ­a Content-Disposition: attachment, asÃ­ que el iframe descarga en lugar de mostrar.
  //  La soluciÃ³n es fetch â†’ blob â†’ URL.createObjectURL que no tiene headers de descarga.)
  const handleSelectDoc = async (doc: DocumentoConEnlace) => {
    const remoteUrl = getDocRemoteUrl(doc);
    console.log("[DocViewer] handleSelectDoc llamado, filename:", doc.filename);
    if (selectedDocUrl === remoteUrl) {
      console.log("[DocViewer] Ya seleccionado, ignorando");
      return;
    }

    // Liberar blob anterior
    if (selectedDocBlobUrl) {
      URL.revokeObjectURL(selectedDocBlobUrl);
      setSelectedDocBlobUrl(null);
    }

    setSelectedDocUrl(remoteUrl);
    setLoadingDoc(true);

    try {
      const encoded = btoa(unescape(encodeURIComponent(remoteUrl)));
      const proxyUrl = `/api/proxy/fetch-file?url=${encodeURIComponent(encoded)}&name=${encodeURIComponent(doc.filename)}&inline=1`;
      console.log(
        "[DocViewer] Fetching proxy URL:",
        proxyUrl.substring(0, 100),
      );
      const response = await proxyFetch(proxyUrl);
      console.log(
        "[DocViewer] Response status:",
        response.status,
        "Content-Type:",
        response.headers.get("Content-Type"),
      );
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const blob = await response.blob();
      console.log("[DocViewer] Blob size:", blob.size, "type:", blob.type);
      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log("[DocViewer] Blob URL creada:", blobUrl);
      setSelectedDocBlobUrl(blobUrl);
    } catch (err) {
      console.error("[DocViewer] Error cargando documento:", err);
      setSelectedDocBlobUrl(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  // Limpiar blob URL al cerrar modal
  const handleCloseDocumentosModal = () => {
    if (selectedDocBlobUrl) URL.revokeObjectURL(selectedDocBlobUrl);
    setShowDocumentosRPCModal(false);
    setSelectedContratoForDocs(null);
    setSelectedDocUrl(null);
    setSelectedDocBlobUrl(null);
    setLoadingDoc(false);
  };

  // Abrir el modal de documentos RPC del contrato
  // Si solo hay un documento, lo carga automÃ¡ticamente en el visor
  const handleOpenDocumentosRPC = (contrato: ContratoEmprestito) => {
    setSelectedContratoForDocs(contrato);
    setSelectedDocUrl(null);
    setSelectedDocBlobUrl(null);
    setShowDocumentosRPCModal(true);

    // Auto-cargar si solo hay un documento
    const rpcsDelContrato = rpcs.filter((r) => {
      const numContrato =
        (r.numero_contrato ?? r.referencia_contrato)?.toString() || "";
      const contratoNum = contrato.numero_contrato?.toString() || "";
      return numContrato === contratoNum;
    });
    const allDocs: DocumentoConEnlace[] = [];
    rpcsDelContrato.forEach((rpc) => {
      allDocs.push(...getDocumentosDeRPC(rpc));
    });
    if (allDocs.length === 1) {
      // Usar setTimeout para que el modal se renderice primero
      setTimeout(() => handleSelectDoc(allDocs[0]), 100);
    }
  };

  // Obtener documentos unificados de un RPC (prefiere documentos_con_enlaces)
  const getDocumentosDeRPC = (rpc: RPC): DocumentoConEnlace[] => {
    if (rpc.documentos_con_enlaces && rpc.documentos_con_enlaces.length > 0) {
      return rpc.documentos_con_enlaces;
    }
    if (rpc.documentos_s3 && rpc.documentos_s3.length > 0) {
      return rpc.documentos_s3.map((d) => ({
        filename: d.filename,
        s3_key: "",
        s3_url: d.s3_url,
        content_type: d.content_type,
        size: d.size,
      }));
    }
    return [];
  };

  // Formatear tamaÃ±o de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    fetchContratos();
    fetchRPCs();
  }, []);

  const handleAgregarContratoSuccess = () => {
    fetchContratos();
  };

  /**
   * Obtiene el tipo de contrato para mostrar en la tabla
   */
  const getTipoContrato = (contrato: ContratoEmprestito): string => {
    if (contrato.tipo_contrato === "Orden de Compra - TVEC") {
      return "Orden TVEC";
    }
    if (contrato.tipo === "convenio_transferencia_manual") {
      return "Convenio/Transferencia";
    }
    return "SECOP";
  };

  const getUniqueValues = (key: string): string[] => {
    if (!Array.isArray(contratos) || contratos.length === 0) {
      return [];
    }

    const values = contratos
      .map((contrato) => contrato[key])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value));

    return Array.from(new Set(values)).sort();
  };

  const clearColumnFilter = (columnKey: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: [],
    }));
  };

  const allContratos = useMemo(() => {
    if (!Array.isArray(contratos) || contratos.length === 0) {
      return [];
    }

    let filtered = contratos.filter((contrato) => {
      if (searchTerm) {
        const searchableText = Object.values(contrato).join(" ").toLowerCase();
        if (!searchableText.includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      for (const [key, values] of Object.entries(columnFilters)) {
        if (values && values.length > 0) {
          const contratoValue = String(contrato[key] || "");
          if (!values.includes(contratoValue)) {
            return false;
          }
        }
      }

      return true;
    });

    // Aplicar ordenamiento si estÃ¡ configurado
    if (sortConfig.key) {
      const sortColumn = columns.find((col) => col.key === sortConfig.key);

      filtered.sort((a, b) => {
        const aValue = sortColumn?.accessor
          ? sortColumn.accessor(a)
          : a[sortConfig.key];
        const bValue = sortColumn?.accessor
          ? sortColumn.accessor(b)
          : b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();

        return sortConfig.direction === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [contratos, searchTerm, columnFilters, sortConfig, columns]);

  // Datos paginados
  const paginatedContratos = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allContratos.slice(startIndex, startIndex + itemsPerPage);
  }, [allContratos, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(allContratos.length / itemsPerPage);

  // Resetear a pÃ¡gina 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);

  const stats = useMemo(() => {
    const parseNumeric = (value: any) => {
      if (typeof value === "number") return value;
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    };

    const totalContratos = contratos.length;
    const filteredCount = allContratos.length;

    const totalValorContrato = allContratos.reduce((sum, contrato) => {
      return sum + parseNumeric(contrato.valor_contrato);
    }, 0);

    const totalValorPagado = allContratos.reduce((sum, contrato) => {
      return sum + parseNumeric(contrato.valor_pagado);
    }, 0);

    const centrosGestores = new Set(
      allContratos
        .map((contrato) => contrato.nombre_centro_gestor)
        .filter(Boolean),
    ).size;

    const bancos = new Set(
      allContratos.map((contrato) => contrato.banco).filter(Boolean),
    ).size;

    const estados = new Set(
      allContratos
        .map((contrato) => contrato.estado_contrato || contrato.estado)
        .filter(Boolean),
    ).size;

    const modalidades = new Set(
      allContratos
        .map((contrato) => contrato.modalidad_contratacion)
        .filter(Boolean),
    ).size;

    const porcentajePagado =
      totalValorContrato > 0
        ? (totalValorPagado / totalValorContrato) * 100
        : 0;

    // Conteo por tipo
    const contratosSECOP = allContratos.filter(
      (c) =>
        c.tipo_contrato !== "Orden de Compra - TVEC" &&
        c.tipo !== "convenio_transferencia_manual",
    ).length;

    const ordenesTV = allContratos.filter(
      (c) => c.tipo_contrato === "Orden de Compra - TVEC",
    ).length;

    const convenios = allContratos.filter(
      (c) => c.tipo === "convenio_transferencia_manual",
    ).length;

    return {
      totalContratos,
      filteredCount,
      totalValorContrato,
      totalValorPagado,
      porcentajePagado,
      centrosGestores,
      bancos,
      estados,
      modalidades,
      contratosSECOP,
      ordenesTV,
      convenios,
    };
  }, [contratos, allContratos]);

  const toggleColumnVisibility = (columnKey: string) => {
    if (columnKey === "numero_contrato") return;

    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLTableCellElement>,
    key: string,
  ) => {
    setDraggedColumn(key);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLTableCellElement>,
    key: string,
  ) => {
    e.preventDefault();
    if (draggedColumn === key || key === "numero_contrato") return;
    setDragOverColumn(key);

    const draggedIndex = columnOrder.indexOf(draggedColumn!);
    const targetIndex = columnOrder.indexOf(key);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newColumnOrder = [...columnOrder];
    const [removed] = newColumnOrder.splice(draggedIndex, 1);
    newColumnOrder.splice(targetIndex, 0, removed);

    setColumnOrder(newColumnOrder);
  };

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>) => {
    e.preventDefault();
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const displayedColumns = columns.filter(
    (col) => col.key === "numero_contrato" || visibleColumns.has(col.key),
  );

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    // Formatear valores monetarios
    if (
      (key === "valor_contrato" || key === "valor_pagado") &&
      (typeof value === "number" || !isNaN(Number(value)))
    ) {
      const numValue = typeof value === "number" ? value : Number(value);
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue);
    }

    // Formatear fechas
    if (key.includes("fecha") && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        }
        return String(value);
      } catch {
        return String(value);
      }
    }

    // Truncar textos largos
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 47) + "...";
    }

    return String(value);
  };

  const formatCompactCurrency = (value: number) => {
    const absValue = Math.abs(value || 0);
    let compactValue: number;
    let suffix: string;

    if (absValue >= 1_000_000_000_000) {
      compactValue = value / 1_000_000_000_000;
      suffix = "B";
    } else if (absValue >= 1_000_000_000) {
      compactValue = value / 1_000_000_000;
      suffix = "MM";
    } else if (absValue >= 1_000_000) {
      compactValue = value / 1_000_000;
      suffix = "M";
    } else if (absValue >= 1_000) {
      compactValue = value / 1_000;
      suffix = "K";
    } else {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value || 0);
    }

    const formatted = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Math.abs(compactValue));

    return (value < 0 ? "-" : "") + formatted + suffix;
  };

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-500" />
    );
  };

  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);

    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || 150;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getColumnWidth = (columnKey: string) => {
    return columnWidths[columnKey] || 150;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Cargando contratos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">
              Error cargando datos: {error}
            </p>
            <button
              onClick={() => fetchContratos()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-md p-6 border border-gray-200 dark:border-gray-700 shadow-none"
        data-tour-id="mgmt-contratos-header"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-violet-50 dark:bg-violet-900/20 p-2 rounded-md border border-violet-200 dark:border-violet-900/30">
              <FileText className="w-5 h-5 text-violet-700 dark:text-violet-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Gestionar Contratos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administración de convenios y transferencias del empréstito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ManagementFeatureTour moduleKey="contratos" />
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Active Filters */}
      {(searchTerm ||
        Object.values(columnFilters).some((f) => f?.length > 0)) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6"
        >
          {searchTerm && (
            <div className="flex items-center bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              <span>BÃºsqueda: &quot;{searchTerm}&quot;</span>
              <button
                onClick={() => setSearchTerm("")}
                className="ml-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {Object.entries(columnFilters).map(
            ([column, values]) =>
              values.length > 0 && (
                <div
                  key={column}
                  className="flex items-center bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm"
                >
                  <span>
                    {columns.find((c) => c.key === column)?.label}:{" "}
                    {values.length} filtro(s)
                  </span>
                  <button
                    onClick={() => clearColumnFilter(column)}
                    className="ml-2 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ),
          )}
        </motion.div>
      )}

      {/* Summary Cards */}
      {contratos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          data-tour-id="mgmt-contratos-stats"
        >
          <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Contratos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.filteredCount}
                  {stats.filteredCount !== stats.totalContratos && (
                    <span className="text-sm text-gray-500 ml-1">
                      / {stats.totalContratos}
                    </span>
                  )}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Valor Contratado
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCompactCurrency(stats.totalValorContrato)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Valor Pagado
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCompactCurrency(stats.totalValorPagado)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.porcentajePagado.toFixed(1)}% ejecutado
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Centros Gestores
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.centrosGestores}
                </p>
              </div>
              <Building className="w-8 h-8 text-blue-500 ml-4" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-md p-6 shadow-none border border-gray-200 dark:border-gray-700">
            <div className="flex items-center h-full w-full">
              <div className="flex flex-col justify-center h-full text-left flex-1">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Modalidades
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.modalidades}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.bancos} bancos
                </p>
              </div>
              <Landmark className="w-8 h-8 text-teal-500 ml-4" />
            </div>
          </div>
        </motion.div>
      )}

      {/* MÃ©tricas por Tipo de Contrato */}
      {contratos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 shadow border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                  Contratos SECOP
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {stats.contratosSECOP}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Solo lectura
                </p>
              </div>
              <div className="bg-purple-500 p-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 shadow border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-xs font-medium">
                  Ã“rdenes TVEC
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {stats.ordenesTV}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Solo lectura
                </p>
              </div>
              <div className="bg-green-500 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 shadow border border-orange-200 dark:border-orange-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-xs font-medium">
                  Convenios/Transfer.
                </p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-1">
                  {stats.convenios}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Solo lectura
                </p>
              </div>
              <div className="bg-orange-500 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700 p-4 mb-6"
        data-tour-id="mgmt-contratos-filters"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en todos los campos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" data-column-selector>
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative z-40"
              >
                <Eye className="w-4 h-4" />
                <span>Columnas</span>
              </button>

              {showColumnSelector && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-64 max-w-80">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mostrar Columnas
                      </span>
                      <div className="flex space-x-1">
                        <button
                          onClick={() =>
                            setVisibleColumns(
                              new Set(columns.map((c) => c.key)),
                            )
                          }
                          className="text-xs px-2 py-1 text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          Todas
                        </button>
                        <button
                          onClick={() =>
                            setVisibleColumns(new Set(["numero_contrato"]))
                          }
                          className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          Ninguna
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar columna..."
                          value={columnSearchTerm}
                          onChange={(e) => setColumnSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {columns
                        .filter(
                          (col) =>
                            col.key !== "numero_contrato" &&
                            col.label
                              .toLowerCase()
                              .includes(columnSearchTerm.toLowerCase()),
                        )
                        .map((column) => {
                          const isVisible = visibleColumns.has(column.key);
                          return (
                            <label
                              key={column.key}
                              className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() =>
                                  toggleColumnVisibility(column.key)
                                }
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                              />
                              <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                                {column.label}
                              </span>
                              {isVisible ? (
                                <Eye className="w-4 h-4 text-purple-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(Object.values(columnFilters).some(
              (filters) => filters.length > 0,
            ) ||
              searchTerm) && (
              <button
                onClick={() => {
                  setColumnFilters({});
                  setSearchTerm("");
                }}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar Filtros
              </button>
            )}

            <button
              onClick={() => fetchContratos()}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>{loading ? "Actualizando..." : "Actualizar"}</span>
            </button>

            <button
              onClick={() => setShowAgregarModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>AÃ±adir Convenio o Transferencia</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700"
        data-tour-id="mgmt-contratos-table"
      >
        <div className="overflow-x-auto max-h-[70vh] min-h-[300px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {columnOrder.map((columnKey) => {
                  const column = columns.find((col) => col.key === columnKey);
                  if (!column || !visibleColumns.has(column.key)) return null;

                  const isReferenceColumn = column.key === "numero_contrato";

                  return (
                    <th
                      key={column.key}
                      className={`px-3 py-2 text-left relative border-r border-gray-200 dark:border-gray-600 last:border-r-0 group bg-gray-50 dark:bg-gray-700 
                        ${draggedColumn === column.key ? "opacity-50" : ""}
                        ${dragOverColumn === column.key ? "bg-purple-100 dark:bg-purple-900" : ""}
                      `}
                      style={{
                        width: `${getColumnWidth(column.key)}px`,
                        minWidth: "80px",
                      }}
                      draggable={!isReferenceColumn}
                      onDragStart={(e) => handleDragStart(e, column.key)}
                      onDragOver={(e) => handleDragOver(e, column.key)}
                      onDrop={handleDrop}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center space-x-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <span className="truncate">{column.label}</span>
                          {getSortIcon(column.key)}
                        </button>

                        <div
                          className="relative"
                          ref={(el) => {
                            filtersRef.current[column.key] = el;
                          }}
                        >
                          <button
                            onClick={() =>
                              setShowFilters((prev) => ({
                                ...prev,
                                [column.key]: !prev[column.key],
                              }))
                            }
                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative ${
                              columnFilters[column.key]?.length > 0
                                ? "text-purple-500"
                                : "text-gray-400"
                            }`}
                          >
                            <Filter className="w-3 h-3" />
                            {columnFilters[column.key]?.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                {columnFilters[column.key].length}
                              </span>
                            )}
                          </button>

                          {showFilters[column.key] && (
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48 max-w-64">
                              <div className="p-2">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Filtro mÃºltiple
                                  </span>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() =>
                                        clearColumnFilter(column.key)
                                      }
                                      className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                    >
                                      Limpiar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setColumnFilters((prev) => ({
                                          ...prev,
                                          [column.key]: getUniqueValues(
                                            column.key,
                                          ),
                                        }));
                                      }}
                                      className="text-xs px-2 py-1 text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                    >
                                      Todos
                                    </button>
                                  </div>
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {getUniqueValues(column.key).map((value) => {
                                    const isSelected =
                                      columnFilters[column.key]?.includes(
                                        value,
                                      ) || false;
                                    return (
                                      <label
                                        key={value}
                                        className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const currentFilters =
                                              columnFilters[column.key] || [];
                                            if (e.target.checked) {
                                              setColumnFilters((prev) => ({
                                                ...prev,
                                                [column.key]: [
                                                  ...currentFilters,
                                                  value,
                                                ],
                                              }));
                                            } else {
                                              setColumnFilters((prev) => ({
                                                ...prev,
                                                [column.key]:
                                                  currentFilters.filter(
                                                    (v) => v !== value,
                                                  ),
                                              }));
                                            }
                                          }}
                                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                        <span
                                          className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate"
                                          title={String(value)}
                                        >
                                          {formatValue(value, column.key)}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>

                                {columnFilters[column.key]?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {columnFilters[column.key].length} de{" "}
                                      {getUniqueValues(column.key).length}{" "}
                                      seleccionados
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-purple-300 dark:hover:bg-purple-600 transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                        onMouseDown={(e) => handleMouseDown(e, column.key)}
                      />
                    </th>
                  );
                })}

                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 sticky right-0 top-0 bg-gray-50 dark:bg-gray-700 w-24 z-20 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedContratos.map((contrato, index) => (
                <motion.tr
                  key={contrato.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {columnOrder.map((columnKey) => {
                    const column = columns.find((col) => col.key === columnKey);
                    if (!column || !visibleColumns.has(column.key)) return null;

                    const cellValue = column.accessor
                      ? column.accessor(contrato)
                      : contrato[column.key];

                    // Renderizado especial para columna de tipo
                    if (column.key === "tipo_origen") {
                      const tipo = getTipoContrato(contrato);
                      const colorClass =
                        tipo === "Orden TVEC"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : tipo === "Convenio/Transferencia"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";

                      return (
                        <td
                          key={column.key}
                          className="px-3 py-2 text-xs border-r border-gray-100 dark:border-gray-700"
                          style={{
                            width: `${getColumnWidth(column.key)}px`,
                            maxWidth: `${getColumnWidth(column.key)}px`,
                          }}
                        >
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                          >
                            {tipo}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={column.key}
                        className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700"
                        style={{
                          width: `${getColumnWidth(column.key)}px`,
                          maxWidth: `${getColumnWidth(column.key)}px`,
                        }}
                      >
                        <div className="max-w-full overflow-hidden">
                          <span
                            className="block truncate"
                            title={String(cellValue || "")}
                          >
                            {formatValue(cellValue, column.key)}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700 sticky right-0 bg-white dark:bg-gray-800 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center space-x-2">
                      {/* BotÃ³n para cargar RPC - siempre visible */}
                      <button
                        onClick={() => {
                          setSelectedContratoForRPC(contrato);
                          setShowCargarRPCModal(true);
                        }}
                        className="p-1.5 rounded transition-colors text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 relative"
                        title="Cargar RPC"
                      >
                        <Upload className="w-4 h-4" />
                        {(() => {
                          const count = obtenerRPCsDeContrato(contrato).length;
                          return count > 0 ? (
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                              {count}
                            </span>
                          ) : null;
                        })()}
                      </button>

                      {/* BotÃ³n para ver documentos RPC (solo si tiene documentos) */}
                      {tieneDocumentosRPC(contrato) && (
                        <button
                          onClick={() => handleOpenDocumentosRPC(contrato)}
                          className="p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          title="Ver documentos RPC"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* BotÃ³n editar datos del contrato */}
                      <button
                        onClick={() =>
                          setModalEditContrato({ open: true, contrato })
                        }
                        className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                        title="Editar datos del contrato"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PaginaciÃ³n */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
              {Math.min(currentPage * itemsPerPage, allContratos.length)} de{" "}
              {allContratos.length} contratos
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                PÃ¡gina {currentPage} de {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-colors"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal para agregar convenio o transferencia */}
      <AgregarConvenioTransferenciaModal
        isOpen={showAgregarModal}
        onClose={() => {
          setShowAgregarModal(false);
        }}
        onSuccess={handleAgregarContratoSuccess}
      />

      {/* Modal de Cargar RPC */}
      <CargarRPCModal
        isOpen={showCargarRPCModal}
        onClose={() => {
          setShowCargarRPCModal(false);
          setSelectedContratoForRPC(null);
        }}
        onSuccess={() => {
          fetchContratos();
          fetchRPCs();
        }}
        contratoData={selectedContratoForRPC}
        rpcsExistentes={
          selectedContratoForRPC
            ? obtenerRPCsDeContrato(selectedContratoForRPC)
            : []
        }
        onEditRPC={(rpc) => {
          setShowCargarRPCModal(false);
          setSelectedRPCForEdit(rpc);
          setShowEditarRPCModal(true);
        }}
      />

      {/* Modal de Editar RPC */}
      <EditarRPCModal
        isOpen={showEditarRPCModal}
        onClose={() => {
          setShowEditarRPCModal(false);
          setSelectedRPCForEdit(null);
        }}
        onSuccess={() => {
          fetchContratos();
          fetchRPCs();
        }}
        rpcData={selectedRPCForEdit}
        contratoData={selectedContratoForRPC}
      />

      {/* Modal editar datos del contrato */}
      <AnimatePresence>
        {modalEditContrato.open && modalEditContrato.contrato && (
          <EditContratoModal
            contrato={modalEditContrato.contrato}
            onClose={() =>
              setModalEditContrato({ open: false, contrato: null })
            }
            onSuccess={() => {
              setModalEditContrato({ open: false, contrato: null });
              fetchContratos(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal de Documentos RPC */}
      <AnimatePresence>
        {showDocumentosRPCModal && selectedContratoForDocs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-md shadow-none border border-gray-200 dark:border-gray-700 w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Documentos RPC
                    </h2>
                    <p className="text-sm text-white/80">
                      {selectedContratoForDocs.referencia_contrato ||
                        selectedContratoForDocs.numero_contrato}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDocumentosModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content: sidebar list + PDF viewer */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: lista de RPCs y documentos */}
                <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                  {(() => {
                    const rpcsDelContrato = obtenerRPCsDeContrato(
                      selectedContratoForDocs,
                    );
                    if (rpcsDelContrato.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay RPCs registrados</p>
                        </div>
                      );
                    }
                    return rpcsDelContrato.map((rpc) => {
                      const docs = getDocumentosDeRPC(rpc);
                      return (
                        <div
                          key={rpc.id}
                          className="border-b border-gray-200 dark:border-gray-700"
                        >
                          {/* RPC header */}
                          <div className="px-4 py-3 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                RPC {rpc.numero_rpc}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  rpc.estado === "activo"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                {rpc.estado_liberacion || rpc.estado || "N/A"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {rpc.beneficiario_nombre || "Sin beneficiario"}
                            </p>
                            {rpc.valor_rpc && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ${rpc.valor_rpc.toLocaleString("es-CO")}
                              </p>
                            )}
                          </div>
                          {/* Documentos del RPC */}
                          {docs.length > 0 ? (
                            docs.map((doc, idx) => {
                              const remoteUrl = getDocRemoteUrl(doc);
                              const isSelected = selectedDocUrl === remoteUrl;
                              return (
                                <div
                                  key={idx}
                                  className={`px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                                    isSelected
                                      ? "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSelectDoc(doc);
                                  }}
                                >
                                  <FileText
                                    className={`w-4 h-4 flex-shrink-0 ${
                                      isSelected
                                        ? "text-orange-600"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-xs truncate ${
                                        isSelected
                                          ? "font-semibold text-orange-700 dark:text-orange-400"
                                          : "text-gray-700 dark:text-gray-300"
                                      }`}
                                    >
                                      {doc.filename}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {formatFileSize(doc.size)} Â·{" "}
                                      {doc.content_type
                                        .split("/")[1]
                                        ?.toUpperCase() || "DOC"}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const downloadUrl =
                                        getDocDownloadUrl(doc);
                                      window.open(downloadUrl, "_blank");
                                    }}
                                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex-shrink-0"
                                    title="Descargar documento"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
                              Sin documentos adjuntos
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
                  {loadingDoc ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-500">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm">Cargando documento...</p>
                      </div>
                    </div>
                  ) : selectedDocBlobUrl ? (
                    <iframe
                      src={selectedDocBlobUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      title="Vista previa del documento RPC"
                    />
                  ) : selectedDocUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-red-400 dark:text-red-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                          No se pudo cargar la vista previa
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-400 dark:text-gray-500">
                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                          Selecciona un documento para previsualizarlo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                {selectedDocBlobUrl && (
                  <a
                    href={selectedDocBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Abrir en Nueva PestaÃ±a</span>
                  </a>
                )}
                <button
                  onClick={handleCloseDocumentosModal}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm ml-auto"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionContratos;

// ── Modal Editar Datos del Contrato ───────────────────────────────────────────

// Field DEBE estar fuera de EditContratoModal para evitar que React lo desmonte
// y remonte en cada keystroke (perder foco al escribir).
const ContratoFormField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
    />
  </div>
);

const EditContratoModal: React.FC<{
  contrato: ContratoEmprestito;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ contrato, onClose, onSuccess }) => {
  const refContrato =
    contrato.referencia_contrato || contrato.numero_contrato || "";

  const [form, setForm] = useState({
    nombre_resumido_proceso: contrato.nombre_resumido_proceso || "",
    objeto_contrato: contrato.objeto_contrato || "",
    estado_contrato: contrato.estado_contrato || (contrato as any).estado || "",
    supervisor: contrato.supervisor || "",
    nombre_centro_gestor: contrato.nombre_centro_gestor || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Valor original que se usó para inicializar el form
  const originalValues: Record<string, string> = {
    nombre_resumido_proceso: contrato.nombre_resumido_proceso || "",
    objeto_contrato: contrato.objeto_contrato || "",
    estado_contrato: contrato.estado_contrato || (contrato as any).estado || "",
    supervisor: contrato.supervisor || "",
    nombre_centro_gestor: contrato.nombre_centro_gestor || "",
  };

  const changed = Object.entries(form).reduce<Record<string, string>>(
    (acc, [k, v]) => {
      const original = originalValues[k] ?? "";
      if (v.trim() !== original.trim()) acc[k] = v.trim();
      return acc;
    },
    {},
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refContrato) {
      setError("No se encontró la referencia del contrato");
      return;
    }
    if (Object.keys(changed).length === 0) {
      setError("No hay cambios para guardar");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // nombre_resumido_proceso vive en procesos_emprestito → usar modificar-proceso
      const { nombre_resumido_proceso, ...contratoChanges } = changed as any;

      if (nombre_resumido_proceso !== undefined) {
        const refProceso = contrato.referencia_proceso;
        if (!refProceso) {
          throw new Error(
            "Este contrato no tiene referencia_proceso; no se puede actualizar el nombre del proceso.",
          );
        }
        await editarNombreResumidoProceso(refProceso, nombre_resumido_proceso);
      }

      // Campos de contratos_emprestito
      if (Object.keys(contratoChanges).length > 0) {
        await patchContratoEmprestito(refContrato, contratoChanges);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const modal = e.currentTarget;
    const focusable = Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const set = (field: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [field]: v }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base font-semibold text-white">
                Editar Contrato
              </h2>
              <p className="text-xs text-white/80 font-mono">{refContrato}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <ContratoFormField
            label="Nombre resumido proceso"
            value={form.nombre_resumido_proceso}
            onChange={set("nombre_resumido_proceso")}
            required
          />
          <ContratoFormField
            label="Objeto del contrato"
            value={form.objeto_contrato}
            onChange={set("objeto_contrato")}
          />
          <ContratoFormField
            label="Estado contrato"
            value={form.estado_contrato}
            onChange={set("estado_contrato")}
          />
          <ContratoFormField
            label="Supervisor"
            value={form.supervisor}
            onChange={set("supervisor")}
          />
          <ContratoFormField
            label="Centro gestor"
            value={form.nombre_centro_gestor}
            onChange={set("nombre_centro_gestor")}
          />

          {Object.keys(changed).length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Campos a guardar:{" "}
              <span className="font-mono">
                {Object.keys(changed).join(", ")}
              </span>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(changed).length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
