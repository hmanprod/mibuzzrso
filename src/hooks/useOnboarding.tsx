"use client";

import { useEffect, useState } from 'react';
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
    setIsModalOpen(false);
  };

  useEffect(() => {
    checkProfileCompleteness();
  }, [user]);

  return {
    isProfileComplete,
    isModalOpen,
    loading,
    closeModal,
    updateProfile: async (data: Partial<Profile>) => {
      if (!user) return { error: new Error('No user') };

      try {
        // First check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...data 
            }]);

          if (insertError) throw insertError;
        } else if (fetchError) {
          throw fetchError;
        } else {
          // Profile exists, update it
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              ...data,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) throw updateError;
        }

        // Check if profile is complete with the new data
        const isComplete = Boolean(
          data.stage_name &&
          data.musical_interests?.length > 0 &&
          data.talents?.length > 0 &&
          data.country
        );

        setIsProfileComplete(isComplete);
        if (isComplete) {
          setIsModalOpen(false);
        }

        return { error: null };
      } catch (error) {
        console.error('Error updating profile:', error);
        return { error };
      }
    },
  };
};
