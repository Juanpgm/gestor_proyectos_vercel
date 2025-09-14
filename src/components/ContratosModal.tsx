'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FileText, 
  AlertCircle, 
  Calendar,
  DollarSign,
  BarChart3,
  Building2,
  User,
  Info,
  Shield,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react'
import { formatNumber } from '@/lib/design-system'
import { getContractStateColors, getMetricColors, getInfoColors } from '@/lib/contract-colors'
import ContractMetricsRings from './ContractMetricsRings'
import ContractGantt from './ContractGantt'
import ContractFinancialVisuals from './ContractFinancialVisuals'
import ContractTimeSeries from './ContractTimeSeries'

interface ContratosModalProps {
  isOpen: boolean
  onClose: () => void
  referenciaContrato: string
  contratoData?: any
  proyectoData?: any
}

// Componente para secciones colapsables minimalistas
// Removido - ya no se usa

// Función para formatear moneda
const formatearMoneda = (valor: any) => {
  if (!valor || valor === 0) return 'No disponible'
  const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^0-9.-]/g, '')) : valor
  if (isNaN(numero)) return 'No disponible'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(numero)
}

// Función para formatear fecha
const formatearFecha = (fecha: any) => {
  if (!fecha) return 'No disponible'
  try {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return fecha
  }
}

