'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useParams } from 'next/navigation';
import { Profile } from '@/types/database';
import ProfileComponent from '@/components/profile/Profile';
import { PulsingLoading } from '@/components/ui/loading';
import { getUserProfile } from '@/app/profile/actions';



export default function ProfilePage() {
  
  const params = useParams();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { profile, error } = await getUserProfile(params.id as string);

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setUserProfile(profile);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchUserProfile();
    }
  }, [params.id]);

  if (loading) {
    return <PulsingLoading />;
  }

  return (
    <AuthGuard>
      <Navbar />
      <ProfileComponent userProfile={userProfile} />
    </AuthGuard>
  );
}
