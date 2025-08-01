'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Music, Plus, Settings, Video, UserPlus, Check, Facebook, Instagram, Youtube, Globe, Music2 } from 'lucide-react';
import { ExtendedPost, Profile as ProfileType } from '@/types/database';
import { NotFound } from '../ui/not-found';
import CreatePostBlock from '../feed/CreatePostBlock';
import { getProfilePosts } from '@/actions/posts/post';
import { 
  getTalentLabel, 
  getGenreLabel, 
  TALENT_BADGE_COLOR,
  GENRE_BADGE_COLOR,
} from '@/constants/options';
import FeedPostSkeleton from '../feed/FeedPostSkeleton';
import FeedPost from '../feed/FeedPost';
import CreatePostDialog from '../feed/CreatePostDialog';
import { Avatar } from '../ui/Avatar';
import { AvatarUploadModal } from './AvatarUploadModal';
import { CoverPhotoUploadModal } from './CoverPhotoUploadModal';
import { useSession } from '@/components/providers/SessionProvider';
import ProfileSkeleton from './ProfileSkeleton';
import { followUser, isFollowing } from '@/actions/follower/follower';
import { toast } from '@/components/ui/use-toast';
import { ImpersonateButton } from './ImpersonateButton';

interface ProfileProps {
    userProfile?: ProfileType | null;
    userStats?: { totalReads: number; followersCount: number };
    isLoading?: boolean;
}

interface Tab {
    id: 'all' | 'audio' | 'video';
    label: string;
    icon?: React.ReactNode;
}
  
const tabs: Tab[] = [
    { id: 'all', label: 'Activité' },
    { id: 'audio', label: 'Musique', icon: <Music className="w-4 h-4" /> },
    { id: 'video', label: 'Vidéos', icon: <Video className="w-4 h-4" /> },
    // { id: 'groups', label: 'Groupes', icon: <UsersRound className="w-4 h-4" /> },
];

