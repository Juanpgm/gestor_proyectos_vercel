'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  User, 
  MapPin, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Info,
  Tag,
  CreditCard,
  Globe,
  Shield
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'

interface ContratosModalProps {
  isOpen: boolean
  onClose: () => void
  referenciaContrato: string
}

interface ContratoCompleto {
  nombre_entidad: string
  sector: string
  entidad_centralizada: string
  proceso_compra: string
  id_contrato: string
  referencia_contrato: string
  estado_contrato: string
  codigo_categoria_principal: string
  descripcion_proceso: string
  tipo_contrato: string
  modalidad_contratacion: string
  justificacion_modalidad_contratacion: string
  fecha_firma: string
  fecha_inicio_contrato: string
  fecha_fin_contrato: string
  fecha_inicio_ejecucion: string | null
  fecha_fin_ejecucion: string | null
  tipodocproveedor: string
  documento_proveedor: string
  proveedor_adjudicado: string
  es_grupo: string
  es_pyme: string
  habilita_pago_adelantado: number
  liquidación: string
  obligación_ambiental: string
  obligaciones_postconsumo: string
  reversion: string
  origen_recursos: string
  destino_gasto: string
  valor_contrato: number
  valor_pago_adelantado: number
  valor_facturado: number
  valor_pendiente_pago: number
  valor_pagado: number
  valor_amortizado: number
  valor_pendiente_amortizacion: number
  valor_pendiente_ejecucion: number
  estado_bpin: string
  bpin: number
  anno_bpin: string
  saldo_cdp: number
  saldo_vigencia: number
  espostconflicto: string
  dias_adicionados: string
  puntos_acuerdo: string
  pilares_acuerdo: string
  urlproceso: string
  nombre_representante_legal: string
  nacionalidad_representante_legal: string
  tipo_identificacion_representante_legal: string
  identificacion_representante_legal: string
  genero_representante_legal: string
  fecha_nacimiento_representante_legal: string
  edad_representante_legal: number
  pais_nacimiento_representante_legal: string
  departamento_nacimiento_representante_legal: string
  ciudad_nacimiento_representante_legal: string
  pais_residencia_representante_legal: string
  departamento_residencia_representante_legal: string
  ciudad_residencia_representante_legal: string
  objeto_contrato: string
  duración_contrato: number
  nombre_supervisor: string
  tipo_identificacion_supervisor: string
  identificacion_supervisor: string
  telefono_supervisor: string
  email_supervisor: string
}

