"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Flame,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Check,
  Download,
  Loader2,
} from "lucide-react";
import type { ExtendedPost } from "@/types/database";
import AudioPlayer from "./AudioPlayer";
import VideoPlayer from "./VideoPlayer";
import CommentSection from "./CommentSection";
import { Avatar } from "../ui/Avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/SessionProvider";
import DeletePostDialog from "./DeletePostDialog";
import EditPostDialog from "./EditPostDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimeAgo } from "../ui/TimeAgo";
import { useFeedPost } from "@/hooks/feed/useFeedPost";
import { renderContentWithLinks } from "./RenderContentsWithLinks";

interface FeedPostProps {
  post: ExtendedPost;
}

export default function   FeedPost({ post }: FeedPostProps) {
  const { user } = useSession();
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [feedPostState, feedPostActions] = useFeedPost(post);
  const {
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
    mediaItem,
    setShowComments,
    setCurrentPlaybackTime,
    setShowDeleteDialog,
    setShowEditDialog,
    setDropdownOpen,  
    audioPlayerRef,
    videoPlayerRef,
  } = feedPostState;
  const {  seekToTime, handleFollow, handlePostDeleted, handlePostUpdated, handleLike, fetchComments } = feedPostActions;
  // Define proper types for the refs
 

  // Fetch comments when component mounts
  useEffect(() => {
    if (mediaItem) {
      fetchComments();
    }
  }, [mediaItem, fetchComments]);

  const isAuthor = user?.id === post.user_id;

 
  // if(post.medias[0].title === "123"){
  //   console.log("affichage post un a un ", post.medias[0].title , " et sa duration est ", post.medias[0].duration);
  // }

  // Si le post est supprimé, ne pas le rendre
  if (isDeleted) {
    return null;
  }

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden mb-4 w-full">
      {/* Post header */}
      <div className="flex justify-between w-full items-center p-4">
        <div className="flex items-center w-full space-x-3 text-sm">
          <div>
            {post.profile.is_admin === true ? (
              <Avatar
                src={post.profile.avatar_url}
                stageName={post.profile.stage_name?.[0] || "U"}
                size={40}
              />
            ) : (
              <Link href={`/profile/${post.profile.pseudo_url}`}>
                <Avatar
                  src={post.profile.avatar_url}
                  stageName={post.profile.stage_name?.[0] || "U"}
                  size={40}
                />
              </Link>
            )}
          </div>
          <div className="flex flex-1 flex-col items-start gap-y-2 sm:flex-row sm:items-center sm:justify-between">
           
            <div className="flex-shrink-0">
              {post.profile.is_admin === true ? (
                <div className="flex flex-col items-start">
                  <h3 className="font-semibold text-[#2D2D2D] break-all">
                    {post.profile.stage_name || "Unknown Artist"}
                  </h3>
                  <TimeAgo date={post.created_at} defaultLanguage="fr" />
                </div>
              ) : (
                <Link href={`/profile/${post.profile.pseudo_url}`}>
                  <div className="flex flex-col items-start">
                    <h3 className="font-semibold text-[#2D2D2D] break-all">
                      {post.profile.stage_name || "Unknown Artist"}
                    </h3>
                    <TimeAgo date={post.created_at} defaultLanguage="fr" />
                  </div>
                </Link>
              )}
            </div>
            
          
            {!isAuthor && (
              <button
                className={`flex w-full justify-center sm:w-auto items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                  post.is_followed
                    ? "bg-gray-100 text-gray-500 cursor-default"
                    : "bg-gray-800 text-white hover:bg-[#E63F3F]"
                }`}
                onClick={() =>
                  !isFollowLoading && !post.is_followed && handleFollow()
                }
                disabled={isFollowLoading || post.is_followed}
              >
                {post.is_followed ? (
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
          </div>
        </div>
        {isAuthor && (
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setShowEditDialog(true);
                  setDropdownOpen(false);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setShowDeleteDialog(true);
                  setDropdownOpen(false);
                }}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title and description */}
      {mediaItem && (
        <div className="px-4">
          <h2 className="text-base font-semibold text-[#2D2D2D] break-all">
            {mediaItem?.title || "Untitled"}
          </h2>
        </div>
      )}

      {/* Title and description */}
      {post.content && (
        <div className="px-4 pb-4">
          <p className="text-gray-600 text-sm break-all">
            {renderContentWithLinks(post.content)}
          </p>
        </div>
      )}

      {/* Media player */}
      {mediaItem &&
        (mediaItem.media_type === "audio" ? (
          <AudioPlayer
            audioUrl={mediaItem.media_url}
            mediaId={mediaItem.id}
            postId={post.id}
            comments={comments}
            onCommentAdded={fetchComments}
            onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
            ref={audioPlayerRef}
            coverUrl={mediaItem.media_cover_url}
            audioDuration={mediaItem.duration}
          />
        ) : (
          <VideoPlayer
            videoUrl={mediaItem.media_url}
            mediaId={mediaItem.id}
            postId={post.id}
            comments={comments}
            onCommentAdded={fetchComments}
            onTimeUpdate={(time) => setCurrentPlaybackTime(time)}
            ref={videoPlayerRef}
          />
        ))}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 px-4 pb-4">
        <div className="flex items-center gap-3">
          {/* Like button */}
          <button
            className="flex items-center gap-2"
            onClick={handleLike}
            disabled={isLikeProcessing}
          >
            <Flame
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked
                  ? "fill-orange-500 stroke-orange-500"
                  : "stroke-gray-500 hover:stroke-gray-700"
              )}
            />
            <span className="text-gray-500">{likesCount}</span>
          </button>
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-6 h-6" />
            <span>{commentsCount}</span>
          </button>
        </div>
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          title="Télécharger"
          disabled={isDownloadLoading}
          onClick={async () => {
            if (mediaItem && !isDownloadLoading) {
              setIsDownloadLoading(true);
              try {
                const response = await fetch(`/api/download/${mediaItem.id}?postId=${post.id}`);

                if (!response.ok) {
                  throw new Error('Download failed');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                // Get filename from response headers
                const contentDisposition = response.headers.get('content-disposition');
                let filename = mediaItem.title || 'download';

                if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                  if (filenameMatch) {
                    filename = filenameMatch[1];
                  }
                }

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Erreur lors du téléchargement:', error);
                // Fallback to opening in new tab
                window.open(mediaItem.media_url, '_blank');
              } finally {
                setIsDownloadLoading(false);
              }
            }
          }}
        >
          {isDownloadLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Download className="w-6 h-6" />
          )}
        </button>
        {/* <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button> */}
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection
          mediaId={mediaItem.id}
          postId={post.id}
          comments={comments}
          currentPlaybackTime={currentPlaybackTime}
          onCommentAdded={fetchComments}
          onSeekToTime={seekToTime}
        />
      )}

      {/* Delete Post Dialog */}
      <DeletePostDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        postId={post.id}
        onDeleted={handlePostDeleted}
      />

      {/* Edit Post Dialog */}
      {mediaItem && (
        <EditPostDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setDropdownOpen(false);
          }}
          postId={post.id}
          mediaId={mediaItem.id}
          initialContent={post.content}
          initialTitle={mediaItem.title || ""}
          onUpdated={handlePostUpdated}
        />
      )}
    </article>
  );
}
