"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ParticipateSection } from "@/components/challenge/ParticipateSection";
import { useSession } from "@/components/providers/SessionProvider";
import ParticipateModal from "@/components/feed/ParticipateModal";
import WinnerCard from "@/components/challenge/WinnerCard";
import ChallengeSkeleton from "@/components/challenge/ChallengeSkeleton";
import VoteModal from "@/components/challenge/VoteModal";
import JuryVoteModal from "@/components/challenge/JuryVoteModal"
import { useChallenge } from "@/hooks/challenge/useChallenge";
import ParticipationSection from "@/components/challenge/ParticipationSection";
import ContentSection from "@/components/challenge/ContentSection";

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
    loadingParticipation,
    loadingVotes,
    loadingChallengeMedias,
    loadingComments,
    comments,
    setCurrentPlaybackTime,
    setSelectedParticipation,
    setShowVoteModal,
    setShowJuryVoteModal,
  } = challengeState;
  const { handleShare, handleFollow, handleLike,  handleParticipate, loadData, handleJuryVote, handleVote, loadParticipation, loadVotes, loadChallengeMedias, loadChallengeComments } =
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
  const {  profile } = useSession();


  useEffect(() => {
   
    
    
    const fetchData = async () => {
      if (!challenge && !loading) {
        await loadData();
      }
    };
  
    fetchData();
  
  
  }, [challenge, loading,  loadData]);

  useEffect(() => {
   
    
    const fetchData = async () => {
      if (!challenge && !loadingComments) {
        await loadChallengeComments();
      }
    };
  
    fetchData();
  
  
  }, [challenge, loadingComments,  loadChallengeComments]);

  useEffect(() => {

  
    const fetchData = async () => {
      if (!challenge && !loadingChallengeMedias) {
        await loadChallengeMedias();
      }
    };
  
    fetchData();
  
    
  }, [challenge, loadingChallengeMedias,  loadChallengeMedias]);

  useEffect(() => {
   
 
    
    const fetchData = async () => {
      if (!challenge && !loadingParticipation) {
        await loadParticipation();
      }
    };
  
    fetchData();
  
  
  }, [challenge, loadingParticipation,  loadParticipation]);

  useEffect(() => {
   
 

    const fetchData = async () => {
      if (!challenge && !loadingVotes) {
        await loadVotes();
      }
    };
  
    fetchData();
  
  
  }, [challenge, loadingVotes,  loadVotes]);


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

  // console.log("the challenge medias are ", medias);


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
        currentPlaybackTime={currentPlaybackTime}
        setCurrentPlaybackTime={setCurrentPlaybackTime}
        comments={comments}
        // handleAddComment={handleAddComment}

      />

      {/* Section des participations */}
      {participations.length > 0 && !loadingParticipation && (
       <ParticipationSection
       participations={participations}
       challenge={challenge}
       isJury={isJury}
       votes={votes}
       setSelectedParticipation={setSelectedParticipation}
       setShowVoteModal={setShowVoteModal}
       setShowJuryVoteModal={setShowJuryVoteModal}
       loadingParticipation={loadingParticipation}
       loadingVotes={loadingVotes}
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
            onVote={handleVote}
            participation={selectedParticipation}
          />

          <JuryVoteModal
            open={showJuryVoteModal}
            onClose={() => {
              setShowJuryVoteModal(false);
              setSelectedParticipation(null);
            }}
            onVote={handleJuryVote}
            participation={selectedParticipation}
          />
        </>
      )}
    </>
  );
}
