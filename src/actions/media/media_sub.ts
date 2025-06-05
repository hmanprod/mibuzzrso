'use server';

import { createClient } from '@/lib/supabase/server';
import { Media } from '@/types/database';

export async function searchSubscriptionMedias(
  page: number,
  itemsPerPage: number,
  query: string
): Promise<{ medias: Media[], error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { medias: [], error: 'Non authentifié' };
    }

    // D'abord, récupérer les IDs des utilisateurs suivis
    const { data: follows } = await supabase
      .from('follows')
      .select('followed_id')
      .eq('follower_id', session.user.id);

    if (!follows || follows.length === 0) {
      return { medias: [] };
    }

    const followedIds = follows.map(f => f.followed_id);

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * itemsPerPage;

    const { data: medias, error } = await supabase
      .from('medias')
      .select(`
        *,
        post:posts!medias_post_id_fkey (
          id,
          user_id,
          title,
          content
        )
      `)
      .in('posts.user_id', followedIds)
      .or(`posts.title.ilike.%${query}%, posts.content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (error) {
      console.error('Error searching medias:', error);
      return { medias: [], error: 'Erreur lors de la recherche' };
    }

    return { medias: medias || [] };
  } catch (err) {
    console.error('Error in searchSubscriptionMedias:', err);
    return { medias: [], error: 'Erreur serveur' };
  }
}