const ContratosModal: React.FC<ContratosModalProps> = ({ 
  isOpen, 
  onClose, 
  referenciaContrato,
  contratoData,
  proyectoData
}) => {
  const [contrato, setContrato] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && !contratoData) {
      loadContratoData()
    }
  }, [isOpen, referenciaContrato, contratoData])

  const loadContratoData = async () => {
    if (!referenciaContrato) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/contratos')
      if (!response.ok) {
        throw new Error('Error al cargar datos de contratos')
      }
      
      const contratos: any[] = await response.json()
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

  if (!isOpen) return null

  // Usar contratoData si está disponible, sino cargar desde API
  const contractDataToShow = contratoData || contrato
  
  // Obtener colores de estado para el header
  const headerColors = contractDataToShow?.estado_contrato 
    ? getContractStateColors(contractDataToShow.estado_contrato)
    : getContractStateColors('Vigente')

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
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con colores unificados */}
          <div className={`${headerColors.bg} ${headerColors.border} border-b p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 bg-white/20 dark:bg-gray-800/20 rounded-lg">
                  <FileText className={`w-5 h-5 ${headerColors.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5 leading-tight">
                    {contractDataToShow?.objeto_del_contrato || contractDataToShow?.objeto_contrato || 'Detalle del Contrato'}
                  </h2>
                  <div className="text-xs text-gray-600 dark:text-gray-400 opacity-90">
                    {referenciaContrato}
                    {contractDataToShow?._registro_origen?.referencia_proceso && (
                      <span className="ml-2">• {contractDataToShow._registro_origen.referencia_proceso}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable compacto */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
            <div className="p-4 space-y-4">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando información...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error al cargar datos</span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
                </div>
              )}

              {contractDataToShow && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 space-y-0 items-stretch min-h-0">
                  
                  {/* Columna Izquierda */}
                  <div className="space-y-4 flex flex-col min-h-0 flex-1">
                    
                    {/* Métricas visuales compactas */}
                    <div className={`${getInfoColors('temporal').bg} ${getInfoColors('temporal').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3 className={`w-4 h-4 ${getInfoColors('temporal').icon}`} />
                        Métricas de Ejecución
                      </h3>
                      <ContractMetricsRings contrato={contractDataToShow} />
                    </div>

                    {/* Serie de Tiempo del Contrato */}
                    <div className={`${getInfoColors('temporal').bg} ${getInfoColors('temporal').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getInfoColors('temporal').icon}`} />
                        Evolución Temporal
                      </h3>
                      <ContractTimeSeries contrato={contractDataToShow} />
                    </div>

                    {/* Información Financiera Compacta */}
                    <div className={`${getMetricColors('valor').bg} ${getMetricColors('valor').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${getMetricColors('valor').icon}`} />
                        Información Financiera
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">Valor Contrato</div>
                          <div className={`font-semibold ${getMetricColors('valor').text} truncate`}>
                            {formatearMoneda(contractDataToShow.valor_del_contrato)}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">Valor Pagado</div>
                          <div className={`font-semibold ${getMetricColors('pagado').text} truncate`}>
                            {formatearMoneda(contractDataToShow.valor_pagado)}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">Facturado</div>
                          <div className={`font-semibold ${getMetricColors('facturado').text} truncate`}>
                            {formatearMoneda(contractDataToShow.valor_facturado)}
                          </div>
                        </div>
                        <div className="bg-white/70 dark:bg-gray-800/70 rounded p-2">
                          <div className="text-gray-500 dark:text-gray-400">Estado</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${getContractStateColors(contractDataToShow.estado_contrato || 'Vigente').badge} font-medium`}>
                            {contractDataToShow.estado_contrato || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Información del Contratista */}
                    <div className={`${getInfoColors('contratista').bg} ${getInfoColors('contratista').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <User className={`w-4 h-4 ${getInfoColors('contratista').icon}`} />
                        Contratista
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.proveedor_adjudicado || contractDataToShow.contratista || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Documento:</span>
                            <div className="font-mono text-gray-900 dark:text-white">
                              {contractDataToShow.documento_proveedor || contractDataToShow.numero_de_documento_del_contratista || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-white">
                            {contractDataToShow.tipo_identificacion_representante_legal || contractDataToShow.tipo_de_documento_del_contratista || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información de Entidad Compacta */}
                    <div className={`${getInfoColors('entidad').bg} ${getInfoColors('entidad').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${getInfoColors('entidad').icon}`} />
                        Entidad
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Entidad:</span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {contractDataToShow.nombre_entidad || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Centro Gestor:</span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {proyectoData?.nombre_centro_gestor || contractDataToShow.nombre_centro_gestor || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">BPIN:</span>
                          <div className="font-mono text-blue-600 dark:text-blue-400">
                            {contractDataToShow.bpin || proyectoData?.bpin || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Ubicación:</span>
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {contractDataToShow.ciudad || contractDataToShow.departamento || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columna Derecha */}
                  <div className="space-y-4 flex flex-col min-h-0 flex-1">

                    {/* Cronograma Gantt Compacto */}
                    <div className={`${getInfoColors('cronograma').bg} ${getInfoColors('cronograma').border} border rounded-lg p-3`}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Calendar className={`w-4 h-4 ${getInfoColors('cronograma').icon}`} />
                        Cronograma
                      </h3>
                      <ContractGantt contrato={contractDataToShow} />
                    </div>

                    {/* Detalles Contractuales Compactos */}
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        Detalles Contractuales
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Número:</span>
                            <div className="font-mono text-gray-900 dark:text-white truncate">
                              {contractDataToShow.numero_del_contrato || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tipo:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.tipo_contrato || contractDataToShow.tipo_de_contrato || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Modalidad:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.modalidad_contratacion || contractDataToShow.modalidad_de_selecci_n || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contractDataToShow.duración_contrato || contractDataToShow.duraci_n_del_contrato || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Código SECOP:</span>
                            <div className="font-mono text-blue-600 dark:text-blue-400 truncate">
                              {contractDataToShow.codigo_secop || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Supervisor:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.nombre_supervisor || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fechas Importantes Compactas */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Fechas Clave
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Firma:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow.fecha_de_firma || contractDataToShow.fecha_firma)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Inicio:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow.fecha_inicio_contrato || contractDataToShow.fecha_de_inicio_contrato)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Fin:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow.fecha_de_fin_del_contrato || contractDataToShow.fecha_fin_contrato)}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Inicio Ejec.:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow.fecha_inicio_ejecucion)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Fin Ejec.:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow.fecha_fin_ejecucion)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Extracción:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {formatearFecha(contractDataToShow._registro_origen?.fecha_extraccion)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aspectos Legales Compactos */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg p-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-600" />
                        Aspectos Legales
                      </h3>
                      <div className="space-y-1 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Recursos:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.origen_recursos || contractDataToShow.fuente_de_recursos || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Rubro:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.rubro || contractDataToShow.destino_gasto || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Postconflicto:</span>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contractDataToShow.espostconflicto || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Ambiental:</span>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {contractDataToShow.obligación_ambiental || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Objeto del Contrato - Ancho Completo */}
                  <div className="col-span-1 lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600" />
                      Objeto del Contrato
                    </h3>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {contractDataToShow.objeto_contrato || contractDataToShow.objeto_del_contrato || 'No se ha proporcionado una descripción del objeto del contrato.'}
                    </p>
                  </div>

                  {/* Enlaces y acciones - Ancho Completo */}
                  {(contractDataToShow.urlproceso?.url || contractDataToShow.urlproceso) && (
                    <div className="col-span-1 lg:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => {
                          const url = contractDataToShow.urlproceso?.url || contractDataToShow.urlproceso
                          if (typeof url === 'string' && url.trim()) {
                            window.open(url.trim(), '_blank')
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver en SECOP
                      </button>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContratosModal