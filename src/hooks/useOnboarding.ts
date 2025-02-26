import { useState, useCallback } from 'react';
import { Profile } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

export function useOnboarding() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const updateProfile = async (updates: Partial<Profile>) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile?.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return { error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const checkProfileCompleteness = useCallback(async () => {
    if (!profile) return;

    const requiredFields: (keyof Profile)[] = ['stage_name', 'talents', 'musical_interests', 'country'];
    const isComplete = requiredFields.every(field => Boolean(profile[field]));
    
    setIsProfileComplete(isComplete);
    setIsModalOpen(!isComplete);
  }, [profile]);

  return {
    profile,
    loading,
    error,
    isModalOpen,
    isProfileComplete,
    updateProfile,
    closeModal,
    checkProfileCompleteness,
  };
}
