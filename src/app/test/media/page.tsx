'use client';

import { useSession } from '@/components/providers/SessionProvider';

export default function AuthTestage() {
  const { user, profile, isLoading } = useSession();
  // console.log('🔄 Current AuthTestage user:', user);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <p>Welcome, {profile?.stage_name || user.email}</p>
    </div>
  );
}