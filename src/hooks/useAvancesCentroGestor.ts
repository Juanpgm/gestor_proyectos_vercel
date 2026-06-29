"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Intervencion } from "@/types/intervenciones";
import { getCurrentIdToken } from "@/lib/firebase";
import { deriveEstadoUP } from "@/utils/estadoUP";

const API_BASE = "/api/proxy";

/** Un avance individual tal como lo devuelve GET /avances_unidades_proyecto */
export interface AvanceUPRaw {
  id: string;
  intervencion_id: string;
  avance_obra: number;
  observaciones: string;
  registrado_por: string;
  created_at: string;
  updated_at: string;
  imagenes_urls: string[];
  documentos_urls: string[];
  total_imagenes: number;
  total_documentos: number;
  total_soportes: number;
  soportes: any[];
}

/** Resumen de un centro gestor para la vista agrupada */
export interface CentroGestorAvancesResumen {
  nombre_centro_gestor: string;
  total_intervenciones: number;
  intervenciones_con_avance: number;
  intervenciones_sin_avance: number;
  intervenciones_completadas: number;
  total_avances: number;
  avances_ultimos_10_dias: number;
  ultimo_avance: string | null;
  primer_avance: string | null;
  avance_obra_promedio: number;
  tiene_alertas: boolean;
  intervenciones: IntervencionConAvances[];
}

/** Intervención enriquecida con historial de avances */
export interface IntervencionConAvances {
  intervencion_id: string;
  upid: string;
  nombre_centro_gestor: string;
  estado: string;
  tipo_intervencion: string;
  avance_obra_intervencion: number;
  presupuesto_base: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  avances: AvanceUPRaw[];
  ultimo_avance: AvanceUPRaw | null;
  tiene_avances: boolean;
  /** Intervención con estado derivado "Terminado" — no requiere más reportes */
  esta_completada: boolean;
}

