'use server';

import { createClient } from '@/lib/supabase/server';

// async function updateWeeklyRanking(userId: string, points: number) {
//   const supabase = await createClient();
  
//   try {
//     const { error } = await supabase
//       .rpc('update_user_weekly_ranking', {
//         p_user_id: userId,
//         p_points: points
//       });
      
//     if (error) throw error;
//   } catch (error) {
//     console.error('Error updating weekly ranking:', error);
//   }
// }

export async function addPointsForLike(mediaId: string) {
  const supabase = await createClient();
  
  try {
    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .rpc('add_points_for_like', {
        p_media_id: mediaId,
        p_user_id: user.id
      });
      
    if (error) throw error;
    
    // Mettre à jour le classement avec les points fixes (2 points pour un like)
    // await updateWeeklyRanking(user.id, 2);
    
    return { success: true };
  } catch (error) {
    console.error('Error adding points for like:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

export async function addPointsForMedia(mediaId: string) {
  const supabase = await createClient();

  console.log("the media id is ", mediaId);
  
  try {
    // Récupérer l'ID de l'utilisateur qui a posté le media
    const { error: mediaError } = await supabase
      .from('medias')
      .select('user_id')
      .eq('id', mediaId)
      .single();
      
    if (mediaError) throw mediaError;
    
    const { error } = await supabase
      .rpc('add_points_for_media', {
        p_media_id: mediaId
      });


    if (error) throw error;
    
    // Rafraîchir directement les classements
    const { error: refreshError } = await supabase
      .rpc('refresh_weekly_rankings');

    if (refreshError) {
      console.error("Error refreshing rankings:", refreshError);
      throw refreshError;
    }
      
    
    
    // // Mettre à jour le classement avec les points fixes (5 points pour un media)
    // if (mediaData?.user_id) {
    //   await updateWeeklyRanking(mediaData.user_id, 5);
    // }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding points for media:', error);
    return { success: false, error: 'Failed to add points' };
  }
}

export async function addPointsForComment(commentId: string) {
  const supabase = await createClient();
  
  try {
    // Récupérer l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    interface CommentWithMedia {
      media: {
        user_id: string
      }
    }

    // Récupérer l'ID du propriétaire du media
    const { error: commentError } = await supabase
      .from('comments')
      .select('media:medias(user_id)')
      .eq('id', commentId)
      .single<CommentWithMedia>();
      
    if (commentError) throw commentError;
    
    // Points pour le propriétaire du média
    const { error: ownerError } = await supabase
      .rpc('add_points_for_comment', {
        p_comment_id: commentId
      });
    if (ownerError) throw ownerError;
    
    // // Mettre à jour le classement du propriétaire (3 points pour recevoir un commentaire)
    // if (commentData?.media?.user_id) {
    //   await updateWeeklyRanking(commentData.media.user_id, 3);
    // }

    // Points pour l'utilisateur qui commente
    const { error: commenterError } = await supabase
      .rpc('add_points_for_commenting', {
        p_comment_id: commentId,
        p_user_id: user.id
      });
    if (commenterError) throw commenterError;
    
    // Mettre à jour le classement du commentateur (1 point pour commenter)
    // await updateWeeklyRanking(user.id, 1);

    return { success: true };
  } catch (error) {
    console.error('Error adding points for comment:', error);
    return { success: false, error: 'Failed to add points for comment' };
  }
}

export async function addPointsForChallenge(mediaId: string, challengeId: string) {
  const supabase = await createClient();
  
  try {
    interface Media {
      user_id: string
    }

    // Récupérer l'ID de l'utilisateur qui participe au challenge
    const { error: mediaError } = await supabase
      .from('medias')
      .select('user_id')
      .eq('id', mediaId)
      .single<Media>();
      
    if (mediaError) throw mediaError;
    
    const { error } = await supabase
      .rpc('add_points_for_challenge_participation', {
        p_media_id: mediaId,
        p_challenge_id: challengeId
      });
      
    if (error) throw error;
    
    // // Mettre à jour le classement avec les points fixes (10 points pour un challenge)
    // if (mediaData?.user_id) {
    //   await updateWeeklyRanking(mediaData.user_id, 10);
    // }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding points for challenge:', error);
    return { success: false, error: 'Failed to add points' };
  }
}
