'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, UserPlus, Check, Music2 } from 'lucide-react';
import AudioPlayer from '@/components/feed/AudioPlayer';
import VideoPlayer from '@/components/feed/VideoPlayer';
import type { Challenge } from '@/types/database';
import { getChallenge, getChallengeMedias, participateInChallenge } from '../../actions/challenges';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import ParticipateModal from '@/components/feed/ParticipateModal';
import { TimeAgo } from '@/components/ui/TimeAgo';
import { useSession } from '@/components/providers/SessionProvider';



interface MediaPlayerRef {
  seekToTime: (time: number) => void;
}

interface ChallengeMedia {
  id: string;
  position: number;
  media: {
    id: string;
    media_type: 'audio' | 'video';
    media_url: string;
    media_cover_url?: string;
    media_public_id: string;
    duration?: number;
    title?: string;
    description?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
  comments?: Array<{
    id: string;
    timestamp: number;
    content: string;
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
    };
  }>;
}

export default function ChallengePage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [medias, setMedias] = useState<ChallengeMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const { profile } = useSession();
  // Utilisé pour suivre la progression de la lecture
  useEffect(() => {
    if (currentPlaybackTime > 0) {
      // On pourrait utiliser cette valeur pour synchroniser
      // d'autres éléments de l'interface avec la progression
      console.log('Playback time:', currentPlaybackTime);
    }
  }, [currentPlaybackTime]);
  const [isFollowLoading] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  // const [isParticipating, setIsParticipating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const audioPlayerRef = useRef<MediaPlayerRef>(null);
  const videoPlayerRef = useRef<MediaPlayerRef>(null);

  console.log("the user is ", user);
  

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger le challenge
        const challengeResult = await getChallenge(params.id as string);
        console.log("Challenge result:", challengeResult);
        
        if (challengeResult.error) {
          throw new Error(challengeResult.error);
        }

        setChallenge(challengeResult.challenge);
        setLikesCount(challengeResult.challenge.likes || 0);
        setIsLiked(challengeResult.challenge.is_liked || false);

        // Charger les médias
        const mediasResult = await getChallengeMedias(params.id as string);
        console.log("Medias result:", mediasResult);

        if (mediasResult.error) {
          console.error('Error loading medias:', mediasResult.error);
        } else if (mediasResult.medias) {
          // S'assurer que les médias sont bien typés
          const typedMedias: ChallengeMedia[] = mediasResult.medias.map(media => ({
            id: media.id,
            position: media.position,
            media: {
              id: media.media.id,
              media_type: media.media.media_type as 'audio' | 'video',
              media_url: media.media.media_url,
              media_cover_url: media.media.media_cover_url,
              media_public_id: media.media.media_public_id,
              duration: media.media.duration,
              title: media.media.title,
              description: media.media.description,
              user_id: media.media.user_id,
              created_at: media.media.created_at,
              updated_at: media.media.updated_at
            },
            comments: media.comments
          }));
          setMedias(typedMedias);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load challenge details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  const handleLike = async () => {
    // TODO: Implement like functionality
    toast({
      title: "Coming soon",
      description: "Like functionality will be available soon",
    });
  };

  const handleParticipate = async (file: File, setProgress: (progress: number) => void) => {
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour participer',
        variant: 'destructive',
      });
      return;
    }

    try {
      // setIsUploading(true);

      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      // Créer un XMLHttpRequest pour suivre la progression
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      const uploadData = await uploadPromise;

      console.log('Cloudinary upload successful:', uploadData);

      // 2. Get file duration if it's an audio file
      let duration;
      if (file.type.startsWith('audio/')) {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            duration = audio.duration;
            resolve(null);
          });
        });
      }

      // 3. Save participation in database
      const result = await participateInChallenge({
        challengeId: params.id as string,
        userId: user.id,
        mediaUrl: uploadData.secure_url,
        mediaPublicId: uploadData.public_id,
        mediaType: file.type.startsWith('audio/') ? 'audio' : 'video',
        duration: duration,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: 'Succès !',
        description: 'Votre participation a été enregistrée',
      });

      // 4. Close modal and refresh page
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error participating:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de la participation',
        variant: 'destructive',
      });
     }
    //  finally {
    //   setIsUploading(false);
    // }
  };

  const handleShare = () => {
    toast({
      title: "Coming soon",
      description: "Share functionality will be available soon",
    });
  };

  const handleFollow = async () => {
    toast({
      title: "Coming soon",
      description: "Follow functionality will be available soon",
    });
  };

  if (loading) {
    return (
      <article className="bg-white rounded-[18px] shadow-sm overflow-hidden animate-pulse">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
        <div className="h-96 bg-gray-200"></div>
      </article>
    );
  }

  if (error || !challenge) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        {error || 'Challenge not found'}
      </div>
    );
  }

  return (
    <>
    {/* Participate section */}
    {challenge.status === 'active' ? (
      <div className="bg-white rounded-[18px] p-4 space-y-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatar_url || null}
            stageName={profile?.stage_name || profile?.email?.[0]}
            size={40}
            className="rounded-full"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
          >
            Je veux participer au challenge
          </button>
        </div>
      </div>
    ) : challenge.status === 'completed' ? (
      <div className="bg-white rounded-[18px] p-4 space-y-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={profile?.avatar_url || null}
            stageName={profile?.stage_name || profile?.email?.[0]}
            size={40}
            className="rounded-full"
          />
          <button
            disabled
            className="flex-1 h-12 px-4 rounded-[18px] bg-gray-100 text-gray-400 text-left cursor-not-allowed"
          >
            Le challenge est terminé
          </button>
        </div>
      </div>
    ) : null}
    <article className="bg-orange-50 rounded-[18px] shadow-sm overflow-hidden">
      {/* Challenge header */}
      <div className="flex justify-between flex-1 items-center p-4">
        <div className="flex items-center flex-1 space-x-3">
          <Avatar
            src={challenge.creator?.profile?.avatar_url || ''}
            stageName={(challenge.creator?.profile?.stage_name || 'C')[0]}
            size={40}
          />
          <div className="flex items-center flex-1 justify-between space-x-2">
            <div className="flex flex-col items-start">
              <h3 className="font-semibold text-sm text-[#2D2D2D]">
                {challenge.creator?.profile?.stage_name || 'Challenge Creator'}
              </h3>
              <TimeAgo date={challenge.created_at} defaultLanguage="fr" />
            </div>
            <button
              className={`flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                challenge.is_followed
                  ? 'bg-gray-100 text-gray-500 cursor-default' 
                  : 'bg-gray-800 text-white hover:bg-[#E63F3F]'
              }`}
              onClick={() => !isFollowLoading && !challenge.is_followed && handleFollow()}
              disabled={isFollowLoading || challenge.is_followed}
            >
              {challenge.is_followed ? (
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
        
      </div>

      {/* Title and description */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">{challenge.title}</h2>
        <p className="mt-1 text-gray-600">{challenge.description}</p>
      </div>

      

      {/* Media section */}
      <h3 className="text-md font-semibold text-[#2D2D2D] mx-4 border-b border-gray-200 py-2">Fichier à télecharger</h3>

      {/* Section média */}
      {medias.length > 0 && (
        <div className="mb-4 space-y-4">
          {medias.map((media, index) => {
            const isAudio = media.media.media_type === 'audio';
            const commonProps = {
              mediaId: media.media.id,
              postId: challenge.id,
              comments: media.comments || [],
              onTimeUpdate: (time: number) => setCurrentPlaybackTime(time),
            };
            
            return (
              <div key={`${media.id}-${index}`}>
                {isAudio ? (
                  <AudioPlayer
                    {...commonProps}
                    audioUrl={media.media.media_url}
                    ref={audioPlayerRef}
                    downloadable={true}
                  />
                ) : (
                  <VideoPlayer
                    {...commonProps}
                    videoUrl={media.media.media_url}
                    ref={videoPlayerRef}
                    downloadable={true}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Challenge info */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {/* <span className="flex items-center gap-1">
              <Music2 className="w-4 h-4" />
              {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
            </span> */}
            <span>{challenge.participants_count} participants</span>
            {challenge.winning_prize && (
              <span>Récompense: {challenge.winning_prize}</span>
            )}
          </div>
          <span className="text-red-500">Date de fin: <b>{new Date(challenge.end_at).toLocaleDateString()}</b></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 pb-4">
        <button 
          className="flex items-center gap-2"
          onClick={handleLike}
        >
          <Heart 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked ? "fill-red-500 stroke-red-500" : "stroke-gray-500 hover:stroke-gray-700"
            )}
          />
          <span className="text-gray-500">{likesCount}</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span>0</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>


    </article>

    {/* Modal de participation */}
    <ParticipateModal
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onParticipate={handleParticipate}
      challengeTitle={challenge?.title || ''}
    />
    </>
  );
}
