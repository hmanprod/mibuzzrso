import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FeedPost from '@/components/feed/FeedPost';

interface PostPageProps {
  params: {
    id: string;
  };
}

async function getPost(id: string) {
  const supabase = await createClient();
  
  // Get current user for interactions
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Use the same RPC function as the feed
  const { data: postsData, error } = await supabase
    .rpc('get_posts', {
      p_current_user_id: userId || null,
      p_profile_id: null,
      p_post_type: 'feed',
      p_liked_only: false,
      p_media_type: null,
      p_search_term: null,
      p_page: 1,
      p_limit: 1000 // Large limit to get all posts, then filter by ID
    });

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }

  // Find the specific post by ID
  const post = postsData?.find((p: any) => p.id === id);
  
  if (!post) {
    return null;
  }

  return post;
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {post.title || 'Publication'}
          </h1>
          <p className="text-gray-600">
            Partagé par @{post.profiles?.username}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <FeedPost 
            post={post}
            showFullContent={true}
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PostPageProps) {
  const post = await getPost(params.id);
  
  if (!post) {
    return {
      title: 'Post non trouvé - MiBuzz',
    };
  }

  return {
    title: `${post.title || 'Publication'} - MiBuzz`,
    description: post.description || `Découvrez cette création de @${post.profiles?.username} sur MiBuzz`,
    openGraph: {
      title: `${post.title || 'Publication'} - MiBuzz`,
      description: post.description || `Découvrez cette création de @${post.profiles?.username} sur MiBuzz`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title || 'Publication'} - MiBuzz`,
      description: post.description || `Découvrez cette création de @${post.profiles?.username} sur MiBuzz`,
    },
  };
}
