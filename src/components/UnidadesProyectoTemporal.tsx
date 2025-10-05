"use client";

import React from 'react';
import { AlertTriangle, Construction } from 'lucide-react';

// Componente temporal básico sin hooks complejos
const UnidadesProyectoTemporal: React.FC = () => {
  return (
    <main className="space-y-6">
      {/* Header informativo */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Construction className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Unidades de Proyecto
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            En Mantenimiento
          </span>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                Sección Temporalmente Deshabilitada
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                Estamos resolviendo un problema de rendimiento que causaba llamadas excesivas a la API. 
                La funcionalidad se restaurará una vez completada la optimización.
              </p>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                <strong>Estado:</strong> Investigando loop infinito de API calls<br/>
                <strong>ETA:</strong> Resolución en progreso<br/>
                <strong>Impacto:</strong> Solo esta sección está afectada
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Información de funcionalidades */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Funcionalidades Implementadas (Temporalmente Deshabilitadas)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🗺️ Mapa Interactivo</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visualización geográfica con filtros dinámicos y coloración por variables.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">📊 Dashboard Analítico</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Métricas en tiempo real con gráficos interactivos y KPIs.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔍 Filtros Avanzados</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Filtrado por comuna, barrio, estado, tipo y búsqueda textual.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">⚡ API Integrada</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conexión en tiempo real con endpoints especializados.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🎨 Visualización</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tres modos de vista: Dashboard, Mapa y Mixto.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔧 Funcional</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Código implementado con programación funcional y TypeScript.
            </p>
          </div>
        </div>
      </section>

      {/* Información técnica */}
      <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Información Técnica
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Estado del Servidor:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">✅ Estable</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">✅ Controladas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Build Status:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">✅ Exitoso</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">TypeScript:</span>
            <span className="text-green-600 dark:text-green-400 font-medium">✅ Sin errores</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default UnidadesProyectoTemporal;