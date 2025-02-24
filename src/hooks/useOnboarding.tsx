"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';

export const useOnboarding = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const checkProfileCompleteness = useCallback(async () => {    
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('stage_name, talents, musical_interests, country')
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
        Array.isArray(profile?.talents) && profile?.talents.length > 0 &&
        Array.isArray(profile?.musical_interests) && profile?.musical_interests.length > 0 &&
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
  }, [user]);

  useEffect(() => {
    checkProfileCompleteness();
  }, [user, checkProfileCompleteness]);

  return {
    isProfileComplete,
    isModalOpen,
    loading,
    closeModal: () => setIsModalOpen(false),
    updateProfile: async (data: Partial<Profile>) => {
      try {
        if (!user) {
          return { error: new Error('No user') };
        }

        // Validate required fields
        if (data.stage_name === undefined && data.musical_interests === undefined && data.talents === undefined && data.country === undefined) {
          return { error: new Error('No profile data provided') };
        }

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id);

        if (updateError) {
          return { error: updateError };
        }

        // Check if profile is complete with the new data
        const isComplete = Boolean(
          data.stage_name &&
          data.musical_interests && data.musical_interests.length > 0 &&
          data.talents && data.talents.length > 0 &&
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
    checkProfileCompleteness
  };
};
