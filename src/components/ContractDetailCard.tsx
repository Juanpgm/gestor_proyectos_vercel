'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ExternalLink, Eye } from 'lucide-react'
import { formatNumber } from '@/lib/design-system'
import { getContractStateColors } from '@/lib/contract-colors'
import { openSecopLink } from '@/utils/url-helpers'
import ContratosModal from '@/components/ContratosModal'
import ContractMetricsRings from '@/components/ContractMetricsRings'
import ContractTimeInfo from '@/components/ContractTimeInfo'

interface ContractDetailCardProps {
  contrato: any
  contractIndex: number
  proyectoData?: any // Datos del proyecto padre para mostrar centro gestor, BPIN, BP
}

const ContractDetailCard: React.FC<ContractDetailCardProps> = ({ 
  contrato, 
  contractIndex, 
  proyectoData 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: contractIndex * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        {/* Header del contrato */}
        <ContractHeader contrato={contrato} proyectoData={proyectoData} />
        
        {/* Métricas con gráficos tipo anillo */}
        <div className="flex gap-4 items-start">
          <div className="flex-[3]">
            <ContractMetricsRings contrato={contrato} />
          </div>
          <div className="flex-1">
            <ContractTimeInfo contrato={contrato} />
          </div>
        </div>

        {/* Footer con acciones */}
        <ContractFooter contrato={contrato} onOpenModal={() => setIsModalOpen(true)} />
      </motion.div>

      {/* Modal de detalles completos */}
      <ContratosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        referenciaContrato={contrato.referencia_del_contrato || contrato.referencia_contrato}
        contratoData={contrato}
        proyectoData={proyectoData}
      />
    </>
  )
}

