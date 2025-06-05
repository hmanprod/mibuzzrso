'use server';

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
        media_url,
        media_type,
        duration,
        media_public_id,
        media_cover_url,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (mediaError) throw mediaError;
    if (!media?.length) return { media: [], hasMore: false as const, error: null as string | null };

    // Fetch profile information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url, pseudo_url')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Transform the data to match Media type
    const transformedMedia = media.map(item => ({
      id: item.id,
      title: item.title || '',
      media_url: item.media_url,
      media_type: item.media_type,
      duration: item.duration || 0,
      media_public_id: item.media_public_id,
      media_cover_url: item.media_cover_url,
      created_at: item.created_at,
      profile: {
        id: profile.id,
        stage_name: profile.stage_name || '',
        avatar_url: profile.avatar_url || '',
        pseudo_url: profile.pseudo_url || ''
      },
      likes: 0, // Par défaut pour mes médias
      is_liked: false,
      is_followed: false
    }));

    return {
      media: transformedMedia,
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
