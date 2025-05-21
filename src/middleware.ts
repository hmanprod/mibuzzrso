import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const MAINTENANCE_ROUTES = process.env.NEXT_PUBLIC_MAINTENANCE_ROUTES
  ? process.env.NEXT_PUBLIC_MAINTENANCE_ROUTES.split(',')
  : [];

export async function middleware(request: NextRequest) {
  // Vérifier si la route actuelle est en maintenance
  const path = request.nextUrl.pathname;
  if (MAINTENANCE_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return await updateSession(request)
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}