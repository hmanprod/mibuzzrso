'use client';

import { SessionProvider } from '@/components/providers/SessionProvider';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider initialUser={session?.user ?? null}>
      {children}
      <Toaster />
    </SessionProvider>
  );
}
