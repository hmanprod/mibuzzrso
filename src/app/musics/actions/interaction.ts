'use server';

import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';

type InteractionQueryResult = {
  data: Interaction | null;
  error: PostgrestError | null;
};

type LikeStatusResult = {
  data: { like_count: number; is_liked: boolean }[] | null;
  error: PostgrestError | null;
};


type InteractionType = 'like' | 'share' | 'save' | 'comment_like' | 'read' | 'comment';

interface Interaction {
  id: string;
  user_id: string;
  media_id: string;
  type: InteractionType;
  created_at: string;
}

type LikeResponse = {
  error?: string;
  liked?: boolean;
};

type LikesInfoResponse = {
  count: number;
  isLiked: boolean;
  error?: string;
};

export async function toggleMediaLike(mediaId: string): Promise<LikeResponse> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: 'Authentication required' };
  }
  try {

    // Check if the user has already liked this media
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('interactions')
      .select('*')
      .eq('media_id', mediaId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .maybeSingle() as InteractionQueryResult;

    if (existingLikeError) {
      console.error('Error checking existing like:', existingLikeError);
      return { error: 'Failed to check existing like' };
    }

    if (existingLike) {
      // Unlike: Delete the existing like
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return { error: 'Failed to remove like' };
      }

      return { liked: false };
    } else {
      // Like: Create a new like
      const { error: insertError } = await supabase
        .from('interactions')
        .insert(
          {
            user_id: user.id,
            media_id: mediaId,
            post_id: null,
            comment_id: null,
            type: 'like'
          }
        );

      if (insertError) {
        console.error('Error adding like:', insertError);
        return { error: 'Failed to add like' };
      }

      return { liked: true };
    }
  } catch (error) {
    console.error('Error in toggleMediaLike:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getMediaLikes(mediaId: string): Promise<LikesInfoResponse> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  try {
    const { data, error } = await supabase
      .rpc('get_media_like_status', {
        p_media_id: mediaId,
        p_user_id: userId || null
      }) as LikeStatusResult;

    if (error || !data || data.length === 0) {
      console.error('Error getting like status:', error);
      return { count: 0, isLiked: false, error: 'Failed to get like status' };
    }

    // La fonction retourne toujours exactement une ligne
    const { like_count, is_liked } = data[0];

    return {
      count: like_count,
      isLiked: is_liked
    };
  } catch (error) {
    console.error('Error in getMediaLikes:', error);
    return { count: 0, isLiked: false, error: 'An unexpected error occurred' };
  }
}
