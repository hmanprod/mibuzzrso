'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useCallback, useEffect, useState } from 'react';
import { getTopInteractingUsers } from '../../actions/profile/profile';
import RightSidebar from '@/components/RightSidebar';
import { Menu, X } from 'lucide-react';

interface TopUser {
  user_id: string;
  avatar_url: string | null;
  stage_name: string;
  interaction_score: number;
  is_followed: boolean;
  pseudo_url: string;
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadTopUsers = useCallback(async () => {
    try {
      const { data, error } = await getTopInteractingUsers();
      if (!error && data) {
        const formattedUsers = data.map((user: TopUser) => ({
          user_id: user.user_id,
          avatar_url: user.avatar_url,
          stage_name: user.stage_name,
          interaction_score: user.interaction_score,
          is_followed: user.is_followed,
          pseudo_url: user.pseudo_url
        }));
        setTopUsers(formattedUsers.slice(0, 3));
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

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-30" />
        <div className="max-w-[1300px] mx-auto">
          <div className="flex pt-[72px]">
            {/* Desktop Sidebar */}
            <div className="w-[250px] flex-shrink-0 hidden lg:block">
              <Sidebar />
            </div>

            {/* Mobile Sidebar (Drawer) */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <div
                  className="absolute top-0 left-0 h-full w-4/5 max-w-[280px] bg-white shadow-xl animate-in slide-in-from-left-full duration-300 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2 text-right">
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="inline-flex items-center justify-center p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Sidebar />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-1 min-w-0">
              <main className="flex-1 max-w-[600px] mx-auto w-full py-4 px-4 sm:px-0">
                <button
                  className="lg:hidden p-2 mb-4 text-gray-600 border rounded-md hover:bg-gray-100"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {children}
              </main>

              <RightSidebar
                className="w-[350px] flex-shrink-0 hidden lg:block"
                suggestedUsers={topUsers}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
