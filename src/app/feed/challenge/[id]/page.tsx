'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flame, MessageCircle, Share2, UserPlus, Check, Trophy, Users, Calendar, Star } from 'lucide-react';
import AudioPlayer from '@/components/feed/AudioPlayer';
import VideoPlayer from '@/components/feed/VideoPlayer';
import type { Challenge } from '@/types/database';
import { getChallenge, getChallengeMedias, participateInChallenge, isUserJury } from '../../actions/challenges';
import { getChallengeParticipations } from '../../actions/post';
import { Avatar } from '@/components/ui/Avatar';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import ParticipateModal from '@/components/feed/ParticipateModal';
import { TimeAgo } from '@/components/ui/TimeAgo';
import WinnerCard from '@/components/challenge/WinnerCard';
import ChallengeSkeleton from '@/components/challenge/ChallengeSkeleton';
import VoteModal from '@/components/challenge/VoteModal';
import JuryVoteModal from '@/components/challenge/JuryVoteModal';
import { voteForParticipation, getChallengeVotes, voteAsJury } from '../../actions/vote';

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

interface ChallengeVote {
  participation_id: string;
  total_points: string;
  voters_count: string;
  average_points: string;
}

interface Participation {
  id: string;
  content: string;
  created_at: string;
  user: { id: string; email: string };
  profile: { id: string; username: string; stage_name: string; avatar_url: string | null, pseudo_url: string };
  medias: Array<{
    id: string;
    position: number;
    media: {
      id: string;
      media_type: 'audio' | 'video';
      media_url: string;
      media_cover_url?: string;
      media_public_id: string;
      duration?: number;
    };
  }>;
  has_voted?: boolean;
  vote_points?: number;
}

