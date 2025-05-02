'use server'

import { createClient } from '@/lib/supabase/server'
import { Media } from '@/types/database';
import { revalidatePath } from 'next/cache'

export interface Challenge {
  id: string;
  title: string;
  description: string;
  description_short: string;
  status: 'draft' | 'active' | 'completed';
  type: 'remix' | 'live_mix';
  end_at: string;
  winner_uid?: string;
  winner_displayname?: string;
  participants_count: number;
  winning_prize?: string;
  visual_url?: string;
  youtube_iframe?: string;
  medias: Media[];
  created_at: string;
  updated_at: string;
}

export async function getChallenges(page: number = 1, limit: number = 5, status: 'active' | 'completed' | 'all' = 'active') {
  const supabase = await createClient();

  try {
    let query = supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Error fetching challenges:', error);
      return { error: 'Failed to load challenges' };
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting challenges count:', countError);
    }

    return {
      challenges,
      total: count || 0,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in getChallenges:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getChallenge(id: string) {
  const supabase = await createClient();
  console.log('Fetching challenge with ID:', id);

  try {
    // 1. Récupérer le challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeError) {
      console.error('Error fetching challenge:', challengeError);
      return { error: 'Failed to load challenge', details: challengeError };
    }

    if (!challenge) {
      return { error: 'Challenge not found' };
    }

    // 2. Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', challenge.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // On continue même si on ne trouve pas le profil
    }

    // Combiner les données
    return {
      challenge: {
        ...challenge,
        creator: {
          id: challenge.user_id,
          profile: profile || null
        }
      }
    };
  } catch (error) {
    console.error('Error in getChallenge:', error);
    return { error: 'An unexpected error occurred' };
  }
}

interface ChallengeMedia {
  id: string;
  position: number;
  media: {
    id: string;
    media_type: 'audio' | 'video';
    media_url: string;
    media_cover_url?: string;
    media_public_id: string;
    duration?: number;
    title?: string;
    description?: string;
    user_id: string;
    created_at: string;
    updated_at: string;
  };
  comments?: Array<{
    id: string;
    timestamp: number;
    content: string;
    author: {
      id: string;
      stage_name: string;
      avatar_url: string | null;
      username: string;
    };
  }>;
}

interface ChallengeMediasResponse {
  medias?: ChallengeMedia[];
  error?: string;
  details?: {
    code?: string;
    message?: string;
    hint?: string;
  };
}

export async function getChallengeMedias(challengeId: string): Promise<ChallengeMediasResponse> {
  const supabase = await createClient();
  console.log('Fetching medias for challenge:', challengeId);

  try {
    const { data: rawMedias, error } = await supabase
      .from('challenges_medias')
      .select(`
        id,
        position,
        media:medias!inner(
          id,
          media_type,
          media_url,
          media_cover_url,
          media_public_id,
          duration,
          title,
          description,
          user_id,
          created_at,
          updated_at
        ),
        comments:media_comments(
          id,
          timestamp,
          content,
          author:profiles!inner(
            id,
            stage_name,
            avatar_url,
            username
          )
        )
      `)
      .eq('challenge_id', challengeId)
      .order('position');
      
    // Transformer les données pour avoir le bon format
    const medias = rawMedias?.map(item => {
      const mediaData = Array.isArray(item.media) ? item.media[0] : item.media;
      const commentsData = item.comments?.map(comment => {
        const authorData = Array.isArray(comment.author) ? comment.author[0] : comment.author;
        return {
          id: comment.id,
          timestamp: comment.timestamp,
          content: comment.content,
          author: {
            id: authorData.id,
            stage_name: authorData.stage_name,
            avatar_url: authorData.avatar_url,
            username: authorData.username
          }
        };
      });

      return {
        id: item.id,
        position: item.position,
        media: {
          id: mediaData.id,
          media_type: mediaData.media_type as 'audio' | 'video',
          media_url: mediaData.media_url,
          media_cover_url: mediaData.media_cover_url,
          media_public_id: mediaData.media_public_id,
          duration: mediaData.duration,
          title: mediaData.title,
          description: mediaData.description,
          user_id: mediaData.user_id,
          created_at: mediaData.created_at,
          updated_at: mediaData.updated_at
        },
        comments: commentsData
      };
    }) as ChallengeMedia[];

    if (error) {
      console.error('Error fetching challenge medias:', error);
      return { error: 'Failed to load challenge medias', details: error };
    }

    return { medias: medias as ChallengeMedia[] };
  } catch (error) {
    console.error('Error in getChallengeMedias:', error);
    return { error: 'An unexpected error occurred' };
  }
}

