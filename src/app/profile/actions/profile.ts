'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile, Media, ExtendedPost } from '@/types/database'

interface PostMedia {
  media: Media
}

interface ExtendedProfile extends Profile {
  is_followed: boolean
}

/**
 * Get a user profile by ID
 */
export async function getUserProfile(profileId: string) {
  const supabase = await createClient()

  try {
    // Get the profile data with points
    const { data, error } = await supabase
      .from('profiles')
      .select('*, points')
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
      .select('*', { count: 'exact', head: true})
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
      is_liked: false,
      is_followed: false
    }));

    // If filtering by media type, do it here
    if (mediaType !== 'all') {
      transformedPosts = transformedPosts.filter(post => 
        post.medias.some(media => media.media_type === mediaType)
      );
    }

    return { posts: transformedPosts }
  } catch (error) {
    console.error('Error in getProfilePosts:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Update a user profile NOT USED
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
 * Get top 10 users with most interactions on the latest media of a specific type
 */
export async function getTopInteractingUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  try {
    // Using a raw SQL query to get top users with weighted interaction scores
    const { data: topUsers, error } = await supabase.rpc('get_top_interacting_users', {
      limit_count: 10
    })

    if (error) {
      console.error('Error fetching top interacting users:', error)
      return { data: null, error }
    }

    // Check if the current user is following each of the top users
    if (userId && topUsers.length > 0) {
      // Use Promise.all to wait for all async operations to complete
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) {
        console.error('Error fetching follow statuses:', error);
      } else {
        
        const followedIds = new Set(follows.map(f => f.following_id));

        topUsers.forEach((user: ExtendedProfile) => {
          // Use user_id instead of id since that's what the SQL function returns
          user.is_followed = followedIds.has(user.user_id);
        });
      }
    }

    return { data: topUsers, error: null }
  } catch (error) {
    console.error('Error in getTopInteractingUsers:', error)
    return { data: null, error }
  }
}
