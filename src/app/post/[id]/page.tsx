import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedPost from '@/components/feed/FeedPost'
import AnonymousNavbar from '@/components/navigation/AnonymousNavbar'
import Navbar from '@/components/Navbar'
import type { ExtendedPost } from '@/types/database'

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    ref?: string;
  }>;
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
  const post = postsData?.find((p: ExtendedPost) => p.id === id);
  
  if (!post) {
    return null;
  }

  return post;
}

async function getUserPosts(userId: string, excludePostId: string) {
  const supabase = await createClient();
  
  // Get current user for interactions
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // Get all posts from this user
  const { data: postsData, error } = await supabase
    .rpc('get_posts', {
      p_current_user_id: currentUserId || null,
      p_profile_id: userId,
      p_post_type: 'feed',
      p_liked_only: false,
      p_media_type: null,
      p_search_term: null,
      p_page: 1,
      p_limit: 20 // Limit to 20 other posts
    });

  if (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }

  // Filter out the current post
  return postsData?.filter((p: ExtendedPost) => p.id !== excludePostId) || [];
}

export default async function PostPage({ params, searchParams }: PostPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const post = await getPost(resolvedParams.id);

  if (!post) {
    notFound();
  }

  // Get user for referral processing and navbar display
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get other posts from the same user
  const otherPosts = await getUserPosts(post.user_id, post.id);

  // Process referral code if present
  if (resolvedSearchParams.ref) {
    console.log('🔗 Processing referral code:', resolvedSearchParams.ref);
    console.log('👤 Visitor user ID:', user?.id);
    
    // Process the referral visit (this will award points to the sharer)
    const { processReferralVisit } = await import('@/actions/sharing/referral');
    const result = await processReferralVisit(resolvedSearchParams.ref, user?.id);
    
    console.log('📊 Referral result:', result);
    
    if (result.success) {
      console.log('✅ Referral processed:', result.message);
    } else {
      console.log('❌ Referral failed:', result.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar conditionnel */}
      {user ? (
        <Navbar />
      ) : (
        <div className="sticky top-0 z-50">
          <AnonymousNavbar />
        </div>
      )}
      
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {post.title || 'Publication'}
          </h1>
        </div>
        
        {/* Post principal */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <FeedPost 
            post={post}
            showFullContent={true}
          />
        </div>

        {/* Autres posts de l'utilisateur */}
        {otherPosts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Autres publications de {post.stage_name || post.profiles?.stage_name}
              </h2>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            
            <div className="space-y-4">
              {otherPosts.map((otherPost: ExtendedPost) => (
                <div key={otherPost.id} className="bg-white rounded-lg shadow-sm">
                  <FeedPost 
                    post={otherPost}
                    showFullContent={false}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await getPost(resolvedParams.id);
  
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
