import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware con headers anti-caché agresivos para prevenir datos obsoletos
 * Especialmente importante después de la eliminación de "Unidades de Proyecto"
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Headers anti-caché agresivos para todas las rutas
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('X-Accel-Expires', '0')

  // Headers adicionales para prevenir caché del navegador
  response.headers.set('Vary', 'Accept-Encoding')
  response.headers.set('X-Cache-Control', 'no-cache')

  // Para archivos de datos, forzar recarga
  if (pathname.startsWith('/data/')) {
    response.headers.set('Last-Modified', new Date().toUTCString())
    response.headers.set('ETag', `"${Date.now()}"`)
  }

  return response
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas principales
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}