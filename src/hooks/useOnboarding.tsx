"use client";

import { useEffect, useState } from 'react';
import { Database } from '@/lib/supabase/database.types';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';

export const useOnboarding = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const checkProfileCompleteness = async () => {    
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stage_name, genre, activities, country')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        return;
      }

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

  useEffect(() => {
    checkProfileCompleteness();
  }, [user]);

  return {
    isProfileComplete,
    isModalOpen,
    loading,
    updateProfile: async (profileData: Partial<Profile>) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...profileData })
          .select()
          .single();

        if (error) throw error;

        await checkProfileCompleteness();
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    closeModal: () => setIsModalOpen(false)
  };
};
