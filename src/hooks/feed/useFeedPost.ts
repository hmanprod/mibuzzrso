import { ExtendedPost } from "@/types/database";
import { FeedPostActions, FeedPostState, MediaPlayerRef } from "./types";
import { useSession } from "@/components/providers/SessionProvider";
import { useCallback, useRef, useState } from "react";
import { Comment } from "./comment.types";
import { followUser } from "@/actions/follower/follower";
import { toast } from "@/components/ui/use-toast";
import {
  getCommentsByMediaId,
  togglePostLike,
} from "@/actions/interactions/interaction";

export function useFeedPost(
  post: ExtendedPost
): [FeedPostState, FeedPostActions] {
  const { user } = useSession();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const audioPlayerRef = useRef<MediaPlayerRef | null>(null);
  const videoPlayerRef = useRef<MediaPlayerRef | null>(null);

  // Get the first media item (for now we'll just handle single media)
  const mediaItem = post.medias[0];

  const handleSetLikesCount = (newIsLiked: boolean) => {
    setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
  };

  // Function to seek to a specific time in the media player
  const seekToTime = (time: number) => {
    setCurrentPlaybackTime(time);

    if (mediaItem?.media_type === "audio" && audioPlayerRef.current) {
      audioPlayerRef.current.seekToTime(time);
    } else if (mediaItem?.media_type === "video" && videoPlayerRef.current) {
      videoPlayerRef.current.seekToTime(time);
    }
  };

  // Function to handle following a user
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Vous devez être connecté pour suivre un utilisateur",
        variant: "destructive",
      });
      return;
    }

    if (isFollowLoading) return;

    // Optimistic update
    setIsFollowLoading(true);

    // Create a shallow copy of the post object with updated is_followed value
    post.is_followed = true;

    try {
      // Call the API in the background
      const result = await followUser(user.id, post.user_id);

      if (result.error) {
        // If there's an error, revert the optimistic update
        console.error("Error following user:", result.error);
        post.is_followed = false;

        // Show error toast
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      // If there's an exception, revert the optimistic update
      console.error("Error following user:", error);
      post.is_followed = false;

      toast({
        title: "Erreur",
        description: "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Function to handle post deletion

  const handlePostDeleted = () => {
    toast({
      title: "Post deleted",
      description: "Your post has been deleted successfully.",
    });
    // Marquer le post comme supprimé pour le masquer de l'UI
    setIsDeleted(true);
  };

  // Function to handle post update
  const handlePostUpdated = () => {
    toast({
      title: "Post updated",
      description: "Your post has been updated successfully.",
    });
    // You might want to refresh the feed to show the updated post
    // This depends on how your feed is implemented
  };

  const handleLike = async () => {
    // Empêcher les clics multiples rapides
    if (isLikeProcessing) return;

    // Appliquer immédiatement le like pour une meilleure UX
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    handleSetLikesCount(newIsLiked);

    // Si l'utilisateur aime le post, montrer automatiquement la section commentaires
    if (newIsLiked && !showComments) {
      setShowComments(true);
      // Précharger les commentaires si nécessaire
      if (comments.length === 0) {
        fetchComments();
      }
    }

    // Marquer comme en cours de traitement en arrière-plan
    setIsLikeProcessing(true);

    try {
      // Faire l'appel API en arrière-plan
      const result = await togglePostLike(post.id);

      // En cas d'erreur, annuler l'optimistic update
      if (result.error) {
        setIsLiked(!newIsLiked);
        handleSetLikesCount(!newIsLiked);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut du like.",
          variant: "destructive",
        });
      } else if (newIsLiked) {
        // Si le like a réussi et que c'est un nouveau like, encourager l'utilisateur à commenter
        toast({
          title: "Vous aimez ce contenu !",
          description: "Partagez votre avis en laissant un commentaire.",
          variant: "default",
        });
      }
    } catch (error) {
      // En cas d'erreur, annuler l'optimistic update
      setIsLiked(!newIsLiked);
      handleSetLikesCount(!newIsLiked);
      console.error(error);
    } finally {
      setIsLikeProcessing(false);
    }
  };

  // const handleShare = () => {
  //   // TODO: Implement share functionality
  //   toast({
  //     title: "Bientôt disponible",
  //     description: "La fonctionnalité de partage sera disponible prochainement",
  //   });
  // };

  const fetchComments = useCallback(async () => {
    if (!mediaItem) return;

    try {
      const { comments: fetchedComments, error } = await getCommentsByMediaId(
        mediaItem.id
      );

      if (error) {
        console.error("Error fetching comments:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les commentaires",
          variant: "destructive",
        });
        return;
      }

      // Ensure fetchedComments is not undefined before setting state
      setComments(fetchedComments || []);
      setCommentsCount(fetchedComments?.length || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commentaires",
        variant: "destructive",
      });
    }
  }, [mediaItem]);

  return [
    {
      isLiked,
      likesCount,
      isLikeProcessing,
      showComments,
      comments,
      commentsCount,
      currentPlaybackTime,
      showDeleteDialog,
      showEditDialog,
      isFollowLoading,
      dropdownOpen,
      isDeleted,
      audioPlayerRef,
      videoPlayerRef,
      mediaItem,
      setIsLiked,
      setLikesCount,
      setIsLikeProcessing,
      setShowComments,
      setComments,
      setCommentsCount,
      setCurrentPlaybackTime,
      setShowDeleteDialog,
      setShowEditDialog,
      setIsFollowLoading,
      setDropdownOpen,
      setIsDeleted,
    },
    {
      handleSetLikesCount,
      seekToTime,
      handleFollow,
      handlePostDeleted,
      handlePostUpdated,
      handleLike,
      fetchComments,
    },
  ];
}
