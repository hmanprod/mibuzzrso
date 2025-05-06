"use client";

import { useState, useEffect } from "react";
import { getChallenges, Challenge } from "../actions/challenges";
import { Users, Clock, ArrowRight, Music } from "lucide-react";
import { useRouter } from "next/navigation";

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

      <h1 className="text-2xl font-bold text-gray-800 mb-4 px-4 sm:px-0 max-w-sm text-[32px] leading-[36px]">Restez connecté pour suivre et participer aux challenges <span role="img" aria-label="megaphone">📢</span></h1>
      <div className="flex justify-end items-center gap-2">
        {/* Tabs */}
        <div className="flex gap-0 mb-4 bg-gray-100 rounded-2xl p-1 w-fit">
        {['all', 'active', 'completed'].map(tab => (
            <button
            key={tab}
            onClick={() => setStatus(tab as any)}
            className={`px-4 py-1 text-sm rounded-xl font-semibold transition border-none focus:outline-none text-base min-w-[60px] h-9 flex items-center justify-center ${status === tab ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-500'}`}
            style={{ boxShadow: status === tab ? '0 1px 4px 0 rgba(0,0,0,0.04)' : undefined }}
            >
            {tab === 'all' ? 'Tous' : tab === 'active' ? 'En cours' : tab === 'completed' ? 'Terminé' : tab}
            </button>
        ))}
        </div>
      </div>

      {/* Challenge List */}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-6">
        {challenges.map((challenge) => (
          <div
            key={challenge.id}
            className="rounded-2xl shadow bg-white overflow-hidden border border-gray-100 flex flex-col"
          >
            {/* Top pastel icon section */}
            <div className="relative flex flex-col items-center justify-center bg-orange-50 py-10">
              {/* Status badge */}
              <span className="absolute left-4 top-4 bg-green-100 text-green-700 text-xs font-semibold rounded-lg px-3 py-1">
                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </span>
              <Music size={48} strokeWidth={1.5} className="text-red-300" />
            </div>
            {/* Content section */}
            <div className="px-8 py-6 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                    <span className="font-bold text-md">
                    {challenge.title}
                    </span>
                    <p className="text-sm text-gray-500">{challenge.description}</p>
                </div>
                <button className="rounded-lg bg-gray-50 border border-gray-200 p-2 hover:bg-gray-100 transition" onClick={() => router.push(`/feed/challenge/${challenge.id}`)}>
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="text-gray-700 mb-2">
                {challenge.description_short}
              </div>
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