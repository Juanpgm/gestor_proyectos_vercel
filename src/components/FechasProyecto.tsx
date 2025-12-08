/**
 * Componente de ejemplo: FechasProyecto
 * Muestra los campos de fecha de una Unidad de Proyecto
 * Incluye: clase_up, fecha_inicio, fecha_fin, fecha_inauguracion
 */

'use client'

import React from 'react'
import { 
  UnidadProyecto, 
  formatDate, 
  formatDateRange, 
  validateProjectDates,
  getProjectStatusFromDates,
  getStatusColor
} from '@/types/unidades-proyecto'
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react'

interface FechasProyectoProps {
  proyecto: UnidadProyecto
  showValidation?: boolean
}

export default function FechasProyecto({ 
  proyecto, 
  showValidation = false 
}: FechasProyectoProps) {
  const validation = validateProjectDates(proyecto)
  const statusFromDates = getProjectStatusFromDates(proyecto)
  const statusColor = getStatusColor(statusFromDates)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Información de Fechas
        </h3>
        <div 
          className="px-3 py-1 rounded-full text-sm font-medium text-white"
          style={{ backgroundColor: statusColor }}
        >
          {statusFromDates}
        </div>
      </div>

      {/* Clasificación */}
      {proyecto.clase_up && (
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-sm text-gray-600">Clase de UP</p>
          <p className="text-base font-medium text-gray-900">
            {proyecto.clase_up}
          </p>
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fecha de Inicio */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Fecha de Inicio</span>
          </div>
          <p className="text-base font-medium text-gray-900">
            {formatDate(proyecto.fecha_inicio)}
          </p>
        </div>

        {/* Fecha de Fin */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Fecha de Fin</span>
          </div>
          <p className="text-base font-medium text-gray-900">
            {formatDate(proyecto.fecha_fin)}
          </p>
        </div>

        {/* Fecha de Inauguración */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Fecha de Inauguración</span>
          </div>
          <p className="text-base font-medium text-gray-900">
            {formatDate(proyecto.fecha_inauguracion)}
          </p>
        </div>
      </div>

      {/* Rango de fechas */}
      <div className="bg-gray-50 rounded-md p-3">
        <p className="text-sm text-gray-600 mb-1">Período de Ejecución</p>
        <p className="text-base font-medium text-gray-900">
          {formatDateRange(proyecto.fecha_inicio, proyecto.fecha_fin)}
        </p>
      </div>

      {/* Validación de fechas */}
      {showValidation && (
        <div className={`rounded-md p-3 ${
          validation.isValid 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {validation.isValid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    Fechas válidas
                  </p>
                  <p className="text-sm text-green-700">
                    Las fechas del proyecto son consistentes
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-1">
                    Inconsistencias en fechas
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">UPID</p>
            <p className="font-medium text-gray-900">{proyecto.upid}</p>
          </div>
          {proyecto.nombre_up && (
            <div>
              <p className="text-gray-600">Nombre</p>
              <p className="font-medium text-gray-900">{proyecto.nombre_up}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Ejemplo de uso en una página o componente:
 * 
 * import FechasProyecto from '@/components/FechasProyecto'
 * import { useUnidadesProyecto } from '@/hooks/useUnidadesProyecto'
 * 
 * function MiComponente() {
 *   const { data } = useUnidadesProyecto()
 *   
 *   return (
 *     <div>
 *       {data.map(proyecto => (
 *         <FechasProyecto 
 *           key={proyecto.upid} 
 *           proyecto={proyecto}
 *           showValidation={true}
 *         />
 *       ))}
 *     </div>
 *   )
 * }
 */
