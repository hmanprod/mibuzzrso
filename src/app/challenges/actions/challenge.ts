'use server';

import { createClient } from '@/lib/supabase/server';
import { addPointsForChallenge } from '@/app/points/actions';

export async function participateInChallenge(mediaId: string, challengeId: string) {
  const supabase = await createClient();
  
  try {
    // Ajouter la participation au challenge
    const { data, error } = await supabase
      .from('challenges_medias')
      .insert({
        challenge_id: challengeId,
        media_id: mediaId
      })
      .select()
      .single();
      
    if (error) throw error;

    // Ajouter les points pour la participation
    await addPointsForChallenge(mediaId, challengeId);
    
    return { success: true, data };
  } catch (error) {
    console.error('Error participating in challenge:', error);
    return { success: false, error: 'Failed to participate in challenge' };
  }
}
