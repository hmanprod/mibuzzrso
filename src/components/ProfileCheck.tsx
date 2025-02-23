'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingModal } from './onboarding/OnboardingModal';

const PUBLIC_ROUTES = ['/auth/login', '/auth/logout', '/auth/register', '/auth/verify-email', '/auth/reset-password'];

export function ProfileCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Si on n'est pas sur une route publique et qu'il n'y a pas d'utilisateur, on redirige
    if (!isPublicRoute && !user) {
      router.push('/auth/login');
    }
  }, [user, isPublicRoute, router]);

  // Sur une route publique, on affiche simplement le contenu
  if (isPublicRoute) {
    return children;
  }

  // Sur une route protégée sans utilisateur, on n'affiche rien
  if (!user) {
    return null;
  }

  // Sur une route protégée avec utilisateur, on affiche le contenu et le modal d'onboarding
  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}