// Función helper para obtener los colores del banco
const getBankColors = (banco: string) => {
  const bancoLower = (banco || '').toLowerCase()
  
  // Bancos principales con colores distintivos
  if (bancoLower.includes('bancolombia')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  }
  
  if (bancoLower.includes('bbva')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  
  if (bancoLower.includes('banco de bogotá') || bancoLower.includes('bogota')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  
  if (bancoLower.includes('davivienda')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  
  if (bancoLower.includes('colpatria')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
  
  if (bancoLower.includes('occidente')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  }
  
  if (bancoLower.includes('popular')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  }
  
  if (bancoLower.includes('itaú') || bancoLower.includes('itau')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
  }
  
  if (bancoLower.includes('santander')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  
  if (bancoLower.includes('citibank') || bancoLower.includes('citi')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  
  // Estado por defecto para bancos no específicos
  return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400'
}

// Subcomponente para el header del contrato
const ContractHeader: React.FC<{ contrato: any; proyectoData?: any }> = ({ contrato, proyectoData }) => (
  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {/* Información de referencia, estado y banco distribuida */}
          <div className="mb-3">
            {/* Fila única: Referencias a la izquierda, Estado y Banco a la derecha */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              {/* Referencias - lado izquierdo */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Ref. Contrato:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {contrato.referencia_del_contrato || contrato.referencia_contrato || 'Sin referencia'}
                  </span>
                </div>
                {contrato._registro_origen?.referencia_proceso && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Ref. Proceso:</span>
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {contrato._registro_origen.referencia_proceso}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Estado y Banco - lado derecho */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  getContractStateColors(contrato.estado_contrato || 'Vigente').badge
                }`}>
                  {contrato.estado_contrato || 'Sin estado'}
                </span>
                
                {(() => {
                  const banco = contrato.banco || contrato._registro_origen?.banco || contrato.nombre_del_banco
                
                  if (banco && banco !== 'No definido' && banco.trim() !== '') {
                    return (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        getBankColors(banco)
                      }`}>
                        {banco}
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
          
          <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {contrato.objeto_del_contrato || contrato.objeto_contrato || 'Sin objeto de contrato especificado'}
          </h5>
          
          {/* Información de valor y modalidad */}
          <div className="space-y-2">
            {/* Valor del contrato destacado */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor del Contrato:</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                ${(contrato.valor_del_contrato || contrato.valor_contrato || 0).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Subcomponente para información básica del contrato
const ContractBasicInfo: React.FC<{ contrato: any; proyectoData?: any }> = ({ contrato, proyectoData }) => (
  <div className="space-y-4">
    <h6 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
      📋 Información Básica
    </h6>
    <div className="space-y-3 text-sm">
      <InfoField 
        label="BPIN" 
        value={proyectoData?.bpin && proyectoData.bpin > 0 ? proyectoData.bpin.toString() : 'Sin BPIN'} 
        className="text-blue-600 dark:text-blue-400 font-mono"
      />
      {proyectoData?.bp && (
        <InfoField 
          label="BP" 
          value={proyectoData.bp} 
          className="text-green-600 dark:text-green-400 font-mono"
        />
      )}
      <InfoField 
        label="Centro Gestor" 
        value={proyectoData?.nombre_centro_gestor || 'Sin centro gestor'} 
        className="text-gray-900 dark:text-white"
      />
      <InfoField 
        label="Proveedor" 
        value={contrato.proveedor_adjudicado || 'Sin proveedor'} 
        className="text-purple-600 dark:text-purple-400"
      />
      <InfoField 
        label="Tipo de Contrato" 
        value={contrato.tipo_de_contrato || contrato.tipo_contrato || 'Sin tipo'} 
        className="text-gray-700 dark:text-gray-300"
      />
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
        <span className="text-gray-500 dark:text-gray-400 block">Valor del Contrato:</span>
        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
          ${(contrato.valor_del_contrato || contrato.valor_contrato || 0).toLocaleString('es-CO')}
        </span>
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400 block">Valor Facturado:</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          ${(contrato.valor_facturado || 0).toLocaleString('es-CO')}
        </span>
        {(contrato.valor_del_contrato || contrato.valor_contrato) > 0 && (
          <ProgressBar 
            value={contrato.valor_facturado || 0} 
            total={contrato.valor_del_contrato || contrato.valor_contrato} 
            className="bg-blue-600"
          />
        )}
      </div>
      <div>
        <span className="text-gray-500 dark:text-gray-400 block">Valor Pagado:</span>
        <span className="font-semibold text-yellow-600 dark:text-yellow-400">
          ${(contrato.valor_pagado || 0).toLocaleString('es-CO')}
        </span>
        {(contrato.valor_del_contrato || contrato.valor_contrato) > 0 && (
          <ProgressBar 
            value={contrato.valor_pagado || 0} 
            total={contrato.valor_del_contrato || contrato.valor_contrato} 
            className="bg-yellow-600"
          />
        )}
      </div>
      {(contrato.valor_pendiente_de_pago || contrato.valor_pendiente_pago) > 0 && (
        <div>
          <span className="text-gray-500 dark:text-gray-400 block">Pendiente de Pago:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            ${(contrato.valor_pendiente_de_pago || contrato.valor_pendiente_pago || 0).toLocaleString('es-CO')}
          </span>
        </div>
      )}
    </div>
  </div>
)

// Subcomponente para metadatos del contrato
const ContractMetadata: React.FC<{ contrato: any }> = ({ contrato }) => (
  <div className="space-y-4">
    <h6 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-1">
      📊 Metadatos
    </h6>
    <div className="space-y-3 text-sm">
      {contrato._registro_origen?.referencia_proceso && (
        <InfoField 
          label="Referencia Proceso" 
          value={contrato._registro_origen.referencia_proceso} 
          className="text-blue-600 dark:text-blue-400 font-mono"
        />
      )}
      {contrato._registro_origen?.fecha_extraccion && (
        <InfoField 
          label="Fecha Extracción" 
          value={new Date(contrato._registro_origen.fecha_extraccion).toLocaleString('es-CO')} 
          className="text-gray-600 dark:text-gray-400"
        />
      )}
      {(contrato.fecha_de_firma || contrato.fecha_firma) && (
        <InfoField 
          label="Fecha de Firma" 
          value={new Date(contrato.fecha_de_firma || contrato.fecha_firma).toLocaleDateString('es-CO')} 
          className="text-green-600 dark:text-green-400"
        />
      )}
      {(contrato.fecha_de_fin_del_contrato || contrato.fecha_fin_contrato) && (
        <InfoField 
          label="Fecha de Fin" 
          value={new Date(contrato.fecha_de_fin_del_contrato || contrato.fecha_fin_contrato).toLocaleDateString('es-CO')} 
          className="text-orange-600 dark:text-orange-400"
        />
      )}
      <InfoField 
        label="Banco" 
        value={contrato._registro_origen?.banco || contrato.banco || contrato.nombre_del_banco || 'No definido'} 
        className="text-purple-600 dark:text-purple-400"
      />
    </div>
  </div>
)

// Subcomponente para el footer del contrato
const ContractFooter: React.FC<{ contrato: any; onOpenModal: () => void }> = ({ contrato, onOpenModal }) => (
  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-2">
        <span className="font-medium">Tipo:</span>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {contrato.tipo_de_contrato || contrato.tipo_contrato || 'Sin tipo'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-medium">Modalidad:</span>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
          {contrato.modalidad_de_contratacion || contrato.modalidad_contratacion || 'Sin modalidad'}
        </span>
      </div>
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={() => openSecopLink(contrato.referencia_contrato || contrato.numero_proceso)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" />
        Ver en SECOP
      </button>
      
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Eye className="h-4 w-4" />
        Ver Detalle
      </button>
    </div>
  </div>
)

// Componentes auxiliares
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
