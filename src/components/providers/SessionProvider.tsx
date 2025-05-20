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
  admin: boolean
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  profile: null,
  isLoading: true,
  updateProfile: async () => {},
  admin: true
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
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [admin, setAdmin] = useState(false)

  // Effet pour récupérer le profil si initialUser existe
  useEffect(() => {
    // console.log("on va fetcher le profil");
    
    async function fetchProfile() {
      if (!initialUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', initialUser.id)
          .single();

       setAdmin(data.is_admin)
        

        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error in fetchProfile:', error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    setUser(initialUser);
    fetchProfile();
  }, [initialUser, supabase]);

  // Fonction pour mettre à jour le profil
  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ user, profile, admin, isLoading, updateProfile }}>
      {children}
    </SessionContext.Provider>
  );
}