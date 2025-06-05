'use server'

import { createClient } from '@/lib/supabase/server'
import { addPointsForLike } from '@/actions/pointss/actions'
import type { Profile } from '@/types/database'

export type Comment = {
  id: string
  content: string
  timestamp: number
  created_at: string
  author: {
    id: string
    stage_name: string
    avatar_url: string | null
    username: string
  }
}

export async function toggleMediaLike(mediaId: string) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if the user has already liked this media
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('interactions')
      .select('*')
      .eq('media_id', mediaId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError)
      return { error: 'Failed to check existing like' }
    }

    let liked: boolean = false

    if (existingLike) {
      // If the user has already liked this media, remove the like
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return { error: 'Failed to unlike media' }
      }

      liked = false
    } else {
      // Otherwise, add a new like
      const { error: insertError } = await supabase
        .from('interactions')
        .insert({
          media_id: mediaId,
          user_id: user.id,
          type: 'like'
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return { error: 'Failed to like media' }
      }

      // Ajouter les points pour le like
      await addPointsForLike(mediaId)

      liked = true
    }

    // Count total likes for this media
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId)
      .eq('type', 'like')

    if (countError) {
      console.error('Error counting likes:', countError)
      return { error: 'Failed to count likes' }
    }

    return { 
      success: true, 
      liked: liked as boolean,
      likesCount: count || 0
    }
  } catch (error) {
    console.error('Error in toggleMediaLike:', error)
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
    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .insert({
        content,
        player_time: playerTime,
        user_id: user.id,
        media_id: mediaId
      })
      .select('id')
      .single()

    if (commentError || !commentData) {
      console.error('Error adding comment:', commentError)
      return { error: 'Failed to add comment' }
    }

    // Add an interaction of type 'comment'
    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        type: 'comment',
        user_id: user.id,
        media_id: mediaId
      })

    if (interactionError) {
      console.error('Error adding comment interaction:', interactionError)
      // We don't return an error here as the comment was successfully created
    }

    return { success: true, data: commentData }
  } catch (error) {
    console.error('Error in addComment:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getMediaLikes(mediaId: string) {
  const supabase = await createClient()

  try {
    // Get the current user to check if they've liked the media
    const { data: { user } } = await supabase.auth.getUser()
    
    // Count total likes for this media
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId)
      .eq('type', 'like')

    if (countError) {
      console.error('Error counting likes:', countError)
      return { error: 'Failed to count likes' }
    }

    // Check if the current user has liked this media
    let isLiked = false
    if (user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from('interactions')
        .select('*')
        .eq('media_id', mediaId)
        .eq('user_id', user.id)
        .eq('type', 'like')
        .maybeSingle()

      if (!userLikeError && userLike) {
        isLiked = true
      }
    }

    return { 
      count: count || 0, 
      isLiked 
    }
  } catch (error) {
    console.error('Error in getMediaLikes:', error)
    return { error: 'An unexpected error occurred' }
  }
}
