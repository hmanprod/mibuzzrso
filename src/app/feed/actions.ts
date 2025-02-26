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
