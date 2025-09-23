'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addPointsForLike } from '@/actions/pointss/actions'

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

export async function addCommentChallenge(content: string, playerTime?: number, parentCommentId?: string, challengeId?: string) {
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
        parent_comment_id: parentCommentId || null,
        challenge_id: challengeId
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
        challenge_id: challengeId
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

    // console.log("existingLike", existingLike);
    // console.log("likeCheckError for post", likeCheckError);

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

/**
 * Record a share interaction for a post
 */
export async function recordShare(postId: string, mediaId?: string, shareType: string = 'link') {
  const supabase = await createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Insert share interaction
    const { error: insertError } = await supabase
      .from('interactions')
      .insert({
        post_id: postId,
        media_id: mediaId,
        user_id: user.id,
        type: 'share'
      })

    if (insertError) {
      console.error('Error recording share:', insertError)
      return { error: 'Failed to record share' }
    }

    // Add points for sharing
    await addPointsForShare(user.id)

    // Get updated share count
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('type', 'share')

    if (countError) {
      console.error('Error counting shares:', countError)
      return { error: 'Failed to count shares' }
    }

    return { 
      success: true, 
      message: 'Share recorded successfully',
      shareCount: count || 0,
      shareType
    }
  } catch (error) {
    console.error('Error in recordShare:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get share count for a post
 */
export async function getShareCount(postId: string): Promise<number> {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('type', 'share')

    if (error) {
      console.error('Error counting shares:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getShareCount:', error)
    return 0
  }
}

/**
 * Add points for sharing a post
 */
async function addPointsForShare(userId: string) {
  const supabase = await createClient()
  
  try {
    // Add 5 points for sharing using the correct function name
    const { error } = await supabase.rpc('add_user_points', {
      p_user_id: userId,
      p_points: 5,
      p_reason: 'Partage de post'
    })

    if (error) {
      console.error('Error adding points for share:', error)
    } else {
      console.log('Added 5 points for sharing post')
    }
  } catch (error) {
    console.error('Error in addPointsForShare:', error)
  }
}

// Helper function to get user's download limit based on points
async function getUserDownloadLimit(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('points')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return 1 // Default limit
  }

  const points = profile.points || 0
  
  // Logic: 1 download by default, 3 if 4+ points, 6 if 10+ points
  if (points >= 10) return 6
  if (points >= 4) return 3
  return 1
}

// Helper function to increment today's download count using PostgreSQL function
async function incrementTodayDownloadCount(supabase: SupabaseClient, userId: string): Promise<{ success: boolean, newCount: number }> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  console.log('Incrementing daily download count for user:', userId, 'date:', today)
  
  // First try to get existing record
  const { data: existing, error: fetchError } = await supabase
    .from('daily_downloads')
    .select('download_count')
    .eq('user_id', userId)
    .eq('download_date', today)
    .single()

  console.log('Existing record check:', { existing, fetchError })

  if (existing && !fetchError) {
    // Update existing record
    console.log('Found existing record, updating from', existing.download_count, 'to', existing.download_count + 1)
    const { data, error } = await supabase
      .from('daily_downloads')
      .update({ download_count: existing.download_count + 1 })
      .eq('user_id', userId)
      .eq('download_date', today)
      .select('download_count')
      .single()
    
    if (error) {
      console.error('Error updating daily download count:', error)
      return { success: false, newCount: 0 }
    }
    
    console.log('Successfully updated daily download count:', data)
    return { success: true, newCount: data.download_count }
  } else {
    // Insert new record (either no record found or error fetching)
    console.log('No existing record found, creating new one with count 1')
    const { data, error } = await supabase
      .from('daily_downloads')
      .insert({
        user_id: userId,
        download_date: today,
        download_count: 1
      })
      .select('download_count')
      .single()
    
    if (error) {
      console.error('Error inserting daily download count:', error)
      console.error('Insert error details:', JSON.stringify(error, null, 2))
      return { success: false, newCount: 0 }
    }
    
    console.log('Successfully inserted daily download record:', data)
    return { success: true, newCount: data.download_count }
  }
}

// Helper function to get today's download count (read-only)
async function getTodayDownloadCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const { data: dailyRecord, error } = await supabase
    .from('daily_downloads')
    .select('download_count')
    .eq('user_id', userId)
    .eq('download_date', today)
    .single()

  console.log("dailyRecord", dailyRecord);

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching daily downloads:', error)
    return 0
  }

  return dailyRecord ? dailyRecord.download_count : 0
}

export async function recordDownload(mediaId: string, postId: string) {
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if the user has already downloaded this specific media
    const { data: existingDownload, error: downloadCheckError } = await supabase
      .from('interactions')
      .select('*')
      .eq('post_id', postId)
      .eq('media_id', mediaId)
      .eq('user_id', user.id)
      .eq('type', 'download')
      .single()

    if (downloadCheckError && downloadCheckError.code !== 'PGRST116') {
      console.error('Error checking existing download:', downloadCheckError)
      return { error: 'Failed to check existing download' }
    }

    // If already downloaded this specific media, allow re-download without counting
    if (existingDownload) {
      return { success: true, message: 'Media already downloaded (no limit applied)' }
    }

    // Get user's download limit and today's count
    const [downloadLimit, todayCount] = await Promise.all([
      getUserDownloadLimit(supabase, user.id),
      getTodayDownloadCount(supabase, user.id)
    ])

    // Check if user has reached daily limit
    if (todayCount >= downloadLimit) {
      return { 
        error: 'Daily download limit reached', 
        limit: downloadLimit, 
        used: todayCount 
      }
    }

    // Record the download interaction
    const { error: insertError } = await supabase
      .from('interactions')
      .insert({
        post_id: postId,
        media_id: mediaId,
        user_id: user.id,
        type: 'download'
      })

    if (insertError) {
      console.error('Error recording download:', insertError)
      return { error: 'Failed to record download' }
    }

    // Increment daily download count using UPSERT
    const incrementResult = await incrementTodayDownloadCount(supabase, user.id)
    
    if (!incrementResult.success) {
      console.error('Failed to increment daily download count')
      // Don't fail the download for this, just log the error
    }

    return { 
      success: true, 
      message: 'Download recorded successfully',
      limit: downloadLimit,
      used: incrementResult.success ? incrementResult.newCount : todayCount + 1
    }

  } catch (error) {
    console.error('Error in recordDownload:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function toggleChallengeLike(challengeId: string) {
  // console.log("challengeId", challengeId);
  const supabase = await createClient()

  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { error: 'Authentication required' }
    }

    // Check if the user has already liked this challenge
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('interactions')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .eq('type', 'like')
      .single()

    // console.log("existingLike", existingLike);
    // console.log("likeCheckError", likeCheckError);

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError)
      return { error: 'Failed to check existing like' }
    }

    let liked: boolean = false

    if (existingLike) {
      // If the user has already liked this challenge, remove the like
      const { error: deleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return { error: 'Failed to unlike challenge' }
      }


      liked = false
    } else {
      // Otherwise, add a new like
      const { error: insertError } = await supabase
        .from('interactions')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          type: 'like'
        })

      

      if (insertError) {
        console.error('Error adding like:', insertError)
        return { error: 'Failed to like challenge' }
      }


      liked = true
    }

    // Count total likes for this challenge
    const { count, error: countError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId)
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
    console.error('Error in toggleChallengeLike:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function markMediaAsRead(mediaId: string, postId: string) {
  const supabase = await createClient()

  console.log("markMediaAsRead", mediaId);

  const postIdToInsert = postId || null;

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
        post_id: postIdToInsert,
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
