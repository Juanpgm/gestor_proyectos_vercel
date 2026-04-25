import { NextRequest, NextResponse } from 'next/server'

// User-Agent regex para teléfonos (excluye iPads/tablets)
const MOBILE_UA_RE = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i
const TABLET_UA_RE = /iPad|tablet|Tablet/i

function isPhoneUserAgent(ua: string): boolean {
  return MOBILE_UA_RE.test(ua) && !TABLET_UA_RE.test(ua)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo redirigir si el usuario va a la ruta raíz y aún no está en /m
  if (pathname === '/' || pathname === '') {
    const ua          = request.headers.get('user-agent') ?? ''
    const deviceCookie = request.cookies.get('x-device-type')?.value

    const isMobileDevice =
      deviceCookie === 'mobile' ||
      (!deviceCookie && isPhoneUserAgent(ua))

    if (isMobileDevice) {
      const url = request.nextUrl.clone()
      url.pathname = '/m'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - /m/* (Mobile LITE — ya está en destino, no redirigir de nuevo)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|m(?:/.*)?$).*)',
  ],
}