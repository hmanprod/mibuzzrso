"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ParticipateSection } from "@/components/challenge/ParticipateSection";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "@/components/providers/SessionProvider";
import ParticipateModal from "@/components/feed/ParticipateModal";
import WinnerCard from "@/components/challenge/WinnerCard";
import ChallengeSkeleton from "@/components/challenge/ChallengeSkeleton";
import VoteModal from "@/components/challenge/VoteModal";
import JuryVoteModal from "@/components/challenge/JuryVoteModal";
import {
  voteForParticipation,
  voteAsJury,
} from "../../../../actions/votes/vote";
import { useChallenge } from "@/hooks/challenge/useChallenge";
import ContentSection from "@/components/challenge/ContentSection";
import ParticipationSection from "@/components/challenge/ParticipationSection";

export default function ChallengePage() {
  const params = useParams();

  // const [hasListenedFully, setHasListenedFully] = useState<{[key: string]: boolean}>({});

  const [challengeState, challengeActions] = useChallenge(params.id as string);
  const {
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
    showJuryVoteModal,
    showVoteModal,
    setCurrentPlaybackTime,
    setSelectedParticipation,
    setShowVoteModal,
    setShowJuryVoteModal,
  } = challengeState;
  const { handleShare, handleFollow, handleLike, handleUpdateParticipations, handleParticipate, loadData } =
    challengeActions;
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
  



  // console.log("the user is ", user);

  useEffect(() => {
   

    loadData();
  }, [params.id, profile?.id, loadData]);

  

  if (loading) {
    return <ChallengeSkeleton />;
  }

  if (error || !challenge) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        {error || "Challenge not found"}
      </div>
    );
  }


  return (
    <>
      {/* Participate section */}
      {challenge.status === "active" && profile && (
        <ParticipateSection
          challenge={challenge}
          profile={profile}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      )}

      {/* Winner card */}
      <WinnerCard
        winnerDisplayName={challenge?.winner_displayname || ""}
        show={
          challenge?.status === "completed" && !!challenge?.winner_displayname
        }
      />

      {/* Challenge content */}
      <ContentSection
        challenge={challenge}
        isFollowLoading={isFollowLoading}
        handleFollow={handleFollow}
        handleLike={handleLike}
        handleShare={handleShare}
        isLiked={isLiked}
        likesCount={likesCount}
        medias={medias}
        setCurrentPlaybackTime={setCurrentPlaybackTime}

      />

      {/* Section des participations */}
      {participations.length > 0 && (
       <ParticipationSection
       participations={participations}
       challenge={challenge}
       isJury={isJury}
       votes={votes}
       setSelectedParticipation={setSelectedParticipation}
       setShowVoteModal={setShowVoteModal}
       setShowJuryVoteModal={setShowJuryVoteModal}
       />
      )}

      {/* Modal de participation */}
      <ParticipateModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onParticipate={handleParticipate}
        challengeTitle={challenge?.title || ""}
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

              handleUpdateParticipations(participations);
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

              handleUpdateParticipations(participations);

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
