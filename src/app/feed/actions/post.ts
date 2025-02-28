'use server'

import { createClient } from '@/lib/supabase/server'
import type { Post, Media, Profile } from '@/types/database'

interface ExtendedPost extends Post {
  profile: Profile
  media: Media[]
  likes: number
  is_liked: boolean
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
          is_liked: isLiked
        };
      })
    );

    return { posts: transformedPosts, pagination: { page, limit, total: totalPosts } };
  } catch (error) {
    console.error('Error in getPosts:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function getProfilePosts(profileId: string, mediaType: 'audio' | 'video' | 'all' = 'all') {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    let postsData;
    let postsError;

    if (mediaType === 'all') {
      const result = await supabase
        .from('posts')
        .select(`
          *,
          users!user_id(
            profiles(*)
          ),
          media:posts_medias(
            media:medias(*)
          )
        `)
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });
      
      postsData = result.data;
      postsError = result.error;
    } else {
      const result = await supabase
        .from('posts')
        .select(`
          *,
          users!user_id(
            profiles(*)
          ),
          media:posts_medias(
            media:medias(*)
          )
        `)
        .eq('user_id', profileId)
        .eq('media.media.media_type', mediaType)
        .order('created_at', { ascending: false });
      
      postsData = result.data;
      postsError = result.error;
    }

    if (postsError) {
      console.error('Error fetching profile posts:', postsError)
      return { error: 'Failed to load profile posts' }
    }

    if (!postsData) {
      return { posts: [] }
    }

    // Transform the data to match our ExtendedPost interface
    const transformedPosts: ExtendedPost[] = await Promise.all(postsData.map(async post => {
      // Get like count for this post
      const { count: likesCount, error: likesError } = await supabase
        .from('interactions')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('type', 'like')

      if (likesError) {
        console.error('Error counting likes for post', post.id, ':', likesError)
      }

      // Check if the current user has liked this post
      let isLiked = false
      if (userId) {
        const { data: userLike, error: userLikeError } = await supabase
          .from('interactions')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .eq('type', 'like')
          .single()

        if (!userLikeError) {
          isLiked = !!userLike
        }
      }

      // Return the transformed post with all required fields
      return {
        ...post, // This spreads all Post fields (id, created_at, updated_at, content, user_id)
        profile: post.profiles,
        media: (post.media as { media: Media[] }[] | undefined)
          ?.reduce((acc: Media[], item) => [...acc, ...item.media], [] as Media[])
          || [],
        likes: likesCount || 0,
        is_liked: isLiked
      };
    }))

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getProfilePosts:', error)
    return { error: 'An unexpected error occurred' }
  }
}