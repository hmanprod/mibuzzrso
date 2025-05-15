'use server';

import { Media } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

export async function getMyMedia() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Not authenticated');

    
    // Get user's media
    // Fetch user's media
    const { data: media, error: mediaError } = await supabase
      .from('medias')
      .select(`
        id,
        title,
        description,
        media_url,
        media_type,
        media_cover_url,
        media_public_id,
        created_at,
        updated_at,
        user_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (mediaError) throw mediaError;
    if (!media?.length) return { media: [], hasMore: false as const, error: null as string | null };

    // Fetch profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stage_name')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Transform the data to match Media type
    const transformedMedia = media.map(item => ({
      ...item,
      author: profile?.stage_name || 'Unknown'
    }));

    return {
      media: transformedMedia as Media[],
      hasMore: false as const, // Pour l'instant, pas de pagination
      error: null as string | null
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      media: [],
      error: error instanceof Error ? error.message : 'Une erreur est survenue'
    };
  }
}