interface CreateChallengeInput {
  title: string;
  description: string;
  type: 'remix' | 'live_mix';
  endAt: string;
  winningPrize?: string;
  userId: string;
  medias: Array<{
    url: string;
    publicId: string;
    mediaType: 'audio' | 'video';
    duration?: number;
  }>;
}

export async function createChallenge(input: CreateChallengeInput) {
  const supabase = await createClient();

  try {
    // 1. Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .insert({
        title: input.title,
        description: input.description,
        type: input.type,
        status: 'active',
        end_at: input.endAt,
        winning_prize: input.winningPrize,
        user_id: input.userId,
        participants_count: 0
      })
      .select()
      .single();

    if (challengeError) {
      console.error('Database error creating challenge:', challengeError);
      return { 
        success: false, 
        error: challengeError.message,
        details: {
          code: challengeError.code,
          hint: challengeError.hint,
          details: challengeError.details
        }
      };
    }

    // 2. Create medias
    const { data: medias, error: mediasError } = await supabase
      .from('medias')
      .insert(
        input.medias.map(media => ({
          media_type: media.mediaType,
          media_url: media.url,
          media_public_id: media.publicId,
          duration: media.duration,
          user_id: input.userId
        }))
      )
      .select();

    if (mediasError) {
      console.error('Database error creating medias:', mediasError);
      return { 
        success: false, 
        error: mediasError.message,
        details: {
          code: mediasError.code,
          hint: mediasError.hint,
          details: mediasError.details
        }
      };
    }

    // 3. Link medias to challenge
    const { error: linkError } = await supabase
      .from('challenges_medias')
      .insert(
        medias.map((media, index) => ({
          challenge_id: challenge.id,
          media_id: media.id,
          position: index
        }))
      );

    if (linkError) {
      console.error('Database error linking medias:', linkError);
      return { 
        success: false, 
        error: linkError.message,
        details: {
          code: linkError.code,
          hint: linkError.hint,
          details: linkError.details
        }
      };
    }

    revalidatePath('/feed/challenges');
    return { success: true, challenge };
  } catch (error) {
    console.error('Error creating challenge:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create challenge';
    return { 
      success: false, 
      error: errorMessage,
      details: error
    };
  }
}

export async function participateInChallenge(challengeId: string, userId: string) {
  const supabase = await createClient();

  try {
    // Verify challenge is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('status')
      .eq('id', challengeId)
      .single();

    if (challengeError) {
      throw challengeError;
    }

    if (challenge.status !== 'active') {
      return { error: 'This challenge is not active' };
    }

    // Create participation record
    const { error: participationError } = await supabase
      .from('challenge_participations')
      .insert({
        challenge_id: challengeId,
        user_id: userId
      });

    if (participationError) {
      throw participationError;
    }

    // Increment participants count
    const { error: updateError } = await supabase.rpc('increment_challenge_participants', {
      p_challenge_id: challengeId
    });

    if (updateError) {
      throw updateError;
    }

    revalidatePath('/feed/challenges');
    return { success: true };
  } catch (error) {
    console.error('Error participating in challenge:', error);
    return { error: 'Failed to participate in challenge' };
  }
}
