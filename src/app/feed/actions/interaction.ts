'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { addPointsForLike } from '@/app/points/actions'

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

    // console.log("the comments data", commentsData);

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
        parent_comment_id: comment.parent_comment_id,
        author: {
          id: profile.id || comment.user_id,
          stage_name: profile.stage_name || '',
          avatar_url: profile.avatar_url,
          username: profile.email || 'User',
          pseudo_url: profile.pseudo_url || 'User'
        }
      }
    })

    return { comments: transformedComments }
  } catch (error) {
    console.error('Error in getCommentsByMediaId:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function addComment(mediaId: string, content: string, playerTime?: number, parentCommentId?: string, postId?: string) {
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
        media_id: mediaId,
        parent_comment_id: parentCommentId || null
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
        post_id: postId,
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

export async function likeComment(commentId: string, postId: string) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if the user has already liked this comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .eq('type', 'comment_like')
      .maybeSingle()

    if (likeCheckError) {
      console.error('Error checking existing like:', likeCheckError)
      return { error: 'Failed to check existing like' }
    }

    // If the user has already liked this comment, remove the like
    if (existingLike) {
      const { error: unlikeError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id)

      if (unlikeError) {
        console.error('Error removing like:', unlikeError)
        return { error: 'Failed to unlike comment' }
      }

      return { success: true, liked: false }
    }

    // Otherwise, add a new like
    const { error: likeError } = await supabase
      .from('interactions')
      .insert({
        type: 'comment_like',
        user_id: user.id,
        comment_id: commentId,
        post_id: postId
      })

    if (likeError) {
      console.error('Error adding like:', likeError)
      return { error: 'Failed to like comment' }
    }

    return { success: true, liked: true }
  } catch (error) {
    console.error('Error in likeComment:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getCommentLikes(commentId: string) {
  const supabase = await createClient()

  try {
    // Get the current user to check if they've liked the comment
    const { data: { user } } = await supabase.auth.getUser()
    
    // Count total likes for this comment
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('type', 'comment_like')

    if (countError) {
      console.error('Error counting likes:', countError)
      return { error: 'Failed to count likes' }
    }

    // Check if the current user has liked this comment
    let isLiked = false
    if (user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from('interactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('type', 'comment_like')
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
    console.error('Error in getCommentLikes:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function togglePostLike(postId: string) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if the user has already liked this post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('interactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError)
      return { error: 'Failed to check existing like' }
    }

    let liked: boolean = false

    if (existingLike) {
      // If the user has already liked this post, remove the like
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return { error: 'Failed to unlike post' }
      }

      liked = false
    } else {
      // Otherwise, add a new like
      const { error: insertError } = await supabase
        .from('interactions')
        .insert({
          post_id: postId,
          user_id: user.id,
          type: 'like'
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return { error: 'Failed to like post' }
      }

      // Récupérer le media_id du post pour ajouter les points
      const { data: postData, error: postError } = await supabase
        .from('posts_medias')
        .select('media_id')
        .eq('post_id', postId)
        .single()

      if (!postError && postData?.media_id) {
        // console.log("awaiting likes");
        
        await addPointsForLike(postData.media_id)
      }

      liked = true
    }

    // Count total likes for this post
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
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
    console.error('Error in togglePostLike:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function markMediaAsRead(mediaId: string, postId: string) {
  const supabase = await createClient()

  try {
    // Validate mediaId
    if (!mediaId) {
      console.error('Invalid media ID provided')
      return { error: 'Invalid media ID' }
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Authentication required' }
    }

    // Always add a new read interaction
    const { error: insertError } = await supabase
      .from('interactions')
      .insert({
        user_id: user.id,
        media_id: mediaId,
        post_id: postId,
        type: 'read'
      })

    if (insertError) {
      console.error('Error marking media as read:', insertError)
      return { error: 'Failed to mark media as read' }
    }

    return { error: null, success: true }
  } catch (error) {
    console.error('Error in markMediaAsRead:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getMediaReadsCount(mediaId: string) {
  const supabase = await createClient()

  try {
    // Validate mediaId
    if (!mediaId) {
      console.error('Invalid media ID provided')
      return { error: 'Invalid media ID', count: 0 }
    }

    // Count the number of read interactions for this media
    const { count, error } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId)
      .eq('type', 'read')

    if (error) {
      console.error('Error counting reads:', error)
      return { error: 'Failed to count reads', count: 0 }
    }

    return { error: null, count: count || 0 }
  } catch (error) {
    console.error('Error in getMediaReadsCount:', error)
    return { error: 'An unexpected error occurred', count: 0 }
  }
}
