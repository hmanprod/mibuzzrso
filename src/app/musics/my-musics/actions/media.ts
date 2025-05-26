'use server';

import { createClient } from '@/lib/supabase/server';
import { Media } from '@/types/database';
import { PostgrestError } from '@/types/supabase';

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

export async function searchMyMedia(
  page: number,
  itemsPerPage: number,
  query: string
): Promise<{ medias: Media[], error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { medias: [], error: 'Non authentifié' };
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * itemsPerPage;

    const { data: mediaData, error } = await supabase
      .rpc('get_user_media_with_likes_and_keywords', {
        p_current_user_id: user.id,
        p_keywords: query,
        p_limit: itemsPerPage,
        p_offset: offset
      }) as { data: DbMedia[] | null, error: PostgrestError | null };

    if (error) {
      console.error('Error searching medias:', error);
      return { medias: [], error: 'Erreur lors de la recherche' };
    }

    if (!mediaData || mediaData.length === 0) {
      return { medias: [], error: undefined };
    }

    // Transform the data to match the Media type
    const medias = mediaData.map((item) => ({
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

    return { medias };
  } catch (err) {
    console.error('Error in searchMyMedia:', err);
    return { medias: [], error: 'Erreur serveur' };
  }
}
