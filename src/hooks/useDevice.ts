/**
 * useDevice — Hook unificado de detección de dispositivo.
 *
 * Reemplaza y absorbe useIPadDetection.ts (que se mantiene como wrapper deprecado).
 * Escribe una cookie `x-device-type` para que el middleware de Next.js pueda
 * hacer redirects server-side antes del primer render del cliente.
 *
 * Retorna:
 *   isMobile   — teléfono (< 768px o UA de móvil)
 *   isTablet   — tablet (768-1023px, incluye iPads)
 *   isDesktop  — escritorio (≥ 1024px)
 *   isTouch    — cualquier dispositivo con pantalla táctil
 *   screenWidth — ancho actual del viewport
 *   orientation — 'portrait' | 'landscape'
 */
'use client'

import { useState, useEffect } from 'react'
import { breakpoints } from '@/theme'

export interface DeviceInfo {
  isMobile:    boolean
  isTablet:    boolean
  isDesktop:   boolean
  isTouch:     boolean
  screenWidth: number
  orientation: 'portrait' | 'landscape'
}

// Detección de User-Agent de teléfono (server-safe cuando se llama con navigator.userAgent)
export function isMobileUserAgent(ua: string): boolean {
  return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua) &&
    !/iPad|tablet|Tablet/i.test(ua)
}

// Tamaños breakpoints numéricos
const MOBILE_MAX  = breakpoints.px.mobile  // 768
const TABLET_MAX  = breakpoints.px.tablet  // 1024

function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    // SSR: devolvemos desktop por defecto
    return { isMobile: false, isTablet: false, isDesktop: true, isTouch: false, screenWidth: 1280, orientation: 'landscape' }
  }

  const width = window.innerWidth
  const ua    = navigator.userAgent

  const isMobileUA = isMobileUserAgent(ua)
  const isTouch    = ('ontouchstart' in window) || navigator.maxTouchPoints > 0

  const isMobile  = isMobileUA || width < MOBILE_MAX
  const isTablet  = !isMobile && width < TABLET_MAX
  const isDesktop = !isMobile && !isTablet

  const orientation = window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'

  return { isMobile, isTablet, isDesktop, isTouch, screenWidth: width, orientation }
}

// Escribe cookie para que el middleware pueda leerla en futuras requests
function writeDeviceCookie(isMobile: boolean) {
  const value = isMobile ? 'mobile' : 'desktop'
  // max-age: 1 hora. SameSite=Lax para que funcione con redirects GET.
  document.cookie = `x-device-type=${value}; path=/; max-age=3600; SameSite=Lax`
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(getDeviceInfo)

  useEffect(() => {
    // Escribe la cookie en el primer render del cliente
    writeDeviceCookie(device.isMobile)

    let timer: ReturnType<typeof setTimeout>

    function handleResize() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const next = getDeviceInfo()
        setDevice(prev => {
          // Solo actualiza si algo cambió
          if (
            prev.isMobile    !== next.isMobile    ||
            prev.isTablet    !== next.isTablet    ||
            prev.screenWidth !== next.screenWidth ||
            prev.orientation !== next.orientation
          ) {
            writeDeviceCookie(next.isMobile)
            return next
          }
          return prev
        })
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return device
}

export default useDevice
