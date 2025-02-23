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

  // useEffect(() => {
  //   let mounted = true;

  //   const initAuth = async () => {
  //     try {
  //       console.log('🚀 Initializing auth...');
  //       console.log('📱 Current local state:', { user, profile });

  //       // Get both session and user to compare
  //       const [sessionResult, userResult] = await Promise.all([
  //         supabase.auth.getSession(),
  //         supabase.auth.getUser()
  //       ]);

  //       console.log('✨ Supabase getSession result:', sessionResult);
  //       console.log('✨ Supabase getUser result:', userResult);

  //       if (!mounted) return;
        
  //       const activeUser = userResult.data.user || sessionResult.data.session?.user;
        
  //       if (activeUser) {
  //         console.log('👤 Setting user from init:', activeUser);
  //         setUser(activeUser);
  //         const { data: profileData } = await loadProfile(activeUser.id);
  //         if (profileData) {
  //           console.log('👥 Setting profile from init:', profileData);
  //           setProfile(profileData);
  //         }
  //         if (activeUser.email_confirmed_at) {
  //           setPendingVerificationEmail(null);
  //         }
  //       } else {
  //         console.log('🚫 No active user found, clearing local state');
  //         setUser(null);
  //         setProfile(null);
  //       }
  //     } catch (error) {
  //       console.error('❌ Error initializing auth:', error);
  //     } finally {
  //       if (mounted) {
  //         setLoading(false);
  //       }
  //     }
  //   };

  //   initAuth();

  //   const { data: { subscription } } = supabase.auth.onAuthStateChange(
  //     async (event, session) => {
  //       if (!mounted) return;
        
  //       console.log('🔄 Auth state changed:', event);
  //       console.log('📱 Current local state:', { user, profile });
  //       console.log('✨ New session from onAuthStateChange:', session);

  //       // Double check with getUser to ensure consistency
  //       const { data: userData } = await supabase.auth.getUser();
  //       console.log('✨ getUser result after state change:', userData);
        
  //       const activeUser = userData.user || session?.user;
        
  //       if (activeUser) {
  //         console.log('👤 Setting user from auth change:', activeUser);
  //         setUser(activeUser);
  //         const { data: profileData } = await loadProfile(activeUser.id);
  //         if (profileData) {
  //           console.log('👥 Setting profile from auth change:', profileData);
  //           setProfile(profileData);
  //         }
  //         if (activeUser.email_confirmed_at) {
  //           setPendingVerificationEmail(null);
  //         }
  //       } else {
  //         console.log('🚫 No active user in state change, clearing local state');
  //         setUser(null);
  //         setProfile(null);
  //       }
  //     }
  //   );

  //   return () => {
  //     mounted = false;
  //     subscription.unsubscribe();
  //   };
  // }, []);

  // // Reset pendingVerificationEmail après 1 heure
  // useEffect(() => {
  //   if (pendingVerificationEmail) {
  //     const timeout = setTimeout(() => {
  //       setPendingVerificationEmail(null);
  //     }, 60 * 60 * 1000); // 1 heure

  //     return () => clearTimeout(timeout);
  //   }
  // }, [pendingVerificationEmail]);

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
        return { data: null, error: new Error('No user data received') };
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

      const response = { 
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
      return { data: null, error: error as AuthError };
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
