import { Link, Star } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { TimeAgo } from "../ui/TimeAgo";
import ReadMoreText from '../ui/ReadMoreText';
import AudioPlayer from "../feed/AudioPlayer";
import VideoPlayer from "../feed/VideoPlayer";
import { Challenge, Participation } from "@/hooks/challenge/types";
import ChallengeSkeleton from "./ChallengeSkeleton";

interface ParticipationSectionProps {
    participations: Participation[];
    challenge: Challenge;
    isJury: boolean;
    votes: Record<string, { average_points: number; voters_count: number; total_points: number }>;
    setSelectedParticipation: (participation: Participation) => void;
    setShowVoteModal: (show: boolean) => void;
    setShowJuryVoteModal: (show: boolean) => void;
    loadingParticipation: boolean;
    loadingVotes: boolean;
}

const ParticipationSection = ({
    participations, 
    challenge,
    isJury,
    votes,
    setSelectedParticipation,
    setShowVoteModal,
    setShowJuryVoteModal,
    loadingParticipation
}: ParticipationSectionProps) => {
  if (loadingParticipation) {
    return <ChallengeSkeleton />;
  }
    return (
        <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Participations au challenge
        </h3>
        <div className="space-y-6">
          {participations.length > 0 ? (
            participations.map((participation) => (
              <div
                key={participation.id}
                className="bg-white rounded-[18px] p-4 shadow-sm"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Link
                    href={`/profile/${
                      participation.profile.pseudo_url || ""
                    }`}
                  >
                    <Avatar
                      src={participation.profile.avatar_url}
                      stageName={
                        participation.profile.stage_name ||
                        participation.profile.username
                      }
                      size={40}
                    />
                  </Link>
                  <div>
                    <h4 className="font-semibold text-gray-800 break-all">
                      {participation.profile.stage_name ||
                        participation.profile.username}
                    </h4>
                    <TimeAgo
                      date={participation.created_at}
                      defaultLanguage="fr"
                    />
                  </div>
                </div>

                <ReadMoreText text={participation.content} className="mb-4" />

                {participation.medias?.map((mediaItem) => (
                  <div key={mediaItem.id} className="mt-4">
                    {mediaItem.media.media_type === "audio" ? (
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
                {challenge.status === "active" && (
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {challenge.voting_type === "jury" ? (
                          isJury ? (
                            participation.has_voted ? (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-400" />
                                <span className="text-sm font-medium">
                                  Vote jury soumis
                                </span>
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
                        ) : // Vote public normal
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
                        )}
                      </div>

                      {votes[participation.id] && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>
                              {votes[participation.id].total_points} points
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              {votes[participation.id].voters_count} vote
                              {votes[participation.id].voters_count !== 1
                                ? "s"
                                : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 italic">
              Aucune participation pour le moment
            </p>
          )}
        </div>
      </div>
    )
}

export default ParticipationSection