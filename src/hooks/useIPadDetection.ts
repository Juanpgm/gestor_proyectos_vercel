'use client'

import { useState, useEffect } from 'react'

interface DeviceInfo {
  isIpad10: boolean
  isIpadPortrait: boolean
  isIpadLandscape: boolean
  screenWidth: number
  screenHeight: number
  devicePixelRatio: number
  isTouch: boolean
}

export const useIPadDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIpad10: false,
    isIpadPortrait: false,
    isIpadLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
    isTouch: false
  })

  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return

      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      
      // Detectar si es un dispositivo táctil
      const isTouch = (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        // @ts-ignore
        (navigator.msMaxTouchPoints > 0))

      // Detección específica para iPad 10ª generación
      // Resolución física: 2360x1640, CSS: ~834x1194
      const isIpad10Portrait = (
        width >= 820 && width <= 850 &&
        height >= 1170 && height <= 1220 &&
        dpr >= 2.0 && dpr <= 3.0 &&
        isTouch
      )

      const isIpad10Landscape = (
        width >= 1170 && width <= 1220 &&
        height >= 820 && height <= 850 &&
        dpr >= 2.0 && dpr <= 3.0 &&
        isTouch
      )

      const isIpad10 = isIpad10Portrait || isIpad10Landscape

      // Detección general de iPad (cualquier generación)
      const isIpadPortrait = (
        width >= 768 && width <= 834 &&
        height >= 1024 && height <= 1194 &&
        isTouch
      ) || isIpad10Portrait

      const isIpadLandscape = (
        width >= 1024 && width <= 1194 &&
        height >= 768 && height <= 834 &&
        isTouch
      ) || isIpad10Landscape

      setDeviceInfo({
        isIpad10,
        isIpadPortrait,
        isIpadLandscape,
        screenWidth: width,
        screenHeight: height,
        devicePixelRatio: dpr,
        isTouch
      })
    }

    // Detectar al cargar
    detectDevice()

    // Detectar en cambios de orientación/tamaño
    const handleResize = () => {
      setTimeout(detectDevice, 100) // Pequeño delay para que se actualice correctamente
    }

    const handleOrientationChange = () => {
      setTimeout(detectDevice, 200) // Delay mayor para cambios de orientación
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return deviceInfo
}

// Hook para obtener clases CSS específicas para iPad 10
export const useIPadClasses = () => {
  const deviceInfo = useIPadDetection()

  const getResponsiveClasses = (base: string, sm?: string, md?: string, lg?: string, ipad10?: string) => {
    let classes = base

    if (sm) classes += ` sm:${sm}`
    if (md) classes += ` md:${md}`
    if (lg) classes += ` lg:${lg}`
    if (ipad10 && deviceInfo.isIpad10) classes += ` ipad-10:${ipad10}`

    return classes
  }

  const getGridClasses = () => {
    if (deviceInfo.isIpad10) {
      return deviceInfo.isIpadLandscape 
        ? 'grid-cols-1 sm:grid-cols-2 ipad-10:grid-cols-5 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 ipad-10:grid-cols-3 lg:grid-cols-5'
    }
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
  }

  const getTableClasses = () => {
    if (deviceInfo.isIpad10) {
      return 'min-w-[800px] ipad-10:min-w-[820px] lg:min-w-[1200px]'
    }
    return 'min-w-[700px] sm:min-w-[900px] md:min-w-[1000px] lg:min-w-[1200px]'
  }

  const getTouchTargetClasses = () => {
    return deviceInfo.isTouch ? 'touch-target touch-friendly' : ''
  }

  return {
    deviceInfo,
    getResponsiveClasses,
    getGridClasses,
    getTableClasses,
    getTouchTargetClasses
  }
}

export default useIPadDetection