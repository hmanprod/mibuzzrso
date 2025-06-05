'use server';

import { createClient } from '@/lib/supabase/server';
import { Post } from '@/types/database';

export async function searchMyPosts(
  page: number,
  itemsPerPage: number,
  query: string
): Promise<Post[]> {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return [];
  }

  // Calculer l'offset pour la pagination
  const offset = (page - 1) * itemsPerPage;

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:profiles!posts_user_id_fkey (
        id,
        avatar_url,
        stage_name,
        first_name,
        last_name
      ),
      medias (
        id,
        url,
        duration,
        type
      ),
      interactions (
        type,
        user_id
      )
    `)
    .eq('user_id', session.user.id)
    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .range(offset, offset + itemsPerPage - 1);

  if (error) {
    console.error('Error searching posts:', error);
    return [];
  }

  return posts || [];
}
