'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, Post, Media } from '@/types/database'

interface PostMedia {
  media: Media
}

interface ExtendedPost extends Post {
  profile: Profile
  media: Media[]
  likes: number
  is_liked: boolean
}

/**
 * Get a user profile by ID
 */
export async function getUserProfile(profileId: string) {
  const supabase = await createClient()

  try {
    // Get the profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error)
      return { error: 'Failed to load profile' }
    }

    // First get all media IDs for this user
    const { data: mediaData, error: mediaError } = await supabase
      .from('medias')
      .select('id')
      .eq('user_id', profileId)

    if (mediaError) {
      console.error('Error fetching user media:', mediaError)
      return { 
        profile: data,
        totalReads: 0
      }
    }

    // If user has no media, return 0 reads
    if (!mediaData || mediaData.length === 0) {
      return { 
        profile: data,
        totalReads: 0
      }
    }

    // Extract the media IDs
    const mediaIds = mediaData.map(media => media.id)

    // Get the total read count for all media associated with this user
    const { count: totalReads, error: readsError } = await supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'read')
      .in('media_id', mediaIds)

    if (readsError) {
      console.error('Error fetching read count:', readsError)
      // Continue with profile data even if read count fails
      return { 
        profile: data,
        totalReads: 0
      }
    }

    return { 
      profile: data,
      totalReads: totalReads || 0
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get posts for a specific profile, optionally filtered by media type
 */
export async function getProfilePosts(profileId: string, mediaType: 'audio' | 'video' | 'all' = 'all') {
  const supabase = await createClient()

  try {
    const query = supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(*),
        media:posts_medias(
          media:medias(*)
        )
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    // If a specific media type is requested, filter by it
    if (mediaType !== 'all') {
      // We need to filter posts that have at least one media of the specified type
      // This is a bit complex with Supabase, so we'll fetch all and filter in JS
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching profile posts:', postsError)
      return { error: 'Failed to load posts' }
    }

    if (!postsData) {
      return { posts: [] }
    }

    // Transform the data to match our ExtendedPost interface
    let transformedPosts: ExtendedPost[] = postsData.map(post => ({
      ...post,
      profile: post.profile || null,
      media: post.media?.map((pm: PostMedia) => pm.media) || [],
      likes: 0,
      is_liked: false
    }));

    // If filtering by media type, do it here
    if (mediaType !== 'all') {
      transformedPosts = transformedPosts.filter(post => 
        post.media.some(media => media.media_type === mediaType)
      );
    }

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getProfilePosts:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update a user profile
 */
export async function updateUserProfile(profileId: string, profileData: Partial<Profile>) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', profileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error)
      return { error: 'Failed to update profile' }
    }

    return { profile: data }
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return { error: 'An unexpected error occurred' }
  }
}

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
