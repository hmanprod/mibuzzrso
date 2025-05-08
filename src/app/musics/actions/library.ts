import { createClient } from '@/lib/supabase/client';
import { Media } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

type MediaWithLikes = Media & {
  likes_count: number;
  is_liked?: boolean;
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

export async function getMediaLibrary(limit = 4): Promise<MediaResponse> {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Call the get_media_with_likes function
    const { data: mediaData, error } = await supabase
      .rpc('get_media_with_likes', {
        p_current_user_id: userId || null,
        p_limit: limit,
        p_offset: 0
      }) as MediaQueryResult;

    if (error) {
      console.error('Error fetching media:', error);
      return { media: [], total: 0, hasMore: false, error: 'Failed to load media' };
    }

    if (!mediaData || mediaData.length === 0) {
      return { media: [], total: 0, hasMore: false, error: null };
    }

    // Get the first item to get total_count
    const total = mediaData.length > 0 ? mediaData[0].total_count : 0;

    // Remove total_count from the media objects
    const cleanedMediaData = mediaData.map(({  ...rest }) => rest);

    return {
      media: cleanedMediaData,
      total,
      hasMore: total > limit,
      error: null
    };
  } catch (error) {
    console.error('Error in getMediaLibrary:', error);
    return {
      media: [],
      total: 0,
      hasMore: false,
      error: 'An unexpected error occurred'
    };
  }
}

export async function getMoreMedia(page: number, limit = 12): Promise<MediaResponse> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Call the get_media_with_likes function
    const { data: mediaData, error } = await supabase
      .rpc('get_media_with_likes', {
        p_current_user_id: userId || null,
        p_limit: limit,
        p_offset: offset
      }) as MediaQueryResult;

    if (error) {
      console.error('Error fetching more media:', error);
      return { media: [], total: 0, hasMore: false, error: 'Failed to load more media' };
    }

    if (!mediaData || mediaData.length === 0) {
      return { media: [], total: 0, hasMore: false, error: null };
    }

    // Get the first item to get total_count
    const total = mediaData.length > 0 ? mediaData[0].total_count : 0;

    // Remove total_count from the media objects
    const cleanedMediaData = mediaData.map(({ ...rest }) => rest);

    return {
      media: cleanedMediaData,
      total,
      hasMore: total > ((page) * limit),
      error: null
    };
  } catch (error) {
    console.error('Error in getMoreMedia:', error);
    return {
      media: [],
      total: 0,
      hasMore: false,
      error: 'An unexpected error occurred'
    };
  }
}
