"use client";

import React, { useState, useRef, useCallback } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  parseInput?: (text: string) => number | null;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  trackColor?: string;
  onClear?: () => void;
  /** Use logarithmic scale — gives more resolution to smaller values */
  logarithmic?: boolean;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => v.toString(),
  parseInput,
  label,
  icon,
  disabled = false,
  trackColor = '#3B82F6',
  onClear,
  logarithmic = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [editMinText, setEditMinText] = useState('');
  const [editMaxText, setEditMaxText] = useState('');

  // Log-scale helpers: shift by 1 so log(0) is handled
  const toLog = (v: number) => Math.log1p(v - min);
  const fromLog = (l: number) => Math.expm1(l) + min;
  const logMin = logarithmic ? toLog(min) : 0;
  const logMax = logarithmic ? toLog(max) : 0;
  const logRange = logMax - logMin || 1;

  const range = max - min || 1;

  const valueToPercent = (v: number) => {
    if (logarithmic) return ((toLog(v) - logMin) / logRange) * 100;
    return ((v - min) / range) * 100;
  };

  const leftPercent = valueToPercent(value[0]);
  const rightPercent = valueToPercent(value[1]);

  const clamp = useCallback(
    (raw: number): number => {
      const clamped = Math.min(max, Math.max(min, raw));
      return Math.round(clamped / step) * step;
    },
    [min, max, step]
  );

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      if (logarithmic) {
        const logVal = logMin + fraction * logRange;
        return clamp(fromLog(logVal));
      }
      return clamp(min + fraction * range);
    },
    [min, range, clamp, logarithmic, logMin, logRange]
  );

  const handlePointerDown = useCallback(
    (thumb: 'min' | 'max') => (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(thumb);
    },
    [disabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const newVal = getValueFromPosition(e.clientX);
      if (dragging === 'min') {
        onChange([Math.min(newVal, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + step)]);
      }
    },
    [dragging, getValueFromPosition, onChange, value, step]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      const newVal = getValueFromPosition(e.clientX);
      const distToMin = Math.abs(newVal - value[0]);
      const distToMax = Math.abs(newVal - value[1]);
      if (distToMin <= distToMax) {
        onChange([Math.min(newVal, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newVal, value[0] + step)]);
      }
    },
    [disabled, getValueFromPosition, onChange, value, step]
  );

  // Editable input handlers
  const commitMinEdit = () => {
    setEditingMin(false);
    const parsed = parseInput ? parseInput(editMinText) : parseFloat(editMinText);
    if (parsed !== null && !isNaN(parsed)) {
      const clamped = clamp(parsed);
      onChange([Math.min(clamped, value[1] - step), value[1]]);
    }
  };

  const commitMaxEdit = () => {
    setEditingMax(false);
    const parsed = parseInput ? parseInput(editMaxText) : parseFloat(editMaxText);
    if (parsed !== null && !isNaN(parsed)) {
      const clamped = clamp(parsed);
      onChange([value[0], Math.max(clamped, value[0] + step)]);
    }
  };

  const hasActiveRange = value[0] > min || value[1] < max;

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header con label y botón limpiar */}
      {(label || onClear) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="flex items-center space-x-1 text-[11px] font-medium text-gray-600 dark:text-gray-400">
              {icon && <span className="inline-flex">{icon}</span>}
              <span>{label}</span>
            </label>
          )}
          {onClear && hasActiveRange && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Editable value labels */}
      <div className="flex items-center justify-between gap-1">
        {editingMin ? (
          <input
            autoFocus
            type="text"
            className="w-20 text-[11px] font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-blue-400 dark:border-blue-500 px-1.5 py-0.5 rounded outline-none"
            value={editMinText}
            onChange={(e) => setEditMinText(e.target.value)}
            onBlur={commitMinEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMinEdit(); if (e.key === 'Escape') setEditingMin(false); }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setEditMinText(String(value[0])); setEditingMin(true); }}
            className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-text"
            title="Click para editar"
          >
            {formatLabel(value[0])}
          </button>
        )}
        <span className="text-gray-400 dark:text-gray-500 text-[10px]">—</span>
        {editingMax ? (
          <input
            autoFocus
            type="text"
            className="w-20 text-[11px] font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-blue-400 dark:border-blue-500 px-1.5 py-0.5 rounded outline-none"
            value={editMaxText}
            onChange={(e) => setEditMaxText(e.target.value)}
            onBlur={commitMaxEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') commitMaxEdit(); if (e.key === 'Escape') setEditingMax(false); }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setEditMaxText(String(value[1])); setEditingMax(true); }}
            className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-text"
            title="Click para editar"
          >
            {formatLabel(value[1])}
          </button>
        )}
      </div>

      {/* Track del slider */}
      <div
        ref={trackRef}
        className="relative h-5 flex items-center cursor-pointer select-none touch-none"
        onClick={handleTrackClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Base track */}
        <div className="absolute inset-x-0 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />

        {/* Active range */}
        <div
          className="absolute h-1 rounded-full transition-colors"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
            backgroundColor: trackColor,
          }}
        />

        {/* Min thumb */}
        <div
          className={`absolute w-3.5 h-3.5 rounded-full bg-white border-2 shadow-sm transition-shadow cursor-grab ${
            dragging === 'min' ? 'shadow-md scale-110 cursor-grabbing' : 'hover:shadow-md'
          }`}
          style={{
            left: `${leftPercent}%`,
            transform: 'translateX(-50%)',
            borderColor: trackColor,
            zIndex: dragging === 'min' ? 10 : 5,
          }}
          onPointerDown={handlePointerDown('min')}
        />

        {/* Max thumb */}
        <div
          className={`absolute w-3.5 h-3.5 rounded-full bg-white border-2 shadow-sm transition-shadow cursor-grab ${
            dragging === 'max' ? 'shadow-md scale-110 cursor-grabbing' : 'hover:shadow-md'
          }`}
          style={{
            left: `${rightPercent}%`,
            transform: 'translateX(-50%)',
            borderColor: trackColor,
            zIndex: dragging === 'max' ? 10 : 5,
          }}
          onPointerDown={handlePointerDown('max')}
        />
      </div>
    </div>
  );
};

export default DualRangeSlider;
