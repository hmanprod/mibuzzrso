'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { revalidatePath } from 'next/cache';


interface AddCommentArgs {
  challengeId?: string;
  mediaId?: string;
  content: string;
  parentCommentId?: string;
  playbackTime?: number;
  postId?: string; 
}

export async function addComment({
  challengeId,
  mediaId,
  content,
  parentCommentId,
  playbackTime,
  postId,
}: AddCommentArgs) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated', data: null };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      challenge_id: challengeId,
      media_id: mediaId,
      content,
      user_id: user.id,
      parent_comment_id: parentCommentId,
      player_time: playbackTime,
      post_id: postId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return { error: 'Failed to add comment', data: null };
  }
  
  if (challengeId) {
    revalidatePath(`/feed/challenge/${challengeId}`);
  }

  return { error: null, data };
}


export async function addPointsForComment(commentId: string) {
  const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'User not authenticated' };
  }

  const { error } = await supabase.rpc('add_points_for_comment', {
    p_comment_id: commentId,
    p_user_id: user.id
  });

  if (error) {
    console.error('Error adding points for comment:', error);
    return { error: 'Failed to add points for comment' };
  }

  return { error: null };
}


export async function getFeedbackComments(feedbackId: string) {
  const supabase = await createClient()

  try {
    // First, get the comments for this feedback
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', feedbackId)
      .is('parent_comment_id', null) // Get only top-level comments
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('Error fetching feedback comments:', commentsError)
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
        created_at: comment.created_at,
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
    console.error('Error in getFeedbackComments:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function addFeedbackComment(feedbackId: string, content: string) {
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
        user_id: user.id,
        post_id: feedbackId,  // Use post_id instead of parent_comment_id
        media_id: null,       // Explicitly set media_id to null for feedback comments
        parent_comment_id: null // No parent comment since this is a top-level comment
      })
      .select('id')
      .single()

    if (commentError || !commentData) {
      console.error('Error adding feedback comment:', commentError)
      return { error: 'Failed to add comment' }
    }

    // Add an interaction of type 'comment'
    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        type: 'comment',
        user_id: user.id,
        post_id: feedbackId
      })

    if (interactionError) {
      console.error('Error adding comment interaction:', interactionError)
      // We don't return an error here as the comment was successfully created
    }

    return { success: true, data: commentData }
  } catch (error) {
    console.error('Error in addFeedbackComment:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function likeFeedbackComment(commentId: string, feedbackId: string) {
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
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError)
      return { error: 'Failed to check existing like' }
    }

    let liked: boolean = false

    if (existingLike) {
      // If the user has already liked this comment, remove the like
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return { error: 'Failed to unlike comment' }
      }

      liked = false
    } else {
      // Otherwise, add a new like
      const { error: insertError } = await supabase
        .from('interactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          post_id: feedbackId,
          type: 'like'
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return { error: 'Failed to like comment' }
      }

      liked = true
    }

    return { success: true, liked }
  } catch (error) {
    console.error('Error in likeFeedbackComment:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getFeedbackCommentLikes(commentId: string) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    // Get the count of likes for this comment
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId)
      .eq('type', 'like')

    if (countError) {
      console.error('Error getting comment likes count:', countError)
      return { error: 'Failed to get likes count' }
    }

    // Check if the current user has liked this comment
    let isLiked = false
    if (user) {
      const { data: likeData, error: likeError } = await supabase
        .from('interactions')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('type', 'like')
        .single()

      if (!likeError && likeData) {
        isLiked = true
      }
    }

    return { 
      count: count || 0, 
      isLiked 
    }
  } catch (error) {
    console.error('Error in getFeedbackCommentLikes:', error)
    return { error: 'An unexpected error occurred' }
  }
}
