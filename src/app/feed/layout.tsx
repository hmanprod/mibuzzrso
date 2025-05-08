'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useState } from 'react';
import { getTopInteractingUsers } from '../profile/actions/profile';
import RightSidebar from '@/components/RightSidebar';

interface TopUser {
  user_id: string;
  avatar_url: string | null;
  stage_name: string;
  interaction_score: number;
  is_followed: boolean;
}


export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topUsers, setTopUsers] = useState([]);

  const loadTopUsers = useCallback(async () => {
    try {
      const { data, error } = await getTopInteractingUsers();
      if (!error && data) {
        // Transform the data to match the expected format for SuggestedUsers
        const formattedUsers = data.map((user: TopUser) => ({
          user_id: user.user_id,
          avatar_url: user.avatar_url,
          stage_name: user.stage_name,
          interaction_score: user.interaction_score,
          is_followed: user.is_followed
        }));
        
        setTopUsers(formattedUsers.slice(0, 3));
        // console.log('✨ Top users loaded:', formattedUsers.slice(0, 3));
      } else if (error) {
        console.error('Error in getTopInteractingUsers response:', error);
      }
    } catch (err) {
      console.error('Error loading top users:', err);
    }
  }, []);

  useEffect(() => {
    loadTopUsers();
  }, [loadTopUsers]);
  
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        <div className="max-w-[1300px] mx-auto">
          <div className="flex pt-[72px]">
            <Sidebar className="fixed bottom-0 top-[72px] w-[274px]" />
            
            <div className="flex flex-1 ml-[274px]">
              {/* Feed central */}
              <main className="flex-1 max-w-[600px] mx-auto w-full py-4 px-4 sm:px-0">
              {children}
              </main>
              
              <RightSidebar className="w-[350px]" suggestedUsers={topUsers} />
              
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
