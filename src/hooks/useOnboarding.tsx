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
        .select('stage_name, genres, activities, country')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la vérification du profil:', {
          code: error.code,
          message: error.message,
          details: error.details,
          userId: user.id,
        });
        setLoading(false);
        return;
      }

      const isComplete = Boolean(
        profile?.stage_name &&
        profile?.genres?.length > 0 &&
        profile?.activities?.length > 0 &&
        profile?.country
      );

      setIsProfileComplete(isComplete);
      if (!isComplete) {
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    // Ne permettez pas la fermeture si le profil n'est pas complet
    if (!isProfileComplete) {
      return;
    }
    setIsModalOpen(false);
  };

  useEffect(() => {
    // if (user) {
      checkProfileCompleteness();
    // }
  }, [user]);

  return {
    isProfileComplete,
    isModalOpen,
    loading,
    closeModal,
    updateProfile: async (data: Partial<Profile>) => {
      if (!user) return { error: new Error('No user') };

      try {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id);

        if (error) throw error;

        await checkProfileCompleteness();
        return { error: null };
      } catch (error) {
        console.error('Error updating profile:', error);
        return { error };
      }
    },
  };
};
