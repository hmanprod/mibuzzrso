import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/lib/supabase/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const useOnboarding = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = useSupabaseClient<Database>();
  const user = useUser();

  const checkProfileCompleteness = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stage_name, genre, activities, country')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const isComplete = Boolean(
        profile?.stage_name &&
        profile?.genre &&
        profile?.activities &&
        profile?.country
      );

      setIsProfileComplete(isComplete);
      setIsModalOpen(!isComplete);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;

      await checkProfileCompleteness();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (user) {
      checkProfileCompleteness();
    }
  }, [user]);

  return {
    isProfileComplete,
    isModalOpen,
    loading,
    updateProfile,
    closeModal,
    checkProfileCompleteness,
  };
};
