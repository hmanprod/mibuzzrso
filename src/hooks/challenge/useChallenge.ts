import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import type { Challenge, ChallengeActions, ChallengeState, Participation, ChallengeMedia, ChallengeVote } from './types';
import { useSession } from '@/components/providers/SessionProvider';
import { getChallenge, getChallengeMedias, isUserJury, participateInChallenge } from '@/actions/challenges/challenges';
import { useCloudinaryUpload } from '../useCloudinaryUpload';
import { useRouter } from 'next/navigation';
import { getChallengeParticipations } from '@/actions/posts/post';
import { getChallengeVotes, JuryVoteData, voteAsJury, voteForParticipation } from '@/actions/votes/vote';

export function useChallenge(challengeId: string): [ChallengeState, ChallengeActions] {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [selectedParticipation, setSelectedParticipation] = useState<Participation | null>(null);
  const [isJury, setIsJury] = useState(false);
  const [votes, setVotes] = useState<{[key: string]: { total_points: number, voters_count: number, average_points: number }}>({});
  const [medias, setMedias] = useState<ChallengeMedia[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showJuryVoteModal, setShowJuryVoteModal] = useState(false);
  const { user, profile } = useSession();
  const router = useRouter();
    const { uploadToCloudinary } = useCloudinaryUpload();

  // Actions
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

  const handleLike = async () => {
    // TODO: Implement like functionality
    toast({
      title: "Coming soon",
      description: "Like functionality will be available soon",
    });
  };

  const handleUpdateParticipations = (participations: Participation[]) => {
    console.log("the participations", participations);
    
    setParticipations(participations);
  };

  const handleParticipate = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour participer",
        variant: "destructive",
      });
      return;
    }

    try {
      // setIsUploading(true);

      // 1. Upload to Cloudinary
      const mediaType = file.type.startsWith("audio/") ? "audio" : "video";
      const uploadData = await uploadToCloudinary(file, mediaType);

      // console.log('Cloudinary upload successful:', uploadData);

      // 2. Get file duration if it's an audio file
      let duration;
      if (file.type.startsWith("audio/")) {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
          audio.addEventListener("loadedmetadata", () => {
            duration = audio.duration;
            resolve(null);
          });
        });
      }

      // 3. Save participation in database
      const result = await participateInChallenge({
        challengeId: challengeId,
        userId: user.id,
        mediaUrl: uploadData.url,
        mediaPublicId: uploadData.publicId,
        mediaType: file.type.startsWith("audio/") ? "audio" : "video",
        duration: duration,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Succès !",
        description: "Votre participation a été enregistrée",
      });

      // 4. Close modal and resetIsModalOpenfresh page
      router.refresh();
    } catch (error) {
      console.error("Error participating:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la participation",
        variant: "destructive",
      });
    }
    //  finally {
    //   setIsUploading(false);
    // }
  };

  const handleVote = async (points: number) => {
    if (!user?.id || !selectedParticipation || !challenge) return;

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

      handleUpdateParticipations(participations);
    
  }

  const handleJuryVote = async (criteria: {
    technique: number;
    originalite: number;
    interpretation: number;
    overall: number;
  }) => {
    if (!user?.id || !selectedParticipation || !challenge) return;

      const result = await voteAsJury({
        challengeId: challenge.id,
        participationId: selectedParticipation.id,
        voterId: user.id,
        criteria,
      } as JuryVoteData);

      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      handleUpdateParticipations(participations);

      toast({
        title: "Vote jury enregistré",
        description: "Votre évaluation a bien été prise en compte",
      });

      // Fermer le modal
      setShowJuryVoteModal(false);
      setSelectedParticipation(null);

  }

  const loadData = async () => {
    try {
      // Charger le challenge
      const challengeResult = await getChallenge(challengeId);
      // console.log("Challenge result:", challengeResult);

      if (challengeResult.error) {
        throw new Error(challengeResult.error);
      }

      setChallenge(challengeResult.challenge);
      setLikesCount(challengeResult.challenge.likes || 0);
      setIsLiked(challengeResult.challenge.is_liked || false);

      // Vérifier si l'utilisateur est jury
      if (profile?.id) {
        const isUserJuryResult = await isUserJury(
          challengeResult.challenge.id,
          profile.id
        );
        console.log("Is user jury?", isUserJuryResult);
        setIsJury(isUserJuryResult);
      }

      // Charger les médias
      const mediasResult = await getChallengeMedias(challengeId);

      if (mediasResult.error) {
        console.error("Error loading medias:", mediasResult.error);
      } else if (mediasResult.medias) {
        // S'assurer que les médias sont bien typés
        const typedMedias: ChallengeMedia[] = mediasResult.medias.map(
          (media) => ({
            id: media.id,
            position: media.position,
            media: {
              id: media.media.id,
              media_type: media.media.media_type as "audio" | "video",
              media_url: media.media.media_url,
              media_cover_url: media.media.media_cover_url,
              media_public_id: media.media.media_public_id,
              duration: media.media.duration,
              title: media.media.title,
              description: media.media.description,
              user_id: media.media.user_id,
              created_at: media.media.created_at,
              updated_at: media.media.updated_at,
            },
            comments: media.comments,
          })
        );
        setMedias(typedMedias);
      }

      // Charger les participations
      const participationsResult = await getChallengeParticipations(
        challengeId
      );

      if (participationsResult.error) {
        console.error(
          "Error loading participations:",
          participationsResult.error
        );
      } else if (participationsResult.posts) {
        setParticipations(participationsResult.posts);

        // Charger les votes
        const votesResult = await getChallengeVotes(challengeId);
        if (votesResult.votes) {
          const votesMap = votesResult.votes.reduce(
            (
              acc: {
                [key: string]: {
                  total_points: number;
                  voters_count: number;
                  average_points: number;
                };
              },
              vote: ChallengeVote
            ) => {
              acc[vote.participation_id] = {
                total_points: Number(vote.total_points),
                voters_count: Number(vote.voters_count),
                average_points: Number(vote.average_points),
              };
              return acc;
            },
            {}
          );
          setVotes(votesMap);
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load challenge details");
    } finally {
      setLoading(false);
    }
  };

  

  return [
    {
      challenge,
      loading,
      error,
      isLiked,
      likesCount,
      currentPlaybackTime,
      selectedParticipation,
      isJury,
      votes,
      medias,
      participations,
      isFollowLoading,
      showVoteModal,
      showJuryVoteModal,
      setChallenge,
      setLoading,
      setError,
      setIsLiked,
      setLikesCount,
      setCurrentPlaybackTime,
      setSelectedParticipation,
      setIsJury,
      setVotes,
      setMedias,
      setIsFollowLoading,
      setParticipations,
      setShowVoteModal,
      setShowJuryVoteModal
    },
    {
      handleShare,
      handleFollow,
      handleLike,
      handleParticipate,
      handleVote,
      handleJuryVote,
      setSelectedParticipation,
      handleUpdateParticipations,
      loadData
    }
  ];
}