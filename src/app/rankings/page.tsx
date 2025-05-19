'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import RankBadge from '@/components/profile/RankBadge';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';


interface RankingUser {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  points: number;
  points_earned: number;
  rank: number;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRankings() {
      const supabase = createClient();
      
      // D'abord, on récupère les classements de la semaine
      const { data: weeklyRankings, error } = await supabase
        .from('weekly_rankings')
        .select('points_earned, rank, user_id')
        .eq('week_start', new Date().toISOString().split('T')[0])
        .order('rank', { ascending: true });

      if (error || !weeklyRankings) {
        console.error('Error fetching rankings:', error);
        return;
      }

      // Ensuite, on récupère les profils correspondants
      const userIds = weeklyRankings.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, stage_name, avatar_url, points')
        .in('id', userIds);

      if (!profiles) return;

      // On combine les données
      const formattedRankings = weeklyRankings.map(ranking => {
        const profile = profiles.find(p => p.id === ranking.user_id);
        if (!profile) return null;

        return {
          id: profile.id,
          stage_name: profile.stage_name,
          avatar_url: profile.avatar_url,
          points: profile.points,
          points_earned: ranking.points_earned,
          rank: ranking.rank
        };
      }).filter((r): r is RankingUser => r !== null);



      setRankings(formattedRankings);
      setIsLoading(false);
    }

    fetchRankings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      
      <div className="flex max-w-[1300px] mx-auto px-6 py-8 gap-8">
        {/* Sidebar gauche */}
        <div className="hidden lg:block w-[240px] flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Contenu principal */}
        <div className="flex-1 pl-10">
          <h1 className="text-2xl font-bold mb-6">Classement de la semaine</h1>
          
          <div className="bg-white rounded-lg shadow">
            {rankings.map((user, index) => (
              <Link 
                href={`/profile/${user.id}`} 
                key={user.id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  index !== rankings.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                {/* Position */}
                <div className="w-8 text-center font-semibold">
                  {user.rank <= 3 ? (
                    <span className="text-xl">
                      {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-gray-500">{user.rank}</span>
                  )}
                </div>

                {/* Avatar et nom */}
                <div className="flex items-center gap-3 flex-1">
                  <Avatar
                    src={user.avatar_url}
                    stageName={user.stage_name}
                    size={40}
                  />
                  <div>
                    <div className="font-medium">{user.stage_name}</div>
                    <div className="text-sm text-gray-500">
                      {user.points_earned} pts cette semaine
                    </div>
                  </div>
                </div>

                {/* Badge et points totaux */}
                <div className="flex items-center gap-2">
                  <RankBadge points={user.points} />
                  <div className="text-sm font-medium text-gray-700">
                    {user.points} pts
                  </div>
                </div>
              </Link>
            ))}

            {rankings.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucun utilisateur classé cette semaine
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar droite pour suggestions futures */}
        <div className="hidden xl:block w-[300px]"></div>
      </div>
    </div>
  );
}
