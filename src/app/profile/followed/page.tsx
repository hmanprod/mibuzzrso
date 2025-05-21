'use client';

import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { getFollowedUsers, followUser } from '../actions/follower';
import { Avatar } from '@/components/ui/Avatar';
import { Check, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import UserSkeleton from '@/components/profile/UserSkeleton';

interface FollowedUser {
  id: string;
  stage_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  talents: string[] | null;
  musical_interests: string[] | null;
  is_followed: boolean;
}

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function FollowedPage() {
  const router = useRouter();
  const { user } = useSession();
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 10,
    hasMore: false
  });
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadFollowedUsers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const result = await getFollowedUsers(user.id, pagination.page, pagination.limit);
        
        if (result.error) {
          setError(result.error);
          return;
        }
        
        if (pagination.page === 1) {
          setFollowedUsers(result.users || []);
        } else {
          setFollowedUsers(prev => [...prev, ...(result.users || [])]);
        }
        
        setPagination(result.pagination || {
          total: 0,
          page: pagination.page,
          limit: pagination.limit,
          hasMore: false
        });
      } catch (err) {
        console.error('Error loading followed users:', err);
        setError('Failed to load followed users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadFollowedUsers();
  }, [user, pagination.page, pagination.limit]);

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleFollow = async (userIdToFollow: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Vous devez être connecté pour suivre un utilisateur",
        variant: "destructive"
      });
      return;
    }

    // Optimistic update - immediately show as followed
    setFollowingStates(prev => ({
      ...prev,
      [userIdToFollow]: true
    }));

    try {
      // Call the API in the background
      const result = await followUser(user.id, userIdToFollow);

      if (result.error) {
        // If there's an error, revert the optimistic update
        console.error("Error following user:", result.error);
        setFollowingStates(prev => ({
          ...prev,
          [userIdToFollow]: false
        }));

        // Show error toast
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      // If there's an exception, revert the optimistic update
      console.error("Error following user:", error);
      setFollowingStates(prev => ({
        ...prev,
        [userIdToFollow]: false
      }));

      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar className="fixed top-0 left-0 right-0 z-50" />
        <div className="max-w-[1300px] mx-auto">
          <div className="flex pt-[72px]">
            <Sidebar  />
            
            <div className="flex flex-1 ml-[274px]">
              <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-0">
                <div className="max-w-2xl mx-auto mt-2">
                  <div className="flex items-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8 px-4 sm:px-0 max-w-sm text-[32px] leading-[40px]">Suivez l’actualité de vos créateurs préférés <span role="img" aria-label="sparkles">✨</span></h1>
                  </div>

                  {loading && followedUsers.length === 0 ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <UserSkeleton key={index} />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                      {error}
                    </div>
                  ) : followedUsers.length === 0 ? (
                    <div className="text-center space-y-4">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-600 rounded-3xl transform rotate-6 animate-pulse opacity-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-600 rounded-3xl transform -rotate-6 animate-pulse opacity-20 animation-delay-200"></div>
                        <div className="relative bg-gradient-to-br from-primary to-red-700 rounded-3xl w-full h-full flex items-center justify-center shadow-lg">
                          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Vous ne suivez personne</h2>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Commencez à suivre des créateurs pour voir leur contenu dans votre fil d&apos;actualité.
                      </p>
                      {/* <Button
                        onClick={() => router.push('/discover')}
                        className="mt-4"
                      >
                        Découvrir des créateurs
                      </Button> */}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {followedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <Link
                            href={`/profile/${user.id}`}
                            className="flex items-center flex-1"
                          >
                            <Avatar
                              src={user.avatar_url || undefined}
                              fallback={user.stage_name?.[0] || 'U'}
                              className="h-12 w-12"
                            />
                            <div className="ml-4 flex-1">
                              <h3 className="font-medium text-gray-900">{user.stage_name || 'Utilisateur'}</h3>
                              <small className="text-gray-500">@{user.id}</small>
                              {/* {user.bio && (
                                <p className="text-sm text-gray-500 line-clamp-1">{user.bio}</p>
                              )} */}
                              {user.talents && user.talents.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {user.talents.slice(0, 3).map((talent, index) => (
                                    <span 
                                      key={index} 
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {talent}
                                    </span>
                                  ))}
                                  {user.talents.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      +{user.talents.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {user.musical_interests && user.musical_interests.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {user.musical_interests.slice(0, 3).map((interest, index) => (
                                    <span 
                                      key={index} 
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {interest}
                                    </span>
                                  ))}
                                  {user.musical_interests.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                      +{user.musical_interests.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div>
                            <button
                              className={`ml-2 flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                                user.is_followed || followingStates[user.id]
                                  ? 'bg-gray-100 text-gray-500 cursor-default' 
                                  : 'bg-gray-800 text-white hover:bg-[#E63F3F]'
                              }`}
                              onClick={() => !(user.is_followed || followingStates[user.id]) && handleFollow(user.id)}
                            >
                              {user.is_followed || followingStates[user.id] ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Suivi</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" />
                                  <span>Suivre</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {pagination.hasMore && (
                        <div className="flex justify-center pt-4 pb-8">
                          <Button
                            variant="outline"
                            onClick={loadMore}
                            disabled={loading}
                            className="flex items-center gap-2"
                          >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Charger plus
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
              </main>
              <div className="w-[350px] py-8" />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
