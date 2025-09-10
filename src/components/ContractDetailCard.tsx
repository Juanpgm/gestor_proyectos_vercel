'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { formatNumber } from '@/lib/design-system'

interface ContractDetailCardProps {
  contrato: any
  contractIndex: number
}

const ContractDetailCard: React.FC<ContractDetailCardProps> = ({ 
  contrato, 
  contractIndex 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: contractIndex * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      {/* Header del contrato */}
      <ContractHeader contrato={contrato} />
      
      {/* Grid de información detallada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ContractDates contrato={contrato} />
        <ContractFinancials contrato={contrato} />
        <ContractResponsibles contrato={contrato} />
      </div>

      {/* Footer con acciones */}
      <ContractFooter contrato={contrato} />
    </motion.div>
  )
}

// Función helper para obtener los colores del estado del contrato
const getContractStateColors = (estado: string) => {
  const estadoLower = (estado || '').toLowerCase()
  
  // Estados positivos - Verde
  if (['celebrado', 'liquidado', 'ejecutado', 'finalizado'].some(s => estadoLower.includes(s))) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
  
  // Estados de finalización - Azul
  if (['terminado', 'completado', 'cerrado'].some(s => estadoLower.includes(s))) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  
  // Estados en progreso - Amarillo
  if (['en ejecución', 'ejecución', 'vigente', 'activo', 'en curso'].some(s => estadoLower.includes(s))) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }
  
  // Estados de adjudicación - Púrpura
  if (['adjudicado', 'asignado', 'contratado'].some(s => estadoLower.includes(s))) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  }
  
  // Estados de convocatoria - Naranja
  if (['convocado', 'abierto', 'publicado', 'licitación'].some(s => estadoLower.includes(s))) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
  
  // Estados negativos - Rojo
  if (['desierto', 'cancelado', 'anulado', 'revocado', 'fallido'].some(s => estadoLower.includes(s))) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  
  // Estados suspendidos - Ámbar
  if (['suspendido', 'pausado', 'detenido'].some(s => estadoLower.includes(s))) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
  }
  
  // Estados en evaluación - Índigo
  if (['evaluación', 'revisión', 'análisis', 'estudio'].some(s => estadoLower.includes(s))) {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
  }
  
  // Estados de inicio - Teal
  if (['inicio', 'iniciado', 'comenzado'].some(s => estadoLower.includes(s))) {
    return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400'
  }
  
  // Estados desconocidos o sin estado - Gris
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

