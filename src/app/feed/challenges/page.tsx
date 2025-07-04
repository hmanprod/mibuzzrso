"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getChallenges, Challenge } from "../../../actions/challenges/challenges";
import { Users, Clock, ArrowRight, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useSession } from "@/components/providers/SessionProvider";
import CreateChallengeDialog from "@/components/feed/CreateChallengeDialog";


function daysLeft(end_at: string) {
  const end = new Date(end_at);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} days left` : "Terminé";
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'completed' | 'all'>('all');
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const router = useRouter();
  const { admin } = useSession() 

  const fetchChallenges = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    const res = await getChallenges(pageToLoad, 5, status);
    if (res && res.challenges) {
      setChallenges(prev => pageToLoad === 1 ? res.challenges : [...prev, ...res.challenges]);
      // Vérifie s'il reste des challenges à charger
      setHasMore(res.challenges.length === 5);
    } else {
      setError(res?.error || 'Unknown error');
      setHasMore(false);
    }
    setLoading(false);
  }, [status]);

  // (Re)chargement initial quand le filtre change
  useEffect(() => {
    setPage(1);
    setChallenges([]);
    fetchChallenges(1);
  }, [status, fetchChallenges]);

  // Observer pour le scroll infini
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchChallenges(page + 1);
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchChallenges]);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">

      <h1 className="text-2xl sm:text-[32px] font-bold text-gray-800 mb-4 max-w-sm break-words">Restez connecté pour suivre et participer aux challenges <span role="img" aria-label="megaphone">📢</span></h1>
      <div className="flex flex-wrap justify-between items-center gap-y-4 gap-x-2 mb-4">
        {admin && (
          <button
            onClick={() => setShowCreateChallenge(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
          >
            Créer un challenge
          </button>
        )}
        {/* Tabs */}
        <div className="flex flex-wrap justify-start gap-1 bg-gray-100 rounded-2xl p-1">
        {['all', 'active', 'completed'].map(tab => (
            <button
            key={tab}
            onClick={() => setStatus(tab as 'all' | 'active' | 'completed')}
            className={`px-4 py-1 text-sm rounded-xl font-semibold transition border-none focus:outline-none text-base min-w-[60px] h-9 flex items-center justify-center ${status === tab ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-500'}`}
            style={{ boxShadow: status === tab ? '0 1px 4px 0 rgba(0,0,0,0.04)' : undefined }}
            >
            {tab === 'all' ? 'Tous' : tab === 'active' ? 'En cours' : tab === 'completed' ? 'Terminé' : tab}
            </button>
        ))}
        </div>
      </div>

      {/* Challenge List */}
      {loading && (
        <div className="space-y-4 mb-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="rounded-2xl overflow-hidden bg-gray-100 opacity-70">
              <div className="p-8">
                <Skeleton height={24} width={180} style={{ marginBottom: 8 }} />
                <Skeleton height={16} width={260} style={{ marginBottom: 8 }} />
                <Skeleton height={16} width={120} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-6">
        {!loading && challenges.length === 0 && (
          <div className="text-center text-gray-500 py-12">Aucun challenge disponible</div>
        )}
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="rounded-2xl shadow bg-white overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Top pastel icon section */}
            <div
              className="relative min-h-[140px] flex flex-col items-center justify-center"
              style={challenge.visual_url ? {
                backgroundImage: `url(${challenge.visual_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              } : { backgroundColor: '#FFF7ED' }}
            >
              {/* Status badge */}
              {(() => {
                let label = '';
                let badgeClass = '';
                switch (challenge.status) {
                  case 'completed':
                    label = 'Terminé';
                    badgeClass = 'bg-gray-200 text-gray-700';
                    break;
                  case 'active':
                    label = 'En cours';
                    badgeClass = 'bg-green-100 text-green-700';
                    break;
                  case 'draft':
                    label = 'Brouillon';
                    badgeClass = 'bg-yellow-100 text-yellow-700';
                    break;
                  default:
                    label = challenge.status;
                    badgeClass = 'bg-gray-100 text-gray-500';
                }
                return (
                  <span className={`absolute left-4 top-4 text-xs font-semibold rounded-lg px-3 py-1 ${badgeClass}`}>
                    {label}
                  </span>
                );
              })()}
              {!challenge.visual_url && <Music size={48} strokeWidth={1.5} className="text-red-300" />}
            </div>
            {/* Content section */}
            <div className="px-4 sm:px-8 py-6 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                    <span className="font-bold text-md break-words">
                    {challenge.title}
                    </span>
                    <p className="mt-2 text-sm text-gray-500 break-words">{challenge.description_short}</p>
                </div>
                <button className="rounded-lg bg-gray-50 border border-gray-200 p-2 hover:bg-gray-100 transition" onClick={() => router.push(`/feed/challenge/${challenge.id}`)}>
                  <ArrowRight size={20} />
                </button>
              </div>
              {/* <div className="text-gray-700 mb-2">
                {challenge.description_short}
              </div> */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm text-gray-500 mt-4">
                <div className="flex gap-6">
                  <span className="flex items-center gap-1">
                    <Clock size={16} /> {daysLeft(challenge.end_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} /> {challenge.participants_count} participants
                  </span>
                </div>
                <span className="flex items-center gap-2">
                  {/* <Avatar src={challenge.user?.avatar_url || undefined} stageName={challenge.user?.stage_name || undefined} size={28} /> */}
                  <span>Publié par {challenge.user?.id ? (
                    <a
                      href={`/profile/${challenge.user.id}`}
                      className="text-primary hover:underline"
                    >
                      {challenge.user?.stage_name || 'Unknown'}
                    </a>
                  ) : 'Unknown'}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loader sentinel */}
      <div ref={loaderRef} className="h-8" />
      {loading && page > 1 && <p className="text-center text-gray-500 py-4">Chargement...</p>}

      {/* Modal de création de challenge */}
      <CreateChallengeDialog
        open={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onSubmit={() => {
          setStatus('active'); // Rafraîchir pour voir le nouveau challenge
        }}
      />
    </div>
  );
}