const ContratosModal: React.FC<ContratosModalProps> = ({ 
  isOpen, 
  onClose, 
  referenciaContrato 
}) => {
  const [contrato, setContrato] = useState<ContratoCompleto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && referenciaContrato) {
      loadContratoData()
    }
  }, [isOpen, referenciaContrato])

  const loadContratoData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/data/contratos/contratos_proyectos.json')
      if (!response.ok) {
        throw new Error('Error al cargar datos de contratos')
      }
      
      const contratos: ContratoCompleto[] = await response.json()
      const contratoEncontrado = contratos.find(c => c.referencia_contrato === referenciaContrato)
      
      if (!contratoEncontrado) {
        throw new Error(`No se encontró el contrato con referencia: ${referenciaContrato}`)
      }
      
      setContrato(contratoEncontrado)
    } catch (err) {
      console.error('Error cargando contrato:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    const estadoLower = estado?.toLowerCase() || ''
    if (['celebrado', 'liquidado', 'ejecutado'].some(s => estadoLower.includes(s))) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    }
    if (['en ejecución', 'vigente'].some(s => estadoLower.includes(s))) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
    if (['modificado'].some(s => estadoLower.includes(s))) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No especificado'
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateProgress = (pagado: number, total: number) => {
    if (total === 0) return 0
    return Math.min((pagado / total) * 100, 100)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Detalle del Contrato</h2>
                  <p className="text-blue-100">Referencia: {referenciaContrato}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading && (
              <div className="p-8 text-center">
                <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando información del contrato...</p>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {contrato && (
              <div className="p-6 space-y-6">
                {/* Estado y información básica */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(contrato.estado_contrato)}`}>
                      {contrato.estado_contrato}
                    </span>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatNumber(contrato.valor_contrato, 'currency')}
                      </p>
                      <p className="text-sm text-gray-500">Valor total del contrato</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {contrato.objeto_contrato || contrato.descripcion_proceso}
                  </h3>
                </div>

                {/* Grid de información */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del contrato */}
                  <div className="space-y-4">
                    <SectionHeader icon={FileText} title="Información del Contrato" />
                    
                    <InfoCard>
                      <InfoField 
                        icon={Tag} 
                        label="Tipo de Contrato" 
                        value={contrato.tipo_contrato} 
                      />
                      <InfoField 
                        icon={FileText} 
                        label="Modalidad" 
                        value={contrato.modalidad_contratacion} 
                      />
                      <InfoField 
                        icon={Shield} 
                        label="Justificación" 
                        value={contrato.justificacion_modalidad_contratacion} 
                      />
                      <InfoField 
                        icon={Info} 
                        label="Código Categoría" 
                        value={contrato.codigo_categoria_principal} 
                      />
                    </InfoCard>
                  </div>

                  {/* Información de la entidad */}
                  <div className="space-y-4">
                    <SectionHeader icon={Building2} title="Entidad Contratante" />
                    
                    <InfoCard>
                      <InfoField 
                        icon={Building2} 
                        label="Entidad" 
                        value={contrato.nombre_entidad} 
                      />
                      <InfoField 
                        icon={Tag} 
                        label="Sector" 
                        value={contrato.sector} 
                      />
                      <InfoField 
                        icon={Info} 
                        label="Tipo" 
                        value={contrato.entidad_centralizada} 
                      />
                      <InfoField 
                        icon={FileText} 
                        label="BPIN" 
                        value={`${contrato.bpin} (${contrato.anno_bpin})`} 
                      />
                    </InfoCard>
                  </div>

                  {/* Fechas importantes */}
                  <div className="space-y-4">
                    <SectionHeader icon={Calendar} title="Cronograma" />
                    
                    <InfoCard>
                      <InfoField 
                        icon={Calendar} 
                        label="Fecha de Firma" 
                        value={formatDate(contrato.fecha_firma)} 
                      />
                      <InfoField 
                        icon={Calendar} 
                        label="Inicio Contrato" 
                        value={formatDate(contrato.fecha_inicio_contrato)} 
                      />
                      <InfoField 
                        icon={Calendar} 
                        label="Fin Contrato" 
                        value={formatDate(contrato.fecha_fin_contrato)} 
                      />
                      <InfoField 
                        icon={Clock} 
                        label="Duración" 
                        value={`${contrato.duración_contrato || 0} días`} 
                      />
                    </InfoCard>
                  </div>

                  {/* Información financiera */}
                  <div className="space-y-4">
                    <SectionHeader icon={DollarSign} title="Información Financiera" />
                    
                    <InfoCard>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Progreso de Pagos</span>
                          <span className="text-sm font-medium">
                            {calculateProgress(contrato.valor_pagado, contrato.valor_contrato).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${calculateProgress(contrato.valor_pagado, contrato.valor_contrato)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <InfoField 
                        icon={DollarSign} 
                        label="Valor Pagado" 
                        value={formatNumber(contrato.valor_pagado, 'currency')} 
                        className="text-green-600 dark:text-green-400"
                      />
                      <InfoField 
                        icon={DollarSign} 
                        label="Pendiente de Pago" 
                        value={formatNumber(contrato.valor_pendiente_pago, 'currency')} 
                        className="text-red-600 dark:text-red-400"
                      />
                      <InfoField 
                        icon={DollarSign} 
                        label="Valor Facturado" 
                        value={formatNumber(contrato.valor_facturado, 'currency')} 
                      />
                    </InfoCard>
                  </div>

                  {/* Proveedor */}
                  <div className="space-y-4">
                    <SectionHeader icon={User} title="Proveedor" />
                    
                    <InfoCard>
                      <InfoField 
                        icon={User} 
                        label="Proveedor" 
                        value={contrato.proveedor_adjudicado} 
                      />
                      <InfoField 
                        icon={CreditCard} 
                        label="Documento" 
                        value={`${contrato.tipodocproveedor}: ${contrato.documento_proveedor}`} 
                      />
                      <InfoField 
                        icon={Building2} 
                        label="Es PYME" 
                        value={contrato.es_pyme === 'Sí' ? 'Sí' : 'No'} 
                        className={contrato.es_pyme === 'Sí' ? 'text-green-600 dark:text-green-400' : ''}
                      />
                      <InfoField 
                        icon={User} 
                        label="Es Grupo" 
                        value={contrato.es_grupo === 'Sí' ? 'Sí' : 'No'} 
                      />
                    </InfoCard>
                  </div>

                  {/* Representante Legal */}
                  {contrato.nombre_representante_legal && (
                    <div className="space-y-4">
                      <SectionHeader icon={User} title="Representante Legal" />
                      
                      <InfoCard>
                        <InfoField 
                          icon={User} 
                          label="Nombre" 
                          value={contrato.nombre_representante_legal} 
                        />
                        <InfoField 
                          icon={CreditCard} 
                          label="Identificación" 
                          value={`${contrato.tipo_identificacion_representante_legal || 'N/A'}: ${contrato.identificacion_representante_legal || 'N/A'}`} 
                        />
                        <InfoField 
                          icon={Globe} 
                          label="Nacionalidad" 
                          value={contrato.nacionalidad_representante_legal || 'N/A'} 
                        />
                        {contrato.edad_representante_legal && (
                          <InfoField 
                            icon={Calendar} 
                            label="Edad" 
                            value={`${contrato.edad_representante_legal} años`} 
                          />
                        )}
                      </InfoCard>
                    </div>
                  )}

                  {/* Supervisor */}
                  {contrato.nombre_supervisor && (
                    <div className="space-y-4">
                      <SectionHeader icon={User} title="Supervisor" />
                      
                      <InfoCard>
                        <InfoField 
                          icon={User} 
                          label="Nombre" 
                          value={contrato.nombre_supervisor} 
                        />
                        <InfoField 
                          icon={CreditCard} 
                          label="Identificación" 
                          value={`${contrato.tipo_identificacion_supervisor || 'N/A'}: ${contrato.identificacion_supervisor || 'N/A'}`} 
                        />
                        {contrato.telefono_supervisor && (
                          <InfoField 
                            icon={Info} 
                            label="Teléfono" 
                            value={contrato.telefono_supervisor} 
                          />
                        )}
                        {contrato.email_supervisor && (
                          <InfoField 
                            icon={Info} 
                            label="Email" 
                            value={contrato.email_supervisor} 
                          />
                        )}
                      </InfoCard>
                    </div>
                  )}

                  {/* Características especiales */}
                  <div className="space-y-4">
                    <SectionHeader icon={Shield} title="Características Especiales" />
                    
                    <InfoCard>
                      <InfoField 
                        icon={CheckCircle} 
                        label="Obligación Ambiental" 
                        value={contrato.obligación_ambiental} 
                        className={contrato.obligación_ambiental === 'Sí' ? 'text-green-600 dark:text-green-400' : ''}
                      />
                      <InfoField 
                        icon={Shield} 
                        label="Post Conflicto" 
                        value={contrato.espostconflicto} 
                        className={contrato.espostconflicto === 'Sí' ? 'text-blue-600 dark:text-blue-400' : ''}
                      />
                      <InfoField 
                        icon={DollarSign} 
                        label="Pago Adelantado" 
                        value={contrato.habilita_pago_adelantado ? 'Habilitado' : 'No habilitado'} 
                      />
                      <InfoField 
                        icon={Info} 
                        label="Liquidación" 
                        value={contrato.liquidación} 
                      />
                    </InfoCard>
                  </div>
                </div>

                {/* Descripción completa */}
                {contrato.descripcion_proceso && (
                  <div className="space-y-4">
                    <SectionHeader icon={FileText} title="Descripción del Proceso" />
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {contrato.descripcion_proceso}
                      </p>
                    </div>
                  </div>
                )}

                {/* Enlaces */}
                {contrato.urlproceso && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => window.open(contrato.urlproceso, '_blank')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver en SECOP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Componentes auxiliares
const SectionHeader: React.FC<{ icon: React.ElementType; title: string }> = ({ 
  icon: Icon, 
  title 
}) => (
  <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-600">
    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
  </div>
)

const InfoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 p-4 space-y-3">
    {children}
  </div>
)

const InfoField: React.FC<{
  icon: React.ElementType
  label: string
  value: string
  className?: string
}> = ({ icon: Icon, label, value, className = "" }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-sm font-medium text-gray-900 dark:text-white ${className}`}>
        {value || 'No especificado'}
      </p>
    </div>
  </div>
)

export default ContratosModal
