'use server'

import { createClient } from '@/lib/supabase/server'
import type { Post, Media, Profile } from '@/types/database'

interface PostMedia {
  media: Media
}

interface ExtendedPost extends Post {
  profile: Profile
  media: Media[]
  likes: number
  is_liked: boolean
}

export async function getPosts() {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(*),
        media:posts_medias(
          media:medias(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return { error: 'Failed to load posts' }
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

        if (!userLikeError && userLike) {
          isLiked = true
        }
      }

      return {
        ...post,
        profile: post.profile || null,
        media: post.media?.map((pm: PostMedia) => pm.media) || [],
        likes: likesCount || 0,
        is_liked: isLiked
      }
    }))

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getPosts:', error)
    return { error: 'An unexpected error occurred' }
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
          profile:profiles(*),
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
          profile:profiles(*),
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

        if (!userLikeError && userLike) {
          isLiked = true
        }
      }

      return {
        ...post,
        profile: post.profile || null,
        media: post.media?.map((pm: PostMedia) => pm.media) || [],
        likes: likesCount || 0,
        is_liked: isLiked
      }
    }))

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getProfilePosts:', error)
    return { error: 'An unexpected error occurred' }
  }
}