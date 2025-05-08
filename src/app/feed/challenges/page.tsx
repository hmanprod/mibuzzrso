"use client";

import { useState, useEffect } from "react";
import { getChallenges, Challenge } from "../actions/challenges";
import { Users, Clock, ArrowRight, Music } from "lucide-react";
import { useRouter } from "next/navigation";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function daysLeft(end_at: string) {
  const end = new Date(end_at);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} days left` : "Terminé";
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'completed' | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getChallenges(1, 5, status)
      .then((res) => {
        if (res && res.challenges) {
          setChallenges(res.challenges);
        } else {
          setError(res?.error || 'Unknown error');
        }
      })
      .catch(() => setError('Failed to load challenges'))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="p-6 max-w-2xl mx-auto">

      <h1 className="text-2xl font-bold text-gray-800 mb-4 px-4 sm:px-0 max-w-sm text-[32px] leading-[40px]">Restez connecté pour suivre et participer aux challenges <span role="img" aria-label="megaphone">📢</span></h1>
      <div className="flex justify-end items-center gap-2">
        {/* Tabs */}
        <div className="flex gap-0 mb-4 bg-gray-100 rounded-2xl p-1 w-fit">
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
            <div className="px-8 py-6 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                    <span className="font-bold text-md">
                    {challenge.title}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">{challenge.description_short}</p>
                </div>
                <button className="rounded-lg bg-gray-50 border border-gray-200 p-2 hover:bg-gray-100 transition" onClick={() => router.push(`/feed/challenge/${challenge.id}`)}>
                  <ArrowRight size={20} />
                </button>
              </div>
              {/* <div className="text-gray-700 mb-2">
                {challenge.description_short}
              </div> */}
              <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
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
    </div>
  );
}