'use client';

import { Plus, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { followUser } from '@/app/profile/actions/follower';
import { useSession } from '@/components/providers/SessionProvider';
import { toast } from '@/components/ui/use-toast';

interface SuggestedUsersProps {
  users: User[];
}

interface User {
  user_id: string;
  avatar_url?: string | null;
  stage_name?: string;
  full_name?: string;
  interaction_score?: number;
}

export default function SuggestedUsers({ users = [] }: SuggestedUsersProps) {
  const { user } = useSession();
  const [followingStates, setFollowingStates] = useState<Record<string, { loading: boolean, followed: boolean }>>({});

  // Si aucun utilisateur n'est passé, ne rien afficher
  if (users.length === 0) {
    return null;
  }

  // Prendre seulement les 3 premiers utilisateurs
  const suggestedUsers = users.slice(0, 3);

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
      [userIdToFollow]: { loading: false, followed: true }
    }));

    // Show success toast immediately
    // toast({
    //   title: "Succès",
    //   description: "Vous suivez maintenant cet utilisateur",
    //   variant: "default"
    // });

    try {
      // Call the API in the background
      const result = await followUser(user.id, userIdToFollow);

      if (result.error) {
        // If there's an error, revert the optimistic update
        console.error("Error following user:", result.error);
        setFollowingStates(prev => ({
          ...prev,
          [userIdToFollow]: { loading: false, followed: false }
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
        [userIdToFollow]: { loading: false, followed: false }
      }));

      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white rounded-[18px] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-lg text-[#2D2D2D]">Suggestions à suivre</h3>
      </div>
      <div className="space-y-4">
        {suggestedUsers.map(user => {
          const isFollowing = followingStates[user.user_id]?.followed || false;
          const isLoading = followingStates[user.user_id]?.loading || false;

          return (
            <div key={user.user_id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.stage_name || 'User'}
                    className="w-[30px] h-[30px] rounded-full object-cover"
                    width={30}
                    height={30}
                  />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                    <span className="text-xs font-bold">
                      {(user.stage_name?.[0] || user.full_name?.[0] || '?').toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <Link href={`/profile/${user.user_id}`} className="font-medium text-base text-[#2D2D2D] hover:text-[#FA4D4D]">
                    {user.stage_name || 'Anonymous User'}
                  </Link>
                  {/* <p className="text-sm text-[#666666]">
                    Score: {user.interaction_score.toFixed(1)}
                  </p> */}
                </div>
              </div>
              <button
                className={`flex items-center gap-2 transition-colors ${isFollowing
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-[#FA4D4D] hover:text-[#E63F3F]'
                  }`}
                onClick={() => !isLoading && !isFollowing && handleFollow(user.user_id)}
                disabled={isLoading || isFollowing}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : isFollowing ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Suivi</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Suivre</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
