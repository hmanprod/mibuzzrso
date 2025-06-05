'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchSubscriptionPosts(query: string) {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return [];
  }

  // D'abord, récupérer les IDs des utilisateurs suivis
  const { data: follows } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', session.user.id);

  if (!follows || follows.length === 0) {
    return [];
  }

  const followedIds = follows.map(f => f.followed_id);

  // Ensuite, rechercher les posts de ces utilisateurs
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
    .in('user_id', followedIds)
    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching subscription posts:', error);
    return [];
  }

  return posts || [];
}
