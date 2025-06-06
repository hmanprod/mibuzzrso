'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface VoteData {
  challengeId: string;
  participationId: string;
  voterId: string;
  points: number;
}

export interface JuryVoteData {
  challengeId: string;
  participationId: string;
  voterId: string;
  criteria: {
    technique: number;
    originalite: number;
    interpretation: number;
    overall: number;
  };
}

/**
 * Vote pour une participation à un challenge
 * @param data Les données du vote
 * @returns Object contenant le vote ou une erreur
 */
export async function voteForParticipation(data: VoteData) {
  const supabase = await createClient();
  
  try {
    // Vérifier si l'utilisateur a déjà voté
    const { data: existingVote, error: checkError } = await supabase
      .from('challenge_votes')
      .select('id')
      .eq('voter_id', data.voterId)
      .eq('participation_id', data.participationId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingVote) {
      return { 
        success: false, 
        error: 'Vous avez déjà voté pour cette participation' 
      };
    }

    // Créer le vote
    const { data: vote, error: voteError } = await supabase
      .from('challenge_votes')
      .insert([
        {
          challenge_id: data.challengeId,
          participation_id: data.participationId,
          voter_id: data.voterId,
          points: data.points,
        },
      ])
      .select()
      .single();

    if (voteError) throw voteError;

    // Revalider la page pour mettre à jour l'UI
    revalidatePath(`/feed/challenge/${data.challengeId}`);

    return { success: true, vote };
  } catch (error) {
    console.error('Error voting for participation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to vote' 
    };
  }
}

/**
 * Récupérer les votes d'une participation
 * @param participationId L'ID de la participation
 * @returns Les votes de la participation
 */
export async function getParticipationVotes(participationId: string) {
  const supabase = await createClient();

  try {
    const { data: votes, error } = await supabase
      .from('challenge_votes')
      .select(`
        *,
        voter:voter_id (id, email),
        profile:voter_id (id, username, stage_name, avatar_url)
      `)
      .eq('participation_id', participationId);

    if (error) throw error;

    return { votes, error: null };
  } catch (error) {
    console.error('Error fetching participation votes:', error);
    return { votes: null, error: 'Failed to fetch votes' };
  }
}

/**
 * Récupérer les votes d'un challenge avec les statistiques
 * @param challengeId L'ID du challenge
 * @returns Les statistiques de votes pour chaque participation
 */
export async function getChallengeVotes(challengeId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .rpc('get_challenge_votes', { _challenge_id: challengeId });

    if (error) throw error;

    return { votes: data, error: null };
  } catch (error) {
    console.error('Error fetching challenge votes:', error);
    return { votes: null, error: 'Failed to fetch votes' };
  }
}

/**
 * Vote en tant que jury pour une participation
 * @param data Les données du vote jury
 * @returns Object contenant le vote ou une erreur
 */
export async function voteAsJury(data: JuryVoteData) {
  const supabase = await createClient();
  
  try {
    // Vérifier si l'utilisateur est bien jury pour ce challenge
    const { data: isJury, error: juryCheckError } = await supabase
      .from('challenge_jury')
      .select('id')
      .eq('challenge_id', data.challengeId)
      .eq('user_id', data.voterId)
      .single();

    if (juryCheckError || !isJury) {
      throw new Error('Vous n\'\u00eates pas jury pour ce challenge');
    }

    // Vérifier si le jury a déjà voté
    const { data: existingVote, error: checkError } = await supabase
      .from('challenge_votes')
      .select('id')
      .eq('voter_id', data.voterId)
      .eq('participation_id', data.participationId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingVote) {
      return { 
        success: false, 
        error: 'Vous avez déjà voté pour cette participation' 
      };
    }

    // Créer le vote jury
    const { data: vote, error: voteError } = await supabase
      .from('challenge_votes')
      .insert([{
        challenge_id: data.challengeId,
        participation_id: data.participationId,
        voter_id: data.voterId,
        vote_type: 'jury',
        points: data.criteria.overall,
        technique_points: data.criteria.technique,
        originalite_points: data.criteria.originalite,
        interpretation_points: data.criteria.interpretation
      }])
      .select()
      .single();

    if (voteError) throw voteError;

    // Revalider la page
    revalidatePath(`/feed/challenge/${data.challengeId}`);

    return { success: true, vote };
  } catch (error) {
    console.error('Error voting as jury:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to vote as jury' 
    };
  }
}
