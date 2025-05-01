import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes qui ne nécessitent pas d'authentification
const publicRoutes = ['/auth', '/testd', '/'];

// Extensions de fichiers à exclure de la vérification d'authentification
const publicFileExtensions = ['.mp3', '.wav', '.ogg', '.aac'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    // Créer le client Supabase avec la gestion des cookies
    const supabase = createMiddlewareClient({ req, res });

    // Rafraîchir la session si nécessaire
    const { data: { session }, error } = await supabase.auth.getSession();

    const pathname = req.nextUrl.pathname;

    // Vérifier si c'est un fichier audio
    const isAudioFile = publicFileExtensions.some(ext => pathname.endsWith(ext));
    if (isAudioFile) {
      return res;
    }

    // Vérifier si c'est une route publique
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    if (isPublicRoute) {
      return res;
    }

    // Si pas de session et pas sur une route publique, rediriger vers login
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Si erreur de session, rediriger vers login
    if (error) {
      console.error('Session error:', error);
      const redirectUrl = new URL('/auth/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Important : Retourner la réponse avec les cookies mis à jour
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    const redirectUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Configuration du matcher pour Next.js
export const config = {
  matcher: [
    // Exclure les fichiers statiques et médias
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};