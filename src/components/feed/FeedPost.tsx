'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

interface Author {
  id: string;
  name: string;
  image: string;
  username: string;
}

interface Comment {
  id: string;
  timestamp: number;
  content: string;
  author: Author;
  position?: { x: number; y: number };
}

interface FeedPostProps {
  id: string;
  author: Author;
  title: string;
  description?: string;
  type: 'audio' | 'video';
  mediaUrl: string;
  waveformData?: number[];
  comments: Comment[];
  likes: number;
  createdAt: string;
  isLiked: boolean;
}

export default function FeedPost({
  id,
  author,
  title,
  description,
  type,
  mediaUrl,
  waveformData,
  comments,
  likes,
  createdAt,
  isLiked,
}: FeedPostProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = () => {
    // TODO: Implémenter l'API pour liker
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleShare = () => {
    // TODO: Implémenter le partage
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <article className="bg-white rounded-[18px] shadow-sm overflow-hidden">
      {/* En-tête du post */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={author.image}
            alt={author.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="font-medium text-[#2D2D2D]">{author.name}</h3>
            <p className="text-sm text-gray-500">@{author.username}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Titre et description */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">{title}</h2>
        {description && (
          <p className="mt-1 text-gray-600">{description}</p>
        )}
      </div>

      {/* Lecteur média */}
      {type === 'audio' && waveformData ? (
        <AudioPlayer
          audioUrl={mediaUrl}
          waveformData={waveformData}
          comments={comments}
        />
      ) : (
        <VideoPlayer
          videoUrl={mediaUrl}
          comments={comments}
        />
      )}

      {/* Actions */}
      <div className="p-4 flex items-center gap-6 border-t border-gray-100">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 ${liked ? 'text-red-500' : 'text-gray-600'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-gray-600"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{comments.length}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-gray-600"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <span className="ml-auto text-sm text-gray-500">
          {new Date(createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Zone de commentaires */}
      {showComments && (
        <div className="border-t border-gray-100 p-4">
          {/* Formulaire de commentaire */}
          <form className="flex gap-3 mb-4">
            <img
              src="/placeholder-user.jpg" // TODO: Utiliser l'image de l'utilisateur connecté
              alt="Your avatar"
              className="w-8 h-8 rounded-full"
            />
            <input
              type="text"
              placeholder="Ajouter un commentaire..."
              className="flex-1 h-10 px-4 rounded-[18px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#FA4D4D] focus:ring-1 focus:ring-[#FA4D4D]"
            />
          </form>

          {/* Liste des commentaires */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img
                  src={comment.author.image}
                  alt={comment.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      à {Math.floor(comment.timestamp / 60)}:
                      {String(Math.floor(comment.timestamp % 60)).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
