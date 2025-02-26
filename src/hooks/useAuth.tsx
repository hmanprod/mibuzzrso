'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  error: AuthError | null;
  isLoading: boolean;
  pendingVerificationEmail: string | null;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  resendConfirmationEmail: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  // Function to load profile data wrapped in useCallback
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error in loadProfile:', err);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      console.log('🔄 Checking user...');
      try {
        const supabase = createClient();
        const { data, error: userError } = await supabase.auth.getUser();
        console.log('🔄 Current user:', data?.user);
        
        if (userError) {
          setError(userError);
          setUser(null);
          setProfile(null);
        } else {
          setUser(data?.user ?? null);
          if (data?.user) {
            await loadProfile(data.user.id);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error getting user:', err);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial user check
    getUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        if (session?.user) {
          await loadProfile(session.user.id);
        }
        router.refresh();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setPendingVerificationEmail(null);
        router.refresh();
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
        if (session?.user) {
          await loadProfile(session.user.id);
        }
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, loadProfile]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error);
      } else {
        setProfile(null);
        setPendingVerificationEmail(null);
      }
      return { error };
    } catch (err) {
      console.error('Sign out error:', err);
      const error = new Error('Failed to sign out') as AuthError;
      return { error };
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...data } : null);
      }

      return { error: error as Error | null };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { error: error as Error };
    }
  };

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
    user,
    profile,
    error,
    isLoading,
    pendingVerificationEmail,
    signOut,
    updateProfile,
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
