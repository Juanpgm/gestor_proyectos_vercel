import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Por ahora, solo continuamos con la request normal
  // La autenticación se maneja en el cliente con AuthWrapper
  return NextResponse.next()
}

export const config = {
  // No aplicar middleware a rutas estáticas, API, y archivos del sistema
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}