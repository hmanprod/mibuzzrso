'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Music, Plus, Settings, Video } from 'lucide-react';
import { Media, Post, Profile as ProfileType } from '@/types/database';
import { NotFound } from '../ui/not-found';
import CreatePostBlock from '../feed/CreatePostBlock';
import { getProfilePosts } from '@/app/feed/actions';
import { 
  getTalentLabel, 
  getGenreLabel, 
  getCountryLabel,
  TALENT_BADGE_COLOR,
  GENRE_BADGE_COLOR,
  COUNTRY_BADGE_COLOR
} from '@/constants/options';
import FeedPostSkeleton from '../feed/FeedPostSkeleton';
import FeedPost from '../feed/FeedPost';
import CreatePostDialog from '../feed/CreatePostDialog';
import { Avatar } from '../ui/Avatar';
import { AvatarUploadModal } from './AvatarUploadModal';
import { CoverPhotoUploadModal } from './CoverPhotoUploadModal';
import { useSession } from '@/components/providers/SessionProvider';
import ProfileSkeleton from './ProfileSkeleton';

interface ProfileProps {
    userProfile?: ProfileType | null;
    userStats?: { totalReads: number };
    isLoading?: boolean;
}

interface Tab {
    id: 'all' | 'audio' | 'video';
    label: string;
    icon?: React.ReactNode;
}

interface ExtendedPost extends Post {
    profile: ProfileType;
    media: Media[];
    likes: number;
    is_liked: boolean;
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
    const { user } = useSession();
    const isCurrentUser = user && userProfile?.id === user.id;

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
    }, [loadPosts, userProfile?.id]);
    
      

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
        <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
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
                <small className="text-gray-600">@{userProfile.id}</small>
                {userProfile.country && (
                  <div className="mt-2">
                    <span className={`py-1 text-sm rounded-full ${COUNTRY_BADGE_COLOR}`}>
                    {userProfile.label && (userProfile.label + ' - ')} {getCountryLabel(userProfile.country)}
                    </span>
                  </div>
                )}

                {userProfile.bio && (
                  <div className="mt-4 relative">
                    <svg className="text-gray-300 h-8 w-8 -top-4 -left-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <blockquote className="pl-6 text-gray-700 italic">
                      {userProfile.bio}
                    </blockquote>
                  </div>
                )}


                {/* Séparateur */}
                <div className="h-[1px] bg-gray-100 mt-8" />


                {userProfile.social_links && Object.keys(userProfile.social_links).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Social Links</h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(userProfile.social_links).map(([platform, url]) => (
                        url && (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              

              {/* Statistiques */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-sm text-gray-600">Abonné</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">0</div>
                  <div className="text-sm text-gray-600">Suivi</div>
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
                        className={`px-3 py-1 bg-gray-100 rounded-full text-sm ${TALENT_BADGE_COLOR}`}
                      >
                        {getTalentLabel(talent)}
                      </span>
                    ))
                  ) : (
                    <button 
                    onClick={() => router.push('/profile/edit')}
                    className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2 text-sm"
                    >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un talent</span>
                    </button>
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
                        className={`px-3 py-1 bg-gray-100 rounded-full text-sm ${GENRE_BADGE_COLOR}`}
                      >
                        {getGenreLabel(genre)}
                      </span>
                    ))
                  ) : (
                    <>
                        <button 
                        onClick={() => router.push('/profile/edit')}
                        className="bg-gray-50 text-gray-700 px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2 text-sm"
                        >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un genre</span>
                        </button>
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
                    <CreatePostBlock onOpen={() => setShowCreatePost(true)} />
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
                <div className="mt-6">
                    <button 
                    onClick={() => router.push('/profile/edit')}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 flex items-center gap-2"
                    >
                    <Settings className="w-4 h-4" />
                    <span>Modifier le profil</span>
                    </button>
                </div>
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