// Subcomponente para el header del contrato
const ContractHeader: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {contrato.descripcion_proceso || 'Sin descripción'}
          </h5>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <span className="font-medium">Ref:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {contrato.referencia_contrato || 'Sin referencia'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Modalidad:</span>
              <span>{contrato.modalidad_contratacion || 'Sin modalidad'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Estado */}
    <div className="flex flex-col items-end gap-2">
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
        getContractStateColors(contrato.estado_contrato)
      }`}>
        {contrato.estado_contrato || 'Sin estado'}
      </span>
    </div>
  </div>
)

// Subcomponente para las fechas
const ContractDates: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="space-y-4">
    <h6 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
      📅 Fechas Importantes
    </h6>
    <div className="space-y-3 text-sm">
      {contrato.fecha_firma && (
        <DateField 
          label="Fecha de Firma" 
          date={contrato.fecha_firma} 
          className="text-gray-900 dark:text-white"
        />
      )}
      {contrato.fecha_inicio_contrato && (
        <DateField 
          label="Inicio Contrato" 
          date={contrato.fecha_inicio_contrato} 
          className="text-gray-900 dark:text-white"
        />
      )}
      {contrato.fecha_inicio_ejecucion && (
        <DateField 
          label="Inicio Ejecución" 
          date={contrato.fecha_inicio_ejecucion} 
          className="text-blue-600 dark:text-blue-400"
        />
      )}
      {contrato.fecha_fin_ejecucion && (
        <DateField 
          label="Fin Ejecución" 
          date={contrato.fecha_fin_ejecucion} 
          className="text-orange-600 dark:text-orange-400"
        />
      )}
    </div>
  </div>
)

// Subcomponente para información financiera
const ContractFinancials: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="space-y-4">
    <h6 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
      💰 Información Financiera
    </h6>
    <div className="space-y-3 text-sm">
      <div>
        <span className="text-gray-500 dark:text-gray-400 block">Valor Total:</span>
        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
          ${(contrato.valor_contrato || 0).toLocaleString('es-CO')}
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400 block">Valor Pagado:</span>
        <span className="font-semibold text-red-600 dark:text-red-400">
          ${(contrato.valor_pagado || 0).toLocaleString('es-CO')}
        </span>
        {contrato.valor_contrato > 0 && (
          <ProgressBar 
            value={contrato.valor_pagado || 0} 
            total={contrato.valor_contrato} 
            className="bg-red-600"
          />
        )}
      </div>
      {contrato.valor_pendiente_pago > 0 && (
        <div>
          <span className="text-gray-500 dark:text-gray-400 block">Pendiente de Pago:</span>
          <span className="font-semibold text-yellow-600 dark:text-yellow-400">
            ${(contrato.valor_pendiente_pago || 0).toLocaleString('es-CO')}
          </span>
        </div>
      )}
    </div>
  </div>
)

// Subcomponente para responsables
const ContractResponsibles: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="space-y-4">
    <h6 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
      👥 Responsables
    </h6>
    <div className="space-y-3 text-sm">
      <InfoField 
        label="Proveedor" 
        value={contrato.proveedor_adjudicado || 'Sin proveedor'} 
        className="text-gray-900 dark:text-white"
      />
      {contrato.nombre_supervisor && (
        <InfoField 
          label="Supervisor" 
          value={contrato.nombre_supervisor} 
          className="text-blue-600 dark:text-blue-400"
        />
      )}
      {contrato.nombre_representante_legal && (
        <InfoField 
          label="Representante Legal" 
          value={contrato.nombre_representante_legal} 
          className="text-purple-600 dark:text-purple-400"
        />
      )}
    </div>
  </div>
)

// Subcomponente para el footer del contrato
const ContractFooter: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="font-medium">Tipo:</span>
      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
        {contrato.tipo_contrato || 'Sin tipo'}
      </span>
    </div>
    
    {contrato.urlproceso && (
      <button
        onClick={() => {
          try {
            console.log('Navegando a:', contrato.urlproceso);
            const url = contrato.urlproceso.trim();
            if (url.startsWith('http://') || url.startsWith('https://')) {
              window.open(url, '_blank', 'noopener,noreferrer');
            } else {
              console.error('URL inválida:', url);
              alert('URL inválida: ' + url);
            }
          } catch (error) {
            console.error('Error al abrir URL:', error);
            alert('Error al abrir la URL del proceso');
          }
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" />
        Ver en SECOP
      </button>
    )}
  </div>
)

// Componentes auxiliares
const DateField: React.FC<{ label: string; date: string; className?: string }> = ({ 
  label, 
  date, 
  className = "" 
}) => (
  <div>
    <span className="text-gray-500 dark:text-gray-400 block">{label}:</span>
    <span className={`font-medium ${className}`}>
      {new Date(date).toLocaleDateString('es-CO')}
    </span>
  </div>
)

const InfoField: React.FC<{ label: string; value: string; className?: string }> = ({ 
  label, 
  value, 
  className = "" 
}) => (
  <div>
    <span className="text-gray-500 dark:text-gray-400 block">{label}:</span>
    <span className={`font-medium ${className}`}>
      {value}
    </span>
  </div>
)

const ProgressBar: React.FC<{ value: number; total: number; className?: string }> = ({ 
  value, 
  total, 
  className = "" 
}) => (
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
    <div 
      className={`h-2 rounded-full ${className}`}
      style={{ 
        width: `${Math.min((value / total) * 100, 100)}%` 
      }}
    ></div>
  </div>
)

export default ContractDetailCard
