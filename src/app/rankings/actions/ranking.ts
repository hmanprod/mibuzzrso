'use server';

import { createClient } from '@/lib/supabase/server';

export interface WeeklyPointsRecord {
  user_id: string;
  points_change: number;
  profiles: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
    points: number;
  };
}

export interface RankingUser {
  id: string;
  stage_name: string;
  avatar_url: string | null;
  points: number;
  points_earned: number;
  rank: number;
}

export async function getWeeklyRankings() {
  const supabase = await createClient();

  const { data: rankings, error } = await supabase
    .from('weekly_rankings_view')
    .select('*')
    .order('rank', { ascending: true })
    .throwOnError();

    console.log("the ranking is ", rankings)

  if (error) {
    console.error('Error fetching rankings:', error);
    return { error: 'Failed to fetch rankings' };
  }

  // Transformer les données pour correspondre à l'interface RankingUser
  const formattedRankings = rankings?.map(user => ({
    id: user.user_id,
    stage_name: user.stage_name,
    avatar_url: user.avatar_url,
    points: user.total_points,
    points_earned: user.points_earned,
    rank: user.rank
  })) || [];

  return { data: formattedRankings };
}
