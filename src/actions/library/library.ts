'use server';

import { createClient } from '@/lib/supabase/server';
import { Media } from '@/types/database';
import { PostgrestError } from '@supabase/supabase-js';

type DbMedia = {
  id: string;
  created_at: string;
  title: string;
  media_url: string;
  media_type: string;
  duration: string;
  media_public_id: string;
  media_cover_url: string;
  user_id: string;
  profile: {
    id: string;
    stage_name: string;
    avatar_url: string;
    pseudo_url: string;
  };
  likes: number;
  is_liked: boolean;
  is_followed: boolean;
  total_count: number;
};

type MediaQueryResult = {
  data: DbMedia[] | null;
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

      // console.log("mediaData", mediaData);
    if (error) {
      console.error('Error fetching media:', error);
      return { media: [], total: 0, hasMore: false, error: 'Failed to load media' };
    }

    if (!mediaData || mediaData.length === 0) {
      return { media: [], total: 0, hasMore: false, error: null };
    }

    // Get the first item to get total_count
    const total = mediaData.length > 0 ? mediaData[0].total_count : 0;

    // Transform the data to match the Media type
    const cleanedMediaData = mediaData.map((item) => ({
      id: item.id,
      created_at: item.created_at,
      title: item.title,
      media_url: item.media_url,
      media_type: item.media_type,
      duration: parseFloat(item.duration),
      media_public_id: item.media_public_id,
      media_cover_url: item.media_cover_url,
      user_id: item.user_id,
      likes: item.likes,
      is_liked: item.is_liked,
      is_followed: item.is_followed,
      profile: item.profile
    })) as Media[];

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

export async function getUserMediaLibrary(limit = 12, page = 1): Promise<MediaResponse> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { media: [], total: 0, hasMore: false, error: 'Non authentifié' };
    }

    // Call the get_user_media_with_likes function
    const { data: mediaData, error } = await supabase
      .rpc('get_user_media_with_likes', {
        p_current_user_id: user.id,
        p_limit: limit,
        p_offset: offset
      }) as MediaQueryResult;

    if (error) {
      console.error('Error fetching user media:', error);
      return { media: [], total: 0, hasMore: false, error: 'Failed to load media' };
    }

    if (!mediaData || mediaData.length === 0) {
      return { media: [], total: 0, hasMore: false, error: null };
    }

    // Get the first item to get total_count
    const total = mediaData[0]?.total_count || 0;

    // Transform the data to match the Media type
    const cleanedMediaData = mediaData.map((item) => ({
      id: item.id,
      created_at: item.created_at,
      title: item.title,
      media_url: item.media_url,
      media_type: item.media_type,
      duration: parseFloat(item.duration),
      media_public_id: item.media_public_id,
      media_cover_url: item.media_cover_url,
      user_id: item.user_id,
      likes: item.likes,
      is_liked: item.is_liked,
      is_followed: item.is_followed,
      profile: item.profile
    })) as Media[];

    return {
      media: cleanedMediaData,
      total,
      hasMore: total > (page * limit),
      error: null
    };
  } catch (error) {
    console.error('Error in getUserMediaLibrary:', error);
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

    // Transform the data to match the Media type
    const cleanedMediaData = mediaData.map((item) => ({
      id: item.id,
      created_at: item.created_at,
      title: item.title,
      media_url: item.media_url,
      media_type: item.media_type,
      duration: parseFloat(item.duration),
      media_public_id: item.media_public_id,
      media_cover_url: item.media_cover_url,
      user_id: item.user_id,
      likes: item.likes,
      is_liked: item.is_liked,
      is_followed: item.is_followed,
      profile: item.profile
    })) as Media[];

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
