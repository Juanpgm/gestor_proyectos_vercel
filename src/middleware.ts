import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware con headers anti-caché agresivos para prevenir datos obsoletos
 * Especialmente importante después de la eliminación de "Unidades de Proyecto"
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle @vite/client requests to prevent 404 errors
  if (pathname === '/@vite/client' || pathname.startsWith('/@vite/')) {
    // Redirect to a stub file instead of returning empty response
    return NextResponse.rewrite(new URL('/vite-client-stub.js', request.url))
  }
  
  // Skip middleware for API routes to avoid cache conflicts
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next()

  // Headers anti-caché SOLO para rutas de páginas, no para API
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
    // Aplicar solo a rutas de páginas, excluir API y archivos estáticos
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}