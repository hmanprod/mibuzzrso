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
  const { user, isLoading, profile } = useSession();

  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname.startsWith(route) || pathname === route
  );

  // console.log("from authGuard: the user is ", profile);
  
  useEffect(() => {
    if (profile?.status === 'blocked' && pathname !== '/account-blocked') {
      router.push('/account-blocked');
    } else if (!user && !isPublicRoute) {
      router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, pathname, isPublicRoute, profile]);

  // Show loading spinner only while session is loading
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
