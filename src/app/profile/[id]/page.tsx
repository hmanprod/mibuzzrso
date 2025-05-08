'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useParams } from 'next/navigation';
import { Profile } from '@/types/database';
import ProfileComponent from '@/components/profile/Profile';
import { getUserProfile } from '@/app/profile/actions/profile';

interface UserStats {
  totalReads: number;
}

export default function ProfilePage() {
  
  const params = useParams();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({totalReads: 0});

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const { profile, totalReads, error } = await getUserProfile(params.id as string);

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        setUserProfile(profile);
        setUserStats({totalReads: totalReads || 0});
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


  return (
    <AuthGuard>
      <Navbar />
      <div className="max-w-[1300px] mx-auto">
        <ProfileComponent userProfile={userProfile} userStats={userStats}  isLoading={loading} />
      </div>
    </AuthGuard>
  );
}