function calcularDiasAtras(dias: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function parseFecha(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Hook que obtiene avances y los cruza con intervenciones para agrupar por centro gestor
 */
export function useAvancesCentroGestor() {
  const [avances, setAvances] = useState<AvanceUPRaw[]>([]);
  const [intervenciones, setIntervenciones] = useState<Intervencion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getCurrentIdToken();
      const authHeaders: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [avancesRes, intervencionesRes] = await Promise.allSettled([
        fetch(`${API_BASE}/avances_unidades_proyecto`, {
          headers: authHeaders,
        }),
        fetch(`${API_BASE}/intervenciones/?limit=5000`, {
          headers: authHeaders,
        }),
      ]);

      if (avancesRes.status === "fulfilled" && avancesRes.value.ok) {
        const data = await avancesRes.value.json();
        const lista: AvanceUPRaw[] = data.data || data || [];
        lista.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime(),
        );
        setAvances(lista);
      } else {
        throw new Error("Error cargando avances de unidades de proyecto");
      }

      if (
        intervencionesRes.status === "fulfilled" &&
        intervencionesRes.value.ok
      ) {
        const data = await intervencionesRes.value.json();
        setIntervenciones(data.data || data || []);
      } else {
        console.warn("No se pudieron cargar intervenciones");
        setIntervenciones([]);
      }
    } catch (err) {
      console.error("Error en useAvancesCentroGestor:", err);
      setError(err instanceof Error ? err.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mapa de intervencion_id -> avances[]
  const avancesPorIntervencion = useMemo(() => {
    const mapa = new Map<string, AvanceUPRaw[]>();
    for (const a of avances) {
      const id = a.intervencion_id;
      if (!id) continue;
      if (!mapa.has(id)) mapa.set(id, []);
      mapa.get(id)!.push(a);
    }
    return mapa;
  }, [avances]);

  // Intervenciones enriquecidas con sus avances
  const intervencionesConAvances = useMemo((): IntervencionConAvances[] => {
    return intervenciones.map((int) => {
      const avancesInt = avancesPorIntervencion.get(int.intervencion_id) || [];
      const ultimo = avancesInt.length > 0 ? avancesInt[0] : null; // ya están ordenados desc
      const avanceObra = int.avance_obra || 0;
      // Estado canónico derivado del avance (única fuente de verdad).
      const estado = deriveEstadoUP(avanceObra, int.estado);
      const completada = estado === "Terminado";
      return {
        intervencion_id: int.intervencion_id,
        upid: int.upid,
        nombre_centro_gestor: (
          int.nombre_centro_gestor || "Sin centro gestor"
        ).trim(),
        estado,
        tipo_intervencion: int.tipo_intervencion || "Sin tipo",
        avance_obra_intervencion: avanceObra,
        presupuesto_base: int.presupuesto_base || 0,
        fecha_inicio: int.fecha_inicio || null,
        fecha_fin: int.fecha_fin || null,
        avances: avancesInt,
        ultimo_avance: ultimo,
        tiene_avances: avancesInt.length > 0,
        esta_completada: completada,
      };
    });
  }, [intervenciones, avancesPorIntervencion]);

  // Agrupado por centro gestor
  const resumenPorCentroGestor = useMemo((): CentroGestorAvancesResumen[] => {
    const limite10Dias = calcularDiasAtras(10);
    const mapa = new Map<string, CentroGestorAvancesResumen>();

    for (const int of intervencionesConAvances) {
      const cg = int.nombre_centro_gestor;
      if (!mapa.has(cg)) {
        mapa.set(cg, {
          nombre_centro_gestor: cg,
          total_intervenciones: 0,
          intervenciones_con_avance: 0,
          intervenciones_sin_avance: 0,
          intervenciones_completadas: 0,
          total_avances: 0,
          avances_ultimos_10_dias: 0,
          ultimo_avance: null,
          primer_avance: null,
          avance_obra_promedio: 0,
          tiene_alertas: false,
          intervenciones: [],
        });
      }

      const resumen = mapa.get(cg)!;
      resumen.total_intervenciones++;
      resumen.intervenciones.push(int);

      if (int.tiene_avances) {
        resumen.intervenciones_con_avance++;
        resumen.total_avances += int.avances.length;

        for (const av of int.avances) {
          const fecha = parseFecha(av.created_at);
          if (fecha) {
            if (
              !resumen.ultimo_avance ||
              fecha > new Date(resumen.ultimo_avance)
            ) {
              resumen.ultimo_avance = av.created_at;
            }
            if (
              !resumen.primer_avance ||
              fecha < new Date(resumen.primer_avance)
            ) {
              resumen.primer_avance = av.created_at;
            }
            if (fecha >= limite10Dias) {
              resumen.avances_ultimos_10_dias++;
            }
          }
        }
      } else if (int.esta_completada) {
        // Terminado (avance >= 99.5) sin reportes → completada, no cuenta como sin avance
        resumen.intervenciones_completadas++;
      } else {
        resumen.intervenciones_sin_avance++;
      }
    }

    // Calcular promedios y alertas
    const lista = Array.from(mapa.values());
    for (const resumen of lista) {
      // Promedio de avance_obra de las intervenciones (campo de la intervención)
      if (resumen.total_intervenciones > 0) {
        const sumaAvance = resumen.intervenciones.reduce(
          (s: number, i: IntervencionConAvances) =>
            s + i.avance_obra_intervencion,
          0,
        );
        resumen.avance_obra_promedio =
          sumaAvance / resumen.total_intervenciones;
      }
      // Alerta: si tiene intervenciones sin avance reportado que no están completadas
      resumen.tiene_alertas = resumen.intervenciones.some(
        (i: IntervencionConAvances) => !i.tiene_avances && !i.esta_completada,
      );
    }

    return lista.sort((a, b) =>
      a.nombre_centro_gestor.localeCompare(b.nombre_centro_gestor, "es"),
    );
  }, [intervencionesConAvances]);

  const centrosConAvances = useMemo(
    () =>
      resumenPorCentroGestor
        .filter((c) => c.intervenciones_con_avance > 0)
        .map((c) => c.nombre_centro_gestor),
    [resumenPorCentroGestor],
  );

  const centrosSinAvances = useMemo(
    () =>
      resumenPorCentroGestor
        .filter((c) => c.intervenciones_con_avance === 0)
        .map((c) => c.nombre_centro_gestor),
    [resumenPorCentroGestor],
  );

  return {
    avances,
    intervenciones: intervencionesConAvances,
    resumenPorCentroGestor,
    centrosConAvances,
    centrosSinAvances,
    totalAvances: avances.length,
    totalIntervenciones: intervenciones.length,
    loading,
    error,
    refetch: fetchData,
  };
}
