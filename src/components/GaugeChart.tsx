'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface GaugeChartProps {
  value: number // Valor entre 0 y 100
  size?: number
  thickness?: number
  label?: string
  showValue?: boolean
  colors?: {
    active: string
    inactive: string
    text?: string // Opcional, usar clases de Tailwind por defecto
  }
  className?: string
}

export default function GaugeChart({
  value,
  size = 120,
  thickness = 18, // Aumentado 50% (de 12 a 18)
  label,
  showValue = true,
  colors = {
    active: '#10B981', // Verde
    inactive: '#E5E7EB' // Gris claro
  },
  className = ''
}: GaugeChartProps) {
  // Asegurar que el valor esté entre 0 y 100
  const normalizedValue = Math.max(0, Math.min(100, value))
  
  // Datos para el gauge (semicírculo)
  const data = [
    { name: 'completed', value: normalizedValue },
    { name: 'remaining', value: 100 - normalizedValue }
  ]

  // Colores para las secciones
  const COLORS = [colors.active, colors.inactive]

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div style={{ width: size, height: size / 2 + 20 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="90%" // Posicionar en la parte inferior para crear semicírculo
              startAngle={180} // Empezar desde la izquierda
              endAngle={0} // Terminar en la derecha
              innerRadius={size / 2 - thickness}
              outerRadius={size / 2}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Valor central - centrado mejorado */}
      {showValue && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ 
            paddingTop: size * 0.1 // Ajuste dinámico basado en el tamaño
          }}
        >
          <div className="text-center">
            <span 
              className="font-bold leading-none text-gray-900 dark:text-white block"
              style={{
                fontSize: `${Math.max(size * 0.15, 14)}px` // Tamaño dinámico basado en el gauge
              }}
            >
              {normalizedValue.toFixed(0)}%
            </span>
            {label && (
              <span 
                className="text-center leading-none text-gray-700 dark:text-gray-300 block mt-1"
                style={{
                  fontSize: `${Math.max(size * 0.08, 10)}px` // Tamaño dinámico para label
                }}
              >
                {label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente especializado para avance de actividad
export function ActivityProgressGauge({ value, className = '' }: { value: number, className?: string }) {
  return (
    <GaugeChart
      value={value}
      size={100}
      thickness={15} // 50% más grueso (de 10 a 15)
      showValue={true}
      colors={{
        active: '#84CC16', // Verde limón para el avance
        inactive: '#EF4444' // Rojo para lo que falta
      }}
      className={className}
    />
  )
}

// Componente especializado para avance de producto
export function ProductProgressGauge({ value, className = '', size = 'medium' }: { 
  value: number, 
  className?: string,
  size?: 'small' | 'medium' | 'large'
}) {
  const sizeMap = {
    small: { diameter: 80, thickness: 12 }, // 50% más grueso (de 8 a 12)
    medium: { diameter: 100, thickness: 15 }, // 50% más grueso (de 10 a 15)
    large: { diameter: 120, thickness: 18 } // 50% más grueso (de 12 a 18)
  }

  const { diameter, thickness } = sizeMap[size]

  return (
    <GaugeChart
      value={value}
      size={diameter}
      thickness={thickness}
      showValue={true}
      colors={{
        active: '#84CC16', // Verde limón para el avance
        inactive: '#EF4444' // Rojo para lo que falta
      }}
      className={className}
    />
  )
}

// Componente especializado para ejecución presupuestal
export function BudgetExecutionGauge({ value, className = '', size = 'medium' }: { 
  value: number, 
  className?: string,
  size?: 'small' | 'medium' | 'large'
}) {
  // Colores basados en el porcentaje de ejecución
  const getColor = (val: number) => {
    if (val >= 75) return '#10B981' // Verde - Buena ejecución
    if (val >= 50) return '#F59E0B' // Amarillo - Ejecución media
    if (val >= 25) return '#EF4444' // Rojo - Baja ejecución
    return '#DC2626' // Rojo oscuro - Muy baja ejecución
  }

  const sizeMap = {
    small: { diameter: 80, thickness: 12 }, // 50% más grueso (de 8 a 12)
    medium: { diameter: 100, thickness: 15 }, // 50% más grueso (de 10 a 15)
    large: { diameter: 120, thickness: 18 } // 50% más grueso (de 12 a 18)
  }

  const { diameter, thickness } = sizeMap[size]

  return (
    <GaugeChart
      value={value}
      size={diameter}
      thickness={thickness}
      showValue={true}
      colors={{
        active: getColor(value),
        inactive: '#E5E7EB'
      }}
      className={className}
    />
  )
}

// Componente especializado para progreso físico con colores de la tabla
export function PhysicalProgressGauge({ value, className = '', size = 'medium' }: { 
  value: number, 
  className?: string,
  size?: 'small' | 'medium' | 'large'
}) {
  // Colores basados en la lógica de la tabla para progreso físico
  const getColor = (progress: number) => {
    if (progress < 30) return '#EF4444' // Rojo
    if (progress < 60) return '#F59E0B' // Amarillo
    if (progress < 90) return '#3B82F6' // Azul
    return '#10B981' // Verde
  }

  const sizeMap = {
    small: { diameter: 80, thickness: 12 },
    medium: { diameter: 100, thickness: 15 },
    large: { diameter: 120, thickness: 18 }
  }

  const { diameter, thickness } = sizeMap[size]

  return (
    <GaugeChart
      value={value}
      size={diameter}
      thickness={thickness}
      showValue={true}
      colors={{
        active: getColor(value),
        inactive: '#E5E7EB'
      }}
      className={className}
    />
  )
}

// Componente especializado para progreso financiero con colores de la tabla
export function FinancialProgressGauge({ value, className = '', size = 'medium' }: { 
  value: number, 
  className?: string,
  size?: 'small' | 'medium' | 'large'
}) {
  // Colores basados en la lógica de la tabla para progreso financiero
  const getColor = (progress: number) => {
    if (progress < 30) return '#DC2626' // Rojo oscuro
    if (progress < 60) return '#EA580C' // Naranja
    if (progress < 90) return '#059669' // Verde esmeralda
    return '#16A34A' // Verde
  }

  const sizeMap = {
    small: { diameter: 80, thickness: 12 },
    medium: { diameter: 100, thickness: 15 },
    large: { diameter: 120, thickness: 18 }
  }

  const { diameter, thickness } = sizeMap[size]

  return (
    <GaugeChart
      value={value}
      size={diameter}
      thickness={thickness}
      showValue={true}
      colors={{
        active: getColor(value),
        inactive: '#E5E7EB'
      }}
      className={className}
    />
  )
}
