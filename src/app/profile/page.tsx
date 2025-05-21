'use client';

import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';
import ProfileComponent from '@/components/profile/Profile';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/app/profile/actions/profile';
import { Profile } from '@/types/database';

export default function ProfilePage() {
  const { profile: sessionProfile } = useSession();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<{totalReads: number, followersCount: number}>({totalReads: 0, followersCount: 0});

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        if (!sessionProfile?.id) return;
        
        const response = await getUserProfile(sessionProfile.id as string);
        
        if ('error' in response) {
          console.error('Error fetching profile:', response.error);
          return;
        }

        const { profile, totalReads, followersCount } = response;

        setUserProfile(profile);
        setUserStats({totalReads, followersCount});
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (sessionProfile?.id) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [sessionProfile?.id]);

  return (
    <AuthGuard>
      <Navbar />
      <div className="max-w-[1300px] mx-auto">
        <ProfileComponent userProfile={userProfile} userStats={userStats} isLoading={loading} />
      </div>
    </AuthGuard>
  );
}