export default function Profile({ userProfile, userStats, isLoading }: ProfileProps) {
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [posts, setPosts] = useState<ExtendedPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const router = useRouter();
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const { user, admin } = useSession();
    const isCurrentUser = user && userProfile?.id === user.id;
    const [isFollowed, setIsFollowed] = useState(false);
    const [isFollowChecked, setIsFollowChecked] = useState(false);

    const handleCreatePost = async () => {
        await loadPosts();
        setShowCreatePost(false);
    };

    const loadMedias = async (mediaType: 'audio' | 'video' | 'all') => {
        setActiveTab(mediaType);
        await loadPosts(mediaType);
    };

    const loadPosts = useCallback(async (mediaType: 'audio' | 'video' | 'all' = 'all') => {
        console.log('🔄 Loading posts...');
        try {
          setLoading(true);
          setError(null);
    
          if (userProfile?.id) {
            const result = await getProfilePosts(userProfile.id, mediaType);
            
            if (result.error) {
              throw new Error(result.error);
            }
      
            console.log('✨ Posts loaded:', result.posts);
            setPosts(result.posts || []);
          } else {
            setPosts([]);
          }
        } catch (err) {
          console.error('❌ Error loading posts:', err);
          setError('Failed to load posts. Please try again later.');
        } finally {
          setLoading(false);
        }
    }, [userProfile?.id]);

    useEffect(() => {
        if (userProfile?.id) {
            loadPosts();
        }
    }, [userProfile?.id, loadPosts]);

    // Check if the current user is following the profile
    const checkFollowStatus = useCallback(async () => {
        if (!user || !userProfile?.id || user.id === userProfile.id) {
            setIsFollowChecked(true);
            return;
        }

        try {
            const result = await isFollowing(user.id, userProfile.id);
            setIsFollowed(result.isFollowing || false);
        } catch (error) {
            console.error('Error checking follow status:', error);
        } finally {
            setIsFollowChecked(true);
        }
    }, [user, userProfile, setIsFollowed, setIsFollowChecked]);

    useEffect(() => {
        if (user && userProfile && !isFollowChecked) {
            checkFollowStatus();
        }
    }, [user, userProfile, isFollowChecked, checkFollowStatus]);

    // Function to handle following a user
    const handleFollow = async () => {
        if (!user) {
            toast({
                title: "Authentication required",
                description: "Vous devez être connecté pour suivre un utilisateur",
                variant: "destructive"
            });
            return;
        }

        // Don't allow users to follow themselves
        if (user.id === userProfile?.id) {
            return;
        }

        // Optimistic update
        setIsFollowed(true);

        try {
            await followUser(user.id, userProfile?.id as string);
        } catch (error) {
            console.error('Error following user:', error);
            setIsFollowed(false);
            toast({
                title: "Erreur",
                description: "Une erreur s'est produite lors du suivi de l'utilisateur",
                variant: "destructive"
            });
        }
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!userProfile) {
        return <NotFound 
        title="Impossible de trouver un profil correspondant"
        message="Il a peut-être été supprimé ou n'existe pas."
        buttonText="Retour à l'accueil"
        iconType="user"
        iconSize={48}
        iconColor="#6b7280"
        />;
    }

  return (
    <>
    <div className="min-h-screen bg-white">
        {/* Cover Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {userProfile.cover_url ? (
            <Image
              src={userProfile.cover_url}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
          )}
          {isCurrentUser && (
            <button 
              className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              onClick={() => setIsCoverModalOpen(true)}
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Colonne de gauche */}
            <div className="w-64 relative -mt-20">
              {/* Photo de profil */}
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white">
                  <Avatar
                    src={userProfile.avatar_url || null}
                    stageName={userProfile.stage_name}
                    size={122}
                    className="object-cover w-full h-full"
                    />
                </div>
                {isCurrentUser && (
                  <button 
                    className="absolute bottom-0 right-0 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Information */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold mb-0">{userProfile.stage_name || `${userProfile.first_name} ${userProfile.last_name}`}</h1>
                <div className="flex items-center gap-2">
                  <small className="text-gray-600">@{userProfile.pseudo_url}</small>
                </div>

                <div className='mt-4 flex flex-col gap-2'>
                  {/* Follow button - only show if not the current user and if follow status has been checked */}
                  {user && user.id !== userProfile.id && isFollowChecked && (
                    <button 
                      onClick={handleFollow}
                      disabled={isFollowed}
                      className={`flex items-center gap-1 text-md font-medium rounded-full px-3 py-1 transition-colors ${
                        isFollowed 
                          ? 'bg-gray-100 text-gray-500 cursor-default' 
                          : 'bg-[#FA4D4D] text-white hover:bg-[#E63F3F]'
                      }`}
                    >
                      {isFollowed ? (
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
                  )}
                  <ImpersonateButton
                    stageName={userProfile.stage_name || userProfile.first_name || 'Utilisateur'}
                    userId={userProfile.id}
                    isAdmin={!!admin}
                    isCurrentUser={!!isCurrentUser}
                  />
                </div>

                {userProfile.label && (
                  <div className="mt-0">
                    <span className={`text-sm rounded-full`}>
                    {userProfile.label}
                    </span>
                  </div>
                )}

                {userProfile.country && ( 
                  <div className="flex items-center gap-2">
                    <small className="text-gray-600">{userProfile.country?.toUpperCase()}</small>
                  </div>
                )}

                {/* Badge de rang
              {userProfile.points > 0 && (
                <div className="mt-4">
                  <RankBadge points={userProfile.points} />
                </div>
              )} */}

              {userProfile.bio && (
                <div className="mt-4 relative text-gray-700 italic">
                  {userProfile.bio}
                </div>
              )}


                {userProfile.social_links && Object.keys(userProfile.social_links).length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Réseaux sociaux</h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(userProfile.social_links).map(([platform, url]) => {
                        if (!url) return null;
                        
                        // Get the appropriate icon based on platform name
                        const getPlatformIcon = () => {
                          const platformLower = platform.toLowerCase();
                          
                          switch(platformLower) {
                            case 'facebook':
                              return <Facebook className="w-4 h-4 mr-1" />;
                            case 'instagram':
                              return <Instagram className="w-4 h-4 mr-1" />;
                            case 'youtube':
                              return <Youtube className="w-4 h-4 mr-1" />;
                            case 'spotify':
                              return <Music2 className="w-4 h-4 mr-1" />;
                            case 'moozik':
                              return <Music className="w-4 h-4 mr-1" />;
                            case 'tiktok':
                              return <Video className="w-4 h-4 mr-1" />;
                            case 'website':
                            default:
                              return <Globe className="w-4 h-4 mr-1" />;
                          }
                        };
                        
                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-800 transition-colors"
                          >
                            {getPlatformIcon()}
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              

              {/* Statistiques */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold">{userProfile.points || 0}</div>
                  <div className="text-sm text-gray-600">Elo</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{userStats?.followersCount || 0}</div>
                  <div className="text-sm text-gray-600">Abonné</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{userStats?.totalReads || 0}</div>
                  <div className="text-sm text-gray-600">Lecture</div>
                </div>
              </div>

              {/* Talents */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">Talent</h2>
                <div className="flex flex-wrap gap-2">
                  {userProfile.talents && userProfile.talents.length > 0 ? (
                    userProfile.talents.map((talent, index) => (
                      <span 
                        key={index} 
                        className={`px-3 py-1 bg-gray-100 rounded-full font-medium text-sm ${TALENT_BADGE_COLOR}`}
                      >
                        {getTalentLabel(talent)}
                      </span>
                    ))
                  ) : (
                    <>
                      {user && user.id == userProfile.id && (
                      <button 
                      onClick={() => router.push('/profile/edit')}
                      className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2 text-sm"
                      >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un talent</span>
                      </button>
                    )}
                    </>
                  )}
                </div>
              </div>

              {/* Genres préférés */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Genres musicals</h2>
                <div className="flex flex-wrap gap-2">
                    
                  {userProfile.musical_interests && userProfile.musical_interests.length > 0 ? (
                    userProfile.musical_interests.map((genre, index) => (
                      <span 
                        key={index} 
                        className={`px-3 py-1 bg-gray-100 rounded-full font-medium text-sm ${GENRE_BADGE_COLOR}`}
                      >
                        {getGenreLabel(genre)}
                      </span>
                    ))
                  ) : (
                    <>
                    {user && user.id == userProfile.id && (
                        <button 
                        onClick={() => router.push('/profile/edit')}
                        className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2 text-sm"
                        >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un genre</span>
                        </button>
                    )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne centrale */}
            <div className="flex-1">
              

              {/* Onglets */}
              <div className="mt-20 border-b border-gray-200">
                <div className="flex gap-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => loadMedias(tab.id)}
                      className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenu */}
              <div className="mt-6">
                {activeTab && (
                  <div>
                    {isCurrentUser && (
                    <CreatePostBlock onClick={() => setShowCreatePost(true)} />
                    )}

                    <div className="mt-8 space-y-4">
                    {loading ? (
                        // Show skeletons while loading
                        Array.from({ length: 3 }).map((_, i) => (
                            <FeedPostSkeleton key={i} />
                        ))
                        ) : error ? (
                        // Show error message
                        <div className="p-4 rounded-lg bg-red-50 text-red-600">
                            {error}
                        </div>
                        ) : posts.length === 0 ? (
                        // Show empty state
                        <div className="mt-8 text-center text-gray-600">
                            <Music className="w-12 h-12 mx-auto text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium">Il est temps de faire de la musique</h3>
                            <p className="mt-1">
                                Vous verrez votre fil d&apos;activités se remplir dès que vous commencerez à publier des
                                révisions ou des publications.
                            </p>
                            <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90">
                                Commencer
                            </button>
                        </div>
                        ) : (
                        // Show posts
                        posts.map((post) => (
                            <FeedPost
                            key={post.id}
                            post={post}
                            />
                        ))
                    )}
                    </div>

                  </div>
                )}
              </div>
            </div>

            {/* Colonne de droite - Suggestions */}
            <div className="w-64">
              <div className="sticky top-4 space-y-4">
                {/* Bouton Modifier le profil */}
                {user && user.id == userProfile.id && (
                <div className="mt-6">
                    <button 
                    onClick={() => router.push('/profile/edit')}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2"
                    >
                    <Settings className="w-4 h-4" />
                    <span>Modifier le profil</span>
                    </button>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
    <CreatePostDialog
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
      
      {isCurrentUser && (
        <>
          <AvatarUploadModal
            isOpen={isAvatarModalOpen}
            onClose={() => setIsAvatarModalOpen(false)}
          />
          <CoverPhotoUploadModal
            isOpen={isCoverModalOpen}
            onClose={() => setIsCoverModalOpen(false)}
          />
        </>
      )}
    </>
  );
}
