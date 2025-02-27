'use client';

import Navbar from '@/components/Navbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useSession } from '@/components/providers/SessionProvider';
import ProfileComponent from '@/components/profile/Profile';
import { PulsingLoading } from '@/components/ui/loading';

export default function ProfilePage() {
  const { profile, isLoading } = useSession();


  if (isLoading) {
    return <PulsingLoading  />;
  }

  return (
    <AuthGuard>
      <Navbar />
      <ProfileComponent userProfile={profile} />
    </AuthGuard>
  );
}
