'use server'

import { createClient } from '@/lib/supabase/server'


/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string) {
  const supabase = await createClient()

  try {
    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking follow status:', checkError)
      return { error: 'Failed to check follow status' }
    }

    // If already following, return early
    if (existingFollow) {
      return { success: true, message: 'Already following this user' }
    }

    // Create new follow relationship
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) {
      console.error('Error following user:', error)
      return { error: 'Failed to follow user' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in followUser:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error)
      return { error: 'Failed to unfollow user' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in unfollowUser:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get followers count for a user
 */
export async function getFollowersCount(profileId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileId);

    if (error) {
      console.error('Error getting followers count:', error)
      return { error: 'Failed to get followers count' }
    }

    return { count }
  } catch (error) {
    console.error('Error in getFollowersCount:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(profileId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId);

    if (error) {
      console.error('Error getting following count:', error)
      return { error: 'Failed to get following count' }
    }

    return { count }
  } catch (error) {
    console.error('Error in getFollowingCount:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Check if a user is following another user
 */
export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      console.error('Error checking follow status:', error)
      return { error: 'Failed to check follow status' }
    }

    return { isFollowing: !!data }
  } catch (error) {
    console.error('Error in isFollowing:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get users that a specific user is following (with pagination)
 */
export async function getFollowedUsers(userId: string, page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  try {
    // Get the users that the specified user is following
    const { data: follows, error, count } = await supabase
      .from('follows')
      .select('following_id', { count: 'exact' })
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting followed users:', error)
      return { error: 'Failed to get followed users' }
    }

    if (!follows || follows.length === 0) {
      return { 
        users: [], 
        pagination: {
          total: 0,
          page,
          limit,
          hasMore: false
        }
      }
    }

    // Get the profile details for each followed user
    const followingIds = follows.map(follow => follow.following_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, stage_name, avatar_url, bio, talents, musical_interests')
      .in('id', followingIds);

    if (profilesError) {
      console.error('Error getting followed profiles:', profilesError)
      return { error: 'Failed to get followed profiles' }
    }

    const profilesFinal = profiles.map(profile => ({
      ...profile,
      is_followed: true
    }));

    return { 
      users: profilesFinal || [], 
      pagination: {
        total: count || 0,
        page,
        limit,
        hasMore: count ? offset + limit < count : false
      }
    }
  } catch (error) {
    console.error('Error in getFollowedUsers:', error)
    return { error: 'An unexpected error occurred' }
  }
}
