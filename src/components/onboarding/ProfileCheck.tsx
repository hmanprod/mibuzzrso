"use client";

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ProfileCheckProps {
  children: React.ReactNode;
}

export function ProfileCheck({ children }: ProfileCheckProps) {
  const { loading: onboardingLoading } = useOnboarding();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = () => {
    const authRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/reset-password'
    ];
    return authRoutes.some(route => pathname?.startsWith(route));
  };

  useEffect(() => {
    if (!authLoading && !user && !isAuthRoute()) {
      router.push('/auth/login');
    }
  }, [user, authLoading, pathname]);

  if (authLoading || onboardingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthRoute()) {
    return <>{children}</>;
  }

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
