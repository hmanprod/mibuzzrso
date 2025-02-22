import { ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { OnboardingProvider } from './OnboardingProvider';
import { Toaster } from '@/components/ui/toaster';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const supabase = createClientComponentClient();

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <OnboardingProvider>
        {children}
        <Toaster />
      </OnboardingProvider>
    </SessionContextProvider>
  );
}
