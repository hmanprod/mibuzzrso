'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'


interface CreatePostData {
  type?: 'post' | 'feedback';
  mediaType: 'audio' | 'video';
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  duration: number | null;
  content: string | null;
  userId: string;
}

/**
 * Unified function to fetch posts with various filters
 * @param options Configuration options for fetching posts
 * @returns Object containing posts array and pagination info
 */
export async function fetchPosts({
  page = 1,
  limit = 10,
  postType = 'post',
  profileId = null,
  likedOnly = false,
  mediaType = null,
  searchTerm = null
}: {
  page?: number;
  limit?: number;
  postType?: 'post' | 'challenge' | 'feedback';
  profileId?: string | null;
  likedOnly?: boolean;
  mediaType?: 'audio' | 'video' | null;
  searchTerm?: string | null;
}) {
  const supabase = await createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Call the unified get_posts function
    const { data: postsData, error } = await supabase
      .rpc('get_posts', {
        p_current_user_id: userId || null,
        p_profile_id: profileId,
        p_post_type: postType,
        p_liked_only: likedOnly,
        p_media_type: mediaType,
        p_search_term: searchTerm,
        p_page: page,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching posts:', error);
      return { error: 'Failed to load posts' };
    }

    if (!postsData || postsData.length === 0) {
      return { posts: [], total: 0, page, limit };
    }

    // Get total count for pagination
    let total = 0;
    
    if (likedOnly && userId) {
      // Count total liked posts
      const { count, error: countError } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'like');
      
      if (!countError) {
        total = count || 0;
      }
    } else if (profileId) {
      // Count total profile posts
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);
      
      if (!countError) {
        total = count || 0;
      }
    } else if (searchTerm) {
      // For search, we don't have an exact count, so use the length
      total = postsData.length;
    } else {
      // Count total posts for feed
      const { count, error: countError } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        total = count || 0;
      }
    }

    return {
      posts: postsData,
      total,
      page,
      limit
    };
  } catch (error) {
    console.error('Error in fetchPosts:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getPosts(page: number = 1, limit: number = 5, postType: 'post' | 'challenge' | 'feedback' = 'post') {
  return fetchPosts({ page, limit, postType });
}

export async function getProfilePosts(profileId: string, mediaType: 'audio' | 'video' | 'all' = 'all', page: number = 1, limit: number = 5) {
  const mediaTypeParam = mediaType === 'all' ? null : mediaType;
  const result = await fetchPosts({ 
    page, 
    limit,
    profileId, 
    mediaType: mediaTypeParam 
  });
  
  // Format the return value to match the expected structure
  if (result.error) {
    return { error: result.error };
  }
  
  return { 
    posts: result.posts, 
    pagination: { 
      page: result.page, 
      limit: result.limit, 
      total: result.total 
    } 
  };
}

export async function searchPosts(page: number = 1, limit: number = 5, searchTerm?: string) {
  if (!searchTerm || searchTerm.trim() === '') {
    return { posts: [], total: 0, page, limit };
  }
  
  return fetchPosts({
    page,
    limit,
    searchTerm
  });
}

export async function getLikedPosts(page: number = 1, limit: number = 5) {
  return fetchPosts({
    page,
    limit,
    likedOnly: true
  });
}

export async function createPostWithMedia(data: CreatePostData) {
  const supabase = await createClient();
  
  try {
    // 1. Create media record
    const { data: mediaData, error: mediaError } = await supabase
      .from('medias')
      .insert({
        media_type: data.mediaType,
        media_url: data.mediaUrl,
        media_public_id: data.mediaPublicId,
        title: data.title,
        duration: data.duration,
        user_id: data.userId
      })
      .select()
      .single();
      
    if (mediaError) throw mediaError;
    
    // 2. Create post record
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        content: data.content,
        user_id: data.userId
      })
      .select()
      .single();
      
    if (postError) throw postError;
    
    // 3. Link post and media
    const { error: linkError } = await supabase
      .from('posts_medias')
      .insert({
        post_id: postData.id,
        media_id: mediaData.id,
        position: 1 // First position since it's a new post
      });
      
    if (linkError) throw linkError;
    
    // Revalidate the feed page to show the new post
    revalidatePath('/feed');
    
    return { success: true, postId: postData.id };
  } catch (error) {
    console.error('Error creating post with media:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

export async function deletePost(postId: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // 1. Get post to verify ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    // Verify ownership
    if (post.user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only delete your own posts' };
    }
    
    // 2. Get associated media
    const { data: postMedia, error: mediaError } = await supabase
      .from('posts_medias')
      .select('media_id')
      .eq('post_id', postId);
      
    if (mediaError) throw mediaError;
    
    // 3. Delete post (this will cascade delete posts_medias entries due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
      
    if (deleteError) throw deleteError;
    
    // 4. Delete media records
    if (postMedia && postMedia.length > 0) {
      const mediaIds = postMedia.map(pm => pm.media_id);
      
      const { error: deleteMediaError } = await supabase
        .from('medias')
        .delete()
        .in('id', mediaIds);
        
      if (deleteMediaError) throw deleteMediaError;
      
      // Note: In a production app, you might want to also delete the files from Cloudinary
      // This would require a server-side Cloudinary integration
    }
    
    // Revalidate the feed page
    revalidatePath('/feed');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error: 'Failed to delete post' };
  }
}

export async function updatePostContent(postId: string, content: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // 1. Get post to verify ownership
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    // Verify ownership
    if (post.user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only edit your own posts' };
    }
    
    // 2. Update post content
    const { error: updateError } = await supabase
      .from('posts')
      .update({ content: content.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', postId);
      
    if (updateError) throw updateError;
    
    // Revalidate the feed page
    revalidatePath('/feed');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating post:', error);
    return { success: false, error: 'Failed to update post' };
  }
}

export async function updateMediaTitle(mediaId: string, title: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // 1. Get media to verify ownership
    const { data: media, error: mediaError } = await supabase
      .from('medias')
      .select('id, user_id')
      .eq('id', mediaId)
      .single();
      
    if (mediaError) throw mediaError;
    
    // Verify ownership
    if (media.user_id !== userId) {
      return { success: false, error: 'Unauthorized: You can only edit your own media' };
    }
    
    // 2. Update media title
    const { error: updateError } = await supabase
      .from('medias')
      .update({ title: title.trim() })
      .eq('id', mediaId);
      
    if (updateError) throw updateError;
    
    // Revalidate the feed page
    revalidatePath('/feed');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating media title:', error);
    return { success: false, error: 'Failed to update media title' };
  }
}