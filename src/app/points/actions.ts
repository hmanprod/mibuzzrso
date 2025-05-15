'use server';

import { createClient } from '@/lib/supabase/server';

export async function addPointsForLike(mediaId: string) {
  const supabase = await createClient();
  
  try {
    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {  error } = await supabase
      .rpc('add_points_for_like', {
        p_media_id: mediaId,
        p_user_id: user.id
      });
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding points for like:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

export async function addPointsForMedia(mediaId: string) {
  const supabase = await createClient();
  
  try {
    const {  error } = await supabase
      .rpc('add_points_for_media', {
        p_media_id: mediaId
      });
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding points for media:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

export async function addPointsForComment(commentId: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .rpc('add_points_for_comment', {
        p_comment_id: commentId
      });
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding points for media:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

export async function addPointsForChallenge(mediaId: string, challengeId: string) {
  const supabase = await createClient();
  
  try {
    const {  error } = await supabase
      .rpc('add_points_for_challenge_participation', {
        p_media_id: mediaId,
        p_challenge_id: challengeId
      });
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error adding points for challenge:', error);
    return { success: false, error: 'Failed to add points' };
  }
}
