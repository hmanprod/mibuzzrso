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
  const content = formData.get('content') as string
  const mediaFiles = formData.getAll('media') as File[]

  try {
    // First, create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([{ content }])
      .select()
      .single()

    if (postError) {
      return { error: 'Failed to create post' }
    }

    if (mediaFiles.length > 0) {
      // Handle media upload and linking to post
      const mediaUploads = await Promise.all(
        mediaFiles.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('media')
            .upload(`posts/${post.id}/${file.name}`, file)

          if (error) {
            throw error
          }

          return data.path
        })
      )

      // Create media records and link them to the post
      const { error: mediaError } = await supabase.from('posts_medias').insert(
        mediaUploads.map(path => ({
          post_id: post.id,
          media_id: path
        }))
      )

      if (mediaError) {
        return { error: 'Failed to upload media' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createPost:', error)
    return { error: 'An unexpected error occurred' }
  }
}
