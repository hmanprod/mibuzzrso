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
    const transformedPosts: ExtendedPost[] = postsData.map(post => ({
      ...post,
      profile: post.profile || null,
      media: post.media?.map((pm: PostMedia) => pm.media) || [],
      likes: 0,
      is_liked: false
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
    const transformedPosts: ExtendedPost[] = postsData.map(post => ({
      ...post,
      profile: post.profile || null,
      media: post.media?.map((pm: PostMedia) => pm.media) || [],
      likes: 0,
      is_liked: false
    }))

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getProfilePosts:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCommentsByMediaId(mediaId: string) {
  const supabase = await createClient()

  try {
    // First, get the comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('media_id', mediaId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return { error: 'Failed to load comments' }
    }

    if (!commentsData || commentsData.length === 0) {
      return { comments: [] }
    }

    // Get all user IDs from comments
    const userIds = commentsData.map(comment => comment.user_id)

    // Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return { error: 'Failed to load user profiles' }
    }

    // Create a map of user_id to profile for easy lookup
    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {} as Record<string, Profile>)

    // Transform the data to match our comments interface
    const transformedComments = commentsData.map(comment => {
      const profile = profilesMap[comment.user_id] || {}
      
      return {
        id: comment.id,
        content: comment.content,
        timestamp: comment.player_time || 0,
        created_at: comment.created_at,
        author: {
          id: profile.id || comment.user_id,
          stage_name: profile.stage_name || '',
          avatar_url: profile.avatar_url,
          username: profile.email || 'User'
        }
      }
    })

    return { comments: transformedComments }
  } catch (error) {
    console.error('Error in getCommentsByMediaId:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function addComment(mediaId: string, content: string, playerTime?: number) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Add the comment
    const { error: commentError } = await supabase
      .from('comments')
      .insert({
        content,
        player_time: playerTime,
        user_id: user.id,
        media_id: mediaId
      })

    if (commentError) {
      console.error('Error adding comment:', commentError)
      return { error: 'Failed to add comment' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in addComment:', error)
    return { error: 'An unexpected error occurred' }
  }
}
