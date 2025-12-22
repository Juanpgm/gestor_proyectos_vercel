"use client";

import React, { useEffect, useState } from 'react';
import { useUnidadesProyecto } from '@/hooks/useUnidadesProyectoEnhanced';
import { AttributeData } from '@/services/unidades-proyecto.service';

interface CentroGestorStats {
  total: number;
  withCentro: number;
  withoutCentro: number;
  centrosUnicos: string[];
  itemsPerCentro: Record<string, number>;
  itemsWithoutCentro: AttributeData[];
}

export default function DiagnosticoCentroGestor() {
  const { state, filteredData } = useUnidadesProyecto({
    enableLocalFiltering: true
  });
  
  const [stats, setStats] = useState<CentroGestorStats | null>(null);
  
  useEffect(() => {
    if (state.attributeData.length > 0) {
      const data = state.attributeData;
      
      const withCentro = data.filter(item => 
        item.nombre_centro_gestor && item.nombre_centro_gestor.trim() !== ''
      );
      
      const withoutCentro = data.filter(item => 
        !item.nombre_centro_gestor || item.nombre_centro_gestor.trim() === ''
      );
      
      const centrosSet = new Set<string>();
      withCentro.forEach(item => {
        if (item.nombre_centro_gestor) {
          centrosSet.add(item.nombre_centro_gestor);
        }
      });
      const centrosArray = Array.from(centrosSet).sort();
      
      const itemsPerCentro: Record<string, number> = {};
      centrosArray.forEach(centro => {
        itemsPerCentro[centro] = withCentro.filter(
          item => item.nombre_centro_gestor === centro
        ).length;
      });
      
      setStats({
        total: data.length,
        withCentro: withCentro.length,
        withoutCentro: withoutCentro.length,
        centrosUnicos: centrosArray,
        itemsPerCentro,
        itemsWithoutCentro: withoutCentro
      });
    }
  }, [state.attributeData]);
  
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-600 dark:text-red-400">{state.error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!stats) {
    return null;
  }
  
  const percentage = (stats.withCentro / stats.total * 100).toFixed(1);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Diagnóstico Centro Gestor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verificación de integridad del campo nombre_centro_gestor en Unidades de Proyecto
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total UPs
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.withCentro}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Con Centro Gestor ({percentage}%)
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.withoutCentro}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sin Centro Gestor
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {stats.centrosUnicos.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Centros Únicos
            </div>
          </div>
        </div>
        
        {/* Centros Gestores List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Centros Gestores Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.centrosUnicos.map((centro, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {centro}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.itemsPerCentro[centro]} UPs
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Items without Centro Gestor */}
        {stats.withoutCentro > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg p-6 border border-red-200 dark:border-red-800">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">
              ⚠️ UPs sin Centro Gestor ({stats.withoutCentro})
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Las siguientes UPs no tienen el campo nombre_centro_gestor y no aparecerán al filtrar por Centro Gestor:
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.itemsWithoutCentro.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded p-3 border border-red-200 dark:border-red-800"
                >
                  <div className="font-mono text-sm text-gray-900 dark:text-white">
                    {item.upid}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {item.nombre_up}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Estado: {item.estado} | Tipo: {item.tipo_intervencion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {stats.withoutCentro === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-lg p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                  ✅ Perfecto! Todas las UPs tienen Centro Gestor
                </h3>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  El filtrado por Centro Gestor funcionará correctamente para todas las Unidades de Proyecto.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
