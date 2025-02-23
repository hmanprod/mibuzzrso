'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

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
  confirmEmail: (confirmationCode: string) => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Fonction utilitaire pour charger le profil
  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    return { data, error };
  };

  useEffect(() => {
    // Vérification initiale de la session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
          // Reset pendingVerificationEmail si l'utilisateur est vérifié
          if (session.user.email_confirmed_at) {
            setPendingVerificationEmail(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Souscription aux changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
          // Reset pendingVerificationEmail si l'utilisateur est vérifié
          if (session.user.email_confirmed_at) {
            setPendingVerificationEmail(null);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
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
    try {
      setLoading(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && authData.user) {
        const { data: profileData } = await loadProfile(authData.user.id);
        return { 
          data: { 
            user: authData.user,
            profile: profileData || null
          },
          error: null 
        };
      }

      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('signOut');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      console.log('Résultat de la déconnexion:', error ? 'Erreur' : 'Succès');
      console.log('Détails de l\'erreur:', error);
      if (!error) {
        setUser(null);
        setProfile(null);
        setPendingVerificationEmail(null);
      }
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
      return { error: new Error('No pending verification email') };
    }
    return await supabase.auth.resend({
      type: 'signup',
      email: pendingVerificationEmail,
    });
  };

  const confirmEmail = async (confirmationCode: string) => {
    const { error } = await supabase.auth.verifyOTP({
      confirmationCode,
      email: pendingVerificationEmail,
    });

    if (!error) {
      setPendingVerificationEmail(null);
    }

    return { error };
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback/google`,
        },
      });
      
      if (error) {
        throw error;
      }
  
      return { data, error };
    } catch (error) {
      return { error: error as Error };
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
        handleGoogleSignIn,
        confirmEmail,
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
