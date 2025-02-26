'use client';

import { createContext, useState, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  resendConfirmationEmail: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());


  const resendConfirmationEmail = async () => {
    if (!pendingVerificationEmail) {
      return { error: new Error('No pending verification email') as AuthError };
    }
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingVerificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (err) {
      console.error('Error in resendConfirmationEmail:', err);
      const error = new Error('Failed to resend confirmation email') as AuthError;
      return { error };
    }
  };

  const value = {
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
