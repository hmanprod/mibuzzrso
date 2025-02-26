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

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const mediaUrl = formData.get('mediaUrl') as string
  const mediaType = formData.get('mediaType') as 'audio' | 'video'

  try {
    // Create media entry
    const { data: mediaData, error: mediaError } = await supabase
      .from('medias')
      .insert({
        media_type: mediaType,
        media_url: mediaUrl,
        title: title.trim(),
        description: content.trim() || null,
      })
      .select('id')
      .single()

    if (mediaError) {
      console.error('Error creating media:', mediaError)
      return { error: 'Failed to create media entry' }
    }

    // Create post entry
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        content: content.trim() || null,
      })
      .select('id')
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return { error: 'Failed to create post' }
    }

    // Link post and media
    const { error: linkError } = await supabase
      .from('posts_medias')
      .insert({
        post_id: postData.id,
        media_id: mediaData.id,
        position: 1
      })

    if (linkError) {
      console.error('Error linking post and media:', linkError)
      return { error: 'Failed to link post and media' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createPost:', error)
    return { error: 'An unexpected error occurred' }
  }
}
