import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Configuration des routes
const ROUTES = {
  public: [
    '/auth/login',
    '/auth/register',
    '/auth/confirm',
    '/testd',
    '/'
  ],
  private: [
    '/feed',
    '/profile',
    '/settings'
  ],
  // Routes auth sont spéciales car elles redirigent les utilisateurs connectés
  auth: ['/auth']
} as const

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // Vérifie si c'est une route publique
  const isPublicRoute = ROUTES.public.some(route => 
    pathname.startsWith(route)
  )

  // Vérifie si c'est une route privée
  const isPrivateRoute = ROUTES.private.some(route => 
    pathname.startsWith(route)
  )

  // Vérifie si c'est une route d'authentification
  const isAuthRoute = ROUTES.auth.some(route => 
    pathname.startsWith(route)
  )

  // Si c'est une route publique, on laisse passer
  if (isPublicRoute) {
    return res
  }

  // Redirection des utilisateurs non authentifiés vers login pour les routes privées
  if (!session && isPrivateRoute) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirection des utilisateurs authentifiés hors des pages auth
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  // Pour toutes les autres routes non listées, on exige l'authentification par défaut
  if (!session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}