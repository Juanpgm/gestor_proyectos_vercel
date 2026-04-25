"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { Ruler, PenTool, Trash2, X, Check, ChevronDown } from 'lucide-react';

type MeasureMode = 'none' | 'distance' | 'area';
type AreaUnit = 'm2' | 'km2' | 'ha';

const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  m2: 'm²',
  km2: 'km²',
  ha: 'ha',
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(1)} m`;
}

function formatArea(sqMeters: number, unit: AreaUnit): string {
  switch (unit) {
    case 'km2':
      return `${(sqMeters / 1_000_000).toFixed(4)} km²`;
    case 'ha':
      return `${(sqMeters / 10_000).toFixed(2)} ha`;
    case 'm2':
    default:
      return `${sqMeters.toFixed(1)} m²`;
  }
}

const MapMeasureTool: React.FC = () => {
  const map = useMap();
  const [mode, setMode] = useState<MeasureMode>('none');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('m2');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalArea, setTotalArea] = useState(0);
  const [finalized, setFinalized] = useState(false);
  const finalizedRef = useRef(false);
  const pointsRef = useRef<L.LatLng[]>([]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const labelsRef = useRef<L.Tooltip[]>([]);

  // Prevent clicks on toolbar from propagating to Leaflet map
  useEffect(() => {
    const el = toolbarRef.current;
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  }, []);
  const previewLineRef = useRef<L.Polyline | null>(null);
  const resultTooltipRef = useRef<L.Tooltip | null>(null);

  const clearMeasurements = useCallback(() => {
    finalizedRef.current = false;
    polylineRef.current?.remove();
    polylineRef.current = null;
    polygonRef.current?.remove();
    polygonRef.current = null;
    previewLineRef.current?.remove();
    previewLineRef.current = null;
    resultTooltipRef.current?.remove();
    resultTooltipRef.current = null;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    labelsRef.current.forEach(t => t.remove());
    labelsRef.current = [];
    pointsRef.current = [];
    setPoints([]);
    setTotalDistance(0);
    setTotalArea(0);
    setFinalized(false);
  }, []);

  const handleModeChange = useCallback((newMode: MeasureMode) => {
    clearMeasurements();
    setMode(prev => prev === newMode ? 'none' : newMode);
  }, [clearMeasurements]);

  const calculateTotalDistance = useCallback((pts: L.LatLng[]): number => {
    if (pts.length < 2) return 0;
    const coords = pts.map(p => [p.lng, p.lat] as [number, number]);
    const line = turf.lineString(coords);
    return turf.length(line, { units: 'meters' });
  }, []);

  const calculateArea = useCallback((pts: L.LatLng[]): number => {
    if (pts.length < 3) return 0;
    const coords = pts.map(p => [p.lng, p.lat] as [number, number]);
    coords.push(coords[0]);
    const poly = turf.polygon([coords]);
    return turf.area(poly);
  }, []);

  const redraw = useCallback((pts: L.LatLng[], currentMode: MeasureMode) => {
    polylineRef.current?.remove();
    polylineRef.current = null;
    polygonRef.current?.remove();
    polygonRef.current = null;
    resultTooltipRef.current?.remove();
    resultTooltipRef.current = null;
    labelsRef.current.forEach(t => t.remove());
    labelsRef.current = [];

    if (pts.length < 2) return;

    const latLngs = pts.map(p => [p.lat, p.lng] as [number, number]);

    if (currentMode === 'distance') {
      polylineRef.current = L.polyline(latLngs, {
        color: '#3B82F6',
        weight: 3,
        dashArray: '8, 6',
        opacity: 0.9,
      }).addTo(map);

      for (let i = 1; i < pts.length; i++) {
        const segCoords: [number, number][] = [
          [pts[i - 1].lng, pts[i - 1].lat],
          [pts[i].lng, pts[i].lat],
        ];
        const segLine = turf.lineString(segCoords);
        const segDist = turf.length(segLine, { units: 'meters' });
        const midLat = (pts[i - 1].lat + pts[i].lat) / 2;
        const midLng = (pts[i - 1].lng + pts[i].lng) / 2;

        const tooltip = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'measure-segment-label',
        })
          .setLatLng([midLat, midLng])
          .setContent(formatDistance(segDist))
          .addTo(map);
        labelsRef.current.push(tooltip);
      }
    } else if (currentMode === 'area') {
      const closedLatLngs = [...latLngs, latLngs[0]];
      polygonRef.current = L.polygon(closedLatLngs, {
        color: '#8B5CF6',
        weight: 2,
        fillColor: '#8B5CF6',
        fillOpacity: 0.15,
        dashArray: '6, 4',
      }).addTo(map);

      const allPts = [...pts, pts[0]];
      for (let i = 1; i < allPts.length; i++) {
        const segCoords: [number, number][] = [
          [allPts[i - 1].lng, allPts[i - 1].lat],
          [allPts[i].lng, allPts[i].lat],
        ];
        const segLine = turf.lineString(segCoords);
        const segDist = turf.length(segLine, { units: 'meters' });
        const midLat = (allPts[i - 1].lat + allPts[i].lat) / 2;
        const midLng = (allPts[i - 1].lng + allPts[i].lng) / 2;

        const tooltip = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'measure-segment-label',
        })
          .setLatLng([midLat, midLng])
          .setContent(formatDistance(segDist))
          .addTo(map);
        labelsRef.current.push(tooltip);
      }
    }
  }, [map]);

  // Confirmar trazado (check)
  const finalizeMeasurement = useCallback(() => {
    finalizedRef.current = true;
    previewLineRef.current?.remove();
    previewLineRef.current = null;
    map.getContainer().style.cursor = '';
    setFinalized(true);
  }, [map]);

  useEffect(() => {
    if (mode === 'none' || finalized) return;

    const container = map.getContainer();
    container.style.cursor = 'crosshair';

    const onClick = (e: L.LeafletMouseEvent) => {
      // Ignore clicks that originated from the toolbar UI
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target && toolbarRef.current?.contains(target)) return;
      if (finalizedRef.current) return;

      const latlng = e.latlng;

      setPoints(prev => {
        const next = [...prev, latlng];
        pointsRef.current = next;

        const marker = L.circleMarker(latlng, {
          radius: 5,
          color: mode === 'distance' ? '#3B82F6' : '#8B5CF6',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        markersRef.current.push(marker);

        if (mode === 'distance') {
          const dist = calculateTotalDistance(next);
          setTotalDistance(dist);
        } else if (mode === 'area' && next.length >= 3) {
          const area = calculateArea(next);
          setTotalArea(area);
        }
        redraw(next, mode);
        return next;
      });
    };

    const onMouseMove = (e: L.LeafletMouseEvent) => {
      if (finalizedRef.current) return;
      const pts = pointsRef.current;
      if (pts.length === 0) return;
      const last = pts[pts.length - 1];
      previewLineRef.current?.remove();
      previewLineRef.current = L.polyline(
        [[last.lat, last.lng], [e.latlng.lat, e.latlng.lng]],
        {
          color: mode === 'distance' ? '#3B82F6' : '#8B5CF6',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.5,
        }
      ).addTo(map);
    };

    const onDblClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e as any);
      L.DomEvent.preventDefault(e as any);
      finalizeMeasurement();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearMeasurements();
        setMode('none');
        container.style.cursor = '';
      }
    };

    map.on('click', onClick);
    map.on('mousemove', onMouseMove);
    map.on('dblclick', onDblClick);
    document.addEventListener('keydown', onKeyDown);
    map.doubleClickZoom.disable();

    return () => {
      container.style.cursor = '';
      map.off('click', onClick);
      map.off('mousemove', onMouseMove);
      map.off('dblclick', onDblClick);
      document.removeEventListener('keydown', onKeyDown);
      map.doubleClickZoom.enable();
      previewLineRef.current?.remove();
      previewLineRef.current = null;
    };
  }, [mode, finalized, map, clearMeasurements, finalizeMeasurement, calculateTotalDistance, calculateArea, redraw]);

  useEffect(() => {
    if (!showUnitDropdown) return;
    const close = () => setShowUnitDropdown(false);
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [showUnitDropdown]);

  const isDrawing = mode !== 'none' && !finalized;
  const hasPoints = points.length > 0;
  const canFinalize = mode === 'distance' ? points.length >= 2 : points.length >= 3;

  return (
    <>
      {/* Toolbar — positioned to the right of the satellite button by the parent container */}
      <div
        ref={toolbarRef}
        className="absolute top-4 left-16 z-[1000]"
      >
        <div className="flex items-start gap-2">
          {/* Mode buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center p-1 space-x-0.5">
            <button
              onClick={() => handleModeChange('distance')}
              className={`p-2 rounded transition-colors ${
                mode === 'distance'
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="Medir distancia"
            >
              <Ruler className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleModeChange('area')}
              className={`p-2 rounded transition-colors ${
                mode === 'area'
                  ? 'bg-purple-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title="Medir área"
            >
              <PenTool className="w-4 h-4" />
            </button>

            {/* Confirm / Clear / Close — visible when drawing */}
            {mode !== 'none' && (
              <>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
                {isDrawing && canFinalize && (
                  <button
                    onClick={finalizeMeasurement}
                    className="p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                    title="Confirmar trazado"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {hasPoints && (
                  <button
                    onClick={clearMeasurements}
                    className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    title="Borrar trazado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { clearMeasurements(); setMode('none'); }}
                  className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                  title="Cerrar herramienta"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Resultado inline */}
          {mode !== 'none' && points.length >= 2 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-sm flex items-center space-x-2">
              {mode === 'distance' && (
                <>
                  <Ruler className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatDistance(totalDistance)}
                  </span>
                </>
              )}
              {mode === 'area' && points.length >= 3 && (
                <>
                  <PenTool className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatArea(totalArea, areaUnit)}
                  </span>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUnitDropdown(!showUnitDropdown); }}
                      className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span>{AREA_UNIT_LABELS[areaUnit]}</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </button>
                    {showUnitDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[56px] z-10">
                        {(Object.keys(AREA_UNIT_LABELS) as AreaUnit[]).map(u => (
                          <button
                            key={u}
                            onClick={(e) => { e.stopPropagation(); setAreaUnit(u); setShowUnitDropdown(false); }}
                            className={`w-full text-left px-2.5 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              areaUnit === u ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {AREA_UNIT_LABELS[u]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Hint text */}
        {isDrawing && (
          <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 rounded px-2 py-0.5 inline-block backdrop-blur-sm">
            Click para añadir puntos · <Check className="w-2.5 h-2.5 inline" /> o doble-click para confirmar · Esc para cancelar
          </div>
        )}
      </div>
    </>
  );
};

export default MapMeasureTool;
