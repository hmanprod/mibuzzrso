'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { useSession } from '@/components/providers/SessionProvider';

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/logout',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/callback/google',
  '/auth/confirm/routes'
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route) || pathname === route
  );

  useEffect(() => {
    const getSession = async () => {
      if (!user && !isPublicRoute) {
        router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    getSession();
  }, [user, router, pathname, isPublicRoute]);

  // Show loading spinner while session is undefined (initial load)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no session and not a public route, return null (redirect will happen in useEffect)
  if (!user && !isPublicRoute) {
    return null;
  }

  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}