export default function ChallengePage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [medias, setMedias] = useState<ChallengeMedia[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [selectedParticipation, setSelectedParticipation] = useState<Participation | null>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showJuryVoteModal, setShowJuryVoteModal] = useState(false);
  const [isJury, setIsJury] = useState(false);
  const [votes, setVotes] = useState<{[key: string]: { total_points: number, voters_count: number, average_points: number }}>({});
  // const [hasListenedFully, setHasListenedFully] = useState<{[key: string]: boolean}>({});
  // Utilisé pour suivre la progression de la lecture
  useEffect(() => {
    if (currentPlaybackTime > 0) {
      // On pourrait utiliser cette valeur pour synchroniser
      // d'autres éléments de l'interface avec la progression
      // console.log('Playback time:', currentPlaybackTime);
    }
  }, [currentPlaybackTime]);
  const [isFollowLoading] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  // const [isParticipating, setIsParticipating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, profile } = useSession();
  const router = useRouter();

  const audioPlayerRef = useRef<MediaPlayerRef>(null);
  const videoPlayerRef = useRef<MediaPlayerRef>(null);

  // console.log("the user is ", user);
  

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger le challenge
        const challengeResult = await getChallenge(params.id as string);
        // console.log("Challenge result:", challengeResult);
        
        if (challengeResult.error) {
          throw new Error(challengeResult.error);
        }

        setChallenge(challengeResult.challenge);
        setLikesCount(challengeResult.challenge.likes || 0);
        setIsLiked(challengeResult.challenge.is_liked || false);

        // Vérifier si l'utilisateur est jury
        if (profile?.id) {
          const isUserJuryResult = await isUserJury(challengeResult.challenge.id, profile.id);
          console.log('Is user jury?', isUserJuryResult);
          setIsJury(isUserJuryResult);
        }

        // Charger les médias
        const mediasResult = await getChallengeMedias(params.id as string);
        
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

        // Charger les participations
        const participationsResult = await getChallengeParticipations(params.id as string);
        
        if (participationsResult.error) {
          console.error('Error loading participations:', participationsResult.error);
        } else if (participationsResult.posts) {
          setParticipations(participationsResult.posts);

          // Charger les votes
          const votesResult = await getChallengeVotes(params.id as string);
          if (votesResult.votes) {
            const votesMap = votesResult.votes.reduce((acc: {[key: string]: { total_points: number, voters_count: number, average_points: number }}, vote: ChallengeVote) => {
              acc[vote.participation_id] = {
                total_points: Number(vote.total_points),
                voters_count: Number(vote.voters_count),
                average_points: Number(vote.average_points)
              };
              return acc;
            }, {});
            setVotes(votesMap);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load challenge details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params.id, profile?.id]);

  const handleLike = async () => {
    // TODO: Implement like functionality
    toast({
      title: "Coming soon",
      description: "Like functionality will be available soon",
    });
  };

  const { uploadToCloudinary } = useCloudinaryUpload();

  const handleParticipate = async (file: File) => {
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
      const mediaType = file.type.startsWith('audio/') ? 'audio' : 'video';
      const uploadData = await uploadToCloudinary(file, mediaType);

      // console.log('Cloudinary upload successful:', uploadData);

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
        mediaUrl: uploadData.url,
        mediaPublicId: uploadData.publicId,
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
    return <ChallengeSkeleton />;
  }

  if (error || !challenge) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        {error || 'Challenge not found'}
      </div>
    );
  }

  console.log("les participations", participations);
  

  return (
    <>
    {/* Participate section */}
    {challenge.status === 'active' ? (
      <div className="bg-white rounded-[18px] p-4 space-y-4 mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${profile?.pseudo_url || ''}`}>
            <Avatar
              src={profile?.avatar_url || null}
              stageName={profile?.stage_name || profile?.email?.[0]}
              size={40}
              className="rounded-full"
            />
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
          >
            Je veux participer au challenge
          </button>
        </div>
      </div>
    ) : null}

    {/* Winner card */}
    <WinnerCard
      winnerDisplayName={challenge?.winner_displayname || ''}
      show={challenge?.status === 'completed' && !!challenge?.winner_displayname}
    />

    {/* Challenge content */}
    <article className="bg-orange-50 rounded-[18px] shadow-sm overflow-hidden">
      {/* Challenge header */}
      <div className="flex justify-between flex-1 items-center p-4">
        <div className="flex items-center flex-1 space-x-3">
          <Link href={`/profile/${challenge.creator?.profile?.pseudo_url || ''}`}>
            <Avatar
              src={challenge.creator?.profile?.avatar_url || ''}
              stageName={(challenge.creator?.profile?.stage_name || 'C')[0]}
              size={40}
            />
          </Link>
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
        <h2 className="text-md font-semibold text-[#2D2D2D]">{challenge.title}</h2>
        <p className="mt-1 text-sm text-gray-600">{challenge.description}</p>
      </div>

      {/* Challenge info */}
      <div className="flex justify-between items-center px-4 p-4 gap-2 text-sm">
        <div className="flex flex-col items-center flex-1">
          <Users className="w-6 h-6 text-gray-400 mb-1" />
          <span className="font-semibold text-gray-700">{challenge.participants_count}</span>
          <span className="text-xs text-gray-400">Participants</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Trophy className={`w-6 h-6 mb-1 ${challenge.winning_prize ? 'text-yellow-400' : 'text-gray-200'}`} />
          <span className="font-semibold text-gray-700 text-center">
            {challenge.winning_prize || <span className="text-xs text-gray-400">Aucun</span>}
          </span>
          <span className="text-xs text-gray-400">Récompense</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Calendar className="w-6 h-6 text-red-400 mb-1" />
          <span className="font-semibold text-gray-700">{new Date(challenge.end_at).toLocaleDateString()}</span>
          <span className="text-xs text-gray-400">Date de Fin</span>
        </div>
      </div>

      

      {/* Media section */}
      {medias.length > 0 && (
        <>
          <h3 className="text-md font-semibold text-[#2D2D2D] mx-4 border-b border-gray-200 py-2">Fichier à télécharger</h3>

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
                      downloadable={challenge.status !== 'completed'}
                      coverUrl={media.media.media_cover_url}
                    />
                  ) : (
                    <VideoPlayer
                      {...commonProps}
                      videoUrl={media.media.media_url}
                      ref={videoPlayerRef}
                      downloadable={challenge.status !== 'completed'}
                    />
                  )}
                  {challenge.status === 'completed' && (
                    <div className="text-xs text-gray-400 italic mt-1 ml-2">Téléchargement désactivé, le challenge est terminé.</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 pb-4">
        <button 
          className="flex items-center gap-2"
          onClick={handleLike}
        >
          <Flame 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked ? "fill-orange-500 stroke-orange-500" : "stroke-gray-500 hover:stroke-gray-700"
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

    {/* Section des participations */}
    {participations.length > 0 && (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Participations au challenge</h3>
      <div className="space-y-6">
        {participations.length > 0 ? (
          participations.map((participation) => (
            <div key={participation.id} className="bg-white rounded-[18px] p-4 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <Link href={`/profile/${participation.profile.pseudo_url || ''}`}>
                  <Avatar
                    src={participation.profile.avatar_url}
                    stageName={participation.profile.stage_name || participation.profile.username}
                    size={40}
                  />
                </Link>
                <div>
                  <h4 className="font-semibold text-sm">{participation.profile.stage_name || participation.profile.username}</h4>
                  <TimeAgo date={participation.created_at} defaultLanguage="fr" />
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{participation.content}</p>
              
              {participation.medias?.map((mediaItem) => (
                <div key={mediaItem.id} className="mt-4">
                  {mediaItem.media.media_type === 'audio' ? (
                    <AudioPlayer
                      mediaId={mediaItem.media.id}
                      postId={participation.id}
                      audioUrl={mediaItem.media.media_url}
                      comments={[]}
                      // onTimeUpdate={(time) => {
                      //   if (time >= (mediaItem.media.duration || 0)) {
                      //     setHasListenedFully(prev => ({
                      //       ...prev,
                      //       [participation.id]: true
                      //     }));
                      //   }
                      // }}
                      downloadable={false}
                    />
                  ) : (
                    <VideoPlayer
                      mediaId={mediaItem.media.id}
                      postId={participation.id}
                      videoUrl={mediaItem.media.media_url}
                      comments={[]}
                      // onTimeUpdate={(time) => {
                      //   if (time >= (mediaItem.media.duration || 0)) {
                      //     setHasListenedFully(prev => ({
                      //       ...prev,
                      //       [participation.id]: true
                      //     }));
                      //   }
                      // }}
                      downloadable={false}
                    />
                  )}
                </div>
              ))}
              {challenge.status === 'active' && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {challenge.voting_type === 'jury' ? (
                        isJury ? (
                          participation.has_voted ? (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-400" />
                              <span className="text-sm font-medium">Vote jury soumis</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedParticipation(participation);
                                setShowJuryVoteModal(true);
                              }}
                              className="px-4 py-2 bg-[#E94135] text-white rounded-full hover:bg-red-600 flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Voter en tant que jury
                            </button>
                          )
                        ) : (
                          <div className="text-sm text-gray-500">
                            Vote par jury uniquement
                          </div>
                        )
                      ) : (
                        // Vote public normal
                        participation.has_voted ? (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-400" />
                            <span className="text-sm font-medium">Voté</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedParticipation(participation);
                              setShowVoteModal(true);
                            }}
                            className="px-4 py-2 bg-[#E94135] text-white rounded-full hover:bg-red-600"
                          >
                            Voter
                          </button>
                        )
                      )}
                    </div>

                    {votes[participation.id] && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{votes[participation.id].average_points}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{votes[participation.id].voters_count} vote{votes[participation.id].voters_count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic">Aucune participation pour le moment</p>
        )}
      </div>
    </div>
    )}

    {/* Modal de participation */}
    <ParticipateModal
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onParticipate={handleParticipate}
      challengeTitle={challenge?.title || ''}
      challengeId={challenge.id}
    />
    
    {selectedParticipation && (
      <>
        <VoteModal
          open={showVoteModal}
          onClose={() => {
            setShowVoteModal(false);
            setSelectedParticipation(null);
          }}
          onVote={async (points: number) => {
            if (!user?.id || !selectedParticipation) return;
            
            const result = await voteForParticipation({
              challengeId: challenge.id,
              participationId: selectedParticipation.id,
              voterId: user.id,
              points,
            });

            if (!result.success) {
              toast({
                title: "Erreur",
                description: result.error,
                variant: "destructive",
              });
              return;
            }

            // Mise à jour locale de la participation
            setParticipations(prev => prev.map(p => 
              p.id === selectedParticipation.id
                ? { ...p, has_voted: true, vote_points: points }
                : p
            ));
          }}
          participation={selectedParticipation}
        />

        <JuryVoteModal
          open={showJuryVoteModal}
          onClose={() => {
            setShowJuryVoteModal(false);
            setSelectedParticipation(null);
          }}
          onVote={async (criteria) => {
            if (!user?.id || !selectedParticipation) return;
            
            const result = await voteAsJury({
              challengeId: challenge.id,
              participationId: selectedParticipation.id,
              voterId: user.id,
              criteria,
            });

            if (!result.success) {
              toast({
                title: "Erreur",
                description: result.error,
                variant: "destructive",
              });
              return;
            }

            // Mise à jour locale de la participation
            setParticipations(prev => prev.map(p => 
              p.id === selectedParticipation.id
                ? { ...p, has_voted: true }
                : p
            ));

            toast({
              title: "Vote jury enregistré",
              description: "Votre évaluation a bien été prise en compte",
            });

            // Fermer le modal
            setShowJuryVoteModal(false);
            setSelectedParticipation(null);
          }}
          participation={selectedParticipation}
        />
      </>
    )}
    </>
  );
}
