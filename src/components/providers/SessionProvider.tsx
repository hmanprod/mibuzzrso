'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Profile } from '@/types/database';

type SessionContextType = {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  isLoading: true,
  updateProfile: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {

  console.log('🔄 Initial user:', initialUser);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Effect to sync with initialUser
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Effect to monitor user state changes
  useEffect(() => {
    console.log('🔄 User state updated:', user);
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
        console.log('🔄 Fetching profile for user:', user);
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUser(user); //Weird Fix that works to get user

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) throw new Error('User not authenticated');
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch updated profile
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ user, profile, isLoading, updateProfile }}>
      {children}
    </SessionContext.Provider>
  );
}