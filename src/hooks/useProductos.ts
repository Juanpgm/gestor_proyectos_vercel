'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  getCentroGestorAccessFromSession,
  buildAllowedBpinsSet,
  filterByAllowedBpins
} from '@/utils/centroGestorAccess'

export interface Producto {
  bpin: number
  cod_producto: number
  cod_producto_mga: number
  nombre_producto: string
  tipo_meta_producto: string
  descripcion_avance_producto: string | null
  periodo_corte: string
  cantidad_programada_producto: number
  ponderacion_producto: number
  avance_producto: number
  ejecucion_fisica_producto: number
  avance_real_producto: number
  avance_producto_acumulado: number
  ejecucion_ppto_producto: number
  archivo_origen: string
}

interface UseProductosReturn {
  productos: Producto[]
  loading: boolean
  error: string | null
  totalProductos: number
  totalBudget: number
  completedProducts: number
  inProgressProducts: number
  notStartedProducts: number
  averageProgress: number
  productsByType: Record<string, number>
}

/**
 * Hook para cargar y manejar datos de productos del plan de acción
 */
export function useProductos(): UseProductosReturn {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoading(true)
        setError(null)

        const [productosResponse, proyectosResponse] = await Promise.all([
          fetch('/data/seguimiento_pa/seguimiento_productos_pa.json'),
          fetch('/data/ejecucion_presupuestal/datos_caracteristicos_proyectos.json')
        ])
        
        if (!productosResponse.ok) {
          throw new Error(`Error ${productosResponse.status}: ${productosResponse.statusText}`)
        }

        if (!proyectosResponse.ok) {
          throw new Error(`Error ${proyectosResponse.status}: ${proyectosResponse.statusText}`)
        }

        const [data, proyectosData]: [Producto[], Record<string, any>[]] = await Promise.all([
          productosResponse.json(),
          proyectosResponse.json()
        ])
        
        if (!Array.isArray(data)) {
          throw new Error('Los datos de productos no tienen el formato esperado')
        }

        console.log('📦 Productos cargados:', {
          total: data.length,
          sample: data.slice(0, 3)
        })

        const centroGestorAccess = getCentroGestorAccessFromSession()
        const allowedBpins = buildAllowedBpinsSet(
          proyectosData || [],
          centroGestorAccess,
          ['nombre_centro_gestor', 'responsible', 'centro_gestor']
        )

        const productosFiltrados = filterByAllowedBpins(data, allowedBpins)

        setProductos(productosFiltrados)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido cargando productos'
        console.error('❌ Error cargando productos:', err)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProductos()
  }, [])

  // Métricas calculadas
  const metrics = useMemo(() => {
    if (productos.length === 0) {
      return {
        totalBudget: 0,
        completedProducts: 0,
        inProgressProducts: 0,
        notStartedProducts: 0,
        averageProgress: 0,
        productsByType: {}
      }
    }

    const totalBudget = productos.reduce((sum, producto) => sum + producto.ejecucion_ppto_producto, 0)
    
    const completedProducts = productos.filter(p => p.avance_producto >= p.cantidad_programada_producto).length
    const inProgressProducts = productos.filter(p => p.avance_producto > 0 && p.avance_producto < p.cantidad_programada_producto).length
    const notStartedProducts = productos.filter(p => p.avance_producto === 0).length
    
    const averageProgress = productos.reduce((sum, p) => {
      const progress = p.cantidad_programada_producto > 0 ? p.avance_producto / p.cantidad_programada_producto : 0
      return sum + Math.min(progress, 1)
    }, 0) / productos.length

    // Agrupación por tipo de producto
    const productsByType = productos.reduce((acc, producto) => {
      const type = producto.nombre_producto
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalBudget,
      completedProducts,
      inProgressProducts,
      notStartedProducts,
      averageProgress,
      productsByType
    }
  }, [productos])

  return {
    productos,
    loading,
    error,
    totalProductos: productos.length,
    ...metrics
  }
}

export default useProductos
