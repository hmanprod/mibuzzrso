import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type {
  Challenge,
  ChallengeActions,
  ChallengeState,
  Participation,
  ChallengeVote,
  VoteData,
} from "./types";
import { useSession } from "@/components/providers/SessionProvider";
import {
  ChallengeData,
  ChallengeMedia,
  getChallenge,
  getChallengeComments,
  getChallengeMedias,
  participateInChallenge,
  TransformedComment,
} from "@/actions/challenges/challenges";
import { useCloudinaryUpload } from "../useCloudinaryUpload";
import { useRouter } from "next/navigation";
import { getChallengeParticipations } from "@/actions/posts/post";
import {
  getChallengeVotes,
  JuryVoteData,
  voteAsJury,
  voteForParticipation,
} from "@/actions/votes/vote";
import { toggleChallengeLike } from "@/actions/interactions/interaction";
import { addComment, addPointsForComment } from '@/actions/comment/comment';

export function useChallenge(
  challengeId: string
): [ChallengeState, ChallengeActions] {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [selectedParticipation, setSelectedParticipation] =
    useState<Participation | null>(null);
  const [isJury, setIsJury] = useState(false);
  const [votes, setVotes] = useState<{
    [key: string]: {
      total_points: number;
      voters_count: number;
      average_points: number;
    };
  }>({});
  const [medias, setMedias] = useState<ChallengeMedia[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showJuryVoteModal, setShowJuryVoteModal] = useState(false);
  const { user } = useSession();
  const router = useRouter();
  const { uploadToCloudinary } = useCloudinaryUpload();
  const [loadingParticipation, setLoadingParticipation] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingChallengeMedias, setLoadingChallengeMedias] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<TransformedComment[]>([]);

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

  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  const handleLike = async () => {
    console.log("challengeId", challengeId);
    if (isLikeProcessing) return;

    // Optimistic update pour une meilleure expérience utilisateur
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    setIsLikeProcessing(true);

    try {
      const result = await toggleChallengeLike(challengeId);
      console.log("Result", result);

      if (result.error) {
        // Annuler l'update optimiste en cas d'erreur
        setIsLiked(!newIsLiked);
        setLikesCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      } else if (newIsLiked) {
        // Feedback pour l'utilisateur
        toast({
          title: "Vous aimez ce défi !",
          description: "Merci pour votre soutien !",
        });
      }
    } catch (error) {
      console.error("Error toggling challenge like:", error);
      // Annuler l'update optimiste en cas d'erreur
      setIsLiked(!newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du like",
        variant: "destructive",
      });
    } finally {
      setIsLikeProcessing(false);
    }
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
  };

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
  };

  const handleAddComment = async ({
    content,
    mediaId,
    parentCommentId,
    playbackTime,
  }: {
    content: string;
    mediaId: string;
    parentCommentId?: string;
    playbackTime?: number;
  }) => {
    if (!user) {
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour ajouter des commentaires",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim() || !mediaId) {
      toast({
        title: "Commentaire vide",
        description: "Veuillez saisir un commentaire",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingComment(true);

      // La fonction addComment doit être adaptée pour prendre challengeId
      const { error, data } = await addComment({
        mediaId,
        challengeId,
        content: content.trim(),
        playbackTime: playbackTime || currentPlaybackTime,
        parentCommentId,
      });

      if (error || !data) {
        toast({
          title: "Erreur",
          description: error || "Erreur lors de l'ajout du commentaire",
          variant: "destructive",
        });
        return;
      }

      // Ajouter les points pour le commentaire
      if (data.id) {
        const { error: pointsError } = await addPointsForComment(data.id);
        if (pointsError) {
          console.error('Error adding points for comment:', pointsError);
        }
      }

      // TODO: Rafraîchir les commentaires, par exemple en appelant `loadData()`
      // ou en mettant à jour l'état des médias de manière optimiste.
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès",
      });

    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du commentaire.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // const loadData = async () => {
  //   try {
  //     // Charger le challenge
  //     const challengeResult = await getChallenge(challengeId);
  //     // console.log("Challenge result:", challengeResult);

  //     if (challengeResult.error) {
  //       throw new Error(challengeResult.error);
  //     }

  //     if (!challengeResult.challengeData) {
  //       throw new Error("Challenge not found");
  //     }

  //     const challengeData = challengeResult.challengeData as ChallengeData;

  //     const formattedChallenge: Challenge = {
  //       id: challengeData.id,
  //       title: challengeData.title,
  //       description: challengeData.description,
  //       status: challengeData.status as "active" | "completed",
  //       created_at: challengeData.created_at,
  //       end_at: challengeData.end_at,
  //       winner_displayname: challengeData.winner_displayname,
  //       participants_count: challengeData.participants_count,
  //       winning_prize: challengeData.winning_prize,
  //       voting_type: challengeData.voting_type as "public" | "jury",
  //       likes: challengeData.likes_count,
  //       is_liked: challengeData.is_liked,
  //       creator: {
  //         id: challengeData.user_id,
  //         profile: {
  //           id: challengeData.creator_data.id,
  //           stage_name: challengeData.creator_data.stage_name,
  //           avatar_url: challengeData.creator_data.avatar_url,
  //           pseudo_url: challengeData.creator_data.pseudo_url,
  //         },
  //       },
  //     };

  //     // Puis utilisez formattedChallenge au lieu de challengeData
  //     setChallenge(formattedChallenge);
  //     setLikesCount(formattedChallenge.likes || 0);
  //     setIsLiked(formattedChallenge.is_liked || false);

  //     // Vérifier si l'utilisateur est jury
  //     if (profile?.id) {
  //       const isUserJuryResult = await isUserJury(
  //         challengeResult.challengeData.id,
  //         profile.id
  //       );

  //       setIsJury(isUserJuryResult);
  //     }

  //     // Charger les médias
  //     const mediasResult = await getChallengeMedias(challengeId);

  //     if (mediasResult.error) {
  //       console.error("Error loading medias:", mediasResult.error);
  //     } else if (mediasResult.medias) {
  //       // S'assurer que les médias sont bien typés
  //       const typedMedias: ChallengeMedia[] = mediasResult.medias.map(
  //         (media) => ({
  //           id: media.id,
  //           position: media.position,
  //           media: {
  //             id: media.media.id,
  //             media_type: media.media.media_type as "audio" | "video",
  //             media_url: media.media.media_url,
  //             media_cover_url: media.media.media_cover_url,
  //             media_public_id: media.media.media_public_id,
  //             duration: media.media.duration,
  //             title: media.media.title,
  //             description: media.media.description,
  //             user_id: media.media.user_id,
  //             created_at: media.media.created_at,
  //             updated_at: media.media.updated_at,
  //           },
  //           comments: media.comments,
  //         })
  //       );
  //       setMedias(typedMedias);
  //     }

  //     // Charger les participations
  //     const participationsResult = await getChallengeParticipations(
  //       challengeId
  //     );

  //     if (participationsResult.error) {
  //       console.error(
  //         "Error loading participations:",
  //         participationsResult.error
  //       );
  //     } else if (participationsResult.posts) {
  //       setParticipations(participationsResult.posts);

  //       // Charger les votes
  //       const votesResult = await getChallengeVotes(challengeId);
  //       if (votesResult.votes) {
  //         const votesMap = votesResult.votes.reduce(
  //           (
  //             acc: {
  //               [key: string]: {
  //                 total_points: number;
  //                 voters_count: number;
  //                 average_points: number;
  //               };
  //             },
  //             vote: ChallengeVote
  //           ) => {
  //             acc[vote.participation_id] = {
  //               total_points: Number(vote.total_points),
  //               voters_count: Number(vote.voters_count),
  //               average_points: Number(vote.average_points),
  //             };
  //             return acc;
  //           },
  //           {}
  //         );
  //         setVotes(votesMap);
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Error loading data:", err);
  //     setError("Failed to load challenge details");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadData = async () => {
    try {
      setLoading(true);
      const challengeResult = await getChallenge(challengeId);
  
      if (challengeResult.error) {
        throw new Error(challengeResult.error);
      }
  
      if (!challengeResult.challengeData) {
        throw new Error("Challenge not found");
      }
  
      const challengeData = challengeResult.challengeData as ChallengeData;
  
      const formattedChallenge: Challenge = {
        id: challengeData.id,
        title: challengeData.title,
        description: challengeData.description,
        status: challengeData.status as "active" | "completed",
        created_at: challengeData.created_at,
        end_at: challengeData.end_at,
        winner_displayname: challengeData.winner_displayname,
        participants_count: challengeData.participants_count,
        winning_prize: challengeData.winning_prize,
        voting_type: challengeData.voting_type as "public" | "jury",
        likes: challengeData.likes_count,
        is_liked: challengeData.is_liked,
        creator: {
          id: challengeData.user_id,
          profile: {
            id: challengeData.creator_data.id,
            stage_name: challengeData.creator_data.stage_name,
            avatar_url: challengeData.creator_data.avatar_url,
            pseudo_url: challengeData.creator_data.pseudo_url,
          },
        },
      };
  
      setChallenge(formattedChallenge);
  
      // Only update likes if not processing a like action
      if (!isLikeProcessing) {
        setLikesCount(formattedChallenge.likes || 0);
        setIsLiked(formattedChallenge.is_liked || false);
      }
  
      // ... (rest of loadData: medias, participations, votes, etc.)
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load challenge details");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipation = async () => {
    try {
      setLoadingParticipation(true);
      const participationResult = await getChallengeParticipations(challengeId);
      if (participationResult.error) {
        throw new Error(participationResult.error);
      }
      if (!participationResult.posts) {
        throw new Error("Participations not found");
      }
      const participations = participationResult.posts;
      setParticipations(participations);
    } catch (err) {
      console.error("Error loading participations:", err);
      setError("Failed to load participations");
    } finally {
      setLoadingParticipation(false);
    }
  }

  // const loadVotes = async () => {
  //   try {
  //     setLoadingVotes(true);
  //     const votesResult = await getChallengeVotes(challengeId);
  //     if (votesResult.error) {
  //       throw new Error(votesResult.error);
  //     }
  //     if (!votesResult.votes) {
  //       throw new Error("Votes not found");
  //     }
  //     const votes = votesResult.votes;
  //     setVotes(votes);
  //   } catch (err) {
  //     console.error("Error loading votes:", err);
  //     setError("Failed to load votes");
  //   } finally {
  //     setLoadingVotes(false);
  //   }
  // }

  const loadVotes = async () => {
    try {
      setLoadingVotes(true);
      const votesResult = await getChallengeVotes(challengeId);
      console.log(votesResult);
      if (votesResult.error) {
        throw new Error(votesResult.error);
      }
      if (!votesResult.votes) {
        throw new Error("Votes not found");
      }
      const votesMap = votesResult.votes.reduce(
        (
          acc: { [key: string]: VoteData },
          vote: ChallengeVote
        ) => {
          acc[vote.participation_id] = {
            total_points: Number(vote.total_points),
            voters_count: Number(vote.voters_count),
            average_points: Number(vote.average_points),
            avg_technique: vote.avg_technique != null ? Number(vote.avg_technique) : null,
            avg_originalite: vote.avg_originalite != null ? Number(vote.avg_originalite) : null,
            avg_interpretation: vote.avg_interpretation != null ? Number(vote.avg_interpretation) : null,
            jury_votes_count: vote.jury_votes_count != null ? Number(vote.jury_votes_count) : 0,
          };
          return acc;
        },
        {}
      );
      setVotes(votesMap);
    } catch (err) {
      console.error("Error loading votes:", err);
      setError("Failed to load votes");
    } finally {
      setLoadingVotes(false);
    }
  };

  const loadChallengeMedias = async () => {
    try {
      setLoadingChallengeMedias(true); // Utiliser l'état de chargement global
  
      // Charger les médias du challenge
      const mediasResult = await getChallengeMedias(challengeId);
      // console.log("mediasResult", mediasResult);
  
      if (mediasResult.error) {
        throw new Error(mediasResult.error);
      }
  
      if (!mediasResult.medias) {
        throw new Error("No medias found for this challenge");
      }
  
      // Formatter les médias pour correspondre au type ChallengeMedia
      const typedMedias: ChallengeMedia[] = mediasResult.medias.map((media) => ({
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
        }
      }));
  
      // Mettre à jour l'état des médias
      setMedias(typedMedias);
    } catch (err) {
      console.error("Error loading challenge medias:", err);
      setError("Failed to load challenge medias");
    } finally {
      setLoadingChallengeMedias(false);
    }
  };


  const loadChallengeComments = async () => {
    console.log("loadChallengeComments");
    try {
      setLoadingComments(true);
      const commentsResult = await getChallengeComments(challengeId);
     
      setComments(commentsResult.comments || []);
    } catch (err) {
      console.error("Error loading challenge comments:", err);
      setError("Failed to load challenge comments");
    } finally {
      setLoadingComments(false);
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
      loadingParticipation,
      loadingVotes,
      loadingChallengeMedias,
      isSubmittingComment,
      loadingComments,
      comments,
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
      setShowJuryVoteModal,
      setLoadingParticipation,  
      setLoadingVotes,
      setIsSubmittingComment,
      setLoadingChallengeMedias,
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
      loadData,
      loadParticipation,
      loadVotes,
      handleAddComment,
      loadChallengeMedias,
      loadChallengeComments,
    },
  ];
}
