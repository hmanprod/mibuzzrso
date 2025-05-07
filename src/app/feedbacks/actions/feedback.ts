'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateFeedbackData {
  description: string;
  content?: string | null;
  userId: string;
}

export async function getFeedbacks(page: number = 1, limit: number = 10) {
  const supabase = await createClient();

  try {
    // Calculer l'offset pour la pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Récupérer les posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('post_type', 'feedback')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (postsError) {
      console.error('Error fetching feedbacks:', postsError);
      return { error: 'Failed to load feedbacks' };
    }

    if (!posts?.length) {
      return {
        posts: [],
        total: 0,
        page,
        limit
      };
    }

    // Récupérer les profils pour ces posts
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url')
      .in('id', posts.map(post => post.user_id));

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { error: 'Failed to load profiles' };
    }

    // Assembler les données
    const feedbacks = posts.map(post => ({
      ...post,
      profile: profiles.find(profile => profile.id === post.user_id)
    }));

    return {
      posts: feedbacks,
      total: posts.length,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in getFeedbacks:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function createFeedbackPost(data: CreateFeedbackData) {
  const supabase = await createClient();
  
  try {
    // Créer le post de feedback
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        content: data.description,
        post_type: 'feedback',
        user_id: data.userId
      })
      .select()
      .single();

    console.log("post", postData);
    
      
    if (postError) throw postError;
    
    // Revalider la page des feedbacks
    revalidatePath('/feedbacks');
    
    return { success: true, postId: postData.id };
  } catch (error) {
    console.error('Error creating feedback:', error);
    return { success: false, error: 'Failed to create feedback' };
  }
}
