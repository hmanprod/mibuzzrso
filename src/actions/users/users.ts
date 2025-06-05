'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchUsers(query: string) {
  const supabase = await createClient();

  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url, pseudo_url, first_name, last_name')
      .or([
        `stage_name.ilike.%${query}%`,
        `pseudo_url.ilike.%${query}%`,
        `first_name.ilike.%${query}%`,
        `last_name.ilike.%${query}%`
      ].join(','))
      .limit(10);

    console.log(users);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return users;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}
