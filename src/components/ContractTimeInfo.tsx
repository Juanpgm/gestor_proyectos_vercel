'use client'

import React from 'react'

interface ContractTimeInfoProps {
  contrato: any
}

const ContractTimeInfo: React.FC<ContractTimeInfoProps> = ({ contrato }) => {
  // Usar la misma lógica que ContractGantt para extraer fechas
  const fechaFirma = contrato.fecha_de_firma || contrato.fecha_firma
  const fechaInicio = contrato.fecha_inicio_contrato || contrato.fecha_de_inicio_contrato
  const fechaFin = contrato.fecha_de_fin_del_contrato || contrato.fecha_fin_contrato
  const fechaInicioEjecucion = contrato.fecha_inicio_ejecucion
  
  // Fecha actual para comparaciones
  const hoy = new Date()
  const hoyISO = hoy.toISOString().split('T')[0]

  // Función para calcular días entre fechas (igual que ContractGantt)
  const calcularDiasEntreFechas = (inicio: string, fin: string) => {
    const diasDif = (new Date(fin).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24)
    return Math.ceil(diasDif)
  }

  // Función para convertir duración a días (igual que ContractGantt)
  const convertirDuracionADias = (duracionTexto: string): number => {
    const texto = duracionTexto.toLowerCase()
    const numero = parseInt(texto.replace(/[^0-9]/g, ''))
    
    if (isNaN(numero)) return 0
    
    // Detectar la unidad y convertir a días
    if (texto.includes('mes') || texto.includes('month')) {
      return numero * 30 // Aproximación: 1 mes = 30 días
    } else if (texto.includes('año') || texto.includes('year')) {
      return numero * 365 // Aproximación: 1 año = 365 días
    } else if (texto.includes('semana') || texto.includes('week')) {
      return numero * 7 // 1 semana = 7 días
    } else {
      return numero // Asumir que ya está en días
    }
  }

  // Calcular estadísticas usando la misma lógica que ContractGantt
  let duracionTotal = 0
  
  // Duración total: usar directamente el valor del JSON y convertir a días
  if (contrato.duraci_n_del_contrato) {
    const duracionTexto = contrato.duraci_n_del_contrato.toString()
    duracionTotal = convertirDuracionADias(duracionTexto)
  }
  
  // Si no hay duración específica, calcular entre fecha de firma y fecha de fin
  if (duracionTotal === 0 && fechaFirma && fechaFin) {
    duracionTotal = Math.abs(calcularDiasEntreFechas(fechaFirma, fechaFin))
  }

  // Días transcurridos: desde fecha de inicio hasta hoy (solo si ya comenzó y está en ejecución)
  let diasTranscurridos = 0
  let fechaInicioCalculo = fechaInicioEjecucion || fechaInicio || fechaFirma
  if (contrato.estado_contrato === 'En ejecución' && fechaInicioCalculo && hoy >= new Date(fechaInicioCalculo)) {
    diasTranscurridos = Math.max(0, calcularDiasEntreFechas(fechaInicioCalculo, hoyISO))
  }

  // Días restantes: desde hoy hasta fecha de fin del contrato (solo si está en ejecución)
  let diasRestantes = 0
  if (contrato.estado_contrato === 'En ejecución' && fechaFin) {
    const hoyDate = new Date(hoyISO)
    const finDate = new Date(fechaFin)
    
    if (hoyDate <= finDate) {
      diasRestantes = Math.max(0, calcularDiasEntreFechas(hoyISO, fechaFin))
    } else {
      diasRestantes = 0 // Contrato ya terminó
    }
  }

  // Porcentaje completado basado en la duración total
  const tiempoTranscurridoPorcentaje = duracionTotal > 0 && diasTranscurridos > 0
    ? Math.min(100, (diasTranscurridos / duracionTotal) * 100)
    : 0

  const formatearFecha = (fechaStr: string | null) => {
    if (!fechaStr) return 'No definida'
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Duración Total</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {duracionTotal > 0 ? `${duracionTotal} días` : '-'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Tiempo Transcurrido</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {contrato.estado_contrato === 'En ejecución' ? `${tiempoTranscurridoPorcentaje.toFixed(1)}%` : '-'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Días Transcurridos</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {contrato.estado_contrato === 'En ejecución' ? diasTranscurridos : '-'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Días Restantes</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {contrato.estado_contrato === 'En ejecución' ? diasRestantes : '-'}
          </span>
        </div>
      </div>
      
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-500">Inicio</span>
          <span className="text-gray-700 dark:text-gray-300">{formatearFecha(fechaInicioCalculo)}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-500">Finalización</span>
          <span className="text-gray-700 dark:text-gray-300">{formatearFecha(fechaFin)}</span>
        </div>
      </div>
    </div>
  )
}

export default ContractTimeInfo