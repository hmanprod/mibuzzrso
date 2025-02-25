'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { OnboardingModal } from '../onboarding/OnboardingModal';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      // Store the current path for redirect after login
      if (pathname !== '/auth/login') {
        router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, isLoading, router, pathname]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not loading and no user, return null (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}
