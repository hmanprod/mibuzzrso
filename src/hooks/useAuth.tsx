'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signUp: (email: string, password: string, profileData?: Partial<Profile>) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  handleGoogleSignIn: () => Promise<{ error: AuthError | null }>;
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

  // Function to load profile data
  const loadProfile = async (userId: string) => {
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
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          setError(userError);
          setUser(null);
          setProfile(null);
        } else {
          setUser(currentUser);
          if (currentUser) {
            await loadProfile(currentUser.id);
          } else {
            setProfile(null);
          }
          setError(null);
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
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error);
      } else if (data.user) {
        await loadProfile(data.user.id);
        setPendingVerificationEmail(null);
      }
      return { data, error };
    } catch (err) {
      console.error('Sign in error:', err);
      const error = new Error('Failed to sign in') as AuthError;
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, profileData: Partial<Profile> = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) {
        setError(error);
      } else if (data.user) {
        // Set pending verification email
        setPendingVerificationEmail(email);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            ...profileData
          }]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        } else {
          await loadProfile(data.user.id);
        }
      }
      return { data, error };
    } catch (err) {
      console.error('Sign up error:', err);
      const error = new Error('Failed to sign up') as AuthError;
      return { data: null, error };
    }
  };

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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error);
      } else {
        setPendingVerificationEmail(null);
      }
      return { error };
    } catch (err) {
      console.error('Google sign in error:', err);
      const error = new Error('Failed to sign in with Google') as AuthError;
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
    signIn,
    signUp,
    signOut,
    handleGoogleSignIn,
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
