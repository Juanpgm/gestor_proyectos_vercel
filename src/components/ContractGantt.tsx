'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, AlertCircle, FileSignature, Play, Square, Target, TrendingUp } from 'lucide-react'

interface ContractGanttProps {
  contrato: any
}

const ContractGantt: React.FC<ContractGanttProps> = ({ contrato }) => {
  // Extraer todas las fechas disponibles del contrato
  const fechaFirma = contrato.fecha_de_firma || contrato.fecha_firma
  const fechaInicio = contrato.fecha_inicio_contrato || contrato.fecha_de_inicio_contrato
  const fechaFin = contrato.fecha_de_fin_del_contrato || contrato.fecha_fin_contrato
  const fechaInicioEjecucion = contrato.fecha_inicio_ejecucion
  const fechaFinEjecucion = contrato.fecha_fin_ejecucion
  const fechaExtraccion = contrato._registro_origen?.fecha_extraccion
  
  // Fecha actual para comparaciones
  const hoy = new Date()
  const hoyISO = hoy.toISOString().split('T')[0]

  if (!fechaFirma && !fechaInicio && !fechaFin) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay información de fechas disponible</p>
        </div>
      </div>
    )
  }

  // Preparar todas las fechas importantes para el Gantt
  const todasLasFechas = [
    { fecha: fechaFirma, label: 'Firma del Contrato', tipo: 'firma', icon: FileSignature },
    { fecha: fechaInicio, label: 'Inicio del Contrato', tipo: 'inicio', icon: Play },
    { fecha: fechaInicioEjecucion, label: 'Inicio de Ejecución', tipo: 'ejecucion-inicio', icon: Clock },
    { fecha: fechaFinEjecucion, label: 'Fin de Ejecución', tipo: 'ejecucion-fin', icon: CheckCircle2 },
    { fecha: fechaFin, label: 'Fin del Contrato', tipo: 'fin', icon: Square },
    { fecha: fechaExtraccion, label: 'Fecha de Extracción', tipo: 'extraccion', icon: AlertCircle },
    { fecha: hoyISO, label: 'Hoy', tipo: 'hoy', icon: Target }
  ].filter(f => f.fecha).sort((a, b) => new Date(a.fecha!).getTime() - new Date(b.fecha!).getTime())

  if (todasLasFechas.length === 0) return null

  // Calcular el rango total del diagrama (incluyendo fecha actual)
  const fechaMinima = new Date(todasLasFechas[0].fecha!)
  const fechaMaxima = new Date(todasLasFechas[todasLasFechas.length - 1].fecha!)
  
  // Añadir margen para mejor visualización
  const margenDias = 30
  const fechaInicioGantt = new Date(fechaMinima.getTime() - margenDias * 24 * 60 * 60 * 1000)
  const fechaFinGantt = new Date(fechaMaxima.getTime() + margenDias * 24 * 60 * 60 * 1000)
  
  const rangoDiasTotal = (fechaFinGantt.getTime() - fechaInicioGantt.getTime()) / (1000 * 60 * 60 * 24)

  const calcularPosicion = (fecha: string) => {
    const fechaActual = new Date(fecha)
    const diasDesdeInicio = (fechaActual.getTime() - fechaInicioGantt.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.min(100, (diasDesdeInicio / rangoDiasTotal) * 100))
  }

  const calcularAnchoBarra = (fechaInicio: string, fechaFin: string) => {
    const posInicio = calcularPosicion(fechaInicio)
    const posFin = calcularPosicion(fechaFin)
    return posFin - posInicio
  }

  // Definir las barras del diagrama de Gantt
  const barrasGantt = []
  
  // Barra principal del contrato (si tenemos inicio y fin)
  if (fechaInicio && fechaFin) {
    const inicioPos = calcularPosicion(fechaInicio)
    const ancho = calcularAnchoBarra(fechaInicio, fechaFin)
    const hoyPos = calcularPosicion(hoyISO)
    
    // Calcular progreso basado en la fecha actual
    let progreso = 0
    if (hoy >= new Date(fechaInicio)) {
      if (hoy <= new Date(fechaFin)) {
        const tiempoTranscurrido = hoy.getTime() - new Date(fechaInicio).getTime()
        const tiempoTotal = new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()
        progreso = (tiempoTranscurrido / tiempoTotal) * 100
      } else {
        progreso = 100 // Contrato ya terminó
      }
    }
    
    barrasGantt.push({
      nombre: 'Duración Total del Contrato',
      inicioPos,
      ancho,
      progreso,
      color: 'bg-blue-500',
      colorProgreso: 'bg-blue-600',
      altura: 'h-8',
      estado: hoy > new Date(fechaFin) ? 'completado' : hoy >= new Date(fechaInicio) ? 'en-progreso' : 'pendiente'
    })
  }
  
  // Barra de ejecución específica (si existe)
  if (fechaInicioEjecucion && fechaFinEjecucion) {
    const inicioPos = calcularPosicion(fechaInicioEjecucion)
    const ancho = calcularAnchoBarra(fechaInicioEjecucion, fechaFinEjecucion)
    
    let progresoEjecucion = 0
    if (hoy >= new Date(fechaInicioEjecucion)) {
      if (hoy <= new Date(fechaFinEjecucion)) {
        const tiempoTranscurrido = hoy.getTime() - new Date(fechaInicioEjecucion).getTime()
        const tiempoTotal = new Date(fechaFinEjecucion).getTime() - new Date(fechaInicioEjecucion).getTime()
        progresoEjecucion = (tiempoTranscurrido / tiempoTotal) * 100
      } else {
        progresoEjecucion = 100
      }
    }
    
    barrasGantt.push({
      nombre: 'Período de Ejecución',
      inicioPos,
      ancho,
      progreso: progresoEjecucion,
      color: 'bg-green-500',
      colorProgreso: 'bg-green-600',
      altura: 'h-6',
      estado: hoy > new Date(fechaFinEjecucion) ? 'completado' : hoy >= new Date(fechaInicioEjecucion) ? 'en-progreso' : 'pendiente'
    })
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', { 
      day: '2-digit',
      month: 'short', 
      year: 'numeric'
    })
  }

  const calcularDiasEntreFechas = (inicio: string, fin: string) => {
    const diasDif = (new Date(fin).getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24)
    return Math.ceil(diasDif)
  }

  // Función para convertir duración a días
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

  // Calcular estadísticas del proyecto
  const estadisticas = {
    duracionTotal: 0,
    duracionEnDias: 0, // Nueva propiedad para mostrar en días
    diasTranscurridos: 0,
    diasRestantes: 0,
    porcentajeCompletado: 0
  }

  // Duración total: usar directamente el valor del JSON y convertir a días
  if (contrato.duraci_n_del_contrato) {
    const duracionTexto = contrato.duraci_n_del_contrato.toString()
    estadisticas.duracionTotal = convertirDuracionADias(duracionTexto)
    estadisticas.duracionEnDias = estadisticas.duracionTotal
  }
  
  // Si no hay duración específica, calcular entre fecha de firma y fecha de fin
  if (estadisticas.duracionTotal === 0 && fechaFirma && fechaFin) {
    const diasCalculados = Math.abs(calcularDiasEntreFechas(fechaFirma, fechaFin))
    estadisticas.duracionTotal = diasCalculados
    estadisticas.duracionEnDias = diasCalculados
  }

  // Días transcurridos: desde fecha de inicio hasta hoy (solo si ya comenzó y está en ejecución)
  let fechaInicioCalculo = fechaInicioEjecucion || fechaInicio || fechaFirma
  if (contrato.estado_contrato === 'En ejecución' && fechaInicioCalculo && hoy >= new Date(fechaInicioCalculo)) {
    estadisticas.diasTranscurridos = Math.max(0, calcularDiasEntreFechas(fechaInicioCalculo, hoyISO))
  }

  // Días restantes: desde hoy hasta fecha de fin del contrato (solo si está en ejecución)
  if (contrato.estado_contrato === 'En ejecución' && fechaFin) {
    const hoyDate = new Date(hoyISO)
    const finDate = new Date(fechaFin)
    
    if (hoyDate <= finDate) {
      estadisticas.diasRestantes = Math.max(0, calcularDiasEntreFechas(hoyISO, fechaFin))
    } else {
      estadisticas.diasRestantes = 0 // Contrato ya terminó
    }
  }

  // Porcentaje completado basado en la duración total
  if (estadisticas.duracionTotal > 0 && estadisticas.diasTranscurridos >= 0) {
    estadisticas.porcentajeCompletado = Math.min(100, Math.max(0, (estadisticas.diasTranscurridos / estadisticas.duracionTotal) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con estadísticas del progreso */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Cronograma de Ejecución
          </h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {contrato.estado_contrato === 'En ejecución' ? estadisticas.diasTranscurridos : '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Días Transcurridos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {contrato.estado_contrato === 'En ejecución' ? estadisticas.diasRestantes : '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Días Restantes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {estadisticas.duracionEnDias} días
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Duración Total</div>
          </div>
        </div>
      </div>

      {/* Diagrama de Gantt Principal con barras reales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {/* Escala temporal superior */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>{formatearFecha(fechaInicioGantt.toISOString().split('T')[0])}</span>
            <span className="text-center">📅 Línea de Tiempo del Contrato</span>
            <span>{formatearFecha(fechaFinGantt.toISOString().split('T')[0])}</span>
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Barras del Diagrama de Gantt */}
        <div className="space-y-4 mb-6">
          {barrasGantt.map((barra, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {barra.nombre}
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {barra.progreso.toFixed(1)}%
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    barra.estado === 'completado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    barra.estado === 'en-progreso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {barra.estado === 'completado' ? 'Completado' :
                     barra.estado === 'en-progreso' ? 'En Progreso' : 'Pendiente'}
                  </span>
                </div>
              </div>
              
              <div className={`relative ${barra.altura} bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden`}>
                {/* Barra base */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barra.ancho}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                  className={`h-full ${barra.color} rounded-full opacity-60`}
                  style={{ marginLeft: `${barra.inicioPos}%` }}
                />
                
                {/* Barra de progreso */}
                {barra.progreso > 0 && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(barra.ancho * barra.progreso) / 100}%` }}
                    transition={{ duration: 1.2, delay: index * 0.2 + 0.3 }}
                    className={`absolute top-0 h-full ${barra.colorProgreso} rounded-full`}
                    style={{ marginLeft: `${barra.inicioPos}%` }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Indicador de fecha actual */}
        <div className="relative mb-4">
          <div className="absolute top-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute transform -translate-x-1/2 z-10"
            style={{ left: `${calcularPosicion(hoyISO)}%` }}
          >
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-200 dark:border-red-700 whitespace-nowrap">
              <div className="text-xs font-medium text-red-700 dark:text-red-300">HOY</div>
              <div className="text-xs text-red-600 dark:text-red-400">
                {formatearFecha(hoyISO)}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Timeline de hitos */}
        <div className="relative mt-8">
          <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-600"></div>
          
          <div className="relative h-16">
            {todasLasFechas.filter(f => f.tipo !== 'hoy').map((hito, index) => {
              const IconComponent = hito.icon
              const posicion = calcularPosicion(hito.fecha!)
              
              const coloresHito = {
                'firma': { bg: 'bg-blue-500', text: 'text-blue-700', bgHover: 'bg-blue-50 dark:bg-blue-900/20' },
                'inicio': { bg: 'bg-green-500', text: 'text-green-700', bgHover: 'bg-green-50 dark:bg-green-900/20' },
                'ejecucion-inicio': { bg: 'bg-yellow-500', text: 'text-yellow-700', bgHover: 'bg-yellow-50 dark:bg-yellow-900/20' },
                'ejecucion-fin': { bg: 'bg-orange-500', text: 'text-orange-700', bgHover: 'bg-orange-50 dark:bg-orange-900/20' },
                'fin': { bg: 'bg-red-500', text: 'text-red-700', bgHover: 'bg-red-50 dark:bg-red-900/20' },
                'extraccion': { bg: 'bg-purple-500', text: 'text-purple-700', bgHover: 'bg-purple-50 dark:bg-purple-900/20' }
              }
              
              const color = coloresHito[hito.tipo as keyof typeof coloresHito] || coloresHito.firma

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="absolute transform -translate-x-1/2 group cursor-pointer"
                  style={{ left: `${posicion}%` }}
                >
                  {/* Indicador del hito */}
                  <div className={`w-5 h-5 ${color.bg} rounded-full border-2 border-white dark:border-gray-800 shadow-lg flex items-center justify-center transform translate-y-2 group-hover:scale-125 transition-transform`}>
                    <IconComponent className="w-2.5 h-2.5 text-white" />
                  </div>
                  
                  {/* Tooltip detallado */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className={`${color.bgHover} px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 whitespace-nowrap`}>
                      <div className={`text-sm font-medium ${color.text} dark:text-gray-300`}>
                        {hito.label}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatearFecha(hito.fecha!)}
                      </div>
                      {hito.fecha === hoyISO && (
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ¡Fecha actual!
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Métricas detalladas del cronograma */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tiempo Transcurrido</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {contrato.estado_contrato === 'En ejecución' 
              ? `${estadisticas.porcentajeCompletado.toFixed(1)}%`
              : '-'
            }
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</div>
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {contrato.estado_contrato || 'No definido'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hitos Registrados</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {todasLasFechas.filter(f => f.tipo !== 'hoy').length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractGantt