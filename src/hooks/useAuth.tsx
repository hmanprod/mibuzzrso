'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '@/types/database';

type GoogleSignInResponse = {
  user: User | null;
  profile: Profile | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  pendingVerificationEmail: string | null;
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ 
    data: { user: User | null; profile: Profile | null } | null;
    error: AuthError | null 
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  killAllSessions: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  resendConfirmationEmail: () => Promise<{ error: AuthError | null }>;
  handleGoogleSignIn: () => Promise<{ data: GoogleSignInResponse | null; error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Fonction utilitaire pour charger le profil
  const loadProfile = async (userId: string) => {
    try {
      console.log('🔍 Loading profile for user:', userId);
      console.log('📱 Current local profile state:', profile);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        return { data: null, error };
      }

      console.log('✨ Supabase profile data:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Unexpected error loading profile:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('✨ Initial session:', session);
        
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          const { data: profileData } = await loadProfile(session.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
          if (session.user.email_confirmed_at) {
            setPendingVerificationEmail(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session);
        
        if (!mounted) return;

        try {
          if (session?.user) {
            setUser(session.user);
            const { data: profileData } = await loadProfile(session.user.id);
            if (mounted && profileData) {
              setProfile(profileData);
            }
            if (session.user.email_confirmed_at) {
              setPendingVerificationEmail(null);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch (error) {
          console.error('❌ Error handling auth state change:', error);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Reset pendingVerificationEmail après 1 heure
  useEffect(() => {
    if (pendingVerificationEmail) {
      const timeout = setTimeout(() => {
        setPendingVerificationEmail(null);
      }, 60 * 60 * 1000); // 1 heure

      return () => clearTimeout(timeout);
    }
  }, [pendingVerificationEmail]);

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      setLoading(true);
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData,
        }
      });
      if (!result.error) {
        setPendingVerificationEmail(email);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    try {
      setLoading(true);
      
      // Clear any existing state first
      setUser(null);
      setProfile(null);
      
      console.log('📡 Starting Supabase auth call...');
      
      let authResponse;
      try {
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('✨ Raw auth response received:', authResponse);
      } catch (signInError) {
        console.error('💥 Error during signInWithPassword:', signInError);
        throw signInError;
      }

      const { data: authData, error: signInError } = authResponse;
      console.log('📋 Auth data:', authData);
      console.log('❗ Auth error:', signInError);

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        return { data: null, error: signInError };
      }

      if (!authData?.user) {
        console.error('❌ No user data in auth response');
        return {
          data: null,
          error: new AuthError('No user data received', 400)
        };
      }

      // Set the user immediately
      console.log('👤 Setting user after successful sign in:', authData.user);
      setUser(authData.user);

      // Load profile
      console.log('🔍 Loading profile after sign in...');
      let profileData = null;
      try {
        const profileResponse = await loadProfile(authData.user.id);
        profileData = profileResponse.data;
        console.log('📋 Profile response:', profileResponse);
      } catch (profileError) {
        console.error('💥 Error loading profile:', profileError);
      }
      
      if (profileData) {
        console.log('👥 Setting profile after sign in:', profileData);
        setProfile(profileData);
      } else {
        console.log('⚠️ No profile data found after sign in');
      }

      const response: {
        data: { user: User | null; profile: Profile | null } | null;
        error: AuthError | null;
      } = {
        data: {
          user: authData.user,
          profile: profileData
        },
        error: null
      };
      console.log('✅ Final sign in response:', response);
      return response;
    } catch (error) {
      console.error('❌ Unexpected error during sign in:', error);
      const authError = new AuthError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500
      );
      return {
        data: null,
        error: authError
      };
    } finally {
      console.log('🏁 Sign in process completed');
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('signOut');
    setLoading(true);
    try {
      setUser(null);
      setProfile(null);
      setPendingVerificationEmail(null);

      const { error } = await supabase.auth.signOut();
      console.log('Résultat de la déconnexion:', error ? 'Erreur' : 'Succès');
      console.log('Détails de l\'erreur:', error);

      return { error };
    } finally {
      setLoading(false);
    }
  };

  const killAllSessions = async () => {
    try {
      setLoading(true);
      // Récupérer la session actuelle
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Déconnecter la session actuelle
        await supabase.auth.signOut();
      }
      // Réinitialiser les states
      setUser(null);
      setProfile(null);
      setPendingVerificationEmail(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (!error) {
        setProfile((prev) => prev ? { ...prev, ...data } : null);
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resendConfirmationEmail = async () => {
    if (!pendingVerificationEmail) {
      return { error: new AuthError('No pending verification email', 400) };
    }
    return await supabase.auth.resend({
      type: 'signup',
      email: pendingVerificationEmail,
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Error during Google sign in:', error);
        return { data: null, error };
      }

      // After successful OAuth, we need to get the user
      const { data: { user } } = await supabase.auth.getUser();
      
      const googleSignInResponse: GoogleSignInResponse = {
        user,
        profile: null // Profile will be fetched separately by the auth state change listener
      };

      return { data: googleSignInResponse, error: null };
    } catch (error) {
      console.error('Error during Google sign in:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        pendingVerificationEmail,
        signUp,
        signIn,
        signOut,
        killAllSessions,
        updateProfile,
        resendConfirmationEmail,
        handleGoogleSignIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
