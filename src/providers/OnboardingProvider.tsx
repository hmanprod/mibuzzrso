import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Profile } from '@/types/database';

interface OnboardingContextType {
  isProfileComplete: boolean;
  isModalOpen: boolean;
  loading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: unknown }>;
  closeModal: () => void;
  checkProfileCompleteness: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider value={onboarding}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
}
