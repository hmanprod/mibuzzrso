'use client';

import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { Music, Video } from 'lucide-react';

interface CreatePostBlockProps {
  onOpen: () => void;
}

export default function CreatePostBlock({ onOpen }: CreatePostBlockProps) {
  const { profile } = useAuth();

  return (
    <div className="bg-white rounded-[18px] shadow-sm p-4 space-y-4">
      {/* Zone de saisie */}
      <div className="flex items-center gap-3">
        <Avatar
          src={profile?.avatar_url || null}
          stageName={profile?.stage_name}
          size={40}
          className="rounded-full"
        />
        
        <button
          onClick={onOpen}
          className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
        >
          Quoi de neuf ?
        </button>
      </div>

      {/* Séparateur */}
      <div className="h-[1px] bg-gray-100" />

      {/* Options de publication */}
      <div className="flex items-center gap-4 mt-4">
        {/* <button
          onClick={onOpen}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Image</span>
        </button> */}

        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Music className="w-5 h-5" />
          <span>Audio</span>
        </button>

        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
        >
          <Video className="w-5 h-5" />
          <span>Vidéo</span>
        </button>
      </div>
    </div>
  );
}
