"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import DOMPurify from "dompurify";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eye,
  Code2,
  Undo2,
  Redo2,
  Eraser,
  Paintbrush2,
  Palette,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
  /** Tamaño máximo (bytes) para imágenes pegadas/insertadas. Default 1 MB */
  maxImageBytes?: number;
  className?: string;
}

type ToolbarButton =
  | {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      command?: string;
      value?: string;
      block?: string;
      divider?: never;
    }
  | {
      divider: true;
    };

const DEFAULT_MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB

const FONT_FAMILIES = [
  { label: "Sans-serif", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [
  { label: "Pequeño", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Mediano", value: "4" },
  { label: "Grande", value: "5" },
  { label: "Muy grande", value: "6" },
  { label: "Máximo", value: "7" },
];

const TEXT_COLORS = [
  "#111827",
  "#374151",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0284c7",
  "#1a56db",
  "#7c3aed",
  "#db2777",
];

const HIGHLIGHT_COLORS = [
  "transparent",
  "#fef3c7",
  "#dbeafe",
  "#dcfce7",
  "#fee2e2",
  "#ede9fe",
  "#ffe4e6",
];

/**
 * Editor WYSIWYG ligero basado en `contenteditable` + `document.execCommand`.
 * No requiere dependencias externas. Mantiene compatibilidad con la mayoría
 * de clientes de correo al usar HTML inline simple.
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido del correo...",
  minHeight = 280,
  disabled = false,
  maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<
    null | "text" | "highlight"
  >(null);
  const editorId = useId();

  // Sincronizar value (solo cuando difiere para no mover el cursor).
  // Sanitizar con DOMPurify antes de asignar para evitar XSS en el editor.
  useEffect(() => {
    if (!editorRef.current) return;
    const clean = DOMPurify.sanitize(value || "", { USE_PROFILES: { html: true } });
    if (editorRef.current.innerHTML !== clean) {
      editorRef.current.innerHTML = clean;
    }
  }, [value]);

  const focusEditor = useCallback(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, val?: string) => {
      if (disabled) return;
      focusEditor();
      try {
        document.execCommand(command, false, val);
      } catch (err) {
        console.warn(`execCommand ${command} failed`, err);
      }
      handleInput();
    },
    [disabled, focusEditor, handleInput],
  );

  const execBlock = useCallback(
    (block: string) => {
      exec("formatBlock", block);
    },
    [exec],
  );

  const handleInsertLink = useCallback(() => {
    const url = window.prompt("URL del enlace (incluye https://):", "https://");
    if (!url) return;
    exec("createLink", url);
  }, [exec]);

  const handleClickImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        window.alert("El archivo seleccionado no es una imagen.");
        return;
      }
      if (file.size > maxImageBytes) {
        window.alert(
          `La imagen excede el tamaño máximo permitido de ${(
            maxImageBytes /
            1024 /
            1024
          ).toFixed(1)} MB.`,
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        if (dataUrl) {
          exec(
            "insertHTML",
            `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;" />`,
          );
        }
      };
      reader.readAsDataURL(file);
    },
    [exec, maxImageBytes],
  );

  const handleImageInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await insertImageFromFile(file);
      e.target.value = "";
    },
    [insertImageFromFile],
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await insertImageFromFile(file);
          return;
        }
      }
    },
    [insertImageFromFile],
  );

  const handleClearFormat = useCallback(() => {
    exec("removeFormat");
    exec("unlink");
  }, [exec]);

  const handleFontChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value) exec("fontName", e.target.value);
    },
    [exec],
  );

  const handleSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (e.target.value) exec("fontSize", e.target.value);
    },
    [exec],
  );

  const toolbarButtons: ToolbarButton[] = useMemo(
    () => [
      { icon: Undo2, label: "Deshacer", command: "undo" },
      { icon: Redo2, label: "Rehacer", command: "redo" },
      { divider: true },
      { icon: Bold, label: "Negrita", command: "bold" },
      { icon: Italic, label: "Cursiva", command: "italic" },
      { icon: Underline, label: "Subrayado", command: "underline" },
      { icon: Strikethrough, label: "Tachado", command: "strikeThrough" },
      { divider: true },
      { icon: Heading1, label: "Título 1", block: "h1" },
      { icon: Heading2, label: "Título 2", block: "h2" },
      { icon: Heading3, label: "Título 3", block: "h3" },
      { divider: true },
      { icon: List, label: "Lista", command: "insertUnorderedList" },
      {
        icon: ListOrdered,
        label: "Lista numerada",
        command: "insertOrderedList",
      },
      { icon: Quote, label: "Cita", block: "blockquote" },
      { divider: true },
      {
        icon: AlignLeft,
        label: "Alinear a la izquierda",
        command: "justifyLeft",
      },
      { icon: AlignCenter, label: "Centrar", command: "justifyCenter" },
      {
        icon: AlignRight,
        label: "Alinear a la derecha",
        command: "justifyRight",
      },
      { icon: AlignJustify, label: "Justificar", command: "justifyFull" },
    ],
    [],
  );

  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-2 py-2 rounded-t-xl">
        {toolbarButtons.map((btn, idx) => {
          if ("divider" in btn) {
            return (
              <div
                key={`div-${idx}`}
                className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600"
              />
            );
          }
          const Icon = btn.icon;
          return (
            <button
              key={`${btn.label}-${idx}`}
              type="button"
              title={btn.label}
              aria-label={btn.label}
              disabled={disabled}
              onClick={() => {
                if (btn.block) execBlock(btn.block);
                else if (btn.command) exec(btn.command, btn.value);
              }}
              className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}

        <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Color de texto */}
        <div className="relative">
          <button
            type="button"
            title="Color de texto"
            aria-label="Color de texto"
            disabled={disabled}
            onClick={() =>
              setShowColorPicker((prev) => (prev === "text" ? null : "text"))
            }
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker === "text" && (
            <div className="absolute z-30 mt-1 left-0 grid grid-cols-5 gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    exec("foreColor", color);
                    setShowColorPicker(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Color de resaltado */}
        <div className="relative">
          <button
            type="button"
            title="Color de resaltado"
            aria-label="Color de resaltado"
            disabled={disabled}
            onClick={() =>
              setShowColorPicker((prev) =>
                prev === "highlight" ? null : "highlight",
              )
            }
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
          >
            <Paintbrush2 className="w-4 h-4" />
          </button>
          {showColorPicker === "highlight" && (
            <div className="absolute z-30 mt-1 left-0 grid grid-cols-4 gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded-md border border-gray-200 dark:border-gray-600"
                  style={{
                    backgroundColor:
                      color === "transparent" ? "#ffffff" : color,
                    backgroundImage:
                      color === "transparent"
                        ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)"
                        : "none",
                    backgroundSize: "6px 6px",
                    backgroundPosition: "0 0, 3px 3px",
                  }}
                  onClick={() => {
                    exec(
                      "hiliteColor",
                      color === "transparent" ? "transparent" : color,
                    );
                    setShowColorPicker(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        {/* Fuente */}
        <select
          aria-label="Tipo de letra"
          disabled={disabled}
          onChange={handleFontChange}
          defaultValue=""
          className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
        >
          <option value="" disabled>
            Fuente
          </option>
          {FONT_FAMILIES.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Tamaño de letra"
          disabled={disabled}
          onChange={handleSizeChange}
          defaultValue=""
          className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 text-gray-700 dark:text-gray-200"
        >
          <option value="" disabled>
            Tamaño
          </option>
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <div className="mx-1 h-6 w-px bg-gray-300 dark:bg-gray-600" />

        <button
          type="button"
          title="Insertar enlace"
          aria-label="Insertar enlace"
          disabled={disabled}
          onClick={handleInsertLink}
          className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Insertar imagen"
          aria-label="Insertar imagen"
          disabled={disabled}
          onClick={handleClickImage}
          className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInput}
        />

        <button
          type="button"
          title="Limpiar formato"
          aria-label="Limpiar formato"
          disabled={disabled}
          onClick={handleClearFormat}
          className="p-1.5 rounded-md text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title="Ver código HTML"
            aria-label="Ver código HTML"
            onClick={() => {
              setShowHtmlSource((v) => !v);
              setShowPreview(false);
            }}
            className={`p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 ${
              showHtmlSource
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Previsualizar"
            aria-label="Previsualizar"
            onClick={() => {
              setShowPreview((v) => !v);
              setShowHtmlSource(false);
            }}
            className={`p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 ${
              showPreview
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área de edición / preview / source */}
      {showPreview ? (
        <div
          className="prose prose-sm dark:prose-invert max-w-none p-4 overflow-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(value || "", { USE_PROFILES: { html: true } }),
          }}
        />
      ) : showHtmlSource ? (
        <textarea
          id={editorId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 font-mono text-xs bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 outline-none rounded-b-xl"
          style={{ minHeight }}
        />
      ) : (
        <div
          id={editorId}
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className="rte-content p-4 overflow-auto outline-none text-sm leading-relaxed text-gray-800 dark:text-gray-100"
          style={{ minHeight }}
        />
      )}

      {/* Espejo invisible para validación HTML5 (required) */}
      <textarea
        tabIndex={-1}
        aria-hidden="true"
        className="rte-mirror"
        value={value}
        onChange={() => {
          /* no-op: la fuente real es el contenteditable */
        }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          clip: "rect(0 0 0 0)",
          overflow: "hidden",
        }}
      />

      <style jsx>{`
        .rte-content[contenteditable="true"]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .rte-content :global(blockquote) {
          border-left: 3px solid #cbd5e1;
          padding: 4px 12px;
          color: #475569;
          margin: 8px 0;
        }
        .rte-content :global(h1) {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.5em 0;
        }
        .rte-content :global(h2) {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0.4em 0;
        }
        .rte-content :global(h3) {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0.4em 0;
        }
        .rte-content :global(ul) {
          list-style: disc;
          padding-left: 1.5rem;
        }
        .rte-content :global(ol) {
          list-style: decimal;
          padding-left: 1.5rem;
        }
        .rte-content :global(a) {
          color: #1a56db;
          text-decoration: underline;
        }
        .rte-content :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
