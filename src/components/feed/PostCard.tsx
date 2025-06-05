'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deletePost } from '@/actions/posts/post';

interface Post {
  id: string;
  title: string;
  content: string;
  type: 'post' | 'feedback';
  user_id: string;
  created_at: string;
  profile: {
    id: string;
    stage_name: string;
    avatar_url: string | null;
  };
}

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useSession();
  const [isLiked] = useState(false);
  const [likesCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLike = () => {
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de like sera disponible prochainement",
    });
  };

  const handleShare = () => {
    toast({
      title: "Bientôt disponible",
      description: "La fonctionnalité de partage sera disponible prochainement",
    });
  };

  const handleDelete = async () => {
    if (!user?.id || user.id !== post.user_id) return;

    if (!post.id || !user.id) return;

    try {
      setIsDeleting(true);
      const result = await deletePost(post.id, user.id);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Succès",
        description: "Le post a été supprimé",
      });

      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le post",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.profile.stage_name || ''}`}>
            <Avatar
              src={post.profile.avatar_url}
              stageName={post.profile.stage_name[0]}
              size={40}
            />
          </Link>
          <div>
            <h3 className="font-semibold text-[#2D2D2D]">
              {post.profile.stage_name}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {user?.id === post.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-900"
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Supprimer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D] mb-2">
          {post.title}
        </h2>
        {post.content && (
          <p className="text-gray-600 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>



      {/* Actions */}
      <div className="flex items-center gap-6 px-4 pb-4">
        <button 
          className="flex items-center gap-2"
          onClick={handleLike}
        >
          <Flame 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked ? "fill-orange-500 stroke-orange-500" : "stroke-gray-500 hover:stroke-gray-700"
            )}
          />
          <span className="text-gray-500">{likesCount}</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
          <span>0</span>
        </button>
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>
    </article>
  );
}
