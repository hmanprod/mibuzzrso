'use server';

import { createClient } from '@/lib/supabase/server';
import { Media } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

type MediaWithLikes = Media & {
  likes_count: number;
  is_liked: boolean;
  total_count: number;
};

type MediaQueryResult = {
  data: MediaWithLikes[] | null;
  error: PostgrestError | null;
};

export type MediaResponse = {
  media: Media[];
  total: number;
  hasMore: boolean;
  error: string | null;
};

export async function getLikedMedia(limit = 12, page = 1): Promise<MediaResponse> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    // Get liked media
    const { data: mediaData, error } = await supabase
      .rpc('get_liked_media', {
        p_current_user_id: user.id,
        p_limit: limit,
        p_offset: offset
      }) as MediaQueryResult;

    if (error) throw error;

    if (!mediaData || mediaData.length === 0) {
      return { media: [], total: 0, hasMore: false, error: null };
    }

    // Get total count from first item
    const total = mediaData.length > 0 ? mediaData[0].total_count : 0;

    // Clean media data
    const cleanedMediaData = mediaData.map(({  ...rest }) => rest);

    return {
      media: cleanedMediaData,
      total,
      hasMore: total > (page * limit),
      error: null
    };
  } catch (error) {
    console.error('Error in getLikedMedia:', error);
    return {
      media: [],
      total: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    };
  }
}
