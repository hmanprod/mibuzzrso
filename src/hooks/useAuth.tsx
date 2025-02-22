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
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
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

  useEffect(() => {
    // Check active sessions and get user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
        
        // Reset pendingVerificationEmail if user is verified
        if (session.user.email_confirmed_at) {
          setPendingVerificationEmail(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (pendingVerificationEmail) {
      const timeout = setTimeout(() => {
        setPendingVerificationEmail(null);
      }, 60 * 60 * 1000); // 1 hour

      return () => clearTimeout(timeout);
    }
  }, [pendingVerificationEmail]);

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
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
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
      setPendingVerificationEmail(null);  // Reset on signout
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      if (profile) {
        setProfile({ ...profile, ...data });
      }

      return { error: null };
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
      setPendingVerificationEmail(null);  // Reset after successful verification
    }

    return { error };
  };

  const value = {
    user,
    profile,
    loading,
    pendingVerificationEmail,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resendConfirmationEmail,
    confirmEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
