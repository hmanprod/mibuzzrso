'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Post, Media, Profile } from '@/types/database'

interface ExtendedPost extends Post {
  profile: Profile
  media: Media[]
  likes: number
  is_liked: boolean,
  is_followed: boolean
}

interface CreatePostData {
  mediaType: 'audio' | 'video';
  mediaUrl: string;
  mediaPublicId: string;
  title: string;
  duration: number | null;
  content: string | null;
  userId: string;
}

export async function getPosts(page: number = 1, limit: number = 5) {
  const supabase = await createClient();

  try {
    // Récupération de l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Calcul de l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupération des posts avec profils et médias
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles!user_id(*),
        media:posts_medias(
          media:medias(*)
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return { error: 'Failed to load posts' };
    }
    if (!postsData) {
      return { posts: [] };
    }

    // Afficher dans la console les posts sans profil
    const postsSansProfil = postsData.filter(post => !post.profiles || post.profiles.length === 0);
    if (postsSansProfil.length > 0) {
      console.warn('Posts sans profil:', postsSansProfil);
    }

    // Assurer l'unicité des posts par id
    const uniquePosts = Array.from(
      new Map(postsData.map(post => [post.id, post])).values()
    );

    // Récupération du nombre total de posts pour la pagination
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Transformation des posts pour correspondre à ExtendedPost
    const transformedPosts: ExtendedPost[] = await Promise.all(
      uniquePosts.map(async post => {
        // Comptage des likes pour ce post
        const { count: likesCount, error: likesError } = await supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('type', 'like');
        if (likesError) {
          console.error('Error counting likes for post', post.id, ':', likesError);
        }

        // Vérification si l'utilisateur a liké ce post
        let isLiked = false;
        if (userId) {
          const { data: userLike, error: userLikeError } = await supabase
            .from('interactions')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .eq('type', 'like')
            .single();
          if (!userLikeError) {
            isLiked = !!userLike;
          }
        }

        // Vérification si l'utilisateur a follow ce profil
        let isFollowed = false;
        if (userId) {
          const { data: userFollow, error: userFollowError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', userId)
            .eq('following_id', post.user_id)
            .single();
          if (!userFollowError) {
            isFollowed = !!userFollow;
          }
        }

        // On retire la propriété "profiles" en excès et on garde uniquement la première
        const { profiles, ...postWithoutProfiles } = post;

        const profileObj: Profile = Array.isArray(profiles) ? profiles[0] : profiles;

        return {
          ...postWithoutProfiles, // id, created_at, updated_at, content, user_id, etc.
          profile: profileObj,
          // Ici, on précise que post.media est un tableau d'objets de forme { media: Media[] } 
          media: ((post.media as { media: Media[] }[] | undefined)
                    ?.reduce((acc: Media[], item) => acc.concat(item.media), [] as Media[])
                  ) || [],
          likes: likesCount || 0,
          is_liked: isLiked,
          is_followed: isFollowed
        };
      })
    );

    return { posts: transformedPosts, pagination: { page, limit, total: totalPosts } };
  } catch (error) {
    console.error('Error in getPosts:', error);
    return { error: 'An unexpected error occurred' };
  }
} 

export async function getProfilePosts(profileId: string, mediaType: 'audio' | 'video' | 'all' = 'all', page: number = 1, limit: number = 5) {
  const supabase = await createClient()

  try {
    // Récupération de l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Calcul de l'offset pour la pagination
    const offset = (page - 1) * limit;

    let postsData;
    let postsError;

    // Récupération des posts avec profils et médias
    if (mediaType === 'all') {
      const result = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles!user_id(*),
        media:posts_medias(
          media:medias(*)
        )
      `)
      .eq('user_id', profileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

      postsData = result.data;
      postsError = result.error;

    }else{
      const result = await supabase
      .from('posts')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user_id,
        profiles!user_id(*),
        media:posts_medias(
          media:medias(*)
        )
      `)
      .eq('user_id', profileId)
      .eq('media.media_type', mediaType)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

      postsData = result.data;
      postsError = result.error;
    }

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return { error: 'Failed to load posts' };
    }
    if (!postsData) {
      return { posts: [] };
    }

    // Afficher dans la console les posts sans profil
    const postsSansProfil = postsData.filter(post => !post.profiles || post.profiles.length === 0);
    if (postsSansProfil.length > 0) {
      console.warn('Posts sans profil:', postsSansProfil);
    }

    // Assurer l'unicité des posts par id
    const uniquePosts = Array.from(
      new Map(postsData.map(post => [post.id, post])).values()
    );

    // Récupération du nombre total de posts pour la pagination
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    // Transformation des posts pour correspondre à ExtendedPost
    const transformedPosts: ExtendedPost[] = await Promise.all(
      uniquePosts.map(async post => {
        // Comptage des likes pour ce post
        const { count: likesCount, error: likesError } = await supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('type', 'like');
        if (likesError) {
          console.error('Error counting likes for post', post.id, ':', likesError);
        }

        // Vérification si l'utilisateur a liké ce post
        let isLiked = false;
        if (userId) {
          const { data: userLike, error: userLikeError } = await supabase
            .from('interactions')
            .select('*')
            .eq('post_id', post.id)
            .eq('user_id', userId)
            .eq('type', 'like')
            .single();
          if (!userLikeError) {
            isLiked = !!userLike;
          }
        }

        // Vérification si l'utilisateur a follow ce profil
        let isFollowed = false;
        if (userId) {
          const { data: userFollow, error: userFollowError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', userId)
            .eq('following_id', post.user_id)
            .single();
          if (!userFollowError) {
            isFollowed = !!userFollow;
          }
        }

        // On retire la propriété "profiles" en excès et on garde uniquement la première
        const { profiles, ...postWithoutProfiles } = post;

        const profileObj: Profile = Array.isArray(profiles) ? profiles[0] : profiles;

        return {
          ...postWithoutProfiles, // id, created_at, updated_at, content, user_id, etc.
          profile: profileObj,
          // Ici, on précise que post.media est un tableau d'objets de forme { media: Media[] } 
          media: ((post.media as { media: Media[] }[] | undefined)
                    ?.reduce((acc: Media[], item) => acc.concat(item.media), [] as Media[])
                  ) || [],
          likes: likesCount || 0,
          is_liked: isLiked,
          is_followed: isFollowed
        };
      })
    );

    return { posts: transformedPosts, pagination: { page, limit, total: totalPosts } };
  } catch (error) {
    console.error('Error in getPosts:', error);
    return { error: 'An unexpected error occurred' };
  }
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