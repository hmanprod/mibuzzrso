import Link from "next/link";
import { Avatar } from "../ui/Avatar";
import {
  Challenge,
  ChallengeMedia,
  MediaPlayerRef,
} from "@/hooks/challenge/types";
import { TimeAgo } from "../ui/TimeAgo";
import {
  Calendar,
  Check,
  Flame,
  MessageCircle,
  Share2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import AudioPlayer from "../feed/AudioPlayer";
import VideoPlayer from "../feed/VideoPlayer";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import CommentSectionChallenge from "../feed/CommentSectionChallenge";
import { TransformedComment } from "@/actions/challenges/challenges";

interface ContentSectionProps {
  challenge: Challenge;
  isFollowLoading: boolean;
  handleFollow: () => void;
  handleLike: () => void;
  handleShare: () => void;
  isLiked: boolean;
  likesCount: number;
  medias: ChallengeMedia[];
  currentPlaybackTime: number;
  setCurrentPlaybackTime: (time: number) => void;
  handleAddComment?: (params: { comment: string }) => Promise<void>;
  comments: TransformedComment[];
}

const ContentSection = ({
  challenge,
  isFollowLoading,
  handleFollow,
  handleLike,
  handleShare,
  isLiked,
  likesCount,
  medias,
  currentPlaybackTime,
  setCurrentPlaybackTime,
  handleAddComment,
  comments,
}: ContentSectionProps) => {
  const audioPlayerRef = useRef<MediaPlayerRef>(null);
  const videoPlayerRef = useRef<MediaPlayerRef>(null);
  const [isCommenting, setIsCommenting] = useState(false);

  // console.log("medias", comments);

  const handleAddComment2 = async () => {
    if (!handleAddComment) return;
    console.log("handleAddComment", handleAddComment);
  };
  
  return (
    <article className="bg-orange-50 rounded-[18px] shadow-sm overflow-hidden">
      {/* Challenge header */}
      <div className="flex justify-between flex-1 items-center p-4">
        <div className="flex items-center flex-1 space-x-3">
          <Link
            href={`/profile/${challenge.creator?.profile?.pseudo_url || ""}`}
          >
            <Avatar
              src={challenge.creator?.profile?.avatar_url || ""}
              stageName={(challenge.creator?.profile?.stage_name || "C")[0]}
              size={40}
            />
          </Link>
          <div className="flex items-center flex-1 justify-between space-x-2">
            <div className="flex flex-col items-start">
              <h3 className="font-semibold text-sm text-[#2D2D2D]">
                {challenge.creator?.profile?.stage_name || "Challenge Creator"}
              </h3>
              <TimeAgo date={challenge.created_at} defaultLanguage="fr" />
            </div>
            <button
              className={`flex items-center gap-1 text-xs font-medium rounded-full px-3 py-1 transition-colors ${
                challenge.is_followed
                  ? "bg-gray-100 text-gray-500 cursor-default"
                  : "bg-gray-800 text-white hover:bg-[#E63F3F]"
              }`}
              onClick={() =>
                !isFollowLoading && !challenge.is_followed && handleFollow()
              }
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
        <h2 className="text-md font-semibold text-[#2D2D2D]">
          {challenge.title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{challenge.description}</p>
      </div>

      {/* Challenge info */}
      <div className="flex justify-between items-center px-4 p-4 gap-2 text-sm">
        <div className="flex flex-col items-center flex-1">
          <Users className="w-6 h-6 text-gray-400 mb-1" />
          <span className="font-semibold text-gray-700">
            {challenge.participants_count}
          </span>
          <span className="text-xs text-gray-400">Participants</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Trophy
            className={`w-6 h-6 mb-1 ${
              challenge.winning_prize ? "text-yellow-400" : "text-gray-200"
            }`}
          />
          <span className="font-semibold text-gray-700 text-center">
            {challenge.winning_prize || (
              <span className="text-xs text-gray-400">Aucun</span>
            )}
          </span>
          <span className="text-xs text-gray-400">Récompense</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <Calendar className="w-6 h-6 text-red-400 mb-1" />
          <span className="font-semibold text-gray-700">
            {new Date(challenge.end_at).toLocaleDateString()}
          </span>
          <span className="text-xs text-gray-400">Date de Fin</span>
        </div>
      </div>

      {/* Media section */}
      {medias.length > 0 && (
        <>
          <h3 className="text-md font-semibold text-[#2D2D2D] mx-4 border-b border-gray-200 py-2">
            Fichier à télécharger
          </h3>

          <div className="mb-4 space-y-4">
            {medias.map((media, index) => {
              const isAudio = media.media.media_type === "audio";
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
                      downloadable={challenge.status !== "completed"}
                      coverUrl={media.media.media_cover_url}
                    />
                  ) : (
                    <VideoPlayer
                      {...commonProps}
                      videoUrl={media.media.media_url}
                      ref={videoPlayerRef}
                      downloadable={challenge.status !== "completed"}
                    />
                  )}
                  {challenge.status === "completed" && (
                    <div className="text-xs text-gray-400 italic mt-1 ml-2">
                      Téléchargement désactivé, le challenge est terminé.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 pb-4">
        <button className="flex items-center gap-2" onClick={() => handleLike()}>
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
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={() => setIsCommenting(true)}
        >
          <MessageCircle className="w-6 h-6" />{comments.length}
        </button>
       
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    
          <CommentSectionChallenge
            challengeId={challenge.id}
            comments={comments || []}
            currentPlaybackTime={currentPlaybackTime}
            onCommentAdded={handleAddComment2}
            onSeekToTime={setCurrentPlaybackTime}
            isCommenting={isCommenting}
          />
    </article>
  );
};

export default ContentSection;
