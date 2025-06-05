'use server';

import { createClient } from '@/lib/supabase/server';
import { Media } from '@/types/database';

interface FetchMediasResponse {
  medias?: Media[];
  total?: number;
  page: number;
  limit: number;
  error?: string;
}

type MediaType = 'audio' | 'video';

interface FetchMediasParams {
  page?: number;
  limit?: number;
  mediaType?: MediaType;
  searchTerm?: string;
}

export async function fetchMedias({

  page = 1,
  limit = 10,
  mediaType,
  searchTerm
}: FetchMediasParams = {}): Promise<FetchMediasResponse> {

  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: mediasData, error } = await supabase
      .rpc('get_medias', {
        // Cast mediaType to media_type enum type
        p_media_type: mediaType as MediaType,
        p_current_user_id: user?.id,
        p_search_term: searchTerm,
        p_page: page,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching medias:', error);
      return { error: 'Failed to load medias', page, limit };
    }

    if (!mediasData) {
      return { medias: [], total: 0, page, limit };
    }

    

    // Get total count for pagination
    const { count: total } = await supabase
      .from('medias')
      .select('*', { count: 'exact', head: true })
      .eq('media_type', mediaType || 'audio');

    return {
      medias: mediasData,
      total: total || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error in fetchMedias:', error);
    return { error: 'An unexpected error occurred', page, limit };
  }
}

export async function searchMedias(page: number = 1, limit: number = 10, searchTerm?: string): Promise<FetchMediasResponse> {
  if (!searchTerm || searchTerm.trim() === '') {
    return { medias: [], total: 0, page, limit };
  }
  
  return fetchMedias({
    page,
    limit,
    searchTerm
  });
}
