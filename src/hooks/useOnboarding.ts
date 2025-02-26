'use client';

import { useState, useCallback } from 'react';
import { Profile } from '@/types/database';
import { useSession } from '@/components/providers/SessionProvider';

export function useOnboarding() {
  const { profile, updateProfile: sessionUpdateProfile, isLoading } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const updateProfile = async (updates: Partial<Profile>) => {
    setError(null);

    try {
      await sessionUpdateProfile(updates);
      return { error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return { error: err };
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
    isLoading,
    error,
    isModalOpen,
    isProfileComplete,
    updateProfile,
    closeModal,
    checkProfileCompleteness,
  };
}
