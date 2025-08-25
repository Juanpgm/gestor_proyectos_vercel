'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface PopupGaugeChartProps {
  progress: number
  className?: string
  size?: 'small' | 'medium'
}

const PopupGaugeChart: React.FC<PopupGaugeChartProps> = ({
  progress,
  className = '',
  size = 'small'
}) => {
  // Validar y normalizar el progreso
  const normalizedProgress = Math.max(0, Math.min(100, progress || 0))
  
  // Configuración de tamaños
  const sizeConfig = {
    small: {
      containerHeight: 60,
      innerRadius: 18,
      outerRadius: 28,
      fontSize: 11
    },
    medium: {
      containerHeight: 80,
      innerRadius: 25,
      outerRadius: 35,
      fontSize: 13
    }
  }
  
  const config = sizeConfig[size]
  
  // Función para obtener el color del progreso
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#059669' // Verde oscuro
    if (progress >= 50) return '#10B981' // Verde
    if (progress >= 25) return '#F59E0B' // Amarillo
    return '#EF4444' // Rojo
  }
  
  // Datos para el gauge
  const gaugeData = [
    { 
      name: 'Completado', 
      value: normalizedProgress, 
      color: getProgressColor(normalizedProgress) 
    },
    { 
      name: 'Pendiente', 
      value: 100 - normalizedProgress, 
      color: '#E5E7EB' 
    }
  ]
  
  return (
    <div className={`inline-block ${className}`}>
      <div style={{ height: config.containerHeight, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={config.innerRadius}
              outerRadius={config.outerRadius}
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Valor central del gauge */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ marginTop: size === 'small' ? '8px' : '10px' }}
        >
          <div className="text-center">
            <div 
              className="font-bold"
              style={{ 
                color: getProgressColor(normalizedProgress),
                fontSize: `${config.fontSize}px`,
                lineHeight: 1
              }}
            >
              {normalizedProgress}%
            </div>
            <div 
              className="text-gray-500"
              style={{ 
                fontSize: `${config.fontSize - 2}px`,
                lineHeight: 1
              }}
            >
              progreso
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PopupGaugeChart
