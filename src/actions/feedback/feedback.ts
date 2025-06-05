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
    // Get current user for like status
    const { data: { user } } = await supabase.auth.getUser();
    
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
    
    // Get all likes for these posts
    const postIds = posts.map(post => post.id);
    const { data: likesData, error: likesError } = await supabase
      .from('interactions')
      .select('post_id')
      .in('post_id', postIds)
      .eq('type', 'like');
      
    if (likesError) {
      console.error('Error fetching likes:', likesError);
      // Continue without likes data
    }
    
    // Get comments count for each post
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds);
      
    if (commentsError) {
      console.error('Error fetching comments count:', commentsError);
      // Continue without comments data
    }
    
    // Count likes for each post
    const likesCount: Record<string, number> = {};
    if (likesData) {
      likesData.forEach((like: { post_id: string }) => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
    }
    
    // Count comments for each post
    const commentsCount: Record<string, number> = {};
    if (commentsData) {
      commentsData.forEach((comment: { post_id: string }) => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });
    }
    
    // Get user's likes if logged in
    let userLikes: Record<string, boolean> = {};
    if (user) {
      const { data: userLikesData, error: userLikesError } = await supabase
        .from('interactions')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', user.id)
        .eq('type', 'like');
        
      if (!userLikesError && userLikesData) {
        userLikes = userLikesData.reduce((acc: Record<string, boolean>, like: { post_id: string }) => {
          acc[like.post_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Assembler les données
    const feedbacks = posts.map(post => {
      return {
        ...post,
        profile: profiles.find(profile => profile.id === post.user_id),
        likes: likesCount[post.id] || 0,
        is_liked: userLikes[post.id] || false,
        comments_count: commentsCount[post.id] || 0
      };
    });

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

    // console.log("post", postData);
    
      
    if (postError) throw postError;
    
    // Revalider la page des feedbacks
    revalidatePath('/feedbacks');
    
    return { success: true, postId: postData.id };
  } catch (error) {
    console.error('Error creating feedback:', error);
    return { success: false, error: 'Failed to create feedback' };
  }
}
