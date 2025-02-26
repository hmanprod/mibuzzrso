import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

const checkProfileCompleteness = (profile: Profile | null): boolean => {
  if (!profile) return false;
  
  const requiredFields = [
    'stage_name',
    'musical_interests',
    'talents',
    'country',
  ];

  return requiredFields.every(field => {
    const value = profile[field as keyof Profile];
    if (Array.isArray(value)) {
      return value && value.length > 0;
    }
    return !!value;
  });
};

export function useOnboarding() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsProfileComplete(checkProfileCompleteness(profile));
    }
  }, [profile]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();

        console.log('Onboarding session:', session);
        
        if (!session?.user) {
          setLoading(false);
          return;
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setError('Failed to load profile data');
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error('Error in loadProfile:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return { error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      return { error: err as Error };
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    error,
    isProfileComplete,
    updateProfile
  };
}
