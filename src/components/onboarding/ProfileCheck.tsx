"use client";

import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

interface ProfileCheckProps {
  children: React.ReactNode;
}

export function ProfileCheck({ children }: ProfileCheckProps) {
  const { loading } = useOnboarding();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      {children}
      <OnboardingModal />
    </>
  );
}
